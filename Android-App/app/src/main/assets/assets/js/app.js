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
let _uiZoomPct = 100;

const MONTHS_SHORT = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
const MONTHS_FULL = ['January','February','March','April','May','June','July','August','September','October','November','December'];

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
    readout.innerHTML = '<span class="chart-readout-hint">👆 Tap or hover on any bar/slice to view exact amount</span>';
    cardBody.insertBefore(readout, cardBody.firstChild);
  }

  function renderReadoutForIndex(idx, isDoughnut) {
    if (!readout) return;
    const labels = chart.data?.labels || [];
    const rawLabel = labels[idx] !== undefined ? String(labels[idx]) : '';
    const titleLabel = (canvas.id === 'dashDailyChart' && /^\d+$/.test(rawLabel))
      ? `Day ${rawLabel}`
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
      ? '<span class="theme-btn-icon">🌙</span><span class="theme-btn-text"> Dark</span>'
      : '<span class="theme-btn-icon">☀️</span><span class="theme-btn-text"> Light</span>';
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

// Init theme, sidebar & zoom immediately on script load
initTheme();
initSidebarCollapse();
initUiZoom();

// ── Init ──
async function initApp() {
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

  // Initialize MoMo settings UI (Android WebView bridge when available)
  if (typeof initMomoSettings === 'function') initMomoSettings();
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
    option.textContent = 'No categories — add one in Budget';
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
  budget: 'Monthly Budget',
  portfolio: 'Investment Portfolio',
  export: 'MoMo Sync & Backup',
};

function navigate(page) {
  document.getElementById('mobile-bottom-nav')?.classList.remove('nav-hidden');
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
  document.querySelectorAll('.mnav-item').forEach(m => m.classList.toggle('active', m.dataset.page === page));
  document.getElementById('page-' + page).classList.add('active');
  const navEl = document.querySelector(`#sidebar [onclick="navigate('${page}')"]`);
  if (navEl) navEl.classList.add('active');
  const titleEl = document.getElementById('page-title');
  if (titleEl) titleEl.textContent = pageTitles[page];
  closeSidebar();
  window.scrollTo({ top: 0, behavior: 'instant' });

  if (page === 'list') renderList();
  if (page === 'charts') renderCharts();
  if (page === 'budget') renderBudget();
  if (page === 'portfolio' && typeof renderPortfolio === 'function') renderPortfolio();
  if (page === 'export') { renderExportStats(); if (typeof initMomoSettings === 'function') initMomoSettings(); }
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
  showToast('Checking for latest version...', 'info');
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
