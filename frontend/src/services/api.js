import axios from 'axios';
import toast from 'react-hot-toast';

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

// Hata yakalama
api.interceptors.response.use(
    (response) => response,
    (error) => {
        const status = error.response?.status;
        const istekUrl = error.config?.url || '';

        // Bu endpoint'ler oturumsuz/public çalışır — 401 burada "oturum
        // süresi doldu" anlamına gelmez, sadece "giriş bilgisi yanlış"
        // anlamına gelir. Hard-redirect yapmak hem gereksiz hem de asıl
        // hata mesajını (mesaj alanını) okumadan sayfayı sıfırlıyor.
        const oturumsuzEndpointler = [
            '/auth/giris',
            '/auth/kayit-firma',
            '/auth/tenant-listesi',
            '/auth/sifre-sifirlama-talep',
            '/auth/sifre-sifirla',
        ];
        const oturumsuzMu = oturumsuzEndpointler.some(p => istekUrl.includes(p));

        if (status === 401 && !oturumsuzMu) {
            localStorage.removeItem('gastroiq_token');
            localStorage.removeItem('gastroiq_tenant');
            window.location.href = '/giris';
            return Promise.reject(error);
        }

        if (status === 429) {
            const retryAfter = error.response?.data?.retryAfter;
            const dakika = retryAfter ? Math.ceil(retryAfter / 60) : 15;
            toast.error(`Çok fazla istek gönderildi. Lütfen ${dakika} dakika bekleyin.`, {
                duration: 6000,
                icon: '⏳',
            });
            return Promise.reject(error);
        }

        return Promise.reject(error);
    }
);

export default api;