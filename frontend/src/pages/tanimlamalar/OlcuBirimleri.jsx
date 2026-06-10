import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import api from '../../services/api';
import Modal from '../../components/Modal';
import Table from '../../components/Table';

const bos = { ad: '', kisaltma: '' };

export default function OlcuBirimleri() {
    const [veri, setVeri] = useState([]);
    const [modal, setModal] = useState(false);
    const [form, setForm] = useState(bos);
    const [duzenleId, setDuzenleId] = useState(null);
    const [yukleniyor, setYukleniyor] = useState(false);

    const getir = async () => {
        const res = await api.get('/api/olcu-birimleri');
        setVeri(res.data.data);
    };

    useEffect(() => { getir(); }, []);

    const kaydet = async () => {
        if (!form.ad || !form.kisaltma) return toast.error('Tüm alanlar zorunlu');
        setYukleniyor(true);
        try {
            if (duzenleId) {
                await api.put(`/api/olcu-birimleri/${duzenleId}`, form);
                toast.success('Güncellendi');
            } else {
                await api.post('/api/olcu-birimleri', form);
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
        setForm({ ad: satir.ad, kisaltma: satir.kisaltma });
        setDuzenleId(satir.id);
        setModal(true);
    };

    const sil = async (id) => {
        if (!confirm('Silmek istediğine emin misin?')) return;
        try {
            await api.delete(`/api/olcu-birimleri/${id}`);
            toast.success('Silindi');
            getir();
        } catch (err) {
            toast.error(err.response?.data?.mesaj || 'Silinemedi');
        }
    };

    const kolonlar = [
        { key: 'ad', baslik: 'Birim Adı' },
        {
            key: 'kisaltma', baslik: 'Kısaltma', render: (r) => (
                <span className="bg-zinc-800 text-zinc-300 px-2 py-0.5 rounded text-xs font-mono">
                    {r.kisaltma}
                </span>
            )
        },
    ];

    return (
        <div>
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-xl font-bold text-white">Ölçü Birimleri</h1>
                    <p className="text-zinc-500 text-sm mt-0.5">{veri.length} kayıt</p>
                </div>
                <button
                    onClick={() => { setForm(bos); setDuzenleId(null); setModal(true); }}
                    className="bg-lime-400 hover:bg-lime-300 text-black font-bold text-sm px-4 py-2 rounded-lg transition-colors"
                >
                    + Yeni Birim
                </button>
            </div>

            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl">
                <Table kolonlar={kolonlar} veri={veri} onDüzenle={duzenle} onSil={sil} />
            </div>

            {modal && (
                <Modal
                    baslik={duzenleId ? 'Birim Düzenle' : 'Yeni Ölçü Birimi'}
                    onKapat={() => setModal(false)}
                >
                    <div className="space-y-4">
                        <div>
                            <label className="text-zinc-400 text-sm mb-1.5 block">Birim Adı</label>
                            <input
                                value={form.ad}
                                onChange={(e) => setForm({ ...form, ad: e.target.value })}
                                placeholder="örn. Kilogram"
                                className="w-full bg-zinc-800 border border-zinc-700 text-white rounded-lg px-4 py-2.5 text-sm outline-none focus:border-lime-400 transition-colors"
                            />
                        </div>
                        <div>
                            <label className="text-zinc-400 text-sm mb-1.5 block">Kısaltma</label>
                            <input
                                value={form.kisaltma}
                                onChange={(e) => setForm({ ...form, kisaltma: e.target.value })}
                                placeholder="örn. kg"
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