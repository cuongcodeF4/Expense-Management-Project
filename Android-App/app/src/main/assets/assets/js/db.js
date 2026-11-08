// ═══════════════════════════════════════════════
//  DB — Firestore CRUD with local cache
// ═══════════════════════════════════════════════

const CACHE_KEY = 'expense_tracker_cache';
const LEGACY_KEY = 'expense_tracker_data';
let _appData = null;
let _unsubscribe = null;
let _saveTimer = null;
let _pendingSave = null;
let _loadedUid = null;
let _syncEl = null;

function setAppData(data) {
  _appData = typeof normalizeAppData === 'function' ? normalizeAppData(data) : data;
  window._appData = _appData;
  return _appData;
}

function getEmptyAppData() {
  return typeof createEmptyAppData === 'function'
    ? createEmptyAppData()
    : { transactions: [], budgets: {}, nextId: 1 };
}

function getUserDocRef(uid = window._uid) {
  return db.collection('users').doc(uid).collection('data').doc('main');
}

function resetAppDataState() {
  if (_unsubscribe) _unsubscribe();
  _unsubscribe = null;
  clearTimeout(_saveTimer);
  _saveTimer = null;
  _pendingSave = null;
  _appData = null;
  window._appData = null;
  _loadedUid = null;
  hideSyncIndicator();
}

async function loadAppData() {
  _syncEl = document.getElementById('sync-indicator');
  const uid = window._uid;
  if (!uid) return;

  if (_loadedUid !== uid) {
    if (_unsubscribe) _unsubscribe();
    clearTimeout(_saveTimer);
    _unsubscribe = null;
    _saveTimer = null;
    _pendingSave = null;
    _appData = null;
    window._appData = null;
    _loadedUid = uid;
  }

  try {
    const cached = localStorage.getItem(CACHE_KEY + '_' + uid);
    if (cached) {
      setAppData(JSON.parse(cached));
    }
  } catch(e) {}

  if (_unsubscribe) _unsubscribe();
  const userDocRef = getUserDocRef(uid);
  _unsubscribe = userDocRef.onSnapshot(doc => {
    if (_loadedUid !== uid) return;
    if (doc.exists) {
      setAppData(doc.data());
      try { localStorage.setItem(CACHE_KEY + '_' + uid, JSON.stringify(_appData)); } catch(e) {}
    } else {
      setAppData(getEmptyAppData());
      checkLegacyMigration();
    }
    refreshAllUI();
    hideSyncIndicator();
  }, err => {
    if (_loadedUid !== uid) return;
    console.error('Firestore error:', err);
    hideSyncIndicator();
  });

  if (!_appData) {
    try {
      const doc = await userDocRef.get();
      if (_loadedUid !== uid) return;
      if (doc.exists) {
        setAppData(doc.data());
      } else {
        setAppData(getEmptyAppData());
        checkLegacyMigration();
      }
    } catch(e) {
      if (_loadedUid !== uid) return;
      setAppData(getEmptyAppData());
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
      banner.querySelector('button').onclick = async () => {
        const saved = await saveData(oldData, { immediate: true });
        if (!saved) return;
        localStorage.removeItem(LEGACY_KEY);
        banner.classList.remove('visible');
        showToast('Legacy data imported successfully', 'success');
      };
    }
  } catch(e) {}
}

function saveData(data, options = {}) {
  const uid = window._uid;
  if (!uid) {
    showToast('Please sign in before saving', 'error');
    return;
  }
  data = setAppData(data);
  try { localStorage.setItem(CACHE_KEY + '_' + uid, JSON.stringify(data)); } catch(e) {}
  showSyncIndicator();
  clearTimeout(_saveTimer);
  _pendingSave = {
    uid,
    ref: getUserDocRef(uid),
    data: JSON.parse(JSON.stringify(data))
  };
  if (options.immediate === true) return commitPendingSave();
  _saveTimer = setTimeout(commitPendingSave, 800);
  return Promise.resolve(true);
}

function commitPendingSave() {
  if (!_pendingSave) return Promise.resolve(true);
  const pending = _pendingSave;
  _pendingSave = null;
  _saveTimer = null;
  return pending.ref.set(pending.data)
    .then(() => {
      if (!_pendingSave) hideSyncIndicator();
      return true;
    })
    .catch(err => {
      console.error('Save error:', err);
      if (!_pendingSave) hideSyncIndicator();
      showToast('Failed to save: ' + err.message, 'error');
      return false;
    });
}

function flushPendingSave() {
  clearTimeout(_saveTimer);
  _saveTimer = null;
  return commitPendingSave();
}

function getData() {
  if (!window._appData) setAppData(getEmptyAppData());
  return window._appData;
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
  if (typeof refreshCategoryControls === 'function') refreshCategoryControls();
  if (typeof renderDashboard === 'function') renderDashboard();
  if (typeof renderBudget === 'function') renderBudget();
  if (typeof renderPortfolio === 'function') renderPortfolio();
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
