import { useState, useCallback } from 'react';
import toast from 'react-hot-toast';
import api from '../../services/api';
import SubeSecici from '../../components/SubeSecici';
import useSubeStore from '../../store/subeStore';

const fmt = (n) => Number(n || 0).toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const ayBasi = () => {
    const d = new Date();
    return new Date(d.getFullYear(), d.getMonth(), 1).toISOString().split('T')[0];
};
const bugun = () => new Date().toISOString().split('T')[0];

function OzetKart({ baslik, deger, alt, renk = 'text-white' }) {
    return (
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
            <div className="text-xs text-zinc-500 mb-1">{baslik}</div>
            <div className={`text-2xl font-black ${renk}`}>{deger}</div>
            {alt && <div className="text-xs text-zinc-500 mt-0.5">{alt}</div>}
        </div>
    );
}

// Gider kalemi satırı — toplam gidere göre yatay bar ile oran gösterir
function GiderSatiri({ etiket, tutar, toplamGider, ikon, not }) {
    const oran = toplamGider > 0 ? (tutar / toplamGider) * 100 : 0;
    return (
        <div className="px-4 py-3">
            <div className="flex justify-between items-center mb-1.5">
                <span className="text-sm text-zinc-300">{ikon} {etiket}</span>
                <span className="text-sm font-mono font-semibold text-white">₺{fmt(tutar)}</span>
            </div>
            <div className="h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                <div className="h-full bg-amber-400/70 rounded-full" style={{ width: `${Math.min(oran, 100)}%` }} />
            </div>
            <div className="flex justify-between items-center mt-1">
                <span className="text-xs text-zinc-600">{oran.toFixed(1)}% gider payı</span>
                {not && <span className="text-xs text-zinc-600">{not}</span>}
            </div>
        </div>
    );
}

export default function KarZarar() {
    const { seciliSubeId, subeler } = useSubeStore();

    const [baslangic, setBaslangic] = useState(ayBasi());
    const [bitis, setBitis] = useState(bugun());
    const [rapor, setRapor] = useState(null);
    const [yukleniyor, setYukleniyor] = useState(false);

    const goruntulenenSubeAdi = seciliSubeId
        ? subeler.find(s => s.id === seciliSubeId)?.ad
        : null;

    const raporuGetir = useCallback(async () => {
        if (!baslangic || !bitis) return toast.error('Başlangıç ve bitiş tarihi zorunlu');
        if (bitis < baslangic) return toast.error('Bitiş tarihi başlangıçtan önce olamaz');
        setYukleniyor(true);
        try {
            const subeParam = seciliSubeId ? `&subeId=${seciliSubeId}` : '';
            const res = await api.get(`/api/raporlar/kar-zarar?baslangic=${baslangic}&bitis=${bitis}${subeParam}`);
            setRapor(res.data);
        } catch (err) {
            toast.error(err.response?.data?.hata || 'Rapor alınamadı');
            setRapor(null);
        } finally {
            setYukleniyor(false);
        }
    }, [baslangic, bitis, seciliSubeId]);

    const inputCls = "bg-zinc-800 border border-zinc-700 text-white rounded-lg px-3 py-2 text-sm outline-none focus:border-lime-400 transition-colors";

    return (
        <div>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-5 gap-3">
                <div>
                    <h1 className="text-xl font-bold text-white">Kâr-Zarar</h1>
                    <p className="text-zinc-500 text-sm mt-0.5">
                        Gelir ve tüm giderlerin dönemsel karşılaştırması
                        {' — '}
                        <span className="text-zinc-400">{goruntulenenSubeAdi || 'Tüm Şubeler'}</span>
                    </p>
                </div>
            </div>

            <SubeSecici />

            {/* Tarih aralığı seçimi */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 mb-5 flex flex-wrap items-end gap-3">
                <div>
                    <label className="text-zinc-400 text-xs mb-1 block">Başlangıç</label>
                    <input type="date" value={baslangic} onChange={(e) => setBaslangic(e.target.value)} className={inputCls} />
                </div>
                <div>
                    <label className="text-zinc-400 text-xs mb-1 block">Bitiş</label>
                    <input type="date" value={bitis} onChange={(e) => setBitis(e.target.value)} className={inputCls} />
                </div>
                <button
                    onClick={raporuGetir}
                    disabled={yukleniyor}
                    className="bg-lime-400 hover:bg-lime-300 disabled:opacity-50 text-black font-bold text-sm px-4 py-2 rounded-lg transition-colors"
                >
                    {yukleniyor ? 'Getiriliyor...' : 'Raporu Getir'}
                </button>
            </div>

            {!rapor && !yukleniyor && (
                <div className="bg-zinc-900 border border-zinc-800 rounded-xl flex items-center justify-center h-40 text-zinc-500 text-sm">
                    Bir tarih aralığı seçip "Raporu Getir"e basın
                </div>
            )}

            {yukleniyor && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
                    {[1, 2, 3, 4].map(i => (
                        <div key={i} className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 animate-pulse">
                            <div className="h-3 w-20 bg-zinc-700 rounded mb-2.5" />
                            <div className="h-7 w-28 bg-zinc-700 rounded" />
                        </div>
                    ))}
                </div>
            )}

            {rapor && !yukleniyor && (
                <>
                    {/* Özet kartlar */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
                        <OzetKart
                            baslik="Toplam Gelir"
                            deger={`₺${fmt(rapor.ozet.toplamGelir)}`}
                            alt={`${rapor.gelir.satisAdedi} satış`}
                            renk="text-lime-400"
                        />
                        <OzetKart
                            baslik="Toplam Gider"
                            deger={`₺${fmt(rapor.ozet.toplamGider)}`}
                            alt="tüm gider kalemleri"
                            renk="text-amber-400"
                        />
                        <OzetKart
                            baslik="Net Kâr"
                            deger={`₺${fmt(rapor.ozet.netKar)}`}
                            alt="gelir − tüm giderler"
                            renk={rapor.ozet.netKar >= 0 ? 'text-lime-400' : 'text-red-400'}
                        />
                        <OzetKart
                            baslik="Net Kâr Marjı"
                            deger={`%${rapor.ozet.netKarMarji}`}
                            alt={`Brüt kâr: ₺${fmt(rapor.ozet.brutKar)} (%${rapor.ozet.brutKarMarji})`}
                            renk={rapor.ozet.netKarMarji >= 0 ? 'text-lime-400' : 'text-red-400'}
                        />
                    </div>

                    {/* Gider dağılımı */}
                    <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden mb-5">
                        <div className="p-3.5 border-b border-zinc-800">
                            <h2 className="text-sm font-bold text-white">Gider Dağılımı</h2>
                        </div>
                        <div className="divide-y divide-zinc-800">
                            <GiderSatiri
                                ikon="🍖" etiket="Ürün Maliyeti (COGS)"
                                tutar={rapor.giderler.maliyet} toplamGider={rapor.ozet.toplamGider}
                            />
                            <GiderSatiri
                                ikon="👥" etiket="Personel Maaşı (ödenen)"
                                tutar={rapor.giderler.personelMaas} toplamGider={rapor.ozet.toplamGider}
                            />
                            <GiderSatiri
                                ikon="🏦" etiket="Tedarikçi Ödemeleri"
                                tutar={rapor.giderler.tedarikciOdemeleri} toplamGider={rapor.ozet.toplamGider}
                                not={rapor.notlar?.cariTumIsletmeGeneli ? '(tüm işletme geneli)' : ''}
                            />
                            <GiderSatiri
                                ikon="🗑️" etiket="Zayi Gideri"
                                tutar={rapor.giderler.zayiGideri} toplamGider={rapor.ozet.toplamGider}
                            />
                        </div>
                    </div>

                    {/* Açıklayıcı notlar */}
                    <div className="bg-zinc-900/60 border border-zinc-800 rounded-xl p-4 space-y-1.5 text-xs text-zinc-500">
                        {rapor.notlar?.cariTumIsletmeGeneli && (
                            <p>ℹ️ Tedarikçi ödemeleri şubeye bölünemez — tedarikçiler tüm işletme ile çalışır, bu kalem her zaman tüm işletme genelini gösterir.</p>
                        )}
                        {rapor.notlar?.avansDahilDegil && (
                            <p>ℹ️ Personel avansları bu hesaba dahil edilmemiştir (avans daha sonra maaştan kesiliyorsa çifte sayım riskini önlemek için).</p>
                        )}
                        <p>ℹ️ Ürün maliyeti, reçetedeki malzemenin en son giriş fiyatı üzerinden hesaplanır — dönem içindeki fiyat değişimlerini geriye dönük yansıtmaz.</p>
                    </div>
                </>
            )}
        </div>
    );
}