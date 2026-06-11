/* ── onboarding.js · onboarding 페이지 전용 스크립트 ── */

let currentStep = 1;
  let selectedCategories = [];
  let selectedMethod = null;

  // Input method selection
  document.querySelectorAll('.input-method-item').forEach(item => {
    item.addEventListener('click', () => {
      document.querySelectorAll('.input-method-item').forEach(i => {
        i.style.borderColor = 'var(--gray-200)';
        i.style.background = 'white';
      });
      item.style.borderColor = 'var(--indigo-500)';
      item.style.background = 'var(--indigo-50)';
      selectedMethod = item.dataset.method;
      const errEl = document.getElementById('methodError');
      if (errEl) errEl.style.display = 'none';
    });
  });

  // Category selection
  document.querySelectorAll('.category-item').forEach(item => {
    item.addEventListener('click', () => {
      const cat = item.dataset.cat;
      if (item.classList.contains('selected')) {
        item.classList.remove('selected');
        selectedCategories = selectedCategories.filter(c => c !== cat);
      } else {
        if (selectedCategories.length >= 3) return;
        item.classList.add('selected');
        selectedCategories.push(cat);
      }
      document.getElementById('selectedCount').textContent = selectedCategories.length + ' / 3';
      const nextBtn = document.getElementById('step2Next');
      if (selectedCategories.length > 0) {
        nextBtn.disabled = false;
        nextBtn.style.opacity = '1';
        nextBtn.style.cursor = 'pointer';
      } else {
        nextBtn.disabled = true;
        nextBtn.style.opacity = '0.4';
        nextBtn.style.cursor = 'not-allowed';
      }
    });
  });

  // Email toggle
  document.getElementById('emailToggle').addEventListener('change', function() {
    document.getElementById('emailSettings').style.opacity = this.checked ? '1' : '0.4';
    document.getElementById('emailSettings').style.pointerEvents = this.checked ? 'all' : 'none';
  });

  function goStep1Next() {
    if (!selectedMethod) {
      const errEl = document.getElementById('methodError');
      errEl.textContent = '입력 방식을 선택해주세요.';
      errEl.style.display = 'block';
      return;
    }
    document.getElementById('methodError').style.display = 'none';
    goStep(2);
  }

  function goStep(n) {
    document.getElementById('step' + currentStep).style.display = 'none';
    document.getElementById('step' + n).style.display = 'block';
    updateStepIndicator(n);
    currentStep = n;
  }

  function updateStepIndicator(n) {
    for (let i = 1; i <= 3; i++) {
      const dot = document.getElementById('dot' + i);
      dot.className = 'step-dot';
      if (i < n) dot.classList.add('done'), dot.textContent = '✓';
      else if (i === n) dot.classList.add('active'), dot.textContent = i;
      else dot.textContent = i;
    }
    for (let i = 1; i <= 2; i++) {
      const conn = document.getElementById('conn' + i);
      conn.className = 'step-connector' + (i < n ? ' done' : '');
    }
  }

  function finishOnboarding() {
    Storage.setCategories(selectedCategories.slice(0, 3));
    Storage.setEmailSubscription(document.getElementById('emailToggle').checked);
    if (selectedMethod) localStorage.setItem('sl_input_method', selectedMethod);
    window.location.href = 'feed.html';
  }

  document.addEventListener('DOMContentLoaded', () => {
    if (!Storage.isLoggedIn()) window.location.href = 'index.html';
    const user = Storage.getUser();
    if (user) document.getElementById('receiveEmail').value = user.email || '';
  });