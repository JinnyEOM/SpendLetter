import https from 'https';

function httpsPost(url, headers, body) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify(body);
    const parsed = new URL(url);
    const req = https.request({
      hostname: parsed.hostname,
      path: parsed.pathname,
      method: 'POST',
      headers: { ...headers, 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(data) }
    }, (res) => {
      let raw = '';
      res.on('data', chunk => raw += chunk);
      res.on('end', () => resolve({ status: res.statusCode, body: raw }));
    });
    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  if (!process.env.ANTHROPIC_API_KEY) {
    return res.status(500).json({ error: 'ANTHROPIC_API_KEY가 설정되지 않았습니다.' });
  }

  const { transactions, month, year } = req.body || {};

  if (!Array.isArray(transactions) || !month || !year) {
    return res.status(400).json({ error: '필수 파라미터가 누락됐습니다. (transactions, month, year)' });
  }

  const totalExpense = transactions.reduce((s, t) => s + Number(t.amount), 0);
  const catMap = {};
  transactions.forEach(t => {
    catMap[t.category] = (catMap[t.category] || 0) + Number(t.amount);
  });
  const catSorted = Object.entries(catMap).sort((a, b) => b[1] - a[1]);
  const topCats = catSorted.slice(0, 3).map(([cat, amt]) => `${cat}: ${amt.toLocaleString()}원`).join(', ');

  const prompt = `다음은 ${year}년 ${month}월 소비 데이터입니다.
총 지출: ${totalExpense.toLocaleString()}원
거래 건수: ${transactions.length}건
카테고리별 지출 (상위 3개): ${topCats}

아래 JSON 형식으로만 응답하세요. 마크다운, 백틱, 설명 텍스트 없이 순수 JSON만 출력하세요.
이모지 사용 절대 금지. 한국어로 작성하세요.

제약 조건:
- pattern, trend, recommend 는 각각 1~2개 항목 배열
- 각 항목은 25자 이내, 핵심 수치(퍼센트·금액)를 앞에 배치
- headline, summary 는 각 1줄
- recommendedCategories는 아래 목록에서 3개 선택 (목록 외 텍스트 금지):
  경제·금융, IT·테크, 건강·운동, 문화·엔터, 스포츠, 사회·정치, 부동산, 음식·요리, 여행

{
  "headline": "6월은 식비 중심의 한 달이었어요",
  "summary": "전월 대비 6% 증가",
  "pattern": ["항목1 (25자 이내)", "항목2 (25자 이내)"],
  "trend": ["항목1 (25자 이내)", "항목2 (25자 이내)"],
  "recommend": ["항목1 (25자 이내)", "항목2 (25자 이내)"],
  "recommendedCategories": ["카테고리1", "카테고리2", "카테고리3"]
}`;

  try {
    const result = await httpsPost(
      'https://api.anthropic.com/v1/messages',
      { 'x-api-key': process.env.ANTHROPIC_API_KEY, 'anthropic-version': '2023-06-01' },
      { model: 'claude-haiku-4-5-20251001', max_tokens: 500, messages: [{ role: 'user', content: prompt }] }
    );

    if (result.status !== 200) {
      let message = `Anthropic API 오류 (${result.status})`;
      try { message = JSON.parse(result.body).error?.message || message; } catch (_) {}
      return res.status(result.status).json({ error: message });
    }

    const data = JSON.parse(result.body);
    const rawText = data.content?.[0]?.text ?? '';
    const jsonMatch = rawText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return res.status(500).json({ error: 'AI 응답에서 JSON을 추출할 수 없습니다.' });
    }
    const parsed = JSON.parse(jsonMatch[0]);
    const emojiRegex = /[\u{1F000}-\u{1FFFF}\u{2600}-\u{27BF}\u{FE00}-\u{FEFF}]/gu;
    const cleanStr = (s) => typeof s === 'string' ? s.replace(emojiRegex, '').trim() : s;
    Object.keys(parsed).forEach(k => {
      if (typeof parsed[k] === 'string') parsed[k] = cleanStr(parsed[k]);
      else if (Array.isArray(parsed[k])) parsed[k] = parsed[k].map(cleanStr);
    });
    res.status(200).json(parsed);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}