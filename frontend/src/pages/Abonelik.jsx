import { useState } from 'react';
import useAuthStore from '../store/auth.store';
import toast from 'react-hot-toast';

const PLANLAR = [
    {
        id: 'baslangic',
        ad: 'Başlangıç',
        fiyat: { aylik: 799, yillik: 7990 },
        ozellikler: [
            '1 Şube',
            '5 Kullanıcı',
            'Stok Yönetimi',
            'Reçete & Maliyet',
            'Satış Takibi',
            'Temel Raporlar',
            'E-posta Desteği',
        ]
    },
    {
        id: 'profesyonel',
        ad: 'Profesyonel',
        fiyat: { aylik: 1499, yillik: 14990 },
        populer: true,
        ozellikler: [
            'Sınırsız Şube',
            'Sınırsız Kullanıcı',
            'Tüm Başlangıç Özellikleri',
            'Cari Hesap Yönetimi',
            'Personel & Maaş',
            'Gelişmiş Raporlar + Excel',
            'Rol Yönetimi',
            'Öncelikli Destek',
        ]
    },
    {
        id: 'kurumsal',
        ad: 'Kurumsal',
        fiyat: { aylik: null, yillik: null },
        ozellikler: [
            'Her şey dahil',
            'Özel Entegrasyonlar',
            'Yerinde / Canlı Eğitim',
            'Yazılı SLA Garantisi',
            'Özel Hesap Yöneticisi',
            'Kurumsal Faturalandırma',
        ]
    }
];

const IBAN = 'TR64 0006 2001 2620 0006 6629 79';
const DESTEK_EMAIL = 'alkan.yazilim.dev@gmail.com';

// ─── Kopyala butonu ───────────────────────────────────────────────────────────
function KopyalaButon({ metin, etiket = 'Kopyala' }) {
    const [kopyalandi, setKopyalandi] = useState(false);

    const kopyala = () => {
        navigator.clipboard.writeText(metin);
        setKopyalandi(true);
        toast.success(`${etiket} kopyalandı`);
        setTimeout(() => setKopyalandi(false), 2000);
    };

    return (
        <button
            onClick={kopyala}
            className="text-xs text-lime-400 hover:text-lime-300 font-medium ml-4 shrink-0 transition-colors"
        >
            {kopyalandi ? '✓ Kopyalandı' : 'Kopyala'}
        </button>
    );
}

// ─── Bilgi Satırı ─────────────────────────────────────────────────────────────
function BilgiSatiri({ etiket, deger, mono = false, kopyala = false }) {
    return (
        <div className="bg-zinc-800/60 rounded-lg p-4 border border-zinc-800">
            <p className="text-xs text-zinc-400 mb-1">{etiket}</p>
            <div className="flex items-center justify-between gap-3">
                <span className={`text-zinc-100 ${mono ? 'font-mono text-sm tracking-wide' : 'font-medium'} break-all`}>
                    {deger}
                </span>
                {kopyala && <KopyalaButon metin={typeof deger === 'string' ? deger.replace(/\s/g, '') : deger} etiket={etiket} />}
            </div>
        </div>
    );
}

export default function Abonelik() {
    const { kullanici } = useAuthStore();
    const [periyot, setPeriyot] = useState('aylik');
    const [secilenPlan, setSecilenPlan] = useState(null);

    const activePlan = PLANLAR.find(p => p.id === secilenPlan);

    const formatTutar = (plan) => {
        if (plan.id === 'kurumsal') return 'Teklif Al';
        const tutar = plan.fiyat[periyot];
        return `₺${tutar.toLocaleString('tr-TR')}`;
    };

    const aciklamaMetni = `${kullanici?.tenantAd || 'GastroBrain'} - ${activePlan?.ad || ''} (${periyot === 'aylik' ? 'Aylık' : 'Yıllık'})`;

    return (
        <div className="max-w-5xl mx-auto">

            {/* Başlık + Toggle */}
            <div className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-semibold text-zinc-100 mb-1">Abonelik Yönetimi</h1>
                    <p className="text-zinc-400 text-sm">Lisansınızı yenilemek veya yükseltmek için plan seçin.</p>
                </div>

                <div className="flex items-center gap-1 bg-zinc-900 p-1 rounded-xl border border-zinc-800 self-start md:self-auto">
                    <button
                        onClick={() => setPeriyot('aylik')}
                        className={`px-4 py-2 text-sm font-medium rounded-lg transition-all ${periyot === 'aylik'
                                ? 'bg-zinc-800 text-lime-400 font-semibold'
                                : 'text-zinc-400 hover:text-zinc-200'
                            }`}
                    >
                        Aylık
                    </button>
                    <button
                        onClick={() => setPeriyot('yillik')}
                        className={`px-4 py-2 text-sm font-medium rounded-lg transition-all flex items-center gap-1.5 ${periyot === 'yillik'
                                ? 'bg-zinc-800 text-lime-400 font-semibold'
                                : 'text-zinc-400 hover:text-zinc-200'
                            }`}
                    >
                        Yıllık
                        <span className="text-[10px] bg-lime-400/20 text-lime-400 px-1.5 py-0.5 rounded-md font-bold">
                            %17 İndirim
                        </span>
                    </button>
                </div>
            </div>

            {/* Plan Kartları */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-8">
                {PLANLAR.map(plan => {
                    const isSelected = secilenPlan === plan.id;
                    return (
                        <div
                            key={plan.id}
                            onClick={() => setSecilenPlan(plan.id)}
                            className={`relative border rounded-2xl p-6 cursor-pointer transition-all flex flex-col ${isSelected
                                    ? 'border-lime-400 bg-lime-400/5 ring-1 ring-lime-400/50'
                                    : 'border-zinc-800 bg-zinc-900 hover:border-zinc-700'
                                }`}
                        >
                            {/* Popüler rozet */}
                            {plan.populer && (
                                <span className="absolute -top-3 left-1/2 -translate-x-1/2 text-[10px] bg-lime-400 text-black font-extrabold px-3 py-1 rounded-full uppercase tracking-wider whitespace-nowrap">
                                    EN POPÜLER
                                </span>
                            )}

                            {/* Seçili göstergesi */}
                            {isSelected && (
                                <span className="absolute top-4 right-4 w-2.5 h-2.5 bg-lime-400 rounded-full" />
                            )}

                            <div className="flex-1">
                                <h3 className="text-base font-semibold text-zinc-100 mb-1">{plan.ad}</h3>
                                <div className="flex items-baseline gap-1 mb-5">
                                    <span className="text-3xl font-bold text-lime-400">
                                        {formatTutar(plan)}
                                    </span>
                                    {plan.id !== 'kurumsal' && (
                                        <span className="text-zinc-500 text-xs">/{periyot === 'aylik' ? 'ay' : 'yıl'}</span>
                                    )}
                                </div>

                                <ul className="space-y-2">
                                    {plan.ozellikler.map((o, i) => (
                                        <li key={i} className="flex items-start gap-2 text-sm text-zinc-300 leading-snug">
                                            <span className="text-lime-400 font-bold shrink-0 mt-0.5">✓</span>
                                            <span>{o}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>

                            {/* Seç butonu */}
                            <div className={`mt-5 text-center text-sm font-semibold py-2 rounded-lg transition-colors ${isSelected
                                    ? 'bg-lime-400 text-black'
                                    : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'
                                }`}>
                                {isSelected ? '✓ Seçildi' : 'Seç'}
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Ödeme Alanı */}
            {secilenPlan && (
                <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
                    {secilenPlan === 'kurumsal' ? (
                        /* Kurumsal */
                        <div>
                            <h2 className="text-lg font-semibold text-zinc-100 mb-2">Kurumsal Çözüm Talebi</h2>
                            <p className="text-sm text-zinc-400 mb-6">
                                Çoklu şube entegrasyonları, yerinde personel eğitimi ve size özel hesap yöneticisi için bizimle iletişime geçin.
                            </p>
                            <div className="bg-lime-400/10 border border-lime-400/20 rounded-xl p-5 flex flex-col md:flex-row items-center justify-between gap-4">
                                <div>
                                    <p className="font-medium text-zinc-200">İşletmenize özel SLA sözleşmesi hazırlayalım.</p>
                                    <p className="text-xs text-zinc-400 mt-0.5">Talebiniz bize ulaştıktan sonra 2 saat içinde dönüş yapıyoruz.</p>
                                </div>
                                <a
                                    href={`mailto:${DESTEK_EMAIL}?subject=Kurumsal Paket Teklif Talebi - ${kullanici?.tenantAd || ''}`}
                                    className="w-full md:w-auto text-center px-5 py-2.5 bg-lime-400 text-black font-semibold rounded-lg hover:bg-lime-300 transition-colors text-sm whitespace-nowrap"
                                >
                                    Kurumsal Teklif İsteyin →
                                </a>
                            </div>
                        </div>
                    ) : (
                        /* Havale / EFT */
                        <div>
                            <h2 className="text-lg font-semibold text-zinc-100 mb-5">Ödeme Bilgileri</h2>

                            <div className="space-y-3">
                                <BilgiSatiri etiket="IBAN" deger={IBAN} mono kopyala />
                                <BilgiSatiri etiket="Alıcı" deger="Yasin ALKAN" />
                                <BilgiSatiri
                                    etiket="Açıklama (EFT/Havale yaparken zorunludur)"
                                    deger={aciklamaMetni}
                                    mono
                                    kopyala
                                />

                                {/* Bilgi notu */}
                                <div className="bg-lime-400/5 border border-lime-400/20 rounded-xl p-4">
                                    <p className="text-sm text-zinc-300 leading-relaxed">
                                        💡 Havaleyi tamamladıktan sonra{' '}
                                        <a href={`mailto:${DESTEK_EMAIL}`} className="text-lime-400 hover:text-lime-300 underline">
                                            {DESTEK_EMAIL}
                                        </a>
                                        {' '}adresine bilgilendirme maili gönderin. Hesabınız en geç 24 saat içinde aktif edilir.
                                    </p>
                                </div>

                                <div className="bg-zinc-800/60 border border-zinc-700 rounded-xl p-4">
                                    <p className="text-xs text-zinc-400 leading-relaxed">
                                        ℹ️ Plan seçiminiz ödeme sonrası manuel olarak yansıtılır. Sorularınız için{' '}
                                        <a href={`mailto:${DESTEK_EMAIL}`} className="text-lime-400 hover:text-lime-300 underline">
                                            {DESTEK_EMAIL}
                                        </a>
                                        {' '}adresine yazabilirsiniz.
                                    </p>
                                </div>

                                {/* Toplam */}
                                <div className="bg-zinc-800/80 rounded-xl p-4 border border-zinc-700 flex justify-between items-center">
                                    <div>
                                        <p className="text-xs text-zinc-400">Seçilen Plan & Dönem</p>
                                        <p className="text-sm text-zinc-200 font-medium mt-0.5">
                                            {activePlan?.ad} — {periyot === 'aylik' ? 'Aylık' : 'Yıllık (%17 İndirimli)'}
                                        </p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-xs text-zinc-400 mb-0.5">Ödenecek Tutar</p>
                                        <p className="text-2xl font-bold text-lime-400">
                                            {formatTutar(activePlan)}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}