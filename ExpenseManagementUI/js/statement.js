// ===== BANK STATEMENT =====
let _stmtData = null;

const Statement = {
  init() {
    const fileInput = document.getElementById('stmt-file-input');
    const uploadZone = document.getElementById('upload-zone');

    // File input change
    fileInput.addEventListener('change', () => {
      if (fileInput.files[0]) Statement.onFileSelected(fileInput.files[0]);
    });

    // Drag & drop
    uploadZone.addEventListener('dragover', (e) => {
      e.preventDefault();
      uploadZone.classList.add('drag-over');
    });
    uploadZone.addEventListener('dragleave', () => uploadZone.classList.remove('drag-over'));
    uploadZone.addEventListener('drop', (e) => {
      e.preventDefault();
      uploadZone.classList.remove('drag-over');
      const file = e.dataTransfer.files[0];
      if (file) Statement.onFileSelected(file);
    });

    document.getElementById('btn-stmt-preview').onclick = () => Statement.process(false);
    document.getElementById('btn-stmt-import').onclick  = () => Statement.process(true);
    document.getElementById('btn-download-sample').onclick = Statement.downloadSample;

    // Filters
    document.getElementById('stmt-filter-type').onchange = Statement.renderEntries;
    document.getElementById('stmt-filter-cat').onchange  = Statement.renderEntries;
  },

  onFileSelected(file) {
    const allowed = ['text/csv', 'application/pdf', 'application/vnd.ms-excel'];
    const ext = file.name.split('.').pop().toLowerCase();
    if (!['csv', 'pdf'].includes(ext)) {
      alert('Please upload a CSV or PDF file.');
      return;
    }
    const nameEl = document.getElementById('stmt-file-name');
    const icon = ext === 'pdf' ? '📄' : '📊';
    nameEl.textContent = `${icon} ${file.name} (${(file.size / 1024).toFixed(1)} KB)`;
    nameEl.classList.remove('hidden');
    // Show password field only for PDFs
    const pwRow = document.getElementById('stmt-password-row');
    if (ext === 'pdf') pwRow.classList.remove('hidden');
    else { pwRow.classList.add('hidden'); document.getElementById('stmt-pdf-password').value = ''; }
    document.getElementById('stmt-actions').classList.remove('hidden');
    document.getElementById('stmt-report').classList.add('hidden');
    _stmtData = null;
  },

  async process(save) {
    const fileInput = document.getElementById('stmt-file-input');
    if (!fileInput.files[0]) { alert('Please select a file first.'); return; }

    const loading = document.getElementById('stmt-loading');
    const report  = document.getElementById('stmt-report');
    loading.classList.remove('hidden');
    report.classList.add('hidden');

    const btn = save
      ? document.getElementById('btn-stmt-import')
      : document.getElementById('btn-stmt-preview');
    btn.disabled = true;

    try {
      const formData = new FormData();
      formData.append('file', fileInput.files[0]);
      formData.append('userId', Api.getUserId());

      const password = document.getElementById('stmt-pdf-password').value.trim();
      const endpoint = save ? '/statement/import' : '/statement/preview';
      const passwordParam = password ? `&password=${encodeURIComponent(password)}` : '';
      const res = await fetch(`http://localhost:8081/api/v1${endpoint}?userId=${Api.getUserId()}${passwordParam}`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${Api.getToken()}` },
        body: formData,
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Failed to process file');
      }

      _stmtData = await res.json();
      Statement.renderReport(save);

      if (save) {
        Dashboard.load();
        alert(`✅ ${_stmtData.totalEntries} transactions imported successfully!`);
      }
    } catch (e) {
      alert('Error: ' + e.message);
    } finally {
      loading.classList.add('hidden');
      btn.disabled = false;
    }
  },

  renderReport(imported) {
    if (!_stmtData) return;
    const d = _stmtData;

    // Summary cards
    document.getElementById('stmt-summary').innerHTML = `
      <div class="stmt-stat-card blue">
        <div class="stmt-stat-num">${d.totalEntries}</div>
        <div class="stmt-stat-label">Total Entries</div>
      </div>
      <div class="stmt-stat-card red">
        <div class="stmt-stat-num">${d.expenseCount}</div>
        <div class="stmt-stat-label">Expenses</div>
      </div>
      <div class="stmt-stat-card green">
        <div class="stmt-stat-num">${d.incomeCount}</div>
        <div class="stmt-stat-label">Income</div>
      </div>
      <div class="stmt-stat-card ${d.netBalance >= 0 ? 'green' : 'red'}">
        <div class="stmt-stat-num">${fmt(d.netBalance)}</div>
        <div class="stmt-stat-label">Net Balance</div>
      </div>
      <div class="stmt-stat-card red wide">
        <div class="stmt-stat-num">${fmt(d.totalExpense)}</div>
        <div class="stmt-stat-label">Total Expense</div>
      </div>
      <div class="stmt-stat-card green wide">
        <div class="stmt-stat-num">${fmt(d.totalIncome)}</div>
        <div class="stmt-stat-label">Total Income</div>
      </div>`;

    // Category breakdown
    const breakdown = d.categoryBreakdown || {};
    const sorted = Object.entries(breakdown).sort((a, b) => b[1] - a[1]);
    const maxVal = sorted.length ? sorted[0][1] : 1;
    document.getElementById('stmt-category-breakdown').innerHTML = sorted.length
      ? sorted.map(([cat, amt]) => `
          <div class="cat-bar-row">
            <div class="cat-bar-label">
              <span>${cat}</span><span>${fmt(amt)}</span>
            </div>
            <div class="cat-bar-track">
              <div class="cat-bar-fill" style="width:${Math.round((amt/maxVal)*100)}%"></div>
            </div>
          </div>`).join('')
      : '<div class="empty-state">No expense data</div>';

    // Populate category filter
    const catSel = document.getElementById('stmt-filter-cat');
    catSel.innerHTML = '<option value="">All Categories</option>' +
      sorted.map(([cat]) => `<option value="${cat}">${cat}</option>`).join('');

    // Status badge
    document.getElementById('stmt-entry-count').textContent =
      imported ? `${d.totalEntries} imported ✅` : `${d.totalEntries} detected (preview)`;

    Statement.renderEntries();
    document.getElementById('stmt-report').classList.remove('hidden');
  },

  renderEntries() {
    if (!_stmtData) return;
    const typeFilter = document.getElementById('stmt-filter-type').value;
    const catFilter  = document.getElementById('stmt-filter-cat').value;

    const filtered = _stmtData.entries.filter(e => {
      if (typeFilter && e.type !== typeFilter) return false;
      if (catFilter  && e.category !== catFilter) return false;
      return true;
    });

    const el = document.getElementById('stmt-entries-list');
    if (!filtered.length) {
      el.innerHTML = '<div class="empty-state">No entries match the filter</div>';
      return;
    }

    el.innerHTML = filtered.map(e => {
      const cls  = e.type === 'expense' ? 'expense-item' : 'income-item';
      const sign = e.type === 'expense' ? '-' : '+';
      const icon = e.type === 'expense' ? '💸' : '💰';
      return `
        <div class="transaction-item ${cls}">
          <div class="tx-left">
            <div class="tx-icon">${icon}</div>
            <div>
              <div class="tx-title">${e.description.substring(0, 45)}${e.description.length > 45 ? '…' : ''}</div>
              <div class="tx-sub">${e.category} · ${e.paymentMode}</div>
            </div>
          </div>
          <div class="tx-right">
            <div class="tx-amount">${sign}${fmt(e.amount)}</div>
            <div class="tx-date">${e.date}</div>
          </div>
        </div>`;
    }).join('');
  },

  downloadSample() {
    const csv = `Date,Description,Debit,Credit
01/04/2026,Swiggy Order,350,
02/04/2026,Salary Credit,,50000
03/04/2026,Uber Ride,180,
04/04/2026,Amazon Shopping,1200,
05/04/2026,Electricity Bill,800,
06/04/2026,Netflix Subscription,199,
07/04/2026,ATM Withdrawal,2000,
08/04/2026,Freelance Payment,,15000`;
    const blob = new Blob([csv], { type: 'text/csv' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'sample_bank_statement.csv';
    a.click();
  },
};
