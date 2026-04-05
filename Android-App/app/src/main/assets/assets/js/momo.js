// ═══════════════════════════════════════════════
//  MOMO — Notification Listener Integration
// ═══════════════════════════════════════════════

// Dedup: track processed timestamps to avoid double-adding
const _momoProcessed = new Set();
const MOMO_DEDUP_KEY = 'momo_processed_timestamps';
const MOMO_PENDING_KEY = 'momo_pending_transactions';

// Load previously processed timestamps from localStorage
(function loadMomoDedup() {
  try {
    const saved = localStorage.getItem(MOMO_DEDUP_KEY);
    if (saved) {
      JSON.parse(saved).forEach(ts => _momoProcessed.add(ts));
    }
  } catch(e) {}
})();

function saveMomoDedup() {
  try {
    const arr = Array.from(_momoProcessed).slice(-200);
    localStorage.setItem(MOMO_DEDUP_KEY, JSON.stringify(arr));
  } catch(e) {}
}

/**
 * Thực sự thêm transaction vào dữ liệu (chỉ gọi khi đã login).
 */
function _addMomoTransaction(amount, type, note, date, timestamp) {
  if (_momoProcessed.has(timestamp)) return;

  const data = getData();
  const isIncome = type === 'income';

  const tx = {
    id: data.nextId++,
    type: isIncome ? 'income' : 'expense',
    category: isIncome ? 'khac_thu' : 'khac_chi',
    amount: amount,
    date: date,
    note: note,
    source: 'momo_auto'
  };

  data.transactions.unshift(tx);
  data.transactions.sort((a, b) => b.date.localeCompare(a.date));
  saveData(data);

  _momoProcessed.add(timestamp);
  saveMomoDedup();

  if (typeof populateFilterOptions === 'function') populateFilterOptions();
  if (typeof renderDashboard === 'function') renderDashboard();

  const activePage = document.querySelector('.page.active');
  if (activePage && activePage.id === 'page-list' && typeof renderList === 'function') {
    renderList();
  }

  showToast('MoMo: ' + fmtVND(amount) + ' added ✓', 'success');
  console.log('[MoMo] Transaction added: amount=' + amount + ' note=' + note);
}

/**
 * Xử lý các giao dịch đang chờ (được lưu khi chưa đăng nhập).
 * Gọi hàm này sau khi user đăng nhập xong.
 */
function processPendingMomoTransactions() {
  if (!window._uid) return;
  try {
    const pending = JSON.parse(localStorage.getItem(MOMO_PENDING_KEY) || '[]');
    if (pending.length === 0) return;
    console.log('[MoMo] Processing ' + pending.length + ' pending transaction(s)');
    pending.forEach(item => {
      _addMomoTransaction(item.amount, item.type, item.note, item.date, item.timestamp);
    });
    localStorage.removeItem(MOMO_PENDING_KEY);
  } catch(e) {
    console.error('[MoMo] Error processing pending:', e);
  }
}

/**
 * Called from native Android (via WebAppBridge.injectMomoTransaction).
 */
window._onMomoTransaction = function(amount, type, note, date, timestamp) {
  console.log('[MoMo] Received: amount=' + amount + ' type=' + type + ' note=' + note + ' uid=' + window._uid);

  // Dedup check
  if (_momoProcessed.has(timestamp)) {
    console.log('[MoMo] Duplicate ignored, ts=' + timestamp);
    return;
  }

  // Nếu chưa đăng nhập, lưu vào hàng đợi để xử lý sau khi login
  if (!window._uid) {
    console.warn('[MoMo] Not logged in, saving to pending queue');
    try {
      const pending = JSON.parse(localStorage.getItem(MOMO_PENDING_KEY) || '[]');
      if (!pending.find(p => p.timestamp === timestamp)) {
        pending.push({ amount, type, note, date, timestamp });
        localStorage.setItem(MOMO_PENDING_KEY, JSON.stringify(pending));
      }
    } catch(e) {}
    return;
  }

  _addMomoTransaction(amount, type, note, date, timestamp);
};

// Process any queued transactions that arrived before momo.js was loaded
(function processMomoQueue() {
  if (window._momoQueue && window._momoQueue.length > 0) {
    console.log('[MoMo] Processing ' + window._momoQueue.length + ' pre-load queued item(s)');
    window._momoQueue.forEach(item => {
    window._onMomoTransaction(item.amount, item.type, item.note, item.date, item.timestamp);
    });
    window._momoQueue = [];
  }
})();

/**
 * Hàm test: giả lập một giao dịch MoMo để kiểm tra toàn bộ luồng.
 */
function testMomoTransaction() {
  const fakeAmount = 50000;
  const fakeType = 'income';
  const fakeNote = 'MoMo: Test - Bạn đã nhận 50.000đ vào túi thần tài';
  const fakeDate = new Date().toISOString().slice(0, 10);
  const fakeTs = Date.now();
  console.log('[MoMo] Running test transaction...');
  window._onMomoTransaction(fakeAmount, fakeType, fakeNote, fakeDate, fakeTs);
}

// ── MoMo Settings UI helpers ──

function initMomoSettings() {
  if (typeof AndroidBridge === 'undefined') {
    // Not running in Android WebView
    const momoSection = document.getElementById('momo-settings');
    if (momoSection) momoSection.style.display = 'none';
    return;
  }

  updateMomoSettingsUI();
}

function updateMomoSettingsUI() {
  if (typeof AndroidBridge === 'undefined') return;

  const permStatus = document.getElementById('momo-perm-status');
  const permBtn = document.getElementById('momo-perm-btn');
  const toggleBtn = document.getElementById('momo-toggle-btn');
  const toggleStatus = document.getElementById('momo-toggle-status');
  const accStatus = document.getElementById('momo-acc-status');
  const accBtn = document.getElementById('momo-acc-btn');

  const hasPermission = AndroidBridge.isNotificationListenerEnabled();
  const hasAccessibility = AndroidBridge.isAccessibilityServiceEnabled();
  const autoAdd = AndroidBridge.isMomoAutoAddEnabled();

  if (permStatus) {
    permStatus.innerHTML = hasPermission
      ? '<span style="color:var(--income-color)">● Enabled</span>'
      : '<span style="color:var(--expense-color)">● Disabled</span>';
  }
  if (permBtn) {
    permBtn.textContent = hasPermission ? 'Re-configure' : 'Grant Permission';
    permBtn.className = hasPermission ? 'btn btn-outline' : 'btn btn-primary';
  }

  if (accStatus) {
    accStatus.innerHTML = hasAccessibility
      ? '<span style="color:var(--income-color)">● Enabled</span>'
      : '<span style="color:var(--expense-color)">● Disabled</span>';
  }
  if (accBtn) {
    accBtn.textContent = hasAccessibility ? 'Re-configure' : 'Grant Permission';
    accBtn.className = hasAccessibility ? 'btn btn-outline' : 'btn btn-primary';
  }

  if (toggleBtn) {
    toggleBtn.textContent = autoAdd ? 'Disable' : 'Enable';
    toggleBtn.className = autoAdd ? 'btn btn-outline' : 'btn btn-primary';
  }
  if (toggleStatus) {
    toggleStatus.textContent = autoAdd ? 'Auto-add is ON' : 'Auto-add is OFF';
    toggleStatus.style.color = autoAdd ? 'var(--income-color)' : 'var(--text-muted)';
  }
}

function openNotifSettings() {
  if (typeof AndroidBridge !== 'undefined') {
    AndroidBridge.openNotificationListenerSettings();
    let checks = 0;
    const interval = setInterval(() => {
      updateMomoSettingsUI();
      checks++;
      if (checks > 10) clearInterval(interval);
    }, 2000);
  }
}

function openAccessibilitySettings() {
  if (typeof AndroidBridge !== 'undefined') {
    AndroidBridge.openAccessibilitySettings();
    let checks = 0;
    const interval = setInterval(() => {
      updateMomoSettingsUI();
      checks++;
      if (checks > 10) clearInterval(interval);
    }, 2000);
  }
}

function toggleMomoAutoAdd() {
  if (typeof AndroidBridge === 'undefined') return;
  const current = AndroidBridge.isMomoAutoAddEnabled();
  AndroidBridge.setMomoAutoAddEnabled(!current);
  updateMomoSettingsUI();
  showToast(current ? 'MoMo auto-add disabled' : 'MoMo auto-add enabled', 'info');
}
