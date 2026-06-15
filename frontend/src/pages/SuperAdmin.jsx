import { useState, useEffect } from 'react';
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

export default function SuperAdmin() {
    const [istatistik, setIstatistik] = useState(null);
    const [tenantlar, setTenantlar] = useState([]);
    const [secili, setSecili] = useState(null);
    const [yukleniyor, setYukleniyor] = useState(true);
    const kullanici = useAuthStore(s => s.kullanici);
    const navigate = useNavigate();

    useEffect(() => {
        if (kullanici?.rol !== 'SUPER_ADMIN') { navigate('/'); return; }
        veriGetir();
    }, []);

    const veriGetir = async () => {
        setYukleniyor(true);
        try {
            const [istat, tenantRes] = await Promise.all([
                api.get('/api/super-admin/istatistikler'),
                api.get('/api/super-admin/tenantlar'),
            ]);
            setIstatistik(istat.data.data);
            setTenantlar(tenantRes.data.data);
        } catch (err) {
            toast.error('Veri yüklenemedi');
        } finally {
            setYukleniyor(false);
        }
    };

    const aktifPasifYap = async (id, aktif) => {
        try {
            await api.patch(`/api/super-admin/tenantlar/${id}/aktif`, { aktif });
            toast.success(aktif ? 'Firma aktif edildi' : 'Firma pasife alındı');
            setTenantlar(t => t.map(x => x.id === id ? { ...x, aktif } : x));
            if (secili?.id === id) setSecili(s => ({ ...s, aktif }));
        } catch (err) {
            toast.error('İşlem başarısız');
        }
    };

    const planGuncelle = async (id, plan) => {
        try {
            await api.patch(`/api/super-admin/tenantlar/${id}/plan`, { plan });
            toast.success('Plan güncellendi');
            setTenantlar(t => t.map(x => x.id === id ? { ...x, plan } : x));
            if (secili?.id === id) setSecili(s => ({ ...s, plan }));
        } catch (err) {
            toast.error('İşlem başarısız');
        }
    };

    const detayAc = async (id) => {
        try {
            const res = await api.get(`/api/super-admin/tenantlar/${id}`);
            setSecili(res.data.data);
        } catch (err) {
            toast.error('Detay yüklenemedi');
        }
    };

    if (yukleniyor) return (
        <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
            <p className="text-zinc-500">Yükleniyor...</p>
        </div>
    );

    return (
        <div className="min-h-screen bg-zinc-950 text-white p-6">
            <div className="max-w-7xl mx-auto">

                {/* Başlık */}
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h1 className="text-2xl font-black">
                            Gastro<span className="text-lime-400">BRAIN</span>
                            <span className="text-zinc-500 font-normal ml-3 text-lg">Süper Admin</span>
                        </h1>
                        <p className="text-zinc-500 text-sm mt-1">Tüm firma hesaplarını yönet</p>
                    </div>
                    <button
                        onClick={() => { useAuthStore.getState().cikisYap(); }}
                        className="text-zinc-500 hover:text-white text-sm transition-colors"
                    >
                        Çıkış
                    </button>
                </div>

                {/* İstatistik Kartları */}
                {istatistik && (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                        {[
                            { etiket: 'Toplam Firma', deger: istatistik.toplamTenant, renk: 'text-white' },
                            { etiket: 'Aktif Firma', deger: istatistik.aktifTenant, renk: 'text-lime-400' },
                            { etiket: 'Bu Ay Yeni', deger: istatistik.yeniKayitlar, renk: 'text-blue-400' },
                            { etiket: 'Toplam Kullanıcı', deger: istatistik.toplamKullanici, renk: 'text-purple-400' },
                        ].map(k => (
                            <div key={k.etiket} className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
                                <p className="text-zinc-500 text-xs mb-1">{k.etiket}</p>
                                <p className={`text-2xl font-black ${k.renk}`}>{k.deger}</p>
                            </div>
                        ))}
                    </div>
                )}

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                    {/* Tenant Listesi */}
                    <div className="lg:col-span-2">
                        <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
                            <div className="px-4 py-3 border-b border-zinc-800 flex items-center justify-between">
                                <h2 className="font-semibold text-sm">Firmalar ({tenantlar.length})</h2>
                                <button onClick={veriGetir} className="text-zinc-500 hover:text-lime-400 text-xs transition-colors">
                                    Yenile
                                </button>
                            </div>
                            <div className="divide-y divide-zinc-800">
                                {tenantlar.map(t => (
                                    <div
                                        key={t.id}
                                        className={`px-4 py-3 flex items-center gap-3 hover:bg-zinc-800/50 cursor-pointer transition-colors ${secili?.id === t.id ? 'bg-zinc-800/50' : ''}`}
                                        onClick={() => detayAc(t.id)}
                                    >
                                        {/* Aktif göstergesi */}
                                        <div className={`w-2 h-2 rounded-full flex-shrink-0 ${t.aktif ? 'bg-lime-400' : 'bg-zinc-600'}`} />

                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2">
                                                <p className="font-medium text-sm truncate">{t.ad}</p>
                                                <span className={`text-xs px-1.5 py-0.5 rounded font-medium ${PLAN_RENK[t.plan]}`}>
                                                    {PLAN_ETIKET[t.plan]}
                                                </span>
                                            </div>
                                            <p className="text-zinc-500 text-xs font-mono">{t.slug}</p>
                                        </div>

                                        <div className="text-right flex-shrink-0">
                                            <p className="text-xs text-zinc-400">{t._count.kullanicilar} kullanıcı</p>
                                            <p className="text-xs text-lime-400 font-mono">
                                                ₺{(t.buAykiCiro || 0).toLocaleString('tr-TR', { minimumFractionDigits: 0 })}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                                {tenantlar.length === 0 && (
                                    <p className="text-zinc-600 text-sm text-center py-8">Firma bulunamadı</p>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Detay Paneli */}
                    <div>
                        {secili ? (
                            <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
                                <div className="px-4 py-3 border-b border-zinc-800 flex items-center justify-between">
                                    <h2 className="font-semibold text-sm truncate">{secili.ad}</h2>
                                    <button onClick={() => setSecili(null)} className="text-zinc-600 hover:text-white text-lg leading-none">×</button>
                                </div>

                                <div className="p-4 space-y-4">
                                    {/* Durum */}
                                    <div className="flex items-center justify-between">
                                        <span className="text-zinc-400 text-sm">Durum</span>
                                        <button
                                            onClick={() => aktifPasifYap(secili.id, !secili.aktif)}
                                            className={`text-xs px-3 py-1 rounded-full font-medium transition-colors ${secili.aktif ? 'bg-lime-400/10 text-lime-400 hover:bg-red-400/10 hover:text-red-400' : 'bg-zinc-800 text-zinc-400 hover:bg-lime-400/10 hover:text-lime-400'}`}
                                        >
                                            {secili.aktif ? '✓ Aktif — Pasife Al' : '✗ Pasif — Aktif Et'}
                                        </button>
                                    </div>

                                    {/* Plan */}
                                    <div className="flex items-center justify-between">
                                        <span className="text-zinc-400 text-sm">Plan</span>
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

                                    {/* Bilgiler */}
                                    <div className="space-y-2 pt-2 border-t border-zinc-800">
                                        {[
                                            { etiket: 'Slug', deger: secili.slug, mono: true },
                                            { etiket: 'Email', deger: secili.email },
                                            { etiket: 'Telefon', deger: secili.telefon || '—' },
                                            { etiket: 'Kayıt', deger: new Date(secili.createdAt).toLocaleDateString('tr-TR') },
                                        ].map(b => (
                                            <div key={b.etiket} className="flex justify-between gap-2">
                                                <span className="text-zinc-500 text-xs">{b.etiket}</span>
                                                <span className={`text-xs text-right truncate max-w-[60%] ${b.mono ? 'font-mono text-lime-400' : 'text-zinc-300'}`}>
                                                    {b.deger}
                                                </span>
                                            </div>
                                        ))}
                                    </div>

                                    {/* Sayılar */}
                                    <div className="grid grid-cols-2 gap-2 pt-2 border-t border-zinc-800">
                                        {[
                                            { etiket: 'Şube', deger: secili.subeler?.length || 0 },
                                            { etiket: 'Kullanıcı', deger: secili.kullanicilar?.length || 0 },
                                            { etiket: 'Stok Kartı', deger: secili._count?.stokKartlari || 0 },
                                            { etiket: 'Satış', deger: secili._count?.satislar || 0 },
                                        ].map(s => (
                                            <div key={s.etiket} className="bg-zinc-800 rounded-lg p-2 text-center">
                                                <p className="text-lg font-bold text-white">{s.deger}</p>
                                                <p className="text-zinc-500 text-xs">{s.etiket}</p>
                                            </div>
                                        ))}
                                    </div>

                                    {/* Kullanıcılar */}
                                    {secili.kullanicilar?.length > 0 && (
                                        <div className="pt-2 border-t border-zinc-800">
                                            <p className="text-zinc-500 text-xs mb-2">Kullanıcılar</p>
                                            <div className="space-y-1.5">
                                                {secili.kullanicilar.map(k => (
                                                    <div key={k.id} className="flex items-center justify-between">
                                                        <div>
                                                            <p className="text-xs text-white">{k.ad}</p>
                                                            <p className="text-xs text-zinc-500">{k.email}</p>
                                                        </div>
                                                        <span className="text-xs text-zinc-500 bg-zinc-800 px-1.5 py-0.5 rounded">
                                                            {k.rol}
                                                        </span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                    {/* Lisans Yönetimi */}
                                    <div className="pt-2 border-t border-zinc-800">
                                        <p className="text-zinc-500 text-xs mb-2">Lisans Yönetimi</p>
                                        <div className="space-y-2">
                                            <div>
                                                <label className="text-zinc-600 text-xs mb-1 block">Bitiş Tarihi</label>
                                                <input
                                                    type="date"
                                                    defaultValue={secili.lisansBitis ? new Date(secili.lisansBitis).toISOString().split('T')[0] : ''}
                                                    onChange={(e) => setSecili(s => ({ ...s, lisansBitis: e.target.value }))}
                                                    className="w-full bg-zinc-800 border border-zinc-700 text-white rounded-lg px-3 py-1.5 text-xs outline-none focus:border-lime-400"
                                                />
                                            </div>
                                            <div>
                                                <label className="text-zinc-600 text-xs mb-1 block">Not</label>
                                                <input
                                                    type="text"
                                                    defaultValue={secili.lisansNot || ''}
                                                    onChange={(e) => setSecili(s => ({ ...s, lisansNot: e.target.value }))}
                                                    placeholder="Ödeme notu..."
                                                    className="w-full bg-zinc-800 border border-zinc-700 text-white rounded-lg px-3 py-1.5 text-xs outline-none focus:border-lime-400"
                                                />
                                            </div>
                                            <button
                                                onClick={async () => {
                                                    try {
                                                        await api.patch(`/api/super-admin/tenantlar/${secili.id}/lisans`, {
                                                            lisansBitis: secili.lisansBitis || null,
                                                            lisansNot: secili.lisansNot || null,
                                                        });
                                                        toast.success('Lisans güncellendi');
                                                        veriGetir();
                                                    } catch {
                                                        toast.error('Güncelleme başarısız');
                                                    }
                                                }}
                                                className="w-full bg-zinc-700 hover:bg-zinc-600 text-white text-xs font-medium rounded-lg py-1.5 transition-colors"
                                            >
                                                Lisansı Kaydet
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-8 text-center">
                                <p className="text-zinc-600 text-sm">Detay görmek için<br />bir firmaya tıkla</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}