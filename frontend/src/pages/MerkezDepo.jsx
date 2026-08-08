import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import toast from 'react-hot-toast';

const fmt = (n) => Number(n || 0).toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export default function MerkezDepo() {
    const navigate = useNavigate();
    const [paket, setPaket] = useState(null);
    const [paketYukleniyor, setPaketYukleniyor] = useState(true);
    const [yetkisiz, setYetkisiz] = useState(false);

    const [tanimlar, setTanimlar] = useState([]);
    const [durum, setDurum] = useState([]);
    const [gecmis, setGecmis] = useState([]);
    const [subeler, setSubeler] = useState([]);
    const [stokKartlari, setStokKartlari] = useState([]);

    const [yukleniyor, setYukleniyor] = useState(false);
    const [aktifTab, setAktifTab] = useState('tanimlar');

    // Tanım formu
    const [tanımForm, setTanımForm] = useState({
        stokKartId: '',
        minStokSeviyesi: '',
        otomatiDagit: true,
        aciklama: ''
    });

    // Dağıtım formu
    const [dagitForm, setDagitForm] = useState({
        merkezDepoId: '',
        hedefSubeId: '',
        miktar: '',
        aciklama: ''
    });

    // ── Paket Kontrolü ────────────────────────────────────────
    useEffect(() => {
        const paketKontrol = async () => {
            try {
                const res = await api.get('/api/auth/beni-getir');
                const tenantPaket = res.data.tenant?.plan;
                setPaket(tenantPaket);

                if (tenantPaket === 'BASLANGIC') {
                    setYetkisiz(true);
                    setTimeout(() => {
                        navigate('/abonelik?reason=merkezDepo');
                    }, 2000);
                }

                setPaketYukleniyor(false);
            } catch (err) {
                console.error('Paket kontrolü hatası:', err);
                setPaketYukleniyor(false);
            }
        };

        paketKontrol();
    }, [navigate]);

    // ── Verileri Yükle ────────────────────────────────────────
    const verileriYukle = async () => {
        if (yetkisiz) return;
        setYukleniyor(true);
        try {
            const [tanimRes, durumRes, gecmisRes, subeRes, stokRes] = await Promise.all([
                api.get('/api/merkezdepo/tanimlar'),
                api.get('/api/merkezdepo/durum'),
                api.get('/api/merkezdepo/gecmis'),
                api.get('/api/subeler'),
                api.get('/api/stok-kartlari')
            ]);

            // Her response için güvenli array kontrolü
            const toArray = (data) => Array.isArray(data) ? data : data?.data || [];

            setTanimlar(toArray(tanimRes.data));
            setDurum(toArray(durumRes.data));
            setGecmis(toArray(gecmisRes.data));
            setSubeler(toArray(subeRes.data).filter(s => s.aktif));
            setStokKartlari(toArray(stokRes.data));

        } catch (err) {
            toast.error('Veriler yüklenemedi');
            console.error(err);
        } finally {
            setYukleniyor(false);
        }
    };

    useEffect(() => {
        if (!yetkisiz && !paketYukleniyor) {
            verileriYukle();
        }
    }, [yetkisiz, paketYukleniyor]);

    // ── Tanım Ekle ────────────────────────────────────────────
    const taninmEkle = async () => {
        if (!tanımForm.stokKartId) {
            toast.error('Stok kartı seçin');
            return;
        }
        if (!tanımForm.minStokSeviyesi) {
            toast.error('Min stok seviyesi girin');
            return;
        }

        try {
            await api.post('/api/merkezdepo/tanim', {
                stokKartId: parseInt(tanımForm.stokKartId),
                minStokSeviyesi: parseFloat(tanımForm.minStokSeviyesi),
                otomatiDagit: tanımForm.otomatiDagit,
                aciklama: tanımForm.aciklama
            });

            toast.success('Tanım eklendi');
            setTanımForm({ stokKartId: '', minStokSeviyesi: '', otomatiDagit: true, aciklama: '' });
            verileriYukle();
        } catch (err) {
            toast.error(err.response?.data?.hata || 'Hata oluştu');
        }
    };

    // ── Tanım Sil ────────────────────────────────────────────
    const taninmSil = async (id) => {
        if (!confirm('Bu tanımı silmek istediğinize emin misiniz?')) return;

        try {
            await api.delete(`/api/merkezdepo/tanim/${id}`);
            toast.success('Tanım silindi');
            verileriYukle();
        } catch (err) {
            toast.error(err.response?.data?.hata || 'Hata oluştu');
        }
    };

    // ── Manual Dağıtım ────────────────────────────────────────
    const manuelDagit = async () => {
        if (!dagitForm.merkezDepoId) {
            toast.error('Merkez depo seçin');
            return;
        }
        if (!dagitForm.hedefSubeId) {
            toast.error('Hedef şube seçin');
            return;
        }
        if (!dagitForm.miktar) {
            toast.error('Miktar girin');
            return;
        }

        try {
            await api.post('/api/merkezdepo/dagit', {
                merkezDepoId: parseInt(dagitForm.merkezDepoId),
                hedefSubeId: parseInt(dagitForm.hedefSubeId),
                miktar: parseFloat(dagitForm.miktar),
                aciklama: dagitForm.aciklama
            });

            toast.success('Dağıtım yapıldı');
            setDagitForm({ merkezDepoId: '', hedefSubeId: '', miktar: '', aciklama: '' });
            verileriYukle();
        } catch (err) {
            toast.error(err.response?.data?.hata || 'Hata oluştu');
        }
    };

    // ── Yetkisiz Erişim ────────────────────────────────────────
    if (yetkisiz) {
        return (
            <div className="flex items-center justify-center h-screen bg-zinc-900">
                <div className="text-center p-8 border-2 border-amber-400 rounded-lg bg-zinc-800 shadow-lg max-w-md">
                    <h2 className="text-2xl font-bold text-amber-400 mb-4">
                        ⚠️ Merkez Depo PROFESYONEL Paketinde
                    </h2>
                    <p className="text-gray-300 mb-6">
                        Bu özelliği kullanmak için paketinizi yükseltmeniz gerekiyor.
                    </p>
                    <button
                        onClick={() => navigate('/abonelik')}
                        className="bg-lime-400 hover:bg-lime-500 text-zinc-900 font-bold py-2 px-6 rounded-lg transition-colors"
                    >
                        Paket Yükseltin →
                    </button>
                </div>
            </div>
        );
    }

    if (yukleniyor) {
        return (
            <div className="flex items-center justify-center h-64">
                <p className="text-zinc-400">Yükleniyor...</p>
            </div>
        );
    }
    if (paketYukleniyor) {
        return <div className="flex items-center justify-center h-screen"><p className="text-zinc-400">Yükleniyor...</p></div>;
    }

    // ─── Render ──────────────────────────────────────────────
    return (
        <div className="p-6 space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-white">Merkez Depo Yönetimi</h1>
                <p className="text-zinc-500 text-sm mt-1">
                    Şubeler arası otomatik stok dağıtımını yönetin
                </p>
            </div>

            {/* Durum Özeti */}
            {durum.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {durum.map((d, i) => (
                        <div
                            key={i}
                            className={`bg-zinc-900 rounded-xl p-4 border-l-4 ${d.durum === 'UYARI' ? 'border-l-red-500' : 'border-l-green-500'
                                }`}
                        >
                            <p className="text-zinc-400 text-xs">{d.tanim}</p>
                            <div className="flex justify-between items-start mt-2">
                                <div>
                                    <p className="text-white font-bold">{d.toplamSube} şube</p>
                                    <p className="text-zinc-400 text-xs mt-1">Min: {d.minStokSeviyesi}</p>
                                </div>
                                {d.altindaSayisi > 0 && (
                                    <span className="bg-red-900/50 text-red-300 px-2 py-1 rounded text-xs font-bold">
                                        {d.altindaSayisi} aşağıda
                                    </span>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Tablar */}
            <div className="flex gap-2 flex-wrap">
                <button
                    onClick={() => setAktifTab('tanimlar')}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${aktifTab === 'tanimlar'
                        ? 'bg-lime-400 text-zinc-900'
                        : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'
                        }`}
                >
                    Tanımlar
                </button>
                <button
                    onClick={() => setAktifTab('dagit')}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${aktifTab === 'dagit'
                        ? 'bg-lime-400 text-zinc-900'
                        : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'
                        }`}
                >
                    Manual Dağıtım
                </button>
                <button
                    onClick={() => setAktifTab('gecmis')}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${aktifTab === 'gecmis'
                        ? 'bg-lime-400 text-zinc-900'
                        : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'
                        }`}
                >
                    Dağıtım Geçmişi
                </button>
            </div>

            {/* TAB: Tanımlar */}
            {aktifTab === 'tanimlar' && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Tanım Ekleme Formu */}
                    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 space-y-4">
                        <h2 className="text-white font-semibold">Yeni Tanım</h2>

                        <div>
                            <label className="text-zinc-400 text-xs block mb-1">Stok Kartı *</label>
                            <select
                                value={tanımForm.stokKartId}
                                onChange={e => setTanımForm(f => ({ ...f, stokKartId: e.target.value }))}
                                className="w-full bg-zinc-800 text-white px-3 py-2 rounded-lg text-sm border border-zinc-700 focus:outline-none focus:border-lime-400"
                            >
                                <option value="">
                                    {stokKartlari.length === 0 ? 'Stok kartı yok' : 'Seçin...'}
                                </option>
                                {stokKartlari.map(k => (
                                    <option key={k.id} value={k.id}>{k.ad}</option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="text-zinc-400 text-xs block mb-1">Min. Stok Seviyesi *</label>
                            <input
                                type="number"
                                step="0.01"
                                value={tanımForm.minStokSeviyesi}
                                onChange={e => setTanımForm(f => ({ ...f, minStokSeviyesi: e.target.value }))}
                                className="w-full bg-zinc-800 text-white px-3 py-2 rounded-lg text-sm border border-zinc-700 focus:outline-none focus:border-lime-400"
                                placeholder="0"
                            />
                        </div>

                        <div className="flex items-center gap-2">
                            <input
                                type="checkbox"
                                id="otomati"
                                checked={tanımForm.otomatiDagit}
                                onChange={e => setTanımForm(f => ({ ...f, otomatiDagit: e.target.checked }))}
                                className="rounded"
                            />
                            <label htmlFor="otomati" className="text-zinc-300 text-sm">
                                Otomatik Dağıtım Açık
                            </label>
                        </div>

                        <div>
                            <label className="text-zinc-400 text-xs block mb-1">Açıklama</label>
                            <input
                                type="text"
                                value={tanımForm.aciklama}
                                onChange={e => setTanımForm(f => ({ ...f, aciklama: e.target.value }))}
                                className="w-full bg-zinc-800 text-white px-3 py-2 rounded-lg text-sm border border-zinc-700 focus:outline-none focus:border-lime-400"
                                placeholder="İsteğe bağlı..."
                            />
                        </div>

                        <button
                            onClick={taninmEkle}
                            disabled={!tanımForm.stokKartId || !tanımForm.minStokSeviyesi}
                            className="w-full bg-lime-400 text-zinc-900 py-2 rounded-lg text-sm font-semibold hover:bg-lime-300 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                        >
                            Tanım Ekle
                        </button>
                    </div>

                    {/* Tanımlar Listesi */}
                    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 space-y-3">
                        <h2 className="text-white font-semibold">Aktif Tanımlar</h2>

                        {tanimlar.length === 0 ? (
                            <div className="text-zinc-400 text-sm py-8 text-center">
                                <p className="mb-3">📦 Henüz merkez depo tanımı yok</p>
                                <p className="text-xs text-zinc-500">
                                    Sol taraftaki formdan yeni tanım ekleyerek başlayın
                                </p>
                            </div>
                        ) : (
                            <div className="space-y-2">
                                {tanimlar.map(t => (
                                    <div key={t.id} className="bg-zinc-800 rounded-lg p-3 flex justify-between items-start">
                                        <div className="flex-1">
                                            <p className="text-white font-medium text-sm">{t.stokKart.ad}</p>
                                            <p className="text-zinc-400 text-xs mt-1">
                                                Min: {t.minStokSeviyesi} {t.stokKart.birim.kisaltma}
                                                {t.otomatiDagit && ' • 🔄 Otomatik'}
                                            </p>
                                        </div>
                                        <button
                                            onClick={() => taninmSil(t.id)}
                                            className="text-red-400 hover:text-red-300 text-xs font-bold"
                                        >
                                            Sil
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* TAB: Manual Dağıtım */}
            {aktifTab === 'dagit' && (
                <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 space-y-4 max-w-2xl">
                    <h2 className="text-white font-semibold">Manual Dağıtım Yap</h2>

                    {tanimlar.length === 0 ? (
                        <div className="text-zinc-400 text-sm py-8 text-center bg-zinc-800 rounded-lg">
                            <p className="mb-3">⚠️ Dağıtım yapabilmek için önce merkez depo tanımı ekleyin</p>
                            <button
                                onClick={() => setAktifTab('tanimlar')}
                                className="mt-3 bg-lime-400 text-zinc-900 px-4 py-2 rounded text-sm font-semibold hover:bg-lime-300"
                            >
                                Tanım Ekle →
                            </button>
                        </div>
                    ) : (
                        <>
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="text-zinc-400 text-xs block mb-1">Merkez Depo *</label>
                                    <select
                                        value={dagitForm.merkezDepoId}
                                        onChange={e => setDagitForm(f => ({ ...f, merkezDepoId: e.target.value }))}
                                        className="w-full bg-zinc-800 text-white px-3 py-2 rounded-lg text-sm border border-zinc-700 focus:outline-none focus:border-lime-400"
                                    >
                                        <option value="">Seçin...</option>
                                        {tanimlar.map(t => (
                                            <option key={t.id} value={t.id}>{t.stokKart.ad}</option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className="text-zinc-400 text-xs block mb-1">Hedef Şube *</label>
                                    <select
                                        value={dagitForm.hedefSubeId}
                                        onChange={e => setDagitForm(f => ({ ...f, hedefSubeId: e.target.value }))}
                                        className="w-full bg-zinc-800 text-white px-3 py-2 rounded-lg text-sm border border-zinc-700 focus:outline-none focus:border-lime-400"
                                    >
                                        <option value="">Seçin...</option>
                                        {subeler.map(s => (
                                            <option key={s.id} value={s.id}>{s.ad}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div>
                                <label className="text-zinc-400 text-xs block mb-1">Miktar *</label>
                                <input
                                    type="number"
                                    step="0.01"
                                    value={dagitForm.miktar}
                                    onChange={e => setDagitForm(f => ({ ...f, miktar: e.target.value }))}
                                    className="w-full bg-zinc-800 text-white px-3 py-2 rounded-lg text-sm border border-zinc-700 focus:outline-none focus:border-lime-400"
                                    placeholder="0"
                                />
                            </div>

                            <div>
                                <label className="text-zinc-400 text-xs block mb-1">Açıklama</label>
                                <input
                                    type="text"
                                    value={dagitForm.aciklama}
                                    onChange={e => setDagitForm(f => ({ ...f, aciklama: e.target.value }))}
                                    className="w-full bg-zinc-800 text-white px-3 py-2 rounded-lg text-sm border border-zinc-700 focus:outline-none focus:border-lime-400"
                                    placeholder="İsteğe bağlı..."
                                />
                            </div>

                            <button
                                onClick={manuelDagit}
                                className="w-full bg-lime-400 text-zinc-900 py-2 rounded-lg text-sm font-semibold hover:bg-lime-300 transition-colors"
                            >
                                Dağıtımı Gerçekleştir
                            </button>
                        </>
                    )}
                </div>
            )}

            {/* TAB: Dağıtım Geçmişi */}
            {aktifTab === 'gecmis' && (
                <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
                    <h2 className="text-white font-semibold mb-4">Dağıtım Geçmişi</h2>

                    {gecmis.length === 0 ? (
                        <p className="text-zinc-500 text-sm text-center py-8">📋 Dağıtım kaydı yok</p>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="text-zinc-400 border-b border-zinc-800">
                                        <th className="text-left py-2">Ürün</th>
                                        <th className="text-left py-2">Hedef Şube</th>
                                        <th className="text-right py-2">Miktar</th>
                                        <th className="text-left py-2">Açıklama</th>
                                        <th className="text-left py-2">Tarih</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {gecmis.map(g => (
                                        <tr key={g.id} className="border-b border-zinc-800/50 text-zinc-300">
                                            <td className="py-2">{g.merkezDepo?.stokKart?.ad}</td>
                                            <td>{g.hedefSube?.ad}</td>
                                            <td className="text-right font-semibold text-lime-400">{fmt(g.miktar)}</td>
                                            <td className="text-zinc-500">{g.aciklama}</td>
                                            <td className="text-zinc-500">
                                                {new Date(g.tarih).toLocaleDateString('tr-TR')}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}