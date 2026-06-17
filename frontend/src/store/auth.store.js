import { create } from 'zustand';
import authService from '../services/auth.service';

const useAuthStore = create((set) => ({
    kullanici: null,
    yukleniyor: true,

    girisYap: async (email, sifre, tenantSlug) => {
        const kullanici = await authService.girisYap(email, sifre, tenantSlug);
        set({ kullanici });
        return kullanici;
    },

    cikisYap: () => {
        authService.cikisYap();
        set({ kullanici: null });
    },

    setKullanici: (kullanici) => set({ kullanici }),
    baslat: async () => {
        try {
            const token = localStorage.getItem('gastroiq_token');
            if (token) {
                const kullanici = await authService.beniGetir();
                set({ kullanici, yukleniyor: false });
            } else {
                set({ yukleniyor: false });
            }
        } catch {
            set({ kullanici: null, yukleniyor: false });
        }
    }
}));

export default useAuthStore;