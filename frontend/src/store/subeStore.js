import { create } from 'zustand';
import api from '../services/api';

const useSubeStore = create((set) => ({
    subeler: [],
    seciliSubeId: null,

    subeleriYukle: async () => {
        try {
            const res = await api.get('/api/subeler');
            set({ subeler: res.data?.data || [] });
        } catch (err) {
            console.error('Şubeler yüklenemedi:', err);
        }
    },

    subeSecAlt: (subeId) => {
        set({ seciliSubeId: subeId ? Number(subeId) : null });
    },
}));

export default useSubeStore;