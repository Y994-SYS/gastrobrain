import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import useAuthStore from '../store/auth.store';

export default function DenemeBanner() {
    const kullanici = useAuthStore(s => s.kullanici);
    const [kapali, setKapali] = useState(false);
    const navigate = useNavigate();

    if (!kullanici?.denemede || kapali) return null;

    return (
        <div className="bg-blue-500/10 border-b border-blue-500/20 px-4 py-2.5 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 min-w-0">
                <span className="text-blue-400 text-sm shrink-0">🎁</span>
                <p className="text-blue-300 text-sm truncate">
                    <span className="font-semibold">30 günlük ücretsiz deneme</span> — Tüm özellikler açık.
                    Deneme bittikten sonra seçtiğiniz plana göre erişim devam eder.
                </p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
                <button
                    onClick={() => navigate('/abonelik')}
                    className="text-xs bg-blue-500/20 hover:bg-blue-500/30 text-blue-300 px-3 py-1 rounded-lg transition-colors"
                >
                    Plan Seç
                </button>
                <button
                    onClick={() => setKapali(true)}
                    className="text-blue-400/60 hover:text-blue-300 text-lg leading-none"
                >
                    ×
                </button>
            </div>
        </div>
    );
}