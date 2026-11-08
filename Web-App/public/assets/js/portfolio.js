// ═══════════════════════════════════════════════
//  PORTFOLIO — Investment Categories, Allocation & Monthly ROI (%)
// ═══════════════════════════════════════════════

let _selectedAssetId = null;
let _portfolioRangeMonths = 12;

function getCurrentYm() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}

function getInvestmentsList() {
  const data = getData();
  if (!Array.isArray(data.investments)) {
    data.investments = typeof cloneDefaultInvestments === 'function' ? cloneDefaultInvestments() : [];
  }
  return data.investments;
}

function getEffectiveAssetCurrent(asset) {
  if (!asset) return 0;
  return Math.max(0, Number(asset.currentAmount) || 0);
}

function getEffectiveAssetInvested(asset) {
  if (!asset) return 0;
  return Math.max(0, Number(asset.initialAmount) || 0);
}

function calcRoiPct(invested, current) {
  const inv = Number(invested) || 0;
  const cur = Number(current) || 0;
  if (inv <= 0) return cur > 0 ? 100 : 0;
  return ((cur - inv) / inv) * 100;
}

function fmtSignedPct(pct) {
  const val = Number(pct) || 0;
  const sign = val > 0 ? '+' : '';
  return `${sign}${val.toFixed(2)}%`;
}

function fmtSignedVND(amount) {
  const val = Math.round(Number(amount) || 0);
  if (val > 0) return '+' + fmtVND(val);
  if (val < 0) return '-' + fmtVND(Math.abs(val));
  return fmtVND(0);
}

function formatPortfolioNumericInput(el) {
  if (!el) return;
  const digits = String(el.value || '').replace(/\D/g, '');
  el.value = digits ? new Intl.NumberFormat('vi-VN').format(parseInt(digits, 10)) : '';
}

function parsePortfolioNumericInput(elOrVal) {
  const raw = typeof elOrVal === 'string' ? elOrVal : (elOrVal?.value || '');
  const digits = String(raw).replace(/\D/g, '');
  if (!digits) return 0;
  const n = parseInt(digits, 10);
  return Number.isFinite(n) && n >= 0 ? n : 0;
}

function getPortfolioMonthsRange() {
  const assets = getInvestmentsList();
  const recordedMonths = new Set();
  assets.forEach(asset => {
    Object.keys(asset.monthlyHistory || {}).forEach(ym => {
      if (/^\d{4}-(0[1-9]|1[0-2])$/.test(ym)) recordedMonths.add(ym);
    });
  });

  const curYm = getCurrentYm();
  recordedMonths.add(curYm);

  const rangeSel = document.getElementById('portfolio-chart-range');
  const rangeVal = rangeSel ? parseInt(rangeSel.value, 10) : _portfolioRangeMonths;
  _portfolioRangeMonths = isNaN(rangeVal) ? 12 : rangeVal;

  if (_portfolioRangeMonths === 0) {
    const sorted = [...recordedMonths].sort();
    if (sorted.length >= 2) {
      return getMonthRangeFromTo(sorted[0], sorted[sorted.length - 1]);
    }
    return getMonthRange(6);
  }

  return getMonthRange(_portfolioRangeMonths);
}

function getAssetMonthSnapshot(asset, ym, currentYm) {
  const entry = asset.monthlyHistory?.[ym];
  if (entry && typeof entry === 'object') {
    const cur = Number(entry.current) || 0;
    const inv = Number.isFinite(Number(entry.invested)) && Number(entry.invested) > 0
      ? Number(entry.invested)
      : getEffectiveAssetInvested(asset);
    return { invested: inv, current: cur, hasEntry: true };
  }

  // Carry forward from most recent recorded past month if available
  const pastKeys = Object.keys(asset.monthlyHistory || {}).filter(k => k <= ym).sort();
  if (pastKeys.length > 0) {
    const lastKey = pastKeys[pastKeys.length - 1];
    const lastEntry = asset.monthlyHistory[lastKey];
    const cur = Number(lastEntry?.current) || 0;
    const inv = Number.isFinite(Number(lastEntry?.invested)) && Number(lastEntry.invested) > 0
      ? Number(lastEntry.invested)
      : getEffectiveAssetInvested(asset);
    return { invested: inv, current: cur, hasEntry: true };
  }

  // Fallback for current month if asset has top-level amounts set
  if (ym === currentYm && (getEffectiveAssetInvested(asset) > 0 || getEffectiveAssetCurrent(asset) > 0)) {
    return {
      invested: getEffectiveAssetInvested(asset),
      current: getEffectiveAssetCurrent(asset),
      hasEntry: true
    };
  }

  return { invested: getEffectiveAssetInvested(asset), current: 0, hasEntry: false };
}

function renderPortfolio() {
  const data = getData();
  const assets = getInvestmentsList();

  renderPortfolioSummaryKpis(assets);
  renderPortfolioCards(assets);
  renderPortfolioAllocationTable(assets);
  renderPortfolioCharts(assets);
  renderSelectedAssetDetail(assets);
}

function renderPortfolioSummaryKpis(assets) {
  const el = document.getElementById('portfolio-kpi-grid');
  if (!el) return;

  const totalInvested = assets.reduce((sum, a) => sum + getEffectiveAssetInvested(a), 0);
  const totalCurrent = assets.reduce((sum, a) => sum + getEffectiveAssetCurrent(a), 0);
  const totalPnl = totalCurrent - totalInvested;
  const totalRoi = totalInvested > 0 ? ((totalPnl / totalInvested) * 100) : 0;

  const pnlColor = totalPnl >= 0 ? 'var(--income-color)' : 'var(--expense-color)';
  const activeCount = assets.filter(a => getEffectiveAssetCurrent(a) > 0 || getEffectiveAssetInvested(a) > 0).length;

  let topAsset = null;
  assets.forEach(a => {
    if (!topAsset || getEffectiveAssetCurrent(a) > getEffectiveAssetCurrent(topAsset)) {
      topAsset = a;
    }
  });
  const topShare = (topAsset && totalCurrent > 0)
    ? ((getEffectiveAssetCurrent(topAsset) / totalCurrent) * 100).toFixed(1) + '%'
    : '0%';

  el.innerHTML = `
    <div class="summary-card balance">
      <div>
        <div class="sc-label">Total Portfolio Value</div>
        <div class="sc-value sensitive-amount" style="color:var(--primary)">${fmtVND(totalCurrent)}</div>
        <div class="sc-sub">${activeCount} funded / ${assets.length} total assets</div>
      </div>
    </div>
    <div class="summary-card income">
      <div>
        <div class="sc-label">Total Invested Capital</div>
        <div class="sc-value sensitive-amount" style="color:var(--text)">${fmtVND(totalInvested)}</div>
        <div class="sc-sub">Initial principal across all assets</div>
      </div>
    </div>
    <div class="summary-card ${totalPnl >= 0 ? 'income' : 'expense'}">
      <div>
        <div class="sc-label">Total Net Profit / Loss</div>
        <div class="sc-value sensitive-amount" style="color:${pnlColor}">${fmtSignedVND(totalPnl)}</div>
        <div class="sc-sub">${totalPnl >= 0 ? 'Unrealized gain' : 'Unrealized drawdown'}</div>
      </div>
    </div>
    <div class="summary-card saving">
      <div>
        <div class="sc-label">Portfolio ROI (%)</div>
        <div class="sc-value" style="color:${pnlColor}">${fmtSignedPct(totalRoi)}</div>
        <div class="sc-sub">${topAsset && totalCurrent > 0 ? `Top: ${escapeHtml(topAsset.icon)} ${escapeHtml(topAsset.name)} (${topShare})` : 'Add valuations below'}</div>
      </div>
    </div>
  `;
}

function renderPortfolioCards(assets) {
  const grid = document.getElementById('portfolio-assets-grid');
  if (!grid) return;

  if (assets.length === 0) {
    grid.innerHTML = `
      <div class="empty-state" style="grid-column:1/-1">
        <div class="es-icon">📈</div>
        <div class="es-text">No investment categories yet. Add one above or restore defaults.</div>
        <button type="button" class="btn btn-outline" style="margin-top:12px" onclick="restoreDefaultInvestments()">↺ Restore Default Categories</button>
      </div>
    `;
    return;
  }

  const totalCurrent = assets.reduce((s, a) => s + getEffectiveAssetCurrent(a), 0);

  grid.innerHTML = assets.map(asset => {
    const inv = getEffectiveAssetInvested(asset);
    const cur = getEffectiveAssetCurrent(asset);
    const pnl = cur - inv;
    const roi = inv > 0 ? ((pnl / inv) * 100) : (cur > 0 ? 100 : 0);
    const sharePct = totalCurrent > 0 ? ((cur / totalCurrent) * 100) : 0;
    const pnlColor = pnl >= 0 ? 'var(--income-color)' : 'var(--expense-color)';
    const isSelected = _selectedAssetId === asset.id;
    const monthCount = Object.keys(asset.monthlyHistory || {}).length;

    return `
      <div class="budget-item portfolio-asset-card ${isSelected ? 'selected' : ''}" data-asset-id="${escapeHtml(asset.id)}">
        <div class="budget-header" style="gap:8px">
          <div class="budget-cat" style="display:flex;align-items:center;gap:7px;min-width:0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">
            <span class="portfolio-color-dot" style="background:${escapeHtml(asset.color || '#00E599')}"></span>
            <span style="overflow:hidden;text-overflow:ellipsis">${escapeHtml(asset.icon)} ${escapeHtml(asset.name)}</span>
          </div>
          <div style="display:flex;align-items:center;gap:4px;flex-shrink:0">
            <span class="badge ${pnl >= 0 ? 'income' : 'expense'}" style="font-family:var(--font-mono)">${fmtSignedPct(roi)}</span>
            <button type="button" class="action-btn" title="Delete ${escapeHtml(asset.name)}" onclick="deleteInvestmentCategory('${escapeHtml(asset.id)}')">🗑</button>
          </div>
        </div>

        <div class="budget-amounts">
          <span>Share: <strong>${sharePct.toFixed(1)}%</strong></span>
          <span>P&amp;L: <strong class="sensitive-amount" style="color:${pnlColor}">${fmtSignedVND(pnl)}</strong></span>
        </div>

        <div class="progress-bar" title="Portfolio Allocation: ${sharePct.toFixed(1)}%">
          <div class="progress-fill" style="width:${Math.min(100, Math.max(0, sharePct)).toFixed(1)}%;background:${escapeHtml(asset.color || '#00E599')}"></div>
        </div>

        <div class="portfolio-quick-inputs">
          <div class="form-group">
            <label for="inv-init-${escapeHtml(asset.id)}">Invested (VND)</label>
            <input type="text" inputmode="numeric" id="inv-init-${escapeHtml(asset.id)}"
              value="${inv > 0 ? new Intl.NumberFormat('vi-VN').format(inv) : ''}"
              placeholder="0"
              oninput="formatPortfolioNumericInput(this)">
          </div>
          <div class="form-group">
            <label for="inv-cur-${escapeHtml(asset.id)}">Current (VND)</label>
            <input type="text" inputmode="numeric" id="inv-cur-${escapeHtml(asset.id)}"
              value="${cur > 0 ? new Intl.NumberFormat('vi-VN').format(cur) : ''}"
              placeholder="0"
              oninput="formatPortfolioNumericInput(this)">
          </div>
        </div>

        <div class="portfolio-card-actions">
          <button type="button" class="btn btn-primary" onclick="saveAssetQuickAmounts('${escapeHtml(asset.id)}')">
            Save
          </button>
          <button type="button" class="btn btn-outline" onclick="openInvestmentDetail('${escapeHtml(asset.id)}')">
            📊 Monthly P&amp;L (${monthCount})
          </button>
        </div>
      </div>
    `;
  }).join('');
}

function renderPortfolioAllocationTable(assets) {
  const tbody = document.getElementById('portfolio-alloc-tbody');
  const tfoot = document.getElementById('portfolio-alloc-tfoot');
  if (!tbody || !tfoot) return;

  const totalInvested = assets.reduce((s, a) => s + getEffectiveAssetInvested(a), 0);
  const totalCurrent = assets.reduce((s, a) => s + getEffectiveAssetCurrent(a), 0);
  const totalPnl = totalCurrent - totalInvested;
  const totalRoi = totalInvested > 0 ? ((totalPnl / totalInvested) * 100) : 0;

  if (assets.length === 0) {
    tbody.innerHTML = '<tr><td colspan="7" style="text-align:center;color:var(--text-muted);padding:24px">No investment assets available.</td></tr>';
    tfoot.innerHTML = '';
    return;
  }

  // Sort by current value descending for clear weight ranking
  const sorted = [...assets].sort((a, b) => getEffectiveAssetCurrent(b) - getEffectiveAssetCurrent(a));

  tbody.innerHTML = sorted.map(asset => {
    const inv = getEffectiveAssetInvested(asset);
    const cur = getEffectiveAssetCurrent(asset);
    const pnl = cur - inv;
    const roi = inv > 0 ? ((pnl / inv) * 100) : (cur > 0 ? 100 : 0);
    const sharePct = totalCurrent > 0 ? ((cur / totalCurrent) * 100) : 0;
    const pnlColor = pnl >= 0 ? 'var(--income-color)' : 'var(--expense-color)';

    return `
      <tr class="portfolio-table-row" onclick="openInvestmentDetail('${escapeHtml(asset.id)}')" style="cursor:pointer" title="Click to log monthly valuation &amp; view ROI chart">
        <td>
          <div style="display:flex;align-items:center;gap:8px;font-weight:700">
            <span class="portfolio-color-dot" style="background:${escapeHtml(asset.color || '#00E599')}"></span>
            <span>${escapeHtml(asset.icon)} ${escapeHtml(asset.name)}</span>
          </div>
        </td>
        <td class="sensitive-amount" style="text-align:right;font-family:var(--font-mono)">${fmtVND(inv)}</td>
        <td class="sensitive-amount" style="text-align:right;font-family:var(--font-mono);font-weight:700">${fmtVND(cur)}</td>
        <td class="sensitive-amount" style="text-align:right;font-family:var(--font-mono);font-weight:700;color:${pnlColor}">${fmtSignedVND(pnl)}</td>
        <td style="text-align:right;font-family:var(--font-mono);font-weight:700;color:${pnlColor}">${fmtSignedPct(roi)}</td>
        <td style="min-width:140px">
          <div style="display:flex;align-items:center;justify-content:flex-end;gap:8px">
            <div class="progress-bar" style="width:64px;height:6px">
              <div class="progress-fill" style="width:${Math.min(100, Math.max(0, sharePct)).toFixed(1)}%;background:${escapeHtml(asset.color || '#00E599')}"></div>
            </div>
            <span style="font-family:var(--font-mono);font-weight:700;min-width:48px;text-align:right">${sharePct.toFixed(1)}%</span>
          </div>
        </td>
        <td style="text-align:right" onclick="event.stopPropagation()">
          <button type="button" class="btn btn-outline" style="padding:4px 10px;font-size:11px" onclick="openInvestmentDetail('${escapeHtml(asset.id)}')">Monthly Log ›</button>
        </td>
      </tr>
    `;
  }).join('');

  const totalPnlColor = totalPnl >= 0 ? 'var(--income-color)' : 'var(--expense-color)';
  tfoot.innerHTML = `
    <tr class="remaining-total-row">
      <td style="font-weight:800">Total Portfolio</td>
      <td class="sensitive-amount" style="text-align:right;font-family:var(--font-mono);font-weight:800">${fmtVND(totalInvested)}</td>
      <td class="sensitive-amount" style="text-align:right;font-family:var(--font-mono);font-weight:800;color:var(--primary)">${fmtVND(totalCurrent)}</td>
      <td class="sensitive-amount" style="text-align:right;font-family:var(--font-mono);font-weight:800;color:${totalPnlColor}">${fmtSignedVND(totalPnl)}</td>
      <td style="text-align:right;font-family:var(--font-mono);font-weight:800;color:${totalPnlColor}">${fmtSignedPct(totalRoi)}</td>
      <td style="text-align:right;font-family:var(--font-mono);font-weight:800">100.0%</td>
      <td></td>
    </tr>
  `;
}

function renderPortfolioCharts(assets) {
  const isLight = document.body.classList.contains('light-mode');
  const tickCol = isLight ? '#475569' : '#94A3B8';
  const gridCol = isLight ? 'rgba(5, 150, 105, 0.10)' : 'rgba(0, 229, 153, 0.08)';

  // 1. Multi-Line Monthly ROI (%) Chart Across All Categories
  const multiCanvas = document.getElementById('portfolioMultiLineChart');
  if (multiCanvas) {
    const ctx = multiCanvas.getContext('2d');
    if (_charts.portfolioMulti) _charts.portfolioMulti.destroy();

    const months = getPortfolioMonthsRange();
    const labels = months.map(fmtMonthLabel);
    const currentYm = getCurrentYm();

    const datasets = [];
    assets.forEach((asset, idx) => {
      const hasAnyValue = getEffectiveAssetInvested(asset) > 0 ||
        getEffectiveAssetCurrent(asset) > 0 ||
        Object.keys(asset.monthlyHistory || {}).length > 0;
      if (!hasAnyValue) return;

      const points = months.map(ym => {
        const snap = getAssetMonthSnapshot(asset, ym, currentYm);
        if (!snap.hasEntry || snap.invested <= 0) return null;
        return Number(calcRoiPct(snap.invested, snap.current).toFixed(2));
      });

      if (points.some(v => v !== null)) {
        datasets.push({
          label: `${asset.icon} ${asset.name}`,
          data: points,
          borderColor: asset.color || PIE_COLORS[idx % PIE_COLORS.length],
          backgroundColor: asset.color || PIE_COLORS[idx % PIE_COLORS.length],
          borderWidth: 2.4,
          pointRadius: 3.5,
          pointHoverRadius: 5.5,
          tension: 0.3,
          spanGaps: true,
          fill: false
        });
      }
    });

    // Also compute Total Portfolio ROI (%) line across months
    const totalPoints = months.map(ym => {
      let sumInv = 0;
      let sumCur = 0;
      let any = false;
      assets.forEach(asset => {
        const snap = getAssetMonthSnapshot(asset, ym, currentYm);
        if (snap.hasEntry && snap.invested > 0) {
          sumInv += snap.invested;
          sumCur += snap.current;
          any = true;
        }
      });
      if (!any || sumInv <= 0) return null;
      return Number(calcRoiPct(sumInv, sumCur).toFixed(2));
    });

    if (totalPoints.some(v => v !== null)) {
      datasets.push({
        label: '★ Total Portfolio ROI',
        data: totalPoints,
        borderColor: isLight ? '#062019' : '#FFFFFF',
        backgroundColor: isLight ? '#062019' : '#FFFFFF',
        borderDash: [6, 4],
        borderWidth: 2.6,
        pointRadius: 4,
        tension: 0.3,
        spanGaps: true,
        fill: false
      });
    }

    // If user hasn't entered amounts yet, show a flat 0% baseline so chart canvas stays informative
    if (datasets.length === 0) {
      datasets.push({
        label: 'Portfolio ROI (%)',
        data: months.map(() => 0),
        borderColor: '#00E599',
        backgroundColor: 'rgba(0, 229, 153, 0.12)',
        borderWidth: 2,
        pointRadius: 2.5,
        tension: 0.3
      });
    }

    _charts.portfolioMulti = new Chart(ctx, {
      type: 'line',
      data: { labels, datasets },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: { mode: 'index', intersect: false, axis: 'x' },
        plugins: {
          legend: {
            position: 'top',
            labels: { color: tickCol, font: { size: 11 }, boxWidth: 12, padding: 12 }
          },
          tooltip: {
            callbacks: {
              label: c => {
                const v = c.raw;
                if (v === null || v === undefined) return ` ${c.dataset.label}: No data`;
                return ` ${c.dataset.label}: ${fmtSignedPct(v)}`;
              }
            }
          }
        },
        scales: {
          y: {
            ticks: {
              color: tickCol,
              callback: v => `${v > 0 ? '+' : ''}${Number(v).toFixed(0)}%`,
              font: { size: 10 }
            },
            grid: {
              color: ctxGrid => (ctxGrid.tick && ctxGrid.tick.value === 0)
                ? (isLight ? 'rgba(6, 32, 25, 0.38)' : 'rgba(255, 255, 255, 0.35)')
                : gridCol
            }
          },
          x: {
            ticks: { color: tickCol, font: { size: 10 }, maxTicksLimit: 14 },
            grid: { display: false }
          }
        }
      }
    });
    if (typeof bindPortfolioMultiLineTouch === 'function') {
      bindPortfolioMultiLineTouch(_charts.portfolioMulti);
    }
  }

  // 2. Portfolio Allocation Doughnut Chart
  const allocCanvas = document.getElementById('portfolioAllocChart');
  const allocLegend = document.getElementById('portfolioAllocLegend');
  if (allocCanvas) {
    const ctx = allocCanvas.getContext('2d');
    if (_charts.portfolioAlloc) _charts.portfolioAlloc.destroy();

    const funded = assets.filter(a => getEffectiveAssetCurrent(a) > 0)
      .sort((a, b) => getEffectiveAssetCurrent(b) - getEffectiveAssetCurrent(a));
    const totalCurrent = funded.reduce((s, a) => s + getEffectiveAssetCurrent(a), 0);

    if (funded.length === 0) {
      if (allocLegend) {
        allocLegend.innerHTML = '<span style="color:var(--text-muted);font-size:12px">Enter Current Value in any asset card to visualize allocation %</span>';
      }
      _charts.portfolioAlloc = new Chart(ctx, {
        type: 'doughnut',
        data: {
          labels: ['Unallocated'],
          datasets: [{ data: [1], backgroundColor: ['rgba(148, 163, 184, 0.2)'], borderWidth: 0 }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          cutout: '66%',
          plugins: { legend: { display: false }, tooltip: { enabled: false } }
        }
      });
      return;
    }

    _charts.portfolioAlloc = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: funded.map(a => `${a.icon} ${a.name}`),
        datasets: [{
          data: funded.map(a => getEffectiveAssetCurrent(a)),
          backgroundColor: funded.map((a, i) => a.color || PIE_COLORS[i % PIE_COLORS.length]),
          borderWidth: 2,
          borderColor: isLight ? '#FFFFFF' : '#07130E',
          hoverOffset: 8
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: '64%',
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              label: c => {
                const val = Number(c.raw || 0);
                const pct = totalCurrent > 0 ? ((val / totalCurrent) * 100).toFixed(1) : '0.0';
                return ` ${c.label}: ${fmtVND(val)} (${pct}%)`;
              }
            }
          }
        }
      }
    });
    if (typeof bindChartTouchInspector === 'function') bindChartTouchInspector(_charts.portfolioAlloc);

    if (allocLegend) {
      allocLegend.innerHTML = funded.map((a, i) => {
        const val = getEffectiveAssetCurrent(a);
        const pct = totalCurrent > 0 ? ((val / totalCurrent) * 100).toFixed(1) : '0.0';
        const col = a.color || PIE_COLORS[i % PIE_COLORS.length];
        return `
          <div style="display:flex;align-items:center;gap:6px;cursor:pointer" onclick="openInvestmentDetail('${escapeHtml(a.id)}')">
            <span style="display:inline-block;width:9px;height:9px;border-radius:3px;background:${col};flex-shrink:0"></span>
            <span style="font-size:12px;color:var(--text)">${escapeHtml(a.icon)} ${escapeHtml(a.name)}</span>
            <span style="margin-left:auto;font-family:var(--font-mono);font-weight:700;font-size:12px">${pct}%</span>
          </div>
        `;
      }).join('');
    }
  }
}

// Custom readout binder for ROI (%) charts so the live bar displays signed % instead of VND
function bindPortfolioMultiLineTouch(chart, isSingleAsset = false, assetRef = null) {
  if (!chart || !chart.canvas) return;
  const canvas = chart.canvas;
  const cardBody = canvas.closest('.card-body');
  let readout = cardBody ? cardBody.querySelector('.chart-active-readout') : null;
  if (cardBody && !readout) {
    readout = document.createElement('div');
    readout.className = 'chart-active-readout';
    readout.innerHTML = '<span class="chart-readout-hint">👆 Tap or drag across months to inspect ROI (%) &amp; P&amp;L</span>';
    cardBody.insertBefore(readout, cardBody.firstChild);
  }

  function handlePointer(clientX, clientY) {
    if (!chart.ctx || !chart.width || !chart.height) return;
    const rect = canvas.getBoundingClientRect();
    if (!rect.width || !rect.height) return;
    const relX = ((clientX - rect.left) / rect.width) * chart.width;
    const relY = ((clientY - rect.top) / rect.height) * chart.height;
    const area = chart.chartArea;
    if (area && relY < area.top - 2) return;

    let bestIdx = -1;
    let bestDist = Infinity;
    let targetX = relX;
    let targetY = area ? (area.top + area.bottom) / 2 : relY;

    for (let dsIdx = 0; dsIdx < (chart.data.datasets || []).length; dsIdx++) {
      if (!chart.isDatasetVisible(dsIdx)) continue;
      const meta = chart.getDatasetMeta(dsIdx);
      if (!meta?.data?.length) continue;
      meta.data.forEach((el, idx) => {
        if (!el || typeof el.x !== 'number' || isNaN(el.x)) return;
        const d = Math.abs(el.x - relX);
        if (d < bestDist) {
          bestDist = d;
          bestIdx = idx;
          targetX = el.x;
          if (typeof el.y === 'number' && !isNaN(el.y)) {
            targetY = Math.max((area?.top || 0) + 18, Math.min(el.y, (area?.bottom || chart.height) - 18));
          }
        }
      });
      if (bestIdx !== -1) break;
    }

    if (bestIdx === -1) return;

    const active = [];
    (chart.data.datasets || []).forEach((ds, dsIdx) => {
      if (chart.isDatasetVisible(dsIdx) && ds.data?.[bestIdx] !== null && ds.data?.[bestIdx] !== undefined && chart.getDatasetMeta(dsIdx)?.data?.[bestIdx]) {
        active.push({ datasetIndex: dsIdx, index: bestIdx });
      }
    });

    chart.setActiveElements(active);
    chart.tooltip?.setActiveElements(active, { x: targetX, y: targetY });
    chart.update('none');

    if (readout) {
      const label = chart.data.labels?.[bestIdx] || '';
      const parts = [];
      (chart.data.datasets || []).forEach((ds, dsIdx) => {
        if (!chart.isDatasetVisible(dsIdx)) return;
        const val = ds.data?.[bestIdx];
        if (val === null || val === undefined) return;
        const color = ds.borderColor || '#00E599';
        const valColor = val >= 0 ? 'var(--income-color)' : 'var(--expense-color)';
        parts.push(`
          <span class="chart-readout-item">
            <span class="chart-readout-dot" style="background:${color}"></span>
            <span class="chart-readout-ds">${escapeHtml(ds.label || '')}:</span>
            <strong style="color:${valColor}">${fmtSignedPct(val)}</strong>
          </span>
        `);
      });

      if (isSingleAsset && assetRef && assetRef._monthKeys?.[bestIdx]) {
        const ym = assetRef._monthKeys[bestIdx];
        const snap = getAssetMonthSnapshot(assetRef, ym, getCurrentYm());
        const pnl = snap.current - snap.invested;
        const pnlColor = pnl >= 0 ? 'var(--income-color)' : 'var(--expense-color)';
        parts.push(`
          <span class="chart-readout-item">
            <span class="chart-readout-ds">Value:</span>
            <strong class="sensitive-amount">${fmtVND(snap.current)}</strong>
            <span class="chart-readout-ds">P&amp;L:</span>
            <strong class="sensitive-amount" style="color:${pnlColor}">${fmtSignedVND(pnl)}</strong>
          </span>
        `);
      }

      if (parts.length > 0) {
        readout.innerHTML = `<span class="chart-readout-title">${escapeHtml(String(label))}</span>${parts.join('')}`;
        readout.classList.add('active');
      }
    }
  }

  if (!canvas._roiTouchBound) {
    canvas._roiTouchBound = true;
    let sx = 0, sy = 0;
    canvas.addEventListener('touchstart', e => {
      if (!e.touches || e.touches.length !== 1) return;
      sx = e.touches[0].clientX;
      sy = e.touches[0].clientY;
      canvas._roiHandler?.(sx, sy);
    }, { passive: true });
    canvas.addEventListener('touchmove', e => {
      if (!e.touches || e.touches.length !== 1) return;
      const dx = Math.abs(e.touches[0].clientX - sx);
      const dy = Math.abs(e.touches[0].clientY - sy);
      if (dx >= dy * 0.7) canvas._roiHandler?.(e.touches[0].clientX, e.touches[0].clientY);
    }, { passive: true });
    canvas.addEventListener('click', e => {
      canvas._roiHandler?.(e.clientX, e.clientY);
    });
  }
  canvas._roiHandler = handlePointer;
}

// ═══════════════════════════════════════════════
//  CRUD — Add / Delete / Quick Update Investment Categories
// ═══════════════════════════════════════════════

function addInvestmentCategory(event) {
  if (event) event.preventDefault();
  const iconEl = document.getElementById('new-inv-icon');
  const nameEl = document.getElementById('new-inv-name');
  const initEl = document.getElementById('new-inv-initial');
  const curEl = document.getElementById('new-inv-current');

  const name = String(nameEl?.value || '').trim();
  if (!name) {
    showToast('Please enter an investment category name', 'error');
    nameEl?.focus();
    return;
  }

  const assets = getInvestmentsList();
  if (assets.some(a => a.name.toLowerCase() === name.toLowerCase())) {
    showToast('An investment category with this name already exists', 'error');
    return;
  }

  const iconRaw = Array.from(String(iconEl?.value || '').trim());
  const icon = iconRaw.length ? iconRaw.slice(0, 8).join('') : '💎';
  const initialAmount = parsePortfolioNumericInput(initEl);
  const currentAmount = parsePortfolioNumericInput(curEl) || initialAmount;

  const palette = ['#00E599', '#22D3EE', '#F59E0B', '#FB923C', '#A855F7', '#EC4899', '#38BDF8', '#10B981', '#F43F5E', '#14B8A6'];
  const color = palette[assets.length % palette.length];
  const id = 'inv_' + Date.now() + '_' + Math.random().toString(36).slice(2, 7);

  const curYm = getCurrentYm();
  const monthlyHistory = {};
  if (initialAmount > 0 || currentAmount > 0) {
    monthlyHistory[curYm] = { invested: initialAmount, current: currentAmount };
  }

  assets.push({
    id,
    name: name.slice(0, 50),
    icon,
    color,
    initialAmount,
    currentAmount,
    monthlyHistory,
    order: assets.length
  });

  const data = getData();
  data.investments = assets;
  saveData(data);

  if (iconEl) iconEl.value = '';
  if (nameEl) nameEl.value = '';
  if (initEl) initEl.value = '';
  if (curEl) curEl.value = '';

  _selectedAssetId = id;
  renderPortfolio();
  showToast(`Added "${name}" to Investment Portfolio`, 'success');
}

function deleteInvestmentCategory(assetId) {
  const assets = getInvestmentsList();
  const idx = assets.findIndex(a => a.id === assetId);
  if (idx === -1) return;
  const target = assets[idx];
  if (!confirm(`Delete "${target.icon} ${target.name}" and its monthly history from your portfolio?`)) return;

  assets.splice(idx, 1);
  if (_selectedAssetId === assetId) {
    _selectedAssetId = assets[0]?.id || null;
  }
  const data = getData();
  data.investments = assets;
  saveData(data);
  renderPortfolio();
  showToast(`Deleted "${target.name}"`, 'info');
}

function restoreDefaultInvestments() {
  const data = getData();
  const assets = getInvestmentsList();
  const defaults = typeof cloneDefaultInvestments === 'function' ? cloneDefaultInvestments() : [];
  let added = 0;
  defaults.forEach(def => {
    if (!assets.some(a => a.id === def.id || a.name.toLowerCase() === def.name.toLowerCase())) {
      assets.push({ ...def, order: assets.length });
      added++;
    }
  });
  if (added === 0) {
    showToast('All default investment categories are already present', 'info');
    return;
  }
  data.investments = assets;
  saveData(data);
  renderPortfolio();
  showToast(`Restored ${added} default investment categories`, 'success');
}

function saveAssetQuickAmounts(assetId) {
  const assets = getInvestmentsList();
  const asset = assets.find(a => a.id === assetId);
  if (!asset) return;

  const initEl = document.getElementById(`inv-init-${assetId}`);
  const curEl = document.getElementById(`inv-cur-${assetId}`);
  const initialAmount = parsePortfolioNumericInput(initEl);
  const currentAmount = parsePortfolioNumericInput(curEl);

  asset.initialAmount = initialAmount;
  asset.currentAmount = currentAmount;

  if (!asset.monthlyHistory) asset.monthlyHistory = {};
  const curYm = getCurrentYm();
  asset.monthlyHistory[curYm] = {
    invested: initialAmount,
    current: currentAmount
  };

  const data = getData();
  data.investments = assets;
  saveData(data);
  renderPortfolio();
  showToast(`Saved valuation for ${asset.icon} ${asset.name}`, 'success');
}

// ═══════════════════════════════════════════════
//  ASSET DETAIL DRILLDOWN — Monthly Valuation Log & ROI (%) Chart
// ═══════════════════════════════════════════════

function openInvestmentDetail(assetId) {
  _selectedAssetId = assetId;
  renderPortfolio();
  const panel = document.getElementById('portfolio-detail-card');
  if (panel) {
    panel.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }
}

function closeInvestmentDetail() {
  _selectedAssetId = null;
  renderPortfolio();
}

function onSelectDetailAssetChange(sel) {
  if (!sel) return;
  _selectedAssetId = sel.value || null;
  renderPortfolio();
}

function renderSelectedAssetDetail(assets) {
  const card = document.getElementById('portfolio-detail-card');
  if (!card) return;

  if (!_selectedAssetId && assets.length > 0) {
    _selectedAssetId = assets[0].id;
  }

  const asset = assets.find(a => a.id === _selectedAssetId);
  if (!asset) {
    card.style.display = 'none';
    return;
  }

  card.style.display = 'block';
  const curYm = getCurrentYm();
  const inv = getEffectiveAssetInvested(asset);
  const cur = getEffectiveAssetCurrent(asset);
  const pnl = cur - inv;
  const roi = calcRoiPct(inv, cur);
  const pnlColor = pnl >= 0 ? 'var(--income-color)' : 'var(--expense-color)';

  const selEl = document.getElementById('detail-asset-select');
  if (selEl) {
    selEl.innerHTML = assets.map(a =>
      `<option value="${escapeHtml(a.id)}" ${a.id === asset.id ? 'selected' : ''}>${escapeHtml(a.icon)} ${escapeHtml(a.name)}</option>`
    ).join('');
  }

  const badgeEl = document.getElementById('detail-asset-summary-badge');
  if (badgeEl) {
    badgeEl.innerHTML = `
      <span>Invested: <strong class="sensitive-amount">${fmtVND(inv)}</strong></span>
      <span>Current: <strong class="sensitive-amount">${fmtVND(cur)}</strong></span>
      <span>Net P&amp;L: <strong class="sensitive-amount" style="color:${pnlColor}">${fmtSignedVND(pnl)} (${fmtSignedPct(roi)})</strong></span>
    `;
  }

  const initInput = document.getElementById('detail-initial-input');
  if (initInput && document.activeElement !== initInput) {
    initInput.value = inv > 0 ? new Intl.NumberFormat('vi-VN').format(inv) : '';
  }

  const monthInput = document.getElementById('detail-month-input');
  if (monthInput && !monthInput.value) {
    monthInput.value = curYm;
  }
  const activeYm = monthInput?.value || curYm;
  const monthEntry = asset.monthlyHistory?.[activeYm];
  const monthCurrentVal = monthEntry ? Number(monthEntry.current || 0) : (activeYm === curYm ? cur : 0);

  const monthValInput = document.getElementById('detail-month-current-input');
  if (monthValInput && document.activeElement !== monthValInput) {
    monthValInput.value = monthCurrentVal > 0 ? new Intl.NumberFormat('vi-VN').format(monthCurrentVal) : '';
  }

  renderAssetMonthlyTable(asset);
  renderAssetDetailChart(asset);
}

function onDetailMonthPickerChange() {
  const assets = getInvestmentsList();
  const asset = assets.find(a => a.id === _selectedAssetId);
  if (!asset) return;
  const monthInput = document.getElementById('detail-month-input');
  const monthValInput = document.getElementById('detail-month-current-input');
  const initInput = document.getElementById('detail-initial-input');
  const ym = monthInput?.value || getCurrentYm();
  const entry = asset.monthlyHistory?.[ym];
  if (monthValInput) {
    const val = entry ? Number(entry.current || 0) : 0;
    monthValInput.value = val > 0 ? new Intl.NumberFormat('vi-VN').format(val) : '';
  }
  if (initInput && entry && Number.isFinite(Number(entry.invested)) && Number(entry.invested) > 0) {
    initInput.value = new Intl.NumberFormat('vi-VN').format(Number(entry.invested));
  }
}

function saveAssetMonthlyRecord(event) {
  if (event) event.preventDefault();
  const assets = getInvestmentsList();
  const asset = assets.find(a => a.id === _selectedAssetId);
  if (!asset) return;

  const initInput = document.getElementById('detail-initial-input');
  const monthInput = document.getElementById('detail-month-input');
  const monthValInput = document.getElementById('detail-month-current-input');

  const ym = String(monthInput?.value || '').trim();
  if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(ym)) {
    showToast('Please select a valid month (YYYY-MM)', 'error');
    return;
  }

  const initialAmount = parsePortfolioNumericInput(initInput);
  const monthCurrent = parsePortfolioNumericInput(monthValInput);

  asset.initialAmount = initialAmount;
  if (!asset.monthlyHistory) asset.monthlyHistory = {};
  asset.monthlyHistory[ym] = {
    invested: initialAmount,
    current: monthCurrent
  };

  // Update asset's headline currentAmount to the latest recorded month
  const sortedMonths = Object.keys(asset.monthlyHistory).sort();
  const latestYm = sortedMonths[sortedMonths.length - 1];
  if (latestYm && ym >= latestYm) {
    asset.currentAmount = monthCurrent;
  }

  const data = getData();
  data.investments = assets;
  saveData(data);
  renderPortfolio();
  showToast(`Saved ${fmtMonthLabel(ym)} valuation for ${asset.icon} ${asset.name}`, 'success');
}

function loadAssetMonthForEdit(ym) {
  const monthInput = document.getElementById('detail-month-input');
  if (monthInput) {
    monthInput.value = ym;
    onDetailMonthPickerChange();
    document.getElementById('detail-month-current-input')?.focus();
  }
}

function deleteAssetMonthRecord(ym) {
  const assets = getInvestmentsList();
  const asset = assets.find(a => a.id === _selectedAssetId);
  if (!asset || !asset.monthlyHistory?.[ym]) return;

  delete asset.monthlyHistory[ym];
  const remainingMonths = Object.keys(asset.monthlyHistory).sort();
  if (remainingMonths.length > 0) {
    const latest = remainingMonths[remainingMonths.length - 1];
    asset.currentAmount = Number(asset.monthlyHistory[latest]?.current || 0);
  }

  const data = getData();
  data.investments = assets;
  saveData(data);
  renderPortfolio();
  showToast(`Removed ${fmtMonthLabel(ym)} entry`, 'info');
}

function renderAssetMonthlyTable(asset) {
  const tbody = document.getElementById('detail-monthly-tbody');
  if (!tbody) return;

  const entries = Object.entries(asset.monthlyHistory || {}).sort((a, b) => b[0].localeCompare(a[0]));
  if (entries.length === 0) {
    tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;color:var(--text-muted);padding:18px">No monthly entries recorded yet. Choose a month above and click Save Monthly Valuation.</td></tr>';
    return;
  }

  tbody.innerHTML = entries.map(([ym, item]) => {
    const inv = Number.isFinite(Number(item?.invested)) && Number(item.invested) > 0
      ? Number(item.invested)
      : getEffectiveAssetInvested(asset);
    const cur = Number(item?.current || 0);
    const pnl = cur - inv;
    const roi = calcRoiPct(inv, cur);
    const pnlColor = pnl >= 0 ? 'var(--income-color)' : 'var(--expense-color)';

    return `
      <tr onclick="loadAssetMonthForEdit('${escapeHtml(ym)}')" style="cursor:pointer" title="Tap to edit ${fmtMonthLabel(ym)}">
        <td style="font-weight:700;font-family:var(--font-mono)">${fmtMonthLabel(ym)}</td>
        <td class="sensitive-amount" style="text-align:right;font-family:var(--font-mono)">${fmtVND(inv)}</td>
        <td class="sensitive-amount" style="text-align:right;font-family:var(--font-mono);font-weight:700">${fmtVND(cur)}</td>
        <td class="sensitive-amount" style="text-align:right;font-family:var(--font-mono);font-weight:700;color:${pnlColor}">${fmtSignedVND(pnl)}</td>
        <td style="text-align:right;font-family:var(--font-mono);font-weight:700;color:${pnlColor}">${fmtSignedPct(roi)}</td>
        <td style="text-align:right" onclick="event.stopPropagation()">
          <button type="button" class="action-btn" title="Edit ${fmtMonthLabel(ym)}" onclick="loadAssetMonthForEdit('${escapeHtml(ym)}')">✏️</button>
          <button type="button" class="action-btn" title="Delete ${fmtMonthLabel(ym)}" onclick="deleteAssetMonthRecord('${escapeHtml(ym)}')">🗑</button>
        </td>
      </tr>
    `;
  }).join('');
}

function renderAssetDetailChart(asset) {
  const canvas = document.getElementById('assetDetailChart');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  if (_charts.assetDetail) _charts.assetDetail.destroy();

  const isLight = document.body.classList.contains('light-mode');
  const tickCol = isLight ? '#475569' : '#94A3B8';
  const gridCol = isLight ? 'rgba(5, 150, 105, 0.10)' : 'rgba(0, 229, 153, 0.08)';

  const recordedKeys = Object.keys(asset.monthlyHistory || {}).sort();
  let months;
  if (recordedKeys.length >= 2) {
    months = getMonthRangeFromTo(recordedKeys[0], recordedKeys[recordedKeys.length - 1]);
  } else if (recordedKeys.length === 1) {
    const [yr, mo] = recordedKeys[0].split('-').map(Number);
    const list = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(yr, mo - 1 - i, 1);
      list.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`);
    }
    months = list;
  } else {
    months = getMonthRange(6);
  }

  asset._monthKeys = months;
  const currentYm = getCurrentYm();
  const labels = months.map(fmtMonthLabel);

  const roiData = months.map(ym => {
    const snap = getAssetMonthSnapshot(asset, ym, currentYm);
    if (!snap.hasEntry || snap.invested <= 0) return 0;
    return Number(calcRoiPct(snap.invested, snap.current).toFixed(2));
  });

  const barColors = roiData.map(v => v >= 0 ? 'rgba(0, 229, 153, 0.35)' : 'rgba(244, 63, 94, 0.38)');
  const borderColors = roiData.map(v => v >= 0 ? '#00E599' : '#F43F5E');

  _charts.assetDetail = new Chart(ctx, {
    type: 'bar',
    data: {
      labels,
      datasets: [
        {
          type: 'line',
          label: `${asset.name} ROI (%)`,
          data: roiData,
          borderColor: asset.color || '#00E599',
          backgroundColor: 'rgba(0, 229, 153, 0.12)',
          borderWidth: 2.5,
          pointRadius: 4,
          pointBackgroundColor: borderColors,
          tension: 0.3,
          order: 1
        },
        {
          type: 'bar',
          label: 'Monthly P&L (%)',
          data: roiData,
          backgroundColor: barColors,
          borderColor: borderColors,
          borderWidth: 1,
          borderRadius: 5,
          order: 2
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      interaction: { mode: 'index', intersect: false, axis: 'x' },
      plugins: {
        legend: {
          position: 'top',
          labels: { color: tickCol, font: { size: 11 }, boxWidth: 12 }
        },
        tooltip: {
          callbacks: {
            label: c => {
              const idx = c.dataIndex;
              const ym = months[idx];
              const snap = getAssetMonthSnapshot(asset, ym, currentYm);
              const pnl = snap.current - snap.invested;
              if (c.datasetIndex === 0) {
                return ` ROI: ${fmtSignedPct(c.raw)} (P&L: ${fmtSignedVND(pnl)})`;
              }
              return ` Value: ${fmtVND(snap.current)} / Invested: ${fmtVND(snap.invested)}`;
            }
          }
        }
      },
      scales: {
        y: {
          ticks: {
            color: tickCol,
            callback: v => `${v > 0 ? '+' : ''}${Number(v).toFixed(0)}%`,
            font: { size: 10 }
          },
          grid: {
            color: ctxGrid => (ctxGrid.tick && ctxGrid.tick.value === 0)
              ? (isLight ? 'rgba(6, 32, 25, 0.38)' : 'rgba(255, 255, 255, 0.35)')
              : gridCol
          }
        },
        x: {
          ticks: { color: tickCol, font: { size: 10 } },
          grid: { display: false }
        }
      }
    }
  });

  bindPortfolioMultiLineTouch(_charts.assetDetail, true, asset);
}
