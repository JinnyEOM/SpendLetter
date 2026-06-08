const CAT_MAP = {
  '경제·금융': { type: 'top', category: 'business' },
  'IT·테크':   { type: 'top', category: 'technology' },
  '건강·운동': { type: 'top', category: 'health' },
  '문화·엔터': { type: 'top', category: 'entertainment' },
  '스포츠':    { type: 'top', category: 'sports' },
  '사회·정치': { type: 'top', category: 'nation' },
  '부동산':    { type: 'search', q: '부동산' },
  '음식·요리': { type: 'search', q: '음식 요리' },
  '여행':      { type: 'search', q: '여행' },
};

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  const { category } = req.query;
  const token = process.env.GNEWS_API_KEY;

  if (!token) return res.status(500).json({ error: 'GNEWS_API_KEY가 설정되지 않았습니다.' });

  const mapping = CAT_MAP[category] || { type: 'search', q: category };
  const base = 'https://gnews.io/api/v4';
  const common = `lang=ko&max=10&token=${token}`;

  const url = mapping.type === 'top'
    ? `${base}/top-headlines?category=${mapping.category}&country=kr&${common}`
    : `${base}/search?q=${encodeURIComponent(mapping.q)}&sortby=publishedAt&${common}`;

  try {
    const r = await fetch(url);
    const data = await r.json();

    if (!r.ok) return res.status(r.status).json({ error: data.errors?.[0] || 'GNews API 오류' });

    const articles = (data.articles || []).map(a => ({
      title: a.title,
      description: a.description || '',
      url: a.url,
      source: a.source?.name || '',
      publishedAt: a.publishedAt,
    }));

    res.setHeader('Cache-Control', 's-maxage=600, stale-while-revalidate');
    res.status(200).json({ articles });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}
