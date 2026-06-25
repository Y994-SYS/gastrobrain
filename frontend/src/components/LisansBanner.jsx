import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import useAuthStore from '../store/auth.store';

export default function LisansBanner() {
    const [kalanGun, setKalanGun] = useState(null);
    const [kapali, setKapali] = useState(false);
    const kullanici = useAuthStore(s => s.kullanici);
    const navigate = useNavigate();

    const kontrol = useCallback(async () => {
        try {
            const res = await api.get('/api/auth/lisans-durum');
            setKalanGun(res.data.data.kalanGun);
        } catch { }
    }, []);

    useEffect(() => {
        if (!kullanici || kullanici.rol === 'SUPER_ADMIN') return;
        kontrol();
    }, [kullanici, kontrol]);

    // Gösterilmeyecek durumlar
    if (kalanGun === null || kalanGun > 14 || kapali) return null;

    // Süresi dolmuş
    if (kalanGun <= 0) {
        return (
            <div className="bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-3 mb-4 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2 text-red-400">
                    <span className="text-base">🔴</span>
                    <span className="text-sm font-medium">Lisansınız sona erdi. Sisteme erişim kısıtlanacak.</span>
                </div>
                <button
                    onClick={() => navigate('/abonelik')}
                    className="shrink-0 text-xs font-bold bg-red-500/20 hover:bg-red-500/30 text-red-400 px-3 py-1.5 rounded-lg transition-colors whitespace-nowrap"
                >
                    Yenile →
                </button>
            </div>
        );
    }

    // Kritik — 3 gün veya altı
    if (kalanGun <= 3) {
        return (
            <div className="bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-3 mb-4 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2 text-red-400">
                    <span className="text-base">⚠️</span>
                    <span className="text-sm font-medium">
                        Lisansınızın bitmesine <strong>{kalanGun} gün</strong> kaldı!
                    </span>
                </div>
                <button
                    onClick={() => navigate('/abonelik')}
                    className="shrink-0 text-xs font-bold bg-red-500/20 hover:bg-red-500/30 text-red-400 px-3 py-1.5 rounded-lg transition-colors whitespace-nowrap"
                >
                    Yenile →
                </button>
            </div>
        );
    }

    // Uyarı — 14 gün veya altı, kapatılabilir
    return (
        <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-xl px-4 py-3 mb-4 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-yellow-400">
                <span className="text-base">⚠️</span>
                <span className="text-sm">
                    Lisansınızın bitmesine <strong>{kalanGun} gün</strong> kaldı.
                </span>
            </div>
            <div className="flex items-center gap-2 shrink-0">
                <button
                    onClick={() => navigate('/abonelik')}
                    className="text-xs font-bold bg-yellow-500/15 hover:bg-yellow-500/25 text-yellow-400 px-3 py-1.5 rounded-lg transition-colors whitespace-nowrap"
                >
                    Yenile →
                </button>
                <button
                    onClick={() => setKapali(true)}
                    className="text-zinc-500 hover:text-zinc-300 transition-colors text-lg leading-none px-1"
                    aria-label="Kapat"
                >
                    ✕
                </button>
            </div>
        </div>
    );
}