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

function importMomoXlsx(event) {
  const file = event.target.files[0];
  if (!file) return;
  event.target.value = '';

  const reader = new FileReader();
  reader.onerror = () => showToast('Không đọc được file.', 'error');
  reader.onload = e => {
    try {
      if (typeof XLSX === 'undefined') throw new Error('Thư viện XLSX chưa tải. Tải lại trang và thử lại.');
      const workbook = XLSX.read(new Uint8Array(e.target.result), { type: 'array', cellDates: false });
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      const rows = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '', raw: false });

      // Find header row (search up to row 10)
      let headerRowIdx = -1;
      for (let i = 0; i < Math.min(rows.length, 10); i++) {
        const rowStr = rows[i].map(c => String(c)).join('|').toLowerCase();
        if (rowStr.includes('thời gian') || rowStr.includes('so tien') || rowStr.includes('số tiền')) {
          headerRowIdx = i;
          break;
        }
      }
      if (headerRowIdx === -1) {
        showToast('Không tìm thấy header trong file. Kiểm tra lại định dạng.', 'error');
        return;
      }

      const headers = rows[headerRowIdx].map(h => String(h).trim().toLowerCase());

      // Map column names to indices
      const col = {};
      headers.forEach((h, i) => {
        if (h.includes('thời gian') || h.includes('thoi gian')) col.time = i;
        else if (h.includes('mã giao dịch') || h.includes('ma giao dich')) col.txCode = i;
        else if (h.includes('loại giao dịch') || h.includes('loai giao dich')) col.txType = i;
        else if (h.includes('số tiền') || h.includes('so tien')) col.amount = i;
        else if (h.includes('trạng thái') || h.includes('trang thai')) col.status = i;
        else if (h.includes('tên định danh') || h.includes('ten dinh danh')) {
          // First occurrence = sender name, second = receiver name
          if (col.senderName === undefined) col.senderName = i;
          else col.receiverName = i;
        }
      });

      if (col.amount === undefined || col.time === undefined) {
        showToast('File thiếu cột "Số Tiền" hoặc "Thời gian".', 'error');
        return;
      }

      const data = getData();
      // Collect existing MoMo codes to skip duplicates
      const existingCodes = new Set(
        data.transactions.filter(t => t.momoCode).map(t => t.momoCode)
      );

      let imported = 0, skipped = 0, failed = 0;

      const dataRows = rows.slice(headerRowIdx + 1).filter(r =>
        r.some(c => String(c).trim() !== '')
      );

      for (const row of dataRows) {
        // Skip failed / non-successful transactions
        if (col.status !== undefined) {
          const status = String(row[col.status] || '').trim().toLowerCase();
          if (status && !status.includes('thành công') && !status.includes('thanh cong') && !status.includes('success')) {
            failed++;
            continue;
          }
        }

        // Parse amount — strip all non-digit characters (handles "100.000", "100,000", "-100000")
        const rawAmt = String(row[col.amount] || '').replace(/[^\d]/g, '');
        const amount = parseInt(rawAmt, 10) || 0;
        if (amount <= 0) { skipped++; continue; }

        // Parse date — MoMo format: "DD/MM/YYYY HH:mm:ss" or "DD/MM/YYYY"
        const rawDate = String(row[col.time] || '').trim();
        const dateMatch = rawDate.match(/(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})/);
        if (!dateMatch) { skipped++; continue; }
        const date = `${dateMatch[3]}-${dateMatch[2].padStart(2,'0')}-${dateMatch[1].padStart(2,'0')}`;

        // Determine income/expense from transaction type
        const txTypeRaw = col.txType !== undefined ? String(row[col.txType] || '').trim() : '';
        const txTypeLower = txTypeRaw.toLowerCase();
        const isIncome = txTypeLower.includes('nhận') || txTypeLower.includes('nhan') ||
                         txTypeLower.includes('hoàn') || txTypeLower.includes('hoan') ||
                         txTypeLower.includes('nạp') || txTypeLower.includes('nap');
        const type = isIncome ? 'income' : 'expense';
        const category = isIncome ? 'khac_thu' : 'khac_chi';

        // Deduplication by MoMo transaction code
        const momoCode = col.txCode !== undefined ? String(row[col.txCode] || '').trim() : '';
        if (momoCode && existingCodes.has(momoCode)) { skipped++; continue; }

        // Build note: counterparty name + transaction type
        let counterparty = '';
        if (type === 'expense' && col.receiverName !== undefined) {
          counterparty = String(row[col.receiverName] || '').trim();
        } else if (type === 'income' && col.senderName !== undefined) {
          counterparty = String(row[col.senderName] || '').trim();
        }
        const note = [txTypeRaw, counterparty].filter(Boolean).join(' - ');

        const tx = { id: data.nextId++, type, category, amount, date, note };
        if (momoCode) tx.momoCode = momoCode;

        data.transactions.push(tx);
        if (momoCode) existingCodes.add(momoCode);
        imported++;
      }

      if (imported === 0) {
        const detail = [failed && `${failed} thất bại`, skipped && `${skipped} bỏ qua`].filter(Boolean).join(', ');
        showToast(`Không có giao dịch nào được import${detail ? ' (' + detail + ')' : ''}.`, 'info');
        return;
      }

      data.transactions.sort((a, b) => b.date.localeCompare(a.date));
      saveData(data);

      populateDashMonthSelect();
      renderDashboard();
      renderBudget();
      renderExportStats();
      const sel = document.getElementById('filter-month');
      if (sel) { sel.innerHTML = '<option value="">All months</option>'; populateFilterOptions(); }
      if (document.getElementById('page-list').classList.contains('active')) renderList();
      if (document.getElementById('page-charts').classList.contains('active')) renderCharts();

      const detail = [failed && `${failed} thất bại`, skipped && `${skipped} bỏ qua/trùng`].filter(Boolean).join(', ');
      showToast(`Đã import ${imported} giao dịch${detail ? ' · ' + detail : ''}.`, 'success');
    } catch (err) {
      console.error('MoMo XLSX import error:', err);
      showToast('Lỗi đọc file: ' + err.message, 'error');
    }
  };
  reader.readAsArrayBuffer(file);
}

function clearData() {  if (!confirm('Are you sure you want to delete all data? This cannot be undone.')) return;
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
