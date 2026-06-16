import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import useAuthStore from '../store/auth.store';

export default function LisansBanner() {
    const [kalanGun, setKalanGun] = useState(null);
    const kullanici = useAuthStore(s => s.kullanici);
    const navigate = useNavigate();

    useEffect(() => {
        if (!kullanici || kullanici.rol === 'SUPER_ADMIN') return;
        kontrol();
    }, [kullanici]);

    const kontrol = async () => {
        try {
            const res = await api.get('/api/auth/lisans-durum');
            setKalanGun(res.data.data.kalanGun);
        } catch (e) { }
    };

    if (kalanGun === null || kalanGun > 14) return null;

    const renk = kalanGun <= 3
        ? 'bg-red-500/10 border-red-500/30 text-red-400'
        : 'bg-yellow-500/10 border-yellow-500/30 text-yellow-400';

    return (
        <div className={`border rounded-lg px-4 py-3 mb-4 flex items-center justify-between ${renk}`}>
            <div className="flex items-center gap-2">
                <span>⚠️</span>
                <span className="text-sm">
                    {kalanGun <= 0
                        ? 'Lisansınız sona erdi. Sisteme erişim yakında kısıtlanacak.'
                        : `Lisansınızın bitmesine ${kalanGun} gün kaldı.`
                    }
                </span>
            </div>
            <button
                onClick={() => navigate('/abonelik')}
                className="text-xs font-semibold underline hover:no-underline ml-4 whitespace-nowrap"
            >
                Yenile →
            </button>
        </div>
    );
}