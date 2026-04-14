import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Automatically use localhost when running in browser, network IP for mobile
const isWeb = typeof window !== 'undefined' && window.location?.hostname === 'localhost';
export const API_BASE = isWeb
  ? 'http://localhost:8081/api/v1'          // Web browser
  : 'http://100.76.21.32:8081/api/v1';     // Physical phone on same WiFi
// export const API_BASE = 'https://your-app.up.railway.app/api/v1'; // Production

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
