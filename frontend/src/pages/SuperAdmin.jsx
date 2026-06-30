import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import useAuthStore from '../store/auth.store';
import toast from 'react-hot-toast';

const PLAN_RENK = {
    BASLANGIC: 'text-zinc-400 bg-zinc-800',
    PROFESYONEL: 'text-blue-400 bg-blue-400/10',
    KURUMSAL: 'text-lime-400 bg-lime-400/10',
};

const PLAN_ETIKET = {
    BASLANGIC: 'Başlangıç',
    PROFESYONEL: 'Profesyonel',
    KURUMSAL: 'Kurumsal',
};

const ODEME_PLAN_ETIKET = { baslangic: 'Başlangıç', profesyonel: 'Profesyonel', kurumsal: 'Kurumsal' };
const ODEME_PERIYOT_ETIKET = { aylik: 'Aylık', yillik: 'Yıllık' };

function lisansKalanGun(bitis) {
    if (!bitis) return null;
    const fark = Math.ceil((new Date(bitis) - new Date()) / (1000 * 60 * 60 * 24));
    return fark;
}

function LisansRozet({ bitis }) {
    const gun = lisansKalanGun(bitis);
    if (gun === null) return <span className="text-zinc-600 text-xs">—</span>;
    if (gun < 0) return <span className="text-xs px-2 py-0.5 rounded-full bg-red-900/50 text-red-400">Süresi doldu</span>;
    if (gun <= 7) return <span className="text-xs px-2 py-0.5 rounded-full bg-red-900/40 text-red-400">{gun} gün</span>;
    if (gun <= 30) return <span className="text-xs px-2 py-0.5 rounded-full bg-yellow-900/40 text-yellow-400">{gun} gün</span>;
    return <span className="text-xs px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-400">{gun} gün</span>;
}

function IstatistikKart({ etiket, deger, renk }) {
    return (
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
            <p className="text-zinc-500 text-xs mb-1">{etiket}</p>
            <p className={`text-2xl font-black ${renk}`}>{deger}</p>
        </div>
    );
}

// ─── Bekleyen Ödemeler Paneli ─────────────────────────────────────────────────
function BekleyenOdemelerPaneli({ onIslemSonrasi }) {
    const [bildirimler, setBildirimler] = useState([]);
    const [yukleniyor, setYukleniyor] = useState(true);
    const [redModalAcik, setRedModalAcik] = useState(null);
    const [redNotu, setRedNotu] = useState('');
    const [islemId, setIslemId] = useState(null);

    const getir = useCallback(async () => {
        setYukleniyor(true);
        try {
            const res = await api.get('/api/odeme/bekleyenler');
            setBildirimler(res.data);
        } catch {
            toast.error('Bekleyen ödemeler yüklenemedi');
        } finally {
            setYukleniyor(false);
        }
    }, []);

    useEffect(() => { getir(); }, [getir]);

    const onayla = async (id) => {
        setIslemId(id);
        try {
            await api.patch(`/api/odeme/${id}/onayla`);
            toast.success('Ödeme onaylandı, lisans uzatıldı');
            setBildirimler(b => b.filter(x => x.id !== id));
            onIslemSonrasi?.();
        } catch (e) {
            toast.error(e.response?.data?.hata || 'Onaylanamadı');
        } finally {
            setIslemId(null);
        }
    };

    const reddet = async () => {
        if (!redModalAcik) return;
        setIslemId(redModalAcik);
        try {
            await api.patch(`/api/odeme/${redModalAcik}/reddet`, { redNotu });
            toast.success('Bildirim reddedildi');
            setBildirimler(b => b.filter(x => x.id !== redModalAcik));
            setRedModalAcik(null);
            setRedNotu('');
        } catch (e) {
            toast.error(e.response?.data?.hata || 'İşlem başarısız');
        } finally {
            setIslemId(null);
        }
    };

    if (yukleniyor) {
        return <div className="text-zinc-500 text-sm text-center py-10">Yükleniyor...</div>;
    }

    return (
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden">
            <div className="px-4 py-3 border-b border-zinc-800 flex items-center justify-between">
                <h2 className="font-semibold text-sm">Bekleyen Ödemeler ({bildirimler.length})</h2>
                <button onClick={getir} className="text-zinc-500 hover:text-lime-400 text-xs transition-colors">Yenile</button>
            </div>

            {bildirimler.length === 0 ? (
                <div className="text-center py-12">
                    <div className="text-3xl mb-2">✓</div>
                    <p className="text-zinc-500 text-sm">Bekleyen ödeme bildirimi yok</p>
                </div>
            ) : (
                <div className="divide-y divide-zinc-800">
                    {bildirimler.map(b => (
                        <div key={b.id} className="p-4 space-y-3">
                            <div className="flex items-start justify-between gap-3">
                                <div className="min-w-0">
                                    <p className="font-medium text-white text-sm truncate">{b.tenant.ad}</p>
                                    <p className="text-zinc-500 text-xs font-mono">{b.tenant.slug}</p>
                                </div>
                                <div className="text-right shrink-0">
                                    <p className="text-lime-400 font-bold text-sm">₺{b.tutar.toLocaleString('tr-TR')}</p>
                                    <p className="text-zinc-500 text-xs">
                                        {ODEME_PLAN_ETIKET[b.plan]} · {ODEME_PERIYOT_ETIKET[b.periyot]}
                                    </p>
                                </div>
                            </div>

                            {b.not && (
                                <div className="bg-zinc-800/60 rounded-lg px-3 py-2">
                                    <p className="text-zinc-400 text-xs">Not: {b.not}</p>
                                </div>
                            )}

                            <p className="text-zinc-600 text-xs">
                                {new Date(b.createdAt).toLocaleString('tr-TR')} — bildirildi
                            </p>

                            <div className="flex gap-2">
                                <button
                                    onClick={() => onayla(b.id)}
                                    disabled={islemId === b.id}
                                    className="flex-1 bg-lime-400/10 hover:bg-lime-400/20 border border-lime-400/30 text-lime-400 text-xs font-semibold py-2 rounded-lg transition-colors disabled:opacity-50"
                                >
                                    ✓ Onayla
                                </button>
                                <button
                                    onClick={() => setRedModalAcik(b.id)}
                                    disabled={islemId === b.id}
                                    className="flex-1 bg-red-400/10 hover:bg-red-400/20 border border-red-400/30 text-red-400 text-xs font-semibold py-2 rounded-lg transition-colors disabled:opacity-50"
                                >
                                    ✗ Reddet
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Red modal */}
            {redModalAcik && (
                <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
                    <div className="bg-zinc-900 border border-zinc-700 rounded-2xl p-5 w-full max-w-sm space-y-3">
                        <h3 className="font-semibold text-white text-sm">Bildirimi Reddet</h3>
                        <textarea
                            value={redNotu}
                            onChange={e => setRedNotu(e.target.value)}
                            placeholder="Red sebebi (opsiyonel)..."
                            rows={3}
                            className="w-full bg-zinc-800 border border-zinc-700 text-white rounded-lg px-3 py-2 text-sm outline-none focus:border-red-400 resize-none"
                        />
                        <div className="flex gap-2">
                            <button
                                onClick={() => { setRedModalAcik(null); setRedNotu(''); }}
                                className="flex-1 bg-zinc-800 text-zinc-300 text-xs py-2 rounded-lg"
                            >
                                Vazgeç
                            </button>
                            <button
                                onClick={reddet}
                                className="flex-1 bg-red-500 hover:bg-red-400 text-white text-xs font-semibold py-2 rounded-lg"
                            >
                                Reddet
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default function SuperAdmin() {
    const [istatistik, setIstatistik] = useState(null);
    const [tenantlar, setTenantlar] = useState([]);
    const [secili, setSecili] = useState(null);
    const [yukleniyor, setYukleniyor] = useState(true);
    const [arama, setArama] = useState('');
    const [lisansForm, setLisansForm] = useState({ lisansBitis: '', lisansNot: '' });
    const [aktifSekme, setAktifSekme] = useState('firmalar'); // 'firmalar' | 'odemeler'
    const [bekleyenSayisi, setBekleyenSayisi] = useState(0);

    const kullanici = useAuthStore(s => s.kullanici);
    const navigate = useNavigate();

    useEffect(() => {
        if (kullanici?.rol !== 'SUPER_ADMIN') { navigate('/'); return; }
        veriGetir();
        bekleyenSayisiniGetir();
    }, []);

    useEffect(() => {
        if (secili) {
            setLisansForm({
                lisansBitis: secili.lisansBitis ? new Date(secili.lisansBitis).toISOString().split('T')[0] : '',
                lisansNot: secili.lisansNot || '',
            });
        }
    }, [secili?.id]);

    const veriGetir = useCallback(async () => {
        setYukleniyor(true);
        try {
            const [istat, tenantRes] = await Promise.all([
                api.get('/api/super-admin/istatistikler'),
                api.get('/api/super-admin/tenantlar'),
            ]);
            setIstatistik(istat.data.data);
            setTenantlar(tenantRes.data.data);
        } catch {
            toast.error('Veri yüklenemedi');
        } finally {
            setYukleniyor(false);
        }
    }, []);

    const bekleyenSayisiniGetir = useCallback(async () => {
        try {
            const res = await api.get('/api/odeme/bekleyenler');
            setBekleyenSayisi(res.data.length);
        } catch {
            // sessiz geç
        }
    }, []);

    const aktifPasifYap = async (id, aktif) => {
        try {
            await api.patch(`/api/super-admin/tenantlar/${id}/aktif`, { aktif });
            toast.success(aktif ? 'Firma aktif edildi' : 'Firma pasife alındı');
            setTenantlar(t => t.map(x => x.id === id ? { ...x, aktif } : x));
            if (secili?.id === id) setSecili(s => ({ ...s, aktif }));
        } catch {
            toast.error('İşlem başarısız');
        }
    };

    const hizliUzat = async (tenantId, gun) => {
        try {
            const firma = tenantlar.find(f => f.id === tenantId);
            const mevcutBitis = firma?.lisansBitis ? new Date(firma.lisansBitis) : new Date();
            const yeniBitis = new Date(mevcutBitis);
            yeniBitis.setDate(yeniBitis.getDate() + gun);

            await api.patch(`/api/super-admin/tenantlar/${tenantId}/lisans`, {
                lisansBitis: yeniBitis.toISOString(),
                lisansNot: `${gun === 30 ? 'Aylık' : 'Yıllık'} uzatma - ${new Date().toLocaleDateString('tr-TR')}`,
            });

            toast.success(`Lisans ${gun === 30 ? '1 ay' : '1 yıl'} uzatıldı`);
            veriGetir();
            if (secili?.id === tenantId) {
                const res = await api.get(`/api/super-admin/tenantlar/${tenantId}`);
                setSecili(res.data.data);
            }
        } catch {
            toast.error('Lisans uzatılamadı');
        }
    };

    const planGuncelle = async (id, plan) => {
        try {
            await api.patch(`/api/super-admin/tenantlar/${id}/plan`, { plan });
            toast.success('Plan güncellendi');
            setTenantlar(t => t.map(x => x.id === id ? { ...x, plan } : x));
            if (secili?.id === id) setSecili(s => ({ ...s, plan }));
        } catch {
            toast.error('İşlem başarısız');
        }
    };

    const detayAc = async (id) => {
        if (secili?.id === id) { setSecili(null); return; }
        try {
            const res = await api.get(`/api/super-admin/tenantlar/${id}`);
            setSecili(res.data.data);
        } catch {
            toast.error('Detay yüklenemedi');
        }
    };

    const lisansKaydet = async () => {
        try {
            await api.patch(`/api/super-admin/tenantlar/${secili.id}/lisans`, {
                lisansBitis: lisansForm.lisansBitis || null,
                lisansNot: lisansForm.lisansNot || null,
            });
            toast.success('Lisans güncellendi');
            veriGetir();
        } catch {
            toast.error('Güncelleme başarısız');
        }
    };

    const filtreliTenantlar = arama.trim()
        ? tenantlar.filter(t =>
            t.ad.toLowerCase().includes(arama.toLowerCase()) ||
            t.slug.toLowerCase().includes(arama.toLowerCase())
        )
        : tenantlar;

    if (yukleniyor) return (
        <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
            <div className="text-center">
                <div className="w-8 h-8 border-2 border-lime-400/30 border-t-lime-400 rounded-full animate-spin mx-auto mb-3" />
                <p className="text-zinc-500 text-sm">Yükleniyor...</p>
            </div>
        </div>
    );

    return (
        <div className="min-h-screen bg-zinc-950 text-white p-4 md:p-6">
            <div className="max-w-7xl mx-auto">

                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h1 className="text-2xl font-black">
                            Gastro<span className="text-lime-400">BRAIN</span>
                            <span className="text-zinc-500 font-normal ml-3 text-base">Süper Admin</span>
                        </h1>
                        <p className="text-zinc-500 text-sm mt-1">Tüm firma hesaplarını yönet</p>
                    </div>
                    <button
                        onClick={() => useAuthStore.getState().cikisYap()}
                        className="text-zinc-500 hover:text-white text-sm transition-colors"
                    >
                        Çıkış
                    </button>
                </div>

                {istatistik && (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                        <IstatistikKart etiket="Toplam Firma" deger={istatistik.toplamTenant} renk="text-white" />
                        <IstatistikKart etiket="Aktif Firma" deger={istatistik.aktifTenant} renk="text-lime-400" />
                        <IstatistikKart etiket="Bu Ay Yeni" deger={istatistik.yeniKayitlar} renk="text-blue-400" />
                        <IstatistikKart etiket="Toplam Kullanıcı" deger={istatistik.toplamKullanici} renk="text-purple-400" />
                    </div>
                )}

                {/* Sekmeler */}
                <div className="flex gap-2 mb-6 border-b border-zinc-800">
                    <button
                        onClick={() => setAktifSekme('firmalar')}
                        className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${aktifSekme === 'firmalar' ? 'border-lime-400 text-lime-400' : 'border-transparent text-zinc-400 hover:text-white'}`}
                    >
                        Firmalar
                    </button>
                    <button
                        onClick={() => setAktifSekme('odemeler')}
                        className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 ${aktifSekme === 'odemeler' ? 'border-lime-400 text-lime-400' : 'border-transparent text-zinc-400 hover:text-white'}`}
                    >
                        Bekleyen Ödemeler
                        {bekleyenSayisi > 0 && (
                            <span className="bg-red-500 text-white text-xs px-1.5 py-0.5 rounded-full">{bekleyenSayisi}</span>
                        )}
                    </button>
                </div>

                {aktifSekme === 'odemeler' ? (
                    <BekleyenOdemelerPaneli onIslemSonrasi={() => { veriGetir(); bekleyenSayisiniGetir(); }} />
                ) : (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                        <div className="lg:col-span-2">
                            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden">
                                <div className="px-4 py-3 border-b border-zinc-800 flex items-center justify-between gap-3">
                                    <h2 className="font-semibold text-sm shrink-0">Firmalar ({filtreliTenantlar.length})</h2>
                                    <div className="flex items-center gap-2 flex-1 justify-end">
                                        <div className="relative">
                                            <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-zinc-500 text-xs">🔍</span>
                                            <input
                                                value={arama}
                                                onChange={e => setArama(e.target.value)}
                                                placeholder="Ara..."
                                                className="bg-zinc-800 border border-zinc-700 text-white rounded-lg pl-7 pr-3 py-1.5 text-xs outline-none focus:border-lime-400 transition-colors w-36"
                                            />
                                        </div>
                                        <button onClick={veriGetir} className="text-zinc-500 hover:text-lime-400 text-xs transition-colors shrink-0">
                                            Yenile
                                        </button>
                                    </div>
                                </div>
                                <div className="divide-y divide-zinc-800 max-h-[600px] overflow-y-auto">
                                    {filtreliTenantlar.length === 0 ? (
                                        <p className="text-zinc-600 text-sm text-center py-10">Firma bulunamadı</p>
                                    ) : filtreliTenantlar.map(t => (
                                        <div
                                            key={t.id}
                                            onClick={() => detayAc(t.id)}
                                            className={`px-4 py-3 flex items-center gap-3 cursor-pointer transition-colors ${secili?.id === t.id ? 'bg-lime-400/5 border-l-2 border-lime-400' : 'hover:bg-zinc-800/50'}`}
                                        >
                                            <div className={`w-2 h-2 rounded-full shrink-0 ${t.aktif ? 'bg-lime-400' : 'bg-zinc-600'}`} />
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2 flex-wrap">
                                                    <p className="font-medium text-sm truncate">{t.ad}</p>
                                                    <span className={`text-xs px-1.5 py-0.5 rounded font-medium shrink-0 ${PLAN_RENK[t.plan]}`}>
                                                        {PLAN_ETIKET[t.plan]}
                                                    </span>
                                                </div>
                                                <p className="text-zinc-500 text-xs font-mono">{t.slug}</p>
                                            </div>
                                            <div className="text-right shrink-0 space-y-0.5">
                                                <p className="text-xs text-zinc-400">{t._count?.kullanicilar ?? 0} kullanıcı</p>
                                                <LisansRozet bitis={t.lisansBitis} />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        <div>
                            {secili ? (
                                <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden">
                                    <div className="px-4 py-3 border-b border-zinc-800 flex items-center justify-between">
                                        <h2 className="font-semibold text-sm truncate">{secili.ad}</h2>
                                        <button onClick={() => setSecili(null)} className="text-zinc-600 hover:text-white text-xl leading-none ml-2 shrink-0">×</button>
                                    </div>

                                    <div className="p-4 space-y-5 max-h-[calc(100vh-250px)] overflow-y-auto">

                                        <div className="space-y-3">
                                            <div className="flex items-center justify-between">
                                                <span className="text-zinc-400 text-xs">Durum</span>
                                                <button
                                                    onClick={() => aktifPasifYap(secili.id, !secili.aktif)}
                                                    className={`text-xs px-3 py-1 rounded-full font-medium transition-colors ${secili.aktif ? 'bg-lime-400/10 text-lime-400 hover:bg-red-400/10 hover:text-red-400' : 'bg-zinc-800 text-zinc-400 hover:bg-lime-400/10 hover:text-lime-400'}`}
                                                >
                                                    {secili.aktif ? '✓ Aktif — Pasife Al' : '✗ Pasif — Aktif Et'}
                                                </button>
                                            </div>
                                            <div className="flex items-center justify-between">
                                                <span className="text-zinc-400 text-xs">Plan</span>
                                                <select
                                                    value={secili.plan}
                                                    onChange={(e) => planGuncelle(secili.id, e.target.value)}
                                                    className="bg-zinc-800 border border-zinc-700 text-white text-xs rounded-lg px-2 py-1 outline-none focus:border-lime-400"
                                                >
                                                    <option value="BASLANGIC">Başlangıç</option>
                                                    <option value="PROFESYONEL">Profesyonel</option>
                                                    <option value="KURUMSAL">Kurumsal</option>
                                                </select>
                                            </div>
                                        </div>

                                        <div className="space-y-2 pt-3 border-t border-zinc-800">
                                            {[
                                                { etiket: 'Slug', deger: secili.slug, mono: true },
                                                { etiket: 'Email', deger: secili.email },
                                                { etiket: 'Telefon', deger: secili.telefon || '—' },
                                                { etiket: 'Kayıt', deger: new Date(secili.createdAt).toLocaleDateString('tr-TR') },
                                                { etiket: 'Lisans Bitiş', deger: secili.lisansBitis ? new Date(secili.lisansBitis).toLocaleDateString('tr-TR') : '—' },
                                            ].map(b => (
                                                <div key={b.etiket} className="flex justify-between gap-2">
                                                    <span className="text-zinc-500 text-xs shrink-0">{b.etiket}</span>
                                                    <span className={`text-xs text-right truncate ${b.mono ? 'font-mono text-lime-400' : 'text-zinc-300'}`}>
                                                        {b.deger}
                                                    </span>
                                                </div>
                                            ))}
                                        </div>

                                        <div className="grid grid-cols-2 gap-2 pt-3 border-t border-zinc-800">
                                            {[
                                                { etiket: 'Şube', deger: secili.subeler?.length ?? 0 },
                                                { etiket: 'Kullanıcı', deger: secili.kullanicilar?.length ?? 0 },
                                                { etiket: 'Stok Kartı', deger: secili._count?.stokKartlari ?? 0 },
                                                { etiket: 'Satış', deger: secili._count?.satislar ?? 0 },
                                            ].map(s => (
                                                <div key={s.etiket} className="bg-zinc-800 rounded-xl p-2 text-center">
                                                    <p className="text-lg font-bold text-white">{s.deger}</p>
                                                    <p className="text-zinc-500 text-xs">{s.etiket}</p>
                                                </div>
                                            ))}
                                        </div>

                                        {secili.kullanicilar?.length > 0 && (
                                            <div className="pt-3 border-t border-zinc-800">
                                                <p className="text-zinc-500 text-xs mb-2 font-semibold uppercase tracking-wider">Kullanıcılar</p>
                                                <div className="space-y-2">
                                                    {secili.kullanicilar.map(k => (
                                                        <div key={k.id} className="flex items-center justify-between gap-2">
                                                            <div className="min-w-0">
                                                                <p className="text-xs text-white truncate">{k.ad}</p>
                                                                <p className="text-xs text-zinc-500 truncate">{k.email}</p>
                                                            </div>
                                                            <span className="text-xs text-zinc-500 bg-zinc-800 px-1.5 py-0.5 rounded shrink-0">
                                                                {k.rol}
                                                            </span>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                        <div className="pt-3 border-t border-zinc-800">
                                            <p className="text-zinc-500 text-xs mb-3 font-semibold uppercase tracking-wider">Lisans Yönetimi</p>

                                            <div className="flex gap-2 mb-3">
                                                <button
                                                    onClick={() => hizliUzat(secili.id, 30)}
                                                    className="flex-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-100 text-xs py-2 rounded-lg transition-colors"
                                                >
                                                    +1 Ay
                                                </button>
                                                <button
                                                    onClick={() => hizliUzat(secili.id, 365)}
                                                    className="flex-1 bg-lime-400/10 hover:bg-lime-400/20 border border-lime-400/30 text-lime-400 text-xs py-2 rounded-lg transition-colors"
                                                >
                                                    +1 Yıl
                                                </button>
                                            </div>

                                            <div className="space-y-2">
                                                <div>
                                                    <label className="text-zinc-600 text-xs mb-1 block">Manuel Bitiş Tarihi</label>
                                                    <input
                                                        type="date"
                                                        value={lisansForm.lisansBitis}
                                                        onChange={(e) => setLisansForm(f => ({ ...f, lisansBitis: e.target.value }))}
                                                        className="w-full bg-zinc-800 border border-zinc-700 text-white rounded-lg px-3 py-1.5 text-xs outline-none focus:border-lime-400 transition-colors"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="text-zinc-600 text-xs mb-1 block">Not</label>
                                                    <input
                                                        type="text"
                                                        value={lisansForm.lisansNot}
                                                        onChange={(e) => setLisansForm(f => ({ ...f, lisansNot: e.target.value }))}
                                                        placeholder="Ödeme notu..."
                                                        className="w-full bg-zinc-800 border border-zinc-700 text-white rounded-lg px-3 py-1.5 text-xs outline-none focus:border-lime-400 transition-colors"
                                                    />
                                                </div>
                                                <button
                                                    onClick={lisansKaydet}
                                                    className="w-full bg-zinc-700 hover:bg-zinc-600 text-white text-xs font-semibold rounded-lg py-2 transition-colors"
                                                >
                                                    Lisansı Kaydet
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-8 text-center">
                                    <div className="text-3xl mb-2">👈</div>
                                    <p className="text-zinc-500 text-sm">Detaylar için bir firma seçin</p>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}