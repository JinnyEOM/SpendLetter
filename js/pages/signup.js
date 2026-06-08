/* ── signup.js · signup 페이지 전용 스크립트 ── */

// ── 유효성 검사 ──
function validateName(val, label) {
  if (!val.trim()) return label + '을(를) 입력해주세요.';
  if (val.trim().length < 1) return '올바른 이름을 입력해주세요.';
  return '';
}
function validateEmail(email) {
  if (!email) return '이메일을 입력해주세요.';
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return '올바른 이메일 형식이 아닙니다.';
  return '';
}
function validatePassword(pw) {
  if (!pw) return '비밀번호를 입력해주세요.';
  if (pw.length < 8) return '8자 이상 입력해주세요.';
  if (!/[a-zA-Z]/.test(pw)) return '영문자를 포함해야 합니다.';
  if (!/[0-9]/.test(pw)) return '숫자를 포함해야 합니다.';
  return '';
}
function validateConfirm(pw, confirm) {
  if (!confirm) return '비밀번호 확인을 입력해주세요.';
  if (pw !== confirm) return '비밀번호가 일치하지 않습니다.';
  return '';
}

function showErr(id, msg) { const el = document.getElementById(id); if (el) el.textContent = msg; }
function setInputState(id, state) {
  const el = document.getElementById(id);
  if (!el) return;
  el.classList.remove('input-error','input-success');
  if (state === 'error') el.classList.add('input-error');
  if (state === 'success') el.classList.add('input-success');
}

// ── 비밀번호 강도 ──
function getPasswordStrength(pw) {
  let score = 0;
  if (pw.length >= 8) score++;
  if (pw.length >= 12) score++;
  if (/[A-Z]/.test(pw)) score++;
  if (/[^a-zA-Z0-9]/.test(pw)) score++;
  return score;
}

function updatePwStrength(pw) {
  const wrap = document.getElementById('pwStrength');
  if (!pw) { wrap.style.display = 'none'; return; }
  wrap.style.display = 'flex';
  const score = getPasswordStrength(pw);
  const colors = ['#EF4444','#F59E0B','#3B82F6','#10B981'];
  const labels = ['취약','보통','강함','매우 강함'];
  const color = colors[Math.min(score-1, 3)] || '#E5E7EB';
  for (let i = 1; i <= 4; i++) {
    document.getElementById('bar' + i).style.background = i <= score ? color : 'var(--gray-200)';
  }
  const label = document.getElementById('pwLabel');
  label.textContent = score > 0 ? labels[Math.min(score-1, 3)] : '';
  label.style.color = score > 0 ? color : 'var(--gray-400)';
}

// ── 토글 비밀번호 ──
function setupToggle(btnId, inputId) {
  document.getElementById(btnId)?.addEventListener('click', () => {
    const input = document.getElementById(inputId);
    const isPassword = input.type === 'password';
    input.type = isPassword ? 'text' : 'password';
    document.getElementById(btnId).textContent = isPassword ? '숨기기' : '보기';
  });
}

// ── 전체 동의 ──
document.getElementById('agreeAll').addEventListener('change', function() {
  document.querySelectorAll('.term-item').forEach(cb => cb.checked = this.checked);
});
document.querySelectorAll('.term-item').forEach(cb => {
  cb.addEventListener('change', () => {
    const all = document.querySelectorAll('.term-item');
    document.getElementById('agreeAll').checked = [...all].every(c => c.checked);
  });
});

// ── 실시간 유효성 ──
document.getElementById('lastName').addEventListener('input', function() {
  const err = validateName(this.value, '성');
  showErr('lastNameError', err);
  setInputState('lastName', err ? 'error' : this.value ? 'success' : '');
});
document.getElementById('firstName').addEventListener('input', function() {
  const err = validateName(this.value, '이름');
  showErr('firstNameError', err);
  setInputState('firstName', err ? 'error' : this.value ? 'success' : '');
});
document.getElementById('email').addEventListener('input', function() {
  const err = validateEmail(this.value.trim());
  showErr('emailError', err);
  setInputState('email', err ? 'error' : this.value ? 'success' : '');
});
document.getElementById('password').addEventListener('input', function() {
  updatePwStrength(this.value);
  const err = validatePassword(this.value);
  showErr('passwordError', err);
  setInputState('password', err ? 'error' : this.value ? 'success' : '');
  const confirm = document.getElementById('passwordConfirm');
  if (confirm.value) {
    const cErr = validateConfirm(this.value, confirm.value);
    showErr('passwordConfirmError', cErr);
    setInputState('passwordConfirm', cErr ? 'error' : 'success');
  }
});
document.getElementById('passwordConfirm').addEventListener('input', function() {
  const err = validateConfirm(document.getElementById('password').value, this.value);
  showErr('passwordConfirmError', err);
  setInputState('passwordConfirm', err ? 'error' : this.value ? 'success' : '');
});

// ── 제출 ──
document.getElementById('signupForm').addEventListener('submit', function(e) {
  e.preventDefault();

  const lastName  = document.getElementById('lastName').value.trim();
  const firstName = document.getElementById('firstName').value.trim();
  const email     = document.getElementById('email').value.trim();
  const password  = document.getElementById('password').value;
  const confirm   = document.getElementById('passwordConfirm').value;

  const e1 = validateName(lastName, '성');
  const e2 = validateName(firstName, '이름');
  const e3 = validateEmail(email);
  const e4 = validatePassword(password);
  const e5 = validateConfirm(password, confirm);

  showErr('lastNameError', e1);  setInputState('lastName', e1 ? 'error' : 'success');
  showErr('firstNameError', e2); setInputState('firstName', e2 ? 'error' : 'success');
  showErr('emailError', e3);     setInputState('email', e3 ? 'error' : 'success');
  showErr('passwordError', e4);  setInputState('password', e4 ? 'error' : 'success');
  showErr('passwordConfirmError', e5); setInputState('passwordConfirm', e5 ? 'error' : 'success');

  const agreeService = document.getElementById('agreeService').checked;
  const agreePrivacy = document.getElementById('agreePrivacy').checked;
  if (!agreeService || !agreePrivacy) {
    showErr('termsError', '필수 약관에 동의해주세요.');
    if (e1 || e2 || e3 || e4 || e5) return;
  } else {
    showErr('termsError', '');
  }

  if (e1 || e2 || e3 || e4 || e5 || !agreeService || !agreePrivacy) return;

  // Storage 등록
  const result = Storage.register({
    email,
    password,
    name: lastName + firstName
  });

  if (!result.success) {
    const errEl = document.getElementById('globalError');
    errEl.textContent = result.error;
    errEl.style.display = 'block';
    setInputState('email', 'error');
    showErr('emailError', result.error);
    return;
  }

  // 성공 → 온보딩으로
  window.location.href = 'onboarding.html';
});

setupToggle('togglePw', 'password');
setupToggle('togglePwConfirm', 'passwordConfirm');

document.addEventListener('DOMContentLoaded', () => {
  if (Storage.isLoggedIn()) window.location.href = 'feed.html';
});
// ── 약관 모달 ──
const TERM_CONTENT = {
  service: {
    title: '서비스 이용약관',
    checkboxId: 'agreeService',
    body: `
      <h3 style="font-size:15px;font-weight:700;color:var(--gray-800);margin-bottom:12px;">제1조 (목적)</h3>
      <p>본 약관은 SpendLetter(이하 "회사")가 제공하는 소비 패턴 기반 뉴스레터 서비스(이하 "서비스")의 이용과 관련하여 회사와 이용자 간의 권리, 의무 및 책임사항을 규정함을 목적으로 합니다.</p>

      <h3 style="font-size:15px;font-weight:700;color:var(--gray-800);margin:20px 0 12px;">제2조 (서비스 내용)</h3>
      <p>회사는 이용자의 소비 내역을 분석하여 맞춤형 뉴스 카테고리를 추천하고, 해당 카테고리의 뉴스를 이메일로 제공합니다. 서비스의 구체적인 내용은 다음과 같습니다.</p>
      <ul style="margin:10px 0 10px 16px;display:flex;flex-direction:column;gap:6px;">
        <li>가계부 데이터 입력 및 AI 소비 패턴 분석</li>
        <li>뉴스 카테고리 자동 추천 (TOP 3)</li>
        <li>맞춤형 뉴스레터 이메일 발송</li>
        <li>마이 피드 뉴스 열람 서비스</li>
      </ul>

      <h3 style="font-size:15px;font-weight:700;color:var(--gray-800);margin:20px 0 12px;">제3조 (이용자의 의무)</h3>
      <p>이용자는 다음 행위를 해서는 안 됩니다.</p>
      <ul style="margin:10px 0 10px 16px;display:flex;flex-direction:column;gap:6px;">
        <li>타인의 정보 도용 또는 허위 정보 등록</li>
        <li>서비스의 정상적인 운영을 방해하는 행위</li>
        <li>회사의 지식재산권 침해 행위</li>
        <li>기타 관련 법령에 위반되는 행위</li>
      </ul>

      <h3 style="font-size:15px;font-weight:700;color:var(--gray-800);margin:20px 0 12px;">제4조 (서비스 제공 및 변경)</h3>
      <p>회사는 서비스를 연중무휴 24시간 제공함을 원칙으로 합니다. 단, 시스템 점검이나 기술적 문제 발생 시 서비스가 일시 중단될 수 있으며, 이 경우 사전 공지합니다.</p>

      <h3 style="font-size:15px;font-weight:700;color:var(--gray-800);margin:20px 0 12px;">제5조 (면책조항)</h3>
      <p>회사는 이용자가 서비스를 이용하여 기대하는 수익을 얻지 못하거나 손실을 입은 것에 대해 책임을 지지 않습니다. 제공되는 뉴스 정보는 참고용이며 투자 등의 판단 기준으로 사용해서는 안 됩니다.</p>

      <p style="margin-top:20px;color:var(--gray-400);font-size:12px;">시행일: 2026년 1월 1일</p>
    `
  },
  privacy: {
    title: '개인정보 처리방침',
    checkboxId: 'agreePrivacy',
    body: `
      <h3 style="font-size:15px;font-weight:700;color:var(--gray-800);margin-bottom:12px;">1. 수집하는 개인정보 항목</h3>
      <p>회사는 서비스 제공을 위해 다음과 같은 개인정보를 수집합니다.</p>
      <ul style="margin:10px 0 10px 16px;display:flex;flex-direction:column;gap:6px;">
        <li><strong>필수 항목:</strong> 이메일 주소, 이름, 비밀번호(암호화 저장)</li>
        <li><strong>선택 항목:</strong> 소비 내역 데이터, 뉴스 카테고리 설정</li>
        <li><strong>자동 수집:</strong> 서비스 이용 기록, 접속 로그</li>
      </ul>

      <h3 style="font-size:15px;font-weight:700;color:var(--gray-800);margin:20px 0 12px;">2. 개인정보의 이용 목적</h3>
      <ul style="margin:10px 0 10px 16px;display:flex;flex-direction:column;gap:6px;">
        <li>회원 가입 및 본인 확인</li>
        <li>소비 패턴 분석 및 맞춤 뉴스 추천</li>
        <li>뉴스레터 이메일 발송</li>
        <li>서비스 개선 및 신규 기능 개발</li>
        <li>고객 문의 대응</li>
      </ul>

      <h3 style="font-size:15px;font-weight:700;color:var(--gray-800);margin:20px 0 12px;">3. 개인정보의 보유 및 이용 기간</h3>
      <p>회원 탈퇴 시까지 보유하며, 탈퇴 즉시 지체 없이 파기합니다. 단, 관련 법령에 의해 보존이 필요한 경우 해당 기간 동안 보관합니다.</p>

      <h3 style="font-size:15px;font-weight:700;color:var(--gray-800);margin:20px 0 12px;">4. 개인정보의 제3자 제공</h3>
      <p>회사는 원칙적으로 이용자의 개인정보를 외부에 제공하지 않습니다. 단, 이용자의 동의가 있거나 법령에 의한 경우는 예외로 합니다.</p>

      <h3 style="font-size:15px;font-weight:700;color:var(--gray-800);margin:20px 0 12px;">5. 이용자의 권리</h3>
      <p>이용자는 언제든지 자신의 개인정보를 조회, 수정, 삭제할 수 있으며 개인정보 처리에 대한 동의를 철회할 수 있습니다. 관련 문의는 고객센터로 연락해 주세요.</p>

      <p style="margin-top:20px;color:var(--gray-400);font-size:12px;">시행일: 2026년 1월 1일</p>
    `
  },
  marketing: {
    title: '마케팅 정보 수신 동의',
    checkboxId: 'agreeMarketing',
    body: `
      <h3 style="font-size:15px;font-weight:700;color:var(--gray-800);margin-bottom:12px;">마케팅 정보 수신 동의 (선택)</h3>
      <p>SpendLetter의 새로운 기능, 이벤트, 혜택 등의 마케팅 정보를 이메일로 받아보실 수 있습니다.</p>

      <h3 style="font-size:15px;font-weight:700;color:var(--gray-800);margin:20px 0 12px;">발송되는 정보의 종류</h3>
      <ul style="margin:10px 0 10px 16px;display:flex;flex-direction:column;gap:6px;">
        <li>신규 기능 및 서비스 업데이트 안내</li>
        <li>이벤트 및 프로모션 정보</li>
        <li>소비 분석 인사이트 리포트</li>
        <li>개인화된 뉴스레터 추천 정보</li>
      </ul>

      <h3 style="font-size:15px;font-weight:700;color:var(--gray-800);margin:20px 0 12px;">수신 채널</h3>
      <p>이메일</p>

      <h3 style="font-size:15px;font-weight:700;color:var(--gray-800);margin:20px 0 12px;">동의 철회 방법</h3>
      <p>마케팅 수신 동의는 선택 사항이며, 마이페이지에서 언제든지 수신 거부할 수 있습니다. 수신 거부 후에도 서비스 관련 필수 안내는 계속 발송될 수 있습니다.</p>

      <div style="margin-top:20px;padding:16px;background:var(--indigo-50);border-radius:10px;border:1px solid var(--indigo-100);">
        <p style="font-size:13px;color:var(--indigo-600);font-weight:500;">본 동의는 선택사항으로, 동의하지 않아도 서비스 이용에 제한이 없습니다.</p>
      </div>

      <p style="margin-top:20px;color:var(--gray-400);font-size:12px;">시행일: 2026년 1월 1일</p>
    `
  }
};

let currentTermType = null;

function openTermModal(type) {
  const term = TERM_CONTENT[type];
  if (!term) return;
  currentTermType = type;
  document.getElementById('termModalTitle').textContent = term.title;
  document.getElementById('termModalBody').innerHTML = term.body;
  document.getElementById('termModal').classList.add('open');
}

function closeTermModal() {
  document.getElementById('termModal').classList.remove('open');
  currentTermType = null;
}

function agreeAndClose() {
  if (!currentTermType) return;
  const checkboxId = TERM_CONTENT[currentTermType].checkboxId;
  const checkbox = document.getElementById(checkboxId);
  if (checkbox) checkbox.checked = true;
  // 전체 동의 체크박스 상태 업데이트
  const all = document.querySelectorAll('.term-item');
  document.getElementById('agreeAll').checked = [...all].every(c => c.checked);
  closeTermModal();
}
