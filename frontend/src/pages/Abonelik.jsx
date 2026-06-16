import { useState } from 'react';
import useAuthStore from '../store/auth.store';
import api from '../services/api';
import toast from 'react-hot-toast';

const PLANLAR = [
    {
        id: 'aylik',
        ad: 'Aylık Plan',
        fiyat: '₺799',
        periyot: '/ay',
        yillikFiyat: null,
        ozellikler: [
            'Tüm modüller',
            'Sınırsız kullanıcı',
            'Excel export',
            'E-posta destek',
        ]
    },
    {
        id: 'yillik',
        ad: 'Yıllık Plan',
        fiyat: '₺7.990',
        periyot: '/yıl',
        indirim: '%17 indirim',
        ozellikler: [
            'Tüm modüller',
            'Sınırsız kullanıcı',
            'Excel export',
            'Öncelikli destek',
            '2 ay ücretsiz',
        ]
    }
];

const IBAN = 'TR64 0006 2001 2620 0006 6629 79';

export default function Abonelik() {
    const { kullanici } = useAuthStore();
    const [secilenPlan, setSecilenPlan] = useState(null);
    const [kopyalandi, setKopyalandi] = useState(false);

    const ibanKopyala = () => {
        navigator.clipboard.writeText(IBAN.replace(/\s/g, ''));
        setKopyalandi(true);
        setTimeout(() => setKopyalandi(false), 2000);
        toast.success('IBAN kopyalandı');
    };

    return (
        <div className="max-w-3xl mx-auto p-6">
            <div className="mb-8">
                <h1 className="text-2xl font-semibold text-zinc-100 mb-2">Abonelik</h1>
                <p className="text-zinc-400">Lisansınızı yenilemek için plan seçin ve ödeme yapın.</p>
            </div>

            {/* Plan Seçimi */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
                {PLANLAR.map(plan => (
                    <div
                        key={plan.id}
                        onClick={() => setSecilenPlan(plan.id)}
                        className={`relative border rounded-xl p-6 cursor-pointer transition-all ${secilenPlan === plan.id
                            ? 'border-lime-400 bg-lime-400/5'
                            : 'border-zinc-800 bg-zinc-900 hover:border-zinc-600'
                            }`}
                    >
                        {plan.indirim && (
                            <span className="absolute top-4 right-4 text-xs bg-lime-400 text-black font-bold px-2 py-1 rounded-full">
                                {plan.indirim}
                            </span>
                        )}
                        <h3 className="text-lg font-semibold text-zinc-100 mb-1">{plan.ad}</h3>
                        <div className="flex items-baseline gap-1 mb-4">
                            <span className="text-3xl font-bold text-lime-400">{plan.fiyat}</span>
                            <span className="text-zinc-400 text-sm">{plan.periyot}</span>
                        </div>
                        <ul className="space-y-2">
                            {plan.ozellikler.map((o, i) => (
                                <li key={i} className="flex items-center gap-2 text-sm text-zinc-300">
                                    <span className="text-lime-400">✓</span> {o}
                                </li>
                            ))}
                        </ul>
                        {secilenPlan === plan.id && (
                            <div className="absolute top-4 left-4 w-3 h-3 bg-lime-400 rounded-full"></div>
                        )}
                    </div>
                ))}
            </div>

            {/* Ödeme Talimatları */}
            {secilenPlan && (
                <div className="border border-zinc-800 rounded-xl p-6 bg-zinc-900">
                    <h2 className="text-lg font-semibold text-zinc-100 mb-4">Ödeme Bilgileri</h2>

                    <div className="space-y-4">
                        <div className="bg-zinc-800 rounded-lg p-4">
                            <p className="text-xs text-zinc-400 mb-1">IBAN</p>
                            <div className="flex items-center justify-between">
                                <span className="text-zinc-100 font-mono">{IBAN}</span>
                                <button
                                    onClick={ibanKopyala}
                                    className="text-xs text-lime-400 hover:text-lime-300 ml-4"
                                >
                                    {kopyalandi ? '✓ Kopyalandı' : 'Kopyala'}
                                </button>
                            </div>
                        </div>

                        <div className="bg-zinc-800 rounded-lg p-4">
                            <p className="text-xs text-zinc-400 mb-1">Alıcı</p>
                            <p className="text-zinc-100">Yasin ALKAN</p>
                        </div>

                        <div className="bg-zinc-800 rounded-lg p-4">
                            <p className="text-xs text-zinc-400 mb-1">Açıklama (zorunlu)</p>
                            <div className="flex items-center justify-between">
                                <span className="text-zinc-100 font-mono">
                                    {kullanici?.tenantAd} - {secilenPlan === 'aylik' ? 'Aylık' : 'Yıllık'}
                                </span>
                                <button
                                    onClick={() => {
                                        navigator.clipboard.writeText(`${kullanici?.tenantAd} - ${secilenPlan === 'aylik' ? 'Aylık' : 'Yıllık'}`);
                                        toast.success('Açıklama kopyalandı');
                                    }}
                                    className="text-xs text-lime-400 hover:text-lime-300 ml-4"
                                >
                                    Kopyala
                                </button>
                            </div>
                        </div>

                        <div className="bg-lime-400/10 border border-lime-400/20 rounded-lg p-4">
                            <p className="text-sm text-zinc-300">
                                💡 Havale/EFT yaptıktan sonra
                                <a href={`mailto:${process.env.VITE_DESTEK_EMAIL || 'alkan.yazilim.dev@gmail.com'}`}
                                    className="text-lime-400 mx-1">
                                    destek@gastrobrain.com
                                </a>
                                adresine bildirim yapın. Lisansınız en geç 24 saat içinde aktifleştirilir.
                            </p>
                        </div>

                        <div className="bg-zinc-800 rounded-lg p-4">
                            <p className="text-xs text-zinc-400 mb-2">Ödenecek Tutar</p>
                            <p className="text-2xl font-bold text-lime-400">
                                {secilenPlan === 'aylik' ? '₺799' : '₺7.990'}
                            </p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}