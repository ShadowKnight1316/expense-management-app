// ===== EXPENSES =====
const Expenses = {
  openModal() {
    document.getElementById('exp-date').value = today();
    Categories.populateSelect('exp-category');
    Modal.open('modal-expense');
  },

  init() {
    document.getElementById('btn-add-expense').onclick = Expenses.openModal;
    document.getElementById('expense-form').onsubmit = Expenses.handleSubmit;
  },

  async handleSubmit(e) {
    e.preventDefault();
    const btn = e.target.querySelector('button[type=submit]');
    btn.disabled = true; btn.textContent = 'Saving...';

    try {
      await Api.addExpense({
        userId: Api.getUserId(),
        amount: parseFloat(document.getElementById('exp-amount').value),
        categoryId: parseInt(document.getElementById('exp-category').value),
        date: document.getElementById('exp-date').value,
        paymentMode: document.getElementById('exp-payment').value,
        description: document.getElementById('exp-desc').value,
      });
      e.target.reset();
      Modal.close('modal-expense');
      Dashboard.load();
      Transactions.load();
    } catch (err) {
      alert('Error: ' + err.message);
    } finally {
      btn.disabled = false; btn.textContent = 'Save';
    }
  },

  async delete(id) {
    if (!confirm('Delete this expense?')) return;
    try {
      await Api.deleteExpense(id);
      Transactions.load();
      Dashboard.load();
    } catch (e) { alert('Error: ' + e.message); }
  },
};
