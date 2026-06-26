import { useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';
import api from '../../services/api';
import Modal from '../../components/Modal';
import Table from '../../components/Table';

const BOS_FORM = { kod: '', ad: '', aciklama: '', minStok: 0, kategoriId: '', birimId: '' };

const inputCls = "w-full bg-zinc-800 border border-zinc-700 text-white rounded-lg px-3 py-2.5 text-sm outline-none focus:border-lime-400 transition-colors";

export default function StokKartlari() {
    const [veri, setVeri] = useState([]);
    const [kategoriler, setKategoriler] = useState([]);
    const [birimler, setBirimler] = useState([]);
    const [modal, setModal] = useState(false);
    const [form, setForm] = useState(BOS_FORM);
    const [duzenleId, setDuzenleId] = useState(null);
    const [yukleniyor, setYukleniyor] = useState(false);
    const [tabloYukleniyor, setTabloYukleniyor] = useState(true);
    const [silOnayId, setSilOnayId] = useState(null);
    const [arama, setArama] = useState('');

    const getir = useCallback(async () => {
        setTabloYukleniyor(true);
        try {
            const [stokRes, katRes, birimRes] = await Promise.all([
                api.get('/api/stok-kartlari'),
                api.get('/api/kategoriler'),
                api.get('/api/olcu-birimleri'),
            ]);
            setVeri(stokRes.data.data);
            setKategoriler(katRes.data.data);
            setBirimler(birimRes.data.data);
        } catch {
            toast.error('Veriler yüklenemedi');
        } finally {
            setTabloYukleniyor(false);
        }
    }, []);

    useEffect(() => { getir(); }, [getir]);

    const modalAc = (satir = null) => {
        if (satir) {
            setForm({
                kod: satir.kod, ad: satir.ad,
                aciklama: satir.aciklama || '',
                minStok: satir.minStok,
                kategoriId: satir.kategoriId,
                birimId: satir.birimId,
            });
            setDuzenleId(satir.id);
        } else {
            setForm(BOS_FORM);
            setDuzenleId(null);
        }
        setModal(true);
    };

    const modalKapat = () => {
        setModal(false);
        setForm(BOS_FORM);
        setDuzenleId(null);
    };

    const kaydet = async () => {
        if (!form.kod || !form.ad || !form.kategoriId || !form.birimId)
            return toast.error('Kod, ad, kategori ve birim zorunlu');
        setYukleniyor(true);
        try {
            const data = {
                ...form,
                kategoriId: Number(form.kategoriId),
                birimId: Number(form.birimId),
                minStok: Number(form.minStok),
            };
            if (duzenleId) {
                await api.put(`/api/stok-kartlari/${duzenleId}`, data);
                toast.success('Stok kartı güncellendi');
            } else {
                await api.post('/api/stok-kartlari', data);
                toast.success('Stok kartı eklendi');
            }
            modalKapat();
            getir();
        } catch (err) {
            toast.error(err.response?.data?.mesaj || 'Hata oluştu');
        } finally {
            setYukleniyor(false);
        }
    };

    const sil = async (id) => {
        try {
            await api.delete(`/api/stok-kartlari/${id}`);
            toast.success('Silindi');
            setSilOnayId(null);
            getir();
        } catch (err) {
            toast.error(err.response?.data?.mesaj || 'Silinemedi');
        }
    };

    // Arama filtresi
    const filtreliVeri = arama.trim()
        ? veri.filter(s =>
            s.ad.toLowerCase().includes(arama.toLowerCase()) ||
            s.kod.toLowerCase().includes(arama.toLowerCase()) ||
            s.kategori?.ad?.toLowerCase().includes(arama.toLowerCase())
        )
        : veri;

    const silOnayKart = veri.find(s => s.id === silOnayId);

    const kolonlar = [
        {
            key: 'kod', baslik: 'Kod', gizle: true,
            render: (r) => (
                <span className="bg-zinc-800 text-zinc-300 px-2 py-0.5 rounded text-xs font-mono">{r.kod}</span>
            )
        },
        { key: 'ad', baslik: 'Stok Adı' },
        {
            key: 'kategori', baslik: 'Kategori', gizle: true,
            render: (r) => (
                <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full shrink-0" style={{ background: r.kategori?.renk || '#71717a' }} />
                    <span>{r.kategori?.ad}</span>
                </div>
            )
        },
        { key: 'birim', baslik: 'Birim', render: (r) => r.birim?.kisaltma },
        { key: 'minStok', baslik: 'Min. Stok', gizle: true },
    ];

    return (
        <div>
            {/* Başlık */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-3">
                <div>
                    <h1 className="text-xl font-bold text-white">Stok Kartları</h1>
                    <p className="text-zinc-500 text-sm mt-0.5">
                        {tabloYukleniyor ? 'Yükleniyor...' : `${filtreliVeri.length} / ${veri.length} kayıt`}
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    {/* Arama */}
                    <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 text-sm">🔍</span>
                        <input
                            value={arama}
                            onChange={e => setArama(e.target.value)}
                            placeholder="Ara..."
                            className="bg-zinc-900 border border-zinc-800 text-white rounded-lg pl-8 pr-3 py-2 text-sm outline-none focus:border-lime-400 transition-colors w-40"
                        />
                    </div>
                    <button
                        onClick={() => modalAc()}
                        className="bg-lime-400 hover:bg-lime-300 active:scale-95 text-black font-bold text-sm px-4 py-2 rounded-lg transition-all whitespace-nowrap"
                    >
                        + Yeni Stok Kartı
                    </button>
                </div>
            </div>

            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden">
                <Table
                    kolonlar={kolonlar}
                    veri={filtreliVeri}
                    onDüzenle={(satir) => modalAc(satir)}
                    onSil={(satir) => setSilOnayId(satir.id)}
                    yukleniyor={tabloYukleniyor}
                />
                {!tabloYukleniyor && filtreliVeri.length === 0 && (
                    <div className="text-center py-14">
                        <div className="text-3xl mb-2">🗂️</div>
                        <div className="text-zinc-500 text-sm">
                            {arama ? `"${arama}" için sonuç bulunamadı` : 'Henüz stok kartı yok'}
                        </div>
                        {arama && (
                            <button onClick={() => setArama('')} className="text-xs text-lime-400 hover:text-lime-300 mt-2 transition-colors">
                                Aramayı temizle
                            </button>
                        )}
                    </div>
                )}
            </div>

            {/* Ekle / Düzenle Modal */}
            {modal && (
                <Modal
                    baslik={duzenleId ? 'Stok Kartı Düzenle' : 'Yeni Stok Kartı'}
                    onKapat={modalKapat}
                >
                    <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="text-zinc-400 text-sm mb-1.5 block">Kod *</label>
                                <input
                                    value={form.kod}
                                    onChange={(e) => setForm({ ...form, kod: e.target.value.toUpperCase() })}
                                    placeholder="ET001"
                                    className={inputCls}
                                    autoFocus
                                />
                            </div>
                            <div>
                                <label className="text-zinc-400 text-sm mb-1.5 block">Min. Stok</label>
                                <input
                                    type="number" min="0"
                                    value={form.minStok}
                                    onChange={(e) => setForm({ ...form, minStok: e.target.value })}
                                    className={inputCls}
                                />
                            </div>
                        </div>

                        <div>
                            <label className="text-zinc-400 text-sm mb-1.5 block">Stok Adı *</label>
                            <input
                                value={form.ad}
                                onChange={(e) => setForm({ ...form, ad: e.target.value })}
                                placeholder="Dana Kıyma"
                                className={inputCls}
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="text-zinc-400 text-sm mb-1.5 block">Kategori *</label>
                                <select
                                    value={form.kategoriId}
                                    onChange={(e) => setForm({ ...form, kategoriId: e.target.value })}
                                    className={inputCls}
                                >
                                    <option value="">— Seç —</option>
                                    {kategoriler.map((k) => (
                                        <option key={k.id} value={k.id}>{k.ad}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="text-zinc-400 text-sm mb-1.5 block">Birim *</label>
                                <select
                                    value={form.birimId}
                                    onChange={(e) => setForm({ ...form, birimId: e.target.value })}
                                    className={inputCls}
                                >
                                    <option value="">— Seç —</option>
                                    {birimler.map((b) => (
                                        <option key={b.id} value={b.id}>{b.ad} ({b.kisaltma})</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <div>
                            <label className="text-zinc-400 text-sm mb-1.5 block">Açıklama</label>
                            <input
                                value={form.aciklama}
                                onChange={(e) => setForm({ ...form, aciklama: e.target.value })}
                                placeholder="İsteğe bağlı"
                                className={inputCls}
                            />
                        </div>

                        <button
                            onClick={kaydet}
                            disabled={yukleniyor || !form.kod || !form.ad || !form.kategoriId || !form.birimId}
                            className="w-full bg-lime-400 hover:bg-lime-300 disabled:opacity-40 disabled:cursor-not-allowed text-black font-bold rounded-lg py-2.5 text-sm transition-colors"
                        >
                            {yukleniyor ? 'Kaydediliyor...' : 'Kaydet'}
                        </button>
                    </div>
                </Modal>
            )}

            {/* Silme Onay Modal */}
            {silOnayId && (
                <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
                    <div className="bg-zinc-900 rounded-2xl p-6 w-full max-w-sm border border-zinc-700 space-y-4">
                        <h2 className="text-white font-bold">Stok Kartını Sil</h2>
                        <p className="text-zinc-400 text-sm">
                            <span className="text-white font-medium">{silOnayKart?.ad}</span> stok kartını silmek istediğinize emin misiniz?
                            <span className="block mt-1 text-zinc-600 text-xs">Bu işlem geri alınamaz.</span>
                        </p>
                        <div className="flex gap-3">
                            <button onClick={() => setSilOnayId(null)} className="flex-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 py-2.5 rounded-lg text-sm transition-colors">
                                İptal
                            </button>
                            <button onClick={() => sil(silOnayId)} className="flex-1 bg-red-600 hover:bg-red-500 text-white py-2.5 rounded-lg text-sm font-semibold transition-colors">
                                Sil
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}