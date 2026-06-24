import { create } from 'zustand';
import api from '../services/api';

const useSubeStore = create((set, get) => ({
    subeler: [],
    seciliSubeId: null, // null = tüm şubeler

    subeleriYukle: async () => {
        try {
            const res = await api.get('/api/subeler');
            set({ subeler: res.data.data });
        } catch (err) {
            console.error('Şubeler yüklenemedi:', err);
        }
    },

    subeSecAlt: (subeId) => {
        set({ seciliSubeId: subeId ? Number(subeId) : null });
    },

    // API query string'i hazırla — null ise boş döner
    subeQuery: () => {
        const { seciliSubeId } = get();
        return seciliSubeId ? `subeId=${seciliSubeId}` : '';
    },

    // URL'e eklemek için hazır string — ? veya & prefix olmadan
    subeParam: () => {
        const { seciliSubeId } = get();
        return seciliSubeId ? `?subeId=${seciliSubeId}` : '';
    },
}));

export default useSubeStore;