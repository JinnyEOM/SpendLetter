/* ── ledger.js · 가계부 페이지 ── */

let currentMonth = new Date();
let selectedDate = null;

function fmt(n) {
  return '₩' + Number(n).toLocaleString('ko-KR');
}

function getMonthData() {
  const all = Storage.getLedger();
  const y = currentMonth.getFullYear();
  const m = currentMonth.getMonth() + 1;
  return all.filter(t => {
    const d = new Date(t.date);
    return d.getFullYear() === y && d.getMonth() + 1 === m;
  });
}

function getDateData(dateStr) {
  return Storage.getLedger().filter(t => t.date === dateStr);
}

// ── 월별 요약 ──
function renderSummary(data) {
  const income  = data.filter(t => t.type === 'income').reduce((s, t) => s + Number(t.amount), 0);
  const expense = data.filter(t => t.type === 'expense').reduce((s, t) => s + Number(t.amount), 0);
  document.getElementById('totalIncome').textContent  = fmt(income);
  document.getElementById('totalExpense').textContent = fmt(expense);
  document.getElementById('incomeCount').textContent  = data.filter(t => t.type === 'income').length + '건';
  document.getElementById('expenseCount').textContent = data.filter(t => t.type === 'expense').length + '건';
  const net   = income - expense;
  const netEl = document.getElementById('netBalance');
  netEl.textContent = (net >= 0 ? '' : '-') + fmt(Math.abs(net));
  netEl.className   = 'stat-card-value ' + (net >= 0 ? 'amount-income' : 'amount-expense');
}

// ── 달력 렌더 ──
function renderCalendar() {
  const y = currentMonth.getFullYear();
  const m = currentMonth.getMonth();
  document.getElementById('calMonthLabel').textContent = y + '년 ' + (m + 1) + '월';

  const allLedger = Storage.getLedger();

  const dateMap = {};
  allLedger.forEach(t => {
    if (!dateMap[t.date]) dateMap[t.date] = [];
    dateMap[t.date].push(t);
  });

  const firstDay = new Date(y, m, 1).getDay();
  const lastDate = new Date(y, m + 1, 0).getDate();
  const today    = new Date();

  const days = ['일', '월', '화', '수', '목', '금', '토'];

  let html = '<thead><tr>';
  days.forEach(d => { html += `<th class="cal-head-cell">${d}</th>`; });
  html += '</tr></thead><tbody><tr>';

  let dayCount = 0;

  const prevLastDate = new Date(y, m, 0).getDate();
  for (let i = 0; i < firstDay; i++) {
    const prevDate = prevLastDate - firstDay + i + 1;
    html += `<td class="cal-cell other-month${i === 0 ? ' sun' : ''}"><span class="cal-date">${prevDate}</span></td>`;
    dayCount++;
  }

  for (let d = 1; d <= lastDate; d++) {
    const dow     = (firstDay + d - 1) % 7;
    const dateStr = y + '-' + String(m + 1).padStart(2, '0') + '-' + String(d).padStart(2, '0');
    const isToday = today.getFullYear() === y && today.getMonth() === m && today.getDate() === d;
    const isSel   = selectedDate === dateStr;
    const txs     = dateMap[dateStr] || [];

    let cls = 'cal-cell';
    if (dow === 0) cls += ' sun';
    if (dow === 6) cls += ' sat';
    if (isToday)  cls += ' today';
    if (isSel)    cls += ' selected';

    let dotsHtml = '';
    if (txs.length > 0) {
      dotsHtml = '<div class="cal-dots">';
      const show = txs.slice(0, 3);
      show.forEach(t => {
        dotsHtml += `<span class="cal-dot cal-dot-${t.type === 'income' ? 'income' : 'expense'}"></span>`;
      });
      if (txs.length > 3) {
        dotsHtml += `<span class="cal-dot-more">+${txs.length - 3}</span>`;
      }
      dotsHtml += '</div>';
    }

    if (dow === 0 && dayCount > 0) html += '</tr><tr>';
    html += `<td class="${cls}" onclick="selectDate('${dateStr}')">
      <span class="cal-date">${d}</span>
      ${dotsHtml}
    </td>`;
    dayCount++;
  }

  const remaining = 7 - (dayCount % 7);
  if (remaining < 7) {
    for (let i = 1; i <= remaining; i++) {
      const dow = (dayCount) % 7;
      html += `<td class="cal-cell other-month${dow === 6 ? ' sat' : ''}"><span class="cal-date">${i}</span></td>`;
      dayCount++;
    }
  }

  html += '</tr></tbody>';
  document.getElementById('calTable').innerHTML = html;
}

// ── 날짜 선택 ──
function selectDate(dateStr) {
  if (selectedDate === dateStr) {
    selectedDate = null;
    closeDetail();
    renderCalendar();
    return;
  }
  selectedDate = dateStr;
  renderCalendar();
  renderDetail(dateStr);
  document.getElementById('detailPanel').style.display = 'block';
  document.getElementById('detailPanel').scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

// ── 날짜 상세 ──
function renderDetail(dateStr) {
  const txs = getDateData(dateStr);
  const [y, m, d] = dateStr.split('-');
  const dateObj = new Date(dateStr);
  const dayNames = ['일', '월', '화', '수', '목', '금', '토'];

  document.getElementById('detailDateLabel').textContent =
    `${parseInt(m)}월 ${parseInt(d)}일 ${dayNames[dateObj.getDay()]}요일`;

  if (!txs.length) {
    document.getElementById('detailBody').innerHTML =
      `<p style="font-size:13px;color:var(--gray-400);text-align:center;padding:32px 0;">이 날은 거래 내역이 없습니다</p>`;
    return;
  }

  const income  = txs.filter(t => t.type === 'income').reduce((s, t) => s + Number(t.amount), 0);
  const expense = txs.filter(t => t.type === 'expense').reduce((s, t) => s + Number(t.amount), 0);
  const net     = income - expense;

  let html = txs.map(t => `
    <div class="detail-item">
      <div class="detail-left">
        <span class="detail-dot" style="background:${t.type === 'income' ? '#059669' : 'var(--error)'}"></span>
        <div>
          <div class="detail-desc">${t.desc}</div>
          <select class="app-select" style="font-size:11px;height:24px;padding:0 6px;margin-top:3px;width:100px;" onchange="updateCategory('${t.id}', this.value, '${selectedDate}')">
            <option value="식비" ${t.category==='식비'?'selected':''}> 식비</option>
            <option value="교통" ${t.category==='교통'?'selected':''}> 교통</option>
            <option value="쇼핑" ${t.category==='쇼핑'?'selected':''}> 쇼핑</option>
            <option value="문화" ${t.category==='문화'?'selected':''}> 문화·여가</option>
            <option value="의료" ${t.category==='의료'?'selected':''}> 의료·건강</option>
            <option value="통신" ${t.category==='통신'?'selected':''}> 통신</option>
            <option value="급여" ${t.category==='급여'?'selected':''}> 급여</option>
            <option value="기타" ${t.category==='기타'?'selected':''}> 기타</option>
          </select>
        </div>
      </div>
      <span class="detail-amount ${t.type === 'income' ? 'amount-income' : 'amount-expense'}">
        ${t.type === 'income' ? '+' : '-'}${fmt(t.amount)}
      </span>
    </div>
  `).join('');

  html += `
    <div class="detail-total">
      <span>일일 합계</span>
      <span class="${net >= 0 ? 'amount-income' : 'amount-expense'}">${net >= 0 ? '+' : '-'}${fmt(Math.abs(net))}</span>
    </div>`;

  document.getElementById('detailBody').innerHTML = html;
}

// ── 월 이동 ──
function changeMonth(dir) {
  currentMonth.setMonth(currentMonth.getMonth() + dir);
  selectedDate = null;
  closeDetail();
  refresh();
}

// ── 전체 새로고침 ──
function refresh() {
  const data = getMonthData();
  renderSummary(data);
  renderCalendar();
}

// ── 내역 추가 모달 ──
function openAddModal() {
  const today = new Date().toISOString().split('T')[0];
  document.getElementById('txDate').value     = selectedDate || today;
  document.getElementById('txDesc').value     = '';
  document.getElementById('txAmount').value   = '';
  document.getElementById('txCategory').value = '식비';
  document.getElementById('typeExpense').checked = true;
  document.getElementById('addModal').classList.add('open');
}

function closeModal(id) {
  document.getElementById(id).classList.remove('open');
}

function saveTransaction() {
  const type     = document.querySelector('input[name="txType"]:checked')?.value || 'expense';
  const date     = document.getElementById('txDate').value;
  const desc     = document.getElementById('txDesc').value.trim();
  const amount   = Number(document.getElementById('txAmount').value);
  const category = document.getElementById('txCategory').value;

  if (!date || !desc || !amount) return alert('모든 항목을 입력해주세요.');

  Storage.addTransaction({ type, date, desc, amount, category });
  closeModal('addModal');
  refresh();
  if (selectedDate) renderDetail(selectedDate);
}
function guessCategory(desc) {
  const d = desc.toLowerCase();
  if (/스타벅스|커피|카페|맥도날드|버거킹|식당|점심|저녁|배달|음식|마트|이마트|홈플|gs25|cu|편의점/.test(d)) return '식비';
  if (/지하철|버스|택시|카카오택시|기차|ktx|교통/.test(d)) return '교통';
  if (/쿠팡|무신사|올리브영|쇼핑|의류|패션|아마존/.test(d)) return '쇼핑';
  if (/넷플릭스|cgv|영화|공연|문화|게임|유튜브/.test(d)) return '문화';
  if (/병원|약국|의료|건강|헬스|피트니스/.test(d)) return '의료';
  if (/통신|핸드폰|인터넷|kt|skt|lgu/.test(d)) return '통신';
  if (/급여|월급|보너스/.test(d)) return '급여';
  return '기타';
}
function openCSVModal() {
  document.getElementById('csvModal').classList.add('open');
}

function handleCSVUpload(file) {
  if (!file) return;
  const reader = new FileReader();
  reader.onload = function(e) {
    const lines = e.target.result.replace(/^\uFEFF/, '').replace(/\r/g, '').split('\n').filter(l => l.trim());
    let count = 0;

    lines.forEach((line, idx) => {
      if (idx === 0) return;
      const cols = line.split(',').map(c => c.trim().replace(/"/g, ''));
      if (cols.length < 3) return;

      let dateStr = cols[0];
      const desc = cols[1] || '가져온 내역';
      const rawAmount = cols[2].replace(/[^0-9-]/g, '');
      const amount = Math.abs(parseInt(rawAmount));

      if (!amount) return;

      dateStr = dateStr.replace(/\./g, '-').replace(/\//g, '-');
      if (!/^\d{4}-\d{2}-\d{2}/.test(dateStr)) return;
      dateStr = dateStr.slice(0, 10);

      const type = parseInt(rawAmount) >= 0 ? 'income' : 'expense';
      const category = guessCategory(desc);

      const existing = Storage.getLedger();
      const isDuplicate = existing.some(t =>
        t.date === dateStr && t.desc === desc && Number(t.amount) === amount && t.type === type
      );
      if (!isDuplicate) {
        Storage.addTransaction({ type, date: dateStr, desc, amount, category });
        count++;
      }
    });

    closeModal('csvModal');
    refresh();
    alert(`${count}건의 내역을 가져왔어요.`);
  };
  reader.readAsText(file, 'UTF-8');
}

// ── 초기화 ──
document.addEventListener('DOMContentLoaded', () => {
  if (!Storage.isLoggedIn()) { window.location.href = 'index.html'; return; }

  const user = Storage.getUser();
  if (user) {
    document.getElementById('sidebarAvatar').textContent = (user.email || 'U')[0].toUpperCase();
    document.getElementById('sidebarEmail').textContent  = user.email || '';
  }

  refresh();
});
function updateCategory(id, category, dateStr) {
  Storage.updateTransaction(id, { category });
  refresh();
  renderDetail(dateStr);
}
function closeDetail() {
  document.getElementById('detailPanel').style.display = 'none';
  document.getElementById('detailDateLabel').textContent = '';
  document.getElementById('detailBody').innerHTML = '';
}