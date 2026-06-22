import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import api from '../../services/api';
import useAuthStore from '../../store/auth.store';

export default function GirisFaturasi() {
    const { kullanici } = useAuthStore();

    const bos = {
        stokKartId: '', subeId: kullanici?.subeId || '', miktar: '', birimFiyat: '',
        aciklama: '', tarih: new Date().toISOString().split('T')[0], cariKartId: ''
    };

    const [form, setForm] = useState(bos);
    const [odeme, setOdeme] = useState('vadeli'); // 'vadeli' | 'pesin'
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

    // Peşine geçince cari seçimini temizle
    const odemeSecimi = (tip) => {
        setOdeme(tip);
        if (tip === 'pesin') setForm(f => ({ ...f, cariKartId: '' }));
    };

    const kaydet = async () => {
        if (!form.stokKartId || !form.miktar || !form.birimFiyat) {
            return toast.error('Stok, miktar ve birim fiyat zorunlu');
        }
        setYukleniyor(true);
        try {
            const payload = {
                ...form,
                // Peşin seçildiyse cariKartId'yi boş gönder
                cariKartId: odeme === 'pesin' ? '' : form.cariKartId,
            };
            await api.post('/api/stok/giris-faturasi', payload);
            toast.success(odeme === 'pesin' ? 'Peşin giriş faturası kaydedildi' : 'Vadeli giriş faturası kaydedildi');
            setForm(bos);
            setOdeme('vadeli');
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

                {/* Ödeme Tipi Toggle */}
                <div>
                    <label className="text-zinc-400 text-sm mb-2 block">Ödeme Tipi</label>
                    <div className="flex gap-2">
                        <button
                            onClick={() => odemeSecimi('vadeli')}
                            className={`flex-1 py-2.5 rounded-lg text-sm font-semibold transition-all ${odeme === 'vadeli'
                                    ? 'bg-orange-500/20 border border-orange-500/60 text-orange-300'
                                    : 'bg-zinc-800 border border-zinc-700 text-zinc-400 hover:border-zinc-500'
                                }`}
                        >
                            📋 Vadeli
                        </button>
                        <button
                            onClick={() => odemeSecimi('pesin')}
                            className={`flex-1 py-2.5 rounded-lg text-sm font-semibold transition-all ${odeme === 'pesin'
                                    ? 'bg-lime-400/20 border border-lime-400/60 text-lime-300'
                                    : 'bg-zinc-800 border border-zinc-700 text-zinc-400 hover:border-zinc-500'
                                }`}
                        >
                            💵 Peşin
                        </button>
                    </div>
                    <p className="text-xs text-zinc-500 mt-1.5">
                        {odeme === 'vadeli'
                            ? 'Tedarikçi cari hesabına borç olarak işlenir'
                            : 'Nakit ödeme — cari hesaba işlenmez'}
                    </p>
                </div>

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

                    {/* Vadeli seçiliyse tedarikçi alanı görünür */}
                    {odeme === 'vadeli' && (
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
                    )}

                    <div className={odeme === 'vadeli' ? 'col-span-2' : 'col-span-2'}>
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