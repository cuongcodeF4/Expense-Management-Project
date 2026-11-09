// ═══════════════════════════════════════════════
//  CATEGORIES — Registry, migration and management
// ═══════════════════════════════════════════════

const CATEGORY_TYPES = ['income', 'expense'];
const CATEGORY_SCHEMA_VERSION = 2;
const MAX_CATEGORIES_PER_TYPE = 100;
const MAX_STORED_CATEGORIES_PER_TYPE = 250;

const DEFAULT_CATEGORIES = {
  income: [
    { id: 'luong',     label: 'Salary',        icon: '💼' },
    { id: 'thuong',    label: 'Bonus',         icon: '🎁' },
    { id: 'dautư',     label: 'Investment',    icon: '📈' },
    { id: 'kinhdoanh', label: 'Business',      icon: '🏪' },
    { id: 'khac_thu',  label: 'Other',         icon: '💰' },
  ],
  expense: [
    { id: 'anuong',    label: 'Food',          icon: '🍜' },
    { id: 'dichuyên',  label: 'Transport',     icon: '🚗' },
    { id: 'nhao',      label: 'Housing',       icon: '🏠' },
    { id: 'giaitri',   label: 'Entertainment', icon: '🎮' },
    { id: 'suckhoe',   label: 'Healthcare',    icon: '🏥' },
    { id: 'muasam',    label: 'Shopping',      icon: '🛒' },
    { id: 'giaoduc',   label: 'Education',     icon: '📚' },
    { id: 'thethao',   label: 'Sport',         icon: '⚽' },
    { id: 'banhuu',    label: 'Friends',       icon: '👫' },
    { id: 'huongthu',  label: 'Enjoy',         icon: '🎉' },
    { id: 'khac_chi',  label: 'Other',         icon: '💸' },
  ]
};

const DEFAULT_INVESTMENTS = [
  { id: 'gold',            name: 'Gold',              icon: '🪙', color: '#F59E0B' },
  { id: 'btc',             name: 'Bitcoin (BTC)',     icon: '₿',  color: '#FB923C' },
  { id: 'mutual_fund',     name: 'Mutual Fund / ETF', icon: '📊', color: '#00E599' },
  { id: 'stocks',          name: 'Stocks',            icon: '📈', color: '#22D3EE' },
  { id: 'savings_deposit', name: 'Term Deposit',      icon: '🏦', color: '#A855F7' },
  { id: 'real_estate',     name: 'Real Estate',       icon: '🏢', color: '#EC4899' }
];

const BUILTIN_CATEGORY_LABELS_VI = {
  luong: 'Lương',
  thuong: 'Thưởng',
  'dautư': 'Đầu tư',
  kinhdoanh: 'Kinh doanh',
  khac_thu: 'Khác',
  anuong: 'Ăn uống',
  'dichuyên': 'Di chuyển',
  nhao: 'Nhà ở',
  giaitri: 'Giải trí',
  suckhoe: 'Sức khỏe',
  muasam: 'Mua sắm',
  giaoduc: 'Giáo dục',
  thethao: 'Thể thao',
  banhuu: 'Bạn bè',
  huongthu: 'Hưởng thụ',
  khac_chi: 'Khác'
};

const BUILTIN_INVESTMENT_NAMES_VI = {
  gold: 'Vàng',
  btc: 'Bitcoin (BTC)',
  mutual_fund: 'Quỹ mở / ETF',
  stocks: 'Cổ phiếu',
  savings_deposit: 'Tiết kiệm kỳ hạn',
  real_estate: 'Bất động sản'
};

function getLocalizedCategoryLabel(category) {
  if (!category) return '';
  if (typeof isVi === 'function' && isVi() && Object.prototype.hasOwnProperty.call(BUILTIN_CATEGORY_LABELS_VI, category.id)) {
    return BUILTIN_CATEGORY_LABELS_VI[category.id];
  }
  return category.label;
}

function getAssetDisplayName(asset) {
  if (!asset) return '';
  if (typeof isVi === 'function' && isVi() && Object.prototype.hasOwnProperty.call(BUILTIN_INVESTMENT_NAMES_VI, asset.id)) {
    return BUILTIN_INVESTMENT_NAMES_VI[asset.id];
  }
  return asset.name || '';
}

function cloneDefaultInvestments() {
  return DEFAULT_INVESTMENTS.map((item, idx) => ({
    id: item.id,
    name: item.name,
    icon: item.icon,
    color: item.color,
    initialAmount: 0,
    currentAmount: 0,
    monthlyHistory: {},
    order: idx
  }));
}

function normalizeInvestments(rawInvestments) {
  if (!Array.isArray(rawInvestments)) {
    return cloneDefaultInvestments();
  }
  const palette = ['#00E599', '#22D3EE', '#F59E0B', '#FB923C', '#A855F7', '#EC4899', '#38BDF8', '#10B981', '#F43F5E', '#14B8A6'];
  const seen = new Set();
  const list = [];

  rawInvestments.slice(0, 100).forEach((raw, idx) => {
    if (!raw || typeof raw !== 'object') return;
    const id = String(raw.id || '').trim();
    if (!isSafeCategoryId(id) || seen.has(id)) return;
    seen.add(id);

    const name = String(raw.name || id).trim().slice(0, 50) || id.slice(0, 50);
    const iconChars = Array.from(String(raw.icon || '💎').trim());
    const icon = iconChars.length ? iconChars.slice(0, 8).join('') : '💎';
    const color = /^#[0-9A-Fa-f]{6}$/.test(String(raw.color || ''))
      ? String(raw.color)
      : palette[idx % palette.length];

    const initialAmount = Math.max(0, Number.isFinite(Number(raw.initialAmount)) ? Math.round(Number(raw.initialAmount)) : 0);
    const currentAmount = Math.max(0, Number.isFinite(Number(raw.currentAmount)) ? Math.round(Number(raw.currentAmount)) : 0);

    const monthlyHistory = {};
    if (raw.monthlyHistory && typeof raw.monthlyHistory === 'object' && !Array.isArray(raw.monthlyHistory)) {
      Object.entries(raw.monthlyHistory).forEach(([ym, entry]) => {
        if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(String(ym || ''))) return;
        if (entry && typeof entry === 'object' && !Array.isArray(entry)) {
          const cur = Math.max(0, Number.isFinite(Number(entry.current)) ? Math.round(Number(entry.current)) : 0);
          const inv = Number.isFinite(Number(entry.invested)) && Number(entry.invested) >= 0
            ? Math.round(Number(entry.invested))
            : null;
          monthlyHistory[ym] = inv !== null ? { current: cur, invested: inv } : { current: cur };
        } else if (Number.isFinite(Number(entry)) && Number(entry) >= 0) {
          monthlyHistory[ym] = { current: Math.round(Number(entry)) };
        }
      });
    }

    list.push({
      id,
      name,
      icon,
      color,
      initialAmount,
      currentAmount,
      monthlyHistory,
      order: Number.isFinite(Number(raw.order)) ? Number(raw.order) : idx
    });
  });

  return list;
}

function cloneDefaultCategories() {
  const categories = { income: [], expense: [] };
  CATEGORY_TYPES.forEach(type => {
    categories[type] = DEFAULT_CATEGORIES[type].map((cat, order) => ({
      ...cat,
      active: true,
      builtIn: true,
      order,
      createdAt: null,
      archivedAt: null
    }));
  });
  return categories;
}

function createEmptyAppData() {
  return {
    schemaVersion: CATEGORY_SCHEMA_VERSION,
    transactions: [],
    budgets: {},
    monthlyBudgets: {},
    categories: cloneDefaultCategories(),
    investments: cloneDefaultInvestments(),
    nextId: 1
  };
}

function createCategoryId() {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return 'cat_' + crypto.randomUUID().replace(/-/g, '_');
  }
  return `cat_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}

function isSafeCategoryId(value) {
  const id = String(value || '');
  return !['__proto__', 'prototype', 'constructor'].includes(id)
    && /^[\p{L}\p{N}_-]{1,128}$/u.test(id);
}

function isValidIsoDate(value) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(value || ''));
  if (!match) return false;
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const date = new Date(Date.UTC(year, month - 1, day));
  return date.getUTCFullYear() === year
    && date.getUTCMonth() === month - 1
    && date.getUTCDate() === day;
}

function normalizeTransactions(rawTransactions) {
  const source = Array.isArray(rawTransactions) ? rawTransactions : [];
  const validIds = source
    .map(transaction => Number(transaction && transaction.id))
    .filter(id => Number.isSafeInteger(id) && id > 0);
  let generatedId = validIds.reduce((max, id) => Math.max(max, id), 0) + 1;
  const usedIds = new Set();
  const normalized = [];

  source.forEach(raw => {
    if (!raw || typeof raw !== 'object' || !CATEGORY_TYPES.includes(raw.type)) return;
    const category = String(raw.category || '').trim();
    const amount = Number(raw.amount);
    const date = String(raw.date || '').trim();
    if (!isSafeCategoryId(category) || !Number.isFinite(amount) || amount <= 0 || !isValidIsoDate(date)) return;

    let id = Number(raw.id);
    if (!Number.isSafeInteger(id) || id <= 0 || usedIds.has(id)) {
      while (usedIds.has(generatedId)) generatedId++;
      id = generatedId++;
    }
    usedIds.add(id);

    const transaction = {
      ...raw,
      id,
      type: raw.type,
      category,
      amount,
      date,
      note: String(raw.note || '').slice(0, 200)
    };
    normalized.push(transaction);
  });
  return normalized.sort((a, b) => b.date.localeCompare(a.date));
}

function normalizeBudgets(rawBudgets) {
  const source = rawBudgets && typeof rawBudgets === 'object' && !Array.isArray(rawBudgets)
    ? rawBudgets
    : {};
  const normalized = {};
  Object.entries(source).forEach(([id, rawAmount]) => {
    const amount = Number(rawAmount);
    if (isSafeCategoryId(id) && Number.isFinite(amount) && amount >= 0) normalized[id] = amount;
  });
  return normalized;
}

function normalizeMonthlyBudgets(rawMonthly) {
  const source = rawMonthly && typeof rawMonthly === 'object' && !Array.isArray(rawMonthly)
    ? rawMonthly
    : {};
  const normalized = {};
  Object.entries(source).forEach(([ym, monthMap]) => {
    if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(String(ym || ''))) return;
    if (!monthMap || typeof monthMap !== 'object' || Array.isArray(monthMap)) return;
    const cleanMap = normalizeBudgets(monthMap);
    if (Object.keys(cleanMap).length > 0) normalized[ym] = cleanMap;
  });
  return normalized;
}

function normalizeCategoryEntry(raw, type, order) {
  if (!raw || typeof raw !== 'object') return null;
  const id = String(raw.id || '').trim();
  if (!isSafeCategoryId(id)) return null;

  const label = String(raw.label || id).trim().slice(0, 40) || id.slice(0, 40);
  const iconChars = Array.from(String(raw.icon || '📌').trim());
  const icon = (iconChars.length ? iconChars.slice(0, 8).join('') : '📌');

  return {
    id,
    label,
    icon,
    active: raw.active !== false && raw.archived !== true,
    builtIn: raw.builtIn === true || DEFAULT_CATEGORIES[type].some(cat => cat.id === id),
    order: Number.isFinite(Number(raw.order)) ? Number(raw.order) : order,
    createdAt: typeof raw.createdAt === 'string' ? raw.createdAt : null,
    archivedAt: typeof raw.archivedAt === 'string' ? raw.archivedAt : null
  };
}

function normalizeAppData(raw) {
  const data = raw && typeof raw === 'object' && !Array.isArray(raw) ? raw : {};
  data.transactions = normalizeTransactions(data.transactions);
  data.budgets = normalizeBudgets(data.budgets);
  data.monthlyBudgets = normalizeMonthlyBudgets(data.monthlyBudgets);

  const hasRegistry = data.categories && typeof data.categories === 'object' && !Array.isArray(data.categories);
  const defaults = cloneDefaultCategories();
  const normalized = { income: [], expense: [] };
  const seenIds = new Set();

  CATEGORY_TYPES.forEach(type => {
    const source = hasRegistry && Array.isArray(data.categories[type])
      ? data.categories[type]
      : defaults[type];

    source.slice(0, MAX_STORED_CATEGORIES_PER_TYPE).forEach((rawCategory, order) => {
      const category = normalizeCategoryEntry(rawCategory, type, order);
      if (!category || seenIds.has(category.id)) return;
      seenIds.add(category.id);
      normalized[type].push(category);
    });
  });

  // Preserve orphaned imported/history references instead of silently reassigning them.
  data.transactions.forEach(transaction => {
    if (!transaction || !CATEGORY_TYPES.includes(transaction.type)) return;
    const id = String(transaction.category || '').trim();
    if (!id || seenIds.has(id)) return;
    seenIds.add(id);
    normalized[transaction.type].push({
      id,
      label: String(transaction.categoryLabel || id).slice(0, 40),
      icon: String(transaction.categoryIcon || '📌').slice(0, 16),
      active: false,
      builtIn: false,
      order: normalized[transaction.type].length,
      createdAt: null,
      archivedAt: null
    });
  });

  // Keep budget-only legacy references recoverable in exports and the restore list.
  const budgetReferencedIds = new Set([
    ...Object.keys(data.budgets),
    ...Object.values(data.monthlyBudgets).flatMap(m => Object.keys(m))
  ]);
  budgetReferencedIds.forEach(id => {
    if (seenIds.has(id)) return;
    seenIds.add(id);
    normalized.expense.push({
      id,
      label: id.slice(0, 40),
      icon: '📌',
      active: false,
      builtIn: false,
      order: normalized.expense.length,
      createdAt: null,
      archivedAt: null
    });
  });

  data.categories = normalized;
  data.investments = normalizeInvestments(data.investments);
  data.schemaVersion = CATEGORY_SCHEMA_VERSION;

  const maxId = data.transactions.reduce((max, transaction) => Math.max(max, transaction.id), 0);
  const currentNextId = Number(data.nextId);
  data.nextId = Number.isSafeInteger(currentNextId) && currentNextId > maxId
    ? currentNextId
    : maxId + 1;

  return data;
}

function getCategoryRegistry() {
  const data = window._appData;
  if (data && data.categories) return data.categories;
  return cloneDefaultCategories();
}

function getCategories(type, options = {}) {
  if (!CATEGORY_TYPES.includes(type)) return [];
  const includeInactive = options.includeInactive === true;
  const list = getCategoryRegistry()[type] || [];
  return list
    .filter(category => includeInactive || category.active !== false)
    .map(category => ({ ...category, label: getLocalizedCategoryLabel(category) }))
    .sort((a, b) => (a.order || 0) - (b.order || 0));
}

function getAllCategories(options = {}) {
  return CATEGORY_TYPES.flatMap(type => getCategories(type, options));
}

function getCat(id, type = null) {
  const types = CATEGORY_TYPES.includes(type) ? [type] : CATEGORY_TYPES;
  for (const categoryType of types) {
    const category = getCategories(categoryType, { includeInactive: true })
      .find(item => item.id === id);
    if (category) return category;
  }
  return { id, label: String(id || (typeof tr === 'function' ? tr('Unknown', 'Không rõ') : 'Unknown')), icon: '📌', active: false };
}

function escapeHtml(value) {
  return String(value == null ? '' : value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function categoryHtml(category, includeRemoved = false) {
  const removedLbl = typeof tr === 'function' ? tr('(removed)', '(đã ẩn)') : '(removed)';
  const suffix = includeRemoved && category.active === false ? ` <span class="category-removed-label">${removedLbl}</span>` : '';
  return `${escapeHtml(category.icon)} ${escapeHtml(category.label)}${suffix}`;
}

function refreshCategoryControls() {
  if (typeof updateCategorySelect === 'function') updateCategorySelect();
  updateCategoryFilter();
  renderCategoryManager();
}

function updateCategoryFilter() {
  const select = document.getElementById('filter-category');
  if (!select) return;

  const selected = select.value;
  const usedIds = new Set((window._appData?.transactions || []).map(transaction => transaction.category));
  const allCatLbl = typeof tr === 'function' ? tr('All categories', 'Tất cả danh mục') : 'All categories';
  const removedLbl = typeof tr === 'function' ? tr(' (removed)', ' (đã ẩn)') : ' (removed)';
  select.innerHTML = `<option value="">${allCatLbl}</option>`;

  CATEGORY_TYPES.forEach(type => {
    const categories = getCategories(type, { includeInactive: true })
      .filter(category => category.active !== false || usedIds.has(category.id));
    if (categories.length === 0) return;

    const group = document.createElement('optgroup');
    group.label = type === 'income'
      ? (typeof tr === 'function' ? tr('Income', 'Thu nhập') : 'Income')
      : (typeof tr === 'function' ? tr('Expense', 'Chi tiêu') : 'Expense');
    categories.forEach(category => {
      const option = document.createElement('option');
      option.value = category.id;
      option.textContent = `${category.icon} ${category.label}${category.active === false ? removedLbl : ''}`;
      group.appendChild(option);
    });
    select.appendChild(group);
  });

  if ([...select.options].some(option => option.value === selected)) select.value = selected;
}

function setCategoryFormError(message) {
  const error = document.getElementById('category-form-error');
  if (error) error.textContent = message || '';
}

function addCategory(event) {
  event.preventDefault();
  const typeInput = document.getElementById('category-type');
  const nameInput = document.getElementById('category-name');
  const iconInput = document.getElementById('category-icon');
  const type = typeInput ? typeInput.value : '';
  const label = nameInput ? nameInput.value.trim() : '';
  const icon = iconInput ? iconInput.value.trim() : '';

  setCategoryFormError('');
  if (!CATEGORY_TYPES.includes(type)) {
    setCategoryFormError('Please choose a valid category type.');
    return;
  }
  if (!label) {
    setCategoryFormError('Category name is required.');
    nameInput?.focus();
    return;
  }
  if (Array.from(label).length > 40) {
    setCategoryFormError('Category name must be 40 characters or fewer.');
    nameInput?.focus();
    return;
  }
  if (icon && Array.from(icon).length > 8) {
    setCategoryFormError('Icon must be a short emoji or symbol.');
    iconInput?.focus();
    return;
  }

  const data = normalizeAppData(getData());
  const categories = data.categories[type];
  const matching = categories.find(category => category.label.toLocaleLowerCase() === label.toLocaleLowerCase());
  if (matching && matching.active !== false) {
    setCategoryFormError('An active category with this name already exists.');
    nameInput?.focus();
    return;
  }
  if (categories.filter(category => category.active !== false).length >= MAX_CATEGORIES_PER_TYPE) {
    setCategoryFormError(`You can have up to ${MAX_CATEGORIES_PER_TYPE} active ${type} categories.`);
    return;
  }
  if (!matching && categories.length >= MAX_STORED_CATEGORIES_PER_TYPE) {
    setCategoryFormError('Too many removed categories. Restore an existing category instead.');
    return;
  }

  let category;
  let restored = false;
  if (matching) {
    category = matching;
    category.active = true;
    category.archivedAt = null;
    if (icon) category.icon = icon;
    restored = true;
  } else {
    category = {
      id: createCategoryId(),
      label,
      icon: icon || (type === 'income' ? '💰' : '📌'),
      active: true,
      builtIn: false,
      order: categories.length,
      createdAt: new Date().toISOString(),
      archivedAt: null
    };
    categories.push(category);
  }

  saveData(data, { immediate: true });
  refreshAllUI();
  if (nameInput) nameInput.value = '';
  if (iconInput) iconInput.value = '';
  showToast(restored
    ? (typeof tr === 'function' ? tr('Category restored', 'Đã khôi phục danh mục') : 'Category restored')
    : (typeof tr === 'function' ? tr('Category added', 'Đã thêm danh mục') : 'Category added'), 'success');

  if (type === 'expense') {
    requestAnimationFrame(() => {
      const item = [...document.querySelectorAll('.budget-item')]
        .find(element => element.dataset.categoryId === category.id);
      item?.querySelector('.budget-input')?.focus();
    });
  }
}

function requestRemoveCategory(type, id) {
  const category = getCategories(type, { includeInactive: true }).find(item => item.id === id);
  if (!category || category.active === false) return;

  const data = getData();
  const transactionCount = data.transactions.filter(transaction => transaction.category === id).length;
  const hasBudget = type === 'expense' && Number(data.budgets?.[id]) > 0;
  const modal = document.getElementById('delete-modal');
  const title = document.getElementById('modal-title');
  const body = document.getElementById('modal-body');
  const footer = document.getElementById('modal-footer');
  if (!modal || !title || !body || !footer) return;

  title.textContent = typeof tr === 'function' ? tr('Remove Category', 'Ẩn Danh Mục') : 'Remove Category';
  body.innerHTML = '';
  const message = document.createElement('p');
  message.className = 'modal-message';
  message.textContent = typeof isVi === 'function' && isVi()
    ? `Ẩn danh mục “${category.label}”? Danh mục này sẽ không xuất hiện khi tạo giao dịch mới${type === 'expense' ? ' hoặc ngân sách' : ''}.`
    : `Remove “${category.label}”? It will no longer be available for new transactions${type === 'expense' ? ' or budgets' : ''}.`;
  body.appendChild(message);

  const detail = document.createElement('p');
  detail.className = 'modal-detail';
  if (typeof isVi === 'function' && isVi()) {
    const txText = transactionCount
      ? `${transactionCount} giao dịch hiện có vẫn giữ nguyên danh mục này trong báo cáo.`
      : 'Bạn có thể khôi phục lại danh mục này bất kỳ lúc nào.';
    detail.textContent = txText + (hasBudget ? ' Ngân sách đã lưu sẽ được giữ nguyên khi khôi phục.' : '');
  } else {
    const transactionText = transactionCount
      ? `${transactionCount} existing transaction${transactionCount === 1 ? '' : 's'} will keep this category and remain in reports.`
      : 'You can restore this category later.';
    detail.textContent = transactionText + (hasBudget ? ' Its saved budget will be kept and restored with the category.' : '');
  }
  body.appendChild(detail);

  footer.innerHTML = '';
  const cancelButton = document.createElement('button');
  cancelButton.type = 'button';
  cancelButton.className = 'btn btn-outline';
  cancelButton.textContent = typeof tr === 'function' ? tr('Cancel', 'Hủy') : 'Cancel';
  cancelButton.addEventListener('click', closeModal);
  const removeButton = document.createElement('button');
  removeButton.type = 'button';
  removeButton.className = 'btn btn-danger';
  removeButton.textContent = typeof tr === 'function' ? tr('Remove category', 'Ẩn danh mục') : 'Remove category';
  removeButton.addEventListener('click', () => removeCategory(type, id));
  footer.append(cancelButton, removeButton);

  openModal(cancelButton);
}

function removeCategory(type, id) {
  const data = normalizeAppData(getData());
  const category = data.categories[type]?.find(item => item.id === id);
  if (!category) return;
  category.active = false;
  category.archivedAt = new Date().toISOString();
  saveData(data, { immediate: true });
  closeModal();
  refreshAllUI();
  showToast(typeof tr === 'function' ? tr('Category removed', 'Đã ẩn danh mục') : 'Category removed', 'info');
}

function restoreCategory(type, id) {
  const data = normalizeAppData(getData());
  const category = data.categories[type]?.find(item => item.id === id);
  if (!category) return;
  const activeCount = data.categories[type].filter(item => item.active !== false).length;
  if (activeCount >= MAX_CATEGORIES_PER_TYPE) {
    showToast(`You can have up to ${MAX_CATEGORIES_PER_TYPE} active ${type} categories`, 'error');
    return;
  }
  category.active = true;
  category.archivedAt = null;
  saveData(data, { immediate: true });
  refreshAllUI();
  showToast(typeof tr === 'function' ? tr('Category restored', 'Đã khôi phục danh mục') : 'Category restored', 'success');
}

function renderCategoryManager() {
  const container = document.getElementById('category-manager-list');
  if (!container) return;
  const openRemovedTypes = new Set(
    [...container.querySelectorAll('.removed-categories[open]')].map(details => details.dataset.type)
  );
  container.innerHTML = '';

  CATEGORY_TYPES.forEach(type => {
    const all = getCategories(type, { includeInactive: true });
    const active = all.filter(category => category.active !== false);
    const inactive = all.filter(category => category.active === false);
    const section = document.createElement('section');
    section.className = 'category-group';

    const heading = document.createElement('div');
    heading.className = 'category-group-heading';
    const title = document.createElement('h3');
    title.textContent = type === 'income'
      ? (typeof tr === 'function' ? tr('Income', 'Thu nhập') : 'Income')
      : (typeof tr === 'function' ? tr('Expense', 'Chi tiêu') : 'Expense');
    const count = document.createElement('span');
    count.textContent = typeof isVi === 'function' && isVi()
      ? `${active.length} đang dùng`
      : `${active.length} active`;
    heading.append(title, count);
    section.appendChild(heading);

    const list = document.createElement('div');
    list.className = 'category-list';
    if (active.length === 0) {
      const empty = document.createElement('p');
      empty.className = 'category-empty';
      empty.textContent = typeof isVi === 'function' && isVi()
        ? 'Chưa có danh mục đang hoạt động.'
        : `No active ${type} categories.`;
      list.appendChild(empty);
    } else {
      active.forEach(category => list.appendChild(buildCategoryRow(category, type, false)));
    }
    section.appendChild(list);

    if (inactive.length > 0) {
      const removed = document.createElement('details');
      removed.className = 'removed-categories';
      removed.dataset.type = type;
      removed.open = openRemovedTypes.has(type);
      const summary = document.createElement('summary');
      summary.textContent = typeof isVi === 'function' && isVi()
        ? `Đã ẩn (${inactive.length})`
        : `Removed (${inactive.length})`;
      removed.appendChild(summary);
      const removedList = document.createElement('div');
      removedList.className = 'category-list removed-category-list';
      inactive.forEach(category => removedList.appendChild(buildCategoryRow(category, type, true)));
      removed.appendChild(removedList);
      section.appendChild(removed);
    }

    container.appendChild(section);
  });
}

function buildCategoryRow(category, type, inactive) {
  const row = document.createElement('div');
  row.className = `category-row${inactive ? ' inactive' : ''}`;

  const identity = document.createElement('div');
  identity.className = 'category-identity';
  const icon = document.createElement('span');
  icon.className = 'category-icon';
  icon.textContent = category.icon;
  const label = document.createElement('span');
  label.className = 'category-name';
  label.textContent = category.label;
  identity.append(icon, label);

  const button = document.createElement('button');
  button.type = 'button';
  if (inactive) {
    button.className = 'category-restore-btn';
    button.textContent = typeof tr === 'function' ? tr('Restore', 'Khôi phục') : 'Restore';
    button.setAttribute('aria-label', `Restore category ${category.label}`);
    button.addEventListener('click', () => restoreCategory(type, category.id));
  } else {
    button.className = 'category-remove-btn';
    button.textContent = '×';
    button.setAttribute('aria-label', `Remove category ${category.label}`);
    button.addEventListener('click', () => requestRemoveCategory(type, category.id));
  }

  row.append(identity, button);
  return row;
}

function ensureActiveFallbackCategory(data, type) {
  normalizeAppData(data);
  const preferredId = type === 'income' ? 'khac_thu' : 'khac_chi';
  const categories = data.categories[type];
  const active = categories.filter(category => category.active !== false);
  const preferred = active.find(category => category.id === preferredId)
    || active.find(category => category.label.toLocaleLowerCase() === 'other');
  if (preferred) return preferred.id;

  const archivedPreferred = categories.find(category => category.id === preferredId)
    || categories.find(category => category.active === false && category.label.toLocaleLowerCase() === 'other');
  if (archivedPreferred) {
    archivedPreferred.active = true;
    archivedPreferred.archivedAt = null;
    return archivedPreferred.id;
  }

  const fallback = {
    id: createCategoryId(),
    label: 'Other',
    icon: type === 'income' ? '💰' : '💸',
    active: true,
    builtIn: false,
    order: categories.length,
    createdAt: new Date().toISOString(),
    archivedAt: null
  };
  categories.push(fallback);
  return fallback.id;
}
