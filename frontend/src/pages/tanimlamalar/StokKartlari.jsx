import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import api from '../../services/api';
import Modal from '../../components/Modal';
import Table from '../../components/Table';

const bos = { kod: '', ad: '', aciklama: '', minStok: 0, kategoriId: '', birimId: '' };

export default function StokKartlari() {
    const [veri, setVeri] = useState([]);
    const [kategoriler, setKategoriler] = useState([]);
    const [birimler, setBirimler] = useState([]);
    const [modal, setModal] = useState(false);
    const [form, setForm] = useState(bos);
    const [duzenleId, setDuzenleId] = useState(null);
    const [yukleniyor, setYukleniyor] = useState(false);

    const getir = async () => {
        const [stokRes, katRes, birimRes] = await Promise.all([
            api.get('/api/stok-kartlari'),
            api.get('/api/kategoriler'),
            api.get('/api/olcu-birimleri'),
        ]);
        setVeri(stokRes.data.data);
        setKategoriler(katRes.data.data);
        setBirimler(birimRes.data.data);
    };

    useEffect(() => { getir(); }, []);

    const kaydet = async () => {
        if (!form.kod || !form.ad || !form.kategoriId || !form.birimId) {
            return toast.error('Zorunlu alanları doldurun');
        }
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
                toast.success('Güncellendi');
            } else {
                await api.post('/api/stok-kartlari', data);
                toast.success('Eklendi');
            }
            setModal(false);
            setForm(bos);
            setDuzenleId(null);
            getir();
        } catch (err) {
            toast.error(err.response?.data?.mesaj || 'Hata oluştu');
        } finally {
            setYukleniyor(false);
        }
    };

    const duzenle = (satir) => {
        setForm({
            kod: satir.kod,
            ad: satir.ad,
            aciklama: satir.aciklama || '',
            minStok: satir.minStok,
            kategoriId: satir.kategoriId,
            birimId: satir.birimId,
        });
        setDuzenleId(satir.id);
        setModal(true);
    };

    const sil = async (id) => {
        if (!confirm('Silmek istediğine emin misin?')) return;
        try {
            await api.delete(`/api/stok-kartlari/${id}`);
            toast.success('Silindi');
            getir();
        } catch (err) {
            toast.error(err.response?.data?.mesaj || 'Silinemedi');
        }
    };

    const kolonlar = [
        {
            key: 'kod', baslik: 'Kod', gizle: true, render: (r) => (
                <span className="bg-zinc-800 text-zinc-300 px-2 py-0.5 rounded text-xs font-mono">{r.kod}</span>
            )
        },
        { key: 'ad', baslik: 'Stok Adı' },                          // görünür
        {
            key: 'kategori', baslik: 'Kategori', gizle: true, render: (r) => (
                <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full" style={{ background: r.kategori?.renk }}></div>
                    <span>{r.kategori?.ad}</span>
                </div>
            )
        },
        { key: 'birim', baslik: 'Birim', render: (r) => r.birim?.kisaltma },
        { key: 'minStok', baslik: 'Min. Stok', gizle: true },
    ];

    return (
        <div>
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-xl font-bold text-white">Stok Kartları</h1>
                    <p className="text-zinc-500 text-sm mt-0.5">{veri.length} kayıt</p>
                </div>
                <button
                    onClick={() => { setForm(bos); setDuzenleId(null); setModal(true); }}
                    className="bg-lime-400 hover:bg-lime-300 text-black font-bold text-sm px-4 py-2 rounded-lg transition-colors"
                >
                    + Yeni Stok Kartı
                </button>
            </div>

            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl">
                <Table kolonlar={kolonlar} veri={veri} onDüzenle={duzenle} onSil={sil} />
            </div>

            {modal && (
                <Modal
                    baslik={duzenleId ? 'Stok Kartı Düzenle' : 'Yeni Stok Kartı'}
                    onKapat={() => setModal(false)}
                >
                    <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="text-zinc-400 text-sm mb-1.5 block">Kod *</label>
                                <input
                                    value={form.kod}
                                    onChange={(e) => setForm({ ...form, kod: e.target.value })}
                                    placeholder="örn. ET001"
                                    className="w-full bg-zinc-800 border border-zinc-700 text-white rounded-lg px-3 py-2.5 text-sm outline-none focus:border-lime-400 transition-colors"
                                />
                            </div>
                            <div>
                                <label className="text-zinc-400 text-sm mb-1.5 block">Min. Stok</label>
                                <input
                                    type="number"
                                    value={form.minStok}
                                    onChange={(e) => setForm({ ...form, minStok: e.target.value })}
                                    className="w-full bg-zinc-800 border border-zinc-700 text-white rounded-lg px-3 py-2.5 text-sm outline-none focus:border-lime-400 transition-colors"
                                />
                            </div>
                        </div>
                        <div>
                            <label className="text-zinc-400 text-sm mb-1.5 block">Stok Adı *</label>
                            <input
                                value={form.ad}
                                onChange={(e) => setForm({ ...form, ad: e.target.value })}
                                placeholder="örn. Dana Kıyma"
                                className="w-full bg-zinc-800 border border-zinc-700 text-white rounded-lg px-4 py-2.5 text-sm outline-none focus:border-lime-400 transition-colors"
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="text-zinc-400 text-sm mb-1.5 block">Kategori *</label>
                                <select
                                    value={form.kategoriId}
                                    onChange={(e) => setForm({ ...form, kategoriId: e.target.value })}
                                    className="w-full bg-zinc-800 border border-zinc-700 text-white rounded-lg px-3 py-2.5 text-sm outline-none focus:border-lime-400 transition-colors"
                                >
                                    <option value="">Seç</option>
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
                                    className="w-full bg-zinc-800 border border-zinc-700 text-white rounded-lg px-3 py-2.5 text-sm outline-none focus:border-lime-400 transition-colors"
                                >
                                    <option value="">Seç</option>
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
                                className="w-full bg-zinc-800 border border-zinc-700 text-white rounded-lg px-4 py-2.5 text-sm outline-none focus:border-lime-400 transition-colors"
                            />
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
        </div>
    );
}