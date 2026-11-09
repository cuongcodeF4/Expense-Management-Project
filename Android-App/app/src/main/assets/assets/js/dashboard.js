// ═══════════════════════════════════════════════
//  DASHBOARD — Genesis FX Markets Edition
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

function getGreetingText() {
  const hr = new Date().getHours();
  const base = hr < 12
    ? tr('Good morning', 'Chào buổi sáng')
    : hr < 18
      ? tr('Good afternoon', 'Chào buổi chiều')
      : tr('Good evening', 'Chào buổi tối');
  const userNameEl = document.getElementById('user-name');
  const rawName = userNameEl?.textContent?.trim() || '';
  const firstName = rawName ? rawName.split(' ')[0] : '';
  return firstName ? `${base}, ${firstName}` : base;
}

function renderDashboard() {
  const data = getData();
  const now = new Date();
  const ym = _dashYm || `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}`;

  // All-time net portfolio balance for Topbar Wallet & Hero Banner
  const allTimeIncome = data.transactions.filter(t => t.type === 'income').reduce((s,t) => s + t.amount, 0);
  const allTimeExpense = data.transactions.filter(t => t.type === 'expense').reduce((s,t) => s + t.amount, 0);
  const allTimeBalance = allTimeIncome - allTimeExpense;

  const monthTxs = data.transactions.filter(t => t.date.startsWith(ym));
  const totalIncome = monthTxs.filter(t => t.type === 'income').reduce((s,t) => s+t.amount, 0);
  const totalExpense = monthTxs.filter(t => t.type === 'expense').reduce((s,t) => s+t.amount, 0);
  const balance = totalIncome - totalExpense;
  const savingsRate = totalIncome ? (balance / totalIncome * 100).toFixed(1) : '0.0';

  const [yr, mo] = ym.split('-');
  const prevDate = new Date(parseInt(yr), parseInt(mo)-2, 1);
  const prevYm = `${prevDate.getFullYear()}-${String(prevDate.getMonth()+1).padStart(2,'0')}`;
  const prevTxs = data.transactions.filter(t => t.date.startsWith(prevYm));
  const prevExpense = prevTxs.filter(t => t.type === 'expense').reduce((s,t) => s+t.amount, 0);
  const expDiff = prevExpense ? ((totalExpense - prevExpense) / prevExpense * 100).toFixed(1) : 0;

  // Update Topbar Wallet Pill & Genesis Hero Banner
  const walletEl = document.getElementById('topbar-wallet-balance');
  if (walletEl) walletEl.textContent = fmtVND(allTimeBalance);

  const greetingEl = document.getElementById('hero-greeting');
  if (greetingEl) greetingEl.textContent = getGreetingText();

  const heroValEl = document.getElementById('hero-balance-value');
  if (heroValEl) {
    heroValEl.textContent = new Intl.NumberFormat('vi-VN').format(Math.round(allTimeBalance));
  }

  const heroDeltaEl = document.getElementById('hero-balance-delta');
  if (heroDeltaEl) {
    const isPositive = balance >= 0;
    const sign = isPositive ? '+' : '';
    const arrow = isPositive ? '▲' : '▼';
    const color = isPositive ? 'var(--income-color)' : 'var(--expense-color)';
    heroDeltaEl.innerHTML = `
      <span class="sensitive-amount" style="color:${color};font-weight:700">${arrow} ${sign}${fmtVND(balance)} (${savingsRate}%)</span>
      <span style="margin-left:6px">${tr(`net cashflow in ${fmtMonthLabel(ym)}`, `dòng tiền ròng ${fmtMonthLabel(ym)}`)}</span>
    `;
  }

  const summEl = document.getElementById('dash-month-summary');
  if (summEl) {
    summEl.textContent = tr(
      `Income: ${fmtVND(totalIncome)} · Expenses: ${fmtVND(totalExpense)} · Net: ${fmtVND(balance)}`,
      `Thu: ${fmtVND(totalIncome)} · Chi: ${fmtVND(totalExpense)} · Ròng: ${fmtVND(balance)}`
    );
  }

  const activeBudgetCount = Object.values(data.budgets || {}).filter(v => v > 0).length;

  // Build real 6-month series ending at selected `ym` for the 4 KPI mini-visualizations
  const sixMonthSeries = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(parseInt(yr), parseInt(mo) - 1 - i, 1);
    const mYm = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    const mTxs = data.transactions.filter(t => t.date.startsWith(mYm));
    const inc = mTxs.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
    const exp = mTxs.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
    const net = inc - exp;
    const rate = inc > 0 ? Math.max(0, Math.min(100, (net / inc) * 100)) : 0;
    sixMonthSeries.push({ ym: mYm, inc, exp, net, rate });
  }

  const maxInc = Math.max(...sixMonthSeries.map(s => s.inc), 1);
  const incBarsHtml = sixMonthSeries.map(s => {
    const h = Math.max(16, Math.round((s.inc / maxInc) * 100));
    return `<div class="gfx-mini-bar" style="height:${h}%" title="${fmtMonthLabel(s.ym)}: ${fmtVND(s.inc)}"></div>`;
  }).join('');

  function buildSparklineSvg(values, strokeColor, gradId) {
    const minV = Math.min(...values, 0);
    const maxV = Math.max(...values, minV + 1);
    const range = maxV - minV || 1;
    const xs = [4, 26, 48, 70, 92, 115];
    const pts = values.map((v, idx) => {
      const y = Math.round(34 - ((v - minV) / range) * 28);
      return { x: xs[idx], y: Math.max(5, Math.min(35, y)) };
    });
    let dLine = `M${pts[0].x},${pts[0].y}`;
    for (let i = 1; i < pts.length; i++) {
      const prev = pts[i - 1];
      const curr = pts[i];
      const cx = ((prev.x + curr.x) / 2).toFixed(1);
      dLine += ` C${cx},${prev.y} ${cx},${curr.y} ${curr.x},${curr.y}`;
    }
    const dArea = `${dLine} L${pts[pts.length - 1].x},40 L${pts[0].x},40 Z`;
    const lastPt = pts[pts.length - 1];
    const prevPt = pts[pts.length - 2];
    return `
      <svg class="sc-mini-viz" viewBox="0 0 120 40" preserveAspectRatio="none" aria-hidden="true">
        <defs>
          <linearGradient id="${gradId}" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stop-color="${strokeColor}" stop-opacity="0.36"/>
            <stop offset="100%" stop-color="${strokeColor}" stop-opacity="0"/>
          </linearGradient>
        </defs>
        <path d="${dArea}" fill="url(#${gradId})"/>
        <path d="${dLine}" fill="none" stroke="${strokeColor}" stroke-width="2" stroke-linecap="round"/>
        <circle cx="${prevPt.x}" cy="${prevPt.y}" r="2.2" fill="${strokeColor}" opacity="0.75"/>
        <circle cx="${lastPt.x}" cy="${lastPt.y}" r="3" fill="${strokeColor}"/>
      </svg>
    `;
  }

  const expSparklineHtml = buildSparklineSvg(sixMonthSeries.map(s => s.exp), '#F43F5E', 'gfxExpenseCurve');
  const netSparklineHtml = buildSparklineSvg(sixMonthSeries.map(s => s.net), '#F59E0B', 'gfxGoldCurve');

  const rateBarsHtml = sixMonthSeries.map(s => {
    const h = Math.max(16, Math.round(s.rate));
    return `<div class="gfx-mini-bar" style="height:${h}%;background:linear-gradient(180deg, rgba(34,211,238,0.85) 0%, rgba(34,211,238,0.08) 100%);border-top-color:#22D3EE" title="${fmtMonthLabel(s.ym)}: ${s.rate.toFixed(1)}%"></div>`;
  }).join('');

  const sg = document.getElementById('summary-grid');
  if (!sg) return;
  sg.innerHTML = `
    <div class="summary-card income">
      <div>
        <div class="sc-label">${tr('Total Income', 'Tổng Thu Nhập')}</div>
        <div class="sc-value sensitive-amount" style="color:var(--income-color)">${fmtVND(totalIncome)}</div>
        <div class="sc-sub">${monthTxs.filter(t=>t.type==='income').length} ${tr('transactions', 'giao dịch')}</div>
      </div>
      <div class="sc-mini-viz" aria-hidden="true">
        ${incBarsHtml}
      </div>
    </div>

    <div class="summary-card expense">
      <div>
        <div class="sc-label">${tr('Total Expenses', 'Tổng Chi Tiêu')}</div>
        <div class="sc-value sensitive-amount" style="color:var(--expense-color)">${fmtVND(totalExpense)}</div>
        <div class="sc-sub">${monthTxs.filter(t=>t.type==='expense').length} ${tr('tx', 'GD')}
          <span class="trend ${expDiff > 0 ? 'down' : 'up'}">${expDiff > 0 ? '\u25b2' : '\u25bc'} ${Math.abs(expDiff)}% ${tr('vs prev', 'so với T.trước')}</span>
        </div>
      </div>
      ${expSparklineHtml}
    </div>

    <div class="summary-card balance">
      <div>
        <div class="sc-label">${tr('Net Saved', 'Tiết Kiệm Ròng')} (${fmtMonthLabel(ym)})</div>
        <div class="sc-value sensitive-amount" style="color:${balance>=0?'var(--primary)':'var(--expense-color)'}">${fmtVND(balance)}</div>
        <div class="sc-sub">${balance >= 0 ? tr('Surplus this month', 'Thặng dư tháng này') : tr('Deficit this month', 'Thâm hụt tháng này')}</div>
      </div>
      ${netSparklineHtml}
    </div>

    <div class="summary-card saving">
      <div>
        <div class="sc-label">${tr('Savings Rate', 'Tỷ Lệ Tiết Kiệm')}</div>
        <div class="sc-value" style="color:var(--saving-color)">${savingsRate}%</div>
        <div class="sc-sub">${activeBudgetCount} ${tr('active category budgets', 'ngân sách đang bật')}</div>
      </div>
      <div class="sc-mini-viz" aria-hidden="true">
        ${rateBarsHtml}
      </div>
    </div>
  `;

  // Recent transactions
  const recent = data.transactions.slice(0, 8);
  const rl = document.getElementById('recent-list');
  if (rl) {
    if (recent.length === 0) {
      rl.innerHTML = `<div class="empty-state"><div class="es-text">${tr('No transactions yet', 'Chưa có giao dịch nào')}</div></div>`;
    } else {
      rl.innerHTML = recent.map(t => {
        const cat = getCat(t.category, t.type);
        return `<div class="tx-item">
          <div class="tx-icon ${t.type}">${escapeHtml(cat.icon)}</div>
          <div class="tx-info">
            <div class="tx-cat">${escapeHtml(cat.label)}${cat.active === false ? ` <span class="category-removed-label">${tr('(removed)', '(đã ẩn)')}</span>` : ''}</div>
            <div class="tx-note">${escapeHtml(t.note || '\u2014')}</div>
          </div>
          <div class="tx-right">
            <div class="tx-amount sensitive-amount ${t.type}">${t.type === 'income' ? '+' : '-'}${fmtVND(t.amount)}</div>
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
        <span class="stat-row-label">${tr('Total Income', 'Tổng Thu Nhập')}</span>
        <span class="stat-row-value sensitive-amount" style="color:var(--income-color)">${fmtVND(totalIncome)}</span>
      </div>
      <div class="stat-row">
        <span class="stat-row-label">${tr('Total Expenses', 'Tổng Chi Tiêu')}</span>
        <span class="stat-row-value sensitive-amount" style="color:var(--expense-color)">${fmtVND(totalExpense)}</span>
      </div>
      <div class="stat-row">
        <span class="stat-row-label">${tr('Net Savings', 'Tiết Kiệm Ròng')}</span>
        <span class="stat-row-value sensitive-amount" style="color:var(--primary)">${fmtVND(balance)}</span>
      </div>
      ${sorted.slice(0,3).map(([cat,amt]) => {
        const c = getCat(cat, 'expense');
        return `<div class="stat-row">
          <span class="stat-row-label">${escapeHtml(c.icon)} ${escapeHtml(c.label)}</span>
          <span class="stat-row-value sensitive-amount">${fmtVND(amt)}</span>
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
  const isLight = document.body.classList.contains('light-mode');
  const tickCol = isLight ? '#475569' : '#94A3B8';
  const gridCol = isLight ? 'rgba(5, 150, 105, 0.10)' : 'rgba(0, 229, 153, 0.07)';
  _charts.dashDaily = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: days.map(d => d),
      datasets: [
        { label: tr('Expenses', 'Chi tiêu'), data: expByDay, backgroundColor: 'rgba(244, 63, 94, 0.78)', borderRadius: 3, order: 2 },
        { label: tr('Income', 'Thu nhập'), data: incByDay, backgroundColor: isLight ? 'rgba(5, 150, 105, 0.82)' : 'rgba(0, 229, 153, 0.82)', borderRadius: 3, order: 2 }
      ]
    },
    options: {
      responsive: true, maintainAspectRatio: false,
      interaction: { mode: 'index', intersect: false, axis: 'x' },
      plugins: {
        legend: { position: 'top', labels: { color: tickCol, font: { size: 11 }, boxWidth: 10, padding: 12 } },
        tooltip: { callbacks: { label: ctx => ` ${ctx.dataset.label}: ${fmtVND(ctx.raw)}` } }
      },
      scales: {
        y: {
          ticks: {
            color: tickCol,
            callback: v => {
              if (v === 0) return '0';
              if (v >= 1000000) return (v/1000000).toFixed(1)+'M';
              return (v/1000).toFixed(0)+'K';
            },
            font: { size: 10 }
          },
          grid: { color: gridCol }
        },
        x: { ticks: { color: tickCol, maxTicksLimit: 31, font: { size: 9 } }, grid: { display: false } }
      }
    }
  });
  if (typeof bindChartTouchInspector === 'function') bindChartTouchInspector(_charts.dashDaily);
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
  const isLight = document.body.classList.contains('light-mode');
  const tickCol = isLight ? '#475569' : '#94A3B8';
  const gridCol = isLight ? 'rgba(5, 150, 105, 0.10)' : 'rgba(0, 229, 153, 0.07)';
  _charts.dashMini = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: monthList.map(fmtMonthLabel),
      datasets: [
        { label: tr('Income', 'Thu nhập'), data: incomes, backgroundColor: isLight ? 'rgba(5, 150, 105, 0.82)' : 'rgba(0, 229, 153, 0.82)', borderRadius: 4 },
        { label: tr('Expenses', 'Chi tiêu'), data: expenses, backgroundColor: 'rgba(244, 63, 94, 0.78)', borderRadius: 4 },
      ]
    },
    options: {
      responsive: true, maintainAspectRatio: false,
      interaction: { mode: 'index', intersect: false, axis: 'x' },
      plugins: {
        legend: { position: 'top', labels: { color: tickCol, font: { size: 11 }, boxWidth: 10, padding: 12 } },
        tooltip: { callbacks: { label: ctx => ` ${ctx.dataset.label}: ${fmtVND(ctx.raw)}` } }
      },
      scales: {
        y: { ticks: { color: tickCol, callback: v => (v/1000000).toFixed(0)+'M', font:{size:10} }, grid: { color: gridCol } },
        x: { ticks: { color: tickCol, font:{size:10} }, grid: { display: false } }
      }
    }
  });
  if (typeof bindChartTouchInspector === 'function') bindChartTouchInspector(_charts.dashMini);
}

function renderDashPieChart(data, ym) {
  const monthTxs = data.transactions.filter(t => t.date.startsWith(ym) && t.type === 'expense');
  const catTotals = {};
  monthTxs.forEach(t => { catTotals[t.category] = (catTotals[t.category]||0) + t.amount; });
  const entries = Object.entries(catTotals).sort((a,b)=>b[1]-a[1]);

  const PIE_COLORS = ['#00E599','#22D3EE','#F59E0B','#F43F5E','#38BDF8','#A855F7','#10B981','#EC4899'];

  const canvas = document.getElementById('dashPieChart');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  if (_charts.dashPie) _charts.dashPie.destroy();

  const legendEl = document.getElementById('dashPieLegend');

  if (entries.length === 0) {
    if (legendEl) legendEl.innerHTML = `<span style="color:var(--text-muted);font-size:12px">${tr('No expenses this period', 'Chưa có chi tiêu trong kỳ này')}</span>`;
    return;
  }

  const isLight = document.body.classList.contains('light-mode');
  _charts.dashPie = new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels: entries.map(([id]) => getCat(id, 'expense').label),
      datasets: [{ data: entries.map(([,v])=>v), backgroundColor: entries.map((_, i) => PIE_COLORS[i % PIE_COLORS.length]), borderWidth: 2, borderColor: isLight ? '#FFFFFF' : '#07130E', hoverOffset: 6 }]
    },
    options: {
      responsive: true, maintainAspectRatio: false,
      cutout: '66%',
      plugins: {
        legend: { display: false },
        tooltip: { callbacks: { label: ctx => ' ' + fmtVND(ctx.raw) } }
      }
    }
  });
  if (typeof bindChartTouchInspector === 'function') bindChartTouchInspector(_charts.dashPie);

  const total = entries.reduce((s,[,v])=>s+v,0);
  if (legendEl) {
    legendEl.innerHTML = entries.slice(0,6).map(([id,v],i) => {
      const c = getCat(id, 'expense');
      const color = PIE_COLORS[i % PIE_COLORS.length];
      return `<div style="display:flex;align-items:center;gap:6px">
        <span style="display:inline-block;width:8px;height:8px;border-radius:2px;background:${color};box-shadow:0 0 6px ${color};flex-shrink:0"></span>
        <span>${categoryHtml(c, true)}</span>
        <span style="margin-left:auto;font-weight:700;color:var(--text);font-family:var(--font-mono)">${(v/total*100).toFixed(0)}%</span>
      </div>`;
    }).join('');
  }
}
