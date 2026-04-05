// ═══════════════════════════════════════════════
//  DB — Firestore CRUD with local cache
// ═══════════════════════════════════════════════

const CACHE_KEY = 'expense_tracker_cache';
const LEGACY_KEY = 'expense_tracker_data';
let _appData = null;
let _unsubscribe = null;
let _saveTimer = null;
let _syncEl = null;

function getUserDocRef() {
  return db.collection('users').doc(window._uid).collection('data').doc('main');
}

async function loadAppData() {
  _syncEl = document.getElementById('sync-indicator');

  try {
    const cached = localStorage.getItem(CACHE_KEY + '_' + window._uid);
    if (cached) {
      _appData = JSON.parse(cached);
      window._appData = _appData;
    }
  } catch(e) {}

  if (_unsubscribe) _unsubscribe();
  _unsubscribe = getUserDocRef().onSnapshot(doc => {
    if (doc.exists) {
      _appData = doc.data();
      try { localStorage.setItem(CACHE_KEY + '_' + window._uid, JSON.stringify(_appData)); } catch(e) {}
    } else {
      _appData = { transactions: [], budgets: {}, nextId: 1 };
      checkLegacyMigration();
    }
    window._appData = _appData;
    refreshAllUI();
    hideSyncIndicator();
  }, err => {
    console.error('Firestore error:', err);
    hideSyncIndicator();
  });

  if (!_appData) {
    try {
      const doc = await getUserDocRef().get();
      if (doc.exists) {
        _appData = doc.data();
      } else {
        _appData = { transactions: [], budgets: {}, nextId: 1 };
        checkLegacyMigration();
      }
      window._appData = _appData;
    } catch(e) {
      _appData = { transactions: [], budgets: {}, nextId: 1 };
      window._appData = _appData;
    }
  }
}

function checkLegacyMigration() {
  try {
    const old = localStorage.getItem(LEGACY_KEY);
    if (!old) return;
    const oldData = JSON.parse(old);
    if (!oldData || !Array.isArray(oldData.transactions) || oldData.transactions.length === 0) return;

    const banner = document.getElementById('migrate-banner');
    if (banner) {
      banner.querySelector('span').textContent =
        `Found ${oldData.transactions.length} transactions from a previous version. Would you like to import them?`;
      banner.classList.add('visible');
      banner.querySelector('button').onclick = () => {
        saveData(oldData);
        localStorage.removeItem(LEGACY_KEY);
        banner.classList.remove('visible');
        showToast('Legacy data imported successfully', 'success');
      };
    }
  } catch(e) {}
}

function saveData(data) {
  _appData = data;
  window._appData = data;
  try { localStorage.setItem(CACHE_KEY + '_' + window._uid, JSON.stringify(data)); } catch(e) {}
  showSyncIndicator();
  clearTimeout(_saveTimer);
  _saveTimer = setTimeout(() => {
    getUserDocRef().set(data)
      .then(() => hideSyncIndicator())
      .catch(err => {
        console.error('Save error:', err);
        hideSyncIndicator();
        showToast('Failed to save: ' + err.message, 'error');
      });
  }, 800);
}

function getData() {
  return window._appData || { transactions: [], budgets: {}, nextId: 1 };
}

function showSyncIndicator() {
  const el = document.getElementById('sync-indicator');
  if (el) el.classList.add('visible');
}

function hideSyncIndicator() {
  const el = document.getElementById('sync-indicator');
  if (el) el.classList.remove('visible');
}

function refreshAllUI() {
  if (typeof renderDashboard === 'function') renderDashboard();
  if (typeof renderBudget === 'function') renderBudget();
  if (typeof renderExportStats === 'function') renderExportStats();
  if (typeof populateDashMonthSelect === 'function') populateDashMonthSelect();
  if (typeof populateFilterOptions === 'function') {
    const sel = document.getElementById('filter-month');
    if (sel) {
      const current = sel.value;
      sel.innerHTML = '<option value="">All months</option>';
      populateFilterOptions();
      sel.value = current;
    }
  }
  const activePage = document.querySelector('.page.active');
  if (activePage) {
    const id = activePage.id;
    if (id === 'page-list' && typeof renderList === 'function') renderList();
    if (id === 'page-charts' && typeof renderCharts === 'function') renderCharts();
  }
}
