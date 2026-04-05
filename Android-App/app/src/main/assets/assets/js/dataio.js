// ═══════════════════════════════════════════════
//  DATA I/O — Export / Import / Clear
// ═══════════════════════════════════════════════

function renderExportStats() {
  const data = getData();
  const el = document.getElementById('export-stats');
  if (!el) return;
  const totInc = data.transactions.filter(t=>t.type==='income').reduce((s,t)=>s+t.amount,0);
  const totExp = data.transactions.filter(t=>t.type==='expense').reduce((s,t)=>s+t.amount,0);
  el.innerHTML = `${data.transactions.length} transactions &middot; Income: ${fmtVND(totInc)} &middot; Expenses: ${fmtVND(totExp)}`;
}

function exportData() {
  const data = getData();
  const json = JSON.stringify(data, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  const now = new Date();
  a.href = url;
  a.download = `money_tracker_${now.getFullYear()}${String(now.getMonth()+1).padStart(2,'0')}${String(now.getDate()).padStart(2,'0')}.json`;
  a.click();
  URL.revokeObjectURL(url);
  showToast('Data exported', 'success');
}

function importData(event) {
  const file = event.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = e => {
    try {
      const data = JSON.parse(e.target.result);
      if (!data.transactions || !Array.isArray(data.transactions)) throw new Error('Invalid format');

      saveData(data);
      window._appData = data;

      populateDashMonthSelect();
      renderDashboard();
      renderBudget();
      renderExportStats();

      const sel = document.getElementById('filter-month');
      if (sel) {
        sel.innerHTML = '<option value="">All months</option>';
        populateFilterOptions();
      }

      if (document.getElementById('page-list').classList.contains('active')) renderList();
      if (document.getElementById('page-charts').classList.contains('active')) renderCharts();
      showToast('Data imported successfully', 'success');
    } catch(err) {
      showToast('Invalid file format', 'error');
    }
  };
  reader.readAsText(file);
  event.target.value = '';
}

function clearData() {
  if (!confirm('Are you sure you want to delete all data? This cannot be undone.')) return;
  const data = { transactions: [], budgets: {}, nextId: 1 };
  saveData(data);
  window._appData = data;

  _dashYm = `${new Date().getFullYear()}-${String(new Date().getMonth()+1).padStart(2,'0')}`;
  populateDashMonthSelect();
  renderDashboard();
  renderBudget();
  renderExportStats();

  const sel = document.getElementById('filter-month');
  if (sel) sel.innerHTML = '<option value="">All months</option>';

  if (document.getElementById('page-list').classList.contains('active')) renderList();
  if (document.getElementById('page-charts').classList.contains('active')) renderCharts();
  showToast('All data deleted', 'info');
}
