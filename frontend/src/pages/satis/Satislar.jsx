import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import api from '../../services/api';
import Modal from '../../components/Modal';
import useAuthStore from '../../store/auth.store';
import SubeSecici from '../../components/SubeSecici';
import useSubeStore from '../../store/subeStore';

const fmt = (n) => Number(n || 0).toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export default function Satislar() {
    const { kullanici } = useAuthStore();
    const { seciliSubeId } = useSubeStore();

    // subeParam'ı component içinde hesapla
    const subeParam = seciliSubeId ? `?subeId=${seciliSubeId}` : '';

    const bos = {
        receteId: '',
        subeId: kullanici?.subeId || '',
        adet: '1',
        birimFiyat: '',
        aciklama: '',
        tarih: new Date().toISOString().split('T')[0]
    };

    const [veri, setVeri] = useState([]);
    const [receteler, setReceteler] = useState([]);
    const [modal, setModal] = useState(false);
    const [form, setForm] = useState(bos);
    const [yukleniyor, setYukleniyor] = useState(false);
    const [gunlukToplam, setGunlukToplam] = useState(0);

    const getir = async () => {
        try {
            const receteRes = await api.get('/api/receteler');
            setReceteler(receteRes.data?.data || []);
        } catch (err) {
            console.error('Reçeteler çekilemedi:', err.response?.data || err.message);
            toast.error('Reçeteler yüklenemedi: ' + (err.response?.data?.mesaj || err.message));
        }

        try {
            const satisRes = await api.get(`/api/satislar${subeParam}`);
            setVeri(satisRes.data?.data || []);
        } catch (err) {
            console.error('Satışlar çekilemedi:', err.response?.data || err.message);
            toast.error('Satışlar yüklenemedi: ' + (err.response?.data?.mesaj || err.message));
        }

        try {
            const gunlukRes = await api.get(`/api/satislar/gunluk-toplam${subeParam}`);
            setGunlukToplam(gunlukRes.data?.data?.toplam || 0);
        } catch (err) {
            console.error('Günlük toplam çekilemedi:', err.response?.data || err.message);
        }
    };

    useEffect(() => {
        getir();
    }, [seciliSubeId]);

    const kaydet = async () => {
        if (!form.receteId || !form.adet || !form.birimFiyat) {
            return toast.error('Reçete, adet ve fiyat zorunlu');
        }
        setYukleniyor(true);
        try {
            await api.post('/api/satislar', form);
            toast.success('Satış kaydedildi');
            setModal(false);
            setForm(bos);
            getir();
        } catch (err) {
            toast.error(err.response?.data?.mesaj || 'Hata oluştu');
        } finally {
            setYukleniyor(false);
        }
    };

    const sil = async (id) => {
        if (!confirm('Satışı silmek istediğine emin misin? Stok geri yüklenmez!')) return;
        try {
            await api.delete(`/api/satislar/${id}`);
            toast.success('Silindi');
            getir();
        } catch (err) {
            toast.error(err.response?.data?.mesaj || 'Silinemedi');
        }
    };

    const toplam = form.adet && form.birimFiyat
        ? fmt(Number(form.adet) * Number(form.birimFiyat))
        : '0,00';

    return (
        <div>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-3">
                <div>
                    <h1 className="text-xl font-bold text-white">Satışlar</h1>
                    <p className="text-zinc-500 text-sm mt-0.5">{veri.length} kayıt</p>
                </div>
                <div className="flex items-center gap-3">
                    <div className="bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-2 text-right">
                        <div className="text-xs text-zinc-500">Günlük Toplam</div>
                        <div className="text-lime-400 font-bold">₺{fmt(gunlukToplam)}</div>
                    </div>
                    <button
                        onClick={() => { setForm(bos); setModal(true); }}
                        className="bg-lime-400 hover:bg-lime-300 text-black font-bold text-sm px-4 py-2 rounded-lg transition-colors"
                    >
                        + Yeni Satış
                    </button>
                </div>
            </div>

            <SubeSecici />

            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="border-b border-zinc-800">
                                <th className="text-left text-xs text-zinc-500 font-semibold uppercase tracking-wider py-3 px-4">Reçete</th>
                                <th className="text-right text-xs text-zinc-500 font-semibold uppercase tracking-wider py-3 px-4 hidden sm:table-cell">Adet</th>
                                <th className="text-right text-xs text-zinc-500 font-semibold uppercase tracking-wider py-3 px-4 hidden sm:table-cell">Birim Fiyat</th>
                                <th className="text-right text-xs text-zinc-500 font-semibold uppercase tracking-wider py-3 px-4">Toplam</th>
                                <th className="text-left text-xs text-zinc-500 font-semibold uppercase tracking-wider py-3 px-4 hidden sm:table-cell">Tarih</th>
                                <th className="text-right text-xs text-zinc-500 font-semibold uppercase tracking-wider py-3 px-4">İşlem</th>
                            </tr>
                        </thead>
                        <tbody>
                            {veri.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="text-center py-16 text-zinc-500 text-sm">
                                        Henüz satış kaydı yok
                                    </td>
                                </tr>
                            ) : veri.map((s) => (
                                <tr key={s.id} className="border-b border-zinc-800/50 hover:bg-zinc-800/30 transition-colors">
                                    <td className="py-3 px-4 text-sm text-white">{s.recete?.ad}</td>
                                    <td className="py-3 px-4 text-right text-sm font-mono text-zinc-300 hidden sm:table-cell">{s.adet}</td>
                                    <td className="py-3 px-4 text-right text-sm font-mono text-zinc-300 hidden sm:table-cell">₺{fmt(s.birimFiyat)}</td>
                                    <td className="py-3 px-4 text-right text-sm font-mono font-bold text-lime-400">₺{fmt(s.toplam)}</td>
                                    <td className="py-3 px-4 text-sm text-zinc-400 hidden sm:table-cell">
                                        {new Date(s.tarih).toLocaleDateString('tr-TR')}
                                    </td>
                                    <td className="py-3 px-4 text-right">
                                        <button onClick={() => sil(s.id)} className="text-xs text-zinc-400 hover:text-red-400 transition-colors">
                                            Sil
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {modal && (
                <Modal baslik="Yeni Satış" onKapat={() => setModal(false)}>
                    <div className="space-y-4">
                        <div>
                            <label className="text-zinc-400 text-sm mb-1.5 block">Reçete *</label>
                            <select
                                value={form.receteId}
                                onChange={(e) => {
                                    const rec = receteler.find(r => r.id === Number(e.target.value));
                                    setForm({ ...form, receteId: e.target.value, birimFiyat: rec?.satisFiyati || '' });
                                }}
                                className="w-full bg-zinc-800 border border-zinc-700 text-white rounded-lg px-4 py-2.5 text-sm outline-none focus:border-lime-400 transition-colors"
                            >
                                <option value="">Reçete seç</option>
                                {receteler.map((r) => (
                                    <option key={r.id} value={r.id}>{r.ad}</option>
                                ))}
                            </select>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="text-zinc-400 text-sm mb-1.5 block">Adet *</label>
                                <input type="number" value={form.adet}
                                    onChange={(e) => setForm({ ...form, adet: e.target.value })}
                                    className="w-full bg-zinc-800 border border-zinc-700 text-white rounded-lg px-4 py-2.5 text-sm outline-none focus:border-lime-400 transition-colors" />
                            </div>
                            <div>
                                <label className="text-zinc-400 text-sm mb-1.5 block">Birim Fiyat (₺) *</label>
                                <input type="number" value={form.birimFiyat}
                                    onChange={(e) => setForm({ ...form, birimFiyat: e.target.value })}
                                    className="w-full bg-zinc-800 border border-zinc-700 text-white rounded-lg px-4 py-2.5 text-sm outline-none focus:border-lime-400 transition-colors" />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="text-zinc-400 text-sm mb-1.5 block">Tarih</label>
                                <input type="date" value={form.tarih}
                                    onChange={(e) => setForm({ ...form, tarih: e.target.value })}
                                    className="w-full bg-zinc-800 border border-zinc-700 text-white rounded-lg px-4 py-2.5 text-sm outline-none focus:border-lime-400 transition-colors" />
                            </div>
                            <div>
                                <label className="text-zinc-400 text-sm mb-1.5 block">Açıklama</label>
                                <input value={form.aciklama}
                                    onChange={(e) => setForm({ ...form, aciklama: e.target.value })}
                                    placeholder="İsteğe bağlı"
                                    className="w-full bg-zinc-800 border border-zinc-700 text-white rounded-lg px-4 py-2.5 text-sm outline-none focus:border-lime-400 transition-colors" />
                            </div>
                        </div>

                        <div className="bg-zinc-800 rounded-xl p-4 flex justify-between items-center">
                            <span className="text-zinc-400 text-sm">Toplam</span>
                            <span className="text-lime-400 font-bold text-lg">₺{toplam}</span>
                        </div>

                        <button onClick={kaydet} disabled={yukleniyor}
                            className="w-full bg-lime-400 hover:bg-lime-300 disabled:opacity-50 text-black font-bold rounded-lg py-2.5 text-sm transition-colors">
                            {yukleniyor ? 'Kaydediliyor...' : 'Satışı Kaydet'}
                        </button>
                    </div>
                </Modal>
            )}
        </div>
    );
}