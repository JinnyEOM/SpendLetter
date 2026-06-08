/* ── analysis.js · analysis 페이지 전용 스크립트 ── */

document.addEventListener('DOMContentLoaded', () => {
  if (!Storage.isLoggedIn()) { window.location.href='index.html'; return; }
  const user = Storage.getUser();
  if (user) {
    document.getElementById('sidebarAvatar').textContent=(user.email||'U')[0].toUpperCase();
    document.getElementById('sidebarEmail').textContent=user.email||'';
  }

  const select = document.getElementById('analysisMonth');
  renderAnalysis(parseInt(select.value));
  select.addEventListener('change', () => renderAnalysis(parseInt(select.value)));
});

function renderAnalysis(month) {
  const now = new Date();
  const year = now.getFullYear();

  const all = Storage.getLedger();
  const data = all.filter(t => {
    const d = new Date(t.date);
    return d.getFullYear() === year && d.getMonth() + 1 === month;
  });

  const expenses = data.filter(t => t.type === 'expense');
  const totalExpense = expenses.reduce((s, t) => s + Number(t.amount), 0);

  // 이전달 데이터
  const prevMonth = month === 1 ? 12 : month - 1;
  const prevYear = month === 1 ? year - 1 : year;
  const prevData = all.filter(t => {
    const d = new Date(t.date);
    return d.getFullYear() === prevYear && d.getMonth() + 1 === prevMonth;
  });
  const prevExpense = prevData.filter(t => t.type === 'expense').reduce((s, t) => s + Number(t.amount), 0);

  // 일평균
  const daysInMonth = new Date(year, month, 0).getDate();
  const today = new Date();
  const daysElapsed = (today.getFullYear() === year && today.getMonth() + 1 === month)
    ? today.getDate() : daysInMonth;
  const dailyAvg = daysElapsed > 0 ? Math.round(totalExpense / daysElapsed) : 0;

  // 카테고리별 집계
  const catMap = {};
  expenses.forEach(t => {
    catMap[t.category] = (catMap[t.category] || 0) + Number(t.amount);
  });
  const catSorted = Object.entries(catMap).sort((a, b) => b[1] - a[1]);
  const topCat = catSorted[0] || ['없음', 0];

  // 전월 대비
  const changeRate = prevExpense > 0 ? Math.round((totalExpense - prevExpense) / prevExpense * 100) : 0;
  const changeText = changeRate > 0 ? `↑ 전월 대비 ${changeRate}%` : changeRate < 0 ? `↓ 전월 대비 ${Math.abs(changeRate)}%` : '전월과 동일';
  const changeColor = changeRate > 0 ? 'var(--error)' : changeRate < 0 ? '#059669' : 'var(--gray-400)';

  // KPI 업데이트
  document.querySelector('.stat-card:nth-child(1) .stat-card-value').textContent = '₩' + totalExpense.toLocaleString('ko-KR');
  document.querySelector('.stat-card:nth-child(1) .stat-card-change').textContent = changeText;
  document.querySelector('.stat-card:nth-child(1) .stat-card-change').style.color = changeColor;
  document.querySelector('.stat-card:nth-child(2) .stat-card-value').textContent = '₩' + dailyAvg.toLocaleString('ko-KR');
  document.querySelector('.stat-card:nth-child(2) .stat-card-change').textContent = daysElapsed + '일 기준';
  document.querySelector('.stat-card:nth-child(3) .stat-card-value').textContent = topCat[0] === '없음' ? '없음' : catEmoji(topCat[0]) + ' ' + topCat[0];
  document.querySelector('.stat-card:nth-child(3) .stat-card-change').textContent = topCat[1] > 0 ? '₩' + Number(topCat[1]).toLocaleString('ko-KR') : '-';
  document.querySelector('.stat-card:nth-child(4) .stat-card-value').textContent = expenses.length + '건';

  // 도넛 차트 업데이트
  renderDonut(catSorted, totalExpense);

  // 주간 트렌드 업데이트
  renderWeeklyBar(expenses, month, year);
  loadAIInsight(expenses, month, year);
}

function catEmoji(cat) {
  const map = { '식비':'🍽️', '교통':'🚇', '쇼핑':'🛍️', '문화':'🎭', '의료':'🏥', '통신':'📱', '기타':'📦', '급여':'💰' };
  return map[cat] || '📦';
}

function renderDonut(catSorted, total) {
  const colors = ['#4F46E5','#818CF8','#C7D2FE','#FCA5A5','#FCD34D','#A7F3D0'];
  const circumference = 2 * Math.PI * 60;
  let offset = 0;

  // 도넛 세그먼트 업데이트
  const circles = document.querySelectorAll('svg circle[stroke-dasharray]');
  circles.forEach((c, i) => {
    if (i === 0) { c.setAttribute('stroke', '#E5E7EB'); return; }
  });

  // 범례 업데이트
  const legendEl = document.querySelector('svg').nextElementSibling;
  if (!legendEl) return;

  const top5 = catSorted.slice(0, 5);
  legendEl.innerHTML = top5.map(([ cat, amt ], i) => {
    const pct = total > 0 ? Math.round(amt / total * 100) : 0;
    return `
      <div style="display:flex;align-items:center;justify-content:space-between;">
        <div style="display:flex;align-items:center;gap:8px;">
          <div style="width:10px;height:10px;border-radius:3px;background:${colors[i]};flex-shrink:0;"></div>
          <span style="font-size:13px;color:var(--gray-700);">${catEmoji(cat)} ${cat}</span>
        </div>
        <span style="font-size:13px;font-weight:700;color:var(--gray-800);">${pct}%</span>
      </div>`;
  }).join('');

  // SVG 텍스트 업데이트
  const svgTexts = document.querySelectorAll('svg text');
  svgTexts.forEach(t => {
    if (t.textContent.includes('₩') && t.getAttribute('y') === '76') {
      const val = total >= 100000 ? '₩' + Math.round(total/10000) + '만' : '₩' + total.toLocaleString();
      t.textContent = val;
    }
  });

  // 도넛 세그먼트 재계산
  const segments = document.querySelectorAll('svg circle[transform]');
  offset = 0;
  top5.forEach(([ cat, amt ], i) => {
    if (!segments[i]) return;
    const pct = total > 0 ? amt / total : 0;
    const dash = pct * circumference;
    const gap = circumference - dash;
    segments[i].setAttribute('stroke', colors[i]);
    segments[i].setAttribute('stroke-dasharray', `${dash.toFixed(1)} ${gap.toFixed(1)}`);
    segments[i].setAttribute('stroke-dashoffset', (-offset).toFixed(1));
    offset += dash;
  });

  // 나머지 세그먼트 숨기기
  for (let i = top5.length; i < segments.length; i++) {
    segments[i].setAttribute('stroke-dasharray', '0 377');
  }
}

function renderWeeklyBar(expenses, month, year) {
  const weeks = [0, 0, 0, 0];
  expenses.forEach(t => {
    const day = new Date(t.date).getDate();
    const weekIdx = Math.min(Math.floor((day - 1) / 7), 3);
    weeks[weekIdx] += Number(t.amount);
  });

  const max = Math.max(...weeks, 1);
  const barHeight = 100;
  const baseY = 140;

  const bars = document.querySelectorAll('rect[rx="6"]');
  const labels = ['18만','16만','12만','진행중'];

  weeks.forEach((w, i) => {
    const h = Math.round((w / max) * barHeight);
    const y = baseY - h;
    if (bars[i * 2]) {
      bars[i * 2].setAttribute('y', y + 10);
      bars[i * 2].setAttribute('height', h > 0 ? h : 0);
    }
    if (bars[i * 2 + 1]) {
      bars[i * 2 + 1].setAttribute('y', y);
      bars[i * 2 + 1].setAttribute('height', h > 0 ? h : 0);
    }
  });

  // 값 레이블 업데이트
  const valueTexts = document.querySelectorAll('svg text[font-weight="700"]');
  weeks.forEach((w, i) => {
    if (!valueTexts[i]) return;
    const label = w >= 10000 ? Math.round(w / 10000) + '만' : w > 0 ? '₩' + w.toLocaleString() : '-';
    valueTexts[i].textContent = label;
  });
}
async function loadAIInsight(transactions, month, year) {
  const cards = [
    document.getElementById('insightCard0'),
    document.getElementById('insightCard1'),
    document.getElementById('insightCard2'),
  ];

  cards.forEach(c => { if (c) c.style.opacity = '0.5'; });

  try {
    const res = await fetch('/api/analyze', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ transactions, month, year })
    });

    const data = await res.json();
    if (data.error) throw new Error(data.error);

    const update = (titleId, contentId, title, content, asHtml = false) => {
      const t = document.getElementById(titleId);
      const c = document.getElementById(contentId);
      if (t) t.textContent = title;
      if (c) asHtml ? (c.innerHTML = content) : (c.textContent = content);
    };

    update('insightTitle0', 'insightContent0', '소비 패턴', data.pattern);
    update('insightTitle1', 'insightContent1', '지출 트렌드', data.trend);
    update('insightTitle2', 'insightContent2', '추천 카테고리', data.recommendation, true);

  } catch (e) {
    console.error('AI 분석 실패:', e);
  } finally {
    cards.forEach(c => { if (c) c.style.opacity = '1'; });
  }
}