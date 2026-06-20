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
        fiyat: { aylik: 'Teklif Al', yillik: 'Teklif Al' },
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

export default function Abonelik() {
    const { kullanici } = useAuthStore();
    const [periyot, setPeriyot] = useState('aylik'); // 'aylik' veya 'yillik'
    const [secilenPlan, setSecilenPlan] = useState(null);
    const [kopyalandi, setKopyalandi] = useState(false);

    const activePlan = PLANLAR.find(p => p.id === secilenPlan);

    const ibanKopyala = () => {
        navigator.clipboard.writeText(IBAN.replace(/\s/g, ''));
        setKopyalandi(true);
        setTimeout(() => setKopyalandi(false), 2000);
        toast.success('IBAN kopyalandı');
    };

    const formatTutar = (plan) => {
        if (plan.id === 'kurumsal') return 'Teklif Al';
        const tutar = plan.fiyat[periyot];
        return `₺${tutar.toLocaleString('tr-TR')}`;
    };

    const getAciklamaMetni = () => {
        const planAdi = activePlan?.ad || '';
        const periyotAdi = periyot === 'aylik' ? 'Aylık' : 'Yıllık';
        return `${kullanici?.tenantAd || 'GastroBrain'} - ${planAdi} (${periyotAdi})`;
    };

    return (
        <div className="max-w-5xl mx-auto ">
            <div className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-semibold text-zinc-100 mb-2">Abonelik Yönetimi</h1>
                    <p className="text-zinc-400">Lisansınızı yenilemek veya yükseltmek için plan seçin.</p>
                </div>

                {/* Aylık / Yıllık Toggle Seçimi */}
                <div className="flex items-center gap-2 bg-zinc-900 p-1 rounded-xl border border-zinc-800 self-start md:self-auto">
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

            {/* Plan Kartları Grid Yapısı */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                {PLANLAR.map(plan => {
                    const isSelected = secilenPlan === plan.id;
                    return (
                        <div
                            key={plan.id}
                            onClick={() => setSecilenPlan(plan.id)}
                            className={`relative border rounded-xl p-6 cursor-pointer transition-all flex flex-col justify-between ${isSelected
                                ? 'border-lime-400 bg-lime-400/5 ring-2 ring-lime-400 animate-[pulse-border_2s_ease-in-out_infinite]'
                                : 'border-zinc-800 bg-zinc-900 hover:border-zinc-700'
                                }`}
                        >
                            {plan.populer && (
                                <span className="absolute -top-3 left-1/2 -translate-x-1/2 text-[10px] bg-lime-400 text-black font-extrabold px-3 py-1 rounded-full uppercase tracking-wider">
                                    EN POPÜLER
                                </span>
                            )}

                            <div>
                                <h3 className="text-lg font-semibold text-zinc-100 mb-1">{plan.ad}</h3>
                                <div className="flex items-baseline gap-1 mb-6">
                                    <span className="text-3xl font-bold text-lime-400">
                                        {formatTutar(plan)}
                                    </span>
                                    {plan.id !== 'kurumsal' && (
                                        <span className="text-zinc-500 text-xs">/{periyot === 'aylik' ? 'ay' : 'yıl'}</span>
                                    )}
                                </div>

                                <ul className="space-y-2.5 mb-6">
                                    {plan.ozellikler.map((o, i) => (
                                        <li key={i} className="flex items-start gap-2 text-sm text-zinc-300 leading-tight">

                                            <span className="text-lime-400 font-bold shrink-0">✓</span>
                                            <span>{o}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>

                            {isSelected && (
                                <div className="absolute top-4 right-4 w-3 h-3 bg-lime-400 rounded-full animate-pulse"></div>
                            )}
                        </div>
                    );
                })}
            </div>

            {/* Dinamik Ödeme Talimatları & Kurumsal Alanı */}
            {secilenPlan && (
                <div className="border border-zinc-800 rounded-xl p-6 bg-zinc-900 transition-all">
                    {secilenPlan === 'kurumsal' ? (
                        /* Kurumsal Paket İçeriği */
                        <div>
                            <h2 className="text-lg font-semibold text-zinc-100 mb-2">Kurumsal Çözüm Talebi</h2>
                            <p className="text-sm text-zinc-400 mb-6">
                                Çoklu şube entegrasyonları, yerinde personel eğitimi, KDV faturası süreçleri ve size özel atanacak hesap yöneticisi süreçlerini başlatmak için bizimle iletişime geçin.
                            </p>
                            <div className="bg-lime-400/10 border border-lime-400/20 rounded-lg p-5 flex flex-col md:flex-row items-center justify-between gap-4">
                                <div>
                                    <p className="font-medium text-zinc-200">İşletmenize özel SLA sözleşmesi hazırlayalım.</p>
                                    <p className="text-xs text-zinc-400 mt-0.5">Talebiniz bize ulaştıktan sonra 2 saat içinde dönüş yapıyoruz.</p>
                                </div>
                                <a
                                    href={`mailto:${DESTEK_EMAIL}?subject=Kurumsal Paket Teklif Talebi - ${kullanici?.tenantAd || ''}`}
                                    className="w-full md:w-auto text-center px-5 py-2.5 bg-lime-400 text-black font-semibold rounded-lg hover:bg-lime-300 transition-colors text-sm"
                                >
                                    Kurumsal Teklif İsteyin
                                </a>
                            </div>
                        </div>
                    ) : (
                        /* Standart Başlangıç & Profesyonel Havale Formu */
                        <div>
                            <h2 className="text-lg font-semibold text-zinc-100 mb-4">Ödeme Bilgileri</h2>

                            <div className="space-y-4">
                                <div className="bg-zinc-800/60 rounded-lg p-4 border border-zinc-800">
                                    <p className="text-xs text-zinc-400 mb-1">IBAN</p>
                                    <div className="flex items-center justify-between">
                                        <span className="text-zinc-100 font-mono text-sm sm:text-base tracking-wide">{IBAN}</span>
                                        <button
                                            onClick={ibanKopyala}
                                            className="text-xs text-lime-400 hover:text-lime-300 font-medium ml-4 shrink-0"
                                        >
                                            {kopyalandi ? '✓ Kopyalandı' : 'Kopyala'}
                                        </button>
                                    </div>
                                </div>

                                <div className="bg-zinc-800/60 rounded-lg p-4 border border-zinc-800">
                                    <p className="text-xs text-zinc-400 mb-1">Alıcı</p>
                                    <p className="text-zinc-100 font-medium">Yasin ALKAN</p>
                                </div>

                                <div className="bg-zinc-800/60 rounded-lg p-4 border border-zinc-800">
                                    <p className="text-xs text-zinc-400 mb-1">Açıklama (EFT/Havale yaparken zorunludur)</p>
                                    <div className="flex items-center justify-between">
                                        <span className="text-zinc-100 font-mono text-sm bg-zinc-900/60 px-2 py-1 rounded border border-zinc-700">
                                            {getAciklamaMetni()}
                                        </span>
                                        <button
                                            onClick={() => {
                                                navigator.clipboard.writeText(getAciklamaMetni());
                                                toast.success('Açıklama kopyalandı');
                                            }}
                                            className="text-xs text-lime-400 hover:text-lime-300 font-medium ml-4 shrink-0"
                                        >
                                            Kopyala
                                        </button>
                                    </div>
                                </div>

                                <div className="bg-lime-400/5 border border-lime-400/20 rounded-lg p-4">
                                    <p className="text-sm text-zinc-300 leading-relaxed">
                                        💡 Havale/EFT işlemini tamamladıktan sonra, sistem tanımlamanızın hızlandırılması için
                                        <a href={`mailto:${DESTEK_EMAIL}`} className="text-lime-400 underline mx-1 hover:text-lime-300">
                                            {DESTEK_EMAIL}
                                        </a>
                                        adresine bilgilendirme maili gönderebilirsiniz. Hesabınız en geç 24 saat içinde aktif edilir.
                                    </p>
                                </div>

                                <div className="bg-zinc-800/80 rounded-lg p-4 border border-zinc-700 flex justify-between items-center">
                                    <div>
                                        <p className="text-xs text-zinc-400">Seçilen Dönem</p>
                                        <p className="text-sm text-zinc-200 capitalize font-medium">{periyot === 'aylik' ? 'Aylık Ödeme' : 'Yıllık Ödeme (%17 İndirimli)'}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-xs text-zinc-400 mb-0.5">Toplam Ödenecek Tutar</p>
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