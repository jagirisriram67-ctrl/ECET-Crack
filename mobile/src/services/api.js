import axios from 'axios';

const API_BASE = 'https://ecet2.vercel.app/api';
const api = axios.create({ baseURL: API_BASE });

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('ecet_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(res => res, err => {
  if (err.response?.status === 401) {
    localStorage.removeItem('ecet_token');
    localStorage.removeItem('ecet_user');
    window.location.href = '/';
  }
  return Promise.reject(err);
});

export const authAPI = {
  loginGoogle: (data) => api.post('/auth/google', data),
  getMe: () => api.get('/auth/me'),
  updateProfile: (data) => api.put('/auth/profile', data),
};

export const subjectAPI = {
  getAll: (params) => api.get('/subjects', { params }),
  getById: (id) => api.get(`/subjects/${id}`),
};

export const quizAPI = {
  generate: (data) => api.post('/quizzes/generate', data),
  submit: (data) => api.post('/quizzes/submit', data),
  getAttempts: (params) => api.get('/quizzes/attempts', { params }),
  getReview: (id) => api.get(`/quizzes/attempts/${id}/review`),
};

export const noteAPI = {
  getAll: (params) => api.get('/notes', { params }),
  getById: (id) => api.get(`/notes/${id}`),
};

export const dashboardAPI = {
  get: () => api.get('/dashboard'),
  getLeaderboard: (params) => api.get('/dashboard/leaderboard', { params }),
};

export const notificationAPI = {
  getAll: () => api.get('/notifications'),
};

export default api;
