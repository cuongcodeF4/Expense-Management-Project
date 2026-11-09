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
let _modalReturnFocus = null;
const PRIVACY_MASK_KEY = 'expense_tracker_privacy_mask';
const THEME_MODE_KEY = 'expense_tracker_theme';
const SIDEBAR_COLLAPSED_KEY = 'expense_tracker_sidebar_collapsed';
const UI_ZOOM_KEY = 'expense_tracker_ui_zoom';
const ONBOARDING_TOUR_KEY = 'expense_tracker_onboarding_v1';
const LANG_MODE_KEY = 'expense_tracker_lang';
let _uiZoomPct = 100;
let _lang = 'vi';

const MONTHS_SHORT_EN = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
const MONTHS_FULL_EN = ['January','February','March','April','May','June','July','August','September','October','November','December'];
const MONTHS_SHORT_VI = ['Th1','Th2','Th3','Th4','Th5','Th6','Th7','Th8','Th9','Th10','Th11','Th12'];
const MONTHS_FULL_VI = ['Tháng 1','Tháng 2','Tháng 3','Tháng 4','Tháng 5','Tháng 6','Tháng 7','Tháng 8','Tháng 9','Tháng 10','Tháng 11','Tháng 12'];

const MONTHS_SHORT = [...MONTHS_SHORT_VI];
const MONTHS_FULL = [...MONTHS_FULL_VI];

function isVi() {
  return _lang === 'vi';
}

function tr(en, vi) {
  return _lang === 'vi' ? vi : en;
}

function syncMonthNames() {
  const srcShort = _lang === 'vi' ? MONTHS_SHORT_VI : MONTHS_SHORT_EN;
  const srcFull = _lang === 'vi' ? MONTHS_FULL_VI : MONTHS_FULL_EN;
  for (let i = 0; i < 12; i++) {
    MONTHS_SHORT[i] = srcShort[i];
    MONTHS_FULL[i] = srcFull[i];
  }
}

const I18N_VI = {
  // Login & Sidebar
  'Sign in to sync your financial portfolio across all your devices': 'Đăng nhập để đồng bộ danh mục tài chính trên mọi thiết bị của bạn',
  'Sign in with Google': 'Đăng nhập bằng Google',
  'Your data is encrypted and stored securely on Firebase.': 'Dữ liệu của bạn được mã hóa và lưu trữ an toàn trên Firebase.',
  'Personal Finance': 'Tài Chính Cá Nhân',
  'Overview': 'Tổng quan',
  'Dashboard': 'Bảng điều khiển',
  'Transactions': 'Giao dịch',
  'Add Transaction': 'Thêm giao dịch',
  'All Transactions': 'Tất cả giao dịch',
  'Analytics': 'Phân tích',
  'Monthly Budget': 'Ngân sách tháng',
  'Investment Portfolio': 'Danh mục đầu tư',
  'Data & Sync': 'Dữ liệu & Sao lưu',
  'Cloud Backup': 'Sao lưu đám mây',
  'Signed In': 'Đã đăng nhập',
  'Sign Out': 'Đăng xuất',
  'v3.0 · Tap to Update': 'v3.0 · Chạm để cập nhật',

  // Topbar & Mobile Bottom Nav
  'Saving...': 'Đang lưu...',
  'Saved': 'Đã lưu',
  'Wallet': 'Ví ròng',
  '+ Add': '+ Thêm',
  'Home': 'Trang chủ',
  'History': 'Lịch sử',
  'Charts': 'Biểu đồ',
  'Add': 'Thêm',
  'Budget': 'Ngân sách',
  'Invest': 'Đầu tư',
  'Backup': 'Sao lưu',

  // Dashboard
  'Import old data': 'Nhập dữ liệu cũ',
  'Welcome back': 'Chào mừng trở lại',
  'Period:': 'Kỳ:',
  'Daily Cashflow Pulse': 'Nhịp Dòng Tiền Theo Ngày',
  '6-Month Trajectory': 'Xu Hướng 6 Tháng Gần Nhất',
  'Recent Transactions': 'Giao Dịch Gần Đây',
  'View All ›': 'Xem tất cả ›',
  'Spending by Category': 'Chi Tiêu Theo Danh Mục',
  'Monthly Summary': 'Tóm Tắt Tháng',

  // Add Transaction
  'Record Transaction': 'Ghi Chép Giao Dịch',
  'Transaction Type': 'Loại giao dịch',
  '↓ Income': '↓ Thu nhập',
  '↑ Expense': '↑ Chi tiêu',
  'Amount (VND)': 'Số tiền (VND)',
  'Category': 'Danh mục',
  'Date': 'Ngày',
  'Note': 'Ghi chú',
  'Enter a note...': 'Nhập ghi chú...',
  '✦ Save Transaction': '✦ Lưu Giao Dịch',

  // Transaction List
  '🔍 Search category, note, or amount...': '🔍 Tìm danh mục, ghi chú hoặc số tiền...',
  'All types': 'Tất cả loại',
  'Income': 'Thu nhập',
  'Expense': 'Chi tiêu',
  'All categories': 'Tất cả danh mục',
  'All months': 'Tất cả các tháng',
  'Clear': 'Xóa lọc',
  'Type': 'Loại',
  'Amount': 'Số tiền',
  'No matching transactions': 'Không có giao dịch phù hợp',

  // Charts & Analytics
  'Charts & Analytics': 'Biểu Đồ & Phân Tích',
  '6 months': '6 tháng',
  '1 year': '1 năm',
  '2 years': '2 năm',
  '5 years': '5 năm',
  '10 years': '10 năm',
  'Custom': 'Tùy chọn',
  'From:': 'Từ:',
  'To:': 'Đến:',
  'Refresh': 'Làm mới',
  'Income, Expenses & Net Savings Replay': 'Biến Động Thu Nhập, Chi Tiêu & Tiết Kiệm Ròng',
  'Income vs. Expenses': 'So Sánh Thu Nhập & Chi Tiêu',
  'Net Savings & Cumulative Wealth Trend': 'Tiết Kiệm Ròng & Xu Hướng Tích Lũy Tài Sản',

  // Monthly Budget
  'Set default spending limits or customize budgets for any specific past month.': 'Thiết lập hạn mức chi tiêu mặc định hoặc tùy chỉnh ngân sách riêng cho từng tháng.',
  'Editing Period:': 'Kỳ chỉnh sửa:',
  '↺ Reset Month to Default': '↺ Đặt lại tháng về mặc định',
  'Manage categories': 'Quản lý danh mục',
  'Add, remove, or restore': 'Thêm, ẩn hoặc khôi phục',
  'Add income or expense categories for transactions and reports. Expense categories can also have budgets. Removed categories stay attached to past transactions and analytics, and can be restored.': 'Thêm danh mục thu nhập hoặc chi tiêu cho giao dịch và báo cáo. Danh mục chi tiêu có thể đặt ngân sách. Danh mục đã ẩn vẫn giữ nguyên trong giao dịch cũ và có thể khôi phục bất kỳ lúc nào.',
  'Icon': 'Biểu tượng',
  'e.g. 🐾': 'VD: 🐾',
  'Category name': 'Tên danh mục',
  'e.g. Pets': 'VD: Thú cưng',
  '+ Add category': '+ Thêm danh mục',
  'Remaining Budget Ledger': 'Sổ Cái Ngân Sách Còn Lại (Ledger)',
  'Tip: Click any cell in the table to edit the budget for that specific month & category.': 'Mẹo: Nhấn vào bất kỳ ô nào trong bảng để sửa ngân sách riêng cho tháng & danh mục đó.',

  // Investment Portfolio
  'Track your investments across Gold, Bitcoin (BTC), Mutual Funds / ETFs, Stocks, and custom assets. Edit amounts directly or tap any asset to log monthly valuations & inspect ROI (%) trends.': 'Theo dõi danh mục đầu tư Vàng, Bitcoin (BTC), Quỹ mở / ETF, Cổ phiếu và tài sản tùy chỉnh. Sửa số tiền trực tiếp hoặc nhấn vào từng mục để ghi nhận giá trị theo tháng & xem biểu đồ Lãi/Lỗ ROI (%).',
  '+ Add Investment Category': '+ Thêm Danh Mục Đầu Tư',
  'Category Name': 'Tên danh mục đầu tư',
  'e.g. Gold, BTC, VFMVF4 ETF...': 'VD: Vàng, BTC, Quỹ ETF...',
  'Initial Invested (VND)': 'Vốn đầu tư ban đầu (VND)',
  'Current Value (VND)': 'Giá trị hiện tại (VND)',
  '+ Add Asset': '+ Thêm Tài Sản',
  'Asset Monthly Valuation & ROI (%)': 'Định Giá Theo Tháng & Lãi/Lỗ ROI (%)',
  '▲ Collapse': '▲ Thu gọn',
  'Initial Invested Capital (VND)': 'Vốn đầu tư ban đầu (VND)',
  'Valuation Month': 'Tháng định giá',
  'Current Value in Month (VND)': 'Giá trị trong tháng (VND)',
  'Save Monthly Valuation': 'Lưu Định Giá Tháng',
  'Selected Asset Profit / Loss (%) Curve': 'Đường Cong Lãi / Lỗ (%) Của Tài Sản Đang Chọn',
  'Monthly Valuation History': 'Lịch Sử Định Giá Theo Tháng',
  'Month': 'Tháng',
  'Invested': 'Vốn đầu tư',
  'Market Value': 'Giá trị thị trường',
  'Profit / Loss': 'Lãi / Lỗ',
  'ROI (%)': 'ROI (%)',
  'Actions': 'Thao tác',
  'All Assets Monthly Profit / Loss (%) Comparison': 'So Sánh Lãi / Lỗ (%) Theo Tháng Giữa Các Tài Sản',
  'Multi-line monthly ROI (%) trajectory across all investment categories': 'Biểu đồ đa đường biểu diễn tỷ suất sinh lời ROI (%) hàng tháng của tất cả danh mục đầu tư',
  'Horizon:': 'Khung thời gian:',
  '12 months': '12 tháng',
  '24 months': '24 tháng',
  'All recorded months': 'Tất cả tháng đã lưu',
  'Portfolio Allocation & ROI Breakdown': 'Phân Bổ Danh Mục & Chi Tiết Lãi/Lỗ ROI',
  'Investment Category': 'Danh mục đầu tư',
  'Initial Invested': 'Vốn ban đầu',
  'Current Value': 'Giá trị hiện tại',
  'Net Profit / Loss': 'Lãi / Lỗ ròng',
  '% of Total Portfolio': '% Tổng danh mục',
  'Detail': 'Chi tiết',
  'Visual Portfolio Weight (%)': 'Tỷ Trọng Danh Mục Đầu Tư (%)',

  // Cloud Backup & Restore
  'Cloud Backup & Restore': 'Sao Lưu & Khôi Phục Dữ Liệu',
  '↓ Export Cloud Snapshot': '↓ Xuất Bản Sao Lưu (JSON)',
  'Download all your transactions, budgets, and categories as a JSON backup file.': 'Tải xuống toàn bộ giao dịch, ngân sách và danh mục dưới dạng file sao lưu JSON.',
  'Download JSON Backup': 'Tải Xuống Bản Sao Lưu JSON',
  '↑ Restore from Snapshot': '↑ Khôi Phục Từ Bản Sao Lưu',
  'Restore data from a previously exported JSON backup file.': 'Khôi phục dữ liệu từ file sao lưu JSON đã xuất trước đó.',
  'Click to select JSON file': 'Nhấn để chọn file JSON',
  'Current data will be replaced': 'Dữ liệu hiện tại sẽ được thay thế',
  'Reset Portfolio Data': 'Xóa Toàn Bộ Dữ Liệu',
  'Permanently delete all transactions, budgets, and custom category settings. This cannot be undone.': 'Xóa vĩnh viễn toàn bộ giao dịch, ngân sách và cài đặt danh mục. Không thể hoàn tác.',
  'Delete All Data': 'Xóa Tất Cả Dữ Liệu',

  // Modal defaults
  'Confirm Delete': 'Xác Nhận Xóa',
  'Are you sure you want to delete this transaction?': 'Bạn có chắc chắn muốn xóa giao dịch này không?',
  'Cancel': 'Hủy',
  'Delete': 'Xóa'
};

function applyStaticTranslations(root = document.body) {
  if (!root) return;
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, null);
  let node;
  while ((node = walker.nextNode())) {
    const parentTag = node.parentElement?.tagName;
    if (parentTag === 'SCRIPT' || parentTag === 'STYLE') continue;
    const raw = node.nodeValue || '';
    const trimmed = raw.trim();
    if (!trimmed) continue;
    if (node._origEn === undefined) {
      if (Object.prototype.hasOwnProperty.call(I18N_VI, trimmed)) {
        node._origEn = trimmed;
        node._leadWs = raw.slice(0, raw.indexOf(trimmed));
        node._trailWs = raw.slice(raw.indexOf(trimmed) + trimmed.length);
      }
    }
    if (node._origEn !== undefined) {
      const targetText = _lang === 'vi' ? (I18N_VI[node._origEn] || node._origEn) : node._origEn;
      node.nodeValue = `${node._leadWs || ''}${targetText}${node._trailWs || ''}`;
    }
  }

  root.querySelectorAll('[placeholder], [title]').forEach(el => {
    if (el.hasAttribute('placeholder')) {
      const p = el.getAttribute('placeholder');
      if (el._origPlaceholder === undefined && Object.prototype.hasOwnProperty.call(I18N_VI, p)) {
        el._origPlaceholder = p;
      }
      if (el._origPlaceholder !== undefined) {
        el.setAttribute('placeholder', _lang === 'vi' ? (I18N_VI[el._origPlaceholder] || el._origPlaceholder) : el._origPlaceholder);
      }
    }
    if (el.hasAttribute('title')) {
      const t = el.getAttribute('title');
      if (el._origTitle === undefined && Object.prototype.hasOwnProperty.call(I18N_VI, t)) {
        el._origTitle = t;
      }
      if (el._origTitle !== undefined) {
        el.setAttribute('title', _lang === 'vi' ? (I18N_VI[el._origTitle] || el._origTitle) : el._origTitle);
      }
    }
  });

  // Special case for complex paragraph in Budget section
  const ledgerTipP = document.querySelector('#page-budget > div[style*="margin-top:28px"] > p');
  if (ledgerTipP) {
    ledgerTipP.innerHTML = _lang === 'vi'
      ? 'Thặng dư / thâm hụt ngân sách mỗi tháng theo từng danh mục. Số dương = chi dưới ngân sách, số âm = vượt ngân sách. <strong>Mẹo: Nhấn vào bất kỳ ô nào trong bảng để sửa ngân sách riêng cho tháng &amp; danh mục đó.</strong>'
      : 'Monthly surplus/deficit per category. Positive = under budget, negative = over budget. <strong>Tip: Click any cell in the table to edit the budget for that specific month &amp; category.</strong>';
  }
}

function updateLangBtnLabel() {
  const btn = document.getElementById('lang-toggle-btn');
  if (!btn) return;
  btn.innerHTML = _lang === 'vi' ? '🇻🇳 VI' : '🇬🇧 EN';
  btn.title = _lang === 'vi'
    ? 'Đang dùng Tiếng Việt · Nhấn để chuyển sang English'
    : 'Current: English · Click to switch to Tiếng Việt';
}

function initLanguage() {
  try {
    const saved = localStorage.getItem(LANG_MODE_KEY);
    _lang = (saved === 'en' || saved === 'vi') ? saved : 'vi';
  } catch(e) {
    _lang = 'vi';
  }
  document.documentElement.lang = _lang;
  syncMonthNames();
  updateLangBtnLabel();
  applyStaticTranslations(document.body);
}

function toggleLanguage() {
  _lang = _lang === 'vi' ? 'en' : 'vi';
  try { localStorage.setItem(LANG_MODE_KEY, _lang); } catch(e) {}
  document.documentElement.lang = _lang;
  syncMonthNames();
  updateLangBtnLabel();
  updateThemeBtnLabel(document.body.classList.contains('light-mode'));
  applyStaticTranslations(document.body);

  updateCurrentMonthLabel();
  const activePage = document.querySelector('.page.active');
  const currentPageKey = activePage ? activePage.id.replace('page-', '') : 'dashboard';
  const titleEl = document.getElementById('page-title');
  if (titleEl) titleEl.textContent = getPageTitle(currentPageKey);

  if (typeof refreshCategoryControls === 'function') refreshCategoryControls();
  if (typeof populateFilterOptions === 'function') {
    const fm = document.getElementById('filter-month');
    const savedVal = fm ? fm.value : '';
    if (fm) fm.innerHTML = `<option value="">${tr('All months', 'Tất cả các tháng')}</option>`;
    populateFilterOptions();
    if (fm && savedVal) fm.value = savedVal;
  }
  if (typeof populateDashMonthSelect === 'function') populateDashMonthSelect();
  if (typeof renderDashboard === 'function') renderDashboard();
  if (typeof renderList === 'function') renderList();
  if (activePage?.id === 'page-charts' && typeof renderCharts === 'function') renderCharts();
  if (typeof renderBudget === 'function') renderBudget();
  if (typeof renderPortfolio === 'function') renderPortfolio();
  if (typeof renderExportStats === 'function') renderExportStats();
  if (_tourActive) renderOnboardingStep();
}

function initSidebarCollapse() {
  try {
    const saved = localStorage.getItem(SIDEBAR_COLLAPSED_KEY);
    const isTabletViewport = window.innerWidth >= 741 && window.innerWidth <= 1080;
    const collapsed = saved !== null ? saved === 'true' : isTabletViewport;
    document.body.classList.toggle('sidebar-collapsed', collapsed);
  } catch(e) {}
}

function toggleSidebarCollapse() {
  const collapsed = document.body.classList.toggle('sidebar-collapsed');
  try { localStorage.setItem(SIDEBAR_COLLAPSED_KEY, String(collapsed)); } catch(e) {}
  setTimeout(() => {
    Object.values(_charts || {}).forEach(c => { if (c && typeof c.resize === 'function') c.resize(); });
  }, 180);
}

let _zoomResizeTimer = null;

function applyUiZoom(pct) {
  _uiZoomPct = Math.max(50, Math.min(150, Math.round(pct / 5) * 5));
  document.documentElement.style.setProperty('--ui-zoom', (_uiZoomPct / 100).toFixed(2));
  const labelEl = document.getElementById('ui-zoom-label');
  if (labelEl) labelEl.textContent = `${_uiZoomPct}%`;
  try { localStorage.setItem(UI_ZOOM_KEY, String(_uiZoomPct)); } catch(e) {}
  if (_zoomResizeTimer) clearTimeout(_zoomResizeTimer);
  _zoomResizeTimer = setTimeout(() => {
    Object.values(_charts || {}).forEach(c => { if (c && typeof c.resize === 'function') c.resize(); });
  }, 90);
}

function initUiZoom() {
  try {
    const saved = parseInt(localStorage.getItem(UI_ZOOM_KEY) || '100', 10);
    if (!isNaN(saved) && saved >= 50 && saved <= 150) {
      applyUiZoom(saved);
    } else {
      applyUiZoom(100);
    }
  } catch(e) {}
  initPinchZoomGesture();
  initMobileBottomNavScroll();
}

function initMobileBottomNavScroll() {
  if (window._mobileBottomNavScrollBound) return;
  window._mobileBottomNavScrollBound = true;
  let lastY = window.scrollY || 0;
  window.addEventListener('scroll', () => {
    const nav = document.getElementById('mobile-bottom-nav');
    if (!nav) return;
    const curY = window.scrollY || 0;
    const delta = curY - lastY;
    if (curY <= 40 || delta < -8) {
      nav.classList.remove('nav-hidden');
    } else if (delta > 10 && curY > 60) {
      nav.classList.add('nav-hidden');
    }
    lastY = curY;
  }, { passive: true });
}

function initPinchZoomGesture() {
  if (window._pinchZoomBound) return;
  window._pinchZoomBound = true;
  let startDist = 0;
  let startZoom = 100;

  function getTouchDist(t1, t2) {
    const dx = t1.clientX - t2.clientX;
    const dy = t1.clientY - t2.clientY;
    return Math.hypot(dx, dy);
  }

  document.addEventListener('touchstart', e => {
    if (e.touches && e.touches.length === 2) {
      startDist = getTouchDist(e.touches[0], e.touches[1]);
      startZoom = _uiZoomPct;
    }
  }, { passive: true });

  document.addEventListener('touchmove', e => {
    if (e.touches && e.touches.length === 2 && startDist > 20) {
      const dist = getTouchDist(e.touches[0], e.touches[1]);
      const scale = dist / startDist;
      const nextZoom = Math.max(50, Math.min(150, Math.round((startZoom * scale) / 5) * 5));
      if (nextZoom !== _uiZoomPct) {
        applyUiZoom(nextZoom);
      }
    }
  }, { passive: true });

  document.addEventListener('touchend', e => {
    if (!e.touches || e.touches.length < 2) {
      startDist = 0;
    }
  }, { passive: true });
}

function adjustUiZoom(deltaPct) {
  applyUiZoom(_uiZoomPct + deltaPct);
}

function resetUiZoom() {
  applyUiZoom(100);
}

function applyChartThemeDefaults() {
  if (typeof Chart === 'undefined') return;
  const isLight = document.body.classList.contains('light-mode');
  Chart.defaults.color = isLight ? '#475569' : '#94A3B8';
  Chart.defaults.borderColor = isLight ? 'rgba(5, 150, 105, 0.12)' : 'rgba(0, 229, 153, 0.08)';
  Chart.defaults.font.family = "'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, sans-serif";
  Chart.defaults.resizeDelay = 120;
  // Disable Chart.js built-in pointer events (which miscalculate coordinates under CSS zoom on Android WebView)
  // and drive both tooltip and top readout exclusively from our zoom-corrected pointer handler
  Chart.defaults.events = [];
  if (Chart.defaults.plugins?.tooltip) {
    Chart.defaults.plugins.tooltip.backgroundColor = isLight ? 'rgba(6, 32, 25, 0.94)' : 'rgba(4, 14, 10, 0.95)';
    Chart.defaults.plugins.tooltip.titleColor = '#FFFFFF';
    Chart.defaults.plugins.tooltip.bodyColor = '#E2E8F0';
    Chart.defaults.plugins.tooltip.borderColor = 'rgba(0, 229, 153, 0.45)';
    Chart.defaults.plugins.tooltip.borderWidth = 1;
    Chart.defaults.plugins.tooltip.padding = 10;
    Chart.defaults.plugins.tooltip.cornerRadius = 10;
    Chart.defaults.plugins.tooltip.boxPadding = 4;
  }
}

function handleChartLegendClick(chart, relX, relY) {
  const legend = chart?.legend;
  const boxes = legend?.legendHitBoxes;
  const items = legend?.legendItems;
  if (!boxes || !items) return false;
  for (let i = 0; i < boxes.length; i++) {
    const b = boxes[i];
    if (relX >= b.left && relX <= b.left + b.width && relY >= b.top && relY <= b.top + b.height) {
      const item = items[i];
      if (item && typeof item.datasetIndex === 'number') {
        const vis = chart.isDatasetVisible(item.datasetIndex);
        chart.setDatasetVisibility(item.datasetIndex, !vis);
        chart.update();
        return true;
      } else if (item && typeof item.index === 'number') {
        chart.toggleDataVisibility(item.index);
        chart.update();
        return true;
      }
    }
  }
  return false;
}

function bindChartTouchInspector(chart) {
  if (!chart || !chart.canvas) return;
  if (chart.options) chart.options.events = [];
  if (chart.config?.options) chart.config.options.events = [];
  if (typeof chart._unbindEvents === 'function') chart._unbindEvents();
  const canvas = chart.canvas;
  const cardBody = canvas.closest('.card-body');
  let readout = cardBody ? cardBody.querySelector('.chart-active-readout') : null;
  if (cardBody && !readout) {
    readout = document.createElement('div');
    readout.className = 'chart-active-readout';
    readout.innerHTML = `<span class="chart-readout-hint">${tr('👆 Tap or hover on any bar/slice to view exact amount', '👆 Chạm hoặc di chuột vào cột/múi biểu đồ để xem số tiền')}</span>`;
    cardBody.insertBefore(readout, cardBody.firstChild);
  } else if (readout && !readout.classList.contains('active')) {
    readout.innerHTML = `<span class="chart-readout-hint">${tr('👆 Tap or hover on any bar/slice to view exact amount', '👆 Chạm hoặc di chuột vào cột/múi biểu đồ để xem số tiền')}</span>`;
  }

  function renderReadoutForIndex(idx, isDoughnut) {
    if (!readout) return;
    const labels = chart.data?.labels || [];
    const rawLabel = labels[idx] !== undefined ? String(labels[idx]) : '';
    const titleLabel = (canvas.id === 'dashDailyChart' && /^\d+$/.test(rawLabel))
      ? `${tr('Day', 'Ngày')} ${rawLabel}`
      : rawLabel;

    if (isDoughnut) {
      const ds = chart.data.datasets?.[0];
      if (!ds) return;
      const val = Number(ds.data?.[idx] || 0);
      const total = (ds.data || []).reduce((s, v) => s + Number(v || 0), 0);
      const pct = total > 0 ? ((val / total) * 100).toFixed(1) : '0.0';
      const color = Array.isArray(ds.backgroundColor) ? ds.backgroundColor[idx] : (ds.backgroundColor || 'var(--primary)');
      readout.innerHTML = `
        <span class="chart-readout-title">${escapeHtml(titleLabel)}</span>
        <span class="chart-readout-item">
          <span class="chart-readout-dot" style="background:${color}"></span>
          <strong class="sensitive-amount">${fmtVND(val)}</strong>
          <span class="chart-readout-pct">(${pct}%)</span>
        </span>
      `;
      readout.classList.add('active');
      return;
    }

    const itemsHtml = [];
    (chart.data.datasets || []).forEach((ds, dsIdx) => {
      if (!chart.isDatasetVisible(dsIdx)) return;
      const val = Number(ds.data?.[idx] || 0);
      const color = ds.borderColor || (Array.isArray(ds.backgroundColor) ? ds.backgroundColor[idx] : ds.backgroundColor) || 'var(--primary)';
      itemsHtml.push(`
        <span class="chart-readout-item">
          <span class="chart-readout-dot" style="background:${color}"></span>
          <span class="chart-readout-ds">${escapeHtml(ds.label || '')}:</span>
          <strong class="sensitive-amount">${fmtVND(val)}</strong>
        </span>
      `);
    });

    if (itemsHtml.length > 0) {
      readout.innerHTML = `<span class="chart-readout-title">${escapeHtml(titleLabel)}</span>${itemsHtml.join('')}`;
      readout.classList.add('active');
    }
  }

  function handlePointerAt(clientX, clientY, isClick = false) {
    if (!chart.ctx || !chart.width || !chart.height) return;
    const rect = canvas.getBoundingClientRect();
    if (!rect.width || !rect.height) return;

    // Zoom-independent coordinate mapping (fixes CSS zoom & WebView scale offset)
    const relX = ((clientX - rect.left) / rect.width) * chart.width;
    const relY = ((clientY - rect.top) / rect.height) * chart.height;

    const area = chart.chartArea;
    if (area && relY < area.top - 2) {
      if (isClick) handleChartLegendClick(chart, relX, relY);
      return;
    }

    const type = chart.config?.type;
    if (type === 'doughnut' || type === 'pie') {
      const meta = chart.getDatasetMeta(0);
      if (!meta || !meta.data || !meta.data.length) return;
      const firstArc = meta.data[0];
      const dx = relX - firstArc.x;
      const dy = relY - firstArc.y;
      const dist = Math.hypot(dx, dy);
      if (dist < (firstArc.innerRadius || 0) * 0.6 || dist > (firstArc.outerRadius || 999) * 1.18) return;
      let angle = Math.atan2(dy, dx);
      let foundIdx = -1;
      for (let i = 0; i < meta.data.length; i++) {
        const arc = meta.data[i];
        let s = arc.startAngle;
        let e = arc.endAngle;
        let a = angle;
        while (a < s) a += Math.PI * 2;
        while (a > s + Math.PI * 2) a -= Math.PI * 2;
        if (a >= s && a <= e) {
          foundIdx = i;
          break;
        }
      }
      if (foundIdx >= 0) {
        const active = [{ datasetIndex: 0, index: foundIdx }];
        chart.setActiveElements(active);
        chart.tooltip?.setActiveElements(active, { x: relX, y: relY });
        chart.update('none');
        renderReadoutForIndex(foundIdx, true);
      }
      return;
    }

    // Cartesian bar / line chart: snap to true X-axis column center so tooltip and top readout always match 100%
    const labelCount = (chart.data?.labels || []).length;
    if (!labelCount) return;

    let bestIdx = -1;
    let bestDist = Infinity;
    let targetX = relX;
    let targetY = area ? (area.top + area.bottom) / 2 : relY;
    const xScale = chart.scales?.x;

    for (let idx = 0; idx < labelCount; idx++) {
      let colX = xScale ? xScale.getPixelForValue(idx) : NaN;
      if (!Number.isFinite(colX)) {
        const xs = [];
        (chart.data.datasets || []).forEach((_, dsIdx) => {
          if (!chart.isDatasetVisible(dsIdx)) return;
          const pt = chart.getDatasetMeta(dsIdx)?.data?.[idx];
          if (pt && Number.isFinite(pt.x)) xs.push(pt.x);
        });
        if (xs.length) colX = xs.reduce((a, b) => a + b, 0) / xs.length;
      }
      if (!Number.isFinite(colX)) continue;
      const d = Math.abs(colX - relX);
      if (d < bestDist) {
        bestDist = d;
        bestIdx = idx;
        targetX = colX;
      }
    }

    if (bestIdx === -1) return;

    const active = [];
    let minBarY = area ? area.bottom : chart.height;
    (chart.data.datasets || []).forEach((_, dsIdx) => {
      const pt = chart.getDatasetMeta(dsIdx)?.data?.[bestIdx];
      if (chart.isDatasetVisible(dsIdx) && pt) {
        active.push({ datasetIndex: dsIdx, index: bestIdx });
        if (Number.isFinite(pt.y) && pt.y < minBarY) minBarY = pt.y;
      }
    });

    if (area) {
      targetY = Math.max(area.top + 18, Math.min(minBarY, area.bottom - 18));
    }

    chart.setActiveElements(active);
    chart.tooltip?.setActiveElements(active, { x: targetX, y: targetY });
    chart.update('none');
    renderReadoutForIndex(bestIdx, false);
  }

  if (!canvas._touchInspectorBound) {
    canvas._touchInspectorBound = true;
    let startX = 0;
    let startY = 0;

    canvas.addEventListener('touchstart', e => {
      if (!e.touches || e.touches.length !== 1) return;
      startX = e.touches[0].clientX;
      startY = e.touches[0].clientY;
      canvas._activeChartInstance?._handlePointerAt(startX, startY, false);
    }, { passive: true });

    canvas.addEventListener('touchmove', e => {
      if (!e.touches || e.touches.length !== 1) return;
      const dx = Math.abs(e.touches[0].clientX - startX);
      const dy = Math.abs(e.touches[0].clientY - startY);
      if (dx >= dy * 0.7) {
        canvas._activeChartInstance?._handlePointerAt(e.touches[0].clientX, e.touches[0].clientY, false);
      }
    }, { passive: true });

    canvas.addEventListener('mousemove', e => {
      canvas._activeChartInstance?._handlePointerAt(e.clientX, e.clientY, false);
    }, { passive: true });

    canvas.addEventListener('click', e => {
      canvas._activeChartInstance?._handlePointerAt(e.clientX, e.clientY, true);
    });
  }

  chart._handlePointerAt = handlePointerAt;
  canvas._activeChartInstance = chart;
}

function updateThemeBtnLabel(isLight) {
  const btn = document.getElementById('theme-toggle-btn');
  if (btn) {
    btn.innerHTML = isLight
      ? `<span class="theme-btn-icon">🌙</span><span class="theme-btn-text"> ${tr('Dark', 'Tối')}</span>`
      : `<span class="theme-btn-icon">☀️</span><span class="theme-btn-text"> ${tr('Light', 'Sáng')}</span>`;
  }
}

function initTheme() {
  try {
    const saved = localStorage.getItem(THEME_MODE_KEY);
    const isLight = saved === 'light';
    document.body.classList.toggle('light-mode', isLight);
    updateThemeBtnLabel(isLight);
  } catch(e) {}
  applyChartThemeDefaults();
}

function toggleTheme() {
  const isLight = document.body.classList.toggle('light-mode');
  updateThemeBtnLabel(isLight);
  try { localStorage.setItem(THEME_MODE_KEY, isLight ? 'light' : 'dark'); } catch(e) {}
  applyChartThemeDefaults();
  if (typeof renderDashboard === 'function') renderDashboard();
  const activePage = document.querySelector('.page.active');
  if (activePage?.id === 'page-charts' && typeof renderCharts === 'function') renderCharts();
  if (activePage?.id === 'page-portfolio' && typeof renderPortfolio === 'function') renderPortfolio();
}

// Init language, theme, sidebar & zoom immediately on script load
initLanguage();
initTheme();
initSidebarCollapse();
initUiZoom();

// ── Init ──
async function initApp() {
  initLanguage();
  initTheme();
  initSidebarCollapse();
  initUiZoom();
  initPrivacyMask();

  const dateEl = document.getElementById('f-date');
  if (dateEl) dateEl.value = new Date().toISOString().slice(0,10);

  const now = new Date();
  _dashYm = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}`;

  initChartDateRange(12);
  updateCurrentMonthLabel();
  await loadAppData();

  initAmountInputFormatting();
  refreshCategoryControls();
  populateFilterOptions();
  populateDashMonthSelect();
  renderDashboard();
  renderBudget();
  if (typeof renderPortfolio === 'function') renderPortfolio();
  renderExportStats();

  // Auto-launch interactive Spotlight Tour on first-time visit
  try {
    if (localStorage.getItem(ONBOARDING_TOUR_KEY) !== 'true') {
      setTimeout(() => startOnboardingTour(false), 650);
    }
  } catch(e) {}
}

function getPrivacyEyeSvg(masked) {
  if (masked) {
    return `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/><path d="M14.12 14.12a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>`;
  }
  return `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" fill="rgba(0, 229, 153, 0.10)"/><circle cx="12" cy="12" r="3.2" fill="rgba(0, 229, 153, 0.28)"/></svg>`;
}

function initPrivacyMask() {
  try {
    const masked = localStorage.getItem(PRIVACY_MASK_KEY) === 'true';
    document.body.classList.toggle('privacy-masked', masked);
    const btn = document.getElementById('privacy-toggle-btn');
    if (btn) btn.innerHTML = getPrivacyEyeSvg(masked);
  } catch(e) {}
}

function togglePrivacyMask() {
  const masked = document.body.classList.toggle('privacy-masked');
  const btn = document.getElementById('privacy-toggle-btn');
  if (btn) btn.innerHTML = getPrivacyEyeSvg(masked);
  try { localStorage.setItem(PRIVACY_MASK_KEY, String(masked)); } catch(e) {}
}

function quickAddTransaction(type) {
  navigate('add');
  if (typeof setType === 'function') setType(type);
  requestAnimationFrame(() => {
    document.getElementById('f-amount-display')?.focus();
  });
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
  const selected = sel.value;
  const categories = getCategories(_txType);
  sel.innerHTML = '';
  categories.forEach(c => {
    const o = document.createElement('option');
    o.value = c.id;
    o.textContent = c.icon + ' ' + c.label;
    sel.appendChild(o);
  });
  sel.disabled = categories.length === 0;
  if (categories.length === 0) {
    const option = document.createElement('option');
    option.value = '';
    option.textContent = tr('No categories — add one in Budget', 'Chưa có danh mục — hãy thêm trong Ngân sách');
    sel.appendChild(option);
  } else if (categories.some(category => category.id === selected)) {
    sel.value = selected;
  }
}

function populateFilterOptions() {
  const data = getData();
  const sel = document.getElementById('filter-month');
  if (!sel) return;
  const months = [...new Set(data.transactions.map(t => t.date.slice(0,7)))].sort().reverse();
  months.forEach(m => {
    const existing = sel.querySelector(`option[value="${m}"]`);
    if (existing) {
      existing.textContent = fmtMonthLabel(m);
      return;
    }
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
  budget: 'Monthly Budget',
  portfolio: 'Investment Portfolio',
  export: 'Cloud Backup',
};

const pageTitlesVi = {
  dashboard: 'Bảng Điều Khiển',
  add: 'Thêm Giao Dịch',
  list: 'Lịch Sử Giao Dịch',
  charts: 'Biểu Đồ & Phân Tích',
  budget: 'Ngân Sách Tháng',
  portfolio: 'Danh Mục Đầu Tư',
  export: 'Sao Lưu Đám Mây',
};

function getPageTitle(page) {
  return _lang === 'vi' ? (pageTitlesVi[page] || pageTitles[page]) : pageTitles[page];
}

function navigate(page) {
  document.getElementById('mobile-bottom-nav')?.classList.remove('nav-hidden');
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
  document.querySelectorAll('.mnav-item').forEach(m => m.classList.toggle('active', m.dataset.page === page));
  document.getElementById('page-' + page).classList.add('active');
  const navEl = document.querySelector(`#sidebar [onclick="navigate('${page}')"]`);
  if (navEl) navEl.classList.add('active');
  const titleEl = document.getElementById('page-title');
  if (titleEl) titleEl.textContent = getPageTitle(page);
  closeSidebar();
  window.scrollTo({ top: 0, behavior: 'instant' });

  if (page === 'list') renderList();
  if (page === 'charts') renderCharts();
  if (page === 'budget') renderBudget();
  if (page === 'portfolio' && typeof renderPortfolio === 'function') renderPortfolio();
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
  if (_lang === 'vi') {
    return `${parseInt(dy, 10)}/${parseInt(mo, 10)}/${yr}`;
  }
  return `${MONTHS_SHORT_EN[parseInt(mo, 10)-1]} ${parseInt(dy, 10)}, ${yr}`;
}

function fmtMonthLabel(ym) {
  const [yr, mo] = ym.split('-');
  if (_lang === 'vi') {
    return `Th${parseInt(mo, 10)}/${yr.slice(2)}`;
  }
  return `${MONTHS_SHORT_EN[parseInt(mo, 10)-1]} '${yr.slice(2)}`;
}

// ── Toast ──
function showToast(msg, type = 'info') {
  const container = document.getElementById('toast-container');
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.setAttribute('role', type === 'error' ? 'alert' : 'status');
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
  if ((e.key === 'Enter' || e.key === ' ') && e.target?.matches?.('[role="button"][tabindex="0"]')) {
    e.preventDefault();
    e.target.click();
    return;
  }

  const modal = document.getElementById('delete-modal');
  if (!modal?.classList.contains('open')) return;
  if (e.key === 'Escape') {
    closeModal();
    return;
  }
  if (e.key !== 'Tab') return;

  const focusable = [...modal.querySelectorAll('button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])')]
    .filter(element => element.offsetParent !== null);
  if (focusable.length === 0) return;
  const first = focusable[0];
  const last = focusable[focusable.length - 1];
  if (e.shiftKey && document.activeElement === first) {
    e.preventDefault();
    last.focus();
  } else if (!e.shiftKey && document.activeElement === last) {
    e.preventDefault();
    first.focus();
  }
});

function initAmountInputFormatting() {
  const displayInput = document.getElementById('f-amount-display');
  const hiddenInput = document.getElementById('f-amount');

  if (!displayInput || !hiddenInput) return;
  if (displayInput.dataset.formattingInitialized === 'true') return;
  displayInput.dataset.formattingInitialized = 'true';

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

async function forceUpdateApp() {
  showToast(tr('Checking for latest version...', 'Đang kiểm tra phiên bản mới nhất...'), 'info');
  try {
    if ('serviceWorker' in navigator) {
      const regs = await navigator.serviceWorker.getRegistrations();
      await Promise.all(regs.map(r => r.unregister()));
    }
    if ('caches' in window) {
      const keys = await caches.keys();
      await Promise.all(keys.map(k => caches.delete(k)));
    }
  } catch(e) {}
  window.location.reload();
}

// ═══════════════════════════════════════════════
//  INTERACTIVE SPOTLIGHT ONBOARDING TOUR
// ═══════════════════════════════════════════════

const ONBOARDING_STEPS = [
  {
    page: 'dashboard',
    selector: '.gfx-hero-banner',
    title: '💰 Tổng Số Dư & Chế Độ Ẩn Tiền',
    desc: 'Hiển thị tổng số dư ròng toàn thời gian của bạn. Nhấn vào biểu tượng con mắt màu xanh ngọc bên cạnh lời chào để làm mờ toàn bộ số tiền nhạy cảm trên ứng dụng.',
    titleEn: '💰 Total Net Balance & Privacy Mask',
    descEn: 'Displays your all-time net portfolio balance. Tap the emerald eye icon next to the greeting to blur all sensitive monetary values across the app.'
  },
  {
    page: 'dashboard',
    selector: '#summary-grid',
    title: '📊 Chỉ Số Tháng & Biểu Đồ Tương Tác',
    desc: 'Theo dõi nhanh Tổng Thu, Tổng Chi, Tiết Kiệm Ròng và Tỷ Lệ Tiết Kiệm trong tháng. Chạm hoặc di chuột vào bất kỳ cột biểu đồ nào bên dưới để xem số tiền chính xác.',
    titleEn: '📊 Monthly KPIs & Interactive Charts',
    descEn: 'Track Total Income, Total Expenses, Net Saved, and Savings Rate for the selected month. Tap or hover over any chart bar below to inspect exact figures.'
  },
  {
    page: 'add',
    selector: '#page-add .card',
    title: '➕ Ghi Chép Giao Dịch Thu / Chi',
    desc: 'Tạo nhanh khoản Thu nhập (Income) hoặc Chi tiêu (Expense), chọn danh mục, ngày tháng và ghi chú. Số tiền nhập vào được tự động phân cách hàng nghìn.',
    titleEn: '➕ Record Income & Expense Transactions',
    descEn: 'Quickly log an Income or Expense entry, choose a category, date, and note. Amounts are automatically formatted with thousand separators.'
  },
  {
    page: 'list',
    selector: '#page-list .filter-bar',
    title: '🔍 Lịch Sử & Bộ Lọc Thông Minh',
    desc: 'Tìm kiếm giao dịch theo ghi chú, danh mục hoặc số tiền; lọc theo loại Thu/Chi và tháng. Bạn có thể chỉnh sửa hoặc xóa bất kỳ giao dịch nào ngay trong danh sách.',
    titleEn: '🔍 Smart Search & Transaction History',
    descEn: 'Search transactions by category, note, or amount; filter by type and month. You can edit or delete any transaction directly from the list.'
  },
  {
    page: 'charts',
    selector: '#page-charts .chart-controls-row',
    title: '📈 Phân Tích Xu Hướng Dài Hạn',
    desc: 'Xem biểu đồ so sánh Thu - Chi, cơ cấu chi tiêu theo danh mục và xu hướng tích lũy tài sản từ 6 tháng đến 10 năm hoặc tùy chọn khoảng thời gian.',
    titleEn: '📈 Long-Term Analytics & Wealth Trends',
    descEn: 'Inspect Income vs. Expense comparisons, category spending breakdowns, and cumulative wealth trends from 6 months up to 10 years or a custom date range.'
  },
  {
    page: 'budget',
    selector: '#page-budget .dash-month-bar',
    title: '🎯 Ngân Sách Tháng & Sổ Cái (Ledger)',
    desc: 'Thiết lập hạn mức chi tiêu cho từng danh mục, quản lý danh mục tùy chỉnh và nhấn trực tiếp vào ô bất kỳ trong bảng Remaining Budget Ledger bên dưới để chỉnh ngân sách riêng cho từng tháng.',
    titleEn: '🎯 Monthly Budgets & Remaining Budget Ledger',
    descEn: 'Set spending limits per category, manage custom categories, and click any cell in the Remaining Budget Ledger below to customize budgets for specific months.'
  },
  {
    page: 'portfolio',
    selector: '#portfolio-kpi-grid',
    title: '💎 Danh Mục Đầu Tư & Lãi/Lỗ ROI (%)',
    desc: 'Theo dõi Vàng, BTC, ETF, Cổ phiếu hoặc nhấn "+ Thêm Danh Mục Đầu Tư" để tạo mới. Nhấn vào bất kỳ ô mục đầu tư nào để ghi nhận giá trị theo tháng và mở biểu đồ đường cong Lãi/Lỗ (%).',
    titleEn: '💎 Investment Portfolio & Monthly ROI (%)',
    descEn: 'Track Gold, BTC, ETFs, Stocks, or tap "+ Add Investment Category" to create custom assets. Tap any asset card to log monthly valuations and inspect its ROI (%) curve.'
  },
  {
    page: 'export',
    selector: '#page-export .export-grid',
    title: '☁️ Sao Lưu & Khôi Phục Dữ Liệu (Backup)',
    desc: 'Tải xuống toàn bộ giao dịch, ngân sách và danh mục dưới dạng file JSON để sao lưu an toàn, hoặc khôi phục lại dữ liệu từ file JSON bất kỳ lúc nào.',
    titleEn: '☁️ Cloud Backup & JSON Restore',
    descEn: 'Download all your transactions, budgets, and categories as a JSON backup snapshot, or restore your portfolio from a saved JSON file anytime.'
  },
  {
    page: 'dashboard',
    selector: '.topbar-actions',
    title: '✨ Ngôn Ngữ (VI/EN), Giao Diện & Hướng Dẫn',
    desc: 'Chuyển đổi ngôn ngữ Tiếng Việt / Tiếng Anh (VI / EN), phóng to/thu nhỏ giao diện (− / +), đổi nền Sáng/Tối, hoặc nhấn nút "?" bất kỳ lúc nào để xem lại hướng dẫn này.',
    titleEn: '✨ Language (VI/EN), Theme, Zoom & Tour',
    descEn: 'Switch between Vietnamese and English (VI / EN), adjust interface zoom (− / +), toggle Light/Dark mode, or tap "?" anytime to replay this tour.'
  }
];

let _tourActive = false;
let _tourStepIdx = 0;
let _tourSavedZoom = 100;

function startOnboardingTour(manual = false) {
  const overlay = document.getElementById('onboarding-tour');
  if (!overlay) return;
  _tourActive = true;
  _tourStepIdx = 0;
  _tourSavedZoom = _uiZoomPct;
  if (_uiZoomPct !== 100) {
    document.documentElement.style.setProperty('--ui-zoom', '1');
  }
  overlay.style.display = 'block';
  renderOnboardingStep();
}

function stepOnboardingTour(delta) {
  if (!_tourActive) return;
  const nextIdx = _tourStepIdx + delta;
  if (nextIdx < 0) return;
  if (nextIdx >= ONBOARDING_STEPS.length) {
    endOnboardingTour();
    return;
  }
  _tourStepIdx = nextIdx;
  renderOnboardingStep();
}

function endOnboardingTour() {
  _tourActive = false;
  const overlay = document.getElementById('onboarding-tour');
  if (overlay) overlay.style.display = 'none';
  if (_tourSavedZoom !== 100) {
    document.documentElement.style.setProperty('--ui-zoom', (_tourSavedZoom / 100).toFixed(2));
  }
  try {
    localStorage.setItem(ONBOARDING_TOUR_KEY, 'true');
  } catch(e) {}
  navigate('dashboard');
}

function renderOnboardingStep() {
  if (!_tourActive) return;
  const step = ONBOARDING_STEPS[_tourStepIdx];
  if (!step) return;

  const activePage = document.querySelector('.page.active');
  if (!activePage || activePage.id !== `page-${step.page}`) {
    navigate(step.page);
  }

  const badgeEl = document.getElementById('tour-step-badge');
  const titleEl = document.getElementById('tour-title');
  const descEl = document.getElementById('tour-desc');
  const dotsEl = document.getElementById('tour-dots');
  const prevBtn = document.getElementById('tour-prev-btn');
  const nextBtn = document.getElementById('tour-next-btn');
  const skipBtn = document.querySelector('#onboarding-tour .tour-skip-btn');

  if (badgeEl) badgeEl.textContent = `${_tourStepIdx + 1} / ${ONBOARDING_STEPS.length}`;
  if (titleEl) titleEl.textContent = _lang === 'vi' ? step.title : (step.titleEn || step.title);
  if (descEl) descEl.textContent = _lang === 'vi' ? step.desc : (step.descEn || step.desc);
  if (skipBtn) skipBtn.textContent = tr('Skip ✕', 'Bỏ qua ✕');
  if (dotsEl) {
    dotsEl.innerHTML = ONBOARDING_STEPS.map((_, i) =>
      `<span class="tour-dot ${i === _tourStepIdx ? 'active' : ''}"></span>`
    ).join('');
  }
  if (prevBtn) {
    prevBtn.style.visibility = _tourStepIdx === 0 ? 'hidden' : 'visible';
    prevBtn.textContent = tr('‹ Back', '‹ Trước');
  }
  if (nextBtn) {
    nextBtn.textContent = _tourStepIdx === ONBOARDING_STEPS.length - 1
      ? tr('Done ✓', 'Hoàn tất ✓')
      : tr('Next ›', 'Tiếp ›');
  }

  requestAnimationFrame(() => {
    const target = document.querySelector(step.selector);
    if (target) {
      try {
        target.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'nearest' });
      } catch(e) {}
    }
    positionTourElements();
    setTimeout(positionTourElements, 260);
  });
}

function positionTourElements() {
  if (!_tourActive) return;
  const step = ONBOARDING_STEPS[_tourStepIdx];
  const spot = document.getElementById('tour-spotlight');
  const card = document.getElementById('tour-card');
  if (!step || !spot || !card) return;

  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const target = document.querySelector(step.selector);

  let sTop = vh / 2 - 40;
  let sLeft = vw / 2 - 120;
  let sWidth = 240;
  let sHeight = 80;

  if (target) {
    const r = target.getBoundingClientRect();
    const pad = 6;
    const maxSpotH = Math.round(vh * 0.48);
    sWidth = Math.min(vw - 16, Math.max(48, Math.round(r.width + pad * 2)));
    sHeight = Math.min(maxSpotH, Math.max(38, Math.round(r.height + pad * 2)));
    sLeft = Math.max(8, Math.min(vw - sWidth - 8, Math.round(r.left - pad)));
    sTop = Math.max(8, Math.min(vh - sHeight - 8, Math.round(r.top - pad)));
  }

  spot.style.top = `${sTop}px`;
  spot.style.left = `${sLeft}px`;
  spot.style.width = `${sWidth}px`;
  spot.style.height = `${sHeight}px`;

  const cRect = card.getBoundingClientRect();
  const cW = cRect.width || Math.min(370, vw - 24);
  const cH = cRect.height || 190;

  const spaceBelow = vh - (sTop + sHeight);
  const spaceAbove = sTop;

  let cTop;
  if (spaceBelow >= cH + 20 || spaceBelow >= spaceAbove) {
    cTop = Math.min(vh - cH - 14, sTop + sHeight + 14);
  } else {
    cTop = Math.max(14, sTop - cH - 14);
  }

  const spotCenterX = sLeft + sWidth / 2;
  const cLeft = Math.max(12, Math.min(vw - cW - 12, Math.round(spotCenterX - cW / 2)));

  card.style.top = `${Math.round(cTop)}px`;
  card.style.left = `${cLeft}px`;
}

window.addEventListener('resize', () => {
  if (_tourActive) positionTourElements();
});
window.addEventListener('scroll', () => {
  if (_tourActive) positionTourElements();
}, { passive: true });
