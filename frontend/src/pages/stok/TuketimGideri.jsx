import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import api from '../../services/api';
import useAuthStore from '../../store/auth.store';

const fmt3 = (n) => Number(n || 0).toLocaleString('tr-TR', { minimumFractionDigits: 3, maximumFractionDigits: 3 });

export default function TuketimGideri() {
    const { kullanici } = useAuthStore();

    const bosTekli = {
        stokKartId: '', subeId: kullanici?.subeId || '', miktar: '',
        aciklama: '', tarih: new Date().toISOString().split('T')[0]
    };
    const bosRecete = {
        receteId: '', porsiyonSayisi: '',
        aciklama: '', tarih: new Date().toISOString().split('T')[0]
    };

    const [mod, setMod] = useState('tekli'); // 'tekli' | 'recete'
    const [form, setForm] = useState(bosTekli);
    const [receteForm, setReceteForm] = useState(bosRecete);

    const [stokKartlari, setStokKartlari] = useState([]);
    const [receteler, setReceteler] = useState([]);
    const [yukleniyor, setYukleniyor] = useState(false);

    useEffect(() => {
        api.get('/api/stok-kartlari').then(res => setStokKartlari(res.data.data));
        api.get('/api/receteler').then(res => setReceteler(res.data.data));
    }, []);

    // Reçete seçilince porsiyonSayisi otomatik doldur
    const recetesec = (receteId) => {
        const r = receteler.find(r => r.id === Number(receteId));
        setReceteForm(prev => ({
            ...prev,
            receteId,
            porsiyonSayisi: r?.porsiyonSayisi ? String(r.porsiyonSayisi) : prev.porsiyonSayisi,
        }));
    };

    // Seçili reçete ve önizleme hesabı
    const seciliRecete = receteler.find(r => r.id === Number(receteForm.receteId));
    const porsiyon = Number(receteForm.porsiyonSayisi) || 0;

    const onizleme = seciliRecete?.kalemler?.map(kalem => {
        const receteninKendiPorsiyonu = seciliRecete?.porsiyonSayisi || 1;
        const oran = porsiyon / receteninKendiPorsiyonu;
        const gercekMiktar = ((kalem.miktar * (kalem.carpan || 1)) / (kalem.bolen || 1)) * oran;
        return {
            ad: kalem.stokKart?.ad,
            birim: kalem.stokKart?.birim?.kisaltma,
            miktar: Math.round(gercekMiktar * 1000) / 1000,
        };
    }) || [];

    // Tekli kaydet
    const kaydetTekli = async () => {
        if (!form.stokKartId || !form.miktar) return toast.error('Stok ve miktar zorunlu');
        setYukleniyor(true);
        try {
            await api.post('/api/stok/tuketim', form);
            toast.success('Tüketim gideri kaydedildi');
            setForm(bosTekli);
        } catch (err) {
            toast.error(err.response?.data?.mesaj || 'Hata oluştu');
        } finally {
            setYukleniyor(false);
        }
    };

    // Reçete bazlı kaydet
    const kaydetRecete = async () => {
        if (!receteForm.receteId) return toast.error('Reçete seçin');
        if (!receteForm.porsiyonSayisi || porsiyon <= 0) return toast.error('Porsiyon sayısı girilmedi');
        if (!seciliRecete?.kalemler?.length) return toast.error('Reçetede kalem yok');
        setYukleniyor(true);
        try {
            const res = await api.post('/api/stok/tuketim-recete', receteForm);
            toast.success(res.data.mesaj);
            setReceteForm(bosRecete);
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
                <h1 className="text-xl font-bold text-white">Tüketim Gideri</h1>
                <p className="text-zinc-500 text-sm mt-0.5">Personel tüketimi veya mutfak içi kullanım kaydı</p>
            </div>

            {/* Mod Toggle */}
            <div className="flex gap-1 bg-zinc-900 border border-zinc-800 rounded-xl p-1 mb-6">
                <button
                    onClick={() => setMod('tekli')}
                    className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-colors ${mod === 'tekli'
                        ? 'bg-lime-400 text-black'
                        : 'text-zinc-400 hover:text-white'
                        }`}
                >
                    Tekli Stok
                </button>
                <button
                    onClick={() => setMod('recete')}
                    className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-colors ${mod === 'recete'
                        ? 'bg-lime-400 text-black'
                        : 'text-zinc-400 hover:text-white'
                        }`}
                >
                    🍽 Reçete Bazlı
                </button>
            </div>

            {/* TEKLİ MOD */}
            {mod === 'tekli' && (
                <>
                    <div className="bg-blue-500/5 border border-blue-500/20 rounded-xl p-4 mb-6">
                        <p className="text-blue-400 text-sm">🍽️ Tüketim gideri stoktan düşer ve gider olarak kaydedilir.</p>
                    </div>
                    <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 space-y-4">
                        <div>
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
                        <div className="grid grid-cols-2 gap-4">
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
                                <label className="text-zinc-400 text-sm mb-1.5 block">Tarih</label>
                                <input
                                    type="date"
                                    value={form.tarih}
                                    onChange={(e) => setForm({ ...form, tarih: e.target.value })}
                                    className="w-full bg-zinc-800 border border-zinc-700 text-white rounded-lg px-4 py-2.5 text-sm outline-none focus:border-lime-400 transition-colors"
                                />
                            </div>
                        </div>
                        <div>
                            <label className="text-zinc-400 text-sm mb-1.5 block">Açıklama</label>
                            <input
                                value={form.aciklama}
                                onChange={(e) => setForm({ ...form, aciklama: e.target.value })}
                                placeholder="Tüketim nedeni veya notu"
                                className="w-full bg-zinc-800 border border-zinc-700 text-white rounded-lg px-4 py-2.5 text-sm outline-none focus:border-lime-400 transition-colors"
                            />
                        </div>
                        <button
                            onClick={kaydetTekli}
                            disabled={yukleniyor}
                            className="w-full bg-lime-400 hover:bg-lime-300 disabled:opacity-50 text-black font-bold rounded-lg py-2.5 text-sm transition-colors"
                        >
                            {yukleniyor ? 'Kaydediliyor...' : 'Tüketim Kaydı Ekle'}
                        </button>
                    </div>
                </>
            )}

            {/* REÇETE BAZLI MOD */}
            {mod === 'recete' && (
                <>
                    <div className="bg-lime-400/5 border border-lime-400/20 rounded-xl p-4 mb-6">
                        <p className="text-lime-400 text-sm">🍽 Reçete seç, porsiyon sayısı gir — tüm kalemler otomatik hesaplanıp stoktan düşülür.</p>
                    </div>
                    <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 space-y-4">
                        <div>
                            <label className="text-zinc-400 text-sm mb-1.5 block">Reçete *</label>
                            <select
                                value={receteForm.receteId}
                                onChange={(e) => recetesec(e.target.value)}
                                className="w-full bg-zinc-800 border border-zinc-700 text-white rounded-lg px-4 py-2.5 text-sm outline-none focus:border-lime-400 transition-colors"
                            >
                                <option value="">Reçete seç</option>
                                {receteler.map((r) => (
                                    <option key={r.id} value={r.id}>
                                        {r.ad}{r.satisKodu ? ` (${r.satisKodu})` : ''}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="text-zinc-400 text-sm mb-1.5 block">
                                    Porsiyon Sayısı *
                                    {seciliRecete?.porsiyonSayisi && (
                                        <span className="text-zinc-600 ml-2 text-xs font-normal">— reçeteden otomatik</span>
                                    )}
                                </label>
                                <input
                                    type="number"
                                    value={receteForm.porsiyonSayisi}
                                    onChange={(e) => setReceteForm({ ...receteForm, porsiyonSayisi: e.target.value })}
                                    placeholder="örn. 10"
                                    min="1"
                                    className="w-full bg-zinc-800 border border-zinc-700 text-white rounded-lg px-4 py-2.5 text-sm outline-none focus:border-lime-400 transition-colors"
                                />
                            </div>
                            <div>
                                <label className="text-zinc-400 text-sm mb-1.5 block">Tarih</label>
                                <input
                                    type="date"
                                    value={receteForm.tarih}
                                    onChange={(e) => setReceteForm({ ...receteForm, tarih: e.target.value })}
                                    className="w-full bg-zinc-800 border border-zinc-700 text-white rounded-lg px-4 py-2.5 text-sm outline-none focus:border-lime-400 transition-colors"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="text-zinc-400 text-sm mb-1.5 block">Açıklama</label>
                            <input
                                value={receteForm.aciklama}
                                onChange={(e) => setReceteForm({ ...receteForm, aciklama: e.target.value })}
                                placeholder="Opsiyonel not"
                                className="w-full bg-zinc-800 border border-zinc-700 text-white rounded-lg px-4 py-2.5 text-sm outline-none focus:border-lime-400 transition-colors"
                            />
                        </div>

                        {/* Önizleme */}
                        {seciliRecete && porsiyon > 0 && onizleme.length > 0 && (
                            <div className="bg-zinc-800 rounded-xl p-4">
                                <p className="text-zinc-400 text-xs font-semibold mb-3 uppercase tracking-wide">
                                    Düşülecek Stoklar — {porsiyon} porsiyon
                                </p>
                                <div className="space-y-2">
                                    {onizleme.map((k, i) => (
                                        <div key={i} className="flex justify-between items-center">
                                            <span className="text-sm text-white">{k.ad}</span>
                                            <span className="text-sm font-mono text-lime-400">
                                                {fmt3(k.miktar)} {k.birim}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                                <div className="border-t border-zinc-700 mt-3 pt-3">
                                    <p className="text-zinc-500 text-xs">{onizleme.length} kalem stoktan düşülecek</p>
                                </div>
                            </div>
                        )}

                        {seciliRecete && porsiyon > 0 && onizleme.length === 0 && (
                            <div className="bg-zinc-800 rounded-xl p-4 text-center text-zinc-500 text-sm">
                                Bu reçetede kalem tanımlı değil
                            </div>
                        )}

                        <button
                            onClick={kaydetRecete}
                            disabled={yukleniyor || !receteForm.receteId || !porsiyon}
                            className="w-full bg-lime-400 hover:bg-lime-300 disabled:opacity-50 text-black font-bold rounded-lg py-2.5 text-sm transition-colors"
                        >
                            {yukleniyor ? 'Kaydediliyor...' : `Tüketim Düş${onizleme.length > 0 ? ` (${onizleme.length} kalem)` : ''}`}
                        </button>
                    </div>
                </>
            )}
        </div>
    );
}