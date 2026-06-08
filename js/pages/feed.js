/* ── feed.js · 마이 피드 페이지 ── */

const newsCache = {};
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

// ── AI 거울 칼럼 렌더 ──
function renderMirror(data) {
  const user = Storage.getUser();
  const name = user ? (user.name || user.email.split('@')[0]) : '구독자';
  const ledgerCount = Storage.getLedger().length;

  document.getElementById('mirrorBody').innerHTML = `
    <div class="mirror-body">
      <div>
        <div class="mirror-report-label">소비 분석 리포트</div>
        <div class="mirror-title">${data.title}</div>
        <div class="mirror-headline">${data.headline}</div>
      </div>
      <div class="mirror-content">${data.content}</div>
      <div class="mirror-advice">
        <div class="mirror-advice-label">AI 절약 팁</div>
        <p>${data.advice}</p>
      </div>
      ${ledgerCount > 0 && ledgerCount < 5 ? `
        <p style="font-size:12px;color:var(--gray-400);padding-top:4px;">지출을 더 입력할수록 분석 정확도가 올라가요.</p>
      ` : ''}
      <div class="mirror-footer">
        <span>${name}님의 분석</span>
        <a href="ledger.html" style="color:var(--indigo-600);font-weight:600;text-decoration:none;font-size:12px;">가계부 입력 →</a>
      </div>
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
      <div style="display:flex;flex-direction:column;align-items:center;justify-content:center;padding:52px 28px;text-align:center;gap:16px;">
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
    <div class="mirror-loading">
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

    renderMirror({
      title: `이번 달 ${name}님의 지출 분석 리포트`,
      headline: `총 지출 ${total.toLocaleString()}원 · ${top ? `${top[0]} 비중 ${topPct}%로 1위` : '카테고리 고른 분포'}`,
      content: aiData.pattern + ' ' + aiData.trend,
      advice: '💡 ' + aiData.recommendation
    });
  } catch (e) {
    // AI API 실패 시 로컬 분석으로 폴백
    renderMirror({
      title: `이번 달 ${name}님의 지출 분석 리포트`,
      headline: `총 지출 ${total.toLocaleString()}원 · ${top ? `${top[0]} 비중 ${topPct}%로 1위` : '카테고리 고른 분포'}`,
      content: sorted.slice(0, 3).map(([cat, amt]) =>
        `'${cat}' 항목에 ${amt.toLocaleString()}원 지출`
      ).join(', ') + `이 기록되었습니다. ${top && topPct > 40 ? `특히 '${top[0]}' 지출이 전체의 ${topPct}%를 차지해 집중 관리가 필요한 구간입니다.` : '전반적으로 균형 잡힌 소비 패턴을 보이고 있습니다.'} 총 ${expenses.length}건의 지출 내역을 분석한 결과입니다.`,
      advice: top && topPct > 35
        ? `💡 '${top[0]}' 항목이 지출의 ${topPct}%를 차지합니다. 이번 주 하루만이라도 해당 카테고리 지출을 한 번 건너뛰어보세요. 월 기준 약 ${Math.round(top[1] * 0.2).toLocaleString()}원 절약이 가능합니다.`
        : '💡 소비 균형이 양호합니다! 각 카테고리 예산 한도를 설정해 이 균형을 유지해보세요.'
    });
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
