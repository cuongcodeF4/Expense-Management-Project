// ═══════════════════════════════════════════════
//  DASHBOARD
// ═══════════════════════════════════════════════

function populateDashMonthSelect() {
  const data = getData();
  const sel = document.getElementById('dash-month-select');
  if (!sel) return;

  const monthSet = new Set();
  const now = new Date();
  for (let i = 0; i < 24; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    monthSet.add(`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`);
  }
  data.transactions.forEach(t => {
    if (t.date) monthSet.add(t.date.slice(0,7));
  });
  const months = Array.from(monthSet).sort((a,b) => b.localeCompare(a));

  sel.innerHTML = months.map(ym => {
    const [yr, mo] = ym.split('-');
    return `<option value="${ym}" ${ym === _dashYm ? 'selected' : ''}>${MONTHS_FULL[parseInt(mo)-1]} ${yr}</option>`;
  }).join('');
}

function onDashMonthChange() {
  _dashYm = document.getElementById('dash-month-select').value;
  renderDashboard();
}

function renderDashboard() {
  const data = getData();
  const now = new Date();
  const ym = _dashYm || `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}`;

  const monthTxs = data.transactions.filter(t => t.date.startsWith(ym));
  const totalIncome = monthTxs.filter(t => t.type === 'income').reduce((s,t) => s+t.amount, 0);
  const totalExpense = monthTxs.filter(t => t.type === 'expense').reduce((s,t) => s+t.amount, 0);
  const balance = totalIncome - totalExpense;

  const [yr, mo] = ym.split('-');
  const prevDate = new Date(parseInt(yr), parseInt(mo)-2, 1);
  const prevYm = `${prevDate.getFullYear()}-${String(prevDate.getMonth()+1).padStart(2,'0')}`;
  const prevTxs = data.transactions.filter(t => t.date.startsWith(prevYm));
  const prevExpense = prevTxs.filter(t => t.type === 'expense').reduce((s,t) => s+t.amount, 0);
  const expDiff = prevExpense ? ((totalExpense - prevExpense) / prevExpense * 100).toFixed(1) : 0;

  const summEl = document.getElementById('dash-month-summary');
  if (summEl) summEl.textContent = `Income: ${fmtVND(totalIncome)} · Expenses: ${fmtVND(totalExpense)} · Savings: ${fmtVND(balance)}`;

  const sg = document.getElementById('summary-grid');
  if (!sg) return;
  sg.innerHTML = `
    <div class="summary-card income">
      <div class="sc-label">Income</div>
      <div class="sc-value" style="color:var(--income-color)">${fmtVND(totalIncome)}</div>
      <div class="sc-sub">${monthTxs.filter(t=>t.type==='income').length} transactions</div>
    </div>
    <div class="summary-card expense">
      <div class="sc-label">Expenses</div>
      <div class="sc-value" style="color:var(--expense-color)">${fmtVND(totalExpense)}</div>
      <div class="sc-sub">${monthTxs.filter(t=>t.type==='expense').length} transactions
        <span class="trend ${expDiff > 0 ? 'down' : 'up'}">${expDiff > 0 ? '\u25b2' : '\u25bc'} ${Math.abs(expDiff)}% vs prev</span>
      </div>
    </div>
    <div class="summary-card balance">
      <div class="sc-label">Balance</div>
      <div class="sc-value" style="color:${balance>=0?'var(--primary)':'var(--expense-color)'}">${fmtVND(balance)}</div>
      <div class="sc-sub">${balance >= 0 ? 'Surplus' : 'Deficit'} this month</div>
    </div>
    <div class="summary-card saving">
      <div class="sc-label">Savings Rate</div>
      <div class="sc-value" style="color:var(--saving-color)">${totalIncome ? (balance/totalIncome*100).toFixed(1) : 0}%</div>
      <div class="sc-sub">Of total income</div>
    </div>
  `;

  // Recent transactions
  const recent = data.transactions.slice(0, 8);
  const rl = document.getElementById('recent-list');
  if (rl) {
    if (recent.length === 0) {
      rl.innerHTML = '<div class="empty-state"><div class="es-text">No transactions yet</div></div>';
    } else {
      rl.innerHTML = recent.map(t => {
        const cat = getCat(t.category);
        return `<div class="tx-item">
          <div class="tx-icon ${t.type}">${cat.icon}</div>
          <div class="tx-info">
            <div class="tx-cat">${cat.label}</div>
            <div class="tx-note">${t.note || '\u2014'}</div>
          </div>
          <div class="tx-right">
            <div class="tx-amount ${t.type}">${t.type === 'income' ? '+' : '-'}${fmtVND(t.amount)}</div>
            <div class="tx-date">${fmtDate(t.date)}</div>
          </div>
        </div>`;
      }).join('');
    }
  }

  // Month stats
  const topExpCat = {};
  monthTxs.filter(t => t.type === 'expense').forEach(t => {
    topExpCat[t.category] = (topExpCat[t.category]||0) + t.amount;
  });
  const sorted = Object.entries(topExpCat).sort((a,b) => b[1]-a[1]);
  const ms = document.getElementById('month-stats');
  if (ms) {
    ms.innerHTML = `
      <div class="stat-row">
        <span class="stat-row-label">Total Income</span>
        <span class="stat-row-value" style="color:var(--income-color)">${fmtVND(totalIncome)}</span>
      </div>
      <div class="stat-row">
        <span class="stat-row-label">Total Expenses</span>
        <span class="stat-row-value" style="color:var(--expense-color)">${fmtVND(totalExpense)}</span>
      </div>
      <div class="stat-row">
        <span class="stat-row-label">Savings</span>
        <span class="stat-row-value" style="color:var(--primary)">${fmtVND(balance)}</span>
      </div>
      ${sorted.slice(0,3).map(([cat,amt]) => {
        const c = getCat(cat);
        return `<div class="stat-row">
          <span class="stat-row-label">${c.label}</span>
          <span class="stat-row-value">${fmtVND(amt)}</span>
        </div>`;
      }).join('')}
    `;
  }

  renderDashMiniChart(data, ym);
  renderDashPieChart(data, ym);
  renderDashDailyChart(data, ym);
}

function renderDashDailyChart(data, ym) {
  const [yr, mo] = ym.split('-').map(Number);
  const daysInMonth = new Date(yr, mo, 0).getDate();
  const days = Array.from({length: daysInMonth}, (_, i) => i + 1);

  const expByDay = new Array(daysInMonth).fill(0);
  const incByDay = new Array(daysInMonth).fill(0);
  data.transactions.filter(t => t.date.startsWith(ym)).forEach(t => {
    const day = parseInt(t.date.split('-')[2]) - 1;
    if (day >= 0 && day < daysInMonth) {
      if (t.type === 'expense') expByDay[day] += t.amount;
      else incByDay[day] += t.amount;
    }
  });

  const canvas = document.getElementById('dashDailyChart');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  if (_charts.dashDaily) _charts.dashDaily.destroy();
  _charts.dashDaily = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: days.map(d => d),
      datasets: [
        { label: 'Expenses', data: expByDay, backgroundColor: 'rgba(220,38,38,0.65)', borderRadius: 2, order: 2 },
        { label: 'Income', data: incByDay, backgroundColor: 'rgba(5,150,105,0.65)', borderRadius: 2, order: 2 }
      ]
    },
    options: {
      responsive: true, maintainAspectRatio: false,
      interaction: { mode: 'index', intersect: false },
      plugins: {
        legend: { position: 'top', labels: { font: { size: 11 }, boxWidth: 10, padding: 12 } },
        tooltip: { callbacks: { label: ctx => ` ${ctx.dataset.label}: ${fmtVND(ctx.raw)}` } }
      },
      scales: {
        y: {
          ticks: {
            callback: v => {
              if (v === 0) return '0';
              if (v >= 1000000) return (v/1000000).toFixed(1)+'M';
              return (v/1000).toFixed(0)+'K';
            },
            font: { size: 10 }
          },
          grid: { color: '#f1f5f9' }
        },
        x: { ticks: { maxTicksLimit: 31, font: { size: 9 } }, grid: { display: false } }
      }
    }
  });
}

function renderDashMiniChart(data, ym) {
  const monthList = [];
  const now = new Date();
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth()-i, 1);
    monthList.push(`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`);
  }

  const incomes = monthList.map(m => data.transactions.filter(t=>t.date.startsWith(m)&&t.type==='income').reduce((s,t)=>s+t.amount,0));
  const expenses = monthList.map(m => data.transactions.filter(t=>t.date.startsWith(m)&&t.type==='expense').reduce((s,t)=>s+t.amount,0));

  const canvas = document.getElementById('dashMiniChart');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  if (_charts.dashMini) _charts.dashMini.destroy();
  _charts.dashMini = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: monthList.map(fmtMonthLabel),
      datasets: [
        { label: 'Income', data: incomes, backgroundColor: 'rgba(5,150,105,0.65)', borderRadius: 3 },
        { label: 'Expenses', data: expenses, backgroundColor: 'rgba(220,38,38,0.65)', borderRadius: 3 },
      ]
    },
    options: {
      responsive: true, maintainAspectRatio: false,
      plugins: {
        legend: { position: 'top', labels: { font: { size: 11 }, boxWidth: 10, padding: 12 } },
        tooltip: { callbacks: { label: ctx => ' ' + fmtVND(ctx.raw) } }
      },
      scales: {
        y: { ticks: { callback: v => (v/1000000).toFixed(0)+'M', font:{size:10} }, grid: { color: '#f1f5f9' } },
        x: { ticks: { font:{size:10} }, grid: { display: false } }
      }
    }
  });
}

function renderDashPieChart(data, ym) {
  const monthTxs = data.transactions.filter(t => t.date.startsWith(ym) && t.type === 'expense');
  const catTotals = {};
  monthTxs.forEach(t => { catTotals[t.category] = (catTotals[t.category]||0) + t.amount; });
  const entries = Object.entries(catTotals).sort((a,b)=>b[1]-a[1]);

  const PIE_COLORS = ['#4f46e5','#059669','#dc2626','#d97706','#7c3aed','#0891b2','#db2777','#65a30d'];

  const canvas = document.getElementById('dashPieChart');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  if (_charts.dashPie) _charts.dashPie.destroy();

  const legendEl = document.getElementById('dashPieLegend');

  if (entries.length === 0) {
    if (legendEl) legendEl.innerHTML = '<span style="color:var(--text-muted);font-size:12px">No expenses</span>';
    return;
  }

  _charts.dashPie = new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels: entries.map(([id]) => getCat(id).label),
      datasets: [{ data: entries.map(([,v])=>v), backgroundColor: PIE_COLORS, borderWidth: 0, hoverOffset: 6 }]
    },
    options: {
      responsive: true, maintainAspectRatio: false,
      cutout: '65%',
      plugins: {
        legend: { display: false },
        tooltip: { callbacks: { label: ctx => ' ' + fmtVND(ctx.raw) } }
      }
    }
  });

  const total = entries.reduce((s,[,v])=>s+v,0);
  if (legendEl) {
    legendEl.innerHTML = entries.slice(0,6).map(([id,v],i) => {
      const c = getCat(id);
      return `<div style="display:flex;align-items:center;gap:6px">
        <span style="display:inline-block;width:8px;height:8px;border-radius:2px;background:${PIE_COLORS[i]};flex-shrink:0"></span>
        <span>${c.icon} ${c.label}</span>
        <span style="margin-left:auto;font-weight:600;color:var(--text)">${(v/total*100).toFixed(0)}%</span>
      </div>`;
    }).join('');
  }
}
