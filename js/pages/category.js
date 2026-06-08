/* ── category.js · category 페이지 전용 스크립트 ── */

const ALL_CATS = [
  { id:'경제·금융', icon:'📈', name:'경제·금융' },
  { id:'IT·테크', icon:'💻', name:'IT·테크' },
  { id:'부동산', icon:'🏠', name:'부동산' },
  { id:'건강·운동', icon:'🏃', name:'건강·운동' },
  { id:'음식·요리', icon:'🍽️', name:'음식·요리' },
  { id:'여행', icon:'✈️', name:'여행' },
  { id:'문화·엔터', icon:'🎭', name:'문화·엔터' },
  { id:'스포츠', icon:'⚽', name:'스포츠' },
  { id:'사회·정치', icon:'🌏', name:'사회·정치' },
];
const AI_RECO = ['경제·금융','음식·요리','IT·테크'];

let selected = [];

function renderAll() {
  // Selected list
  const list = document.getElementById('selectedList');
  const empty = document.getElementById('emptySelected');
  document.getElementById('selCount').textContent = selected.length;

  if (!selected.length) {
    list.innerHTML='';
    empty.style.display='block';
  } else {
    empty.style.display='none';
    list.innerHTML = selected.map((id,i) => {
      const cat = ALL_CATS.find(c=>c.id===id);
      return `<div style="display:flex;align-items:center;gap:12px;padding:14px 16px;background:white;border:2px solid var(--indigo-200);border-radius:12px;">
        <span style="width:32px;height:32px;background:var(--indigo-50);border-radius:8px;display:flex;align-items:center;justify-content:center;font-size:18px;flex-shrink:0;">${cat.icon}</span>
        <div style="flex:1;">
          <div style="font-size:14px;font-weight:700;color:var(--gray-800);">${cat.name}</div>
          <div style="font-size:11px;color:var(--indigo-500);">TOP ${i+1} 카테고리</div>
        </div>
        <button onclick="removeCategory('${id}')" style="width:28px;height:28px;background:var(--gray-100);border:none;border-radius:8px;cursor:pointer;font-size:14px;color:var(--gray-400);transition:all 0.15s;" onmouseover="this.style.background='#FEE2E2';this.style.color='var(--error)'" onmouseout="this.style.background='var(--gray-100)';this.style.color='var(--gray-400)'">×</button>
      </div>`;
    }).join('');
  }

  // Grid
  const grid = document.getElementById('allCategoryGrid');
  grid.innerHTML = ALL_CATS.map(cat => {
    const isSelected = selected.includes(cat.id);
    return `<div class="category-item ${isSelected?'selected':''}" onclick="toggleCategory('${cat.id}')">
      ${isSelected ? `<div style="width:18px;height:18px;background:var(--indigo-600);border-radius:50%;display:flex;align-items:center;justify-content:center;margin:0 auto 6px;font-size:10px;color:white;">✓</div>` : ''}
      <div class="category-item-icon">${cat.icon}</div>
      <div class="category-item-name">${cat.name}</div>
    </div>`;
  }).join('');
}

function toggleCategory(id) {
  if (selected.includes(id)) {
    selected = selected.filter(c=>c!==id);
  } else {
    if (selected.length >= 3) { showToast('최대 3개까지 선택할 수 있어요'); return; }
    selected.push(id);
  }
  renderAll();
}

function removeCategory(id) {
  selected = selected.filter(c=>c!==id);
  renderAll();
}

function applyAIRecommendation() {
  selected = [...AI_RECO];
  renderAll();
}

function saveCategories() {
  if (!selected.length) { showToast('최소 1개 카테고리를 선택해주세요'); return; }
  Storage.setCategories(selected);
  showToast('카테고리가 저장됐어요 ✓');
}

function showToast(msg) {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.style.opacity='1';
  t.style.transform='translateX(-50%) translateY(0)';
  setTimeout(()=>{ t.style.opacity='0'; t.style.transform='translateX(-50%) translateY(20px)'; }, 2000);
}

document.addEventListener('DOMContentLoaded', () => {
  if (!Storage.isLoggedIn()) { window.location.href='index.html'; return; }
  const user = Storage.getUser();
  if (user) {
    document.getElementById('sidebarAvatar').textContent=(user.email||'U')[0].toUpperCase();
    document.getElementById('sidebarEmail').textContent=user.email||'';
  }
  selected = Storage.getCategories().length ? Storage.getCategories() : [];
  renderAll();
});