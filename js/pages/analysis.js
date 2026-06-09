/* ── analysis.js · analysis 페이지 전용 스크립트 ── */

let _insightExpenses = [], _insightMonth = 0, _insightYear = 0, _insightChangeText = '';

function ledgerHashStr(expenses) {
  return `${expenses.length}:${expenses.reduce((s, t) => s + Number(t.amount), 0)}`;
}

function checkInsight() {
  loadAIInsight(_insightExpenses, _insightMonth, _insightYear);
}

function buildMonthOptions() {
  const now = new Date();
  const ledger = Storage.getLedger();
  const seen = new Set();
  const options = [];

  for (let i = 0; i < 13; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const y = d.getFullYear();
    const m = d.getMonth() + 1;
    const key = `${y}-${m}`;
    if (!seen.has(key)) { seen.add(key); options.push({ year: y, month: m, key }); }
  }

  ledger.forEach(t => {
    const d = new Date(t.date);
    const y = d.getFullYear();
    const m = d.getMonth() + 1;
    const key = `${y}-${m}`;
    if (!seen.has(key)) { seen.add(key); options.push({ year: y, month: m, key }); }
  });

  options.sort((a, b) => a.year !== b.year ? b.year - a.year : b.month - a.month);
  return options;
}

function parseMonthKey(key) {
  const [y, m] = key.split('-').map(Number);
  return { year: y, month: m };
}

document.addEventListener('DOMContentLoaded', () => {
  if (!Storage.isLoggedIn()) { window.location.href='index.html'; return; }
  const user = Storage.getUser();
  if (user) {
    document.getElementById('sidebarAvatar').textContent=(user.email||'U')[0].toUpperCase();
    document.getElementById('sidebarEmail').textContent=user.email||'';
  }

  const select = document.getElementById('analysisMonth');
  const options = buildMonthOptions();
  options.forEach(({ year, month, key }) => {
    const opt = document.createElement('option');
    opt.value = key;
    opt.textContent = `${year}년 ${month}월`;
    select.appendChild(opt);
  });

  // 기본값: 전월
  const now = new Date();
  const prev = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const defaultKey = `${prev.getFullYear()}-${prev.getMonth() + 1}`;
  if (options.find(o => o.key === defaultKey)) select.value = defaultKey;

  const { year: initYear, month: initMonth } = parseMonthKey(select.value);
  renderAnalysis(initMonth, initYear);

  select.addEventListener('change', () => {
    const { year, month } = parseMonthKey(select.value);
    renderAnalysis(month, year);
  });
});

function renderAnalysis(month, year) {

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
  const hasPrevData = prevExpense > 0;
  const changeRate = hasPrevData ? Math.round((totalExpense - prevExpense) / prevExpense * 100) : null;
  const changeText = !hasPrevData ? '이전 달 데이터 없음' : changeRate > 0 ? `↑ 전월 대비 ${changeRate}%` : changeRate < 0 ? `↓ 전월 대비 ${Math.abs(changeRate)}%` : '전월과 동일';
  _insightChangeText = changeText;
  const changeColor = !hasPrevData ? 'var(--gray-300)' : changeRate > 0 ? 'var(--error)' : changeRate < 0 ? '#059669' : 'var(--gray-400)';

  // KPI 업데이트
  document.querySelector('.stat-card:nth-child(1) .stat-card-value').textContent = '₩' + totalExpense.toLocaleString('ko-KR');
  document.querySelector('.stat-card:nth-child(1) .stat-card-change').textContent = changeText;
  document.querySelector('.stat-card:nth-child(1) .stat-card-change').style.color = changeColor;
  document.querySelector('.stat-card:nth-child(2) .stat-card-value').textContent = '₩' + dailyAvg.toLocaleString('ko-KR');
  document.querySelector('.stat-card:nth-child(2) .stat-card-change').textContent = daysElapsed + '일 기준';
  document.querySelector('.stat-card:nth-child(3) .stat-card-value').textContent = topCat[0] === '없음' ? '없음' : catEmoji(topCat[0]) + ' ' + topCat[0];
  document.querySelector('.stat-card:nth-child(3) .stat-card-change').textContent = topCat[1] > 0 ? '₩' + Number(topCat[1]).toLocaleString('ko-KR') : '-';
  document.querySelector('.stat-card:nth-child(4) .stat-card-value').textContent = expenses.length + '건';
  document.querySelector('.stat-card:nth-child(4) .stat-card-change').textContent = `${month}월`;
  const chip = document.getElementById('analysisMonthChip');
  if (chip) chip.textContent = `${month}월`;

  // 도넛 차트 업데이트
  renderDonut(catSorted, totalExpense);

  // 주간 트렌드 업데이트
  renderWeeklyBar(expenses, month, year);

  // 월 변경 시 인사이트 초기 상태로 리셋
  _insightExpenses = expenses;
  _insightMonth = month;
  _insightYear = year;
  const hash = ledgerHashStr(expenses);
  const cached = Storage.getAIInsightCache(year, month);
  if (expenses.length && cached && cached.ledgerHash === hash) {
    applyInsightData(cached.data, month);
  } else {
    resetInsight();
  }
}

function resetInsight() {
  const m = _insightMonth;
  const q = document.getElementById('insightQuestion');
  const btn = document.getElementById('insightCheckBtn');
  if (q) q.textContent = `${m}월엔 어디에 가장 많이 썼을까요?`;
  if (btn) btn.textContent = `${m}월 리포트 확인하기`;
  document.getElementById('insightSubtext').textContent = 'AI가 분석한 이달의 소비 패턴';
  document.getElementById('insightBadge').style.display = 'none';
  document.getElementById('insightPrompt').style.display = 'flex';
  document.getElementById('insightLoading').style.display = 'none';
  document.getElementById('insightResults').style.display = 'none';
}

function applyInsightData(data, month) {
  document.getElementById('insightPrompt').style.display = 'none';
  document.getElementById('insightLoading').style.display = 'none';
  document.getElementById('insightSubtext').textContent = `${month}월 소비를 분석했어요`;
  document.getElementById('insightBadge').style.display = 'inline-block';
  document.getElementById('insightHeadlineText').textContent = data.headline || `${month}월 소비 패턴을 분석했어요`;
  document.getElementById('insightHeadlineSub').textContent = data.summary || _insightChangeText;
  document.getElementById('feedNewsBtnText').textContent = `${month}월 소비 기반 뉴스 보기`;
  document.getElementById('insightResults').style.display = 'flex';
  setInsight(null, 'insightContent0', null, buildBullets(data.pattern), true);
  setInsight(null, 'insightContent1', null, buildBullets(data.trend), true);
  setInsight(null, 'insightContent2', null, buildBullets(data.recommend), true);
  if (data.recommendedCategories?.length) {
    Storage.setAIRecommendation({ categories: data.recommendedCategories, month: _insightMonth, year: _insightYear });
  }
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
  const circles = document.querySelectorAll('#donutSvg circle[stroke-dasharray]');
  circles.forEach((c, i) => {
    if (i === 0) { c.setAttribute('stroke', '#E5E7EB'); return; }
  });

  // 범례 업데이트
  const legendEl = document.getElementById('donutLegend');
  if (!legendEl) return;

  const top5 = catSorted.slice(0, 5);
  legendEl.innerHTML = top5.map(([ cat, amt ], i) => {
    const pct = total > 0 ? Math.round(amt / total * 100) : 0;
    return `
      <div style="display:flex;align-items:center;justify-content:space-between;">
        <div style="display:flex;align-items:center;gap:8px;">
          <div style="width:10px;height:10px;border-radius:3px;background:${colors[i]};flex-shrink:0;"></div>
          <span style="font-size:13px;color:var(--gray-700);">${cat}</span>
        </div>
        <span style="font-size:13px;font-weight:700;color:var(--gray-800);">${pct}%</span>
      </div>`;
  }).join('');

  // 도넛 중앙 텍스트 업데이트
  const donutTotal = document.getElementById('donutTotal');
  if (donutTotal) {
    donutTotal.textContent = total > 0 ? '₩' + total.toLocaleString('ko-KR') : '-';
  }

  // 도넛 세그먼트 재계산
  const segments = document.querySelectorAll('#donutSvg circle[transform]');
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
  const now = new Date();
  const isCurrentMonth = now.getFullYear() === year && now.getMonth() + 1 === month;

  const weeks = [0, 0, 0, 0];
  expenses.forEach(t => {
    const day = new Date(t.date).getDate();
    const weekIdx = Math.min(Math.floor((day - 1) / 7), 3);
    weeks[weekIdx] += Number(t.amount);
  });

  const max = Math.max(...weeks, 1);
  const barHeight = 100;
  const baseY = 140;

  const bars = document.querySelectorAll('#weeklyBarSvg rect[rx="6"]');

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

  // 1-3주 값 레이블
  const valueTexts = document.querySelectorAll('#weeklyBarSvg text[font-weight="700"]');
  weeks.forEach((w, i) => {
    if (i === 3) return;
    if (!valueTexts[i]) return;
    const label = w >= 10000 ? Math.round(w / 10000) + '만' : w > 0 ? '₩' + w.toLocaleString() : '-';
    valueTexts[i].textContent = label;
  });

  // 4주 레이블: 현재 월이면 "진행중", 과거 월이면 실제 값
  const week4ValueEl = document.getElementById('week4ValueText');
  if (week4ValueEl) {
    if (isCurrentMonth) {
      week4ValueEl.textContent = '진행중';
      week4ValueEl.setAttribute('fill', '#9CA3AF');
      week4ValueEl.removeAttribute('font-weight');
      if (bars[6]) bars[6].setAttribute('opacity', '0.3');
    } else {
      const w4 = weeks[3];
      const label4 = w4 >= 10000 ? Math.round(w4 / 10000) + '만' : w4 > 0 ? '₩' + w4.toLocaleString() : '-';
      week4ValueEl.textContent = label4;
      week4ValueEl.setAttribute('fill', '#4F46E5');
      week4ValueEl.setAttribute('font-weight', '700');
      if (bars[6]) bars[6].setAttribute('opacity', '1');
    }
  }
}
async function loadAIInsight(transactions, month, year) {
  document.getElementById('insightPrompt').style.display = 'none';
  document.getElementById('insightLoading').style.display = 'flex';
  document.getElementById('insightResults').style.display = 'none';

  // 클라이언트 데이터로 헤드라인 미리 계산
  const catMap = {};
  transactions.forEach(t => { catMap[t.category] = (catMap[t.category] || 0) + Number(t.amount); });
  const topEntry = Object.entries(catMap).sort((a, b) => b[1] - a[1])[0];
  const topCat = topEntry ? topEntry[0] : null;
  const headlineText = topCat ? `${month}월은 ${topCat} 중심의 한 달이었어요` : `${month}월 소비 패턴을 분석했어요`;
  const headlineSub = _insightChangeText || '전월 데이터 없음';

  function showResults() {
    document.getElementById('insightLoading').style.display = 'none';
    document.getElementById('insightSubtext').textContent = `${month}월 소비를 분석했어요`;
    document.getElementById('insightBadge').style.display = 'inline-block';
    document.getElementById('insightHeadlineText').textContent = headlineText;
    document.getElementById('insightHeadlineSub').textContent = headlineSub;
    document.getElementById('feedNewsBtnText').textContent = `${month}월 소비 기반 뉴스 보기`;
    document.getElementById('insightResults').style.display = 'flex';
  }

  if (!transactions.length) {
    showResults();
    document.getElementById('insightHeadlineText').textContent = `${month}월 지출 내역이 없습니다`;
    document.getElementById('insightHeadlineSub').textContent = '가계부에 지출을 입력하면 AI 분석이 시작됩니다';
    setInsight(null, 'insightContent0', null, buildBullets(['이번 달 지출 내역이 없습니다.']), true);
    setInsight(null, 'insightContent1', null, buildBullets(['데이터가 쌓이면 분석해 드립니다.']), true);
    setInsight(null, 'insightContent2', null, buildBullets(['지출 입력 후 다시 확인해 주세요.']), true);
    return;
  }

  try {
    const res = await fetch('/api/analyze', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ transactions, month, year })
    });
    if (!res.ok && !res.headers.get('content-type')?.includes('application/json')) {
      throw new Error(`API 오류: ${res.status}`);
    }
    const data = await res.json();
    if (data.error) throw new Error(data.error);

    showResults();
    if (data.headline) document.getElementById('insightHeadlineText').textContent = data.headline;
    if (data.summary) document.getElementById('insightHeadlineSub').textContent = data.summary;
    setInsight(null, 'insightContent0', null, buildBullets(data.pattern), true);
    setInsight(null, 'insightContent1', null, buildBullets(data.trend), true);
    setInsight(null, 'insightContent2', null, buildBullets(data.recommend), true);
    if (data.recommendedCategories?.length) {
      Storage.setAIRecommendation({ categories: data.recommendedCategories, month, year });
    }
    Storage.setAIInsightCache(year, month, data, ledgerHashStr(transactions));

  } catch (e) {
    showResults();
    document.getElementById('insightHeadlineText').textContent = 'AI 분석에 실패했습니다';
    document.getElementById('insightHeadlineSub').textContent = e.message;
    setInsight(null, 'insightContent0', null, buildBullets([`오류: ${e.message}`]), true);
    setInsight(null, 'insightContent1', null, buildBullets(['/api/analyze 호출 실패']), true);
    setInsight(null, 'insightContent2', null, buildBullets(['ANTHROPIC_API_KEY 환경변수를 확인하세요']), true);
    console.error('AI 분석 실패:', e);
  }
}

function buildBullets(items) {
  if (!Array.isArray(items) || !items.length) return '';
  return '<ul class="insight-bullets">' + items.slice(0, 2).map(item => `<li>${item}</li>`).join('') + '</ul>';
}

function setInsight(titleId, contentId, title, content, asHtml = false) {
  const t = titleId ? document.getElementById(titleId) : null;
  const c = document.getElementById(contentId);
  if (t) t.textContent = title;
  if (c) asHtml ? (c.innerHTML = content) : (c.textContent = content);
}