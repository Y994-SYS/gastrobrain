import { useNavigate } from 'react-router-dom';

// Hangi plan hangi özelliklere sahip
const PLAN_OZELLIKLERI = {
    BASLANGIC: ['stok', 'satis', 'recete', 'raporlar_temel'],
    PROFESYONEL: ['stok', 'satis', 'recete', 'raporlar_temel', 'cari', 'personel', 'raporlar_gelismis', 'transfer'],
    KURUMSAL: ['hepsi'],
};

// Hangi özellik hangi plana dahil
const OZELLIK_PLAN = {
    cari: 'PROFESYONEL',
    personel: 'PROFESYONEL',
    raporlar_gelismis: 'PROFESYONEL',
    transfer: 'PROFESYONEL',
};

const OZELLIK_ETIKET = {
    cari: 'Cari Hesap Yönetimi',
    personel: 'Personel & Maaş Yönetimi',
    raporlar_gelismis: 'Gelişmiş Raporlar & Excel Export',
    transfer: 'Şubeler Arası Stok Transferi',
};

const PLAN_ETIKET = {
    PROFESYONEL: 'Profesyonel',
    KURUMSAL: 'Kurumsal',
};

export function planErisimiVar(plan, denemede, ozellik) {
    if (denemede) return true; // deneme döneminde hepsi açık
    if (!plan) return false;
    const ozellikler = PLAN_OZELLIKLERI[plan] || [];
    return ozellikler.includes('hepsi') || ozellikler.includes(ozellik);
}

export default function PlanKilidi({ ozellik }) {
    const navigate = useNavigate();
    const gerekliPlan = OZELLIK_PLAN[ozellik] || 'PROFESYONEL';

    return (
        <div className="flex items-center justify-center min-h-[60vh]">
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-8 max-w-md w-full text-center space-y-4">
                <div className="text-4xl mb-2">🔒</div>
                <h2 className="text-white font-bold text-lg">
                    {OZELLIK_ETIKET[ozellik] || 'Bu özellik'} kilitli
                </h2>
                <p className="text-zinc-400 text-sm leading-relaxed">
                    Bu özellik <span className="text-lime-400 font-semibold">{PLAN_ETIKET[gerekliPlan]}</span> planına dahildir.
                    Mevcut planınızı yükselterek tüm özelliklere erişebilirsiniz.
                </p>
                <button
                    onClick={() => navigate('/abonelik')}
                    className="w-full bg-lime-400 hover:bg-lime-300 text-zinc-900 font-semibold py-2.5 rounded-lg text-sm transition-colors"
                >
                    Planı Yükselt →
                </button>
                <button
                    onClick={() => navigate('/')}
                    className="w-full bg-zinc-800 hover:bg-zinc-700 text-zinc-300 py-2 rounded-lg text-sm transition-colors"
                >
                    Ana Sayfaya Dön
                </button>
            </div>
        </div>
    );
}