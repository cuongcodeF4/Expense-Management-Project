// ═══════════════════════════════════════════════
//  CHARTS
// ═══════════════════════════════════════════════

const PIE_COLORS = ['#4f46e5','#059669','#dc2626','#d97706','#7c3aed','#0891b2','#db2777','#65a30d','#0d9488','#ea580c'];

function initChartDateRange(months) {
  const now = new Date();
  const toYm = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}`;
  const fromDate = new Date(now.getFullYear(), now.getMonth() - months + 1, 1);
  const fromYm = `${fromDate.getFullYear()}-${String(fromDate.getMonth()+1).padStart(2,'0')}`;
  _chartFrom = fromYm;
  _chartTo = toYm;
  const fromEl = document.getElementById('chart-date-from');
  const toEl = document.getElementById('chart-date-to');
  if (fromEl) fromEl.value = fromYm + '-01';
  if (toEl) toEl.value = toYm + '-01';
}

function onPresetChange() {
  const val = parseInt(document.getElementById('chart-preset').value);
  if (val === 0) return;

  const fromEl = document.getElementById('chart-date-from');
  const toEl = document.getElementById('chart-date-to');

  if (_chartFrom && fromEl && fromEl.value) {
    const fromYm = fromEl.value.slice(0, 7);
    const [fy, fm] = fromYm.split('-').map(Number);
    const toDate = new Date(fy, fm - 1 + val, 1);
    const toYm = `${toDate.getFullYear()}-${String(toDate.getMonth()+1).padStart(2,'0')}`;
    _chartFrom = fromYm;
    _chartTo = toYm;
    if (toEl) toEl.value = toYm + '-01';
  } else {
    initChartDateRange(val);
  }
  renderCharts();
}

function onDateRangeChange() {
  const preset = parseInt(document.getElementById('chart-preset').value);
  const fromEl = document.getElementById('chart-date-from');
  const toEl = document.getElementById('chart-date-to');

  if (preset > 0 && fromEl && fromEl.value) {
    const fromYm = fromEl.value.slice(0, 7);
    const [fy, fm] = fromYm.split('-').map(Number);
    const toDate = new Date(fy, fm - 1 + preset, 1);
    const toYm = `${toDate.getFullYear()}-${String(toDate.getMonth()+1).padStart(2,'0')}`;
    if (toEl) toEl.value = toYm + '-01';
  } else {
    document.getElementById('chart-preset').value = '0';
  }
}

function applyChartRange() {
  const fromVal = document.getElementById('chart-date-from').value;
  const toVal = document.getElementById('chart-date-to').value;
  if (!fromVal || !toVal) { showToast('Please select start and end dates', 'error'); return; }

  const fromYm = fromVal.slice(0, 7);
  const toYm = toVal.slice(0, 7);
  if (fromYm > toYm) { showToast('Start date must be before end date', 'error'); return; }

  _chartFrom = fromYm;
  _chartTo = toYm;

  const diffMonths = monthDiff(fromYm, toYm) + 1;
  const presetEl = document.getElementById('chart-preset');
  const presetMap = { 6: '6', 12: '12', 24: '24', 60: '60', 120: '120' };
  presetEl.value = presetMap[diffMonths] || '0';

  renderCharts();
}

function monthDiff(from, to) {
  const [fy, fm] = from.split('-').map(Number);
  const [ty, tm] = to.split('-').map(Number);
  return (ty - fy) * 12 + (tm - fm);
}

function getMonthRangeFromTo(from, to) {
  const list = [];
  const [fy, fm] = from.split('-').map(Number);
  const [ty, tm] = to.split('-').map(Number);
  let y = fy, m = fm;
  while (y < ty || (y === ty && m <= tm)) {
    list.push(`${y}-${String(m).padStart(2,'0')}`);
    m++;
    if (m > 12) { m = 1; y++; }
  }
  return list;
}

function getMonthRange(months) {
  const now = new Date();
  const list = [];
  for (let i = months - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    list.push(`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`);
  }
  return list;
}

function getMonthData(data, ym) {
  const txs = data.transactions.filter(t => t.date.startsWith(ym));
  const income = txs.filter(t=>t.type==='income').reduce((s,t)=>s+t.amount,0);
  const expense = txs.filter(t=>t.type==='expense').reduce((s,t)=>s+t.amount,0);
  return { income, expense, saving: income - expense };
}

function fillMissing(data, ym) {
  return getMonthData(data, ym);
}

function renderCharts() {
  const data = getData();
  const now = new Date();
  const defaultTo = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}`;
  const defaultFromDate = new Date(now.getFullYear(), now.getMonth() - 11, 1);
  const defaultFrom = `${defaultFromDate.getFullYear()}-${String(defaultFromDate.getMonth()+1).padStart(2,'0')}`;

  const from = _chartFrom || defaultFrom;
  const to = _chartTo || defaultTo;
  const months = getMonthRangeFromTo(from, to);
  const totalMonths = months.length;

  const labels = months.map(fmtMonthLabel);
  const incomes = [], expenses = [], savings = [];
  months.forEach(m => {
    const d = fillMissing(data, m);
    incomes.push(d.income);
    expenses.push(d.expense);
    savings.push(d.saving);
  });

  // Main chart
  const mainCanvas = document.getElementById('mainChart');
  if (!mainCanvas) return;
  const mainCtx = mainCanvas.getContext('2d');
  if (_charts.main) _charts.main.destroy();
  _charts.main = new Chart(mainCtx, {
    type: 'bar',
    data: {
      labels,
      datasets: [
        { label: 'Income', data: incomes, backgroundColor: 'rgba(5,150,105,0.65)', borderWidth: 0, borderRadius: 3, order: 2 },
        { label: 'Expenses', data: expenses, backgroundColor: 'rgba(220,38,38,0.65)', borderWidth: 0, borderRadius: 3, order: 2 },
        {
          label: 'Savings', data: savings, type: 'line',
          borderColor: '#7c3aed', backgroundColor: 'rgba(124,58,237,0.06)',
          pointBackgroundColor: '#7c3aed',
          pointRadius: totalMonths <= 24 ? 3 : 1.5,
          tension: 0.35, fill: true, borderWidth: 2, order: 1
        }
      ]
    },
    options: {
      responsive: true, maintainAspectRatio: false,
      interaction: { mode: 'index', intersect: false },
      plugins: {
        legend: { position: 'top', labels: { font: { size: 11 }, boxWidth: 10, padding: 14 } },
        tooltip: { callbacks: { label: ctx => ` ${ctx.dataset.label}: ${fmtVND(ctx.raw)}` } }
      },
      scales: {
        y: {
          ticks: { callback: v => v >= 1000000 ? (v/1000000).toFixed(0)+'M' : (v/1000).toFixed(0)+'K', font: { size: 10 } },
          grid: { color: '#f1f5f9' }
        },
        x: { ticks: { maxTicksLimit: totalMonths > 24 ? 24 : totalMonths, font: { size: 10 } }, grid: { display: false } }
      }
    }
  });

  // Pie chart
  const catTotals = {};
  months.forEach(m => {
    data.transactions.filter(t => t.date.startsWith(m) && t.type === 'expense').forEach(t => {
      catTotals[t.category] = (catTotals[t.category]||0) + t.amount;
    });
  });
  const pieEntries = Object.entries(catTotals).sort((a,b)=>b[1]-a[1]);

  const pieCanvas = document.getElementById('pieChart');
  if (pieCanvas) {
    const pieCtx = pieCanvas.getContext('2d');
    if (_charts.pie) _charts.pie.destroy();
    _charts.pie = new Chart(pieCtx, {
      type: 'doughnut',
      data: {
        labels: pieEntries.map(([id]) => `${getCat(id).icon} ${getCat(id).label}`),
        datasets: [{ data: pieEntries.map(([,v])=>v), backgroundColor: PIE_COLORS, borderWidth: 2, borderColor: 'white', hoverOffset: 8 }]
      },
      options: {
        responsive: true, maintainAspectRatio: false, cutout: '58%',
        plugins: {
          legend: { display: false },
          tooltip: { callbacks: { label: ctx => ` ${ctx.label}: ${fmtVND(ctx.raw)}` } }
        }
      }
    });

    const pieTotal = pieEntries.reduce((s,[,v])=>s+v,0);
    const pieLegend = document.getElementById('pieLegend');
    if (pieLegend) {
      pieLegend.innerHTML = pieEntries.map(([id,v],i) => {
        const c = getCat(id);
        return `<div style="display:flex;align-items:center;gap:4px;white-space:nowrap">
          <span style="display:inline-block;width:8px;height:8px;border-radius:2px;background:${PIE_COLORS[i]};flex-shrink:0"></span>
          <span style="font-size:11px">${c.icon} ${c.label} <strong>${(v/pieTotal*100).toFixed(0)}%</strong></span>
        </div>`;
      }).join('');
    }
  }

  // Compare chart
  const compareCanvas = document.getElementById('compareChart');
  if (compareCanvas) {
    const compareCtx = compareCanvas.getContext('2d');
    if (_charts.compare) _charts.compare.destroy();

    let compareLabels, compareInc, compareExp;
    if (totalMonths <= 24) {
      compareLabels = labels; compareInc = incomes; compareExp = expenses;
    } else {
      const quarters = {};
      months.forEach((m, i) => {
        const [yr, mo] = m.split('-');
        const q = `Q${Math.ceil(parseInt(mo)/3)}/${yr}`;
        if (!quarters[q]) quarters[q] = { inc: 0, exp: 0 };
        quarters[q].inc += incomes[i];
        quarters[q].exp += expenses[i];
      });
      compareLabels = Object.keys(quarters);
      compareInc = compareLabels.map(k => quarters[k].inc);
      compareExp = compareLabels.map(k => quarters[k].exp);
    }

    _charts.compare = new Chart(compareCtx, {
      type: 'bar',
      data: {
        labels: compareLabels,
        datasets: [
          { label: 'Income', data: compareInc, backgroundColor: 'rgba(5,150,105,0.7)', borderRadius: 3 },
          { label: 'Expenses', data: compareExp, backgroundColor: 'rgba(220,38,38,0.7)', borderRadius: 3 },
        ]
      },
      options: {
        responsive: true, maintainAspectRatio: false,
        plugins: {
          legend: { position: 'top', labels: { font: { size: 11 }, boxWidth: 10 } },
          tooltip: { callbacks: { label: ctx => ` ${ctx.dataset.label}: ${fmtVND(ctx.raw)}` } }
        },
        scales: {
          y: { ticks: { callback: v => (v/1000000).toFixed(0)+'M', font:{size:10} }, grid: { color: '#f1f5f9' } },
          x: { ticks: { font:{size:10}, maxTicksLimit: 16 }, grid: { display: false } }
        }
      }
    });
  }

  // Saving trend
  const savingCanvas = document.getElementById('savingChart');
  if (savingCanvas) {
    const savingCtx = savingCanvas.getContext('2d');
    if (_charts.saving) _charts.saving.destroy();

    let cumulative = 0;
    const cumSavings = savings.map(s => { cumulative += s; return cumulative; });

    _charts.saving = new Chart(savingCtx, {
      type: 'line',
      data: {
        labels,
        datasets: [
          {
            label: 'Monthly net savings', data: savings,
            borderColor: '#f59e0b', backgroundColor: 'rgba(245,158,11,0.06)',
            fill: true, tension: 0.35, borderWidth: 2,
            pointRadius: totalMonths <= 24 ? 3 : 1,
            pointBackgroundColor: '#f59e0b', yAxisID: 'y'
          },
          {
            label: 'Cumulative', data: cumSavings,
            borderColor: '#8b5cf6', backgroundColor: 'rgba(139,92,246,0.06)',
            fill: true, tension: 0.35, borderWidth: 2,
            pointRadius: totalMonths <= 24 ? 3 : 1,
            pointBackgroundColor: '#8b5cf6', yAxisID: 'y'
          }
        ]
      },
      options: {
        responsive: true, maintainAspectRatio: false,
        interaction: { mode: 'index', intersect: false },
        plugins: {
          legend: { position: 'top', labels: { font: { size: 11 }, boxWidth: 10 } },
          tooltip: { callbacks: { label: ctx => ` ${ctx.dataset.label}: ${fmtVND(ctx.raw)}` } }
        },
        scales: {
          y: {
            ticks: { callback: v => (v/1000000).toFixed(0)+'M', font:{size:10} },
            grid: { color: '#f1f5f9' }
          },
          x: {
            ticks: { maxTicksLimit: totalMonths > 24 ? 24 : totalMonths, font:{size:10} },
            grid: { display: false }
          }
        }
      }
    });
  }
}
