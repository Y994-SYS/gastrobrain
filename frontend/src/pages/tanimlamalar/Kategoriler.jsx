import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import api from '../../services/api';
import Modal from '../../components/Modal';
import Table from '../../components/Table';

const TIPLER = [
    { deger: 'STOK', etiket: 'Stok Kategorileri' },
    { deger: 'RECETE', etiket: 'Reçete Kategorileri' },
];

const bosForm = (tip) => ({ ad: '', renk: '#4ADE80', tip });

export default function Kategoriler() {
    const [aktifTip, setAktifTip] = useState('STOK');
    const [veri, setVeri] = useState([]);
    const [modal, setModal] = useState(false);
    const [form, setForm] = useState(bosForm('STOK'));
    const [duzenleId, setDuzenleId] = useState(null);
    const [yukleniyor, setYukleniyor] = useState(false);

    const getir = async (tip) => {
        const res = await api.get(`/api/kategoriler?tip=${tip}`);
        setVeri(res.data.data);
    };

    useEffect(() => { getir(aktifTip); }, [aktifTip]);

    const kaydet = async () => {
        if (!form.ad) return toast.error('Ad zorunlu');
        setYukleniyor(true);
        try {
            if (duzenleId) {
                // Güncellemede tip gönderilmiyor — service katmanında zaten
                // reddediliyor, bir kategori tipini sonradan değiştirmek
                // ilişkili kayıtları (stokKart/recete) sahipsiz bırakabilir.
                const { tip, ...guncellenebilir } = form;
                await api.put(`/api/kategoriler/${duzenleId}`, guncellenebilir);
                toast.success('Güncellendi');
            } else {
                await api.post('/api/kategoriler', form);
                toast.success('Eklendi');
            }
            setModal(false);
            setForm(bosForm(aktifTip));
            setDuzenleId(null);
            getir(aktifTip);
        } catch (err) {
            toast.error(err.response?.data?.mesaj || 'Hata oluştu');
        } finally {
            setYukleniyor(false);
        }
    };

    const duzenle = (satir) => {
        setForm({ ad: satir.ad, renk: satir.renk || '#4ADE80', tip: satir.tip });
        setDuzenleId(satir.id);
        setModal(true);
    };

    const sil = async (satir) => {
        if (!confirm('Silmek istediğine emin misin?')) return;
        try {
            await api.delete(`/api/kategoriler/${satir.id}`);
            toast.success('Silindi');
            getir(aktifTip);
        } catch (err) {
            toast.error(err.response?.data?.mesaj || 'Silinemedi');
        }
    };

    const kolonlar = [
        {
            key: 'ad', baslik: 'Kategori Adı', render: (r) => (
                <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full shrink-0" style={{ background: r.renk }} />
                    <span>{r.ad}</span>
                </div>
            )
        },
    ];

    return (
        <div>
            <div className="flex items-center justify-between mb-4">
                <div>
                    <h1 className="text-xl font-bold text-white">Kategoriler</h1>
                    <p className="text-zinc-500 text-sm mt-0.5">{veri.length} kayıt</p>
                </div>
                <button
                    onClick={() => { setForm(bosForm(aktifTip)); setDuzenleId(null); setModal(true); }}
                    className="bg-lime-400 hover:bg-lime-300 text-black font-bold text-sm px-4 py-2 rounded-lg transition-colors"
                >
                    + Yeni Kategori
                </button>
            </div>

            {/* Tip sekmeleri */}
            <div className="flex gap-2 mb-4">
                {TIPLER.map((t) => (
                    <button
                        key={t.deger}
                        onClick={() => setAktifTip(t.deger)}
                        className={`text-sm font-semibold px-4 py-2 rounded-lg transition-colors ${aktifTip === t.deger
                            ? 'bg-lime-400 text-black'
                            : 'bg-zinc-800 text-zinc-400 hover:text-white'
                            }`}
                    >
                        {t.etiket}
                    </button>
                ))}
            </div>

            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl">
                <Table kolonlar={kolonlar} veri={veri} onDüzenle={duzenle} onSil={sil} />
            </div>

            {modal && (
                <Modal
                    baslik={duzenleId ? 'Kategori Düzenle' : `Yeni ${TIPLER.find(t => t.deger === form.tip)?.etiket.replace(' Kategorileri', ' Kategorisi')}`}
                    onKapat={() => setModal(false)}
                >
                    <div className="space-y-4">
                        <div>
                            <label className="text-zinc-400 text-sm mb-1.5 block">Kategori Adı</label>
                            <input
                                value={form.ad}
                                onChange={(e) => setForm({ ...form, ad: e.target.value })}
                                placeholder={form.tip === 'RECETE' ? 'örn. Çorbalar' : 'örn. Et & Tavuk'}
                                className="w-full bg-zinc-800 border border-zinc-700 text-white rounded-lg px-4 py-2.5 text-sm outline-none focus:border-lime-400 transition-colors"
                            />
                        </div>
                        <div>
                            <label className="text-zinc-400 text-sm mb-1.5 block">Renk</label>
                            <div className="flex items-center gap-3">
                                <input
                                    type="color"
                                    value={form.renk}
                                    onChange={(e) => setForm({ ...form, renk: e.target.value })}
                                    className="w-10 h-10 rounded cursor-pointer border-0 bg-transparent"
                                />
                                <span className="text-zinc-500 text-sm">{form.renk}</span>
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
        </div>
    );
}