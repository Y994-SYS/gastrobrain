import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import api from '../../services/api';
import Modal from '../../components/Modal';

const fmt = (n) => Number(n || 0).toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const fmt3 = (n) => Number(n || 0).toLocaleString('tr-TR', { minimumFractionDigits: 3, maximumFractionDigits: 3 });

export default function Receteler() {
    const [veri, setVeri] = useState([]);
    const [stokKartlari, setStokKartlari] = useState([]);
    const [modal, setModal] = useState(false);
    const [maliyetModal, setMaliyetModal] = useState(null);
    const [duzenleId, setDuzenleId] = useState(null);
    const [yukleniyor, setYukleniyor] = useState(false);

    // Kazan Hesabı için yeni stateler
    const [kazanModal, setKazanModal] = useState(false);
    const [kazanPorsiyon, setKazanPorsiyon] = useState('10'); // Varsayılan 10 porsiyon
    const [kazanKalemler, setKazanKalemler] = useState([]);

    const bosForm = { ad: '', aciklama: '', satisKodu: '', satisFiyati: '', kalemler: [] };
    const [form, setForm] = useState(bosForm);

    const getir = async () => {
        const [recRes, stokRes] = await Promise.all([
            api.get('/api/receteler'),
            api.get('/api/stok-kartlari'),
        ]);
        setVeri(recRes.data.data);
        setStokKartlari(stokRes.data.data);
    };

    useEffect(() => { getir(); }, []);

    const kalemEkle = () => {
        setForm({
            ...form,
            kalemler: [...form.kalemler, { stokKartId: '', miktar: '', carpan: '1', bolen: '1' }]
        });
    };

    const kalemGuncelle = (idx, alan, deger) => {
        const yeniKalemler = [...form.kalemler];
        yeniKalemler[idx][alan] = deger;
        setForm({ ...form, kalemler: yeniKalemler });
    };

    const kalemSil = (idx) => {
        setForm({ ...form, kalemler: form.kalemler.filter((_, i) => i !== idx) });
    };

    // Kazan Hesabı fonksiyonları
    const kazanKalemEkle = () => {
        setKazanKalemler([...kazanKalemler, { stokKartId: '', kazanMiktari: '' }]);
    };

    const kazanKalemGuncelle = (idx, alan, deger) => {
        const yeni = [...kazanKalemler];
        yeni[idx][alan] = deger;
        setKazanKalemler(yeni);
    };

    const kazanKalemSil = (idx) => {
        setKazanKalemler(kazanKalemler.filter((_, i) => i !== idx));
    };

    const kazanHesabiniUygula = () => {
        const porsiyon = Number(kazanPorsiyon);
        if (!porsiyon || porsiyon <= 0) return toast.error('Geçerli bir porsiyon sayısı girin');
        if (kazanKalemler.length === 0) return toast.error('En az bir kalem ekleyin');
        if (kazanKalemler.some(k => !k.stokKartId || !k.kazanMiktari)) return toast.error('Tüm kalemleri doldurun');

        // Kazan miktarlarını porsiyona bölüp ana forma aktar
        const aktarilacakKalemler = kazanKalemler.map(k => ({
            stokKartId: k.stokKartId,
            miktar: (Number(k.kazanMiktari) / porsiyon).toFixed(4),
            carpan: '1',
            bolen: '1'
        }));

        setForm({ ...form, kalemler: [...form.kalemler, ...aktarilacakKalemler] });
        setKazanModal(false);
        setKazanKalemler([]);
        toast.success('Kazan hesabı porsiyona bölünerek eklendi');
    };

    const kaydet = async () => {
        if (!form.ad) return toast.error('Reçete adı zorunlu');
        if (form.kalemler.length === 0) return toast.error('En az bir kalem ekle');
        if (form.kalemler.some(k => !k.stokKartId || !k.miktar)) {
            return toast.error('Tüm kalemleri doldurun');
        }
        setYukleniyor(true);
        try {
            if (duzenleId) {
                await api.put(`/api/receteler/${duzenleId}`, form);
                toast.success('Güncellendi');
            } else {
                await api.post('/api/receteler', form);
                toast.success('Reçete eklendi');
            }
            setModal(false);
            setForm(bosForm);
            setDuzenleId(null);
            getir();
        } catch (err) {
            toast.error(err.response?.data?.mesaj || 'Hata oluştu');
        } finally {
            setYukleniyor(false);
        }
    };

    const duzenle = (r) => {
        setForm({
            ad: r.ad,
            aciklama: r.aciklama || '',
            satisKodu: r.satisKodu || '',
            satisFiyati: r.satisFiyati || '',
            kalemler: r.kalemler.map(k => ({
                stokKartId: k.stokKartId,
                miktar: k.miktar,
                carpan: k.carpan,
                bolen: k.bolen,
            }))
        });
        setDuzenleId(r.id);
        setModal(true);
    };

    const sil = async (id) => {
        if (!confirm('Silmek istediğine emin misin?')) return;
        try {
            await api.delete(`/api/receteler/${id}`);
            toast.success('Silindi');
            getir();
        } catch (err) {
            toast.error(err.response?.data?.mesaj || 'Silinemedi');
        }
    };

    const maliyetGoster = async (id) => {
        try {
            const res = await api.get(`/api/receteler/${id}/maliyet`);
            setMaliyetModal(res.data.data);
        } catch (err) {
            toast.error('Maliyet hesaplanamadı');
        }
    };

    return (
        <div>
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-xl font-bold text-white">Reçeteler</h1>
                    <p className="text-zinc-500 text-sm mt-0.5">{veri.length} reçete</p>
                </div>
                <button
                    onClick={() => { setForm(bosForm); setDuzenleId(null); setModal(true); }}
                    className="bg-lime-400 hover:bg-lime-300 text-black font-bold text-sm px-4 py-2 rounded-lg transition-colors"
                >
                    + Yeni Reçete
                </button>
            </div>

            <div className="grid gap-4">
                {veri.length === 0 ? (
                    <div className="bg-zinc-900 border border-zinc-800 rounded-2xl text-center py-16 text-zinc-500 text-sm">
                        Henüz reçete yok
                    </div>
                ) : veri.map((r) => (
                    <div key={r.id} className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5">
                        <div className="flex items-start justify-between mb-3">
                            <div>
                                <h3 className="text-white font-bold">{r.ad}</h3>
                                <div className="flex gap-3 mt-1">
                                    {r.satisKodu && (
                                        <span className="text-xs bg-zinc-800 text-zinc-300 px-2 py-0.5 rounded font-mono">{r.satisKodu}</span>
                                    )}
                                    {r.satisFiyati && (
                                        <span className="text-xs text-lime-400">₺{fmt(r.satisFiyati)}</span>
                                    )}
                                </div>
                            </div>
                            <div className="flex gap-2">
                                <button
                                    onClick={() => maliyetGoster(r.id)}
                                    className="text-xs border border-zinc-700 text-zinc-400 hover:text-lime-400 hover:border-lime-400 px-3 py-1.5 rounded-lg transition-colors"
                                >
                                    💰 Maliyet
                                </button>
                                <button
                                    onClick={() => duzenle(r)}
                                    className="text-xs border border-zinc-700 text-zinc-400 hover:text-white px-3 py-1.5 rounded-lg transition-colors"
                                >
                                    Düzenle
                                </button>
                                <button
                                    onClick={() => sil(r.id)}
                                    className="text-xs border border-zinc-700 text-zinc-400 hover:text-red-400 hover:border-red-400 px-3 py-1.5 rounded-lg transition-colors"
                                >
                                    Sil
                                </button>
                            </div>
                        </div>
                        <div className="flex flex-wrap gap-2">
                            {r.kalemler.map((k, i) => (
                                <span key={i} className="text-xs bg-zinc-800 text-zinc-300 px-2 py-1 rounded-lg">
                                    {k.stokKart?.ad} — {fmt3(k.miktar)} {k.stokKart?.birim?.kisaltma}
                                    {(k.carpan !== 1 || k.bolen !== 1) && (
                                        <span className="text-zinc-500"> ×{k.carpan}/÷{k.bolen}</span>
                                    )}
                                </span>
                            ))}
                        </div>
                    </div>
                ))}
            </div>

            {/* Reçete Formu Modal */}
            {modal && (
                <Modal
                    baslik={duzenleId ? 'Reçete Düzenle' : 'Yeni Reçete'}
                    onKapat={() => setModal(false)}
                >
                    <div className="space-y-4 max-h-[500px] overflow-y-auto pr-1">
                        <div className="grid grid-cols-2 gap-3">
                            <div className="col-span-2">
                                <label className="text-zinc-400 text-sm mb-1.5 block">Reçete Adı *</label>
                                <input
                                    value={form.ad}
                                    onChange={(e) => setForm({ ...form, ad: e.target.value })}
                                    placeholder="örn. Adana Kebap"
                                    className="w-full bg-zinc-800 border border-zinc-700 text-white rounded-lg px-4 py-2.5 text-sm outline-none focus:border-lime-400 transition-colors"
                                />
                            </div>
                            <div>
                                <label className="text-zinc-400 text-sm mb-1.5 block">Satış Kodu</label>
                                <input
                                    value={form.satisKodu}
                                    onChange={(e) => setForm({ ...form, satisKodu: e.target.value })}
                                    placeholder="örn. AK001"
                                    className="w-full bg-zinc-800 border border-zinc-700 text-white rounded-lg px-3 py-2.5 text-sm outline-none focus:border-lime-400 transition-colors"
                                />
                            </div>
                            <div>
                                <label className="text-zinc-400 text-sm mb-1.5 block">Satış Fiyatı (₺)</label>
                                <input
                                    type="number"
                                    value={form.satisFiyati}
                                    onChange={(e) => setForm({ ...form, satisFiyati: e.target.value })}
                                    placeholder="0.00"
                                    className="w-full bg-zinc-800 border border-zinc-700 text-white rounded-lg px-3 py-2.5 text-sm outline-none focus:border-lime-400 transition-colors"
                                />
                            </div>
                        </div>

                        <div className="border-t border-zinc-800 pt-3">
                            <div className="flex items-center justify-between mb-1">
                                <label className="text-zinc-400 text-sm font-semibold">Kalemler *</label>
                                <div className="flex gap-3">
                                    <button
                                        onClick={() => { setKazanKalemler([]); setKazanModal(true); }}
                                        className="text-xs bg-zinc-800 hover:bg-zinc-700 text-lime-400 border border-zinc-700 px-2 py-1 rounded transition-colors"
                                    >
                                        🍳 Kazan Hesabı ile Doldur
                                    </button>
                                    <button
                                        onClick={kalemEkle}
                                        className="text-xs text-lime-400 hover:text-lime-300 transition-colors"
                                    >
                                        + Kalem Ekle
                                    </button>
                                </div>
                            </div>
                            <p className="text-zinc-600 text-xs mb-2">
                                Çarpan/Bölen genelde 1 kalır — sadece birim dönüşümü gerektiğinde değiştir.
                            </p>
                            <div className="space-y-2">
                                {form.kalemler.map((k, idx) => {
                                    const seciliStok = stokKartlari.find(s => s.id === Number(k.stokKartId));
                                    const birim = seciliStok?.birim?.kisaltma || '';
                                    return (
                                        <div key={idx} className="bg-zinc-800 rounded-lg p-3 space-y-2">
                                            <select
                                                value={k.stokKartId}
                                                onChange={(e) => kalemGuncelle(idx, 'stokKartId', e.target.value)}
                                                className="w-full bg-zinc-700 border border-zinc-600 text-white rounded-lg px-3 py-2 text-sm outline-none focus:border-lime-400"
                                            >
                                                <option value="">Stok seç</option>
                                                {stokKartlari.map((s) => (
                                                    <option key={s.id} value={s.id}>{s.ad} ({s.birim?.kisaltma})</option>
                                                ))}
                                            </select>
                                            <div className="grid grid-cols-4 gap-2 items-end">
                                                <div className="col-span-2">
                                                    <label className="text-zinc-500 text-[11px] mb-1 block">
                                                        Miktar {birim && `(${birim})`}
                                                    </label>
                                                    <input
                                                        type="number"
                                                        value={k.miktar}
                                                        onChange={(e) => kalemGuncelle(idx, 'miktar', e.target.value)}
                                                        placeholder="Miktar"
                                                        className="w-full bg-zinc-700 border border-zinc-600 text-white rounded-lg px-3 py-2 text-sm outline-none focus:border-lime-400"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="text-zinc-500 text-[11px] mb-1 block">
                                                        Çarpan ×
                                                    </label>
                                                    <input
                                                        type="number"
                                                        value={k.carpan}
                                                        onChange={(e) => kalemGuncelle(idx, 'carpan', e.target.value)}
                                                        placeholder="1"
                                                        className="w-full bg-zinc-700 border border-zinc-600 text-white rounded-lg px-3 py-2 text-sm outline-none focus:border-lime-400"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="text-zinc-500 text-[11px] mb-1 block">
                                                        Bölen ÷
                                                    </label>
                                                    <input
                                                        type="number"
                                                        value={k.bolen}
                                                        onChange={(e) => kalemGuncelle(idx, 'bolen', e.target.value)}
                                                        placeholder="1"
                                                        className="w-full bg-zinc-700 border border-zinc-600 text-white rounded-lg px-3 py-2 text-sm outline-none focus:border-lime-400"
                                                    />
                                                </div>
                                            </div>
                                            <button
                                                onClick={() => kalemSil(idx)}
                                                className="text-xs text-red-400 hover:text-red-300"
                                            >
                                                Kalemi Sil
                                            </button>
                                        </div>
                                    );
                                })}
                                {form.kalemler.length === 0 && (
                                    <div className="text-center py-4 text-zinc-500 text-xs border border-dashed border-zinc-700 rounded-lg">
                                        Henüz kalem yok — yukarıdan ekle veya kazan hesabını kullan
                                    </div>
                                )}
                            </div>
                        </div>

                        <button
                            onClick={kaydet}
                            disabled={yukleniyor}
                            className="w-full bg-lime-400 hover:bg-lime-300 disabled:opacity-50 text-black font-bold rounded-lg py-2.5 text-sm transition-colors"
                        >
                            {yukleniyor ? 'Kaydediliyor...' : 'Kaydet'}
                        </button>
                    </div>
                </Modal>
            )}

            {/* Kazan Hesabı Sihirbazı Modalı */}
            {kazanModal && (
                <Modal
                    baslik="🍳 Kazan Hesabı (Toplu Malzeme Girişi)"
                    onKapat={() => setKazanModal(false)}
                >
                    <div className="space-y-4 max-h-[450px] overflow-y-auto pr-1">
                        <div>
                            <label className="text-zinc-400 text-sm mb-1 block">Bu kazandan toplam kaç porsiyon çıkıyor? *</label>
                            <input
                                type="number"
                                value={kazanPorsiyon}
                                onChange={(e) => setKazanPorsiyon(e.target.value)}
                                placeholder="örn. 40"
                                className="w-full bg-zinc-800 border border-zinc-700 text-white rounded-lg px-4 py-2 text-sm outline-none focus:border-lime-400"
                            />
                        </div>

                        <div className="border-t border-zinc-800 pt-3">
                            <div className="flex items-center justify-between mb-2">
                                <label className="text-zinc-400 text-sm font-semibold">Kazana Atılan Toplam Malzemeler</label>
                                <button
                                    onClick={kazanKalemEkle}
                                    className="text-xs text-lime-400 hover:text-lime-300"
                                >
                                    + Malzeme Ekle
                                </button>
                            </div>

                            <div className="space-y-2">
                                {kazanKalemler.map((k, idx) => {
                                    const seciliStok = stokKartlari.find(s => s.id === Number(k.stokKartId));
                                    return (
                                        <div key={idx} className="bg-zinc-800 p-3 rounded-lg grid grid-cols-5 gap-2 items-center">
                                            <div className="col-span-3">
                                                <select
                                                    value={k.stokKartId}
                                                    onChange={(e) => kazanKalemGuncelle(idx, 'stokKartId', e.target.value)}
                                                    className="w-full bg-zinc-700 border border-zinc-600 text-white rounded-lg px-2 py-1.5 text-xs outline-none"
                                                >
                                                    <option value="">Malzeme seç</option>
                                                    {stokKartlari.map((s) => (
                                                        <option key={s.id} value={s.id}>{s.ad} ({s.birim?.kisaltma})</option>
                                                    ))}
                                                </select>
                                            </div>
                                            <div className="col-span-1">
                                                <input
                                                    type="number"
                                                    value={k.kazanMiktari}
                                                    onChange={(e) => kazanKalemGuncelle(idx, 'kazanMiktari', e.target.value)}
                                                    placeholder={seciliStok?.birim?.kisaltma || 'Miktar'}
                                                    className="w-full bg-zinc-700 border border-zinc-600 text-white rounded-lg px-2 py-1.5 text-xs outline-none"
                                                />
                                            </div>
                                            <div className="col-span-1 text-right">
                                                <button
                                                    onClick={() => kazanKalemSil(idx)}
                                                    className="text-xs text-red-400 hover:text-red-300"
                                                >
                                                    Sil
                                                </button>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        <button
                            onClick={kazanHesabiniUygula}
                            className="w-full bg-lime-400 hover:bg-lime-300 text-black font-bold rounded-lg py-2 text-sm transition-colors mt-2"
                        >
                            Böl ve Reçeteye Ekle
                        </button>
                    </div>
                </Modal>
            )}

            {/* Maliyet Modal */}
            {maliyetModal && (
                <Modal baslik="Reçete Maliyet Analizi" onKapat={() => setMaliyetModal(null)}>
                    <div className="space-y-3">
                        <h3 className="text-white font-bold">{maliyetModal.recete.ad}</h3>
                        <div className="space-y-2">
                            {maliyetModal.kalemMaliyetleri.map((k, i) => (
                                <div key={i} className="flex justify-between items-center py-2 border-b border-zinc-800">
                                    <div>
                                        <div className="text-sm text-white">{k.stokAd}</div>
                                        <div className="text-xs text-zinc-500">{fmt3(k.miktar)} {k.birim} × ₺{fmt(k.birimFiyat)}</div>
                                    </div>
                                    <span className="text-sm font-mono text-zinc-300">₺{fmt(k.toplam)}</span>
                                </div>
                            ))}
                        </div>
                        <div className="flex justify-between items-center pt-2">
                            <span className="text-zinc-400 font-semibold">Toplam Maliyet</span>
                            <span className="text-lime-400 font-bold text-lg">₺{fmt(maliyetModal.tophamMaliyet || maliyetModal.toplamMaliyet)}</span>
                        </div>
                        {maliyetModal.recete.satisFiyati && (
                            <div className="flex justify-between items-center bg-zinc-800 rounded-lg p-3">
                                <span className="text-zinc-400 text-sm">Kar Marjı</span>
                                <span className="text-lime-400 font-bold">
                                    %{(
                                        ((maliyetModal.recete.satisFiyati - (maliyetModal.tophamMaliyet || maliyetModal.toplamMaliyet)) /
                                            maliyetModal.recete.satisFiyati) * 100
                                    ).toFixed(1)}
                                </span>
                            </div>
                        )}
                    </div>
                </Modal>
            )}
        </div>
    );
}