/* ── nav.js · 공통 상단 네비게이션 컴포넌트 ── */

(function () {
  const NAV_ITEMS = [
    {
      href: 'feed.html',
      label: '마이 피드',
      icon: `<svg width="18" height="18" viewBox="0 0 18 18" fill="none"><rect x="2" y="2" width="6" height="6" rx="2" fill="currentColor" opacity="0.3"/><rect x="10" y="2" width="6" height="6" rx="2" fill="currentColor"/><rect x="2" y="10" width="6" height="6" rx="2" fill="currentColor"/><rect x="10" y="10" width="6" height="6" rx="2" fill="currentColor" opacity="0.3"/></svg>`,
    },
    {
      href: 'ledger.html',
      label: '가계부',
      icon: `<svg width="18" height="18" viewBox="0 0 18 18" fill="none"><rect x="2" y="3" width="14" height="12" rx="3" stroke="currentColor" stroke-width="1.5"/><path d="M5 7h8M5 10h5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>`,
    },
    {
      href: 'analysis.html',
      label: '소비 분석',
      icon: `<svg width="18" height="18" viewBox="0 0 18 18" fill="none"><path d="M3 14l4-5 3 3 5-6" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
    },
    {
      href: 'category.html',
      label: '카테고리',
      icon: `<svg width="18" height="18" viewBox="0 0 18 18" fill="none"><circle cx="5" cy="9" r="2" fill="currentColor"/><path d="M9 9h7" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/><circle cx="5" cy="5" r="2" fill="currentColor" opacity="0.4"/><path d="M9 5h7" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" opacity="0.4"/><circle cx="5" cy="13" r="2" fill="currentColor" opacity="0.4"/><path d="M9 13h7" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" opacity="0.4"/></svg>`,
    },
    {
      href: 'mypage.html',
      label: '마이 페이지',
      icon: `<svg width="18" height="18" viewBox="0 0 18 18" fill="none"><circle cx="9" cy="6" r="3" stroke="currentColor" stroke-width="1.5"/><path d="M3 15c0-3.314 2.686-5 6-5s6 1.686 6 5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>`,
    },
  ];

  function getActiveHref() {
    const parts = window.location.pathname.split('/');
    return parts[parts.length - 1] || 'feed.html';
  }

  function renderNav() {
    const root = document.getElementById('app-nav');
    if (!root) return;

    const active = getActiveHref();

    const tabsHTML = NAV_ITEMS.map(item =>
      `<a href="${item.href}" class="${item.href === active ? 'active' : ''}">${item.icon}${item.label}</a>`
    ).join('');

    const mobileHTML = NAV_ITEMS.map(item =>
      `<a href="${item.href}" class="${item.href === active ? 'active' : ''}">${item.icon}${item.label}</a>`
    ).join('');

    root.innerHTML = `
      <nav class="app-topnav">
        <a href="index.html" class="app-topnav-brand">
          <div class="nav-icon" style="width:32px;height:32px;">
            <svg width="16" height="16" viewBox="0 0 20 20" fill="none"><path d="M10 2L12.5 7.5H18L13.5 11L15.5 17L10 13.5L4.5 17L6.5 11L2 7.5H7.5L10 2Z" fill="white"/></svg>
          </div>
          <span class="app-topnav-name">SpendLetter</span>
        </a>

        <div class="app-topnav-tabs">${tabsHTML}</div>

        <div class="app-topnav-right">
          <div class="app-topnav-user">
            <button class="app-topnav-user-btn" id="navUserBtn" type="button">
              <div class="user-avatar" id="sidebarAvatar">U</div>
              <span class="app-topnav-user-email" id="sidebarEmail">user@email.com</span>
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none" style="flex-shrink:0;opacity:0.5;"><path d="M3 5l4 4 4-4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>
            </button>
            <div class="app-topnav-dropdown" id="navDropdown">
              <div class="dropdown-user-info">
                <small>계정</small>
                <span id="dropdownEmail">user@email.com</span>
              </div>
              <button class="dropdown-logout-btn" type="button" onclick="Storage.logout()">
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M5 2H3a1 1 0 0 0-1 1v8a1 1 0 0 0 1 1h2M9 10l3-3-3-3M12 7H5" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/></svg>
                로그아웃
              </button>
            </div>
          </div>
          <button class="app-topnav-hamburger" id="navHamburger" type="button">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><path d="M3 5h14M3 10h14M3 15h14" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg>
          </button>
        </div>
      </nav>

      <div class="app-mobile-menu" id="appMobileMenu">${mobileHTML}</div>
    `;

    updateUserInfo();
    bindEvents();
  }

  function updateUserInfo() {
    if (typeof Storage === 'undefined' || !Storage.getUser) return;
    const user = Storage.getUser();
    if (!user) return;

    const avatar = (user.email || 'U')[0].toUpperCase();
    const email = user.email || '';

    const avatarEl = document.getElementById('sidebarAvatar');
    const emailEl  = document.getElementById('sidebarEmail');
    const dropEl   = document.getElementById('dropdownEmail');

    if (avatarEl) avatarEl.textContent = avatar;
    if (emailEl)  emailEl.textContent  = email;
    if (dropEl)   dropEl.textContent   = email;
  }

  function bindEvents() {
    const userBtn    = document.getElementById('navUserBtn');
    const dropdown   = document.getElementById('navDropdown');
    const hamburger  = document.getElementById('navHamburger');
    const mobileMenu = document.getElementById('appMobileMenu');

    if (userBtn) {
      userBtn.addEventListener('click', function (e) {
        e.stopPropagation();
        dropdown.classList.toggle('open');
        mobileMenu.classList.remove('open');
      });
    }

    if (hamburger) {
      hamburger.addEventListener('click', function (e) {
        e.stopPropagation();
        mobileMenu.classList.toggle('open');
        dropdown.classList.remove('open');
      });
    }

    document.addEventListener('click', function () {
      dropdown?.classList.remove('open');
      mobileMenu?.classList.remove('open');
    });
  }

  // body 하단에서 로드되므로 DOM 요소는 이미 존재
  renderNav();
})();
