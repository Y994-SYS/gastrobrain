import api from './api';

const authService = {

    async girisYap(email, sifre) {
        const res = await api.post('/api/auth/giris', { email, sifre });
        const { token, kullanici } = res.data.data;
        localStorage.setItem('gastroiq_token', token);
        return kullanici;
    },

    async beniGetir() {
        const res = await api.get('/api/auth/ben');
        return res.data.data;
    },

    cikisYap() {
        localStorage.removeItem('gastroiq_token');
        window.location.href = '/giris';
    }

};

export default authService;