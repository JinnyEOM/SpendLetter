const CAT_MAP = {
  '경제·금융': { type: 'topic', topic: 'BUSINESS' },
  'IT·테크':   { type: 'topic', topic: 'TECHNOLOGY' },
  '건강·운동': { type: 'topic', topic: 'HEALTH' },
  '문화·엔터': { type: 'topic', topic: 'ENTERTAINMENT' },
  '스포츠':    { type: 'topic', topic: 'SPORTS' },
  '사회·정치': { type: 'topic', topic: 'NATION' },
  '부동산':    { type: 'search', q: '부동산' },
  '음식·요리': { type: 'search', q: '음식 요리' },
  '여행':      { type: 'search', q: '여행' },
};

function getTag(xml, tag) {
  const cdata = new RegExp(`<${tag}[^>]*><!\\[CDATA\\[([\\s\\S]*?)\\]\\]><\\/${tag}>`).exec(xml);
  if (cdata) return cdata[1];
  const plain = new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`).exec(xml);
  return plain ? plain[1] : '';
}

function parseRSS(xml) {
  const items = [];
  const itemRegex = /<item>([\s\S]*?)<\/item>/g;
  let match;
  while ((match = itemRegex.exec(xml)) !== null) {
    const raw = match[1];
    const fullTitle = getTag(raw, 'title').trim();
    const title = fullTitle.replace(/\s*-\s*[^-]+$/, '').trim() || fullTitle;
    const link = getTag(raw, 'link').trim();
    const pubDate = getTag(raw, 'pubDate').trim();
    const source = getTag(raw, 'source').trim();
    const desc = getTag(raw, 'description').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();

    if (!title || !link) continue;
    items.push({
      title,
      url: link,
      publishedAt: pubDate ? new Date(pubDate).toISOString() : new Date().toISOString(),
      source,
      description: desc.substring(0, 200),
    });
  }
  return items;
}

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  const { category } = req.query;
  const mapping = CAT_MAP[category] || { type: 'search', q: category };
  const base = 'https://news.google.com/rss';
  const params = 'hl=ko&gl=KR&ceid=KR:ko';

  const url = mapping.type === 'topic'
    ? `${base}/headlines/section/topic/${mapping.topic}?${params}`
    : `${base}/search?q=${encodeURIComponent(mapping.q)}&${params}`;

  try {
    const r = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; SpendLetter/1.0)' },
    });

    if (!r.ok) return res.status(r.status).json({ error: `Google News 응답 오류: ${r.status}` });

    const xml = await r.text();
    const articles = parseRSS(xml).slice(0, 10);

    res.setHeader('Cache-Control', 's-maxage=600, stale-while-revalidate');
    res.status(200).json({ articles });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}
