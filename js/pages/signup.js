/* ── signup.js ── */

// ── 유효성 검사 함수 ──
function validateName(val) {
  if (!val.trim()) return '이름을 입력해주세요.';
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
  if (!/[^a-zA-Z0-9]/.test(pw)) return '특수문자를 포함해야 합니다.';
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
  el.classList.remove('input-error', 'input-success');
  if (state === 'error') el.classList.add('input-error');
  if (state === 'success') el.classList.add('input-success');
}

// ── 휴대폰 번호 자동 하이픈 ──
document.getElementById('phone').addEventListener('input', function() {
  const digits = this.value.replace(/\D/g, '').slice(0, 11);
  if (digits.length <= 3) this.value = digits;
  else if (digits.length <= 7) this.value = digits.slice(0,3) + '-' + digits.slice(3);
  else this.value = digits.slice(0,3) + '-' + digits.slice(3,7) + '-' + digits.slice(7);
  showErr('phoneError', '');
  if (otpVerified) { otpVerified = false; updateOtpVerifiedUI(false); }
});

// ── OTP 상태 ──
let otpVerified = false;
let otpTimerInterval = null;
let otpSecondsLeft = 0;

function updateOtpVerifiedUI(verified) {
  document.getElementById('otpVerified').style.display = verified ? 'flex' : 'none';
  if (!verified) document.getElementById('otpInput').value = '';
}

function sendOtp() {
  const digits = document.getElementById('phone').value.replace(/\D/g, '');
  if (digits.length < 10 || digits.length > 11) {
    showErr('phoneError', '올바른 휴대폰 번호를 입력해주세요.');
    setInputState('phone', 'error');
    return;
  }
  showErr('phoneError', '');
  setInputState('phone', 'success');

  // OTP 그룹 표시
  const group = document.getElementById('otpGroup');
  group.style.display = 'block';
  document.getElementById('otpInput').value = '';
  document.getElementById('otpError').textContent = '';
  document.getElementById('otpVerified').style.display = 'none';
  setInputState('otpInput', '');
  otpVerified = false;
  document.getElementById('sendOtpBtn').textContent = '재발송';

  // 타이머 시작
  clearInterval(otpTimerInterval);
  otpSecondsLeft = 180;
  renderTimer();
  otpTimerInterval = setInterval(() => {
    otpSecondsLeft--;
    renderTimer();
    if (otpSecondsLeft <= 0) {
      clearInterval(otpTimerInterval);
      if (!otpVerified) showErr('otpError', '인증번호가 만료됐어요. 재발송해주세요.');
    }
  }, 1000);
}

function renderTimer() {
  const m = Math.floor(otpSecondsLeft / 60);
  const s = otpSecondsLeft % 60;
  const el = document.getElementById('otpTimer');
  el.textContent = m + ':' + String(s).padStart(2, '0');
  el.style.color = otpSecondsLeft <= 30 ? '#EF4444' : '#4F46E5';
}

// OTP 입력 실시간 인증 (6자리 입력 시 자동 확인)
document.getElementById('otpInput').addEventListener('input', function() {
  this.value = this.value.replace(/\D/g, '');
  if (this.value.length === 6) {
    if (otpSecondsLeft <= 0) {
      showErr('otpError', '인증번호가 만료됐어요. 재발송해주세요.');
      setInputState('otpInput', 'error');
      return;
    }
    // 데모: 6자리 숫자면 인증 완료
    clearInterval(otpTimerInterval);
    otpVerified = true;
    document.getElementById('otpTimer').textContent = '';
    document.getElementById('otpVerified').style.display = 'flex';
    showErr('otpError', '');
    setInputState('otpInput', 'success');
  }
});

// ── 비밀번호 요구사항 체크리스트 ──
function updatePwRequirements(pw) {
  const wrap = document.getElementById('pwRequirements');
  if (!pw) { wrap.style.display = 'none'; return; }
  wrap.style.display = 'flex';

  const checks = {
    'req-length':  pw.length >= 8,
    'req-eng':     /[a-zA-Z]/.test(pw),
    'req-num':     /[0-9]/.test(pw),
    'req-special': /[^a-zA-Z0-9]/.test(pw),
  };

  Object.entries(checks).forEach(([id, met]) => {
    const el = document.getElementById(id);
    el.classList.toggle('met', met);
    // 아이콘 교체
    const icon = el.querySelector('.pw-req-icon');
    icon.innerHTML = met
      ? '<path d="M2 6l3 3 5-5" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/>'
      : '<circle cx="6" cy="6" r="5.5" stroke="currentColor" stroke-width="1.2"/>';
  });
}

// ── 비밀번호 토글 ──
function setupToggle(btnId, inputId) {
  document.getElementById(btnId)?.addEventListener('click', () => {
    const input = document.getElementById(inputId);
    const isPassword = input.type === 'password';
    input.type = isPassword ? 'text' : 'password';
    document.getElementById(btnId).textContent = isPassword ? '숨기기' : '보기';
  });
}

// ── 약관 체크 → 버튼 활성/비활성 ──
document.getElementById('agreeTerms').addEventListener('change', function() {
  document.getElementById('submitBtn').disabled = !this.checked;
});

// ── 실시간 유효성 ──
document.getElementById('nickname').addEventListener('input', function() {
  const err = validateName(this.value);
  showErr('nicknameError', err);
  setInputState('nickname', err ? 'error' : this.value ? 'success' : '');
});
document.getElementById('email').addEventListener('input', function() {
  const err = validateEmail(this.value.trim());
  showErr('emailError', err);
  setInputState('email', err ? 'error' : this.value ? 'success' : '');
});
document.getElementById('password').addEventListener('input', function() {
  updatePwRequirements(this.value);
  const err = validatePassword(this.value);
  showErr('passwordError', err);
  setInputState('password', err ? 'error' : this.value ? 'success' : '');
  // 확인란 동기화
  const confirm = document.getElementById('passwordConfirm');
  if (confirm.value) {
    const cErr = validateConfirm(this.value, confirm.value);
    showErr('passwordConfirmError', cErr);
    setInputState('passwordConfirm', cErr ? 'error' : 'success');
    document.getElementById('pwMatchOk').style.display = (!cErr && confirm.value) ? 'flex' : 'none';
  }
});
document.getElementById('passwordConfirm').addEventListener('input', function() {
  const err = validateConfirm(document.getElementById('password').value, this.value);
  showErr('passwordConfirmError', err);
  setInputState('passwordConfirm', err ? 'error' : this.value ? 'success' : '');
  document.getElementById('pwMatchOk').style.display = (!err && this.value) ? 'flex' : 'none';
});

// ── 제출 ──
document.getElementById('signupForm').addEventListener('submit', function(e) {
  e.preventDefault();

  const nickname = document.getElementById('nickname').value.trim();
  const email    = document.getElementById('email').value.trim();
  const password = document.getElementById('password').value;
  const confirm  = document.getElementById('passwordConfirm').value;

  const e1 = validateName(nickname);
  const e3 = validateEmail(email);
  const e4 = validatePassword(password);
  const e5 = validateConfirm(password, confirm);

  showErr('nicknameError', e1);        setInputState('nickname', e1 ? 'error' : 'success');
  showErr('emailError', e3);           setInputState('email', e3 ? 'error' : 'success');
  showErr('passwordError', e4);        setInputState('password', e4 ? 'error' : 'success');
  showErr('passwordConfirmError', e5); setInputState('passwordConfirm', e5 ? 'error' : 'success');

  if (!otpVerified) {
    showErr('phoneError', '휴대폰 본인 확인을 완료해주세요.');
    setInputState('phone', 'error');
  }

  const agreeTerms = document.getElementById('agreeTerms').checked;
  if (!agreeTerms) showErr('termsError', '약관에 동의해주세요.');
  else showErr('termsError', '');

  if (e1 || e3 || e4 || e5 || !otpVerified || !agreeTerms) return;

  const result = Storage.register({ email, password, name: nickname });

  if (!result.success) {
    const errEl = document.getElementById('globalError');
    errEl.textContent = result.error;
    errEl.style.display = 'block';
    setInputState('email', 'error');
    showErr('emailError', result.error);
    return;
  }

  window.location.href = 'onboarding.html';
});

setupToggle('togglePw', 'password');
setupToggle('togglePwConfirm', 'passwordConfirm');

document.addEventListener('DOMContentLoaded', () => {
  if (Storage.isLoggedIn()) window.location.href = 'feed.html';
});
