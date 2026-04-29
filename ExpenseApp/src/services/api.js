import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const API_BASE = 'https://expense-management-app-production.up.railway.app/api/v1';

const api = axios.create({ baseURL: API_BASE });

// Attach JWT token to every request
api.interceptors.request.use(async (config) => {
  const token = await AsyncStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export const setSession = async (token, userId) => {
  await AsyncStorage.setItem('token', token);
  await AsyncStorage.setItem('userId', String(userId));
};

export const clearSession = async () => {
  await AsyncStorage.removeItem('token');
  await AsyncStorage.removeItem('userId');
};

export const getToken = () => AsyncStorage.getItem('token');
export const getUserId = async () => {
  const id = await AsyncStorage.getItem('userId');
  return id ? parseInt(id) : null;
};

// ── Auth ──────────────────────────────────────────────────────────────────────
export const login = (data) => api.post('/auth/login', data);
export const register = (data) => api.post('/auth/register', data);

// ── Dashboard ─────────────────────────────────────────────────────────────────
export const getDashboard = (userId) => api.get(`/dashboard?userId=${userId}`);

// ── Expenses ──────────────────────────────────────────────────────────────────
export const getExpenses = (userId) => api.get(`/expenses?userId=${userId}`);
export const addExpense = (data) => api.post('/expenses', data);
export const deleteExpense = (id) => api.delete(`/expenses/${id}`);

// ── Income ────────────────────────────────────────────────────────────────────
export const getIncome = (userId) => api.get(`/income?userId=${userId}`);
export const addIncome = (data) => api.post('/income', data);
export const deleteIncome = (id) => api.delete(`/income/${id}`);

// ── Categories ────────────────────────────────────────────────────────────────
export const getCategories = (userId) => api.get(`/categories?userId=${userId}`);

// ── Budget ────────────────────────────────────────────────────────────────────
export const getBudget = (userId, month) => api.get(`/budgets?userId=${userId}&month=${month}`);
export const setBudget = (data) => api.post('/budgets', data);

// ── Reports ───────────────────────────────────────────────────────────────────
export const getMonthlyReport = (userId, month, year) =>
  api.get(`/reports/monthly?userId=${userId}&month=${month}&year=${year}`);

export const getCategoryReport = (userId) =>
  api.get(`/reports/category?userId=${userId}`);

// ── User Profile ──────────────────────────────────────────────────────────────
export const getUser = (userId) => api.get(`/users/${userId}`);
export const updateUser = (userId, body) => api.put(`/users/${userId}`, body);
export const requestEmailChange = (userId, newEmail) => api.post(`/users/${userId}/request-email-change`, { newEmail });
export const verifyEmailChange = (userId, otp) => api.post(`/users/${userId}/verify-email-change`, { otp });
export const changePassword = (userId, body) => api.post(`/users/${userId}/change-password`, body);
