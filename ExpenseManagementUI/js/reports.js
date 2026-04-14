// ===== REPORTS =====
let reportPieChart = null;

const Reports = {
  init() {
    document.getElementById('report-month').value = currentMonth();
    document.getElementById('btn-load-report').onclick = Reports.load;
    Reports.load();
  },

  async load() {
    const monthVal = document.getElementById('report-month').value; // "2026-04"
    if (!monthVal) return;
    const [year, month] = monthVal.split('-');
    const userId = Api.getUserId();

    // Category pie
    try {
      const catData = await Api.getCategoryReport(userId);
      Reports.renderPie(catData);
    } catch (e) { console.error(e); }

    // Monthly summary
    try {
      const data = await Api.getMonthlyReport(userId, month, parseInt(year));
      Reports.renderSummary(data);
    } catch (e) {
      document.getElementById('monthly-summary').innerHTML =
        '<div class="empty-state">No data for this month</div>';
    }
  },

  renderPie(catData) {
    const labels = Object.keys(catData);
    const values = Object.values(catData).map(v => parseFloat(v));
    if (!labels.length) return;

    const colors = ['#2563eb','#16a34a','#dc2626','#f59e0b','#8b5cf6','#06b6d4','#ec4899','#84cc16'];
    const ctx = document.getElementById('report-pie').getContext('2d');
    if (reportPieChart) reportPieChart.destroy();
    reportPieChart = new Chart(ctx, {
      type: 'pie',
      data: {
        labels,
        datasets: [{ data: values, backgroundColor: colors, borderWidth: 2, borderColor: '#fff' }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { position: 'bottom', labels: { font: { size: 12 }, padding: 10 } }
        }
      }
    });
  },

  renderSummary(data) {
    const el = document.getElementById('monthly-summary');
    const txs = data.transactions || [];
    if (!txs.length) {
      el.innerHTML = '<div class="empty-state">No expenses this month</div>';
      return;
    }
    el.innerHTML = `
      <div class="monthly-row" style="font-weight:600">
        <span>Total Expenses</span><span style="color:var(--red)">${fmt(data.totalExpense)}</span>
      </div>
      ${txs.map(tx => `
        <div class="monthly-row">
          <span>${tx.category?.name || 'Uncategorized'} — ${tx.date}</span>
          <span>${fmt(tx.amount)}</span>
        </div>`).join('')}`;
  },
};
