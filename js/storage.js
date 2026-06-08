/* ── storage.js · SpendLetter localStorage 관리 ── */

// ── storage.js · localStorage 관리 ──

const Storage = {

  // ── 회원 관리 ──
  setUser(user) {
    localStorage.setItem('sl_user', JSON.stringify(user));
  },

  getUser() {
    const data = localStorage.getItem('sl_user');
    return data ? JSON.parse(data) : null;
  },

  isLoggedIn() {
    return !!this.getUser();
  },

  // 회원가입: 이메일 중복 체크 후 저장
  register(userData) {
    const accounts = this.getAllAccounts();
    const exists = accounts.find(a => a.email === userData.email);
    if (exists) return { success: false, error: '이미 사용 중인 이메일이에요.' };
    const user = {
      email: userData.email,
      password: userData.password, // 실서비스에선 해시 처리 필요
      name: userData.name || '',
      createdAt: new Date().toISOString()
    };
    accounts.push(user);
    this.setAllAccounts(accounts);
    // 세션에 로그인 (비밀번호 제외 저장)
    this.setUser({ email: user.email, name: user.name, createdAt: user.createdAt });
    return { success: true };
  },

  // 로그인: 이메일+비밀번호 검증
  login(email, password) {
    const accounts = this.getAllAccounts();
    const user = accounts.find(a => a.email === email && a.password === password);
    if (!user) return { success: false, error: '이메일 또는 비밀번호가 올바르지 않아요.' };
    this.setUser({ email: user.email, name: user.name, createdAt: user.createdAt });
    return { success: true };
  },

  setAllAccounts(accounts) {
    localStorage.setItem('sl_accounts', JSON.stringify(accounts));
  },

  getAllAccounts() {
    const data = localStorage.getItem('sl_accounts');
    return data ? JSON.parse(data) : [];
  },

  logout() {
    localStorage.removeItem('sl_user');
    window.location.href = 'index.html';
  },

  // ── 카테고리 ──
  setCategories(categories) {
    if (categories.length > 3) { console.warn('카테고리는 최대 3개까지 저장 가능합니다.'); return false; }
    localStorage.setItem('sl_categories', JSON.stringify(categories));
    return true;
  },

  getCategories() {
    const data = localStorage.getItem('sl_categories');
    return data ? JSON.parse(data) : [];
  },

  // ── 가계부 ──
  setLedger(ledger) {
    localStorage.setItem('sl_ledger', JSON.stringify(ledger));
  },

  getLedger() {
    const data = localStorage.getItem('sl_ledger');
    return data ? JSON.parse(data) : [];
  },

  addTransaction(transaction) {
    const ledger = this.getLedger();
    transaction.id = Date.now().toString();
    transaction.createdAt = new Date().toISOString();
    ledger.push(transaction);
    this.setLedger(ledger);
    return transaction;
  },

  updateTransaction(id, updatedData) {
    const ledger = this.getLedger();
    const index = ledger.findIndex(t => t.id === id);
    if (index !== -1) { ledger[index] = { ...ledger[index], ...updatedData }; this.setLedger(ledger); return true; }
    return false;
  },

  deleteTransaction(id) {
    const ledger = this.getLedger();
    this.setLedger(ledger.filter(t => t.id !== id));
  },

  // ── 기타 ──
  setLastAnalysis(date) { localStorage.setItem('sl_last_analysis', date); },
  getLastAnalysis() { return localStorage.getItem('sl_last_analysis'); },
  setEmailSubscription(value) { localStorage.setItem('sl_email_subscription', value ? 'true' : 'false'); },
  getEmailSubscription() { return localStorage.getItem('sl_email_subscription') === 'true'; }
};