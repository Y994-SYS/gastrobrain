import { useState, useEffect } from 'react';
import api from '../services/api';
import toast from 'react-hot-toast';
import { usePaketDurumu, SaltOkunurUyari } from '../components/PlanKilidi';

const GUNLER = [
    { value: 0, label: 'Pazar' },
    { value: 1, label: 'Pazartesi' },
    { value: 2, label: 'Salı' },
    { value: 3, label: 'Çarşamba' },
    { value: 4, label: 'Perşembe' },
    { value: 5, label: 'Cuma' },
    { value: 6, label: 'Cumartesi' },
];

const gunEtiket = (gunler) => {
    if (!gunler) return '-';
    return gunler.split(',').map(g => GUNLER.find(d => d.value === Number(g))?.label).filter(Boolean).join(', ');
};

const bos_kalem = () => ({ stokKartId: '', kaynakSubeId: '', hedefSubeId: '', miktar: '', aciklama: '' });

export default function PlanliTransfer() {
    // Paket/deneme bilgisi App.jsx'teki <PrivateRoute planOzellik="planliTransfer">
    // tarafından sağlanan <PaketProvider> context'inden geliyor — eski hâlde
    // bu sayfa kendi paket kontrolünü yapıp yetersizse TAMAMEN bir uyarı
    // ekranına dönüyordu, artık sayfa her zaman açık, sadece yazma işlemleri
    // (yeni plan oluşturma, çalıştırma, aktif/pasif yapma, silme) tamErisim
    // yoksa gizleniyor.
    const { tamErisim } = usePaketDurumu();

    const [yukleniyor, setYukleniyor] = useState(false);

    const [planlar, setPlanlar] = useState([]);
    const [subeler, setSubeler] = useState([]);
    const [stokKartlari, setStokKartlari] = useState([]);
    const [formAcik, setFormAcik] = useState(false);
    const [calistiriyor, setCalistiriyor] = useState(null); // plan id'si tutar
    const [degistiriyor, setDegistiriyor] = useState(null);
    const [form, setForm] = useState({
        ad: '',
        gunler: [],
        saat: '6',
        dakika: '0',
        aktif: true,
        aciklama: '',
        kalemler: [bos_kalem()]
    });

    // ── Verileri Yükle ────────────────────────────────────────
    const verileriYukle = async () => {
        setYukleniyor(true);
        try {
            const [planRes, subeRes, stokRes] = await Promise.all([
                api.get('/api/planli-transfer'),
                api.get('/api/subeler'),
                api.get('/api/stok-kartlari')
            ]);
            const toArray = (d) => Array.isArray(d) ? d : d?.data || [];
            setPlanlar(toArray(planRes.data));
            setSubeler(toArray(subeRes.data).filter(s => s.aktif));
            setStokKartlari(toArray(stokRes.data));
        } catch {
            toast.error('Veriler yüklenemedi');
        } finally {
            setYukleniyor(false);
        }
    };

    useEffect(() => { verileriYukle(); }, []);

    // ── Kalem İşlemleri ───────────────────────────────────────
    const kalemEkle = () => {
        setForm(f => ({ ...f, kalemler: [...f.kalemler, bos_kalem()] }));
    };

    const kalemSil = (index) => {
        setForm(f => ({ ...f, kalemler: f.kalemler.filter((_, i) => i !== index) }));
    };

    const kalemGuncelle = (index, alan, deger) => {
        setForm(f => ({
            ...f,
            kalemler: f.kalemler.map((k, i) => i === index ? { ...k, [alan]: deger } : k)
        }));
    };

    // ── Plan Oluştur ──────────────────────────────────────────
    const planOlustur = async () => {
        if (!form.ad) { toast.error('Plan adı girin'); return; }
        if (form.gunler.length === 0) { toast.error('En az bir gün seçin'); return; }
        if (form.kalemler.length === 0) { toast.error('En az bir kalem ekleyin'); return; }

        for (const [i, k] of form.kalemler.entries()) {
            if (!k.stokKartId) { toast.error(`${i + 1}. kalemde stok kartı seçin`); return; }
            if (!k.kaynakSubeId) { toast.error(`${i + 1}. kalemde kaynak şube seçin`); return; }
            if (!k.hedefSubeId) { toast.error(`${i + 1}. kalemde hedef şube seçin`); return; }
            if (!k.miktar || parseFloat(k.miktar) <= 0) { toast.error(`${i + 1}. kalemde miktar girin`); return; }
            if (k.kaynakSubeId === k.hedefSubeId) { toast.error(`${i + 1}. kalemde kaynak ve hedef şube aynı olamaz`); return; }
        }

        try {
            await api.post('/api/planli-transfer', {
                ad: form.ad,
                gunler: form.gunler.join(','),
                saat: parseInt(form.saat),
                dakika: parseInt(form.dakika),
                aktif: form.aktif,
                aciklama: form.aciklama,
                kalemler: form.kalemler.map(k => ({
                    stokKartId: parseInt(k.stokKartId),
                    kaynakSubeId: parseInt(k.kaynakSubeId),
                    hedefSubeId: parseInt(k.hedefSubeId),
                    miktar: parseFloat(k.miktar),
                    aciklama: k.aciklama || undefined,
                }))
            });
            toast.success('Plan oluşturuldu');
            setForm({ ad: '', gunler: [], saat: '6', dakika: '0', aktif: true, aciklama: '', kalemler: [bos_kalem()] });
            setFormAcik(false);
            verileriYukle();
        } catch (err) {
            toast.error(err.response?.data?.hata || 'Hata oluştu');
        }
    };

    const planSil = async (id) => {
        if (!confirm('Bu planı silmek istediğinize emin misiniz?')) return;
        try {
            await api.delete(`/api/planli-transfer/${id}`);
            toast.success('Plan silindi');
            verileriYukle();
        } catch (err) {
            toast.error(err.response?.data?.hata || 'Hata oluştu');
        }
    };

    const aktifPasifYap = async (id, aktif) => {
        if (degistiriyor) return;
        setDegistiriyor(id);
        try {
            await api.patch(`/api/planli-transfer/${id}/aktif`, { aktif });
            toast.success(aktif ? '✅ Plan aktif edildi' : '⏸ Plan durduruldu');
            verileriYukle();
        } catch (err) {
            toast.error(err.response?.data?.hata || 'Hata oluştu');
        } finally {
            setDegistiriyor(null);
        }
    };

    const hemenCalistir = async (id) => {
        if (calistiriyor) return; // zaten çalışıyorsa engelle
        setCalistiriyor(id);
        try {
            const res = await api.post(`/api/planli-transfer/${id}/calistir`);
            toast.success(`✅ ${res.data.kalemSayisi} transfer tamamlandı: ${res.data.plan}`);
            verileriYukle();
        } catch (err) {
            toast.error(err.response?.data?.hata || 'Hata oluştu');
        } finally {
            setCalistiriyor(null);
        }
    };
    const gunToggle = (gun) => {
        setForm(f => ({
            ...f,
            gunler: f.gunler.includes(gun)
                ? f.gunler.filter(g => g !== gun)
                : [...f.gunler, gun]
        }));
    };

    // ─── Render Guard ─────────────────────────────────────────
    // Paket yetersizliği artık sayfayı hiç engellemiyor — sadece veri
    // yüklenirken bekletiyoruz.
    if (yukleniyor) return <div className="flex items-center justify-center h-64"><p className="text-zinc-400">Veriler yükleniyor...</p></div>;

    return (
        <div className="p-6 space-y-5">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-white">Planlı Transferler</h1>
                    <p className="text-zinc-500 text-sm mt-1">Birden fazla ürünü tek planda otomatik transfer edin</p>
                </div>
                {/* Yeni plan oluşturma — yazma işlemi, salt okunurda gizli */}
                {tamErisim && (
                    <button
                        onClick={() => setFormAcik(!formAcik)}
                        className="bg-lime-400 text-zinc-900 px-4 py-2 rounded-lg text-sm font-semibold hover:bg-lime-300"
                    >
                        {formAcik ? '✕ İptal' : '+ Yeni Plan'}
                    </button>
                )}
            </div>

            <SaltOkunurUyari />

            {/* Yeni Plan Formu */}
            {formAcik && tamErisim && (
                <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 space-y-5">
                    <h2 className="text-white font-semibold">Yeni Planlı Transfer</h2>

                    {/* Plan Bilgileri */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                        <div>
                            <label className="text-zinc-400 text-xs block mb-1">Plan Adı *</label>
                            <input
                                type="text"
                                value={form.ad}
                                onChange={e => setForm(f => ({ ...f, ad: e.target.value }))}
                                className="w-full bg-zinc-800 text-white px-3 py-2 rounded-lg text-sm border border-zinc-700 focus:outline-none focus:border-lime-400"
                                placeholder="Örn: Pazartesi Merkez Dağıtımı"
                            />
                        </div>

                        <div>
                            <label className="text-zinc-400 text-xs block mb-1">Saat *</label>
                            <div className="flex gap-2 items-center">
                                <select
                                    value={form.saat}
                                    onChange={e => setForm(f => ({ ...f, saat: e.target.value }))}
                                    className="flex-1 bg-zinc-800 text-white px-3 py-2 rounded-lg text-sm border border-zinc-700 focus:outline-none focus:border-lime-400"
                                >
                                    {Array.from({ length: 24 }, (_, i) => (
                                        <option key={i} value={i}>{String(i).padStart(2, '0')}</option>
                                    ))}
                                </select>
                                <span className="text-zinc-400">:</span>
                                <select
                                    value={form.dakika}
                                    onChange={e => setForm(f => ({ ...f, dakika: e.target.value }))}
                                    className="flex-1 bg-zinc-800 text-white px-3 py-2 rounded-lg text-sm border border-zinc-700 focus:outline-none focus:border-lime-400"
                                >
                                    {[0, 15, 30, 45].map(d => (
                                        <option key={d} value={d}>{String(d).padStart(2, '0')}</option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    </div>

                    {/* Günler */}
                    <div>
                        <label className="text-zinc-400 text-xs block mb-2">Günler *</label>
                        <div className="flex gap-2 flex-wrap">
                            {GUNLER.map(g => (
                                <button
                                    key={g.value}
                                    onClick={() => gunToggle(g.value)}
                                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${form.gunler.includes(g.value)
                                        ? 'bg-lime-400 text-zinc-900'
                                        : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'
                                        }`}
                                >
                                    {g.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Kalemler */}
                    <div>
                        <div className="flex items-center justify-between mb-2.5">
                            <label className="text-white font-medium text-sm">Transfer Kalemleri *</label>
                            <button
                                onClick={kalemEkle}
                                className="text-lime-400 hover:text-lime-300 text-xs font-semibold"
                            >
                                + Kalem Ekle
                            </button>
                        </div>

                        <div className="space-y-2.5">
                            {form.kalemler.map((kalem, index) => (
                                <div key={index} className="bg-zinc-800 rounded-lg p-3.5 space-y-2.5">
                                    <div className="flex items-center justify-between">
                                        <span className="text-zinc-400 text-xs font-medium">Kalem {index + 1}</span>
                                        {form.kalemler.length > 1 && (
                                            <button
                                                onClick={() => kalemSil(index)}
                                                className="text-red-400 hover:text-red-300 text-xs"
                                            >
                                                Sil
                                            </button>
                                        )}
                                    </div>

                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                        <div>
                                            <label className="text-zinc-500 text-xs block mb-1">Ürün *</label>
                                            <select
                                                value={kalem.stokKartId}
                                                onChange={e => kalemGuncelle(index, 'stokKartId', e.target.value)}
                                                className="w-full bg-zinc-700 text-white px-2 py-1.5 rounded text-xs border border-zinc-600 focus:outline-none focus:border-lime-400"
                                            >
                                                <option value="">Seçin...</option>
                                                {stokKartlari.map(k => <option key={k.id} value={k.id}>{k.ad}</option>)}
                                            </select>
                                        </div>

                                        <div>
                                            <label className="text-zinc-500 text-xs block mb-1">Kaynak *</label>
                                            <select
                                                value={kalem.kaynakSubeId}
                                                onChange={e => kalemGuncelle(index, 'kaynakSubeId', e.target.value)}
                                                className="w-full bg-zinc-700 text-white px-2 py-1.5 rounded text-xs border border-zinc-600 focus:outline-none focus:border-lime-400"
                                            >
                                                <option value="">Seçin...</option>
                                                {subeler.map(s => <option key={s.id} value={s.id}>{s.ad}</option>)}
                                            </select>
                                        </div>

                                        <div>
                                            <label className="text-zinc-500 text-xs block mb-1">Hedef *</label>
                                            <select
                                                value={kalem.hedefSubeId}
                                                onChange={e => kalemGuncelle(index, 'hedefSubeId', e.target.value)}
                                                className="w-full bg-zinc-700 text-white px-2 py-1.5 rounded text-xs border border-zinc-600 focus:outline-none focus:border-lime-400"
                                            >
                                                <option value="">Seçin...</option>
                                                {subeler.filter(s => s.id !== parseInt(kalem.kaynakSubeId)).map(s => (
                                                    <option key={s.id} value={s.id}>{s.ad}</option>
                                                ))}
                                            </select>
                                        </div>

                                        <div>
                                            <label className="text-zinc-500 text-xs block mb-1">Miktar *</label>
                                            <input
                                                type="number"
                                                step="0.01"
                                                value={kalem.miktar}
                                                onChange={e => kalemGuncelle(index, 'miktar', e.target.value)}
                                                className="w-full bg-zinc-700 text-white px-2 py-1.5 rounded text-xs border border-zinc-600 focus:outline-none focus:border-lime-400"
                                                placeholder="0"
                                            />
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div>
                        <label className="text-zinc-400 text-xs block mb-1">Açıklama</label>
                        <input
                            type="text"
                            value={form.aciklama}
                            onChange={e => setForm(f => ({ ...f, aciklama: e.target.value }))}
                            className="w-full bg-zinc-800 text-white px-3 py-2 rounded-lg text-sm border border-zinc-700 focus:outline-none focus:border-lime-400"
                            placeholder="İsteğe bağlı..."
                        />
                    </div>

                    <button
                        onClick={planOlustur}
                        className="bg-lime-400 text-zinc-900 px-6 py-2 rounded-lg text-sm font-semibold hover:bg-lime-300"
                    >
                        Planı Kaydet
                    </button>
                </div>
            )}

            {/* Planlar Listesi — okuma, her zaman görünür */}
            {planlar.length === 0 ? (
                <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-10 text-center">
                    <p className="text-zinc-400 mb-2">⏰ Henüz planlı transfer yok</p>
                    {tamErisim && <p className="text-zinc-500 text-sm">"+ Yeni Plan" ile oluşturun</p>}
                </div>
            ) : (
                <div className="space-y-2.5">
                    {planlar.map(plan => (
                        <div
                            key={plan.id}
                            className={`bg-zinc-900 border rounded-xl p-4 ${plan.aktif ? 'border-zinc-800' : 'border-zinc-700 opacity-60'}`}
                        >
                            {/* Üst satır: ad + badge + zamanlama */}
                            <div className="flex items-start justify-between gap-2 mb-3">
                                <div className="flex items-center gap-2 flex-wrap min-w-0">
                                    <p className="text-white font-semibold truncate">{plan.ad}</p>
                                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium shrink-0 ${plan.aktif ? 'bg-green-900/50 text-green-400' : 'bg-zinc-700 text-zinc-400'}`}>
                                        {plan.aktif ? 'Aktif' : 'Pasif'}
                                    </span>
                                </div>
                                <span className="text-xs text-zinc-500 shrink-0">
                                    {gunEtiket(plan.gunler)} {String(plan.saat).padStart(2, '0')}:{String(plan.dakika).padStart(2, '0')}
                                </span>
                            </div>

                            {/* Kalemler */}
                            <div className="space-y-1 mb-4">
                                {plan.kalemler?.map((k, i) => (
                                    <div key={i} className="flex items-center gap-2 text-xs text-zinc-400 flex-wrap">
                                        <span className="text-zinc-600">•</span>
                                        <span className="text-zinc-300 font-medium">{k.stokKart?.ad}</span>
                                        <span className="text-lime-400">{k.miktar} {k.stokKart?.birim?.kisaltma}</span>
                                        <span className="text-zinc-600">→</span>
                                        <span>{k.kaynakSube?.ad}</span>
                                        <span className="text-zinc-600">→</span>
                                        <span>{k.hedefSube?.ad}</span>
                                    </div>
                                ))}
                            </div>

                            {plan.sonCalisma && (
                                <p className="text-zinc-600 text-xs mb-3">
                                    Son çalışma: {new Date(plan.sonCalisma).toLocaleString('tr-TR')}
                                </p>
                            )}

                            {/* Alt satır: Butonlar — yazma işlemleri, salt okunurda gizli */}
                            {tamErisim && (
                                <div className="flex gap-2 flex-wrap">
                                    <button
                                        onClick={() => hemenCalistir(plan.id)}
                                        disabled={calistiriyor === plan.id}
                                        className={`flex-1 px-3 py-2 rounded-lg text-xs font-semibold min-w-[80px] transition-all ${calistiriyor === plan.id
                                            ? 'bg-zinc-600 text-zinc-400 cursor-not-allowed'
                                            : 'bg-lime-400 text-zinc-900 hover:bg-lime-300'
                                            }`}
                                    >
                                        {calistiriyor === plan.id ? '⏳ Çalışıyor...' : '▶ Çalıştır'}
                                    </button>
                                    <button
                                        onClick={() => aktifPasifYap(plan.id, !plan.aktif)}
                                        disabled={degistiriyor === plan.id}
                                        className={`flex-1 px-3 py-2 rounded-lg text-xs min-w-[80px] transition-all ${degistiriyor === plan.id
                                            ? 'bg-zinc-800 text-zinc-600 cursor-not-allowed'
                                            : 'bg-zinc-700 text-zinc-300 hover:bg-zinc-600'
                                            }`}
                                    >
                                        {degistiriyor === plan.id ? '⏳...' : plan.aktif ? '⏸ Durdur' : '▶ Aktif Et'}
                                    </button>
                                    <button
                                        onClick={() => planSil(plan.id)}
                                        className="bg-red-900/50 text-red-400 px-3 py-2 rounded-lg text-xs hover:bg-red-900 min-w-[60px]"
                                    >
                                        🗑 Sil
                                    </button>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}