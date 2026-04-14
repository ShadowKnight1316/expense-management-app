// ===== API CONFIGURATION =====
// For local dev: http://localhost:8081/api/v1
// For production: set your Railway URL here
const API_BASE = window.API_BASE_URL || 'http://localhost:8081/api/v1';

const Api = {
  // --- Auth helpers ---
  getToken: () => localStorage.getItem('token'),
  getUserId: () => parseInt(localStorage.getItem('userId')),
  setSession: (token, userId) => {
    localStorage.setItem('token', token);
    localStorage.setItem('userId', userId);
  },
  clearSession: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('userId');
  },
  isLoggedIn: () => !!localStorage.getItem('token'),

  // --- Base fetch ---
  async request(path, options = {}) {
    const token = Api.getToken();
    const headers = { 'Content-Type': 'application/json', ...options.headers };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const res = await fetch(`${API_BASE}${path}`, { ...options, headers });
    if (res.status === 204) return null;

    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || data.message || 'Request failed');
    return data;
  },

  get: (path) => Api.request(path),
  post: (path, body) => Api.request(path, { method: 'POST', body: JSON.stringify(body) }),
  put: (path, body) => Api.request(path, { method: 'PUT', body: JSON.stringify(body) }),
  delete: (path) => Api.request(path, { method: 'DELETE' }),

  // --- Auth ---
  register: (body) => Api.post('/auth/register', body),
  login: (body) => Api.post('/auth/login', body),
  forgotPassword: (email) => Api.post('/auth/forgot-password', { email }),

  // --- User ---
  getUser: (userId) => Api.get(`/users/${userId}`),
  updateUser: (userId, body) => Api.put(`/users/${userId}`, body),

  // --- Expenses ---
  addExpense: (body) => Api.post('/expenses', body),
  getExpenses: (userId) => Api.get(`/expenses?userId=${userId}`),
  updateExpense: (id, body) => Api.put(`/expenses/${id}`, body),
  deleteExpense: (id) => Api.delete(`/expenses/${id}`),

  // --- Income ---
  addIncome: (body) => Api.post('/income', body),
  getIncome: (userId) => Api.get(`/income?userId=${userId}`),
  updateIncome: (id, body) => Api.put(`/income/${id}`, body),
  deleteIncome: (id) => Api.delete(`/income/${id}`),

  // --- Categories ---
  getCategories: (userId) => Api.get(`/categories?userId=${userId}`),
  createCategory: (body) => Api.post('/categories', body),
  deleteCategory: (id) => Api.delete(`/categories/${id}`),

  // --- Dashboard ---
  getDashboard: (userId) => Api.get(`/dashboard?userId=${userId}`),

  // --- Budget ---
  setBudget: (body) => Api.post('/budgets', body),
  getBudget: (userId, month) => Api.get(`/budgets?userId=${userId}&month=${month}`),

  // --- Reports ---
  getMonthlyReport: (userId, month, year) =>
    Api.get(`/reports/monthly?userId=${userId}&month=${month}&year=${year}`),
  getCategoryReport: (userId) => Api.get(`/reports/category?userId=${userId}`),
};

// Utility: format currency
function fmt(amount) {
  return '₹' + parseFloat(amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 0 });
}

// Utility: today's date as YYYY-MM-DD
function today() {
  return new Date().toISOString().split('T')[0];
}

// Utility: current month as YYYY-MM
function currentMonth() {
  return new Date().toISOString().slice(0, 7);
}
