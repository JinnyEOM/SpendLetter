const GNEWS_BASE = 'https://gnews.io/api/v4';

const CAT_MAP = {
  '경제·금융': { type: 'headlines', category: 'business' },
  'IT·테크':   { type: 'headlines', category: 'technology' },
  '건강·운동': { type: 'headlines', category: 'health' },
  '문화·엔터': { type: 'headlines', category: 'entertainment' },
  '스포츠':    { type: 'headlines', category: 'sports' },
  '사회·정치': { type: 'headlines', category: 'nation' },
  '부동산':    { type: 'search', q: '부동산',   fallback: '아파트 분양' },
  '음식·요리': { type: 'search', q: '요리 맛집', fallback: '음식 레시피' },
  '여행':      { type: 'search', q: '여행',      fallback: '국내여행 관광' },
};

async function gnewsFetch(url) {
  const r = await fetch(url, {
    headers: { 'User-Agent': 'Mozilla/5.0 (compatible; SpendLetter/1.0)' },
  });
  if (!r.ok) throw new Error(`GNews HTTP ${r.status}`);
  const data = await r.json();
  if (data.errors) throw new Error(data.errors.join(', '));
  return (data.articles || []).map(a => ({
    title: a.title,
    url: a.url,
    publishedAt: a.publishedAt,
    source: a.source?.name || '',
    description: (a.description || '').substring(0, 200),
    image: a.image || null,
  }));
}

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  const key = process.env.GNEWS_API_KEY;
  if (!key) return res.status(500).json({ error: 'API 키가 설정되지 않았습니다' });

  const { category } = req.query;
  const mapping = CAT_MAP[category] || { type: 'search', q: category };

  try {
    let articles = [];

    if (mapping.type === 'headlines') {
      const url = `${GNEWS_BASE}/top-headlines?category=${mapping.category}&lang=ko&country=kr&max=10&apikey=${key}`;
      articles = await gnewsFetch(url);

      // country=kr 결과가 너무 적으면 국가 제한 없이 재시도
      if (articles.length < 3) {
        const url2 = `${GNEWS_BASE}/top-headlines?category=${mapping.category}&lang=ko&max=10&apikey=${key}`;
        const more = await gnewsFetch(url2);
        const seen = new Set(articles.map(a => a.url));
        articles = [...articles, ...more.filter(a => !seen.has(a.url))];
      }
    } else {
      // 검색: country 제한 없이 lang=ko만 사용 (한국어 커버리지 확보)
      const url = `${GNEWS_BASE}/search?q=${encodeURIComponent(mapping.q)}&lang=ko&max=10&apikey=${key}`;
      articles = await gnewsFetch(url);

      if (articles.length < 3 && mapping.fallback) {
        const url2 = `${GNEWS_BASE}/search?q=${encodeURIComponent(mapping.fallback)}&lang=ko&max=10&apikey=${key}`;
        const more = await gnewsFetch(url2);
        const seen = new Set(articles.map(a => a.url));
        articles = [...articles, ...more.filter(a => !seen.has(a.url))];
      }
    }

    res.setHeader('Cache-Control', 's-maxage=600, stale-while-revalidate');
    res.status(200).json({ articles: articles.slice(0, 10) });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}
