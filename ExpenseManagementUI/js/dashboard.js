// ===== DASHBOARD =====
let pieChart = null;

const Dashboard = {
  async load() {
    const userId = Api.getUserId();
    try {
      const data = await Api.getDashboard(userId);
      document.getElementById('dash-balance').textContent = fmt(data.totalBalance);
      document.getElementById('dash-income').textContent = fmt(data.totalIncome);
      document.getElementById('dash-expense').textContent = fmt(data.totalExpense);
      Dashboard.renderRecent(data.recentTransactions || []);
    } catch (e) {
      console.error('Dashboard load error', e);
    }

    // Load category chart
    try {
      const catData = await Api.getCategoryReport(userId);
      Dashboard.renderPie(catData);
    } catch (e) { /* no data yet */ }

    // Show username
    try {
      const user = await Api.getUser(userId);
      document.getElementById('dash-username').textContent = `Hi, ${user.name} 👋`;
    } catch (e) {}
  },

  renderRecent(transactions) {
    const el = document.getElementById('recent-list');
    if (!transactions.length) {
      el.innerHTML = '<div class="empty-state">No transactions yet</div>';
      return;
    }
    el.innerHTML = transactions.slice(0, 10).map(tx => Dashboard.txHtml(tx)).join('');
  },

  txHtml(tx) {
    const isExpense = tx.expenseId !== undefined;
    const cls = isExpense ? 'expense-item' : 'income-item';
    const icon = isExpense ? '💸' : '💰';
    const sign = isExpense ? '-' : '+';
    const label = isExpense
      ? (tx.category?.name || 'Expense')
      : (tx.source || 'Income');
    const desc = tx.description || tx.notes || '';
    return `
      <div class="transaction-item ${cls}">
        <div class="tx-left">
          <div class="tx-icon">${icon}</div>
          <div>
            <div class="tx-title">${label}</div>
            <div class="tx-sub">${desc || tx.paymentMode || ''}</div>
          </div>
        </div>
        <div class="tx-right">
          <div class="tx-amount">${sign}${fmt(tx.amount)}</div>
          <div class="tx-date">${tx.date || ''}</div>
        </div>
      </div>`;
  },

  renderPie(catData) {
    const labels = Object.keys(catData);
    const values = Object.values(catData).map(v => parseFloat(v));
    if (!labels.length) return;

    const colors = ['#2563eb','#16a34a','#dc2626','#f59e0b','#8b5cf6','#06b6d4','#ec4899','#84cc16'];
    const ctx = document.getElementById('pie-chart').getContext('2d');
    if (pieChart) pieChart.destroy();
    pieChart = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels,
        datasets: [{ data: values, backgroundColor: colors, borderWidth: 2, borderColor: '#fff' }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { position: 'bottom', labels: { font: { size: 12 }, padding: 12 } }
        }
      }
    });
  },
};
