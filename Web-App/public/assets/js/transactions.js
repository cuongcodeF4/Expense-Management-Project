// ═══════════════════════════════════════════════
//  TRANSACTIONS — Add / List / Delete
// ═══════════════════════════════════════════════

function setType(type) {
  _txType = type;
  document.getElementById('type-income').classList.toggle('active', type === 'income');
  document.getElementById('type-expense').classList.toggle('active', type === 'expense');
  updateCategorySelect();
}

function submitTransaction(e) {
  e.preventDefault();
  const amount = parseFloat(document.getElementById('f-amount').value);
  const category = document.getElementById('f-category').value;
  const date = document.getElementById('f-date').value;
  const note = document.getElementById('f-note').value.trim();

  if (!amount || amount <= 0) { showToast(tr('Invalid amount', 'Số tiền không hợp lệ'), 'error'); return; }
  const selectedCategory = getCategories(_txType).find(item => item.id === category);
  if (!selectedCategory) { showToast(tr('Please add or select an active category', 'Vui lòng chọn danh mục hợp lệ'), 'error'); return; }

  const data = getData();
  const tx = {
    id: data.nextId++,
    type: _txType,
    category,
    amount,
    date,
    note
  };

  data.transactions.unshift(tx);
  data.transactions.sort((a,b) => b.date.localeCompare(a.date));
  saveData(data);

  document.getElementById('tx-form').reset();
  document.getElementById('f-date').value = new Date().toISOString().slice(0,10);
  setType(_txType);

  showToast(tr('Transaction saved', 'Đã lưu giao dịch'), 'success');
  populateFilterOptions();
  renderDashboard();
}

function renderList() {
  const data = getData();
  const searchEl = document.getElementById('search-input');
  const typeEl = document.getElementById('filter-type');
  const catEl = document.getElementById('filter-category');
  const monthEl = document.getElementById('filter-month');

  const search = searchEl ? searchEl.value.toLowerCase() : '';
  const typeF = typeEl ? typeEl.value : '';
  const catF = catEl ? catEl.value : '';
  const monthF = monthEl ? monthEl.value : '';

  let txs = data.transactions.filter(t => {
    if (typeF && t.type !== typeF) return false;
    if (catF && t.category !== catF) return false;
    if (monthF && !t.date.startsWith(monthF)) return false;
    if (search) {
      const cat = getCat(t.category, t.type);
      if (!cat.label.toLowerCase().includes(search) &&
          !(t.note||'').toLowerCase().includes(search) &&
          !fmtVND(t.amount).includes(search)) return false;
    }
    return true;
  });

  const tbody = document.getElementById('tx-tbody');
  const empty = document.getElementById('list-empty');
  const summary = document.getElementById('list-summary');

  if (txs.length === 0) {
    if (tbody) tbody.innerHTML = '';
    if (empty) empty.style.display = 'block';
    if (summary) summary.textContent = '';
    return;
  }

  if (empty) empty.style.display = 'none';
  if (tbody) {
    tbody.innerHTML = txs.map(t => {
      const cat = getCat(t.category, t.type);
      const hasNote = Boolean(t.note && t.note.trim());
      return `<tr class="tx-row">
        <td class="td-date" style="white-space:nowrap">${fmtDate(t.date)}</td>
        <td class="td-type"><span class="badge ${t.type}">${t.type === 'income' ? tr('Income', 'Thu nhập') : tr('Expense', 'Chi tiêu')}</span></td>
        <td class="td-cat">${categoryHtml(cat, true)}</td>
        <td class="td-note ${hasNote ? '' : 'td-note-empty'}" style="max-width:200px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${escapeHtml(t.note || '\u2014')}</td>
        <td class="td-amount sensitive-amount" style="text-align:right;font-weight:700;font-family:var(--font-mono);color:${t.type==='income'?'var(--income-color)':'var(--expense-color)'}">
          ${t.type==='income'?'+':'-'}${fmtVND(t.amount)}
        </td>
        <td class="td-actions">
          <button class="action-btn" title="${tr('Edit', 'Sửa')}" onclick="editTransaction(${t.id})">&#9998;</button>
          <button class="action-btn" title="${tr('Delete', 'Xóa')}" onclick="deleteTransaction(${t.id})">&times;</button>
        </td>
      </tr>`;
    }).join('');
  }

  if (summary) {
    const totInc = txs.filter(t=>t.type==='income').reduce((s,t)=>s+t.amount,0);
    const totExp = txs.filter(t=>t.type==='expense').reduce((s,t)=>s+t.amount,0);
    summary.innerHTML = isVi()
      ? `Đang hiển thị <strong>${txs.length}</strong> giao dịch &middot; Thu: <span style="color:var(--income-color)">${fmtVND(totInc)}</span> &middot; Chi: <span style="color:var(--expense-color)">${fmtVND(totExp)}</span> &middot; Cân đối: <strong>${fmtVND(totInc-totExp)}</strong>`
      : `Showing <strong>${txs.length}</strong> transactions &middot; Income: <span style="color:var(--income-color)">${fmtVND(totInc)}</span> &middot; Expenses: <span style="color:var(--expense-color)">${fmtVND(totExp)}</span> &middot; Balance: <strong>${fmtVND(totInc-totExp)}</strong>`;
  }
}

function clearFilters() {
  const s = document.getElementById('search-input');
  const t = document.getElementById('filter-type');
  const c = document.getElementById('filter-category');
  const m = document.getElementById('filter-month');
  if (s) s.value = '';
  if (t) t.value = '';
  if (c) c.value = '';
  if (m) m.value = '';
  renderList();
}

function deleteTransaction(id) {
  _deleteId = id;
  const modal = document.getElementById('delete-modal');
  document.getElementById('modal-title').textContent = tr('Confirm Delete', 'Xác Nhận Xóa');
  document.getElementById('modal-body').innerHTML = `<p style="color:var(--text-muted)">${tr('Are you sure you want to delete this transaction?', 'Bạn có chắc chắn muốn xóa giao dịch này không?')}</p>`;
  document.getElementById('modal-footer').innerHTML = `
    <button class="btn btn-outline" onclick="closeModal()">${tr('Cancel', 'Hủy')}</button>
    <button class="btn btn-danger" id="confirm-delete-btn">${tr('Delete', 'Xóa')}</button>
  `;
  document.getElementById('confirm-delete-btn').onclick = () => {
    const data = getData();
    data.transactions = data.transactions.filter(t => t.id !== id);
    saveData(data);
    closeModal();
    refreshCategoryControls();
    renderList();
    renderDashboard();
    showToast(tr('Transaction deleted', 'Đã xóa giao dịch'), 'info');
  };
  openModal(document.querySelector('#modal-footer .btn-outline'));
}

function editTransaction(id) {
  const data = getData();
  const tx = data.transactions.find(t => t.id === id);
  if (!tx) return;

  const modal = document.getElementById('delete-modal');
  document.getElementById('modal-title').textContent = tr('Edit Transaction', 'Chỉnh Sửa Giao Dịch');

  const categories = getCategories(tx.type);
  const currentCategory = getCat(tx.category, tx.type);
  if (currentCategory.active === false && !categories.some(category => category.id === currentCategory.id)) {
    categories.unshift(currentCategory);
  }

  document.getElementById('modal-body').innerHTML = `
    <form id="edit-tx-form" class="form-grid">
      <div class="form-group">
        <label>${tr('Amount (VND)', 'Số tiền (VND)')}</label>
        <input type="text" id="edit-amount-display" value="${new Intl.NumberFormat('vi-VN').format(tx.amount)}" required>
        <input type="hidden" id="edit-amount" value="${tx.amount}">
      </div>
      <div class="form-group">
        <label>${tr('Category', 'Danh mục')}</label>
        <select id="edit-category" required></select>
      </div>
      <div class="form-group">
        <label>${tr('Date', 'Ngày')}</label>
        <input type="date" id="edit-date" value="${tx.date}" required>
      </div>
      <div class="form-group">
        <label>${tr('Note', 'Ghi chú')}</label>
        <input type="text" id="edit-note" value="${escapeHtml(tx.note || '')}" placeholder="${tr('Enter a note...', 'Nhập ghi chú...')}">
      </div>
    </form>
  `;

  document.getElementById('modal-footer').innerHTML = `
    <button class="btn btn-outline" onclick="closeModal()">${tr('Cancel', 'Hủy')}</button>
    <button class="btn btn-primary" id="confirm-edit-btn">${tr('Save Changes', 'Lưu Thay Đổi')}</button>
  `;

  const categorySelect = document.getElementById('edit-category');
  categories.forEach(category => {
    const option = document.createElement('option');
    option.value = category.id;
    option.textContent = `${category.icon} ${category.label}${category.active === false ? tr(' (removed)', ' (đã ẩn)') : ''}`;
    option.selected = category.id === tx.category;
    categorySelect.appendChild(option);
  });
  openModal(document.getElementById('edit-amount-display'));

  const displayInput = document.getElementById('edit-amount-display');
  const hiddenInput = document.getElementById('edit-amount');
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

  document.getElementById('confirm-edit-btn').onclick = () => {
    const amount = parseFloat(document.getElementById('edit-amount').value);
    const category = document.getElementById('edit-category').value;
    const date = document.getElementById('edit-date').value;
    const note = document.getElementById('edit-note').value.trim();

    if (!amount || amount <= 0) { showToast(tr('Invalid amount', 'Số tiền không hợp lệ'), 'error'); return; }
    const selectedCategory = getCat(category, tx.type);
    if (!selectedCategory || (selectedCategory.active === false && category !== tx.category)) {
      showToast(tr('Please select an active category', 'Vui lòng chọn danh mục đang hoạt động'), 'error');
      return;
    }

    const data = getData();
    const index = data.transactions.findIndex(t => t.id === id);
    if (index !== -1) {
      data.transactions[index] = {
        ...data.transactions[index],
        amount,
        category,
        date,
        note
      };
      data.transactions.sort((a, b) => b.date.localeCompare(a.date));
      saveData(data);
      closeModal();
      refreshCategoryControls();
      renderList();
      renderDashboard();
      showToast(tr('Transaction updated', 'Đã cập nhật giao dịch'), 'success');
    }
  };
}

function openModal(preferredFocus = null) {
  const modal = document.getElementById('delete-modal');
  if (!modal) return;
  if (!modal.classList.contains('open')) _modalReturnFocus = document.activeElement;
  modal.classList.add('open');
  const main = document.getElementById('main');
  const sidebar = document.getElementById('sidebar');
  if (main) main.inert = true;
  if (sidebar) sidebar.inert = true;
  requestAnimationFrame(() => preferredFocus?.focus());
}

function closeModal() {
  const modal = document.getElementById('delete-modal');
  if (!modal) return;
  modal.classList.remove('open');
  const main = document.getElementById('main');
  const sidebar = document.getElementById('sidebar');
  if (main) main.inert = false;
  if (sidebar) sidebar.inert = false;
  const returnTarget = _modalReturnFocus;
  _modalReturnFocus = null;
  requestAnimationFrame(() => {
    const target = returnTarget?.isConnected
      ? returnTarget
      : document.querySelector('.page.active .category-manager-summary, .page.active button, .topbar button');
    target?.focus();
  });
}
