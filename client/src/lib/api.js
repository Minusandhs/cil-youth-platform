import axios from 'axios';

const api = axios.create({
  baseURL: '',
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('cil_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const isAuthError = error.response?.status === 401;
    const isDeactivatedError = error.response?.status === 403 && error.response?.data?.error === 'LDC_DEACTIVATED';

    if (isAuthError || isDeactivatedError) {
      localStorage.removeItem('cil_token');
      localStorage.removeItem('cil_user');
      const redirectUrl = isDeactivatedError ? '/login?error=ldc_deactivated' : '/login';
      window.location.href = redirectUrl;
    }
    return Promise.reject(error);
  }
);

export const authAPI = {
  login  : (credentials) => api.post('/api/auth/login', credentials),
  logout : ()            => api.post('/api/auth/logout'),
  me     : ()            => api.get('/api/auth/me'),
};

export const participantsAPI = {
  getAll : (params)    => api.get('/api/participants', { params }),
  getOne : (id)        => api.get(`/api/participants/${id}`),
  sync   : (data)      => api.post('/api/participants/sync', data),
  update : (id, data)  => api.put(`/api/participants/${id}`, data),
};

export const academicAPI = {
  getOL    : (pid)       => api.get(`/api/academic/ol/${pid}`),
  saveOL   : (data)      => api.post('/api/academic/ol', data),
  updateOL : (id, data)  => api.put(`/api/academic/ol/${id}`, data),
  getAL    : (pid)       => api.get(`/api/academic/al/${pid}`),
  saveAL   : (data)      => api.post('/api/academic/al', data),
  updateAL : (id, data)  => api.put(`/api/academic/al/${id}`, data),
  getCerts : (pid)       => api.get(`/api/academic/certs/${pid}`),
  saveCert : (data)      => api.post('/api/academic/certs', data),
  deleteCert: (id)       => api.delete(`/api/academic/certs/${id}`),
};

export const profileAPI = {
  get    : (pid)       => api.get(`/api/participants/${pid}/profile`),
  save   : (pid, data) => api.post(`/api/participants/${pid}/profile`, data),
  update : (pid, data) => api.put(`/api/participants/${pid}/profile`, data),
};

export const developmentAPI = {
  getAll : (pid)        => api.get(`/api/development/${pid}`),
  getOne : (pid, year)  => api.get(`/api/development/${pid}/${year}`),
  save   : (data)       => api.post('/api/development', data),
  update : (id, data)   => api.put(`/api/development/${id}`, data),
};

export const tesAPI = {
  getAll : (params)    => api.get('/api/tes', { params }),
  getOne : (pid, year) => api.get(`/api/tes/${pid}/${year}`),
  save   : (data)      => api.post('/api/tes', data),
  update : (id, data)  => api.put(`/api/tes/${id}`, data),
  export : (params)    => api.get('/api/tes/export', { params, responseType: 'blob' }),
};

export default api;
