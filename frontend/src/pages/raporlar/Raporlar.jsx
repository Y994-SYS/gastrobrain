import { useState } from 'react';
import api from '../../services/api';

const TABS = [
    { key: 'satis', label: 'Satış Raporu' },
    { key: 'stok', label: 'Stok Raporu' },
    { key: 'cari', label: 'Cari Raporu' },
    { key: 'maliyet', label: 'Maliyet Raporu' },
];

const fmt = (n) => Number(n || 0).toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export default function Raporlar() {
    const [aktifTab, setAktifTab] = useState('satis');
    const [baslangic, setBaslangic] = useState('');
    const [bitis, setBitis] = useState('');
    const [veri, setVeri] = useState(null);
    const [yukleniyor, setYukleniyor] = useState(false);
    const [hata, setHata] = useState('');

    const raporGetir = async () => {
        setYukleniyor(true);
        setHata('');
        setVeri(null);
        try {
            const params = new URLSearchParams();
            if (baslangic) params.append('baslangic', baslangic);
            if (bitis) params.append('bitis', bitis);
            const res = await api.get(`/api/raporlar/${aktifTab}?${params}`);

            setVeri(res.data);
        } catch (e) {
            setHata(e.response?.data?.hata || 'Rapor alınamadı');
        } finally {
            setYukleniyor(false);
        }
    };

    const excelIndir = () => {
        const token = localStorage.getItem('gastroiq_token');
        const params = new URLSearchParams({ tip: aktifTab });
        if (baslangic) params.append('baslangic', baslangic);
        if (bitis) params.append('bitis', bitis);
        const url = `${import.meta.env.VITE_API_URL}/api/raporlar/excel?${params}`;
        fetch(url, { headers: { Authorization: `Bearer ${token}` } })
            .then(r => r.blob())
            .then(blob => {
                const a = document.createElement('a');
                a.href = URL.createObjectURL(blob);
                a.download = `gastroiq_${aktifTab}_${new Date().toISOString().slice(0, 10)}.xlsx`;
                a.click();
            });
    };

    return (
        <div className="p-6 space-y-6">
            <h1 className="text-2xl font-bold text-white">Raporlar</h1>

            {/* Tab Menü */}
            <div className="flex gap-2 flex-wrap">
                {TABS.map(t => (
                    <button
                        key={t.key}
                        onClick={() => { setAktifTab(t.key); setVeri(null); }}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${aktifTab === t.key
                            ? 'bg-lime-400 text-zinc-900'
                            : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'
                            }`}
                    >
                        {t.label}
                    </button>
                ))}
            </div>

            {/* Filtreler */}
            <div className="bg-zinc-900 rounded-xl p-4 flex flex-wrap gap-4 items-end">
                {(aktifTab === 'satis' || aktifTab === 'cari') && (
                    <>
                        <div>
                            <label className="text-xs text-zinc-400 block mb-1">Başlangıç Tarihi</label>
                            <input
                                type="date"
                                value={baslangic}
                                onChange={e => setBaslangic(e.target.value)}
                                className="bg-zinc-800 text-white px-3 py-2 rounded-lg text-sm border border-zinc-700"
                            />
                        </div>
                        <div>
                            <label className="text-xs text-zinc-400 block mb-1">Bitiş Tarihi</label>
                            <input
                                type="date"
                                value={bitis}
                                onChange={e => setBitis(e.target.value)}
                                className="bg-zinc-800 text-white px-3 py-2 rounded-lg text-sm border border-zinc-700"
                            />
                        </div>
                    </>
                )}
                <button
                    onClick={raporGetir}
                    disabled={yukleniyor}
                    className="bg-lime-400 text-zinc-900 px-5 py-2 rounded-lg text-sm font-semibold hover:bg-lime-300 disabled:opacity-50"
                >
                    {yukleniyor ? 'Yükleniyor...' : 'Raporu Getir'}
                </button>
                {veri && (
                    <button
                        onClick={excelIndir}
                        className="bg-zinc-700 text-white px-5 py-2 rounded-lg text-sm font-semibold hover:bg-zinc-600 flex items-center gap-2"
                    >
                        <span>⬇</span> Excel İndir
                    </button>
                )}
            </div>

            {hata && <div className="bg-red-900/30 border border-red-700 text-red-300 px-4 py-3 rounded-lg">{hata}</div>}

            {/* SATIŞ RAPORU */}
            {aktifTab === 'satis' && veri && (
                <div className="space-y-4">
                    {/* Özet Kartlar */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <OzetKart baslik="Toplam Ciro" deger={`₺${fmt(veri.ozet.toplamCiro)}`} renk="lime" />
                        <OzetKart baslik="Toplam Adet" deger={veri.ozet.toplamAdet} renk="blue" />
                        <OzetKart baslik="Satış Kaydı" deger={veri.ozet.satisAdedi} renk="purple" />
                    </div>

                    {/* Reçete Bazlı */}
                    {veri.ozet.receteGrup.length > 0 && (
                        <div className="bg-zinc-900 rounded-xl p-4">
                            <h3 className="text-white font-semibold mb-3">Reçete Bazlı Satışlar</h3>
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="text-zinc-400 border-b border-zinc-800">
                                            <th className="text-left py-2">Reçete</th>
                                            <th className="text-right py-2">Adet</th>
                                            <th className="text-right py-2">Ciro</th>
                                            <th className="text-right py-2">Pay %</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {veri.ozet.receteGrup.map((r, i) => (
                                            <tr key={i} className="border-b border-zinc-800/50 text-zinc-300">
                                                <td className="py-2">{r.ad}</td>
                                                <td className="text-right">{r.adet}</td>
                                                <td className="text-right text-lime-400">₺{fmt(r.ciro)}</td>
                                                <td className="text-right">
                                                    {veri.ozet.toplamCiro > 0 ? ((r.ciro / veri.ozet.toplamCiro) * 100).toFixed(1) : 0}%
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {/* Satış Listesi */}
                    <div className="bg-zinc-900 rounded-xl p-4">
                        <h3 className="text-white font-semibold mb-3">Satış Detayları</h3>
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="text-zinc-400 border-b border-zinc-800">
                                        <th className="text-left py-2">Tarih</th>
                                        <th className="text-left py-2">Reçete</th>
                                        <th className="text-right py-2">Adet</th>
                                        <th className="text-right py-2">Birim Fiyat</th>
                                        <th className="text-right py-2">Toplam</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {veri.satislar.map(s => (
                                        <tr key={s.id} className="border-b border-zinc-800/50 text-zinc-300">
                                            <td className="py-2">{new Date(s.tarih).toLocaleDateString('tr-TR')}</td>
                                            <td>{s.recete.ad}</td>
                                            <td className="text-right">{s.adet}</td>
                                            <td className="text-right">₺{fmt(s.birimFiyat)}</td>
                                            <td className="text-right text-lime-400">₺{fmt(s.toplam)}</td>
                                        </tr>
                                    ))}
                                    {veri.satislar.length === 0 && (
                                        <tr><td colSpan={5} className="text-center text-zinc-500 py-6">Kayıt bulunamadı</td></tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}

            {/* STOK RAPORU */}
            {aktifTab === 'stok' && veri && (
                <div className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <OzetKart baslik="Toplam Stok Kartı" deger={veri.ozet.toplamKart} renk="blue" />
                        <OzetKart baslik="Kritik Stok" deger={veri.ozet.kritikSayisi} renk="red" />
                        <OzetKart baslik="Toplam Stok Değeri" deger={`₺${fmt(veri.ozet.toplamDeger)}`} renk="lime" />
                    </div>
                    <div className="bg-zinc-900 rounded-xl p-4">
                        <div className="flex justify-between items-center mb-3">
                            <h3 className="text-white font-semibold">Stok Durumu</h3>
                            <button
                                onClick={() => raporGetir()}
                                className="text-xs text-zinc-400 hover:text-white"
                            >
                                Tümünü Göster
                            </button>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="text-zinc-400 border-b border-zinc-800">
                                        <th className="text-left py-2">Kod</th>
                                        <th className="text-left py-2">Ad</th>
                                        <th className="text-left py-2">Kategori</th>
                                        <th className="text-right py-2">Mevcut</th>
                                        <th className="text-right py-2">Min</th>
                                        <th className="text-right py-2">Durum</th>
                                        <th className="text-right py-2">Stok Değeri</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {veri.stoklar.map(s => (
                                        <tr key={s.id} className="border-b border-zinc-800/50 text-zinc-300">
                                            <td className="py-2 text-zinc-500">{s.kod}</td>
                                            <td>{s.ad}</td>
                                            <td className="text-zinc-400">{s.kategori}</td>
                                            <td className="text-right">{s.mevcutStok} {s.birim}</td>
                                            <td className="text-right text-zinc-500">{s.minStok}</td>
                                            <td className="text-right">
                                                <span className={`px-2 py-0.5 rounded text-xs font-medium ${s.kritikMi ? 'bg-red-900/50 text-red-400' : 'bg-green-900/50 text-green-400'
                                                    }`}>
                                                    {s.kritikMi ? 'KRİTİK' : 'NORMAL'}
                                                </span>
                                            </td>
                                            <td className="text-right text-lime-400">₺{fmt(s.stokDegeri)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}

            {/* CARİ RAPORU */}
            {aktifTab === 'cari' && veri && (
                <div className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <OzetKart baslik="Toplam Borç" deger={`₺${fmt(veri.ozet.toplamBorc)}`} renk="red" />
                        <OzetKart baslik="Toplam Alacak" deger={`₺${fmt(veri.ozet.toplamAlacak)}`} renk="green" />
                        <OzetKart baslik="Net Bakiye" deger={`₺${fmt(veri.ozet.netBakiye)}`} renk="lime" />
                    </div>
                    <div className="bg-zinc-900 rounded-xl p-4">
                        <h3 className="text-white font-semibold mb-3">Cari Bakiyeler</h3>
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="text-zinc-400 border-b border-zinc-800">
                                        <th className="text-left py-2">Kod</th>
                                        <th className="text-left py-2">Cari Adı</th>
                                        <th className="text-left py-2">Telefon</th>
                                        <th className="text-right py-2">Hareket</th>
                                        <th className="text-right py-2">Bakiye</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {veri.bakiyeler.map(c => (
                                        <tr key={c.id} className="border-b border-zinc-800/50 text-zinc-300">
                                            <td className="py-2 text-zinc-500">{c.kod}</td>
                                            <td>{c.ad}</td>
                                            <td className="text-zinc-400">{c.telefon || '-'}</td>
                                            <td className="text-right">{c.hareketSayisi}</td>
                                            <td className={`text-right font-medium ${c.bakiye < 0 ? 'text-red-400' : c.bakiye > 0 ? 'text-green-400' : 'text-zinc-400'
                                                }`}>
                                                ₺{fmt(c.bakiye)}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}

            {/* MALİYET RAPORU */}
            {aktifTab === 'maliyet' && veri && (
                <div className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <OzetKart baslik="Reçete Sayısı" deger={veri.ozet.receteSayisi} renk="blue" />
                        <OzetKart baslik="Ort. Kâr Marjı" deger={`%${veri.ozet.ortalamaKarMarji}`} renk="lime" />
                    </div>
                    <div className="bg-zinc-900 rounded-xl p-4">
                        <h3 className="text-white font-semibold mb-3">Reçete Maliyet Analizi</h3>
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="text-zinc-400 border-b border-zinc-800">
                                        <th className="text-left py-2">Reçete</th>
                                        <th className="text-right py-2">Satış Fiyatı</th>
                                        <th className="text-right py-2">Maliyet</th>
                                        <th className="text-right py-2">Kâr</th>
                                        <th className="text-right py-2">Kâr %</th>
                                        <th className="text-right py-2">Top. Satış</th>
                                        <th className="text-right py-2">Top. Ciro</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {veri.maliyetler.map(m => (
                                        <tr key={m.id} className="border-b border-zinc-800/50 text-zinc-300">
                                            <td className="py-2 font-medium">{m.ad}</td>
                                            <td className="text-right">₺{fmt(m.satisFiyati)}</td>
                                            <td className="text-right text-red-400">₺{fmt(m.toplamMaliyet)}</td>
                                            <td className="text-right text-green-400">₺{fmt(m.karMiktari)}</td>
                                            <td className="text-right">
                                                <span className={`px-2 py-0.5 rounded text-xs font-medium ${m.karMarji >= 60 ? 'bg-green-900/50 text-green-400' :
                                                    m.karMarji >= 40 ? 'bg-yellow-900/50 text-yellow-400' :
                                                        'bg-red-900/50 text-red-400'
                                                    }`}>
                                                    %{m.karMarji}
                                                </span>
                                            </td>
                                            <td className="text-right">{m.toplamSatis}</td>
                                            <td className="text-right text-lime-400">₺{fmt(m.toplamCiro)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

function OzetKart({ baslik, deger, renk }) {
    const renkler = {
        lime: 'border-lime-400/30 text-lime-400',
        blue: 'border-blue-400/30 text-blue-400',
        red: 'border-red-400/30 text-red-400',
        green: 'border-green-400/30 text-green-400',
        purple: 'border-purple-400/30 text-purple-400',
    };
    return (
        <div className={`bg-zinc-900 rounded-xl p-4 border ${renkler[renk] || renkler.lime}`}>
            <p className="text-zinc-400 text-xs mb-1">{baslik}</p>
            <p className={`text-2xl font-bold ${renkler[renk]?.split(' ')[1]}`}>{deger}</p>
        </div>
    );
}