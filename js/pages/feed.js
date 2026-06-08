/* ── feed.js · 마이 피드 페이지 ── */

// ── 뉴스 더미 데이터 (카테고리별) ──
const NEWS_DATA = {
  '경제·금융': [
    { id:1, source:'한국경제', date:'2시간 전', title:'기준금리 동결…전문가들 "하반기 인하 가능성 높아"', summary:'한국은행이 기준금리를 현 수준으로 유지하기로 결정했습니다. 금리 인하 시기는 물가 안정 추이에 따라 결정될 것으로 보입니다.', ai: true },
    { id:2, source:'매일경제', date:'4시간 전', title:'삼성전자, 2분기 영업이익 시장 예상치 상회 전망', summary:'증권가에서는 삼성전자의 2분기 영업이익이 반도체 수요 회복으로 시장 컨센서스를 웃돌 것으로 전망하고 있습니다.', ai: false },
  ],
  'IT·테크': [
    { id:3, source:'ZDNet Korea', date:'3시간 전', title:'애플, 차세대 AI 기능 탑재 아이폰 17 공개 예정', summary:'애플이 올 하반기 출시할 아이폰 17에 강화된 온디바이스 AI 기능을 탑재한다고 밝혔습니다. 개인화된 추천 기능이 대폭 향상될 전망입니다.', ai: true },
    { id:4, source:'아이뉴스24', date:'6시간 전', title:'네이버, 초거대 AI 모델 업그레이드…검색 정확도 20% 향상', summary:'네이버가 자체 개발한 초거대 AI 언어모델의 성능을 개선해 검색 결과 품질과 답변 정확도를 대폭 끌어올렸습니다.', ai: true },
  ],
  '건강·운동': [
    { id:5, source:'헬스조선', date:'5시간 전', title:'하루 30분 걷기, 대사증후군 위험 35% 낮춰', summary:'규칙적인 걷기 운동이 혈압과 혈당을 동시에 개선하는 효과가 있다는 연구결과가 발표됐습니다. 빠르게 걷는 것이 더 효과적입니다.', ai: true },
    { id:6, source:'청년의사', date:'8시간 전', title:'수면 7시간 이하, 심혈관질환 위험 2배…적정 수면 중요성 재조명', summary:'적정 수면 시간을 지키지 않으면 심혈관계 질환 발생 위험이 크게 증가한다는 연구 결과가 국제학술지에 게재됐습니다.', ai: false },
  ],
  '부동산': [
    { id:7, source:'조선일보', date:'3시간 전', title:'역세권 소형 아파트 청약 경쟁률 기록 경신…1인 가구 열풍', summary:'도심 역세권 소형 아파트 분양 시장이 1인 직장인 가구의 집중 관심을 받으며 청약 경쟁률 기록을 경신하고 있습니다.', ai: true },
  ],
  '라이프스타일': [
    { id:8, source:'한겨레', date:'7시간 전', title:'"평일엔 편의점, 주말엔 오마카세" 2030 극단적 소비 양극화', summary:'불황이 지속되면서 평일 낮에는 편의점 간편식으로 절약하고 주말에는 파인 다이닝을 즐기는 체리슈머형 소비 패턴이 고착화되고 있습니다.', ai: true },
  ],
};

// 기본 AI 거울 데이터 (API 없을 때 표시)
const DEFAULT_MIRROR = {
  title: '가계부를 입력하면 소비 분석이 시작돼요',
  headline: '지출 기록이 쌓일수록 더 정확한 분석을 제공합니다',
  content: '아직 이번 달 지출 내역이 없습니다. 가계부 탭에서 지출을 입력하면 카테고리별 소비 현황과 절약 팁을 자동으로 분석해 드립니다.',
  advice: '💡 식비, 교통, 쇼핑 등 이번 주 지출을 3건 이상 입력하면 카테고리별 지출 비율과 절약 팁이 자동으로 생성됩니다.'
};

let activeCat = '';
let categories = [];

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
  renderNewsList();
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
  renderNewsList();
}

// ── 탭 전환 ──
function switchCat(el, cat) {
  document.querySelectorAll('.cat-tab').forEach(t => t.classList.remove('active'));
  el.classList.add('active');
  activeCat = cat;
  renderNewsList();
}

// ── 뉴스 리스트 렌더 ──
function renderNewsList() {
  const list = document.getElementById('newsList');
  const items = NEWS_DATA[activeCat] || [];

  if (!items.length) {
    list.innerHTML = `
      <div class="empty-state" style="padding:40px 22px;">
        <p style="font-size:13px;color:var(--gray-400);">이 카테고리의 뉴스가 없습니다.</p>
      </div>`;
    return;
  }

  list.innerHTML = items.map(n => `
    <div class="news-list-item">
      <div class="news-list-meta">
        <span class="news-source">${n.source}</span>
        <span class="news-date">${n.date}</span>
      </div>
      <h3>${n.title}</h3>
      <p>${n.summary}</p>
      <div class="news-list-footer">
        ${n.ai
          ? `<span class="news-ai-badge">
               <svg width="10" height="10" viewBox="0 0 10 10" fill="none"><path d="M5 1l1.2 2.8H9l-2.4 1.8.9 2.8L5 6.8 2.5 8.4l.9-2.8L1 3.8h2.8L5 1z" fill="currentColor"/></svg>
               AI 요약
             </span>`
          : '<span></span>'
        }
        <button class="save-btn" onclick="event.stopPropagation()">저장 ♡</button>
      </div>
    </div>
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
  `;
}

// ── AI 거울 생성 (가계부 데이터 기반) ──
function generateMirror() {
  const ledger = Storage.getLedger();

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

  // 카테고리별 지출 집계
  const catSum = ledger.reduce((acc, t) => {
    if (t.type === 'expense') acc[t.category] = (acc[t.category] || 0) + Number(t.amount);
    return acc;
  }, {});

  const sorted = Object.entries(catSum).sort((a, b) => b[1] - a[1]);
  const top = sorted[0];
  const total = Object.values(catSum).reduce((s, v) => s + v, 0);
  const topPct = top ? Math.round(top[1] / total * 100) : 0;
  const user = Storage.getUser();
  const name = user ? (user.name || user.email.split('@')[0]) : '님';

  const mirror = {
    title: `이번 달 ${name}님의 지출 분석 리포트`,
    headline: `총 지출 ${total.toLocaleString()}원 · ${top ? `${top[0]} 비중 ${topPct}%로 1위` : '카테고리 고른 분포'}`,
    content: sorted.slice(0, 3).map(([cat, amt]) =>
      `'${cat}' 항목에 ${amt.toLocaleString()}원 지출`
    ).join(', ') + `이 기록되었습니다. ${top && topPct > 40 ? `특히 '${top[0]}' 지출이 전체의 ${topPct}%를 차지해 집중 관리가 필요한 구간입니다.` : '전반적으로 균형 잡힌 소비 패턴을 보이고 있습니다.'} 총 ${ledger.filter(t=>t.type==='expense').length}건의 지출 내역을 분석한 결과입니다.`,
    advice: top && topPct > 35
      ? `💡 '${top[0]}' 항목이 지출의 ${topPct}%를 차지합니다. 이번 주 하루만이라도 해당 카테고리 지출을 한 번 건너뛰어보세요. 월 기준 약 ${Math.round(top[1] * 0.2).toLocaleString()}원 절약이 가능합니다.`
      : '💡 소비 균형이 양호합니다! 각 카테고리 예산 한도를 설정해 이 균형을 유지해보세요.'
  };

  renderMirror(mirror);
}

// ── 거울 재생성 버튼 ──
function regenerateMirror() {
  const btn = document.getElementById('mirrorRefreshBtn');
  btn.disabled = true;
  document.getElementById('mirrorBody').innerHTML = `
    <div class="mirror-loading">
      <div class="mirror-spinner"></div>
      <span>소비 내역을 다시 분석하는 중...</span>
    </div>`;
  setTimeout(() => {
    generateMirror();
    btn.disabled = false;
  }, 900);
}

// ── 피드 새로고침 ──
function refreshFeed() {
  renderNewsList();
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
