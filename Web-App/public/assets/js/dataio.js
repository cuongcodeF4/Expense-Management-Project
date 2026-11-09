// ═══════════════════════════════════════════════
//  DATA I/O — Export / Import / Clear
// ═══════════════════════════════════════════════

function renderExportStats() {
  const data = getData();
  const el = document.getElementById('export-stats');
  if (!el) return;
  const totInc = data.transactions.filter(t=>t.type==='income').reduce((s,t)=>s+t.amount,0);
  const totExp = data.transactions.filter(t=>t.type==='expense').reduce((s,t)=>s+t.amount,0);
  const activeCategories = getAllCategories().length;
  el.innerHTML = isVi()
    ? `${data.transactions.length} giao dịch &middot; ${activeCategories} danh mục đang dùng &middot; Thu: ${fmtVND(totInc)} &middot; Chi: ${fmtVND(totExp)}`
    : `${data.transactions.length} transactions &middot; ${activeCategories} active categories &middot; Income: ${fmtVND(totInc)} &middot; Expenses: ${fmtVND(totExp)}`;
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
  showToast(tr('Data exported', 'Đã xuất bản sao lưu JSON'), 'success');
}

function importData(event) {
  const file = event.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = e => {
    try {
      const parsed = JSON.parse(e.target.result);
      if (!parsed.transactions || !Array.isArray(parsed.transactions)) throw new Error('Invalid format');
      const transactionCount = parsed.transactions.length;
      const data = normalizeAppData(parsed);
      if (data.transactions.length !== transactionCount) throw new Error('Invalid transaction data');

      saveData(data, { immediate: true });
      refreshAllUI();
      showToast(tr('Data imported successfully', 'Đã khôi phục dữ liệu thành công'), 'success');
    } catch(err) {
      showToast(tr('Invalid file format', 'Định dạng file không hợp lệ'), 'error');
    }
  };
  reader.readAsText(file);
  event.target.value = '';
}

function clearData() {  if (!confirm(tr('Are you sure you want to delete all data and reset categories? This cannot be undone.', 'Bạn có chắc chắn muốn xóa toàn bộ dữ liệu và đặt lại danh mục không? Không thể hoàn tác.'))) return;
  const data = createEmptyAppData();
  saveData(data, { immediate: true });

  _dashYm = `${new Date().getFullYear()}-${String(new Date().getMonth()+1).padStart(2,'0')}`;
  refreshAllUI();
  showToast(tr('All data deleted', 'Đã xóa toàn bộ dữ liệu'), 'info');
}
