// ═══════════════════════════════════════════════
//  BUDGET — Default & Per-Month Historical Budgets
// ═══════════════════════════════════════════════

let _budgetYm = 'default';

function getCurrentYm() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}`;
}

function getEffectiveBudget(data, ym, catId) {
  if (ym && ym !== 'default' && data.monthlyBudgets?.[ym] && Object.prototype.hasOwnProperty.call(data.monthlyBudgets[ym], catId)) {
    return data.monthlyBudgets[ym][catId];
  }
  return data.budgets?.[catId] || 0;
}

function hasCustomMonthlyBudget(data, ym, catId) {
  return Boolean(ym && ym !== 'default' && data.monthlyBudgets?.[ym] && Object.prototype.hasOwnProperty.call(data.monthlyBudgets[ym], catId));
}

function populateBudgetMonthSelect() {
  const sel = document.getElementById('budget-month-select');
  if (!sel) return;
  const data = getData();
  const currentYm = getCurrentYm();

  const monthSet = new Set();
  const now = new Date();
  for (let i = 0; i < 24; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    monthSet.add(`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`);
  }
  (data.transactions || []).forEach(t => {
    if (t.date) monthSet.add(t.date.slice(0, 7));
  });
  Object.keys(data.monthlyBudgets || {}).forEach(ym => monthSet.add(ym));

  const months = Array.from(monthSet).sort((a, b) => b.localeCompare(a));
  const [curYr, curMo] = currentYm.split('-');
  const curLabel = `${MONTHS_FULL[parseInt(curMo, 10) - 1]} ${curYr}`;

  let html = `<option value="default" ${_budgetYm === 'default' ? 'selected' : ''}>${tr(`Default Base Budgets (Current: ${curLabel})`, `Ngân Sách Mặc Định (Hiện tại: ${curLabel})`)}</option>`;
  months.forEach(ym => {
    const [yr, mo] = ym.split('-');
    const customCount = Object.keys(data.monthlyBudgets?.[ym] || {}).length;
    const suffix = customCount > 0 ? tr(` ★ (${customCount} custom)`, ` ★ (${customCount} tùy chỉnh)`) : '';
    html += `<option value="${ym}" ${_budgetYm === ym ? 'selected' : ''}>${MONTHS_FULL[parseInt(mo, 10) - 1]} ${yr}${suffix}</option>`;
  });
  sel.innerHTML = html;
}

function onBudgetMonthChange() {
  const sel = document.getElementById('budget-month-select');
  _budgetYm = sel ? sel.value : 'default';
  renderBudget();
}

function renderBudget() {
  const data = getData();
  populateBudgetMonthSelect();

  const currentYm = getCurrentYm();
  const targetYm = _budgetYm === 'default' ? currentYm : _budgetYm;
  const isCustomMonthMode = _budgetYm !== 'default';

  const hintEl = document.getElementById('budget-period-hint');
  const resetMonthBtn = document.getElementById('budget-reset-month-btn');
  const customCountForMonth = isCustomMonthMode ? Object.keys(data.monthlyBudgets?.[targetYm] || {}).length : 0;

  if (hintEl) {
    if (!isCustomMonthMode) {
      hintEl.innerHTML = tr(
        `Editing <strong>Default Budgets</strong> (applies to all months unless overridden).`,
        `Đang sửa <strong>Ngân sách mặc định</strong> (áp dụng cho mọi tháng nếu không đặt riêng).`
      );
    } else {
      hintEl.innerHTML = isVi()
        ? `Đang sửa ngân sách <strong>${fmtMonthLabel(targetYm)}</strong> · ${customCountForMonth > 0 ? `<span style="color:var(--primary)">${customCountForMonth} mục đặt riêng</span>` : 'Đang dùng ngân sách mặc định'}`
        : `Editing <strong>${fmtMonthLabel(targetYm)}</strong> budgets · ${customCountForMonth > 0 ? `<span style="color:var(--primary)">${customCountForMonth} custom override(s)</span>` : 'Using default budgets'}`;
    }
  }
  if (resetMonthBtn) {
    resetMonthBtn.style.display = (isCustomMonthMode && customCountForMonth > 0) ? 'inline-flex' : 'none';
  }

  const monthExp = {};
  data.transactions.filter(t => t.date.startsWith(targetYm) && t.type === 'expense').forEach(t => {
    monthExp[t.category] = (monthExp[t.category] || 0) + t.amount;
  });

  const grid = document.getElementById('budget-grid');
  if (!grid) return;
  const drafts = {};
  grid.querySelectorAll('.budget-item[data-dirty="true"]').forEach(item => {
    const input = item.querySelector('.budget-input');
    if (input) drafts[item.dataset.categoryId] = input.value;
  });

  const expenseCategories = getCategories('expense');
  if (expenseCategories.length === 0) {
    grid.innerHTML = '<div class="empty-state budget-empty"><div class="es-icon">—</div><div class="es-text">No expense categories. Open Manage categories below to add one.</div></div>';
    renderBudgetTotal([], monthExp, data, targetYm);
    renderRemainingBudget();
    return;
  }

  grid.innerHTML = expenseCategories.map(cat => {
    const spent = monthExp[cat.id] || 0;
    const budget = isCustomMonthMode
      ? getEffectiveBudget(data, targetYm, cat.id)
      : (data.budgets?.[cat.id] || 0);
    const isCustomCat = isCustomMonthMode && hasCustomMonthlyBudget(data, targetYm, cat.id);
    const pct = budget > 0 ? Math.min((spent / budget) * 100, 100) : 0;
    const actualPct = budget > 0 ? Math.round((spent / budget) * 100) : 0;
    const over = budget > 0 && spent > budget;
    const warn = budget > 0 && pct >= 80 && !over;

    let statusText = '';
    if (budget > 0) {
      if (over) statusText = `<span class="sensitive-amount" style="color:var(--expense-color);font-weight:600">${tr('Over by', 'Vượt')} ${fmtVND(spent - budget)}</span>`;
      else statusText = `<span class="sensitive-amount" style="color:var(--text-muted)">${tr('Remaining:', 'Còn lại:')} ${fmtVND(budget - spent)}</span>`;
    } else {
      statusText = `<span style="color:var(--text-muted);font-size:12px">${tr('No budget set', 'Chưa đặt ngân sách')}</span>`;
    }

    const customBadge = isCustomCat
      ? `<span class="badge income" style="font-size:12px;padding:1px 6px;margin-left:6px" title="${tr(`Custom budget for ${fmtMonthLabel(targetYm)}`, `Ngân sách riêng cho ${fmtMonthLabel(targetYm)}`)}">${fmtMonthLabel(targetYm)}</span>`
      : '';

    const progressText = budget > 0
      ? (over ? `${actualPct}% used, over by ${fmtVND(spent - budget)}` : `${actualPct}% used, ${fmtVND(budget - spent)} remaining`)
      : 'No budget set';

    return `<div class="budget-item" data-category-id="${escapeHtml(cat.id)}">
      <div class="budget-header">
        <div class="budget-cat">${categoryHtml(cat)}${customBadge}</div>
        ${statusText}
      </div>
      <div class="budget-amounts">
        <span>${tr('Spent', 'Đã chi')} (${fmtMonthLabel(targetYm)}): <strong class="sensitive-amount">${fmtVND(spent)}</strong></span>
        <span>${tr('Budget:', 'Hạn mức:')} <strong class="sensitive-amount">${budget > 0 ? fmtVND(budget) : '\u2014'}</strong></span>
      </div>
      <div class="progress-bar" role="progressbar" aria-label="${escapeHtml(cat.label)} budget usage" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${Math.min(actualPct, 100)}" aria-valuetext="${escapeHtml(progressText)}">
        <div class="progress-fill ${over ? 'over' : warn ? 'warn' : ''}" style="width:${pct}%"></div>
      </div>
      <div class="budget-edit">
        <input type="text" inputmode="numeric" class="budget-input" placeholder="${isCustomMonthMode ? tr(`Budget for ${fmtMonthLabel(targetYm)}...`, `Ngân sách ${fmtMonthLabel(targetYm)}...`) : tr('Default budget...', 'Ngân sách mặc định...')}" aria-label="Budget for ${escapeHtml(cat.label)}"
          value="${budget > 0 ? new Intl.NumberFormat('vi-VN').format(budget) : ''}" style="min-width:0">
        <button type="button" class="btn btn-primary budget-save-btn" style="white-space:nowrap;padding:6px 12px;font-size:12px">${tr('Save', 'Lưu')}</button>
        ${isCustomCat ? `<button type="button" class="btn btn-outline budget-revert-btn" title="${tr('Revert to Default Budget', 'Khôi phục ngân sách mặc định')}" style="padding:6px 9px;font-size:12px">↺</button>` : ''}
      </div>
    </div>`;
  }).join('');

  grid.querySelectorAll('.budget-item').forEach(item => {
    const categoryId = item.dataset.categoryId;
    const input = item.querySelector('.budget-input');
    const button = item.querySelector('.budget-save-btn');
    const revertBtn = item.querySelector('.budget-revert-btn');
    if (Object.prototype.hasOwnProperty.call(drafts, categoryId) && input) {
      input.value = drafts[categoryId];
      item.dataset.dirty = 'true';
    }
    input?.addEventListener('input', () => {
      formatBudgetInput(input);
      item.dataset.dirty = 'true';
    });
    input?.addEventListener('keydown', event => {
      if (event.key === 'Enter') {
        event.preventDefault();
        saveBudget(categoryId, input);
      }
    });
    button?.addEventListener('click', () => saveBudget(categoryId, input));
    revertBtn?.addEventListener('click', () => revertCategoryMonthBudget(targetYm, categoryId));
  });

  renderBudgetTotal(expenseCategories, monthExp, data, targetYm);
  renderRemainingBudget();
}

function renderBudgetTotal(cats, monthExp, data, targetYm) {
  const el = document.getElementById('budget-total');
  if (!el) return;
  const isCustomMonthMode = _budgetYm !== 'default';
  let totalBudget = 0, totalSpent = 0;
  cats.forEach(cat => {
    const b = isCustomMonthMode
      ? getEffectiveBudget(data, targetYm, cat.id)
      : (data.budgets?.[cat.id] || 0);
    if (b > 0) { totalBudget += b; totalSpent += monthExp[cat.id] || 0; }
  });
  if (totalBudget === 0) { el.innerHTML = ''; return; }
  const over = totalSpent > totalBudget;
  const remaining = totalBudget - totalSpent;
  const remColor = over ? 'var(--expense-color)' : 'var(--income-color)';
  const remText = over
    ? `${tr('Over by', 'Vượt')} <strong class="sensitive-amount">${fmtVND(totalSpent - totalBudget)}</strong>`
    : `${tr('Remaining:', 'Còn lại:')} <strong class="sensitive-amount">${fmtVND(remaining)}</strong>`;
  el.innerHTML = `<div class="budget-total-bar">
    <span class="budget-total-label">💰 ${tr('Total Budget', 'Tổng Ngân Sách')} (${fmtMonthLabel(targetYm)})</span>
    <span>${tr('Spent:', 'Đã chi:')} <strong class="sensitive-amount">${fmtVND(totalSpent)}</strong></span>
    <span>${tr('Budget:', 'Hạn mức:')} <strong class="sensitive-amount">${fmtVND(totalBudget)}</strong></span>
    <span style="color:${remColor}">${remText}</span>
  </div>`;
}

function formatBudgetInput(el) {
  const digits = el.value.replace(/\D/g, '');
  if (digits) {
    el.value = new Intl.NumberFormat('vi-VN').format(parseInt(digits, 10));
  } else {
    el.value = '';
  }
}

function saveBudget(catId, input = null) {
  const category = getCategories('expense').find(item => item.id === catId);
  if (!category) { showToast('This category is no longer active', 'error'); return; }
  const raw = (input?.value || '').replace(/\D/g, '');
  const val = raw === '' ? 0 : parseInt(raw, 10);
  if (isNaN(val) || val < 0) { showToast('Invalid value', 'error'); return; }
  const item = input?.closest('.budget-item');
  if (item) item.dataset.dirty = 'false';

  const data = getData();
  if (_budgetYm === 'default') {
    if (!data.budgets) data.budgets = {};
    data.budgets[catId] = val;
    saveData(data);
    renderBudget();
    showToast(`Default budget saved for ${category.label}`, 'success');
  } else {
    if (!data.monthlyBudgets) data.monthlyBudgets = {};
    if (!data.monthlyBudgets[_budgetYm]) data.monthlyBudgets[_budgetYm] = {};
    data.monthlyBudgets[_budgetYm][catId] = val;
    saveData(data);
    renderBudget();
    showToast(`Budget for ${category.label} in ${fmtMonthLabel(_budgetYm)} saved`, 'success');
  }
}

function revertCategoryMonthBudget(ym, catId) {
  const data = getData();
  if (data.monthlyBudgets?.[ym]) {
    delete data.monthlyBudgets[ym][catId];
    if (Object.keys(data.monthlyBudgets[ym]).length === 0) {
      delete data.monthlyBudgets[ym];
    }
    saveData(data);
    renderBudget();
    showToast(`Reverted to default budget for ${fmtMonthLabel(ym)}`, 'info');
  }
}

function resetSelectedMonthBudgets() {
  if (_budgetYm === 'default') return;
  const data = getData();
  if (!data.monthlyBudgets?.[_budgetYm]) return;
  delete data.monthlyBudgets[_budgetYm];
  saveData(data);
  renderBudget();
  showToast(`All budgets for ${fmtMonthLabel(_budgetYm)} reset to default`, 'info');
}

// ═══════════════════════════════════════════════
//  REMAINING BUDGET TABLE (CLICK CELL TO EDIT)
// ═══════════════════════════════════════════════

const REMAINING_BUDGET_MIN_YM = '2026-04';

function getRemainingBudgetMonths() {
  const data = getData();
  const now = new Date();
  const prevDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const prevYm = `${prevDate.getFullYear()}-${String(prevDate.getMonth()+1).padStart(2,'0')}`;
  if (prevYm < REMAINING_BUDGET_MIN_YM) return [];

  const pastMonths = new Set([
    ...(data.transactions || []).map(t => t.date.slice(0, 7)).filter(ym => ym >= REMAINING_BUDGET_MIN_YM && ym <= prevYm),
    ...Object.keys(data.monthlyBudgets || {}).filter(ym => ym >= REMAINING_BUDGET_MIN_YM && ym <= prevYm)
  ]);
  const sortedPast = [...pastMonths].sort();
  if (sortedPast.length === 0) return [];

  const startYm = sortedPast[0] > REMAINING_BUDGET_MIN_YM ? sortedPast[0] : REMAINING_BUDGET_MIN_YM;
  const months = [];
  const [sy, sm] = startYm.split('-').map(Number);
  const [ey, em] = prevYm.split('-').map(Number);
  let y = sy, m = sm;
  while (y < ey || (y === ey && m <= em)) {
    months.push(`${y}-${String(m).padStart(2, '0')}`);
    m++;
    if (m > 12) { m = 1; y++; }
  }
  return months;
}

function hasAnyBudgetForCategory(data, catId) {
  if ((data.budgets?.[catId] || 0) > 0) return true;
  return Object.entries(data.monthlyBudgets || {}).some(([ym, monthMap]) => ym >= REMAINING_BUDGET_MIN_YM && (monthMap?.[catId] || 0) > 0);
}

let _ledgerZoomPct = 100;

function applyLedgerZoom(pct) {
  _ledgerZoomPct = Math.max(45, Math.min(130, Math.round(pct / 5) * 5));
  const tableEl = document.querySelector('.remaining-budget-table');
  const labelEl = document.getElementById('ledger-zoom-label');
  if (tableEl) tableEl.style.zoom = (_ledgerZoomPct / 100).toFixed(2);
  if (labelEl) labelEl.textContent = `${_ledgerZoomPct}%`;
}

function adjustLedgerZoom(delta) {
  applyLedgerZoom(_ledgerZoomPct + delta);
}

function fitLedgerToScreen() {
  const wrap = document.querySelector('.remaining-budget-table-wrap');
  const table = document.querySelector('.remaining-budget-table');
  if (!wrap || !table) return;
  table.style.zoom = '1';
  const naturalWidth = table.scrollWidth || 600;
  const availWidth = wrap.clientWidth - 12;
  const ratio = Math.floor((availWidth / naturalWidth) * 100);
  applyLedgerZoom(Math.max(45, Math.min(100, ratio)));
}

function renderRemainingBudget() {
  const container = document.getElementById('remaining-budget-container');
  if (!container) return;

  const data = getData();

  const budgetCats = getCategories('expense', { includeInactive: true }).filter(c => hasAnyBudgetForCategory(data, c.id));
  if (budgetCats.length === 0) {
    container.innerHTML = `<p style="font-size:13px;color:var(--text-muted)">${tr('Set budgets above to see remaining budget tracking.', 'Hãy đặt ngân sách ở trên để theo dõi bảng số dư ngân sách còn lại.')}</p>`;
    return;
  }

  const months = getRemainingBudgetMonths();
  if (months.length === 0) {
    container.innerHTML = `<p style="font-size:13px;color:var(--text-muted)">${tr('No completed past months yet to calculate remaining budgets.', 'Chưa có dữ liệu tháng trước để tính ngân sách còn lại.')}</p>`;
    return;
  }

  const monthlySpending = {};
  months.forEach(ym => {
    monthlySpending[ym] = {};
    data.transactions.filter(t => t.date.startsWith(ym) && t.type === 'expense').forEach(t => {
      monthlySpending[ym][t.category] = (monthlySpending[ym][t.category] || 0) + t.amount;
    });
  });

  let html = `
    <div class="ledger-toolbar">
      <span class="ledger-toolbar-hint">${tr('↔ Swipe or zoom table · Tap any cell to edit', '↔ Vuốt ngang hoặc thu phóng bảng · Nhấn vào ô bất kỳ để sửa')}</span>
      <div class="ledger-zoom-controls" role="group" aria-label="Ledger Table Zoom">
        <button type="button" class="zoom-step-btn" onclick="adjustLedgerZoom(-10)" title="Zoom Out Table">−</button>
        <button type="button" class="zoom-reset-btn" id="ledger-zoom-label" onclick="applyLedgerZoom(100)" title="Reset Table Zoom">${_ledgerZoomPct}%</button>
        <button type="button" class="zoom-step-btn" onclick="adjustLedgerZoom(10)" title="Zoom In Table">+</button>
        <button type="button" class="ledger-fit-btn" onclick="fitLedgerToScreen()" title="Fit all columns to screen">${tr('Fit', 'Vừa khít')}</button>
      </div>
    </div>
    <div class="remaining-budget-table-wrap"><table class="remaining-budget-table" style="zoom:${(_ledgerZoomPct / 100).toFixed(2)}">`;

  html += `<thead><tr><th style="text-align:left;min-width:95px">${tr('Month', 'Tháng')}</th>`;
  budgetCats.forEach(cat => {
    html += `<th style="text-align:right;min-width:110px">${categoryHtml(cat, true)}</th>`;
  });
  html += '</tr></thead><tbody>';

  const cumulative = {};
  const applicableMonths = {};
  budgetCats.forEach(c => {
    cumulative[c.id] = 0;
    applicableMonths[c.id] = 0;
  });

  months.forEach(ym => {
    html += `<tr><td style="font-weight:700;white-space:nowrap">${fmtMonthLabel(ym)}</td>`;
    budgetCats.forEach(cat => {
      const archiveMonth = cat.archivedAt ? cat.archivedAt.slice(0, 7) : null;
      const appliesToMonth = cat.active !== false || !archiveMonth || ym < archiveMonth;
      if (!appliesToMonth) {
        html += '<td style="text-align:right;color:var(--text-muted);font-size:12px">—</td>';
        return;
      }
      const budget = getEffectiveBudget(data, ym, cat.id);
      const isCustom = hasCustomMonthlyBudget(data, ym, cat.id);
      const spent = monthlySpending[ym]?.[cat.id] || 0;
      const remaining = budget - spent;
      cumulative[cat.id] += remaining;
      applicableMonths[cat.id]++;

      const color = remaining >= 0 ? 'var(--income-color, #00E599)' : 'var(--expense-color, #F43F5E)';
      const sign = remaining >= 0 ? '+' : '';
      const customMark = isCustom ? `<span class="custom-budget-dot" title="Custom budget: ${fmtVND(budget)}">★</span>` : '';
      const tooltip = `${fmtMonthLabel(ym)} · ${cat.label}&#10;Budget: ${fmtVND(budget)}${isCustom ? ' (Custom)' : ' (Default)'}&#10;Spent: ${fmtVND(spent)}&#10;Click to edit ${fmtMonthLabel(ym)} budget`;

      html += `<td class="remaining-cell-editable sensitive-amount" role="button" tabindex="0" title="${tooltip}" onclick="openCellBudgetEditor('${ym}', '${escapeHtml(cat.id)}')" style="text-align:right;color:${color};font-size:12px">
        ${customMark}${sign}${fmtVND(remaining)}
      </td>`;
    });
    html += '</tr>';
  });

  html += `</tbody><tfoot><tr class="remaining-total-row"><td style="font-weight:800">${tr('Total', 'Tổng cộng')}</td>`;
  budgetCats.forEach(cat => {
    if (applicableMonths[cat.id] === 0) {
      html += '<td style="text-align:right;font-weight:700;color:var(--text-muted)">—</td>';
      return;
    }
    const total = cumulative[cat.id];
    const color = total >= 0 ? 'var(--income-color, #00E599)' : 'var(--expense-color, #F43F5E)';
    const sign = total >= 0 ? '+' : '';
    html += `<td class="sensitive-amount" style="text-align:right;font-weight:800;color:${color}">${sign}${fmtVND(total)}</td>`;
  });
  html += '</tr></tfoot></table></div>';
  container.innerHTML = html;
}

function openCellBudgetEditor(ym, catId) {
  const data = getData();
  const cat = getCat(catId, 'expense');
  const defaultBudget = data.budgets?.[catId] || 0;
  const effectiveBudget = getEffectiveBudget(data, ym, catId);
  const isCustom = hasCustomMonthlyBudget(data, ym, catId);
  const spent = data.transactions
    .filter(t => t.date.startsWith(ym) && t.type === 'expense' && t.category === catId)
    .reduce((s, t) => s + t.amount, 0);

  const [yr, mo] = ym.split('-');
  const fullMonthName = `${MONTHS_FULL[parseInt(mo, 10) - 1]} ${yr}`;

  document.getElementById('modal-title').textContent = `${tr('Edit Budget', 'Sửa Ngân Sách')} · ${fullMonthName}`;
  document.getElementById('modal-body').innerHTML = `
    <div style="display:flex;flex-direction:column;gap:12px">
      <div style="display:flex;align-items:center;justify-content:space-between;padding:10px 14px;border-radius:12px;background:var(--primary-xlight);border:1px solid var(--border)">
        <span style="font-weight:700;font-size:14px">${categoryHtml(cat, true)}</span>
        <span class="badge ${isCustom ? 'income' : ''}" style="font-size:12px">${isCustom ? tr('Custom Override', 'Đặt riêng') : tr('Using Default', 'Mặc định')}</span>
      </div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;font-size:12px">
        <div style="padding:10px 12px;border-radius:10px;border:1px solid var(--border)">
          <div style="color:var(--text-muted)">${tr('Actual Spent', 'Đã chi thực tế')} (${fmtMonthLabel(ym)})</div>
          <div style="font-weight:700;font-size:14px;margin-top:2px;font-family:var(--font-mono)">${fmtVND(spent)}</div>
        </div>
        <div style="padding:10px 12px;border-radius:10px;border:1px solid var(--border)">
          <div style="color:var(--text-muted)">${tr('Default Base Budget', 'Ngân sách mặc định')}</div>
          <div style="font-weight:700;font-size:14px;margin-top:2px;font-family:var(--font-mono)">${fmtVND(defaultBudget)}</div>
        </div>
      </div>
      <div class="form-group">
        <label for="modal-month-budget-input">${tr(`Budget for ${fullMonthName} (VND)`, `Ngân sách ${fullMonthName} (VND)`)}</label>
        <input type="text" inputmode="numeric" id="modal-month-budget-input"
          value="${effectiveBudget > 0 ? new Intl.NumberFormat('vi-VN').format(effectiveBudget) : '0'}"
          placeholder="${tr(`Enter budget for ${fullMonthName}...`, `Nhập ngân sách ${fullMonthName}...`)}">
      </div>
    </div>
  `;

  document.getElementById('modal-footer').innerHTML = `
    ${isCustom ? `<button type="button" class="btn btn-outline" id="modal-revert-default-btn" style="margin-right:auto">↺ ${tr('Use Default', 'Dùng mặc định')} (${fmtVND(defaultBudget)})</button>` : ''}
    <button type="button" class="btn btn-outline" onclick="closeModal()">${tr('Cancel', 'Hủy')}</button>
    <button type="button" class="btn btn-primary" id="modal-save-month-budget-btn">${tr(`Save ${fmtMonthLabel(ym)} Budget`, `Lưu ngân sách ${fmtMonthLabel(ym)}`)}</button>
  `;

  const input = document.getElementById('modal-month-budget-input');
  input?.addEventListener('input', () => formatBudgetInput(input));
  input?.addEventListener('keydown', e => {
    if (e.key === 'Enter') {
      e.preventDefault();
      document.getElementById('modal-save-month-budget-btn')?.click();
    }
  });

  document.getElementById('modal-revert-default-btn')?.addEventListener('click', () => {
    revertCategoryMonthBudget(ym, catId);
    closeModal();
  });

  document.getElementById('modal-save-month-budget-btn')?.addEventListener('click', () => {
    const raw = (input?.value || '').replace(/\D/g, '');
    const val = raw === '' ? 0 : parseInt(raw, 10);
    if (isNaN(val) || val < 0) { showToast('Invalid budget amount', 'error'); return; }
    if (!data.monthlyBudgets) data.monthlyBudgets = {};
    if (!data.monthlyBudgets[ym]) data.monthlyBudgets[ym] = {};
    data.monthlyBudgets[ym][catId] = val;
    saveData(data);
    closeModal();
    renderBudget();
    showToast(`Updated ${cat.label} budget for ${fullMonthName}`, 'success');
  });

  openModal(input);
  requestAnimationFrame(() => input?.select());
}
