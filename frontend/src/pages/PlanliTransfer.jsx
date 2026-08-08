import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import toast from 'react-hot-toast';

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

export default function PlanliTransfer() {
    const navigate = useNavigate();
    const [paketYukleniyor, setPaketYukleniyor] = useState(true);
    const [yetkisiz, setYetkisiz] = useState(false);
    const [yukleniyor, setYukleniyor] = useState(false);

    const [planlar, setPlanlar] = useState([]);
    const [subeler, setSubeler] = useState([]);
    const [stokKartlari, setStokKartlari] = useState([]);
    const [formAcik, setFormAcik] = useState(false);

    const [form, setForm] = useState({
        ad: '',
        stokKartId: '',
        kaynakSubeId: '',
        hedefSubeId: '',
        miktar: '',
        gunler: [],
        saat: '6',
        dakika: '0',
        aktif: true,
        aciklama: ''
    });

    // ── Paket Kontrolü ────────────────────────────────────────
    useEffect(() => {
        const paketKontrol = async () => {
            try {
                const res = await api.get('/api/auth/beni-getir');
                const tenantPaket = res.data.tenant?.plan;

                if (tenantPaket === 'BASLANGIC') {
                    setYetkisiz(true);
                    setTimeout(() => navigate('/abonelik?reason=planliTransfer'), 2000);
                }
                setPaketYukleniyor(false);
            } catch (err) {
                console.error(err);
                setPaketYukleniyor(false);
            }
        };
        paketKontrol();
    }, [navigate]);

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
        } catch (err) {
            toast.error('Veriler yüklenemedi');
        } finally {
            setYukleniyor(false);
        }
    };

    useEffect(() => {
        if (!yetkisiz && !paketYukleniyor) verileriYukle();
    }, [yetkisiz, paketYukleniyor]);

    // ── Plan Oluştur ──────────────────────────────────────────
    const planOlustur = async () => {
        if (!form.ad) { toast.error('Plan adı girin'); return; }
        if (!form.stokKartId) { toast.error('Stok kartı seçin'); return; }
        if (!form.kaynakSubeId) { toast.error('Kaynak şube seçin'); return; }
        if (!form.hedefSubeId) { toast.error('Hedef şube seçin'); return; }
        if (!form.miktar) { toast.error('Miktar girin'); return; }
        if (form.gunler.length === 0) { toast.error('En az bir gün seçin'); return; }
        if (form.kaynakSubeId === form.hedefSubeId) { toast.error('Kaynak ve hedef şube aynı olamaz'); return; }

        try {
            await api.post('/api/planli-transfer', {
                ...form,
                stokKartId: parseInt(form.stokKartId),
                kaynakSubeId: parseInt(form.kaynakSubeId),
                hedefSubeId: parseInt(form.hedefSubeId),
                miktar: parseFloat(form.miktar),
                saat: parseInt(form.saat),
                dakika: parseInt(form.dakika),
                gunler: form.gunler.join(','),
            });
            toast.success('Plan oluşturuldu');
            setForm({ ad: '', stokKartId: '', kaynakSubeId: '', hedefSubeId: '', miktar: '', gunler: [], saat: '6', dakika: '0', aktif: true, aciklama: '' });
            setFormAcik(false);
            verileriYukle();
        } catch (err) {
            toast.error(err.response?.data?.hata || 'Hata oluştu');
        }
    };

    // ── Plan Sil ──────────────────────────────────────────────
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

    // ── Aktif/Pasif ───────────────────────────────────────────
    const aktifPasifYap = async (id, aktif) => {
        try {
            await api.patch(`/api/planli-transfer/${id}/aktif`, { aktif });
            toast.success(aktif ? 'Plan aktif edildi' : 'Plan pasif edildi');
            verileriYukle();
        } catch (err) {
            toast.error(err.response?.data?.hata || 'Hata oluştu');
        }
    };

    // ── Hemen Çalıştır ────────────────────────────────────────
    const hemenCalistir = async (id) => {
        try {
            const res = await api.post(`/api/planli-transfer/${id}/calistir`);
            toast.success(`Transfer yapıldı: ${res.data.miktar} ${res.data.kaynakSube} → ${res.data.hedefSube}`);
            verileriYukle();
        } catch (err) {
            toast.error(err.response?.data?.hata || 'Hata oluştu');
        }
    };

    // ── Gün Seçimi ────────────────────────────────────────────
    const gunToggle = (gun) => {
        setForm(f => ({
            ...f,
            gunler: f.gunler.includes(gun)
                ? f.gunler.filter(g => g !== gun)
                : [...f.gunler, gun]
        }));
    };

    // ─── Render Guard'ları ────────────────────────────────────
    if (paketYukleniyor) {
        return <div className="flex items-center justify-center h-screen"><p className="text-zinc-400">Yükleniyor...</p></div>;
    }

    if (yetkisiz) {
        return (
            <div className="flex items-center justify-center h-screen bg-zinc-900">
                <div className="text-center p-8 border-2 border-amber-400 rounded-lg bg-zinc-800 shadow-lg max-w-md">
                    <h2 className="text-2xl font-bold text-amber-400 mb-4">⚠️ Planlı Transfer PROFESYONEL Paketinde</h2>
                    <p className="text-gray-300 mb-6">Bu özelliği kullanmak için paketinizi yükseltmeniz gerekiyor.</p>
                    <button onClick={() => navigate('/abonelik')} className="bg-lime-400 hover:bg-lime-500 text-zinc-900 font-bold py-2 px-6 rounded-lg">Paket Yükseltin →</button>
                </div>
            </div>
        );
    }

    if (yukleniyor) {
        return <div className="flex items-center justify-center h-64"><p className="text-zinc-400">Veriler yükleniyor...</p></div>;
    }

    // ─── Ana Render ───────────────────────────────────────────
    return (
        <div className="p-6 space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-white">Planlı Transferler</h1>
                    <p className="text-zinc-500 text-sm mt-1">Otomatik stok transferlerini planlayın</p>
                </div>
                <button
                    onClick={() => setFormAcik(!formAcik)}
                    className="bg-lime-400 text-zinc-900 px-4 py-2 rounded-lg text-sm font-semibold hover:bg-lime-300"
                >
                    {formAcik ? '✕ İptal' : '+ Yeni Plan'}
                </button>
            </div>

            {/* Yeni Plan Formu */}
            {formAcik && (
                <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 space-y-4">
                    <h2 className="text-white font-semibold">Yeni Planlı Transfer</h2>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="text-zinc-400 text-xs block mb-1">Plan Adı *</label>
                            <input
                                type="text"
                                value={form.ad}
                                onChange={e => setForm(f => ({ ...f, ad: e.target.value }))}
                                className="w-full bg-zinc-800 text-white px-3 py-2 rounded-lg text-sm border border-zinc-700 focus:outline-none focus:border-lime-400"
                                placeholder="Örn: Pazartesi Un Dağıtımı"
                            />
                        </div>

                        <div>
                            <label className="text-zinc-400 text-xs block mb-1">Stok Kartı *</label>
                            <select
                                value={form.stokKartId}
                                onChange={e => setForm(f => ({ ...f, stokKartId: e.target.value }))}
                                className="w-full bg-zinc-800 text-white px-3 py-2 rounded-lg text-sm border border-zinc-700 focus:outline-none focus:border-lime-400"
                            >
                                <option value="">Seçin...</option>
                                {stokKartlari.map(k => <option key={k.id} value={k.id}>{k.ad}</option>)}
                            </select>
                        </div>

                        <div>
                            <label className="text-zinc-400 text-xs block mb-1">Kaynak Şube *</label>
                            <select
                                value={form.kaynakSubeId}
                                onChange={e => setForm(f => ({ ...f, kaynakSubeId: e.target.value }))}
                                className="w-full bg-zinc-800 text-white px-3 py-2 rounded-lg text-sm border border-zinc-700 focus:outline-none focus:border-lime-400"
                            >
                                <option value="">Seçin...</option>
                                {subeler.map(s => <option key={s.id} value={s.id}>{s.ad}</option>)}
                            </select>
                        </div>

                        <div>
                            <label className="text-zinc-400 text-xs block mb-1">Hedef Şube *</label>
                            <select
                                value={form.hedefSubeId}
                                onChange={e => setForm(f => ({ ...f, hedefSubeId: e.target.value }))}
                                className="w-full bg-zinc-800 text-white px-3 py-2 rounded-lg text-sm border border-zinc-700 focus:outline-none focus:border-lime-400"
                            >
                                <option value="">Seçin...</option>
                                {subeler.filter(s => s.id !== parseInt(form.kaynakSubeId)).map(s => <option key={s.id} value={s.id}>{s.ad}</option>)}
                            </select>
                        </div>

                        <div>
                            <label className="text-zinc-400 text-xs block mb-1">Miktar *</label>
                            <input
                                type="number"
                                step="0.01"
                                value={form.miktar}
                                onChange={e => setForm(f => ({ ...f, miktar: e.target.value }))}
                                className="w-full bg-zinc-800 text-white px-3 py-2 rounded-lg text-sm border border-zinc-700 focus:outline-none focus:border-lime-400"
                                placeholder="0"
                            />
                        </div>

                        <div>
                            <label className="text-zinc-400 text-xs block mb-1">Saat *</label>
                            <div className="flex gap-2">
                                <select
                                    value={form.saat}
                                    onChange={e => setForm(f => ({ ...f, saat: e.target.value }))}
                                    className="flex-1 bg-zinc-800 text-white px-3 py-2 rounded-lg text-sm border border-zinc-700 focus:outline-none focus:border-lime-400"
                                >
                                    {Array.from({ length: 24 }, (_, i) => (
                                        <option key={i} value={i}>{String(i).padStart(2, '0')}</option>
                                    ))}
                                </select>
                                <span className="text-zinc-400 flex items-center">:</span>
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

                    {/* Gün Seçimi */}
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

            {/* Planlar Listesi */}
            {planlar.length === 0 ? (
                <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-12 text-center">
                    <p className="text-zinc-400 mb-2">⏰ Henüz planlı transfer yok</p>
                    <p className="text-zinc-500 text-sm">Yukarıdaki "+ Yeni Plan" butonu ile oluşturabilirsiniz</p>
                </div>
            ) : (
                <div className="space-y-3">
                    {planlar.map(plan => (
                        <div
                            key={plan.id}
                            className={`bg-zinc-900 border rounded-xl p-4 ${plan.aktif ? 'border-zinc-800' : 'border-zinc-700 opacity-60'
                                }`}
                        >
                            <div className="flex items-start justify-between gap-4">
                                <div className="flex-1">
                                    <div className="flex items-center gap-2">
                                        <p className="text-white font-semibold">{plan.ad}</p>
                                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${plan.aktif
                                                ? 'bg-green-900/50 text-green-400'
                                                : 'bg-zinc-700 text-zinc-400'
                                            }`}>
                                            {plan.aktif ? 'Aktif' : 'Pasif'}
                                        </span>
                                    </div>

                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-3">
                                        <div>
                                            <p className="text-zinc-500 text-xs">Ürün</p>
                                            <p className="text-zinc-300 text-sm">{plan.stokKart?.ad}</p>
                                        </div>
                                        <div>
                                            <p className="text-zinc-500 text-xs">Miktar</p>
                                            <p className="text-zinc-300 text-sm font-semibold text-lime-400">
                                                {plan.miktar} {plan.stokKart?.birim?.kisaltma}
                                            </p>
                                        </div>
                                        <div>
                                            <p className="text-zinc-500 text-xs">Kaynak → Hedef</p>
                                            <p className="text-zinc-300 text-sm">
                                                {plan.kaynakSube?.ad} → {plan.hedefSube?.ad}
                                            </p>
                                        </div>
                                        <div>
                                            <p className="text-zinc-500 text-xs">Zamanlama</p>
                                            <p className="text-zinc-300 text-sm">
                                                {gunEtiket(plan.gunler)} {String(plan.saat).padStart(2, '0')}:{String(plan.dakika).padStart(2, '0')}
                                            </p>
                                        </div>
                                    </div>

                                    {plan.sonCalisma && (
                                        <p className="text-zinc-500 text-xs mt-2">
                                            Son çalışma: {new Date(plan.sonCalisma).toLocaleString('tr-TR')}
                                        </p>
                                    )}
                                </div>

                                {/* Aksiyon Butonları */}
                                <div className="flex flex-col gap-2 shrink-0">
                                    <button
                                        onClick={() => hemenCalistir(plan.id)}
                                        className="bg-lime-400 text-zinc-900 px-3 py-1.5 rounded text-xs font-semibold hover:bg-lime-300"
                                    >
                                        ▶ Çalıştır
                                    </button>
                                    <button
                                        onClick={() => aktifPasifYap(plan.id, !plan.aktif)}
                                        className="bg-zinc-700 text-zinc-300 px-3 py-1.5 rounded text-xs hover:bg-zinc-600"
                                    >
                                        {plan.aktif ? '⏸ Durdur' : '▶ Aktif Et'}
                                    </button>
                                    <button
                                        onClick={() => planSil(plan.id)}
                                        className="bg-red-900/50 text-red-400 px-3 py-1.5 rounded text-xs hover:bg-red-900"
                                    >
                                        🗑 Sil
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}