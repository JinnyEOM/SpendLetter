/* ── feed.js · 마이 피드 페이지 ── */

const newsCache = {};
const aiNewsCache = {};
let activeCat = '';
let categories = [];

function timeAgo(isoStr) {
  const diff = Math.floor((Date.now() - new Date(isoStr)) / 60000);
  if (diff < 60) return diff + '분 전';
  if (diff < 1440) return Math.floor(diff / 60) + '시간 전';
  return Math.floor(diff / 1440) + '일 전';
}

// ── 분석 정확도 바 ──
function updateSynergy() {
  const count = Storage.getLedger().length;
  let pct = 10;
  if (count >= 3)  pct = 40;
  if (count >= 8)  pct = 75;
  if (count >= 15) pct = 100;
  document.getElementById('synergyFill').style.width = pct + '%';
  document.getElementById('synergyPct').textContent = pct + '%';
}

// ── 카테고리 탭 렌더 ──
function renderCatTabs() {
  const tabs = document.getElementById('catTabs');
  const list = document.getElementById('newsList');

  if (!categories.length) {
    tabs.style.display = 'none';
    list.innerHTML = `
      <div style="display:flex;flex-direction:column;align-items:center;justify-content:center;padding:52px 28px;text-align:center;gap:16px;">
        <div>
          <p style="font-size:15px;font-weight:700;color:var(--gray-800);margin-bottom:6px;letter-spacing:-0.02em;">관심 카테고리를 설정해주세요</p>
          <p style="font-size:13px;color:var(--gray-400);line-height:1.6;">선호 카테고리를 선택하면<br>맞춤 뉴스를 바로 받아볼 수 있어요</p>
        </div>
        <a href="category.html" style="display:inline-flex;align-items:center;gap:6px;padding:10px 22px;background:var(--indigo-600);color:white;border-radius:10px;font-size:14px;font-weight:600;text-decoration:none;">
          카테고리 설정하러 가기 →
        </a>
      </div>`;
    return;
  }

  tabs.style.display = 'flex';
  tabs.innerHTML = categories.map((cat, i) => `
    <button class="cat-tab ${i === 0 ? 'active' : ''}" onclick="switchCat(this, '${cat}')">${cat}</button>
  `).join('');
  activeCat = categories[0];
  loadNewsForCat(activeCat);
}

// ── 탭 전환 ──
function switchCat(el, cat) {
  document.querySelectorAll('.cat-tab').forEach(t => t.classList.remove('active'));
  el.classList.add('active');
  activeCat = cat;
  loadNewsForCat(cat);
}

// ── 뉴스 불러오기 (API + 세션 캐시) ──
async function loadNewsForCat(cat) {
  if (newsCache[cat]) {
    renderNewsList(newsCache[cat]);
    return;
  }

  const list = document.getElementById('newsList');
  list.innerHTML = `
    <div class="mirror-loading">
      <div class="mirror-spinner"></div>
      <span>뉴스를 불러오는 중...</span>
    </div>`;

  try {
    const res = await fetch(`/api/news?category=${encodeURIComponent(cat)}`);
    const data = await res.json();
    if (data.error) throw new Error(data.error);
    newsCache[cat] = data.articles || [];
    renderNewsList(newsCache[cat]);
  } catch (e) {
    list.innerHTML = `
      <div style="padding:40px 24px;text-align:center;">
        <p style="font-size:13px;color:var(--gray-400);line-height:1.7;">뉴스를 불러오지 못했어요.<br><span style="font-size:12px;">${e.message}</span></p>
        <button onclick="loadNewsForCat('${cat}')" style="margin-top:12px;padding:8px 18px;background:var(--indigo-600);color:white;border:none;border-radius:8px;font-size:13px;cursor:pointer;font-family:var(--font);">다시 시도</button>
      </div>`;
  }
}

// ── 뉴스 리스트 렌더 ──
function renderNewsList(articles) {
  const list = document.getElementById('newsList');

  if (!articles.length) {
    list.innerHTML = `
      <div class="empty-state" style="padding:40px 22px;">
        <p style="font-size:13px;color:var(--gray-400);">이 카테고리의 뉴스가 없습니다.</p>
      </div>`;
    return;
  }

  list.innerHTML = articles.map(n => `
    <a href="${n.url}" target="_blank" rel="noopener noreferrer" class="news-list-item" style="text-decoration:none;display:block;color:inherit;">
      <div class="news-list-meta">
        <span class="news-source">${n.source}</span>
        <span class="news-date">${timeAgo(n.publishedAt)}</span>
      </div>
      <h3>${n.title}</h3>
      <p>${n.description}</p>
      <div class="news-list-footer">
        <span class="news-ai-badge">
          <svg width="10" height="10" viewBox="0 0 10 10" fill="none"><circle cx="5" cy="5" r="3.5" stroke="currentColor" stroke-width="1.2"/><path d="M5 3v2l1.2 1.2" stroke="currentColor" stroke-width="1.2" stroke-linecap="round"/></svg>
          실시간
        </span>
        <span style="font-size:11px;color:var(--gray-400);">↗ 원문 보기</span>
      </div>
    </a>
  `).join('');
}

// ── AI 추천 뉴스 탭 전환 ──
function switchAICat(el, cat) {
  document.querySelectorAll('#aiCatTabs .cat-tab').forEach(t => t.classList.remove('active'));
  el.classList.add('active');
  loadAINewsForCat(cat);
}

// ── AI 추천 뉴스 로딩 ──
async function loadAINewsForCat(cat) {
  if (aiNewsCache[cat]) {
    document.getElementById('aiNewsList').innerHTML = buildAINewsHtml(aiNewsCache[cat]);
    return;
  }
  document.getElementById('aiNewsList').innerHTML = `
    <div class="mirror-loading">
      <div class="mirror-spinner"></div>
      <span>뉴스를 불러오는 중...</span>
    </div>`;
  try {
    const res = await fetch(`/api/news?category=${encodeURIComponent(cat)}`);
    const data = await res.json();
    if (data.error) throw new Error(data.error);
    aiNewsCache[cat] = data.articles || [];
    document.getElementById('aiNewsList').innerHTML = buildAINewsHtml(aiNewsCache[cat]);
  } catch (e) {
    document.getElementById('aiNewsList').innerHTML = `
      <div style="padding:40px 24px;text-align:center;">
        <p style="font-size:13px;color:var(--gray-400);">뉴스를 불러오지 못했어요.</p>
        <button onclick="loadAINewsForCat('${cat}')" style="margin-top:12px;padding:8px 18px;background:var(--indigo-600);color:white;border:none;border-radius:8px;font-size:13px;cursor:pointer;font-family:var(--font);">다시 시도</button>
      </div>`;
  }
}

// ── AI 뉴스 HTML 생성 ──
function buildAINewsHtml(articles) {
  if (!articles.length) return `<div style="padding:32px 24px;text-align:center;font-size:13px;color:var(--gray-400);">이 카테고리의 뉴스가 없습니다.</div>`;
  return articles.map(n => `
    <a href="${n.url}" target="_blank" rel="noopener noreferrer" class="news-list-item" style="text-decoration:none;display:block;color:inherit;">
      <div class="news-list-meta">
        <span class="news-source">${n.source}</span>
        <span class="news-date">${timeAgo(n.publishedAt)}</span>
      </div>
      <h3>${n.title}</h3>
      <p>${n.description}</p>
      <div class="news-list-footer">
        <span class="news-ai-badge">
          <svg width="10" height="10" viewBox="0 0 10 10" fill="none"><circle cx="5" cy="5" r="3.5" stroke="currentColor" stroke-width="1.2"/><path d="M5 3v2l1.2 1.2" stroke="currentColor" stroke-width="1.2" stroke-linecap="round"/></svg>
          실시간
        </span>
        <span style="font-size:11px;color:var(--gray-400);">↗ 원문 보기</span>
      </div>
    </a>`).join('');
}

// ── AI 추천 뉴스 렌더 ──
function renderMirror(data) {
  const { recommendedCategories, articles } = data;
  const firstCat = recommendedCategories[0];
  if (firstCat) aiNewsCache[firstCat] = articles;

  document.getElementById('mirrorBody').innerHTML = `
    <div class="cat-tabs" id="aiCatTabs">
      ${recommendedCategories.map((cat, i) => `
        <button class="cat-tab ${i === 0 ? 'active' : ''}" onclick="switchAICat(this, '${cat}')">${cat}</button>
      `).join('')}
    </div>
    <div class="news-list" id="aiNewsList">
      ${buildAINewsHtml(articles)}
    </div>
  `;
}

// ── AI 거울 생성 (가계부 데이터 기반 + /api/analyze 연동) ──
async function generateMirror() {
  const ledger = Storage.getLedger();
  const user = Storage.getUser();
  const name = user ? (user.name || user.email.split('@')[0]) : '님';

  if (!ledger.length) {
    document.getElementById('mirrorBody').innerHTML = `
      <div style="flex:1;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:52px 28px;text-align:center;gap:16px;">
        <div>
          <p style="font-size:15px;font-weight:700;color:var(--gray-800);margin-bottom:6px;letter-spacing:-0.02em;">가계부를 입력하면 분석이 시작돼요</p>
          <p style="font-size:13px;color:var(--gray-400);line-height:1.6;">지출을 3건 이상 입력하면<br>카테고리별 소비 현황을 분석해 드립니다</p>
        </div>
        <a href="ledger.html" style="display:inline-flex;align-items:center;gap:6px;padding:10px 22px;background:var(--indigo-600);color:white;border-radius:10px;font-size:14px;font-weight:600;text-decoration:none;">
          가계부 입력하러 가기 →
        </a>
      </div>`;
    return;
  }

  document.getElementById('mirrorBody').innerHTML = `
    <div class="mirror-loading" style="flex:1;">
      <div class="mirror-spinner"></div>
      <span>AI가 소비 내역을 분석하는 중...</span>
    </div>`;

  const expenses = ledger.filter(t => t.type === 'expense');
  const catSum = expenses.reduce((acc, t) => {
    acc[t.category] = (acc[t.category] || 0) + Number(t.amount);
    return acc;
  }, {});
  const sorted = Object.entries(catSum).sort((a, b) => b[1] - a[1]);
  const top = sorted[0];
  const total = Object.values(catSum).reduce((s, v) => s + v, 0);
  const topPct = top ? Math.round(top[1] / total * 100) : 0;
  const now = new Date();

  const catToNews = { '식비':'음식·요리', '교통':'경제·금융', '쇼핑':'문화·엔터', '의료':'건강·운동', '통신':'IT·테크', '문화':'문화·엔터', '기타':'경제·금융' };
  const fallbackCats = top
    ? [catToNews[top[0]] || '경제·금융', '경제·금융', '문화·엔터'].filter((v, i, a) => a.indexOf(v) === i).slice(0, 3)
    : ['경제·금융', '문화·엔터', '건강·운동'];

  try {
    const res = await fetch('/api/analyze', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        transactions: expenses,
        month: now.getMonth() + 1,
        year: now.getFullYear()
      })
    });
    if (!res.ok && res.headers.get('content-type')?.includes('application/json') === false) {
      throw new Error(`API 오류: ${res.status}`);
    }
    const aiData = await res.json();
    if (aiData.error) throw new Error(aiData.error);

    const recommendedCategories = Array.isArray(aiData.recommendedCategories) && aiData.recommendedCategories.length
      ? aiData.recommendedCategories.slice(0, 3)
      : fallbackCats;

    const newsRes = await fetch(`/api/news?category=${encodeURIComponent(recommendedCategories[0])}`);
    const newsData = newsRes.ok ? await newsRes.json() : { articles: [] };

    renderMirror({ recommendedCategories, articles: newsData.articles || [] });
  } catch (e) {
    let fallbackArticles = [];
    try {
      const newsRes = await fetch(`/api/news?category=${encodeURIComponent(fallbackCats[0])}`);
      if (newsRes.ok) { const d = await newsRes.json(); fallbackArticles = d.articles || []; }
    } catch (_) {}
    renderMirror({ recommendedCategories: fallbackCats, articles: fallbackArticles });
  }
}

// ── 거울 재생성 버튼 ──
async function regenerateMirror() {
  const btn = document.getElementById('mirrorRefreshBtn');
  btn.disabled = true;
  await generateMirror();
  btn.disabled = false;
}

// ── 피드 새로고침 (현재 탭 캐시 제거 후 재요청) ──
function refreshFeed() {
  delete newsCache[activeCat];
  loadNewsForCat(activeCat);
  regenerateMirror();
}

// ── 초기화 ──
document.addEventListener('DOMContentLoaded', () => {
  if (!Storage.isLoggedIn()) { window.location.href = 'index.html'; return; }

  const user = Storage.getUser();
  if (user) {
    document.getElementById('sidebarAvatar').textContent = (user.email || 'U')[0].toUpperCase();
    document.getElementById('sidebarEmail').textContent = user.email || '';
  }

  const now = new Date();
  document.getElementById('feedDate').textContent =
    now.getFullYear() + '년 ' + (now.getMonth()+1) + '월 ' + now.getDate() + '일 맞춤 뉴스';

  categories = Storage.getCategories();

  updateSynergy();
  renderCatTabs();
  generateMirror();
});
