// ===== INCOME =====
const Income = {
  openModal() {
    document.getElementById('inc-date').value = today();
    Modal.open('modal-income');
  },

  init() {
    document.getElementById('btn-add-income').onclick = Income.openModal;
    document.getElementById('income-form').onsubmit = Income.handleSubmit;
  },

  async handleSubmit(e) {
    e.preventDefault();
    const btn = e.target.querySelector('button[type=submit]');
    btn.disabled = true; btn.textContent = 'Saving...';

    try {
      await Api.addIncome({
        userId: Api.getUserId(),
        amount: parseFloat(document.getElementById('inc-amount').value),
        source: document.getElementById('inc-source').value,
        date: document.getElementById('inc-date').value,
        description: document.getElementById('inc-notes').value,
      });
      e.target.reset();
      Modal.close('modal-income');
      Dashboard.load();
      Transactions.load();
    } catch (err) {
      alert('Error: ' + err.message);
    } finally {
      btn.disabled = false; btn.textContent = 'Save';
    }
  },

  async delete(id) {
    if (!confirm('Delete this income?')) return;
    try {
      await Api.deleteIncome(id);
      Transactions.load();
      Dashboard.load();
    } catch (e) { alert('Error: ' + e.message); }
  },
};
