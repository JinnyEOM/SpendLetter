/* ── feed.js · 마이 피드 페이지 ── */

function timeAgo(isoStr) {
  const diff = Math.floor((Date.now() - new Date(isoStr)) / 60000);
  if (diff < 1) return '방금 전';
  if (diff < 60) return diff + '분 전';
  if (diff < 1440) return Math.floor(diff / 60) + '시간 전';
  return Math.floor(diff / 1440) + '일 전';
}

// ── 썸네일 렌더 ──
function renderThumb(imageUrl) {
  const icon = `<svg width="16" height="16" viewBox="0 0 16 16" fill="none"><rect x="1" y="3" width="14" height="10" rx="2" stroke="#9CA3AF" stroke-width="1.5"/><circle cx="5.5" cy="7.5" r="1.5" fill="#9CA3AF"/><path d="M1 11l4-3 3 2.5 2.5-3.5L15 11.5" stroke="#9CA3AF" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
  if (imageUrl) {
    return `<div class="news-rank-thumb"><img src="${imageUrl}" alt="" loading="lazy" onerror="this.remove()"></div>`;
  }
  return `<div class="news-rank-thumb">${icon}</div>`;
}

// ── 뉴스 항목 렌더 (네이버 랭킹 스타일) ──
function renderNewsItem(article, index) {
  return `<a href="${article.url}" target="_blank" rel="noopener noreferrer" class="news-rank-item">
    <span class="news-rank-num">${index + 1}</span>
    <div class="news-rank-content">
      <div class="news-rank-title">${article.title}</div>
      <div class="news-rank-time">
        <svg width="10" height="10" viewBox="0 0 10 10" fill="none" style="flex-shrink:0;opacity:0.5;"><circle cx="5" cy="5" r="4" stroke="currentColor" stroke-width="1"/><path d="M5 2.5V5l1.5 1.5" stroke="currentColor" stroke-width="1" stroke-linecap="round"/></svg>
        ${timeAgo(article.publishedAt)}
      </div>
    </div>
    ${renderThumb(article.image)}
  </a>`;
}

// ── 카테고리 카드 렌더 ──
function renderCategoryCard(cat, articles, isAI = false) {
  const aiBadge = isAI ? `<span class="ai-badge">AI</span>` : '';
  const hasMore = articles.length > 5;

  const items = articles.length
    ? articles.slice(0, 5).map((a, i) => renderNewsItem(a, i)).join('')
    : `<div class="news-empty">이 카테고리의 뉴스가 없습니다.</div>`;

  return `<div class="news-card" data-cat="${cat}">
    <div class="news-card-head">
      <div style="display:flex;align-items:center;gap:6px;">
        ${aiBadge}
        <span class="news-card-cat">${cat}</span>
      </div>
      ${hasMore ? `<button onclick="expandCard(this)" class="expand-btn" style="display:flex;align-items:center;padding:0;color:var(--gray-400);">
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M5 3l4 4-4 4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>
      </button>` : ''}
    </div>
    <div class="news-rank-list">${items}</div>
    ${hasMore ? `<div class="news-card-foot">
      <button onclick="expandCard(this)" class="expand-btn">더보기</button>
    </div>` : ''}
  </div>`;
}

// ── 카드 더보기/접기 토글 ──
function expandCard(btn) {
  const card = btn.closest('.news-card');
  const isExpanded = card.dataset.expanded === '1';
  const list = card.querySelector('.news-rank-list');
  const foot = card.querySelector('.news-card-foot');
  const footBtn = foot?.querySelector('.expand-btn');
  const headBtn = card.querySelector('.news-card-head .expand-btn');

  if (isExpanded) {
    Array.from(list.querySelectorAll('.news-rank-item')).forEach((el, i) => {
      if (i >= 5) el.remove();
    });
    card.dataset.expanded = '0';
    if (footBtn) footBtn.textContent = '더보기';
    if (headBtn) headBtn.style.display = '';
  } else {
    const cached = Storage.getNewsCache(card.dataset.cat);
    if (cached && cached.length > 5) {
      list.insertAdjacentHTML('beforeend',
        cached.slice(5).map((a, i) => renderNewsItem(a, i + 5)).join('')
      );
    }
    card.dataset.expanded = '1';
    if (footBtn) footBtn.textContent = '접기';
    if (headBtn) headBtn.style.display = 'none';
  }
}

// ── 카드 로딩 + 렌더 ──
async function loadAndRenderCard(cat, containerId, isAI = false) {
  const container = document.getElementById(containerId);
  if (!container) return;

  const cached = Storage.getNewsCache(cat);
  if (cached) {
    container.innerHTML = renderCategoryCard(cat, cached, isAI);
    return;
  }

  const aiBadge = isAI ? `<span class="ai-badge">AI</span>` : '';
  container.innerHTML = `<div class="news-card news-card-loading">
    <div class="news-card-head">
      <div style="display:flex;align-items:center;gap:6px;">${aiBadge}<span class="news-card-cat">${cat}</span></div>
    </div>
    <div class="mirror-loading"><div class="mirror-spinner"></div><span>불러오는 중...</span></div>
  </div>`;

  try {
    const res = await fetch(`/api/news?category=${encodeURIComponent(cat)}`);
    const data = await res.json();
    if (data.error) throw new Error(data.error);
    const articles = data.articles || [];
    Storage.setNewsCache(cat, articles);
    container.innerHTML = renderCategoryCard(cat, articles, isAI);
  } catch (e) {
    const aiBadge2 = isAI ? `<span class="ai-badge">AI</span>` : '';
    container.innerHTML = `<div class="news-card">
      <div class="news-card-head">
        <div style="display:flex;align-items:center;gap:6px;">${aiBadge2}<span class="news-card-cat">${cat}</span></div>
      </div>
      <div class="news-empty">${e.message || '뉴스를 불러오지 못했어요'}</div>
      <div class="news-card-foot">
        <button onclick="retryCard('${cat}','${containerId}',${isAI})" class="expand-btn">다시 시도</button>
      </div>
    </div>`;
  }
}

function retryCard(cat, containerId, isAI) {
  Storage.clearNewsCache(cat);
  loadAndRenderCard(cat, containerId, isAI === 'true' || isAI === true);
}

// ── 선호 카테고리 섹션 ──
function renderUserSection(userCats) {
  const grid = document.getElementById('userCatGrid');
  if (!grid) return;

  if (!userCats.length) {
    grid.innerHTML = `<div style="grid-column:1/-1;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:52px 28px;text-align:center;gap:14px;">
      <p style="font-size:15px;font-weight:700;color:var(--gray-800);letter-spacing:-0.02em;">관심 카테고리를 설정해주세요</p>
      <p style="font-size:13px;color:var(--gray-400);line-height:1.6;">선호 카테고리를 선택하면<br>맞춤 뉴스를 바로 받아볼 수 있어요</p>
      <a href="category.html" style="display:inline-flex;align-items:center;gap:6px;padding:10px 22px;background:var(--indigo-600);color:white;border-radius:10px;font-size:14px;font-weight:600;text-decoration:none;">카테고리 설정하러 가기 →</a>
    </div>`;
    return;
  }

  grid.innerHTML = userCats.map((_, i) => `<div id="userCard${i}"></div>`).join('');
  userCats.forEach((cat, i) => loadAndRenderCard(cat, `userCard${i}`, false));
}

// ── AI 추천 카테고리 섹션 ──
function renderAISection() {
  const grid = document.getElementById('aiCatGrid');
  const subEl = document.getElementById('aiSectionSub');
  if (!grid) return;

  const reco = Storage.getAIRecommendation();
  let aiCats = reco?.categories?.length ? reco.categories.slice(0, 3) : null;

  if (reco?.year && reco?.month && subEl) {
    subEl.textContent = `${reco.year}년 ${reco.month}월 소비 분석 기반 · AI 자동 선정`;
  }

  if (!aiCats) {
    const expenses = Storage.getLedger().filter(t => t.type === 'expense');
    if (!expenses.length) {
      grid.innerHTML = `<div style="grid-column:1/-1;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:52px 28px;text-align:center;gap:14px;">
        <p style="font-size:15px;font-weight:700;color:var(--gray-800);letter-spacing:-0.02em;">가계부를 입력하면 분석이 시작돼요</p>
        <p style="font-size:13px;color:var(--gray-400);line-height:1.6;">지출을 3건 이상 입력하면<br>AI가 카테고리를 추천해 드립니다</p>
        <a href="ledger.html" style="display:inline-flex;align-items:center;gap:6px;padding:10px 22px;background:var(--indigo-600);color:white;border-radius:10px;font-size:14px;font-weight:600;text-decoration:none;">가계부 입력하러 가기 →</a>
      </div>`;
      return;
    }
    const catSum = expenses.reduce((acc, t) => {
      acc[t.category] = (acc[t.category] || 0) + Number(t.amount);
      return acc;
    }, {});
    const catToNews = { '식비':'음식·요리', '교통':'경제·금융', '쇼핑':'문화·엔터', '의료':'건강·운동', '통신':'IT·테크', '문화':'문화·엔터', '기타':'경제·금융' };
    const mapped = Object.entries(catSum).sort((a, b) => b[1] - a[1]).map(([c]) => catToNews[c] || '경제·금융');
    aiCats = [...new Set(mapped)].slice(0, 3);
    const fallbacks = ['경제·금융', '문화·엔터', '건강·운동'];
    for (const f of fallbacks) {
      if (aiCats.length >= 3) break;
      if (!aiCats.includes(f)) aiCats.push(f);
    }
  }

  grid.innerHTML = aiCats.map((_, i) => `<div id="aiCard${i}"></div>`).join('');
  aiCats.forEach((cat, i) => loadAndRenderCard(cat, `aiCard${i}`, true));
}

// ── 피드 새로고침 ──
function refreshFeed() {
  const userCats = Storage.getCategories();
  const reco = Storage.getAIRecommendation();
  const aiCats = reco?.categories?.slice(0, 3) || [];
  [...new Set([...userCats, ...aiCats])].forEach(cat => Storage.clearNewsCache(cat));
  renderUserSection(userCats);
  renderAISection();
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
    now.getFullYear() + '년 ' + (now.getMonth() + 1) + '월 ' + now.getDate() + '일 맞춤 뉴스';

  renderUserSection(Storage.getCategories());
  renderAISection();
});
