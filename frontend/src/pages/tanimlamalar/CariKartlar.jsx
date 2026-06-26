import { useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';
import api from '../../services/api';
import Modal from '../../components/Modal';
import Table from '../../components/Table';

const BOS_FORM = { kod: '', ad: '', vergiNo: '', telefon: '', email: '', adres: '' };

const inputCls = "w-full bg-zinc-800 border border-zinc-700 text-white rounded-lg px-3 py-2.5 text-sm outline-none focus:border-lime-400 transition-colors";

export default function CariKartlar() {
    const [veri, setVeri] = useState([]);
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
            const res = await api.get('/api/cari-kartlar');
            setVeri(res.data.data);
        } catch {
            toast.error('Cari kartlar yüklenemedi');
        } finally {
            setTabloYukleniyor(false);
        }
    }, []);

    useEffect(() => { getir(); }, [getir]);

    const modalAc = (satir = null) => {
        if (satir) {
            setForm({
                kod: satir.kod, ad: satir.ad,
                vergiNo: satir.vergiNo || '',
                telefon: satir.telefon || '',
                email: satir.email || '',
                adres: satir.adres || '',
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
        if (!form.kod || !form.ad) return toast.error('Kod ve firma adı zorunlu');
        setYukleniyor(true);
        try {
            if (duzenleId) {
                await api.put(`/api/cari-kartlar/${duzenleId}`, form);
                toast.success('Cari kart güncellendi');
            } else {
                await api.post('/api/cari-kartlar', form);
                toast.success('Cari kart eklendi');
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
            await api.delete(`/api/cari-kartlar/${id}`);
            toast.success('Silindi');
            setSilOnayId(null);
            getir();
        } catch (err) {
            toast.error(err.response?.data?.mesaj || 'Silinemedi');
        }
    };

    const filtreliVeri = arama.trim()
        ? veri.filter(c =>
            c.ad.toLowerCase().includes(arama.toLowerCase()) ||
            c.kod.toLowerCase().includes(arama.toLowerCase()) ||
            c.telefon?.toLowerCase().includes(arama.toLowerCase())
        )
        : veri;

    const silOnayKart = veri.find(c => c.id === silOnayId);

    const kolonlar = [
        {
            key: 'kod', baslik: 'Kod', gizle: true,
            render: (r) => (
                <span className="bg-zinc-800 text-zinc-300 px-2 py-0.5 rounded text-xs font-mono">{r.kod}</span>
            )
        },
        { key: 'ad', baslik: 'Firma Adı' },
        { key: 'telefon', baslik: 'Telefon', gizle: true, render: (r) => r.telefon || '—' },
        { key: 'vergiNo', baslik: 'Vergi No', gizle: true, render: (r) => r.vergiNo || '—' },
        {
            key: 'aktif', baslik: 'Durum',
            render: (r) => (
                <span className={`text-xs px-2 py-0.5 rounded-full ${r.aktif ? 'bg-lime-400/10 text-lime-400' : 'bg-red-400/10 text-red-400'}`}>
                    {r.aktif ? 'Aktif' : 'Pasif'}
                </span>
            )
        },
    ];

    return (
        <div>
            {/* Başlık */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-3">
                <div>
                    <h1 className="text-xl font-bold text-white">Cari Kartlar</h1>
                    <p className="text-zinc-500 text-sm mt-0.5">
                        {tabloYukleniyor ? 'Yükleniyor...' : `${filtreliVeri.length} / ${veri.length} kayıt`}
                    </p>
                </div>
                <div className="flex items-center gap-2">
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
                        + Yeni Cari Kart
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
                        <div className="text-3xl mb-2">🏢</div>
                        <div className="text-zinc-500 text-sm">
                            {arama ? `"${arama}" için sonuç bulunamadı` : 'Henüz cari kart yok'}
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
                    baslik={duzenleId ? 'Cari Kart Düzenle' : 'Yeni Cari Kart'}
                    onKapat={modalKapat}
                >
                    <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="text-zinc-400 text-sm mb-1.5 block">Kod *</label>
                                <input
                                    value={form.kod}
                                    onChange={(e) => setForm({ ...form, kod: e.target.value.toUpperCase() })}
                                    placeholder="TED001"
                                    className={inputCls}
                                    autoFocus
                                />
                            </div>
                            <div>
                                <label className="text-zinc-400 text-sm mb-1.5 block">Vergi No</label>
                                <input
                                    value={form.vergiNo}
                                    onChange={(e) => setForm({ ...form, vergiNo: e.target.value })}
                                    placeholder="İsteğe bağlı"
                                    className={inputCls}
                                />
                            </div>
                        </div>

                        <div>
                            <label className="text-zinc-400 text-sm mb-1.5 block">Firma Adı *</label>
                            <input
                                value={form.ad}
                                onChange={(e) => setForm({ ...form, ad: e.target.value })}
                                placeholder="ABC Gıda Ltd."
                                className={inputCls}
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="text-zinc-400 text-sm mb-1.5 block">Telefon</label>
                                <input
                                    type="tel"
                                    value={form.telefon}
                                    onChange={(e) => setForm({ ...form, telefon: e.target.value })}
                                    placeholder="0212 000 00 00"
                                    className={inputCls}
                                />
                            </div>
                            <div>
                                <label className="text-zinc-400 text-sm mb-1.5 block">Email</label>
                                <input
                                    type="email"
                                    value={form.email}
                                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                                    placeholder="info@firma.com"
                                    className={inputCls}
                                    autoCapitalize="none"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="text-zinc-400 text-sm mb-1.5 block">Adres</label>
                            <input
                                value={form.adres}
                                onChange={(e) => setForm({ ...form, adres: e.target.value })}
                                placeholder="İsteğe bağlı"
                                className={inputCls}
                            />
                        </div>

                        <button
                            onClick={kaydet}
                            disabled={yukleniyor || !form.kod || !form.ad}
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
                        <h2 className="text-white font-bold">Cari Kartı Sil</h2>
                        <p className="text-zinc-400 text-sm">
                            <span className="text-white font-medium">{silOnayKart?.ad}</span> cari kartını silmek istediğinize emin misiniz?
                            <span className="block mt-1 text-zinc-600 text-xs">Bağlı cari hareketler de etkilenebilir.</span>
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