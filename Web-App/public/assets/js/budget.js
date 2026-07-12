// ═══════════════════════════════════════════════
//  BUDGET
// ═══════════════════════════════════════════════

function renderBudget() {
  const data = getData();
  const now = new Date();
  const ym = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}`;

  const monthExp = {};
  data.transactions.filter(t => t.date.startsWith(ym) && t.type === 'expense').forEach(t => {
    monthExp[t.category] = (monthExp[t.category]||0) + t.amount;
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
    renderBudgetTotal([], monthExp, data.budgets || {});
    renderRemainingBudget();
    return;
  }

  grid.innerHTML = expenseCategories.map(cat => {
    const spent = monthExp[cat.id] || 0;
    const budget = data.budgets?.[cat.id] || 0;
    const pct = budget > 0 ? Math.min((spent / budget) * 100, 100) : 0;
    const actualPct = budget > 0 ? Math.round((spent / budget) * 100) : 0;
    const over = budget > 0 && spent > budget;
    const warn = budget > 0 && pct >= 80 && !over;

    let statusText = '';
    if (budget > 0) {
      if (over) statusText = `<span style="color:var(--expense-color);font-weight:600">Over by ${fmtVND(spent-budget)}</span>`;
      else statusText = `<span style="color:var(--text-muted)">Remaining: ${fmtVND(budget-spent)}</span>`;
    } else {
      statusText = '<span style="color:var(--text-muted);font-size:12px">No budget set</span>';
    }

    const progressText = budget > 0
      ? (over ? `${actualPct}% used, over by ${fmtVND(spent - budget)}` : `${actualPct}% used, ${fmtVND(budget - spent)} remaining`)
      : 'No budget set';

    return `<div class="budget-item" data-category-id="${escapeHtml(cat.id)}">
      <div class="budget-header">
        <div class="budget-cat">${categoryHtml(cat)}</div>
        ${statusText}
      </div>
      <div class="budget-amounts">
        <span>Spent: <strong>${fmtVND(spent)}</strong></span>
        <span>Budget: <strong>${budget > 0 ? fmtVND(budget) : '\u2014'}</strong></span>
      </div>
      <div class="progress-bar" role="progressbar" aria-label="${escapeHtml(cat.label)} budget usage" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${Math.min(actualPct, 100)}" aria-valuetext="${escapeHtml(progressText)}">
        <div class="progress-fill ${over?'over':warn?'warn':''}" style="width:${pct}%"></div>
      </div>
      <div class="budget-edit">
        <input type="text" inputmode="numeric" class="budget-input" placeholder="Enter budget..." aria-label="Budget for ${escapeHtml(cat.label)}"
          value="${budget > 0 ? new Intl.NumberFormat('vi-VN').format(budget) : ''}" style="min-width:0">
        <button type="button" class="btn btn-primary budget-save-btn" style="white-space:nowrap;padding:6px 12px;font-size:12px">Save</button>
      </div>
    </div>`;
  }).join('');

  grid.querySelectorAll('.budget-item').forEach(item => {
    const categoryId = item.dataset.categoryId;
    const input = item.querySelector('.budget-input');
    const button = item.querySelector('.budget-save-btn');
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
  });

  renderBudgetTotal(expenseCategories, monthExp, data.budgets || {});
  renderRemainingBudget();
}

function renderBudgetTotal(cats, monthExp, budgets) {
  const el = document.getElementById('budget-total');
  if (!el) return;
  let totalBudget = 0, totalSpent = 0;
  cats.forEach(cat => {
    const b = budgets[cat.id] || 0;
    if (b > 0) { totalBudget += b; totalSpent += monthExp[cat.id] || 0; }
  });
  if (totalBudget === 0) { el.innerHTML = ''; return; }
  const over = totalSpent > totalBudget;
  const remaining = totalBudget - totalSpent;
  const remColor = over ? 'var(--expense-color)' : '#059669';
  const remText = over ? `Over by <strong>${fmtVND(totalSpent - totalBudget)}</strong>` : `Remaining: <strong>${fmtVND(remaining)}</strong>`;
  el.innerHTML = `<div class="budget-total-bar">
    <span class="budget-total-label">💰 Total Budget</span>
    <span>Spent: <strong>${fmtVND(totalSpent)}</strong></span>
    <span>Budget: <strong>${fmtVND(totalBudget)}</strong></span>
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
  const val = parseInt(raw, 10);
  if (!raw || isNaN(val) || val < 0) { showToast('Invalid value', 'error'); return; }
  const item = input?.closest('.budget-item');
  if (item) item.dataset.dirty = 'false';
  const data = getData();
  if (!data.budgets) data.budgets = {};
  data.budgets[catId] = val;
  saveData(data);
  renderBudget();
  showToast('Budget saved', 'success');
}

// ═══════════════════════════════════════════════
//  REMAINING BUDGET TABLE
// ═══════════════════════════════════════════════

function getRemainingBudgetMonths() {
  const data = getData();
  if (!data.transactions || data.transactions.length === 0) return [];

  const now = new Date();
  // Only include completed months — updates on the 1st of each month
  const prevDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const prevYm = `${prevDate.getFullYear()}-${String(prevDate.getMonth()+1).padStart(2,'0')}`;

  // Find earliest transaction month that is a completed month
  const pastTxMonths = [...new Set(
    data.transactions.map(t => t.date.slice(0, 7)).filter(ym => ym <= prevYm)
  )].sort();
  if (pastTxMonths.length === 0) return [];

  const startYm = pastTxMonths[0];
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

function renderRemainingBudget() {
  const container = document.getElementById('remaining-budget-container');
  if (!container) return;

  const data = getData();
  const budgets = data.budgets || {};

  // Get categories that have budget set
  const budgetCats = getCategories('expense', { includeInactive: true }).filter(c => budgets[c.id] > 0);
  if (budgetCats.length === 0) {
    container.innerHTML = '<p style="font-size:13px;color:var(--text-muted)">Set budgets above to see remaining budget tracking.</p>';
    return;
  }

  const months = getRemainingBudgetMonths();
  if (months.length === 0) {
    container.innerHTML = '<p style="font-size:13px;color:var(--text-muted)">No transaction data to calculate remaining budgets.</p>';
    return;
  }

  // Calculate per-month spending for each category
  const monthlySpending = {};
  months.forEach(ym => {
    monthlySpending[ym] = {};
    data.transactions.filter(t => t.date.startsWith(ym) && t.type === 'expense').forEach(t => {
      monthlySpending[ym][t.category] = (monthlySpending[ym][t.category] || 0) + t.amount;
    });
  });

  // Build table
  let html = '<div class="remaining-budget-table-wrap"><table class="remaining-budget-table">';

  // Header row
  html += '<thead><tr><th style="text-align:left;min-width:90px">Month</th>';
  budgetCats.forEach(cat => {
    html += `<th style="text-align:right;min-width:100px">${categoryHtml(cat, true)}</th>`;
  });
  html += '</tr></thead><tbody>';

  // Cumulative totals
  const cumulative = {};
  const applicableMonths = {};
  budgetCats.forEach(c => {
    cumulative[c.id] = 0;
    applicableMonths[c.id] = 0;
  });

  // Per-month rows
  months.forEach(ym => {
    html += `<tr><td style="font-weight:600;white-space:nowrap">${fmtMonthLabel(ym)}</td>`;
    budgetCats.forEach(cat => {
      const archiveMonth = cat.archivedAt ? cat.archivedAt.slice(0, 7) : null;
      // The app uses the current category budget for every completed month.
      // Custom categories must follow the same rule as built-in categories.
      const appliesToMonth = cat.active !== false || !archiveMonth || ym < archiveMonth;
      if (!appliesToMonth) {
        html += '<td style="text-align:right;color:var(--text-muted);font-size:12px">—</td>';
        return;
      }
      const budget = budgets[cat.id] || 0;
      const spent = monthlySpending[ym]?.[cat.id] || 0;
      const remaining = budget - spent;
      cumulative[cat.id] += remaining;
      applicableMonths[cat.id]++;

      const color = remaining >= 0 ? 'var(--income-color, #059669)' : 'var(--expense-color, #dc2626)';
      const sign = remaining >= 0 ? '+' : '';
      html += `<td style="text-align:right;color:${color};font-size:12px">${sign}${fmtVND(remaining)}</td>`;
    });
    html += '</tr>';
  });

  // Total row
  html += '<tr class="remaining-total-row"><td style="font-weight:700">Total</td>';
  budgetCats.forEach(cat => {
    if (applicableMonths[cat.id] === 0) {
      html += '<td style="text-align:right;font-weight:700;color:var(--text-muted)">—</td>';
      return;
    }
    const total = cumulative[cat.id];
    const color = total >= 0 ? 'var(--income-color, #059669)' : 'var(--expense-color, #dc2626)';
    const sign = total >= 0 ? '+' : '';
    html += `<td style="text-align:right;font-weight:700;color:${color}">${sign}${fmtVND(total)}</td>`;
  });
  html += '</tr>';

  html += '</tbody></table></div>';
  container.innerHTML = html;
}
