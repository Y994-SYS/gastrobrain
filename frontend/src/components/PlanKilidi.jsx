import { createContext, useContext } from 'react';
import { useNavigate } from 'react-router-dom';

// Hangi plan hangi özelliklere sahip
//
// DÜZELTME: 'merkezDepo' ve 'planliTransfer' bu listeye hiç eklenmemişti —
// backend'deki paketKontrol.middleware.js'in PAKET_OZELLIKLERI listesinde
// PROFESYONEL için ikisi de `true` idi (yani gerçek erişim hep doğruydu),
// ama bu ayrı frontend listesi onlardan habersizdi. Sonuç: PROFESYONEL
// planındaki kullanıcılar Merkez Depo ve Planlı Transfer sayfalarında
// yanlışlıkla "Salt Okunur Mod" görüyordu — veri kaybı yoktu, sadece yazma
// butonları hatalı gizleniyordu. Bu iki liste (frontend + backend) aynı
// bilgiyi iki ayrı yerde tutuyor; ileride yeni bir paket-kısıtlı özellik
// eklenirse İKİSİNİN DE güncellenmesi gerekiyor.
const PLAN_OZELLIKLERI = {
    BASLANGIC: ['stok', 'satis', 'recete', 'raporlar_temel'],
    PROFESYONEL: ['stok', 'satis', 'recete', 'raporlar_temel', 'cari', 'personel', 'raporlar_gelismis', 'transfer', 'merkezDepo', 'planliTransfer'],
    KURUMSAL: ['hepsi'],
};

// Hangi özellik hangi plana dahil (yükseltme mesajında kullanılıyor)
const OZELLIK_PLAN = {
    cari: 'PROFESYONEL',
    personel: 'PROFESYONEL',
    raporlar_gelismis: 'PROFESYONEL',
    transfer: 'PROFESYONEL',
    merkezDepo: 'PROFESYONEL',
    planliTransfer: 'PROFESYONEL',
};

const OZELLIK_ETIKET = {
    cari: 'Cari Hesap Yönetimi',
    personel: 'Personel & Maaş Yönetimi',
    raporlar_gelismis: 'Gelişmiş Raporlar & Excel Export',
    transfer: 'Şubeler Arası Stok Transferi',
    merkezDepo: 'Merkez Depo Yönetimi',
    planliTransfer: 'Planlı Transferler',
};

const PLAN_ETIKET = {
    PROFESYONEL: 'Profesyonel',
    KURUMSAL: 'Kurumsal',
};

// Tam erişim var mı? (deneme sırasında her zaman true — trial cliff'i
// önlemek için gerçek "kısıtlama" sadece deneme bitip plan yetersiz kalınca
// başlıyor, o durumda da SALT OKUNUR moduna geçiliyor, sayfa tamamen
// kapanmıyor.)
export function planErisimiVar(plan, denemede, ozellik) {
    if (denemede) return true;
    if (!plan) return false;
    const ozellikler = PLAN_OZELLIKLERI[plan] || [];
    return ozellikler.includes('hepsi') || ozellikler.includes(ozellik);
}

// ── Paket Durumu Context ────────────────────────────────────────────────────
const PaketContext = createContext({ tamErisim: true, ozellik: null, plan: null, denemede: false });

export function PaketProvider({ ozellik, plan, denemede, children }) {
    const tamErisim = planErisimiVar(plan, denemede, ozellik);
    return (
        <PaketContext.Provider value={{ tamErisim, ozellik, plan, denemede }}>
            {children}
        </PaketContext.Provider>
    );
}

export function usePaketDurumu() {
    return useContext(PaketContext);
}

// ── Salt Okunur Uyarı Şeridi ─────────────────────────────────────────────────
export function SaltOkunurUyari() {
    const { tamErisim, ozellik } = usePaketDurumu();
    const navigate = useNavigate();

    if (tamErisim) return null;

    const gerekliPlan = OZELLIK_PLAN[ozellik] || 'PROFESYONEL';

    return (
        <div className="bg-amber-900/20 border border-amber-800/40 rounded-xl p-4 mb-5 flex items-center justify-between gap-3 flex-wrap">
            <div>
                <p className="text-amber-400 font-semibold text-sm">
                    🔒 Salt Okunur Mod — {OZELLIK_ETIKET[ozellik] || 'Bu özellik'}
                </p>
                <p className="text-zinc-400 text-xs mt-1">
                    Mevcut kayıtlarınızı görüntüleyebilirsiniz, ancak yeni ekleme/düzenleme/silme yapabilmek için{' '}
                    <span className="text-lime-400 font-medium">{PLAN_ETIKET[gerekliPlan]}</span> paketine geçmeniz gerekiyor.
                </p>
            </div>
            <button
                onClick={() => navigate('/abonelik')}
                className="bg-lime-400 hover:bg-lime-300 text-zinc-900 font-semibold text-xs px-4 py-2 rounded-lg whitespace-nowrap transition-colors"
            >
                Planı Yükselt →
            </button>
        </div>
    );
}

// ── Eski davranış (tam sayfa kilit ekranı) ─────────────────────────────────
// Artık normal akışta KULLANILMIYOR — geriye dönük uyumluluk için export
// edilmeye devam ediyor.
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