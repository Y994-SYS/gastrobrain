import axios from 'axios';

const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL,
    headers: { 'Content-Type': 'application/json' }
});

// Her istekte token varsa ekle
api.interceptors.request.use((config) => {
    const token = localStorage.getItem('gastroiq_token');
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
});

// 401 gelirse çıkış yap
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            localStorage.removeItem('gastroiq_token');
            window.location.href = '/giris';
        }
        return Promise.reject(error);
    }
);

export default api;