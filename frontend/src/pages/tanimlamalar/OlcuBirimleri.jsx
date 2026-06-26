import { useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';
import api from '../../services/api';
import Modal from '../../components/Modal';
import Table from '../../components/Table';

const BOS_FORM = { ad: '', kisaltma: '' };

const inputCls = "w-full bg-zinc-800 border border-zinc-700 text-white rounded-lg px-4 py-2.5 text-sm outline-none focus:border-lime-400 transition-colors";

export default function OlcuBirimleri() {
    const [veri, setVeri] = useState([]);
    const [modal, setModal] = useState(false);
    const [form, setForm] = useState(BOS_FORM);
    const [duzenleId, setDuzenleId] = useState(null);
    const [yukleniyor, setYukleniyor] = useState(false);
    const [tabloYukleniyor, setTabloYukleniyor] = useState(true);
    const [silOnayId, setSilOnayId] = useState(null);

    const getir = useCallback(async () => {
        setTabloYukleniyor(true);
        try {
            const res = await api.get('/api/olcu-birimleri');
            setVeri(res.data.data);
        } catch {
            toast.error('Ölçü birimleri yüklenemedi');
        } finally {
            setTabloYukleniyor(false);
        }
    }, []);

    useEffect(() => { getir(); }, [getir]);

    const modalAc = (satir = null) => {
        if (satir) {
            setForm({ ad: satir.ad, kisaltma: satir.kisaltma });
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
        if (!form.ad || !form.kisaltma) return toast.error('Birim adı ve kısaltma zorunlu');
        setYukleniyor(true);
        try {
            if (duzenleId) {
                await api.put(`/api/olcu-birimleri/${duzenleId}`, form);
                toast.success('Birim güncellendi');
            } else {
                await api.post('/api/olcu-birimleri', form);
                toast.success('Birim eklendi');
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
            await api.delete(`/api/olcu-birimleri/${id}`);
            toast.success('Silindi');
            setSilOnayId(null);
            getir();
        } catch (err) {
            toast.error(err.response?.data?.mesaj || 'Silinemedi');
        }
    };

    const silOnayKart = veri.find(b => b.id === silOnayId);

    const kolonlar = [
        { key: 'ad', baslik: 'Birim Adı' },
        {
            key: 'kisaltma', baslik: 'Kısaltma',
            render: (r) => (
                <span className="bg-zinc-800 text-zinc-300 px-2 py-0.5 rounded text-xs font-mono">
                    {r.kisaltma}
                </span>
            )
        },
    ];

    return (
        <div>
            {/* Başlık */}
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-xl font-bold text-white">Ölçü Birimleri</h1>
                    <p className="text-zinc-500 text-sm mt-0.5">
                        {tabloYukleniyor ? 'Yükleniyor...' : `${veri.length} kayıt`}
                    </p>
                </div>
                <button
                    onClick={() => modalAc()}
                    className="bg-lime-400 hover:bg-lime-300 active:scale-95 text-black font-bold text-sm px-4 py-2 rounded-lg transition-all"
                >
                    + Yeni Birim
                </button>
            </div>

            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden">
                <Table
                    kolonlar={kolonlar}
                    veri={veri}
                    onDüzenle={(satir) => modalAc(satir)}
                    onSil={(satir) => setSilOnayId(satir.id)}
                    yukleniyor={tabloYukleniyor}
                />
                {!tabloYukleniyor && veri.length === 0 && (
                    <div className="text-center py-14">
                        <div className="text-3xl mb-2">⚖️</div>
                        <div className="text-zinc-500 text-sm">Henüz ölçü birimi eklenmemiş</div>
                    </div>
                )}
            </div>

            {/* Ekle / Düzenle Modal */}
            {modal && (
                <Modal
                    baslik={duzenleId ? 'Birim Düzenle' : 'Yeni Ölçü Birimi'}
                    onKapat={modalKapat}
                >
                    <div className="space-y-4">
                        <div>
                            <label className="text-zinc-400 text-sm mb-1.5 block">Birim Adı *</label>
                            <input
                                value={form.ad}
                                onChange={(e) => setForm({ ...form, ad: e.target.value })}
                                placeholder="Kilogram"
                                className={inputCls}
                                autoFocus
                            />
                        </div>
                        <div>
                            <label className="text-zinc-400 text-sm mb-1.5 block">Kısaltma *</label>
                            <input
                                value={form.kisaltma}
                                onChange={(e) => setForm({ ...form, kisaltma: e.target.value.toLowerCase() })}
                                placeholder="kg"
                                className={inputCls}
                            />
                            <p className="text-xs text-zinc-600 mt-1">Stok kartlarında ve raporlarda gösterilir.</p>
                        </div>
                        <button
                            onClick={kaydet}
                            disabled={yukleniyor || !form.ad || !form.kisaltma}
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
                        <h2 className="text-white font-bold">Birimi Sil</h2>
                        <p className="text-zinc-400 text-sm">
                            <span className="text-white font-medium">{silOnayKart?.ad}</span> birimini silmek istediğinize emin misiniz?
                            <span className="block mt-1 text-zinc-600 text-xs">Bu birime bağlı stok kartları etkilenebilir.</span>
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