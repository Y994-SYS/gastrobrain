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
    const [tanimEkleniyor, setTanimEkleniyor] = useState(false);
    const [tumuEkleniyor, setTumuEkleniyor] = useState(false);
    const [dagitimYapiliyor, setDagitimYapiliyor] = useState(false);
    const [siliyor, setSiliyor] = useState(null);

    const [tanımForm, setTanımForm] = useState({
        stokKartId: '',
        minStokSeviyesi: '',
        otomatiDagit: true,
        aciklama: ''
    });

    // ── Toplu Dağıtım Formu ─────────────────────────────────────
    // Tek bir hedef şube seçilir, ardından tanımlar listesinden istenen
    // kalemler işaretlenip her birine miktar girilir. Tek "Dağıtımı
    // Gerçekleştir" butonu hepsini tek istekte gönderir.
    const [topluHedefSube, setTopluHedefSube] = useState('');
    const [secimler, setSecimler] = useState({}); // { merkezDepoId: { secili: bool, miktar: string } }

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
            const [tanimRes, durumRes, gecmisRes, subeRes, stokRes] = await Promise.allSettled([
                api.get('/api/merkezdepo/tanimlar'),
                api.get('/api/merkezdepo/durum'),
                api.get('/api/merkezdepo/gecmis'),
                api.get('/api/subeler'),
                api.get('/api/stok-kartlari')
            ]);

            const toArray = (data) => Array.isArray(data) ? data : data?.data || [];
            const veri = (sonuc) => sonuc.status === 'fulfilled' ? toArray(sonuc.value.data) : [];

            setTanimlar(veri(tanimRes));
            setDurum(veri(durumRes));
            setGecmis(veri(gecmisRes));
            setSubeler(veri(subeRes).filter(s => s.aktif));
            setStokKartlari(veri(stokRes));

            const basarisizlar = [tanimRes, durumRes, gecmisRes, subeRes, stokRes].filter(r => r.status === 'rejected');
            if (basarisizlar.length > 0) {
                const ilkHata = basarisizlar[0].reason?.response?.data?.hata;
                toast.error(ilkHata || 'Bazı veriler yüklenemedi');
            }
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
        if (!tanımForm.stokKartId) { toast.error('Stok kartı seçin'); return; }
        if (!tanımForm.minStokSeviyesi) { toast.error('Min stok seviyesi girin'); return; }
        if (tanimEkleniyor) return;

        setTanimEkleniyor(true);
        try {
            await api.post('/api/merkezdepo/tanim', {
                stokKartId: parseInt(tanımForm.stokKartId),
                minStokSeviyesi: parseFloat(tanımForm.minStokSeviyesi),
                otomatiDagit: tanımForm.otomatiDagit,
                aciklama: tanımForm.aciklama
            });
            toast.success('✅ Tanım eklendi');
            setTanımForm({ stokKartId: '', minStokSeviyesi: '', otomatiDagit: true, aciklama: '' });
            verileriYukle();
        } catch (err) {
            toast.error(err.response?.data?.hata || 'Hata oluştu');
        } finally {
            setTanimEkleniyor(false);
        }
    };

    // ── Tüm Stok Kartlarını Toplu Ekle ─────────────────────────
    const tumunuEkle = async () => {
        if (!confirm('Tüm stok kartları, mevcut min stok seviyeleriyle merkez depo tanımına eklensin mi?')) return;
        if (tumuEkleniyor) return;

        setTumuEkleniyor(true);
        try {
            const res = await api.post('/api/merkezdepo/tanim/tumu');
            if (res.data.eklenen > 0) {
                toast.success(`✅ ${res.data.eklenen} ürün eklendi`);
            } else {
                toast('Tüm ürünler zaten tanımlı', { icon: 'ℹ️' });
            }
            verileriYukle();
        } catch (err) {
            toast.error(err.response?.data?.hata || 'Hata oluştu');
        } finally {
            setTumuEkleniyor(false);
        }
    };

    // ── Tanım Sil ────────────────────────────────────────────
    const taninmSil = async (id) => {
        if (!confirm('Bu tanımı silmek istediğinize emin misiniz?')) return;
        if (siliyor) return;

        setSiliyor(id);
        try {
            await api.delete(`/api/merkezdepo/tanim/${id}`);
            toast.success('Tanım silindi');
            verileriYukle();
        } catch (err) {
            toast.error(err.response?.data?.hata || 'Hata oluştu');
        } finally {
            setSiliyor(null);
        }
    };

    // ── Toplu Dağıtım: seçim yardımcıları ──────────────────────
    const secimiDegistir = (merkezDepoId, alan, deger) => {
        setSecimler(prev => ({
            ...prev,
            [merkezDepoId]: { ...prev[merkezDepoId], [alan]: deger }
        }));
    };

    const tumunuSec = () => {
        const yeni = {};
        tanimlar.forEach(t => {
            yeni[t.id] = { secili: true, miktar: secimler[t.id]?.miktar || String(t.minStokSeviyesi) };
        });
        setSecimler(yeni);
    };

    const secimiTemizle = () => setSecimler({});

    const seciliKalemler = tanimlar.filter(t => secimler[t.id]?.secili);
    const gonderilecekKalemSayisi = seciliKalemler.filter(t => Number(secimler[t.id]?.miktar) > 0).length;

    // ── Toplu Dağıtımı Gerçekleştir ─────────────────────────────
    const topluDagit = async () => {
        if (!topluHedefSube) { toast.error('Hedef şube seçin'); return; }

        const kalemler = seciliKalemler
            .filter(t => Number(secimler[t.id]?.miktar) > 0)
            .map(t => ({ merkezDepoId: t.id, miktar: Number(secimler[t.id].miktar) }));

        if (kalemler.length === 0) { toast.error('En az bir kalemi işaretleyip miktar girin'); return; }
        if (dagitimYapiliyor) return;

        setDagitimYapiliyor(true);
        try {
            const res = await api.post('/api/merkezdepo/dagit/toplu', {
                hedefSubeId: parseInt(topluHedefSube),
                kalemler
            });

            const { sonuclar, basariliSayisi, toplamKalem } = res.data;

            if (basariliSayisi > 0) {
                toast.success(`✅ ${basariliSayisi}/${toplamKalem} kalem dağıtıldı`);
            }

            const basarisizlar = sonuclar.filter(s => !s.basarili);
            if (basarisizlar.length > 0) {
                basarisizlar.forEach(s => {
                    const tanim = tanimlar.find(t => t.id === s.merkezDepoId);
                    toast.error(`${tanim?.stokKart?.ad || 'Ürün'}: ${s.hata}`);
                });
            }

            // Sadece başarılı olan kalemleri seçim listesinden temizle,
            // başarısızlar tekrar denenebilsin diye kalsın.
            const basariliIdSet = new Set(sonuclar.filter(s => s.basarili).map(s => s.merkezDepoId));
            setSecimler(prev => {
                const kalan = { ...prev };
                basariliIdSet.forEach(id => delete kalan[id]);
                return kalan;
            });

            verileriYukle();
        } catch (err) {
            toast.error(err.response?.data?.hata || 'Hata oluştu');
        } finally {
            setDagitimYapiliyor(false);
        }
    };

    // ─── Render Guard'ları (DOĞRU SIRA) ──────────────────────
    if (paketYukleniyor) {
        return (
            <div className="flex items-center justify-center h-screen">
                <p className="text-zinc-400">Yükleniyor...</p>
            </div>
        );
    }

    if (yetkisiz) {
        return (
            <div className="flex items-center justify-center h-screen bg-zinc-900">
                <div className="text-center p-6 border-2 border-amber-400 rounded-xl bg-zinc-800 shadow-lg max-w-md">
                    <h2 className="text-2xl font-bold text-amber-400 mb-3">
                        ⚠️ Merkez Depo PROFESYONEL Paketinde
                    </h2>
                    <p className="text-gray-300 mb-5">
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
                <p className="text-zinc-400">Veriler yükleniyor...</p>
            </div>
        );
    }

    // ─── Ana Render ──────────────────────────────────────────
    return (
        <div className="p-6 space-y-5">
            <div>
                <h1 className="text-2xl font-bold text-white">Merkez Depo Yönetimi</h1>
                <p className="text-zinc-500 text-sm mt-1">
                    Şubeler arası otomatik stok dağıtımını yönetin
                </p>
            </div>

            {/* Durum Özeti */}
            {durum.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    {durum.map((d, i) => (
                        <div
                            key={i}
                            className={`bg-zinc-900 rounded-xl p-4 border-l-4 ${d.durum === 'UYARI' ? 'border-l-red-500' : 'border-l-lime-500'
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
                {['tanimlar', 'dagit', 'gecmis'].map((tab) => (
                    <button
                        key={tab}
                        onClick={() => setAktifTab(tab)}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${aktifTab === tab
                            ? 'bg-lime-400 text-zinc-900'
                            : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'
                            }`}
                    >
                        {tab === 'tanimlar' ? 'Tanımlar' : tab === 'dagit' ? 'Manual Dağıtım' : 'Dağıtım Geçmişi'}
                    </button>
                ))}
            </div>

            {/* TAB: Tanımlar */}
            {aktifTab === 'tanimlar' && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 space-y-3.5">
                        <div className="flex items-center justify-between">
                            <h2 className="text-white font-semibold">Yeni Tanım</h2>
                            <button
                                onClick={tumunuEkle}
                                disabled={tumuEkleniyor || stokKartlari.length === 0}
                                className="text-xs text-lime-400 hover:text-lime-300 font-semibold disabled:opacity-40 disabled:cursor-not-allowed"
                            >
                                {tumuEkleniyor ? '⏳ Ekleniyor...' : '📦 Tüm Stok Kartlarını Ekle'}
                            </button>
                        </div>

                        <div>
                            <label className="text-zinc-400 text-xs block mb-1">Stok Kartı *</label>
                            <select
                                value={tanımForm.stokKartId}
                                onChange={e => setTanımForm(f => ({ ...f, stokKartId: e.target.value }))}
                                className="w-full bg-zinc-800 text-white px-3 py-2 rounded-lg text-sm border border-zinc-700 focus:outline-none focus:border-lime-400"
                            >
                                <option value="">
                                    {stokKartlari.length === 0 ? 'Stok kartı yok — önce stok kartı ekleyin' : 'Seçin...'}
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
                                className="rounded accent-lime-400"
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
                            disabled={!tanımForm.stokKartId || !tanımForm.minStokSeviyesi || tanimEkleniyor}
                            className="w-full bg-lime-400 text-zinc-900 py-2 rounded-lg text-sm font-semibold hover:bg-lime-300 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                        >
                            {tanimEkleniyor ? '⏳ Ekleniyor...' : 'Tanım Ekle'}
                        </button>
                    </div>

                    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 space-y-3">
                        <h2 className="text-white font-semibold">Aktif Tanımlar</h2>

                        {tanimlar.length === 0 ? (
                            <div className="text-zinc-400 text-sm py-6 text-center">
                                <p className="mb-3">📦 Henüz merkez depo tanımı yok</p>
                                <p className="text-xs text-zinc-500">
                                    Sol taraftaki formdan yeni tanım ekleyerek başlayın,
                                    ya da "Tüm Stok Kartlarını Ekle" ile hepsini birden içeri alın
                                </p>
                            </div>
                        ) : (
                            <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1">
                                {tanimlar.map(t => (
                                    <div key={t.id} className="bg-zinc-800 rounded-lg p-3 flex justify-between items-start">
                                        <div className="flex-1">
                                            <p className="text-white font-medium text-sm">{t.stokKart?.ad}</p>
                                            <p className="text-zinc-400 text-xs mt-1">
                                                Min: {t.minStokSeviyesi} {t.stokKart?.birim?.kisaltma}
                                                {t.otomatiDagit && ' • 🔄 Otomatik'}
                                            </p>
                                        </div>
                                        <button
                                            onClick={() => taninmSil(t.id)}
                                            disabled={siliyor === t.id}
                                            className={`text-xs font-bold ml-2 transition-colors ${siliyor === t.id ? 'text-zinc-600 cursor-not-allowed' : 'text-red-400 hover:text-red-300'
                                                }`}
                                        >
                                            {siliyor === t.id ? '⏳' : 'Sil'}
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* TAB: Manual Dağıtım — artık checklist + toplu gönderim */}
            {aktifTab === 'dagit' && (
                <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 space-y-4">
                    <h2 className="text-white font-semibold">Toplu Dağıtım Yap</h2>

                    {tanimlar.length === 0 ? (
                        <div className="text-zinc-400 text-sm py-6 text-center bg-zinc-800 rounded-lg p-5">
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
                            {/* Hedef şube — tüm işaretli kalemler bu şubeye gidecek */}
                            <div className="max-w-sm">
                                <label className="text-zinc-400 text-xs block mb-1">Hedef Şube *</label>
                                <select
                                    value={topluHedefSube}
                                    onChange={e => setTopluHedefSube(e.target.value)}
                                    className="w-full bg-zinc-800 text-white px-3 py-2 rounded-lg text-sm border border-zinc-700 focus:outline-none focus:border-lime-400"
                                >
                                    <option value="">Seçin...</option>
                                    {subeler.map(s => (
                                        <option key={s.id} value={s.id}>{s.ad}</option>
                                    ))}
                                </select>
                            </div>

                            {/* Hızlı seçim yardımcıları */}
                            <div className="flex items-center gap-3 flex-wrap">
                                <button
                                    onClick={tumunuSec}
                                    className="text-xs text-lime-400 hover:text-lime-300 font-semibold"
                                >
                                    ☑ Tümünü Seç (min seviyeyle doldur)
                                </button>
                                <button
                                    onClick={secimiTemizle}
                                    className="text-xs text-zinc-400 hover:text-zinc-300 font-semibold"
                                >
                                    ✕ Seçimi Temizle
                                </button>
                                {gonderilecekKalemSayisi > 0 && (
                                    <span className="text-xs text-zinc-500">
                                        {gonderilecekKalemSayisi} kalem gönderilecek
                                    </span>
                                )}
                            </div>

                            {/* Kalem listesi — checkbox + miktar */}
                            <div className="border border-zinc-800 rounded-lg overflow-hidden">
                                <div className="max-h-[420px] overflow-y-auto divide-y divide-zinc-800">
                                    {tanimlar.map(t => {
                                        const secim = secimler[t.id] || {};
                                        return (
                                            <div
                                                key={t.id}
                                                className={`flex items-center gap-3 p-3 transition-colors ${secim.secili ? 'bg-lime-400/5' : 'bg-zinc-900'
                                                    }`}
                                            >
                                                <input
                                                    type="checkbox"
                                                    checked={!!secim.secili}
                                                    onChange={e => secimiDegistir(t.id, 'secili', e.target.checked)}
                                                    className="rounded accent-lime-400 shrink-0"
                                                />
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-white text-sm font-medium truncate">{t.stokKart?.ad}</p>
                                                    <p className="text-zinc-500 text-xs">
                                                        Min: {t.minStokSeviyesi} {t.stokKart?.birim?.kisaltma}
                                                    </p>
                                                </div>
                                                <input
                                                    type="number"
                                                    step="0.01"
                                                    value={secim.miktar || ''}
                                                    onChange={e => secimiDegistir(t.id, 'miktar', e.target.value)}
                                                    onFocus={() => !secim.secili && secimiDegistir(t.id, 'secili', true)}
                                                    placeholder="Miktar"
                                                    className="w-28 bg-zinc-800 text-white px-2 py-1.5 rounded-lg text-sm border border-zinc-700 focus:outline-none focus:border-lime-400 text-right shrink-0"
                                                />
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>

                            <button
                                onClick={topluDagit}
                                disabled={dagitimYapiliyor || gonderilecekKalemSayisi === 0 || !topluHedefSube}
                                className="w-full bg-lime-400 text-zinc-900 py-2.5 rounded-lg text-sm font-semibold hover:bg-lime-300 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                            >
                                {dagitimYapiliyor
                                    ? '⏳ Dağıtılıyor...'
                                    : `Dağıtımı Gerçekleştir${gonderilecekKalemSayisi > 0 ? ` (${gonderilecekKalemSayisi} kalem)` : ''}`}
                            </button>
                        </>
                    )}
                </div>
            )}

            {/* TAB: Dağıtım Geçmişi */}
            {aktifTab === 'gecmis' && (
                <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
                    <h2 className="text-white font-semibold mb-3.5">Dağıtım Geçmişi</h2>

                    {gecmis.length === 0 ? (
                        <p className="text-zinc-500 text-sm text-center py-6">📋 Henüz dağıtım kaydı yok</p>
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