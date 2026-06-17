import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import api from '../../services/api';
import { useAuthStore } from '../../store/auth.store';

export default function GirisFaturasi() {
    const { kullanici } = useAuthStore();

    const bos = {
        stokKartId: '', subeId: kullanici?.subeId || '', miktar: '', birimFiyat: '',
        aciklama: '', tarih: new Date().toISOString().split('T')[0], cariKartId: ''
    };

    const [form, setForm] = useState(bos);
    const [stokKartlari, setStokKartlari] = useState([]);
    const [cariKartlar, setCariKartlar] = useState([]);
    const [yukleniyor, setYukleniyor] = useState(false);

    useEffect(() => {
        const getir = async () => {
            const [stokRes, cariRes] = await Promise.all([
                api.get('/api/stok-kartlari'),
                api.get('/api/cari-kartlar'),
            ]);
            setStokKartlari(stokRes.data.data);
            setCariKartlar(cariRes.data.data);
        };
        getir();
    }, []);

    const kaydet = async () => {
        if (!form.stokKartId || !form.miktar || !form.birimFiyat) {
            return toast.error('Stok, miktar ve birim fiyat zorunlu');
        }
        setYukleniyor(true);
        try {
            await api.post('/api/stok/giris-faturasi', form);
            toast.success('Giriş faturası kaydedildi');
            setForm(bos);
        } catch (err) {
            toast.error(err.response?.data?.mesaj || 'Hata oluştu');
        } finally {
            setYukleniyor(false);
        }
    };

    const seciliStok = stokKartlari.find(s => s.id === Number(form.stokKartId));
    const toplam = form.miktar && form.birimFiyat
        ? (Number(form.miktar) * Number(form.birimFiyat)).toFixed(2)
        : '0.00';

    return (
        <div className="max-w-2xl">
            <div className="mb-6">
                <h1 className="text-xl font-bold text-white">Giriş Faturası</h1>
                <p className="text-zinc-500 text-sm mt-0.5">Stok girişi ve cari borç kaydı</p>
            </div>

            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 space-y-4">

                <div className="grid grid-cols-2 gap-4">
                    <div className="col-span-2">
                        <label className="text-zinc-400 text-sm mb-1.5 block">Stok Kartı *</label>
                        <select
                            value={form.stokKartId}
                            onChange={(e) => setForm({ ...form, stokKartId: e.target.value })}
                            className="w-full bg-zinc-800 border border-zinc-700 text-white rounded-lg px-4 py-2.5 text-sm outline-none focus:border-lime-400 transition-colors"
                        >
                            <option value="">Stok seç</option>
                            {stokKartlari.map((s) => (
                                <option key={s.id} value={s.id}>{s.ad} ({s.kod})</option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="text-zinc-400 text-sm mb-1.5 block">
                            Miktar {seciliStok && <span className="text-zinc-500">({seciliStok.birim?.kisaltma})</span>}
                        </label>
                        <input
                            type="number"
                            value={form.miktar}
                            onChange={(e) => setForm({ ...form, miktar: e.target.value })}
                            placeholder="0"
                            className="w-full bg-zinc-800 border border-zinc-700 text-white rounded-lg px-4 py-2.5 text-sm outline-none focus:border-lime-400 transition-colors"
                        />
                    </div>

                    <div>
                        <label className="text-zinc-400 text-sm mb-1.5 block">Birim Fiyat (₺)</label>
                        <input
                            type="number"
                            value={form.birimFiyat}
                            onChange={(e) => setForm({ ...form, birimFiyat: e.target.value })}
                            placeholder="0.00"
                            className="w-full bg-zinc-800 border border-zinc-700 text-white rounded-lg px-4 py-2.5 text-sm outline-none focus:border-lime-400 transition-colors"
                        />
                    </div>

                    <div>
                        <label className="text-zinc-400 text-sm mb-1.5 block">Tarih</label>
                        <input
                            type="date"
                            value={form.tarih}
                            onChange={(e) => setForm({ ...form, tarih: e.target.value })}
                            className="w-full bg-zinc-800 border border-zinc-700 text-white rounded-lg px-4 py-2.5 text-sm outline-none focus:border-lime-400 transition-colors"
                        />
                    </div>

                    <div>
                        <label className="text-zinc-400 text-sm mb-1.5 block">Tedarikçi (Cari)</label>
                        <select
                            value={form.cariKartId}
                            onChange={(e) => setForm({ ...form, cariKartId: e.target.value })}
                            className="w-full bg-zinc-800 border border-zinc-700 text-white rounded-lg px-4 py-2.5 text-sm outline-none focus:border-lime-400 transition-colors"
                        >
                            <option value="">Seç (isteğe bağlı)</option>
                            {cariKartlar.map((c) => (
                                <option key={c.id} value={c.id}>{c.ad}</option>
                            ))}
                        </select>
                    </div>

                    <div className="col-span-2">
                        <label className="text-zinc-400 text-sm mb-1.5 block">Açıklama</label>
                        <input
                            value={form.aciklama}
                            onChange={(e) => setForm({ ...form, aciklama: e.target.value })}
                            placeholder="Fatura no veya not"
                            className="w-full bg-zinc-800 border border-zinc-700 text-white rounded-lg px-4 py-2.5 text-sm outline-none focus:border-lime-400 transition-colors"
                        />
                    </div>
                </div>

                <div className="bg-zinc-800 rounded-xl p-4 flex justify-between items-center">
                    <span className="text-zinc-400 text-sm">Toplam Tutar</span>
                    <span className="text-white font-bold text-lg">₺{toplam}</span>
                </div>

                <button
                    onClick={kaydet}
                    disabled={yukleniyor}
                    className="w-full bg-lime-400 hover:bg-lime-300 disabled:opacity-50 text-black font-bold rounded-lg py-2.5 text-sm transition-colors"
                >
                    {yukleniyor ? 'Kaydediliyor...' : 'Faturayı Kaydet'}
                </button>
            </div>
        </div>
    );
}