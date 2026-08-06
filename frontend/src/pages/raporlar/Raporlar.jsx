import { useState } from 'react';
import api from '../../services/api';
import SubeSecici from '../../components/SubeSecici';
import useSubeStore from '../../store/subeStore';
import toast from 'react-hot-toast';

const TABS = [
    { key: 'satis', label: 'Satış Raporu' },
    { key: 'stok', label: 'Stok Raporu' },
    { key: 'cari', label: 'Cari Raporu' },
    { key: 'maliyet', label: 'Maliyet Raporu' },
    { key: 'sube-karsilastirmasi', label: '📊 Şube Karşılaştırması' },
    { key: 'merkezmuhasebesi', label: '💰 Merkez Muhasebesi' },

];

const fmt = (n) => Number(n || 0).toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export default function Raporlar() {
    const [aktifTab, setAktifTab] = useState('satis');
    const [baslangic, setBaslangic] = useState('');
    const [bitis, setBitis] = useState('');
    const [veri, setVeri] = useState(null);
    const [yukleniyor, setYukleniyor] = useState(false);
    const [hata, setHata] = useState('');
    const { seciliSubeId } = useSubeStore();

    const raporGetir = async () => {
        setYukleniyor(true);
        setHata('');
        setVeri(null);
        try {
            const params = new URLSearchParams();
            if (baslangic) params.append('baslangic', baslangic);
            if (bitis) params.append('bitis', bitis);
            if (seciliSubeId) params.append('subeId', seciliSubeId);

            // merkezmuhasebesi için subeId parametresi gerekmez (merkez görüşü)
            const url = `/api/raporlar/${aktifTab}${aktifTab !== 'merkezmuhasebesi' ? `?${params}` : ''}`;

            const res = await api.get(url);
            setVeri(res.data);
        } catch (e) {
            setHata(e.response?.data?.hata || 'Rapor alınamadı');
        } finally {
            setYukleniyor(false);
        }
    };

    const excelIndir = async () => {
        try {
            const token = localStorage.getItem('gastroiq_token');
            const params = new URLSearchParams({ tip: aktifTab });
            if (baslangic) params.append('baslangic', baslangic);
            if (bitis) params.append('bitis', bitis);
            if (seciliSubeId) params.append('subeId', seciliSubeId);
            const url = `${import.meta.env.VITE_API_URL}/api/raporlar/excel?${params}`;

            const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });

            // Hata kontrolü — JSON hata mesajı mı yoksa Excel mi?
            const contentType = res.headers.get('content-type') || '';
            if (!res.ok || contentType.includes('application/json')) {
                const hataJson = await res.json();
                toast.error(hataJson.hata || hataJson.mesaj || 'Excel indirilemedi');
                return;
            }

            const blob = await res.blob();
            const a = document.createElement('a');
            a.href = URL.createObjectURL(blob);
            a.download = `gastrobrain_${aktifTab}_${new Date().toISOString().slice(0, 10)}.xlsx`;
            a.click();
            URL.revokeObjectURL(a.href);
        } catch (err) {
            toast.error('Excel indirilemedi');
            console.error(err);
        }
    };

    return (
        <div className="space-y-6">
            <h1 className="text-xl font-bold text-white">Raporlar</h1>

            <SubeSecici />

            <div className="flex gap-2 flex-wrap">
                {TABS.map(t => (
                    <button key={t.key} onClick={() => { setAktifTab(t.key); setVeri(null); }}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${aktifTab === t.key ? 'bg-lime-400 text-zinc-900' : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'}`}>
                        {t.label}
                    </button>
                ))}
            </div>

            <div className="bg-zinc-900 rounded-xl p-4 flex flex-wrap gap-4 items-end">
                {(aktifTab === 'satis' || aktifTab === 'cari') && (
                    <>
                        <div>
                            <label className="text-xs text-zinc-400 block mb-1">Başlangıç Tarihi</label>
                            <input type="date" value={baslangic} onChange={e => setBaslangic(e.target.value)} className="bg-zinc-800 text-white px-3 py-2 rounded-lg text-sm border border-zinc-700" />
                        </div>
                        <div>
                            <label className="text-xs text-zinc-400 block mb-1">Bitiş Tarihi</label>
                            <input type="date" value={bitis} onChange={e => setBitis(e.target.value)} className="bg-zinc-800 text-white px-3 py-2 rounded-lg text-sm border border-zinc-700" />
                        </div>
                    </>
                )}
                <button onClick={raporGetir} disabled={yukleniyor} className="bg-lime-400 text-zinc-900 px-5 py-2 rounded-lg text-sm font-semibold hover:bg-lime-300 disabled:opacity-50">
                    {yukleniyor ? 'Yükleniyor...' : 'Raporu Getir'}
                </button>
                {veri && (
                    <button onClick={excelIndir} className="bg-zinc-700 text-white px-5 py-2 rounded-lg text-sm font-semibold hover:bg-zinc-600 flex items-center gap-2">
                        <span>⬇</span> Excel İndir
                    </button>
                )}
            </div>

            {hata && <div className="bg-red-900/30 border border-red-700 text-red-300 px-4 py-3 rounded-lg">{hata}</div>}

            {aktifTab === 'satis' && veri && (
                <div className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <OzetKart baslik="Toplam Ciro" deger={`₺${fmt(veri.ozet?.toplamCiro)}`} renk="lime" />
                        <OzetKart baslik="Toplam Adet" deger={veri.ozet?.toplamAdet} renk="blue" />
                        <OzetKart baslik="Satış Kaydı" deger={veri.ozet?.satisAdedi} renk="purple" />
                    </div>
                    {veri.ozet?.subeGrup?.length > 1 && (
                        <div className="bg-zinc-900 rounded-xl p-4">
                            <h3 className="text-white font-semibold mb-3">Şube Bazlı Satışlar</h3>
                            <table className="w-full text-sm">
                                <thead><tr className="text-zinc-400 border-b border-zinc-800">
                                    <th className="text-left py-2">Şube</th>
                                    <th className="text-right py-2">Adet</th>
                                    <th className="text-right py-2">Ciro</th>
                                    <th className="text-right py-2">Pay %</th>
                                </tr></thead>
                                <tbody>
                                    {veri.ozet.subeGrup.map((s, i) => (
                                        <tr key={i} className="border-b border-zinc-800/50 text-zinc-300">
                                            <td className="py-2">{s.ad}</td>
                                            <td className="text-right">{s.adet}</td>
                                            <td className="text-right text-lime-400">₺{fmt(s.ciro)}</td>
                                            <td className="text-right">{veri.ozet.toplamCiro > 0 ? ((s.ciro / veri.ozet.toplamCiro) * 100).toFixed(1) : 0}%</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                    {veri.ozet?.receteGrup?.length > 0 && (
                        <div className="bg-zinc-900 rounded-xl p-4">
                            <h3 className="text-white font-semibold mb-3">Reçete Bazlı Satışlar</h3>
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead><tr className="text-zinc-400 border-b border-zinc-800">
                                        <th className="text-left py-2">Reçete</th><th className="text-right py-2">Adet</th>
                                        <th className="text-right py-2">Ciro</th><th className="text-right py-2">Pay %</th>
                                    </tr></thead>
                                    <tbody>
                                        {veri.ozet.receteGrup.map((r, i) => (
                                            <tr key={i} className="border-b border-zinc-800/50 text-zinc-300">
                                                <td className="py-2">{r.ad}</td><td className="text-right">{r.adet}</td>
                                                <td className="text-right text-lime-400">₺{fmt(r.ciro)}</td>
                                                <td className="text-right">{veri.ozet.toplamCiro > 0 ? ((r.ciro / veri.ozet.toplamCiro) * 100).toFixed(1) : 0}%</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
                    <div className="bg-zinc-900 rounded-xl p-4">
                        <h3 className="text-white font-semibold mb-3">Satış Detayları</h3>
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead><tr className="text-zinc-400 border-b border-zinc-800">
                                    <th className="text-left py-2">Tarih</th><th className="text-left py-2">Reçete</th>
                                    <th className="text-right py-2">Adet</th><th className="text-right py-2">Birim Fiyat</th>
                                    <th className="text-right py-2">Toplam</th>
                                </tr></thead>
                                <tbody>
                                    {(veri.satislar || []).map(s => (
                                        <tr key={s.id} className="border-b border-zinc-800/50 text-zinc-300">
                                            <td className="py-2">{new Date(s.tarih).toLocaleDateString('tr-TR')}</td>
                                            <td>{s.recete?.ad}</td><td className="text-right">{s.adet}</td>
                                            <td className="text-right">₺{fmt(s.birimFiyat)}</td>
                                            <td className="text-right text-lime-400">₺{fmt(s.toplam)}</td>
                                        </tr>
                                    ))}
                                    {!veri.satislar?.length && <tr><td colSpan={5} className="text-center text-zinc-500 py-6">Kayıt bulunamadı</td></tr>}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}

            {aktifTab === 'stok' && veri && (
                <div className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <OzetKart baslik="Toplam Stok Kartı" deger={veri.ozet?.toplamKart} renk="blue" />
                        <OzetKart baslik="Kritik Stok" deger={veri.ozet?.kritikSayisi} renk="red" />
                        <OzetKart baslik="Toplam Stok Değeri" deger={`₺${fmt(veri.ozet?.toplamDeger)}`} renk="lime" />
                    </div>
                    <div className="bg-zinc-900 rounded-xl p-4">
                        <h3 className="text-white font-semibold mb-3">Stok Durumu</h3>
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead><tr className="text-zinc-400 border-b border-zinc-800">
                                    <th className="text-left py-2">Kod</th><th className="text-left py-2">Ad</th>
                                    <th className="text-left py-2">Kategori</th><th className="text-right py-2">Mevcut</th>
                                    <th className="text-right py-2">Min</th><th className="text-right py-2">Durum</th>
                                    <th className="text-right py-2">Stok Değeri</th>
                                </tr></thead>
                                <tbody>
                                    {(veri.stoklar || []).map(s => (
                                        <tr key={s.id} className="border-b border-zinc-800/50 text-zinc-300">
                                            <td className="py-2 text-zinc-500">{s.kod}</td><td>{s.ad}</td>
                                            <td className="text-zinc-400">{s.kategori}</td>
                                            <td className="text-right">{s.mevcutStok} {s.birim}</td>
                                            <td className="text-right text-zinc-500">{s.minStok}</td>
                                            <td className="text-right">
                                                <span className={`px-2 py-0.5 rounded text-xs font-medium ${s.kritikMi ? 'bg-red-900/50 text-red-400' : 'bg-green-900/50 text-green-400'}`}>
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

            {aktifTab === 'cari' && veri && (
                <div className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <OzetKart baslik="Toplam Borç" deger={`₺${fmt(veri.ozet?.toplamBorc)}`} renk="red" />
                        <OzetKart baslik="Toplam Alacak" deger={`₺${fmt(veri.ozet?.toplamAlacak)}`} renk="green" />
                        <OzetKart baslik="Net Bakiye" deger={`₺${fmt(veri.ozet?.netBakiye)}`} renk="lime" />
                    </div>
                    <div className="bg-zinc-900 rounded-xl p-4">
                        <h3 className="text-white font-semibold mb-3">Cari Bakiyeler</h3>
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead><tr className="text-zinc-400 border-b border-zinc-800">
                                    <th className="text-left py-2">Kod</th><th className="text-left py-2">Cari Adı</th>
                                    <th className="text-left py-2">Telefon</th><th className="text-right py-2">Hareket</th>
                                    <th className="text-right py-2">Bakiye</th>
                                </tr></thead>
                                <tbody>
                                    {(veri.bakiyeler || []).map(c => (
                                        <tr key={c.id} className="border-b border-zinc-800/50 text-zinc-300">
                                            <td className="py-2 text-zinc-500">{c.kod}</td><td>{c.ad}</td>
                                            <td className="text-zinc-400">{c.telefon || '-'}</td>
                                            <td className="text-right">{c.hareketSayisi}</td>
                                            <td className={`text-right font-medium ${c.bakiye < 0 ? 'text-red-400' : c.bakiye > 0 ? 'text-green-400' : 'text-zinc-400'}`}>
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

            {aktifTab === 'maliyet' && veri && (
                <div className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <OzetKart baslik="Reçete Sayısı" deger={veri.ozet?.receteSayisi} renk="blue" />
                        <OzetKart baslik="Ort. Kâr Marjı" deger={`%${veri.ozet?.ortalamaKarMarji}`} renk="lime" />
                    </div>
                    <div className="bg-zinc-900 rounded-xl p-4">
                        <h3 className="text-white font-semibold mb-3">Reçete Maliyet Analizi</h3>
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead><tr className="text-zinc-400 border-b border-zinc-800">
                                    <th className="text-left py-2">Reçete</th><th className="text-right py-2">Satış Fiyatı</th>
                                    <th className="text-right py-2">Maliyet</th><th className="text-right py-2">Kâr</th>
                                    <th className="text-right py-2">Kâr %</th><th className="text-right py-2">Top. Satış</th>
                                    <th className="text-right py-2">Top. Ciro</th>
                                </tr></thead>
                                <tbody>
                                    {(veri.maliyetler || []).map(m => (
                                        <tr key={m.id} className="border-b border-zinc-800/50 text-zinc-300">
                                            <td className="py-2 font-medium">{m.ad}</td>
                                            <td className="text-right">₺{fmt(m.satisFiyati)}</td>
                                            <td className="text-right text-red-400">₺{fmt(m.toplamMaliyet)}</td>
                                            <td className="text-right text-green-400">₺{fmt(m.karMiktari)}</td>
                                            <td className="text-right">
                                                <span className={`px-2 py-0.5 rounded text-xs font-medium ${m.karMarji >= 60 ? 'bg-green-900/50 text-green-400' : m.karMarji >= 40 ? 'bg-yellow-900/50 text-yellow-400' : 'bg-red-900/50 text-red-400'}`}>
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

            {aktifTab === 'sube-karsilastirmasi' && veri && (
                <div className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                        <OzetKart baslik="Şube Sayısı" deger={veri.ozet?.toplamSubeSayisi} renk="blue" />
                        <OzetKart baslik="Toplam Ciro" deger={`₺${fmt(veri.ozet?.toplamCiro)}`} renk="lime" />
                        <OzetKart baslik="Toplam Kâr" deger={`₺${fmt(veri.ozet?.toplamKar)}`} renk="green" />
                        <OzetKart baslik="Ort. Kâr %" deger={`%${veri.ozet?.ortalamaKarMarji}`} renk="purple" />
                    </div>

                    {/* En İyi Şubeler Özet */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="bg-zinc-900 rounded-xl p-4 border border-lime-400/30">
                            <p className="text-zinc-400 text-xs mb-2">🏆 En Yüksek Satış</p>
                            <p className="text-white font-bold text-lg">{veri.enIyi?.enYuksekSatisSube}</p>
                        </div>
                        <div className="bg-zinc-900 rounded-xl p-4 border border-green-400/30">
                            <p className="text-zinc-400 text-xs mb-2">💰 En Yüksek Kâr %</p>
                            <p className="text-white font-bold text-lg">{veri.enIyi?.enYuksekKarSube}</p>
                        </div>
                        <div className="bg-zinc-900 rounded-xl p-4 border border-blue-400/30">
                            <p className="text-zinc-400 text-xs mb-2">✅ En Düşük Zayi %</p>
                            <p className="text-white font-bold text-lg">{veri.enIyi?.enDusukZayiSube}</p>
                        </div>
                    </div>

                    {/* Şubeler Karşılaştırma Tablosu */}
                    <div className="bg-zinc-900 rounded-xl p-4">
                        <h3 className="text-white font-semibold mb-3">Şube Detaylı Karşılaştırması</h3>
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="text-zinc-400 border-b border-zinc-800">
                                        <th className="text-left py-2">Şube</th>
                                        <th className="text-right py-2">Satış</th>
                                        <th className="text-right py-2">Adet</th>
                                        <th className="text-right py-2">Maliyet</th>
                                        <th className="text-right py-2">Kâr</th>
                                        <th className="text-right py-2">Kâr %</th>
                                        <th className="text-right py-2">Zayi %</th>
                                        <th className="text-right py-2">Personel</th>
                                        <th className="text-right py-2">Stok Değeri</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {(veri.subeler || []).map((s, i) => (
                                        <tr key={s.id} className={`border-b border-zinc-800/50 text-zinc-300 ${i === 0 ? 'bg-zinc-800/50' : ''}`}>
                                            <td className="py-2 font-medium">{s.ad}</td>
                                            <td className="text-right text-lime-400 font-semibold">₺{fmt(s.toplamSatis)}</td>
                                            <td className="text-right">{s.toplamAdet}</td>
                                            <td className="text-right text-red-400">₺{fmt(s.toplamMaliyet)}</td>
                                            <td className="text-right text-green-400 font-semibold">₺{fmt(s.kar)}</td>
                                            <td className="text-right">
                                                <span className={`px-2 py-0.5 rounded text-xs font-medium ${s.karMarji >= 70 ? 'bg-green-900/50 text-green-400'
                                                    : s.karMarji >= 50 ? 'bg-yellow-900/50 text-yellow-400'
                                                        : 'bg-red-900/50 text-red-400'
                                                    }`}>
                                                    %{s.karMarji}
                                                </span>
                                            </td>
                                            <td className="text-right">
                                                <span className={`px-2 py-0.5 rounded text-xs font-medium ${s.zayiOrani <= 2 ? 'bg-green-900/50 text-green-400'
                                                    : s.zayiOrani <= 4 ? 'bg-yellow-900/50 text-yellow-400'
                                                        : 'bg-red-900/50 text-red-400'
                                                    }`}>
                                                    %{s.zayiOrani}
                                                </span>
                                            </td>
                                            <td className="text-right">{s.personelSayisi}</td>
                                            <td className="text-right text-zinc-400">₺{fmt(s.toplamStokDegeri)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Performans İçgörüsü */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="bg-zinc-900 rounded-xl p-4 border border-zinc-700">
                            <h4 className="text-white font-semibold mb-3">💡 Öneriler</h4>
                            <ul className="space-y-2 text-sm text-zinc-300">
                                <li>• En iyi performans gösteren şubeyi diğerleriyle karşılaştırın</li>
                                <li>• Zayi oranı yüksek şubeleri optimize edin</li>
                                <li>• Kâr marjı düşük şubelerin stok politikasını gözden geçirin</li>
                                <li>• Personel verimliliğini şube bazında analiz edin</li>
                            </ul>
                        </div>
                        <div className="bg-zinc-900 rounded-xl p-4 border border-zinc-700">
                            <h4 className="text-white font-semibold mb-3">📈 Trend Analizi</h4>
                            <ul className="space-y-2 text-sm text-zinc-300">
                                <li>✓ Ciro: {veri.subeler.length > 0 && veri.subeler[0].toplamSatis > veri.ozet.toplamCiro / veri.subeler.length ? '📈 En yüksek şube lider' : '📊 Dengeli dağılım'}</li>
                                <li>✓ Kâr Marjı: Ortalama {veri.ozet?.ortalamaKarMarji}%</li>
                                <li>✓ Toplam Personel: {veri.ozet?.toplamPersonel} kişi</li>
                                <li>✓ Toplam Stok Değeri: ₺{fmt(veri.subeler.reduce((t, s) => t + s.toplamStokDegeri, 0))}</li>
                            </ul>
                        </div>
                    </div>
                </div>
            )}
            {aktifTab === 'merkezmuhasebesi' && veri && (
                <div className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                        <OzetKart baslik="Toplam Tedarikçi" deger={veri.ozet?.toplamTedarikci} renk="blue" />
                        <OzetKart baslik="Toplam Borç" deger={`₺${fmt(veri.ozet?.toplamBorc)}`} renk="red" />
                        <OzetKart baslik="Toplam Alacak" deger={`₺${fmt(veri.ozet?.toplamAlacak)}`} renk="green" />
                        <OzetKart baslik="Net Bakiye" deger={`₺${fmt(veri.ozet?.netToplam)}`} renk="lime" />
                    </div>

                    {/* Uyarı Kutuları */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {veri.ozet?.borcletedarikci > 0 && (
                            <div className="bg-red-900/20 border border-red-700 rounded-lg p-4">
                                <p className="text-red-300 text-sm">
                                    <strong>⚠️ {veri.ozet.borcletedarikci} tedarikçiye toplam ₺{fmt(veri.ozet.toplamBorc)} borç</strong>
                                </p>
                            </div>
                        )}
                        {veri.ozet?.alacakliTedarikci > 0 && (
                            <div className="bg-green-900/20 border border-green-700 rounded-lg p-4">
                                <p className="text-green-300 text-sm">
                                    <strong>✓ {veri.ozet.alacakliTedarikci} tedarikçiden toplam ₺{fmt(veri.ozet.toplamAlacak)} alacak</strong>
                                </p>
                            </div>
                        )}
                    </div>

                    {/* Tedarikçi Tablosu */}
                    <div className="bg-zinc-900 rounded-xl p-4">
                        <h3 className="text-white font-semibold mb-3">Tedarikçi Merkezî Muhasebesi</h3>
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="text-zinc-400 border-b border-zinc-800">
                                        <th className="text-left py-2">Kod</th>
                                        <th className="text-left py-2">Tedarikçi Adı</th>
                                        <th className="text-left py-2">Telefon</th>
                                        <th className="text-right py-2">Borç</th>
                                        <th className="text-right py-2">Alacak</th>
                                        <th className="text-right py-2">Net Bakiye</th>
                                        <th className="text-center py-2">Durum</th>
                                        <th className="text-right py-2">İşlem</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {(veri.tedarikciler || []).map(t => (
                                        <tr key={t.id} className="border-b border-zinc-800/50 text-zinc-300 hover:bg-zinc-800/30">
                                            <td className="py-2 text-zinc-500 font-mono">{t.kod}</td>
                                            <td className="py-2 font-medium">{t.ad}</td>
                                            <td className="py-2 text-zinc-400">{t.telefon || '-'}</td>
                                            <td className="text-right py-2 text-red-400">₺{fmt(t.toplamBorc)}</td>
                                            <td className="text-right py-2 text-green-400">₺{fmt(t.toplamAlacak)}</td>
                                            <td className={`text-right py-2 font-bold ${t.netBakiye < 0 ? 'text-red-400'
                                                    : t.netBakiye > 0 ? 'text-green-400'
                                                        : 'text-zinc-400'
                                                }`}>
                                                ₺{fmt(t.netBakiye)}
                                            </td>
                                            <td className="text-center py-2">
                                                <span className={`px-2 py-0.5 rounded text-xs font-bold ${t.durum === 'BORÇLU' ? 'bg-red-900/50 text-red-300'
                                                        : t.durum === 'ALACAKLI' ? 'bg-green-900/50 text-green-300'
                                                            : 'bg-zinc-700 text-zinc-300'
                                                    }`}>
                                                    {t.durum}
                                                </span>
                                            </td>
                                            <td className="text-right py-2">
                                                <a href={`mailto:${t.email}`} className="text-lime-400 hover:text-lime-300 text-xs">
                                                    ✉️
                                                </a>
                                            </td>
                                        </tr>
                                    ))}
                                    {!veri.tedarikciler?.length && (
                                        <tr>
                                            <td colSpan={8} className="text-center text-zinc-500 py-6">
                                                Kayıt bulunamadı
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* İstatistikler */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="bg-zinc-900 rounded-xl p-4 border border-zinc-700">
                            <h4 className="text-white font-semibold mb-3">📊 Muhasebe Özeti</h4>
                            <ul className="space-y-2 text-sm text-zinc-300">
                                <li>• Toplam Tedarikçi: <strong>{veri.ozet?.toplamTedarikci}</strong></li>
                                <li>• Ödeme Bekleyen: <strong className="text-red-400">{veri.ozet?.borcletedarikci}</strong></li>
                                <li>• Para Alınacak: <strong className="text-green-400">{veri.ozet?.alacakliTedarikci}</strong></li>
                                <li>• Net Durumu: <strong className={veri.ozet?.netToplam < 0 ? 'text-red-400' : 'text-green-400'}>
                                    {veri.ozet?.netToplam < 0 ? '₺' + fmt(Math.abs(veri.ozet.netToplam)) + ' BORÇLU' : '₺' + fmt(veri.ozet?.netToplam) + ' ALACAKLI'}
                                </strong></li>
                            </ul>
                        </div>

                        <div className="bg-zinc-900 rounded-xl p-4 border border-zinc-700">
                            <h4 className="text-white font-semibold mb-3">💡 Öneriler</h4>
                            <ul className="space-y-2 text-sm text-zinc-300">
                                <li>• En yüksek borçlu tedarikçileri kontrol edin</li>
                                <li>• Ödeme vadesi geçmiş faturaları listeleyin</li>
                                <li>• Tedarikçi hazine yönetimi için plan yapın</li>
                                <li>• Haftalık/aylık reconciliation yapın</li>
                            </ul>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

function OzetKart({ baslik, deger, renk }) {
    const renkler = { lime: 'border-lime-400/30 text-lime-400', blue: 'border-blue-400/30 text-blue-400', red: 'border-red-400/30 text-red-400', green: 'border-green-400/30 text-green-400', purple: 'border-purple-400/30 text-purple-400' };
    return (
        <div className={`bg-zinc-900 rounded-xl p-4 border ${renkler[renk] || renkler.lime}`}>
            <p className="text-zinc-400 text-xs mb-1">{baslik}</p>
            <p className={`text-2xl font-bold ${renkler[renk]?.split(' ')[1]}`}>{deger}</p>
        </div>
    );
}