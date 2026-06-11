/* ── mypage.js · mypage 페이지 전용 스크립트 ── */

function closeModal(id) { document.getElementById(id).classList.remove('open'); }
function openChangeEmailModal() { document.getElementById('emailModal').classList.add('open'); }
function openChangePwModal() { document.getElementById('pwModal').classList.add('open'); }

let _toastTimer = null;
function showToast(msg, duration = 2000) {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.style.opacity='1';
  t.style.transform='translateX(-50%) translateY(0)';
  if (_toastTimer) clearTimeout(_toastTimer);
  _toastTimer = setTimeout(()=>{ t.style.opacity='0'; t.style.transform='translateX(-50%) translateY(20px)'; }, duration);
}

function saveEmail() {
  const email = document.getElementById('newEmail').value.trim();
  if (!email) return;
  const user = Storage.getUser();
  if (user) { user.email = email; Storage.setUser(user); }
  closeModal('emailModal');
  showToast('이메일이 변경됐어요 ✓');
  loadUserInfo();
}

function savePassword() {
  const pw = document.getElementById('newPw').value;
  const confirm = document.getElementById('newPwConfirm').value;
  if (pw !== confirm || pw.length < 8) { showToast('비밀번호를 확인해주세요'); return; }
  closeModal('pwModal');
  showToast('비밀번호가 변경됐어요 ✓');
}

function exportData() {
  const ledger = Storage.getLedger();
  if (!ledger.length) { showToast('내보낼 데이터가 없어요'); return; }
  const csv = '날짜,구분,내용,카테고리,금액\n' + ledger.map(t =>
    `${t.date},${t.type==='income'?'수입':'지출'},${t.desc},${t.category},${t.amount}`
  ).join('\n');
  const blob = new Blob(['\uFEFF'+csv], { type:'text/csv;charset=utf-8;' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'spendletter_export.csv';
  a.click();
}

function confirmReset() {
  if (confirm('정말 모든 데이터를 초기화할까요? 이 작업은 되돌릴 수 없어요.')) {
    localStorage.removeItem('sl_ledger');
    localStorage.removeItem('sl_categories');
    localStorage.removeItem('sl_last_analysis');
    showToast('데이터가 초기화됐어요');
  }
}

function loadUserInfo() {
  const user = Storage.getUser();
  if (!user) return;
  const initials = (user.email||'U')[0].toUpperCase();
  document.getElementById('sidebarAvatar').textContent = initials;
  document.getElementById('sidebarEmail').textContent = user.email||'';
  document.getElementById('profileAvatar').textContent = initials;
  document.getElementById('profileEmail').textContent = (user.name || user.email || '') + '님';
  document.getElementById('currentEmailDisplay').textContent = '현재: ' + (user.email||'');

  const joined = new Date(user.createdAt||Date.now());
  document.getElementById('profileJoined').textContent = '가입일: ' + joined.getFullYear() + '.' + String(joined.getMonth()+1).padStart(2,'0') + '.' + String(joined.getDate()).padStart(2,'0');

  const cats = Storage.getCategories();
  const txs  = Storage.getLedger();
  document.getElementById('catCount').textContent = '카테고리 ' + cats.length + '개';
  document.getElementById('txCount').textContent  = '거래내역 ' + txs.length + '건';

  // 지시문 3 — 꾸준함 뱃지: 거래 기록된 고유 날짜 수
  const uniqueDays = new Set(txs.map(t => t.date)).size;
  document.getElementById('dayCount').textContent = '기록 ' + uniqueDays + '일';

  // 지시문 1 — 이번 달 지출
  const now = new Date();
  const monthExpense = txs
    .filter(t => { const d = new Date(t.date); return t.type === 'expense' && d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth(); })
    .reduce((s, t) => s + Number(t.amount), 0);

  function fmtStat(n) {
    if (n >= 100000000) return Math.round(n / 100000000) + '억';
    if (n >= 10000)     return Math.round(n / 10000) + '만원';
    return '₩' + n.toLocaleString('ko-KR');
  }
  document.getElementById('statMonthExpense').textContent = fmtStat(monthExpense);

  // 지시문 1 — 최다 소비 카테고리
  const catSum = txs.filter(t => t.type === 'expense').reduce((acc, t) => {
    acc[t.category] = (acc[t.category] || 0) + Number(t.amount); return acc;
  }, {});
  const topCat = Object.entries(catSum).sort((a, b) => b[1] - a[1])[0];
  document.getElementById('statTopCat').textContent = topCat ? topCat[0] : '-';

  // 지시문 1 — 받은 뉴스레터 수 / 없으면 누적 거래 건수
  const nlCount = parseInt(localStorage.getItem('sl_newsletter_count') || '0');
  const statTotalEl = document.getElementById('statTotal');
  if (nlCount > 0) {
    statTotalEl.previousElementSibling.textContent = '뉴스레터';
    statTotalEl.textContent = nlCount + '통';
  } else {
    statTotalEl.textContent = txs.length + '건';
  }

  document.getElementById('emailNewsToggle').checked = Storage.getEmailSubscription();
}

document.addEventListener('DOMContentLoaded', () => {
  if (!Storage.isLoggedIn()) { window.location.href='index.html'; return; }
  loadUserInfo();

  document.getElementById('emailNewsToggle').addEventListener('change', function() {
    Storage.setEmailSubscription(this.checked);
    showToast(this.checked ? '이메일 수신이 활성화됐어요' : '이메일 수신이 중단됐어요');
  });
});

async function sendNewsletterNow() {
  const user = Storage.getUser();
  if (!user) return;

  const cats = Storage.getCategories();
  if (!cats.length) { showToast('카테고리를 먼저 설정해주세요'); return; }

  const sendTimeVal = document.getElementById('sendTimeSelect').value;
  const hour = parseInt(sendTimeVal);
  const sendTimeLabel = hour < 12 ? `오전 ${hour || 12}시` : `오후 ${hour === 12 ? 12 : hour - 12}시`;

  const today = new Date();
  const days = ['일', '월', '화', '수', '목', '금', '토'];
  const todayDate = `${today.getFullYear()}년 ${today.getMonth()+1}월 ${today.getDate()}일 ${days[today.getDay()]}요일`;

  const categoriesStr = cats.join(', ');

  showToast('발송 중...');

  try {
    const res = await fetch('/api/send-email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        to_email: user.email,
        user_name: user.name || user.email.split('@')[0],
        today_date: todayDate,
        categories: categoriesStr,
        send_time: sendTimeLabel,
        app_url: window.location.origin + '/feed.html'
      })
    });

    if (res.ok) {
      showToast('이메일이 발송됐어요 ✓');
      const cnt = parseInt(localStorage.getItem('sl_newsletter_count') || '0') + 1;
      localStorage.setItem('sl_newsletter_count', cnt);
      loadUserInfo();
    } else {
      const errData = await res.json().catch(() => ({}));
      showToast(errData.error || '발송에 실패했어요', 4000);
    }
  } catch (e) {
    showToast('네트워크 오류: ' + e.message, 4000);
  }
}