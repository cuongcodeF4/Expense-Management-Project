// ═══════════════════════════════════════════════
//  APP — Core state, navigation, utilities
// ═══════════════════════════════════════════════

let _txType = 'income';
let _chartRange = 12;
let _chartFrom = null;
let _chartTo = null;
let _charts = {};
let _deleteId = null;
let _dashYm = null;

const MONTHS_SHORT = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
const MONTHS_FULL = ['January','February','March','April','May','June','July','August','September','October','November','December'];

const CATEGORIES = {
  income: [
    { id: 'luong',      label: 'Salary',       icon: '💼' },
    { id: 'thuong',     label: 'Bonus',        icon: '🎁' },
    { id: 'dautư',      label: 'Investment',   icon: '📈' },
    { id: 'kinhdoanh',  label: 'Business',     icon: '🏪' },
    { id: 'khac_thu',   label: 'Other',        icon: '💰' },
  ],
  expense: [
    { id: 'anuong',     label: 'Food',         icon: '🍜' },
    { id: 'dichuyên',   label: 'Transport',    icon: '🚗' },
    { id: 'nhao',       label: 'Housing',      icon: '🏠' },
    { id: 'giaitri',    label: 'Entertainment',icon: '🎮' },
    { id: 'suckhoe',    label: 'Healthcare',   icon: '🏥' },
    { id: 'muasam',     label: 'Shopping',     icon: '🛒' },
    { id: 'giaoduc',    label: 'Education',    icon: '📚' },
    { id: 'thethao',    label: 'Sport',        icon: '⚽' },
    { id: 'banhuu',     label: 'Friends',      icon: '👫' },
    { id: 'huongthu',   label: 'Enjoy',        icon: '🎉' },
    { id: 'khac_chi',   label: 'Other',        icon: '💸' },
  ]
};

const ALL_CATS = [...CATEGORIES.income, ...CATEGORIES.expense];
const getCat = id => ALL_CATS.find(c => c.id === id) || { label: id, icon: '📌' };

// ── Init ──
async function initApp() {
  const dateEl = document.getElementById('f-date');
  if (dateEl) dateEl.value = new Date().toISOString().slice(0,10);

  const now = new Date();
  _dashYm = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}`;

  initChartDateRange(12);
  updateCurrentMonthLabel();
  populateCategorySelect();

  const fc = document.getElementById('filter-category');
  if (fc) {
    fc.innerHTML = '<option value="">All categories</option>';
    ALL_CATS.forEach(c => {
      const o = document.createElement('option');
      o.value = c.id;
      o.textContent = c.icon + ' ' + c.label;
      fc.appendChild(o);
    });
  }

  await loadAppData();

  initAmountInputFormatting();
  populateFilterOptions();
  populateDashMonthSelect();
  renderDashboard();
  renderBudget();
  renderExportStats();
}

function updateCurrentMonthLabel() {
  const now = new Date();
  const el = document.getElementById('current-month-label');
  if (el) el.textContent = MONTHS_SHORT[now.getMonth()] + ' ' + now.getFullYear();
}

function populateCategorySelect() {
  updateCategorySelect();
}

function updateCategorySelect() {
  const sel = document.getElementById('f-category');
  if (!sel) return;
  sel.innerHTML = '';
  CATEGORIES[_txType].forEach(c => {
    const o = document.createElement('option');
    o.value = c.id;
    o.textContent = c.icon + ' ' + c.label;
    sel.appendChild(o);
  });
}

function populateFilterOptions() {
  const data = getData();
  const sel = document.getElementById('filter-month');
  if (!sel) return;
  const months = [...new Set(data.transactions.map(t => t.date.slice(0,7)))].sort().reverse();
  months.forEach(m => {
    if (sel.querySelector(`option[value="${m}"]`)) return;
    const o = document.createElement('option');
    o.value = m;
    o.textContent = fmtMonthLabel(m);
    sel.appendChild(o);
  });
}

// ── Navigation ──
const pageTitles = {
  dashboard: 'Dashboard',
  add: 'Add Transaction',
  list: 'Transactions',
  charts: 'Charts & Analytics',
  budget: 'Budget',
  export: 'Export / Import',
};

function navigate(page) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
  document.getElementById('page-' + page).classList.add('active');
  const navEl = document.querySelector(`[onclick="navigate('${page}')"]`);
  if (navEl) navEl.classList.add('active');
  const titleEl = document.getElementById('page-title');
  if (titleEl) titleEl.textContent = pageTitles[page];
  closeSidebar();

  if (page === 'list') renderList();
  if (page === 'charts') renderCharts();
  if (page === 'budget') renderBudget();
  if (page === 'export') renderExportStats();
  if (page === 'dashboard') renderDashboard();
}

function toggleSidebar() {
  document.getElementById('sidebar').classList.toggle('open');
  document.getElementById('sidebar-overlay').classList.toggle('open');
}

function closeSidebar() {
  document.getElementById('sidebar').classList.remove('open');
  document.getElementById('sidebar-overlay').classList.remove('open');
}

// ── Format helpers ──
function fmtVND(v) {
  return new Intl.NumberFormat('vi-VN').format(Math.round(v)) + ' \u20ab';
}

function fmtDate(s) {
  const [yr, mo, dy] = s.split('-');
  return `${MONTHS_SHORT[parseInt(mo)-1]} ${parseInt(dy)}, ${yr}`;
}

function fmtMonthLabel(ym) {
  const [yr, mo] = ym.split('-');
  return `${MONTHS_SHORT[parseInt(mo)-1]} '${yr.slice(2)}`;
}

// ── Toast ──
function showToast(msg, type = 'info') {
  const container = document.getElementById('toast-container');
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.textContent = msg;
  container.appendChild(toast);
  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateX(20px)';
    toast.style.transition = 'all 0.25s';
    setTimeout(() => toast.remove(), 250);
  }, 3000);
}

// ── Keyboard ──
document.addEventListener('keydown', e => {
  if (e.key === 'Escape') closeModal();
});

function initAmountInputFormatting() {
  const displayInput = document.getElementById('f-amount-display');
  const hiddenInput = document.getElementById('f-amount');

  if (!displayInput || !hiddenInput) return;

  displayInput.addEventListener('input', e => {
    let value = e.target.value.replace(/\D/g, '');
    if (value) {
      const numericValue = parseInt(value, 10);
      hiddenInput.value = numericValue;
      e.target.value = new Intl.NumberFormat('vi-VN').format(numericValue);
    } else {
      hiddenInput.value = '';
      e.target.value = '';
    }
  });

  displayInput.addEventListener('blur', e => {
    if (hiddenInput.value) {
      displayInput.value = new Intl.NumberFormat('vi-VN').format(parseInt(hiddenInput.value, 10));
    }
  });
}
