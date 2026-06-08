/* ── login.js · login 페이지 전용 스크립트 ── */

function showErr(id, msg) { const el = document.getElementById(id); if (el) el.textContent = msg; }
function setInputState(id, state) {
  const el = document.getElementById(id);
  if (!el) return;
  el.classList.remove('input-error','input-success');
  if (state === 'error') el.classList.add('input-error');
  if (state === 'success') el.classList.add('input-success');
}

// 비밀번호 토글
document.getElementById('togglePw').addEventListener('click', () => {
  const input = document.getElementById('password');
  const isPassword = input.type === 'password';
  input.type = isPassword ? 'text' : 'password';
  document.getElementById('togglePw').textContent = isPassword ? '숨기기' : '보기';
});

// 폼 제출
document.getElementById('loginForm').addEventListener('submit', function(e) {
  e.preventDefault();
  const email    = document.getElementById('email').value.trim();
  const password = document.getElementById('password').value;

  let hasError = false;

  if (!email) {
    showErr('emailError', '이메일을 입력해주세요.');
    setInputState('email', 'error');
    hasError = true;
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    showErr('emailError', '올바른 이메일 형식이 아닙니다.');
    setInputState('email', 'error');
    hasError = true;
  } else {
    showErr('emailError', '');
    setInputState('email', 'success');
  }

  if (!password) {
    showErr('passwordError', '비밀번호를 입력해주세요.');
    setInputState('password', 'error');
    hasError = true;
  } else {
    showErr('passwordError', '');
    setInputState('password', 'success');
  }

  if (hasError) return;

  const result = Storage.login(email, password);
  if (!result.success) {
    const errEl = document.getElementById('globalError');
    errEl.textContent = result.error;
    errEl.style.display = 'block';
    setInputState('email', 'error');
    setInputState('password', 'error');
    return;
  }

  document.getElementById('globalError').style.display = 'none';
  document.getElementById('globalSuccess').textContent = '로그인 성공! 잠시 후 이동합니다...';
  document.getElementById('globalSuccess').style.display = 'block';

  setTimeout(() => { window.location.href = 'feed.html'; }, 800);
});

document.addEventListener('DOMContentLoaded', () => {
  if (Storage.isLoggedIn()) window.location.href = 'feed.html';
});