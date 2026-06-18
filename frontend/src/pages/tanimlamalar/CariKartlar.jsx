import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import api from '../../services/api';
import Modal from '../../components/Modal';
import Table from '../../components/Table';

const bos = { kod: '', ad: '', vergiNo: '', telefon: '', email: '', adres: '' };

export default function CariKartlar() {
    const [veri, setVeri] = useState([]);
    const [modal, setModal] = useState(false);
    const [form, setForm] = useState(bos);
    const [duzenleId, setDuzenleId] = useState(null);
    const [yukleniyor, setYukleniyor] = useState(false);

    const getir = async () => {
        const res = await api.get('/api/cari-kartlar');
        setVeri(res.data.data);
    };

    useEffect(() => { getir(); }, []);

    const kaydet = async () => {
        if (!form.kod || !form.ad) return toast.error('Kod ve ad zorunlu');
        setYukleniyor(true);
        try {
            if (duzenleId) {
                await api.put(`/api/cari-kartlar/${duzenleId}`, form);
                toast.success('Güncellendi');
            } else {
                await api.post('/api/cari-kartlar', form);
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
            vergiNo: satir.vergiNo || '',
            telefon: satir.telefon || '',
            email: satir.email || '',
            adres: satir.adres || '',
        });
        setDuzenleId(satir.id);
        setModal(true);
    };

    const sil = async (id) => {
        if (!confirm('Silmek istediğine emin misin?')) return;
        try {
            await api.delete(`/api/cari-kartlar/${id}`);
            toast.success('Silindi');
            getir();
        } catch (err) {
            toast.error(err.response?.data?.mesaj || 'Silinemedi');
        }
    };

    // kolonlar — gizlenecekler
    const kolonlar = [
        {
            key: 'kod', baslik: 'Kod', gizle: true, render: (r) => (
                <span className="bg-zinc-800 text-zinc-300 px-2 py-0.5 rounded text-xs font-mono">{r.kod}</span>
            )
        },
        { key: 'ad', baslik: 'Firma Adı' },
        { key: 'telefon', baslik: 'Telefon', gizle: true, render: (r) => r.telefon || '-' },
        { key: 'vergiNo', baslik: 'Vergi No', gizle: true, render: (r) => r.vergiNo || '-' },
        {
            key: 'aktif', baslik: 'Durum', render: (r) => (
                <span className={`text-xs px-2 py-0.5 rounded-full ${r.aktif ? 'bg-lime-400/10 text-lime-400' : 'bg-red-400/10 text-red-400'}`}>
                    {r.aktif ? 'Aktif' : 'Pasif'}
                </span>
            )
        },
    ];

    return (
        <div>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-3">
                <div>
                    <h1 className="text-xl font-bold text-white">Cari Kartlar</h1>
                    <p className="text-zinc-500 text-sm mt-0.5">{veri.length} kayıt</p>
                </div>
                <button
                    onClick={() => { setForm(bos); setDuzenleId(null); setModal(true); }}
                    className="bg-lime-400 hover:bg-lime-300 text-black font-bold text-sm px-4 py-2 rounded-lg transition-colors"
                >
                    + Yeni Cari Kart
                </button>
            </div>

            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl">
                <Table kolonlar={kolonlar} veri={veri} onDüzenle={duzenle} onSil={sil} />
            </div>

            {modal && (
                <Modal
                    baslik={duzenleId ? 'Cari Kart Düzenle' : 'Yeni Cari Kart'}
                    onKapat={() => setModal(false)}
                >
                    <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="text-zinc-400 text-sm mb-1.5 block">Kod *</label>
                                <input
                                    value={form.kod}
                                    onChange={(e) => setForm({ ...form, kod: e.target.value })}
                                    placeholder="örn. TED001"
                                    className="w-full bg-zinc-800 border border-zinc-700 text-white rounded-lg px-3 py-2.5 text-sm outline-none focus:border-lime-400 transition-colors"
                                />
                            </div>
                            <div>
                                <label className="text-zinc-400 text-sm mb-1.5 block">Vergi No</label>
                                <input
                                    value={form.vergiNo}
                                    onChange={(e) => setForm({ ...form, vergiNo: e.target.value })}
                                    placeholder="İsteğe bağlı"
                                    className="w-full bg-zinc-800 border border-zinc-700 text-white rounded-lg px-3 py-2.5 text-sm outline-none focus:border-lime-400 transition-colors"
                                />
                            </div>
                        </div>
                        <div>
                            <label className="text-zinc-400 text-sm mb-1.5 block">Firma Adı *</label>
                            <input
                                value={form.ad}
                                onChange={(e) => setForm({ ...form, ad: e.target.value })}
                                placeholder="örn. ABC Gıda Ltd."
                                className="w-full bg-zinc-800 border border-zinc-700 text-white rounded-lg px-4 py-2.5 text-sm outline-none focus:border-lime-400 transition-colors"
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="text-zinc-400 text-sm mb-1.5 block">Telefon</label>
                                <input
                                    value={form.telefon}
                                    onChange={(e) => setForm({ ...form, telefon: e.target.value })}
                                    placeholder="0212 000 00 00"
                                    className="w-full bg-zinc-800 border border-zinc-700 text-white rounded-lg px-3 py-2.5 text-sm outline-none focus:border-lime-400 transition-colors"
                                />
                            </div>
                            <div>
                                <label className="text-zinc-400 text-sm mb-1.5 block">Email</label>
                                <input
                                    value={form.email}
                                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                                    placeholder="info@firma.com"
                                    className="w-full bg-zinc-800 border border-zinc-700 text-white rounded-lg px-3 py-2.5 text-sm outline-none focus:border-lime-400 transition-colors"
                                />
                            </div>
                        </div>
                        <div>
                            <label className="text-zinc-400 text-sm mb-1.5 block">Adres</label>
                            <input
                                value={form.adres}
                                onChange={(e) => setForm({ ...form, adres: e.target.value })}
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