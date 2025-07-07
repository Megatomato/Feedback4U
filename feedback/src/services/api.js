import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests if available
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle token expiration
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Authentication API calls
export const authAPI = {
  registerAdmin: (data) => {
    const payload = {
      school_name: data.schoolName,
      email: data.email,
      password: data.password,
      admin_name: 'Admin User', // Default admin name since form doesn't collect this
      admin_phone_number: '000-000-0000', // Default phone since form doesn't collect this
      plan: data.plan
    };
    return api.post('/auth/register/admin', payload);
  },

  registerStudent: (data) => {
    return api.post('/auth/register/student', data);
  },

  login: (email, password) => {
    const formData = new FormData();
    formData.append('username', email);
    formData.append('password', password);

    return api.post('/auth/login', formData, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    });
  },

  getCurrentUser: () => api.get('/me'),

  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  }
};

// Student API calls
export const studentAPI = {
  getAll: () => api.get('/students'),
  getById: (id) => api.get(`/students/${id}`),
  create: (data) => api.post('/students', data),
  update: (id, data) => api.put(`/students/${id}`, data),
  delete: (id) => api.delete(`/students/${id}`)
};

// Teacher API calls
export const teacherAPI = {
  getAll: () => api.get('/teachers'),
  getById: (id) => api.get(`/teachers/${id}`),
};

// Admin API calls
export const adminAPI = {
  getAll: () => api.get('/admins'),
};

export default api;
