export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { transactions, month, year } = req.body;

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

위 데이터를 바탕으로 아래 3가지를 각각 2문장 이내로 분석해주세요.
응답은 반드시 아래 JSON 형식으로만 답하세요. 다른 텍스트 없이 JSON만 출력하세요.

{
  "pattern": "소비 패턴 분석 내용",
  "trend": "주목할 만한 지출 트렌드 내용",
  "recommendation": "추천 뉴스 카테고리와 이유"
}`;

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 500,
        messages: [{ role: 'user', content: prompt }]
      })
    });

    const data = await response.json();
    const text = data.content[0].text.replace(/```json|```/g, '').trim();
    const parsed = JSON.parse(text);
    res.status(200).json(parsed);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}