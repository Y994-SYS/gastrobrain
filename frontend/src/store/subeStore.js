import { create } from 'zustand';
import api from '../services/api';

const useSubeStore = create((set, get) => ({
    subeler: [],
    seciliSubeId: null,

    // Sayfa/oturum başına bir kez ayarlanır. Amaç: seciliSubeId'nin "henüz
    // hiç ayarlanmadı" (varsayılan uygulanmalı) durumu ile "kullanıcı bilerek
    // Tüm Şubeler'i seçti" (null ama kasıtlı) durumunu ayırt edebilmek.
    varsayilanAyarlandi: false,

    subeleriYukle: async () => {
        try {
            const res = await api.get('/api/subeler');
            set({ subeler: res.data?.data || [] });
        } catch (err) {
            console.error('Şubeler yüklenemedi:', err);
        }
    },

    // Kullanıcının SubeSecici üzerinden yaptığı manuel seçim. Bu çağrıldıktan
    // sonra varsayılan mantık bir daha devreye girmez — kullanıcının bilinçli
    // tercihi (Tüm Şubeler dahil) korunur.
    subeSecAlt: (subeId) => {
        set({ seciliSubeId: subeId ? Number(subeId) : null, varsayilanAyarlandi: true });
    },

    // KURAL: TENANT_ADMIN için varsayılan görünüm "Tüm Şubeler" değil,
    // kullanıcının KENDİ (merkez) şubesidir — çünkü satış/personel gibi
    // kayıtlar zaten her zaman kendi şubesine kaydediliyor, farklı şubeleri
    // aynı listede karıştırmak kafa karıştırıcı. Admin isterse üstteki
    // SubeSecici'den elle "Tüm Şubeler" veya başka bir şube seçebilir.
    // Bu fonksiyon oturum/sayfa yüklemesi başına yalnızca bir kez etkilidir;
    // sonraki çağrılar (örn. farklı sayfalara geçişte tekrar mount) mevcut
    // manuel seçimi EZMEZ.
    varsayilaniAyarla: (kendiSubeId) => {
        if (get().varsayilanAyarlandi) return;
        set({
            seciliSubeId: kendiSubeId ? Number(kendiSubeId) : null,
            varsayilanAyarlandi: true,
        });
    },
}));

export default useSubeStore;