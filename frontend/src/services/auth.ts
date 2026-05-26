import axios from 'axios';

const API_URL = 'http://localhost:8080/api/auth';

let memoryToken: string | null = null;

export const authApi = axios.create({
  baseURL: 'http://localhost:8080'
});

authApi.interceptors.request.use((config) => {
  if (memoryToken) {
    config.headers.Authorization = `Bearer ${memoryToken}`;
  }
  return config;
});

authApi.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      memoryToken = null;
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export const setToken = (token: string | null) => {
  memoryToken = token;
};

export const getToken = () => memoryToken;

export const register = async (data: any) => {
  const response = await axios.post(`${API_URL}/register`, data);
  if (response.data.accessToken) {
    setToken(response.data.accessToken);
  }
  return response.data;
};

export const login = async (data: any) => {
  const response = await axios.post(`${API_URL}/login`, data);
  if (response.data.accessToken) {
    setToken(response.data.accessToken);
  }
  return response.data;
};

export const logout = () => {
  setToken(null);
  window.location.href = '/login';
};

export const getMe = async () => {
  const response = await authApi.get('/api/auth/me');
  return response.data;
};
