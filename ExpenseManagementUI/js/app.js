// ===== TRANSACTIONS PAGE =====
const Transactions = {
  async load() {
    const userId = Api.getUserId();
    const el = document.getElementById('transaction-list');
    el.innerHTML = '<div class="loading">Loading...</div>';

    try {
      const [expenses, incomes] = await Promise.all([
        Api.getExpenses(userId),
        Api.getIncome(userId),
      ]);

      // Merge and sort by date desc
      const all = [
        ...expenses.map(e => ({ ...e, _type: 'expense' })),
        ...incomes.map(i => ({ ...i, _type: 'income' })),
      ].sort((a, b) => new Date(b.date) - new Date(a.date));

      // Apply filters
      const typeFilter = document.getElementById('filter-type').value;
      const monthFilter = document.getElementById('filter-month').value;

      const filtered = all.filter(tx => {
        if (typeFilter && tx._type !== typeFilter) return false;
        if (monthFilter && !tx.date.startsWith(monthFilter)) return false;
        return true;
      });

      if (!filtered.length) {
        el.innerHTML = '<div class="empty-state">No transactions found</div>';
        return;
      }

      el.innerHTML = filtered.map(tx => {
        const isExpense = tx._type === 'expense';
        const cls = isExpense ? 'expense-item' : 'income-item';
        const icon = isExpense ? '💸' : '💰';
        const sign = isExpense ? '-' : '+';
        const label = isExpense ? (tx.category?.name || 'Expense') : (tx.source || 'Income');
        const sub = tx.description || tx.paymentMode || '';
        const id = isExpense ? tx.expenseId : tx.incomeId;
        const delFn = isExpense ? `Expenses.delete(${id})` : `Income.delete(${id})`;

        return `
          <div class="transaction-item ${cls}">
            <div class="tx-left">
              <div class="tx-icon">${icon}</div>
              <div>
                <div class="tx-title">${label}</div>
                <div class="tx-sub">${sub}</div>
              </div>
            </div>
            <div class="tx-right">
              <div class="tx-amount">${sign}${fmt(tx.amount)}</div>
              <div class="tx-date">${tx.date}</div>
              <div class="tx-actions">
                <button class="btn-icon" onclick="${delFn}" title="Delete">🗑️</button>
              </div>
            </div>
          </div>`;
      }).join('');
    } catch (e) {
      el.innerHTML = `<div class="empty-state">Error loading transactions</div>`;
    }
  },

  init() {
    document.getElementById('filter-type').onchange = Transactions.load;
    document.getElementById('filter-month').onchange = Transactions.load;
    document.getElementById('filter-month').value = currentMonth();
  },
};

// ===== PROFILE PAGE =====
const Profile = {
  async load() {
    try {
      const user = await Api.getUser(Api.getUserId());
      document.getElementById('profile-info').innerHTML = `
        <h3>${user.name}</h3>
        <p>${user.email}</p>`;
      document.getElementById('profile-name').value = user.name;
    } catch (e) {}
    Categories.load();
  },

  init() {
    document.getElementById('profile-form').onsubmit = async (e) => {
      e.preventDefault();
      try {
        await Api.updateUser(Api.getUserId(), {
          name: document.getElementById('profile-name').value,
        });
        Profile.load();
        alert('Profile updated!');
      } catch (err) { alert('Error: ' + err.message); }
    };

    document.getElementById('btn-logout').onclick = () => {
      Api.clearSession();
      App.showAuth();
    };
  },
};

// ===== MODAL HELPER =====
const Modal = {
  open(id) {
    document.getElementById(id).classList.remove('hidden');
    document.getElementById('modal-backdrop').classList.remove('hidden');
  },
  close(id) {
    document.getElementById(id).classList.add('hidden');
    document.getElementById('modal-backdrop').classList.add('hidden');
  },
  init() {
    document.querySelectorAll('.modal-close').forEach(btn => {
      btn.onclick = () => Modal.close(btn.dataset.modal);
    });
    document.getElementById('modal-backdrop').onclick = () => {
      document.querySelectorAll('.modal:not(.hidden)').forEach(m => m.classList.add('hidden'));
      document.getElementById('modal-backdrop').classList.add('hidden');
    };
  },
};

// ===== ROUTER / APP =====
const App = {
  currentPage: 'dashboard',

  init() {
    // Init all modules
    Auth.init();
    Modal.init();
    Expenses.init();
    Income.init();
    Categories.init();
    Transactions.init();
    Profile.init();
    Statement.init();

    // Nav buttons
    document.querySelectorAll('.nav-btn').forEach(btn => {
      btn.onclick = () => App.navigate(btn.dataset.page);
    });

    // Check session
    if (Api.isLoggedIn()) {
      App.showApp();
    } else {
      App.showAuth();
    }
  },

  showAuth() {
    document.getElementById('auth-screen').classList.add('active');
    document.getElementById('app-screen').classList.remove('active');
    Auth.show('login');
  },

  showApp() {
    document.getElementById('auth-screen').classList.remove('active');
    document.getElementById('app-screen').classList.add('active');
    App.navigate('dashboard');
    Budget.init();
    Reports.init();
  },

  navigate(page) {
    // Update nav
    document.querySelectorAll('.nav-btn').forEach(b => {
      b.classList.toggle('active', b.dataset.page === page);
    });

    // Show page
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    document.getElementById(`page-${page}`).classList.add('active');

    App.currentPage = page;

    // Load data for page
    switch (page) {
      case 'dashboard':   Dashboard.load(); break;
      case 'transactions': Transactions.load(); break;
      case 'reports':     Reports.load(); break;
      case 'budget':      Budget.loadStatus(document.getElementById('budget-month').value || currentMonth()); break;
      case 'profile':     Profile.load(); break;
      case 'statement':   /* static page, no load needed */ break;
    }
  },
};

// Boot
document.addEventListener('DOMContentLoaded', App.init);
