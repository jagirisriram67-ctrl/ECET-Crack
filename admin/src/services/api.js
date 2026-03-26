import axios from 'axios';

const API_URL = 'https://ecet2-ixzw0wsro-elite-earners-95ce1ce6.vercel.app/api';

const api = axios.create({ baseURL: API_URL });

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('admin_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401 || err.response?.status === 403) {
      localStorage.removeItem('admin_token');
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

export const authAPI = {
  adminLogin: (data) => api.post('/auth/admin-login', data),
  getMe: () => api.get('/auth/me'),
};

export const subjectAPI = {
  getAll: (params) => api.get('/subjects', { params }),
  getById: (id) => api.get(`/subjects/${id}`),
  create: (data) => api.post('/subjects', data),
  update: (id, data) => api.put(`/subjects/${id}`, data),
  delete: (id) => api.delete(`/subjects/${id}`),
  seed: () => api.post('/subjects/seed'),
};

export const questionAPI = {
  getAll: (params) => api.get('/questions', { params }),
  create: (data) => api.post('/questions', data),
  bulkUpload: (data) => api.post('/questions/bulk-upload', data),
  update: (id, data) => api.put(`/questions/${id}`, data),
  delete: (id) => api.delete(`/questions/${id}`),
  getStats: () => api.get('/questions/stats'),
};

export const noteAPI = {
  getAll: (params) => api.get('/notes', { params }),
  getById: (id) => api.get(`/notes/${id}`),
  create: (data) => api.post('/notes', data, { headers: { 'Content-Type': 'multipart/form-data' } }),
  update: (id, data) => api.put(`/notes/${id}`, data, { headers: { 'Content-Type': 'multipart/form-data' } }),
  delete: (id) => api.delete(`/notes/${id}`),
};

export const dashboardAPI = {
  getAdmin: () => api.get('/dashboard/admin'),
  getLeaderboard: (params) => api.get('/dashboard/leaderboard', { params }),
};

export const notificationAPI = {
  getAll: () => api.get('/notifications/all'),
  create: (data) => api.post('/notifications', data),
  delete: (id) => api.delete(`/notifications/${id}`),
};

export const adminAPI = {
  getUsers: (params) => api.get('/admin/users', { params }),
  getPending: () => api.get('/admin/pending'),
  approveUser: (id) => api.put(`/admin/users/${id}/approve`),
  blacklistUser: (id, reason) => api.put(`/admin/users/${id}/blacklist`, { reason }),
  unblockUser: (id) => api.put(`/admin/users/${id}/unblock`),
  resetPassword: (id, password) => api.put(`/admin/users/${id}/password`, { password }),
  changeRole: (id, role) => api.put(`/admin/users/${id}/role`, { role }),
  deleteUser: (id) => api.delete(`/admin/users/${id}`),
};

export const supportAPI = {
  getAll: (params) => api.get('/support/admin', { params }),
  reply: (id, data) => api.put(`/support/admin/${id}`, data),
  delete: (id) => api.delete(`/support/admin/${id}`),
};

export const flashcardAPI = {
  getAll: (params) => api.get('/flashcards', { params }),
  create: (data) => api.post('/flashcards', data, { headers: { 'Content-Type': 'multipart/form-data' } }),
  bulkUpload: (data) => api.post('/flashcards/bulk', data),
  update: (id, data) => api.put(`/flashcards/${id}`, data),
  delete: (id) => api.delete(`/flashcards/${id}`),
};

export const paperAPI = {
  getAll: (params) => api.get('/papers', { params }),
  create: (data) => api.post('/papers', data, { headers: { 'Content-Type': 'multipart/form-data' } }),
  delete: (id) => api.delete(`/papers/${id}`),
};

export default api;
