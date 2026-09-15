import { useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';
import api from '../../services/api';
import Modal from '../../components/Modal';
import SubeSecici from '../../components/SubeSecici';
import useSubeStore from '../../store/subeStore';

const fmt = (n) => Number(n || 0).toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const KATEGORILER = [
    { deger: 'KIRA', etiket: 'Kira', ikon: '🏠' },
    { deger: 'ELEKTRIK', etiket: 'Elektrik', ikon: '⚡' },
    { deger: 'SU', etiket: 'Su', ikon: '💧' },
    { deger: 'DOGALGAZ', etiket: 'Doğalgaz', ikon: '🔥' },
    { deger: 'INTERNET', etiket: 'İnternet', ikon: '🌐' },
    { deger: 'TELEFON', etiket: 'Telefon', ikon: '📞' },
    { deger: 'SIGORTA', etiket: 'Sigorta', ikon: '🛡️' },
    { deger: 'DIGER', etiket: 'Diğer', ikon: '📋' },
];

const kategoriBilgi = (deger) => KATEGORILER.find(k => k.deger === deger) || { etiket: deger, ikon: '📋' };

const AYLAR = [
    'Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran',
    'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'
];

const suAnkiYilAy = () => {
    const d = new Date();
    return { yil: d.getFullYear(), ay: d.getMonth() + 1 };
};

// Cari Hesap ekranındaki ödeme alanıyla AYNI mantık: yalnızca rakam ve
// tek bir virgül kabul edilir, nokta hiç girilemez. Bu, Türkçe klavyede
// doğal yazım şekliyle örtüşür ve number input'un nokta/virgül tuzağını
// (bkz. Cari Hesap düzeltmesi) burada da baştan engeller.
const tutarDegisti = (setForm) => (e) => {
    let deger = e.target.value.replace(/[^0-9,]/g, '');
    const ilkVirgul = deger.indexOf(',');
    if (ilkVirgul !== -1) {
        deger = deger.slice(0, ilkVirgul + 1) + deger.slice(ilkVirgul + 1).replace(/,/g, '');
    }
    setForm(prev => ({ ...prev, tutar: deger }));
};
const tutarSayiyaCevir = (deger) => Number(String(deger).replace(',', '.'));

const bosForm = () => {
    const { yil, ay } = suAnkiYilAy();
    return { kategori: 'KIRA', ad: '', yil, ay, tutar: '', aciklama: '', subeId: '' };
};

export default function SabitGiderler() {
    const { subeler } = useSubeStore();

    const { yil: suankiYil, ay: suankiAy } = suAnkiYilAy();
    const [filtreYil, setFiltreYil] = useState(suankiYil);
    const [filtreAy, setFiltreAy] = useState(suankiAy);
    const [filtreSubeId, setFiltreSubeId] = useState('');

    const [giderler, setGiderler] = useState([]);
    const [yukleniyor, setYukleniyor] = useState(false);
    const [modalAcik, setModalAcik] = useState(false);
    const [kaydediliyor, setKaydediliyor] = useState(false);
    const [form, setForm] = useState(bosForm());

    const getir = useCallback(async () => {
        setYukleniyor(true);
        try {
            const params = new URLSearchParams();
            if (filtreYil) params.append('yil', filtreYil);
            if (filtreAy) params.append('ay', filtreAy);
            if (filtreSubeId) params.append('subeId', filtreSubeId);
            const res = await api.get(`/api/sabit-gider?${params}`);
            setGiderler(res.data.data);
        } catch (err) {
            toast.error(err.response?.data?.mesaj || 'Giderler alınamadı');
        } finally {
            setYukleniyor(false);
        }
    }, [filtreYil, filtreAy, filtreSubeId]);

    useEffect(() => { getir(); }, [getir]);

    const modalAc = () => {
        setForm(bosForm());
        setModalAcik(true);
    };

    const kaydet = async () => {
        if (!form.tutar) return toast.error('Tutar zorunlu');
        setKaydediliyor(true);
        try {
            await api.post('/api/sabit-gider', {
                ...form,
                tutar: tutarSayiyaCevir(form.tutar),
                subeId: form.subeId || null,
            });
            toast.success('Sabit gider eklendi');
            setModalAcik(false);
            getir();
        } catch (err) {
            toast.error(err.response?.data?.mesaj || 'Kaydedilemedi');
        } finally {
            setKaydediliyor(false);
        }
    };

    const odendiIsaretle = async (id) => {
        try {
            await api.put(`/api/sabit-gider/${id}/odendi`);
            setGiderler(prev => prev.map(g => g.id === id ? { ...g, odendi: true, odemeTarihi: new Date().toISOString() } : g));
            toast.success('Ödendi olarak işaretlendi');
        } catch (err) {
            toast.error(err.response?.data?.mesaj || 'İşaretlenemedi');
        }
    };

    const sil = async (id) => {
        if (!window.confirm('Bu gider kaydını silmek istediğinize emin misiniz?')) return;
        try {
            await api.delete(`/api/sabit-gider/${id}`);
            setGiderler(prev => prev.filter(g => g.id !== id));
            toast.success('Silindi');
        } catch (err) {
            toast.error(err.response?.data?.mesaj || 'Silinemedi');
        }
    };

    const toplamTutar = giderler.reduce((t, g) => t + g.tutar, 0);
    const odenmemisSayisi = giderler.filter(g => !g.odendi).length;

    const inputCls = "bg-zinc-800 border border-zinc-700 text-white rounded-lg px-3 py-2 text-sm outline-none focus:border-lime-400 transition-colors";

    return (
        <div>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-5 gap-3">
                <div>
                    <h1 className="text-xl font-bold text-white">Sabit Giderler</h1>
                    <p className="text-zinc-500 text-sm mt-0.5">Kira, elektrik, su, doğalgaz gibi tekrarlayan işletme giderleri</p>
                </div>
                <button
                    onClick={modalAc}
                    className="bg-lime-400 hover:bg-lime-300 text-black font-bold text-sm px-4 py-2 rounded-lg transition-colors"
                >
                    + Yeni Gider
                </button>
            </div>

            <SubeSecici />

            {/* Filtreler */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 mb-5 flex flex-wrap items-end gap-3">
                <div>
                    <label className="text-zinc-400 text-xs mb-1 block">Yıl</label>
                    <input
                        type="number"
                        value={filtreYil}
                        onChange={(e) => setFiltreYil(e.target.value)}
                        className={`${inputCls} w-24`}
                    />
                </div>
                <div>
                    <label className="text-zinc-400 text-xs mb-1 block">Ay</label>
                    <select value={filtreAy} onChange={(e) => setFiltreAy(e.target.value)} className={inputCls}>
                        <option value="">Tüm Aylar</option>
                        {AYLAR.map((ad, i) => (
                            <option key={i} value={i + 1}>{ad}</option>
                        ))}
                    </select>
                </div>
                <div>
                    <label className="text-zinc-400 text-xs mb-1 block">Şube</label>
                    <select value={filtreSubeId} onChange={(e) => setFiltreSubeId(e.target.value)} className={inputCls}>
                        <option value="">Tüm Şubeler</option>
                        {subeler.map(s => (
                            <option key={s.id} value={s.id}>{s.ad}</option>
                        ))}
                    </select>
                </div>
            </div>

            {/* Özet kartlar */}
            <div className="grid grid-cols-2 gap-3 mb-5">
                <div className="bg-zinc-900 border border-amber-500/20 rounded-xl p-4">
                    <div className="text-xs text-zinc-500 mb-1">Toplam Tutar</div>
                    <div className="text-amber-400 font-bold text-xl">₺{fmt(toplamTutar)}</div>
                </div>
                <div className="bg-zinc-900 border border-red-500/20 rounded-xl p-4">
                    <div className="text-xs text-zinc-500 mb-1">Ödenmemiş</div>
                    <div className="text-red-400 font-bold text-xl">{odenmemisSayisi} kalem</div>
                </div>
            </div>

            {/* Liste */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
                <div className="divide-y divide-zinc-800">
                    {yukleniyor ? (
                        <div className="text-center py-10 text-zinc-500 text-sm">Yükleniyor...</div>
                    ) : giderler.length === 0 ? (
                        <div className="text-center py-10 text-zinc-500 text-sm">Bu filtrede gider kaydı yok</div>
                    ) : giderler.map((g) => {
                        const kat = kategoriBilgi(g.kategori);
                        return (
                            <div key={g.id} className="p-3.5 flex items-center justify-between gap-3">
                                <div className="flex items-center gap-3 min-w-0">
                                    <span className="text-lg">{kat.ikon}</span>
                                    <div className="min-w-0">
                                        <div className="text-sm font-semibold text-white truncate">
                                            {g.ad || kat.etiket}
                                        </div>
                                        <div className="text-xs text-zinc-500 mt-0.5">
                                            {AYLAR[g.ay - 1]} {g.yil} · {g.sube?.ad || 'Tüm İşletme'}
                                        </div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3 shrink-0">
                                    <span className="text-sm font-mono font-bold text-white">₺{fmt(g.tutar)}</span>
                                    {g.odendi ? (
                                        <span className="text-xs px-2 py-1 rounded-full bg-lime-400/10 text-lime-400">✓ Ödendi</span>
                                    ) : (
                                        <button
                                            onClick={() => odendiIsaretle(g.id)}
                                            className="text-xs px-2 py-1 rounded-full bg-amber-400/10 text-amber-400 hover:bg-amber-400/20 transition-colors"
                                        >
                                            Ödenmedi — işaretle
                                        </button>
                                    )}
                                    <button
                                        onClick={() => sil(g.id)}
                                        className="text-zinc-600 hover:text-red-400 transition-colors text-sm"
                                        title="Sil"
                                    >
                                        🗑️
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {modalAcik && (
                <Modal baslik="Yeni Sabit Gider" onKapat={() => setModalAcik(false)}>
                    <div className="space-y-4">
                        <div>
                            <label className="text-zinc-400 text-sm mb-1.5 block">Kategori *</label>
                            <select
                                value={form.kategori}
                                onChange={(e) => setForm({ ...form, kategori: e.target.value })}
                                className="w-full bg-zinc-800 border border-zinc-700 text-white rounded-lg px-4 py-2.5 text-sm outline-none focus:border-lime-400 transition-colors"
                            >
                                {KATEGORILER.map(k => (
                                    <option key={k.deger} value={k.deger}>{k.ikon} {k.etiket}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="text-zinc-400 text-sm mb-1.5 block">Özel Ad (isteğe bağlı)</label>
                            <input
                                value={form.ad}
                                onChange={(e) => setForm({ ...form, ad: e.target.value })}
                                placeholder="ör. Merkez ofis kira"
                                className="w-full bg-zinc-800 border border-zinc-700 text-white rounded-lg px-4 py-2.5 text-sm outline-none focus:border-lime-400 transition-colors"
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="text-zinc-400 text-sm mb-1.5 block">Yıl *</label>
                                <input
                                    type="number"
                                    value={form.yil}
                                    onChange={(e) => setForm({ ...form, yil: e.target.value })}
                                    className="w-full bg-zinc-800 border border-zinc-700 text-white rounded-lg px-3 py-2.5 text-sm outline-none focus:border-lime-400 transition-colors"
                                />
                            </div>
                            <div>
                                <label className="text-zinc-400 text-sm mb-1.5 block">Ay *</label>
                                <select
                                    value={form.ay}
                                    onChange={(e) => setForm({ ...form, ay: e.target.value })}
                                    className="w-full bg-zinc-800 border border-zinc-700 text-white rounded-lg px-3 py-2.5 text-sm outline-none focus:border-lime-400 transition-colors"
                                >
                                    {AYLAR.map((ad, i) => (
                                        <option key={i} value={i + 1}>{ad}</option>
                                    ))}
                                </select>
                            </div>
                        </div>
                        <div>
                            <label className="text-zinc-400 text-sm mb-1.5 block">Tutar (₺) *</label>
                            <input
                                type="text"
                                inputMode="decimal"
                                value={form.tutar}
                                onChange={tutarDegisti(setForm)}
                                placeholder="0,00"
                                className="w-full bg-zinc-800 border border-zinc-700 text-white rounded-lg px-4 py-2.5 text-sm outline-none focus:border-lime-400 transition-colors"
                            />
                            <p className="text-zinc-600 text-xs mt-1.5">Ondalık için virgül kullanın (ör. 1500,50).</p>
                        </div>
                        <div>
                            <label className="text-zinc-400 text-sm mb-1.5 block">Şube</label>
                            <select
                                value={form.subeId}
                                onChange={(e) => setForm({ ...form, subeId: e.target.value })}
                                className="w-full bg-zinc-800 border border-zinc-700 text-white rounded-lg px-4 py-2.5 text-sm outline-none focus:border-lime-400 transition-colors"
                            >
                                <option value="">Tüm İşletme Geneli</option>
                                {subeler.map(s => (
                                    <option key={s.id} value={s.id}>{s.ad}</option>
                                ))}
                            </select>
                            <p className="text-zinc-600 text-xs mt-1.5">Boş bırakırsan bu gider tüm şubeleri kapsayan tek bir kayıt (örn. tek merkez kira) sayılır.</p>
                        </div>
                        <div>
                            <label className="text-zinc-400 text-sm mb-1.5 block">Açıklama</label>
                            <input
                                value={form.aciklama}
                                onChange={(e) => setForm({ ...form, aciklama: e.target.value })}
                                placeholder="İsteğe bağlı"
                                className="w-full bg-zinc-800 border border-zinc-700 text-white rounded-lg px-4 py-2.5 text-sm outline-none focus:border-lime-400 transition-colors"
                            />
                        </div>
                        <button
                            onClick={kaydet}
                            disabled={kaydediliyor}
                            className="w-full bg-lime-400 hover:bg-lime-300 disabled:opacity-50 text-black font-bold rounded-lg py-2.5 text-sm transition-colors"
                        >
                            {kaydediliyor ? 'Kaydediliyor...' : 'Kaydet'}
                        </button>
                    </div>
                </Modal>
            )}
        </div>
    );
}