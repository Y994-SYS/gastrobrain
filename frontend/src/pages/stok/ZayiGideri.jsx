import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import api from '../../services/api';
import useAuthStore from '../../store/auth.store';

export default function ZayiGideri() {
    const { kullanici } = useAuthStore();
    const bos = {
        stokKartId: '', subeId: kullanici?.subeId || '', miktar: '',
        aciklama: '', tarih: new Date().toISOString().split('T')[0]
    };
    const [form, setForm] = useState(bos);
    const [stokKartlari, setStokKartlari] = useState([]);
    const [yukleniyor, setYukleniyor] = useState(false);

    useEffect(() => {
        api.get('/api/stok-kartlari').then(res => setStokKartlari(res.data.data));
    }, []);

    const kaydet = async () => {
        if (!form.stokKartId || !form.miktar) return toast.error('Stok ve miktar zorunlu');
        setYukleniyor(true);
        try {
            await api.post('/api/stok/zayi', form);
            toast.success('Zayi gideri kaydedildi');
            setForm(bos);
        } catch (err) {
            toast.error(err.response?.data?.mesaj || 'Hata oluştu');
        } finally {
            setYukleniyor(false);
        }
    };

    const seciliStok = stokKartlari.find(s => s.id === Number(form.stokKartId));

    return (
        <div className="max-w-2xl">
            <div className="mb-6">
                <h1 className="text-xl font-bold text-white">Zayi Gideri</h1>
                <p className="text-zinc-500 text-sm mt-0.5">Bozulan, çürüyen veya kaybolan stok kaydı</p>
            </div>
            <div className="bg-red-500/5 border border-red-500/20 rounded-xl p-4 mb-6">
                <p className="text-red-400 text-sm">🗑️ Zayi gideri stoktan düşer ve gider olarak kaydedilir.</p>
            </div>
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 space-y-4">
                <div>
                    <label className="text-zinc-400 text-sm mb-1.5 block">Stok Kartı *</label>
                    <select value={form.stokKartId} onChange={(e) => setForm({ ...form, stokKartId: e.target.value })}
                        className="w-full bg-zinc-800 border border-zinc-700 text-white rounded-lg px-4 py-2.5 text-sm outline-none focus:border-lime-400 transition-colors">
                        <option value="">Stok seç</option>
                        {stokKartlari.map((s) => <option key={s.id} value={s.id}>{s.ad} ({s.kod})</option>)}
                    </select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="text-zinc-400 text-sm mb-1.5 block">Miktar {seciliStok && <span className="text-zinc-500">({seciliStok.birim?.kisaltma})</span>}</label>
                        <input type="number" value={form.miktar} onChange={(e) => setForm({ ...form, miktar: e.target.value })} placeholder="0"
                            className="w-full bg-zinc-800 border border-zinc-700 text-white rounded-lg px-4 py-2.5 text-sm outline-none focus:border-lime-400 transition-colors" />
                    </div>
                    <div>
                        <label className="text-zinc-400 text-sm mb-1.5 block">Tarih</label>
                        <input type="date" value={form.tarih} onChange={(e) => setForm({ ...form, tarih: e.target.value })}
                            className="w-full bg-zinc-800 border border-zinc-700 text-white rounded-lg px-4 py-2.5 text-sm outline-none focus:border-lime-400 transition-colors" />
                    </div>
                </div>
                <div>
                    <label className="text-zinc-400 text-sm mb-1.5 block">Açıklama</label>
                    <input value={form.aciklama} onChange={(e) => setForm({ ...form, aciklama: e.target.value })} placeholder="Zayi nedeni"
                        className="w-full bg-zinc-800 border border-zinc-700 text-white rounded-lg px-4 py-2.5 text-sm outline-none focus:border-lime-400 transition-colors" />
                </div>
                <button onClick={kaydet} disabled={yukleniyor}
                    className="w-full bg-lime-400 hover:bg-lime-300 disabled:opacity-50 text-black font-bold rounded-lg py-2.5 text-sm transition-colors">
                    {yukleniyor ? 'Kaydediliyor...' : 'Zayi Kaydı Ekle'}
                </button>
            </div>
        </div>
    );
}