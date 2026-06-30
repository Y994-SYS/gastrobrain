import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import api from '../../services/api';
import useAuthStore from '../../store/auth.store';

const fmt = (n) => Number(n || 0).toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export default function GirisFaturasi() {
    const { kullanici } = useAuthStore();

    const bosUst = {
        subeId: kullanici?.subeId || '',
        tarih: new Date().toISOString().split('T')[0],
        cariKartId: '', aciklama: ''
    };
    const bosKalem = () => ({ stokKartId: '', miktar: '', birimFiyat: '', sonFiyat: null });

    const [ust, setUst] = useState(bosUst);
    const [kalemler, setKalemler] = useState([bosKalem()]);
    const [odeme, setOdeme] = useState('vadeli'); // 'vadeli' | 'pesin'
    const [stokKartlari, setStokKartlari] = useState([]);
    const [cariKartlar, setCariKartlar] = useState([]);
    const [yukleniyor, setYukleniyor] = useState(false);

    useEffect(() => {
        const getir = async () => {
            const [stokRes, cariRes] = await Promise.all([
                api.get('/api/stok-kartlari'),
                api.get('/api/cari-kartlar'),
            ]);
            setStokKartlari(stokRes.data.data);
            setCariKartlar(cariRes.data.data);
        };
        getir();
    }, []);

    const odemeSecimi = (tip) => {
        setOdeme(tip);
        if (tip === 'pesin') setUst(u => ({ ...u, cariKartId: '' }));
    };

    // Stok kartının son giriş fiyatını çek (stokKart objesinde varsa kullan, yoksa hareketlerden sorgula)
    const sonFiyatGetir = async (stokKartId, idx) => {
        try {
            const res = await api.get(`/api/stok/hareketler?stokKartId=${stokKartId}`);
            const hareketler = res.data.data || [];
            const sonGiris = hareketler.find(h => h.tip === 'GIRIS_FATURA' && h.birimFiyat);
            if (sonGiris) {
                kalemGuncelle(idx, 'sonFiyat', sonGiris.birimFiyat);
                // Birim fiyat alanı boşsa otomatik doldur
                setKalemler(prev => {
                    const yeni = [...prev];
                    if (!yeni[idx].birimFiyat) yeni[idx].birimFiyat = String(sonGiris.birimFiyat);
                    yeni[idx].sonFiyat = sonGiris.birimFiyat;
                    return yeni;
                });
            }
        } catch {
            // sessizce geç — son fiyat bulunamazsa sorun değil
        }
    };

    const kalemEkle = () => setKalemler([...kalemler, bosKalem()]);

    const kalemSil = (idx) => {
        if (kalemler.length === 1) return;
        setKalemler(kalemler.filter((_, i) => i !== idx));
    };

    const kalemGuncelle = (idx, alan, deger) => {
        setKalemler(prev => {
            const yeni = [...prev];
            yeni[idx] = { ...yeni[idx], [alan]: deger };
            return yeni;
        });
        if (alan === 'stokKartId' && deger) {
            sonFiyatGetir(deger, idx);
        }
    };

    const genelToplam = kalemler.reduce((t, k) => {
        const m = Number(k.miktar) || 0;
        const f = Number(k.birimFiyat) || 0;
        return t + m * f;
    }, 0);

    const kaydet = async () => {
        const gecerliKalemler = kalemler.filter(k => k.stokKartId && k.miktar && k.birimFiyat);
        if (!gecerliKalemler.length) {
            return toast.error('En az bir kalemde stok, miktar ve birim fiyat girilmeli');
        }
        if (gecerliKalemler.length !== kalemler.length) {
            return toast.error('Tüm kalemleri eksiksiz doldurun veya boş kalemleri silin');
        }

        setYukleniyor(true);
        try {
            // Her kalem için ayrı fatura kaydı — backend tekli endpoint kullanıyor
            await Promise.all(
                gecerliKalemler.map(k =>
                    api.post('/api/stok/giris-faturasi', {
                        stokKartId: k.stokKartId,
                        miktar: k.miktar,
                        birimFiyat: k.birimFiyat,
                        subeId: ust.subeId,
                        tarih: ust.tarih,
                        aciklama: ust.aciklama,
                        cariKartId: odeme === 'pesin' ? '' : ust.cariKartId,
                    })
                )
            );
            toast.success(
                `${gecerliKalemler.length} kalem ${odeme === 'pesin' ? 'peşin' : 'vadeli'} giriş faturası olarak kaydedildi`
            );
            setUst(bosUst);
            setKalemler([bosKalem()]);
            setOdeme('vadeli');
        } catch (err) {
            toast.error(err.response?.data?.mesaj || 'Hata oluştu');
        } finally {
            setYukleniyor(false);
        }
    };

    return (
        <div className="max-w-3xl">
            <div className="mb-6">
                <h1 className="text-xl font-bold text-white">Giriş Faturası</h1>
                <p className="text-zinc-500 text-sm mt-0.5">Tek faturada birden fazla stok kalemi girebilirsiniz</p>
            </div>

            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 space-y-5">

                {/* Ödeme Tipi Toggle */}
                <div>
                    <label className="text-zinc-400 text-sm mb-2 block">Ödeme Tipi</label>
                    <div className="flex gap-2">
                        <button
                            onClick={() => odemeSecimi('vadeli')}
                            className={`flex-1 py-2.5 rounded-lg text-sm font-semibold transition-all ${odeme === 'vadeli'
                                ? 'bg-orange-500/20 border border-orange-500/60 text-orange-300'
                                : 'bg-zinc-800 border border-zinc-700 text-zinc-400 hover:border-zinc-500'
                                }`}
                        >
                            📋 Vadeli
                        </button>
                        <button
                            onClick={() => odemeSecimi('pesin')}
                            className={`flex-1 py-2.5 rounded-lg text-sm font-semibold transition-all ${odeme === 'pesin'
                                ? 'bg-lime-400/20 border border-lime-400/60 text-lime-300'
                                : 'bg-zinc-800 border border-zinc-700 text-zinc-400 hover:border-zinc-500'
                                }`}
                        >
                            💵 Peşin
                        </button>
                    </div>
                    <p className="text-xs text-zinc-500 mt-1.5">
                        {odeme === 'vadeli'
                            ? 'Tedarikçi cari hesabına borç olarak işlenir'
                            : 'Nakit ödeme — cari hesaba işlenmez'}
                    </p>
                </div>

                {/* Fatura üst bilgileri */}
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="text-zinc-400 text-sm mb-1.5 block">Tarih</label>
                        <input
                            type="date"
                            value={ust.tarih}
                            onChange={(e) => setUst({ ...ust, tarih: e.target.value })}
                            className="w-full bg-zinc-800 border border-zinc-700 text-white rounded-lg px-4 py-2.5 text-sm outline-none focus:border-lime-400 transition-colors"
                        />
                    </div>

                    {odeme === 'vadeli' && (
                        <div>
                            <label className="text-zinc-400 text-sm mb-1.5 block">Tedarikçi (Cari)</label>
                            <select
                                value={ust.cariKartId}
                                onChange={(e) => setUst({ ...ust, cariKartId: e.target.value })}
                                className="w-full bg-zinc-800 border border-zinc-700 text-white rounded-lg px-4 py-2.5 text-sm outline-none focus:border-lime-400 transition-colors"
                            >
                                <option value="">Seç (isteğe bağlı)</option>
                                {cariKartlar.map((c) => (
                                    <option key={c.id} value={c.id}>{c.ad}</option>
                                ))}
                            </select>
                        </div>
                    )}

                    <div className="col-span-2">
                        <label className="text-zinc-400 text-sm mb-1.5 block">Açıklama</label>
                        <input
                            value={ust.aciklama}
                            onChange={(e) => setUst({ ...ust, aciklama: e.target.value })}
                            placeholder="Fatura no veya not (tüm kalemler için ortak)"
                            className="w-full bg-zinc-800 border border-zinc-700 text-white rounded-lg px-4 py-2.5 text-sm outline-none focus:border-lime-400 transition-colors"
                        />
                    </div>
                </div>

                {/* Kalemler */}
                <div>
                    <div className="flex items-center justify-between mb-2">
                        <label className="text-zinc-400 text-sm">Kalemler *</label>
                        <button
                            onClick={kalemEkle}
                            className="text-xs text-lime-400 hover:text-lime-300 transition-colors"
                        >
                            + Kalem Ekle
                        </button>
                    </div>

                    <div className="space-y-2">
                        {kalemler.map((k, idx) => {
                            const seciliStok = stokKartlari.find(s => s.id === Number(k.stokKartId));
                            const birim = seciliStok?.birim?.kisaltma || '';
                            const satirToplam = (Number(k.miktar) || 0) * (Number(k.birimFiyat) || 0);
                            const fiyatFarkli = k.sonFiyat != null && Number(k.birimFiyat) !== k.sonFiyat;

                            return (
                                <div key={idx} className="bg-zinc-800 rounded-lg p-3 space-y-2">
                                    <div className="flex gap-2">
                                        <select
                                            value={k.stokKartId}
                                            onChange={(e) => kalemGuncelle(idx, 'stokKartId', e.target.value)}
                                            className="flex-1 bg-zinc-700 border border-zinc-600 text-white rounded-lg px-3 py-2 text-sm outline-none focus:border-lime-400"
                                        >
                                            <option value="">Stok seç</option>
                                            {stokKartlari.map((s) => (
                                                <option key={s.id} value={s.id}>{s.ad} ({s.kod})</option>
                                            ))}
                                        </select>
                                        {kalemler.length > 1 && (
                                            <button
                                                onClick={() => kalemSil(idx)}
                                                className="text-red-400 hover:text-red-300 text-xs px-2"
                                            >
                                                Sil
                                            </button>
                                        )}
                                    </div>

                                    <div className="grid grid-cols-3 gap-2">
                                        <div>
                                            <label className="text-zinc-500 text-[11px] mb-1 block">
                                                Miktar {birim && `(${birim})`}
                                            </label>
                                            <input
                                                type="number"
                                                value={k.miktar}
                                                onChange={(e) => kalemGuncelle(idx, 'miktar', e.target.value)}
                                                placeholder="0"
                                                className="w-full bg-zinc-700 border border-zinc-600 text-white rounded-lg px-3 py-2 text-sm outline-none focus:border-lime-400"
                                            />
                                        </div>
                                        <div>
                                            <label className="text-zinc-500 text-[11px] mb-1 block">
                                                Birim Fiyat (₺)
                                                {k.sonFiyat != null && (
                                                    <span className="text-zinc-600 ml-1">— son: ₺{fmt(k.sonFiyat)}</span>
                                                )}
                                            </label>
                                            <input
                                                type="number"
                                                value={k.birimFiyat}
                                                onChange={(e) => kalemGuncelle(idx, 'birimFiyat', e.target.value)}
                                                placeholder="0.00"
                                                className={`w-full bg-zinc-700 border rounded-lg px-3 py-2 text-sm outline-none focus:border-lime-400 text-white ${fiyatFarkli ? 'border-yellow-500/50' : 'border-zinc-600'
                                                    }`}
                                            />
                                        </div>
                                        <div>
                                            <label className="text-zinc-500 text-[11px] mb-1 block">Satır Toplamı</label>
                                            <div className="w-full bg-zinc-900 border border-zinc-700 text-lime-400 font-mono rounded-lg px-3 py-2 text-sm">
                                                ₺{fmt(satirToplam)}
                                            </div>
                                        </div>
                                    </div>

                                    {fiyatFarkli && (
                                        <p className="text-yellow-400 text-[11px]">
                                            ⚠ Son alım fiyatından farklı — fiyat değişmiş olabilir
                                        </p>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Genel Toplam */}
                <div className="bg-zinc-800 rounded-xl p-4 flex justify-between items-center">
                    <span className="text-zinc-400 text-sm">Genel Toplam ({kalemler.length} kalem)</span>
                    <span className="text-white font-bold text-lg">₺{fmt(genelToplam)}</span>
                </div>

                <button
                    onClick={kaydet}
                    disabled={yukleniyor}
                    className="w-full bg-lime-400 hover:bg-lime-300 disabled:opacity-50 text-black font-bold rounded-lg py-2.5 text-sm transition-colors"
                >
                    {yukleniyor ? 'Kaydediliyor...' : 'Faturayı Kaydet'}
                </button>
            </div>
        </div>
    );
}