import api from './api';

const authService = {

    async girisYap(email, sifre, tenantSlug) {
        const res = await api.post('/api/auth/giris', { email, sifre, tenantSlug });
        const { token, kullanici } = res.data.data;
        localStorage.setItem('gastrobrain_token', token);
        localStorage.setItem('gastrobrain_tenant', kullanici.tenantId);
        return kullanici;
    },

    async beniGetir() {
        const res = await api.get('/api/auth/ben');
        return res.data.data;
    },

    cikisYap() {
        localStorage.removeItem('gastrobrain_token');
        localStorage.removeItem('gastrobrain_tenant');
        window.location.href = '/giris';
    }

};

export default authService;