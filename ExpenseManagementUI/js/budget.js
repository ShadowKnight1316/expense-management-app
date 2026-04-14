// ===== BUDGET =====
const Budget = {
  init() {
    document.getElementById('budget-month').value = currentMonth();
    document.getElementById('budget-form').onsubmit = Budget.handleSet;
    Budget.loadStatus(currentMonth());
  },

  async handleSet(e) {
    e.preventDefault();
    const month = document.getElementById('budget-month').value;
    const amount = parseFloat(document.getElementById('budget-amount').value);
    try {
      await Api.setBudget({ userId: Api.getUserId(), month, amount });
      Budget.loadStatus(month);
    } catch (err) { alert('Error: ' + err.message); }
  },

  async loadStatus(month) {
    const el = document.getElementById('budget-status');
    try {
      const data = await Api.getBudget(Api.getUserId(), month);
      const pct = Math.min(parseFloat(data.percentageUsed || 0), 100);
      const barClass = pct >= 100 ? 'danger' : pct >= 80 ? 'warning' : 'safe';
      const alertHtml = data.alert
        ? `<div class="budget-alert ${barClass}">${data.alert}</div>` : '';

      el.innerHTML = `
        <div class="budget-row">
          <span>Budget</span><span>${fmt(data.budget)}</span>
        </div>
        <div class="budget-row">
          <span>Spent</span><span style="color:var(--red)">${fmt(data.spent)}</span>
        </div>
        <div class="budget-row">
          <span>Remaining</span><span style="color:var(--green)">${fmt(data.remaining)}</span>
        </div>
        <div class="progress-bar-wrap">
          <div class="progress-bar ${barClass}" style="width:${pct}%"></div>
        </div>
        <div style="text-align:right;font-size:12px;color:var(--gray-400)">${pct.toFixed(1)}% used</div>
        ${alertHtml}`;
    } catch (e) {
      el.innerHTML = '<div class="empty-state">No budget set for this month</div>';
    }
  },
};
