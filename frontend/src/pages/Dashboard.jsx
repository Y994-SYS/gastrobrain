import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import useAuthStore from '../store/auth.store';

const fmt = (n) => Number(n || 0).toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const bugunTarih = () => new Date().toLocaleDateString('tr-TR', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
});

// ─── Renk Kodlama Standardı ────────────────────────────────────────────────
// Yeşil (lime)  = Pozitif / Normal
// Kırmızı (red) = Kritik / Uyarı
// Sarı (amber)  = Dikkat gerektiren
// Zinc (gri)    = Nötr bilgi (durum ifade etmeyen sayaçlar)
// Bu paletin dışına çıkılmıyor; aşağıdaki tüm bileşenler bu standardı kullanır.

function SkeletonKart() {
    return (
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 animate-pulse">
            <div className="h-3 w-20 bg-zinc-700 rounded mb-2.5" />
            <div className="h-7 w-28 bg-zinc-700 rounded mb-1.5" />
            <div className="h-3 w-16 bg-zinc-800 rounded" />
        </div>
    );
}

function SkeletonListe({ satir = 3 }) {
    return (
        <div className="divide-y divide-zinc-800">
            {Array.from({ length: satir }).map((_, i) => (
                <div key={i} className="px-4 py-2.5 flex justify-between items-center animate-pulse">
                    <div className="space-y-1.5">
                        <div className="h-3.5 w-28 bg-zinc-700 rounded" />
                        <div className="h-3 w-20 bg-zinc-800 rounded" />
                    </div>
                    <div className="h-4 w-20 bg-zinc-700 rounded" />
                </div>
            ))}
        </div>
    );
}

function OzetKart({ baslik, deger, alt, renk, tikla }) {
    return (
        <div
            onClick={tikla}
            className={[
                'bg-zinc-900 border border-zinc-800 rounded-xl p-4 transition-colors',
                tikla ? 'cursor-pointer hover:border-zinc-700 active:scale-[0.98]' : ''
            ].join(' ')}
        >
            <div className="text-xs text-zinc-500 mb-1">{baslik}</div>
            <div className={`text-2xl font-black ${renk}`}>{deger}</div>
            <div className="text-xs text-zinc-500 mt-0.5">{alt}</div>
        </div>
    );
}

// ─── Kritik Stok Uyarı Bandı (Dashboard hiyerarşisinde en üstte) ─────────────
function KritikStokBandi({ adet, navigate }) {
    if (!adet) return null;
    return (
        <div
            onClick={() => navigate('/stok/durum')}
            className="mb-4 bg-red-500/10 border border-red-500/30 rounded-xl px-5 py-4 flex items-center justify-between gap-4 cursor-pointer hover:border-red-500/50 transition-colors"
        >
            <div className="flex items-center gap-3">
                <span className="text-2xl">⚠️</span>
                <div>
                    <div className="text-sm font-bold text-red-400">
                        {adet} kalem kritik stok seviyesinde
                    </div>
                    <div className="text-xs text-red-400/70 mt-0.5">Önce bunu kontrol edin</div>
                </div>
            </div>
            <span className="text-xs text-red-400 shrink-0">Görüntüle →</span>
        </div>
    );
}

// ─── Şube Özet Kartları ───────────────────────────────────────────────────────
// Bu kartlar salt-okunur bir özet amaçlıdır (TENANT_ADMIN'in tüm şubelere
// genel bakışı). Tıklamak satış ekranına GÖTÜRMEZ — satış her zaman
// kullanıcının kendi şubesi adına, Satışlar sayfasından girilir. Buradaki
// tıklama, ilgili şubenin detay/özet sayfasına (stok, satış geçmişi,
// personel, transferler) yönlendirir — bkz. SubeDetay.jsx.
function SubeOzetiPanel() {
    const [subeler, setSubeler] = useState([]);
    const [yukleniyor, setYukleniyor] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        const getir = async () => {
            try {
                const res = await api.get('/api/dashboard/subeler');
                setSubeler(res.data?.data || []);
            } catch (err) {
                console.error('Şube özeti alınamadı:', err);
            } finally {
                setYukleniyor(false);
            }
        };
        getir();
    }, []);

    // Tek şube varsa gösterme
    if (!yukleniyor && subeler.length <= 1) return null;

    return (
        <div className="mb-6">
            <div className="flex items-center justify-between mb-3">
                <h2 className="text-sm font-bold text-white">🏪 Şube Özeti</h2>
                <span className="text-xs text-zinc-500">{subeler.length} şube</span>
            </div>

            {yukleniyor ? (
                <div className="grid grid-cols-1 gap-3">
                    {[1, 2, 3].map(i => <SkeletonKart key={i} />)}
                </div>
            ) : (
                <div className="grid grid-cols-1 gap-3">
                    {subeler.map(sube => (
                        <div
                            key={sube.id}
                            onClick={() => navigate(`/tanimlamalar/subeler/${sube.id}`)}
                            className="bg-zinc-900 border border-zinc-800 hover:border-zinc-600 rounded-xl p-3.5 cursor-pointer transition-all active:scale-[0.98]"
                        >
                            {/* Şube adı + durum */}
                            <div className="flex items-center justify-between mb-2.5">
                                <h3 className="text-sm font-bold text-white truncate pr-2">{sube.ad}</h3>
                                <span className={`text-xs px-2 py-0.5 rounded-full shrink-0 ${sube.aktif ? 'bg-lime-400/10 text-lime-400' : 'bg-zinc-700 text-zinc-400'}`}>
                                    {sube.aktif ? 'Aktif' : 'Pasif'}
                                </span>
                            </div>

                            {/* Ana metrik - günlük ciro (pozitif = yeşil) */}
                            <div className="mb-2.5">
                                <div className="text-2xl font-black text-lime-400">₺{fmt(sube.gunlukCiro)}</div>
                                <div className="text-xs text-zinc-500 mt-0.5">
                                    {sube.satisSayisi > 0 ? `${sube.satisSayisi} işlem` : 'Bugün satış yok'}
                                </div>
                            </div>

                            {/* Alt metrikler */}
                            <div className="flex items-center gap-3 pt-2.5 border-t border-zinc-800">
                                <div className="flex items-center gap-1.5">
                                    <span className={`text-sm font-bold ${sube.kritikStokSayisi > 0 ? 'text-red-400' : 'text-zinc-400'}`}>
                                        {sube.kritikStokSayisi}
                                    </span>
                                    <span className="text-xs text-zinc-500">kritik</span>
                                </div>
                                <div className="w-px h-3 bg-zinc-700" />
                                <div className="flex items-center gap-1.5">
                                    <span className="text-sm font-bold text-zinc-300">{sube.kullaniciSayisi}</span>
                                    <span className="text-xs text-zinc-500">kullanıcı</span>
                                </div>
                                <div className="w-px h-3 bg-zinc-700" />
                                <div className="flex items-center gap-1.5">
                                    <span className="text-sm font-bold text-zinc-300">{sube.personelSayisi}</span>
                                    <span className="text-xs text-zinc-500">personel</span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

// ─── Merkez Depo Uyarı Paneli ─────────────────────────────────────────────────
function MerkezDepoUyariPanel() {
    const [uyarilar, setUyarilar] = useState([]);
    const [yukleniyor, setYukleniyor] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        api.get('/api/merkezdepo/durum')
            .then(r => {
                const toArray = (d) => Array.isArray(d) ? d : [];
                const kritikler = toArray(r.data).filter(u => u.durum === 'UYARI');
                setUyarilar(kritikler);
            })
            .catch(() => { })
            .finally(() => setYukleniyor(false));
    }, []);

    if (!yukleniyor && uyarilar.length === 0) return null;

    return (
        <div className="bg-zinc-900 border border-red-500/20 rounded-xl overflow-hidden mb-4">
            <div className="p-3.5 border-b border-zinc-800 flex justify-between items-center">
                <h2 className="text-sm font-bold text-white">🏭 Merkez Depo Uyarıları</h2>
                <button
                    onClick={() => navigate('/merkezdepo')}
                    className="text-xs text-zinc-500 hover:text-lime-400 transition-colors"
                >
                    Yönet →
                </button>
            </div>
            {yukleniyor ? <SkeletonListe satir={2} /> : (
                <div className="divide-y divide-zinc-800">
                    {uyarilar.map((u, i) => (
                        <div key={i} className="px-4 py-2.5 flex justify-between items-center">
                            <div>
                                <p className="text-sm text-white">{u.tanim}</p>
                                <p className="text-xs text-zinc-500">
                                    {u.altindaSayisi} şube min. stok altında
                                </p>
                            </div>
                            <span className="text-xs bg-red-900/50 text-red-400 px-2 py-1 rounded-lg font-bold">
                                ⚠️ Kritik
                            </span>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

// ─── Planlı Transfer Özet Paneli ──────────────────────────────────────────────
function PlanliTransferPanel() {
    const [planlar, setPlanlar] = useState([]);
    const [yukleniyor, setYukleniyor] = useState(true);
    const navigate = useNavigate();

    const GUNLER = ['Pazar', 'Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi'];
    const bugunGun = new Date().getDay();

    useEffect(() => {
        api.get('/api/planli-transfer')
            .then(r => {
                const toArray = (d) => Array.isArray(d) ? d : d?.data || [];
                // Bugün çalışacak aktif planlar
                const bugunPlanlar = toArray(r.data).filter(p => {
                    if (!p.aktif) return false;
                    const gunler = p.gunler.split(',').map(Number);
                    return gunler.includes(bugunGun);
                });
                setPlanlar(bugunPlanlar);
            })
            .catch(() => { })
            .finally(() => setYukleniyor(false));
    }, []);

    if (!yukleniyor && planlar.length === 0) return null;

    return (
        <div className="bg-zinc-900 border border-amber-500/20 rounded-xl overflow-hidden mb-4">
            <div className="p-3.5 border-b border-zinc-800 flex justify-between items-center">
                <h2 className="text-sm font-bold text-white">
                    ⏰ Bugün Çalışacak Transferler
                    {planlar.length > 0 && (
                        <span className="ml-2 text-xs bg-amber-400/20 text-amber-400 px-2 py-0.5 rounded-full">
                            {planlar.length}
                        </span>
                    )}
                </h2>
                <button
                    onClick={() => navigate('/stok/planli-transfer')}
                    className="text-xs text-zinc-500 hover:text-lime-400 transition-colors"
                >
                    Tümü →
                </button>
            </div>
            {yukleniyor ? <SkeletonListe satir={2} /> : (
                <div className="divide-y divide-zinc-800">
                    {planlar.map(plan => (
                        <div key={plan.id} className="px-4 py-2.5 flex justify-between items-center">
                            <div>
                                <p className="text-sm text-white">{plan.ad}</p>
                                <p className="text-xs text-zinc-500">
                                    {plan.kalemler?.length || 0} ürün —
                                    saat {String(plan.saat).padStart(2, '0')}:{String(plan.dakika).padStart(2, '0')}
                                </p>
                            </div>
                            <div className="text-right">
                                {plan.sonCalisma ? (
                                    <span className="text-xs bg-lime-900/40 text-lime-400 px-2 py-1 rounded-lg">
                                        ✓ Çalıştı
                                    </span>
                                ) : (
                                    <span className="text-xs bg-amber-900/40 text-amber-400 px-2 py-1 rounded-lg">
                                        Bekliyor
                                    </span>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

// ─── Personel Dashboard ───────────────────────────────────────────────────────
function PersonelDashboard() {
    const { kullanici } = useAuthStore();
    const navigate = useNavigate();

    return (
        <div>
            <div className="mb-6">
                <h1 className="text-xl font-bold text-white">Dashboard</h1>
                <p className="text-zinc-500 text-sm mt-0.5">{bugunTarih()}</p>
            </div>

            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 mb-4">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-lime-400/10 border border-lime-400/20 flex items-center justify-center text-xl">
                        👤
                    </div>
                    <div>
                        <p className="text-zinc-400 text-sm">Hoş geldin,</p>
                        <p className="text-white text-lg font-bold">{kullanici?.ad}</p>
                        <span className="inline-block mt-1 text-xs bg-zinc-800 text-zinc-400 px-2 py-0.5 rounded-full">Personel</span>
                    </div>
                </div>
            </div>

            <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
                <div className="p-3.5 border-b border-zinc-800">
                    <h2 className="text-sm font-bold text-white">⚡ Hızlı Erişim</h2>
                </div>
                <div className="p-3.5 grid grid-cols-1 gap-2.5">
                    {[
                        { path: '/personel', icon: '👥', label: 'Personel Bilgilerim', alt: 'Devam, mesai ve avans kayıtlarım', renk: 'border-lime-500/20 hover:border-lime-500/50' },
                        { path: '/profil', icon: '🙍', label: 'Profilim', alt: 'Şifre değiştir, bilgilerimi güncelle', renk: 'border-zinc-700 hover:border-zinc-500' },
                        { path: '/yardim', icon: '❓', label: 'Yardım', alt: 'Kullanım kılavuzu ve SSS', renk: 'border-zinc-700 hover:border-zinc-500' },
                    ].map(item => (
                        <button key={item.path} onClick={() => navigate(item.path)}
                            className={`border ${item.renk} bg-zinc-800/50 rounded-lg p-3 text-left transition-colors flex items-center gap-3`}>
                            <span className="text-xl">{item.icon}</span>
                            <div>
                                <div className="text-sm font-semibold text-white">{item.label}</div>
                                <div className="text-xs text-zinc-500 mt-0.5">{item.alt}</div>
                            </div>
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
}

// ─── Yönetim Dashboard ────────────────────────────────────────────────────────
function YonetimDashboard() {
    const [stoklar, setStoklar] = useState([]);
    const [satislar, setSatislar] = useState([]);
    const [cariler, setCariler] = useState([]);
    const [gunlukToplam, setGunlukToplam] = useState(0);
    const [gunlukIslemSayisi, setGunlukIslemSayisi] = useState(0);
    const [aylikToplam, setAylikToplam] = useState(0);
    const [aylikIslemSayisi, setAylikIslemSayisi] = useState(0);
    const [yukleniyor, setYukleniyor] = useState(true);
    const [hata, setHata] = useState(null);

    const navigate = useNavigate();
    const { kullanici } = useAuthStore();
    const rol = kullanici?.rol;
    const subeId = kullanici?.subeId;

    const getir = useCallback(async () => {
        setYukleniyor(true);
        setHata(null);
        const subeQuery = subeId ? `?subeId=${subeId}` : '';

        const [stokRes, satisRes, cariRes, gunlukRes, aylikRes] = await Promise.allSettled([
            api.get(`/api/stok/durum${subeQuery}`),
            api.get(`/api/satislar${subeQuery}`),
            api.get('/api/cari-hareketler/bakiyeler'),
            api.get(`/api/satislar/gunluk-toplam${subeQuery}`),
            api.get(`/api/satislar/aylik-toplam${subeQuery}`),
        ]);

        if (stokRes.status === 'fulfilled') setStoklar(stokRes.value.data?.data || []);
        if (satisRes.status === 'fulfilled') setSatislar((satisRes.value.data?.data || []).slice(0, 5));
        if (cariRes.status === 'fulfilled') setCariler((cariRes.value.data?.data || []).filter(c => c.bakiye > 0).slice(0, 5));
        if (gunlukRes.status === 'fulfilled') {
            const d = gunlukRes.value.data?.data;
            setGunlukToplam(d?.toplam || 0);
            setGunlukIslemSayisi(d?.islemSayisi ?? d?.count ?? 0);
        }
        if (aylikRes.status === 'fulfilled') {
            const d = aylikRes.value.data?.data;
            setAylikToplam(d?.toplam || 0);
            setAylikIslemSayisi(d?.islemSayisi ?? d?.count ?? 0);
        }

        const herhangiHata = [stokRes, satisRes, cariRes, gunlukRes, aylikRes].some(r => r.status === 'rejected');
        if (herhangiHata) setHata('Bazı veriler yüklenemedi. Sayfayı yenileyin.');
        setYukleniyor(false);
    }, [subeId]);

    useEffect(() => { getir(); }, [getir]);

    const kritikStoklar = stoklar.filter(s => s.kritik);
    const toplamBorc = cariler.reduce((t, c) => t + c.bakiye, 0);

    const hizliErisim = [
        { label: 'Giriş Faturası', path: '/stok/giris-faturasi', icon: '📥', renk: 'border-blue-500/20 hover:border-blue-500/50', roller: ['SUPER_ADMIN', 'TENANT_ADMIN', 'MUDUR', 'DEPO'] },
        { label: 'Yeni Satış', path: '/satislar', icon: '💰', renk: 'border-lime-500/20 hover:border-lime-500/50', roller: ['SUPER_ADMIN', 'TENANT_ADMIN', 'MUDUR', 'KASA'] },
        { label: 'Zayi Gideri', path: '/stok/zayi', icon: '🗑️', renk: 'border-red-500/20 hover:border-red-500/50', roller: ['SUPER_ADMIN', 'TENANT_ADMIN', 'MUDUR', 'DEPO'] },
        { label: 'Tüketim', path: '/stok/tuketim', icon: '🍽️', renk: 'border-amber-500/20 hover:border-amber-500/50', roller: ['SUPER_ADMIN', 'TENANT_ADMIN', 'MUDUR', 'DEPO'] },
        { label: 'Reçete Ekle', path: '/receteler', icon: '📝', renk: 'border-purple-500/20 hover:border-purple-500/50', roller: ['SUPER_ADMIN', 'TENANT_ADMIN', 'MUDUR'] },
        { label: 'Ay Sonu Sayım', path: '/stok/ay-sonu-sayim', icon: '📋', renk: 'border-zinc-500/20 hover:border-zinc-500/50', roller: ['SUPER_ADMIN', 'TENANT_ADMIN', 'MUDUR', 'DEPO'] },
    ].filter(item => item.roller.includes(rol));

    return (
        <div>
            <div className="mb-6">
                <h1 className="text-xl font-bold text-white">Dashboard</h1>
                <p className="text-zinc-500 text-sm mt-0.5">{bugunTarih()}</p>
            </div>

            {hata && (
                <div className="mb-4 flex items-center justify-between gap-3 bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-3">
                    <div className="flex items-center gap-2 text-sm text-red-400">
                        <span>⚠️</span><span>{hata}</span>
                    </div>
                    <button onClick={getir} className="text-xs text-red-400 hover:text-red-300 underline">Yenile</button>
                </div>
            )}

            {/* Hiyerarşi: kritik stok varsa en üstte, büyük ve dikkat çekici */}
            {!yukleniyor && <KritikStokBandi adet={kritikStoklar.length} navigate={navigate} />}

            {/* Şube Özeti — sadece TENANT_ADMIN + birden fazla şube.
                Tıklamak satışa değil, o şubenin salt-okunur detay sayfasına götürür. */}
            {rol === 'TENANT_ADMIN' && <SubeOzetiPanel />}

            {/* Merkez Depo Uyarıları — TENANT_ADMIN + MUDUR */}
            {(rol === 'TENANT_ADMIN' || rol === 'MUDUR') && <MerkezDepoUyariPanel />}

            {/* Planlı Transfer Özeti — TENANT_ADMIN + MUDUR */}
            {(rol === 'TENANT_ADMIN' || rol === 'MUDUR') && <PlanliTransferPanel />}

            {/* Özet Kartlar */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-6 min-w-0">
                {yukleniyor ? (
                    <><SkeletonKart /><SkeletonKart /><SkeletonKart /><SkeletonKart /><SkeletonKart /></>
                ) : (
                    <>
                        <OzetKart baslik="Aylık Kazanç" deger={`₺${fmt(aylikToplam)}`}
                            alt={aylikIslemSayisi > 0 ? `${aylikIslemSayisi} işlem` : 'Bu ay henüz satış yok'}
                            renk="text-lime-400" tikla={() => navigate('/satislar')} />
                        <OzetKart baslik="Günlük Satış" deger={`₺${fmt(gunlukToplam)}`}
                            alt={gunlukIslemSayisi > 0 ? `${gunlukIslemSayisi} işlem` : 'Bugün henüz satış yok'}
                            renk="text-lime-400" tikla={() => navigate('/satislar')} />
                        <OzetKart baslik="Kritik Stok" deger={kritikStoklar.length}
                            alt={kritikStoklar.length > 0 ? 'kalem minimum altında' : 'Stok seviyeleri normal'}
                            renk={kritikStoklar.length > 0 ? 'text-red-400' : 'text-lime-400'}
                            tikla={() => navigate('/stok/durum')} />
                        <OzetKart baslik="Toplam Borç" deger={`₺${fmt(toplamBorc)}`}
                            alt={cariler.length > 0 ? `${cariler.length} tedarikçi` : 'Bekleyen borç yok'}
                            renk={toplamBorc > 0 ? 'text-amber-400' : 'text-lime-400'}
                            tikla={() => navigate('/cari-hesap')} />
                        <OzetKart baslik="Stok Kalemi" deger={stoklar.length}
                            alt="toplam ürün" renk="text-zinc-300"
                            tikla={() => navigate('/stok/durum')} />
                    </>
                )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {/* Kritik Stoklar */}
                <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
                    <div className="p-3.5 border-b border-zinc-800 flex justify-between items-center">
                        <h2 className="text-sm font-bold text-white">⚠️ Kritik Stoklar</h2>
                        <button onClick={() => navigate('/stok/durum')} className="text-xs text-zinc-500 hover:text-lime-400 transition-colors">Tümü →</button>
                    </div>
                    {yukleniyor ? <SkeletonListe satir={4} /> : (
                        <div className="divide-y divide-zinc-800">
                            {kritikStoklar.length === 0 ? (
                                <div className="text-center py-6 text-zinc-500 text-sm"><div className="text-2xl mb-2">✅</div>Tüm stoklar yeterli seviyede</div>
                            ) : kritikStoklar.slice(0, 6).map((s) => (
                                <div key={s.id} className="px-4 py-2.5 flex justify-between items-center hover:bg-zinc-800/40 transition-colors">
                                    <div>
                                        <div className="text-sm text-white">{s.ad}</div>
                                        <div className="text-xs text-zinc-500">{s.kategori?.ad}</div>
                                    </div>
                                    <div className="text-right">
                                        <div className="text-sm font-mono text-red-400">{fmt(s.mevcutStok)} {s.birim?.kisaltma}</div>
                                        <div className="text-xs text-zinc-500">min: {s.minStok}</div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Son Satışlar */}
                <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
                    <div className="p-3.5 border-b border-zinc-800 flex justify-between items-center">
                        <h2 className="text-sm font-bold text-white">💰 Son Satışlar</h2>
                        <button onClick={() => navigate('/satislar')} className="text-xs text-zinc-500 hover:text-lime-400 transition-colors">Tümü →</button>
                    </div>
                    {yukleniyor ? <SkeletonListe satir={4} /> : (
                        <div className="divide-y divide-zinc-800">
                            {satislar.length === 0 ? (
                                <div className="text-center py-6 text-zinc-500 text-sm"><div className="text-2xl mb-2">🛒</div>Bugün henüz satış yapılmadı</div>
                            ) : satislar.map((s) => (
                                <div key={s.id} className="px-4 py-2.5 flex justify-between items-center hover:bg-zinc-800/40 transition-colors">
                                    <div>
                                        <div className="text-sm text-white">{s.recete?.ad}</div>
                                        <div className="text-xs text-zinc-500">{s.adet} adet — {new Date(s.tarih).toLocaleDateString('tr-TR')}</div>
                                    </div>
                                    <div className="text-sm font-mono font-bold text-lime-400">₺{fmt(s.toplam)}</div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Bekleyen Borçlar */}
                <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
                    <div className="p-3.5 border-b border-zinc-800 flex justify-between items-center">
                        <h2 className="text-sm font-bold text-white">🏦 Bekleyen Borçlar</h2>
                        <button onClick={() => navigate('/cari-hesap')} className="text-xs text-zinc-500 hover:text-lime-400 transition-colors">Tümü →</button>
                    </div>
                    {yukleniyor ? <SkeletonListe satir={3} /> : (
                        <div className="divide-y divide-zinc-800">
                            {cariler.length === 0 ? (
                                <div className="text-center py-6 text-zinc-500 text-sm"><div className="text-2xl mb-2">✅</div>Bekleyen borç yok</div>
                            ) : cariler.map((c) => (
                                <div key={c.id} className="px-4 py-2.5 flex justify-between items-center hover:bg-zinc-800/40 transition-colors">
                                    <div>
                                        <div className="text-sm text-white">{c.ad}</div>
                                        <div className="text-xs text-zinc-500 font-mono">{c.kod}</div>
                                    </div>
                                    <div className="text-sm font-mono font-bold text-amber-400">₺{fmt(c.bakiye)}</div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Hızlı Erişim */}
                <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
                    <div className="p-3.5 border-b border-zinc-800">
                        <h2 className="text-sm font-bold text-white">⚡ Hızlı Erişim</h2>
                    </div>
                    <div className="p-3.5 grid grid-cols-2 gap-2.5">
                        {hizliErisim.map((item) => (
                            <button key={item.path} onClick={() => navigate(item.path)}
                                className={`border ${item.renk} bg-zinc-800/50 rounded-lg p-3 text-left transition-colors active:scale-95`}>
                                <div className="text-lg mb-1">{item.icon}</div>
                                <div className="text-xs font-semibold text-zinc-300">{item.label}</div>
                            </button>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}

// ─── Kasa Dashboard ───────────────────────────────────────────────────────────
function KasaDashboard() {
    const [satislar, setSatislar] = useState([]);
    const [gunlukToplam, setGunlukToplam] = useState(0);
    const [gunlukIslemSayisi, setGunlukIslemSayisi] = useState(0);
    const [yukleniyor, setYukleniyor] = useState(true);
    const navigate = useNavigate();
    const { kullanici } = useAuthStore();
    const subeId = kullanici?.subeId;

    useEffect(() => {
        const subeQuery = subeId ? `?subeId=${subeId}` : '';
        const getir = async () => {
            try {
                const [satisRes, gunlukRes] = await Promise.all([
                    api.get(`/api/satislar${subeQuery}`),
                    api.get(`/api/satislar/gunluk-toplam${subeQuery}`),
                ]);
                setSatislar((satisRes.data?.data || []).slice(0, 5));
                const d = gunlukRes.data?.data;
                setGunlukToplam(d?.toplam || 0);
                setGunlukIslemSayisi(d?.islemSayisi ?? d?.count ?? 0);
            } catch (err) {
                console.error(err);
            } finally {
                setYukleniyor(false);
            }
        };
        getir();
    }, [subeId]);

    return (
        <div>
            <div className="mb-6">
                <h1 className="text-xl font-bold text-white">Dashboard</h1>
                <p className="text-zinc-500 text-sm mt-0.5">{bugunTarih()}</p>
            </div>
            <div className="grid grid-cols-2 gap-3 mb-6">
                {yukleniyor ? <><SkeletonKart /><SkeletonKart /></> : (
                    <>
                        <OzetKart baslik="Günlük Satış" deger={`₺${fmt(gunlukToplam)}`}
                            alt={gunlukIslemSayisi > 0 ? `${gunlukIslemSayisi} işlem` : 'Bugün henüz satış yok'}
                            renk="text-lime-400" />
                        <OzetKart baslik="Son Satışlar" deger={satislar.length} alt="kayıt" renk="text-zinc-300" />
                    </>
                )}
            </div>
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
                <div className="p-3.5 border-b border-zinc-800 flex justify-between items-center">
                    <h2 className="text-sm font-bold text-white">💰 Son Satışlar</h2>
                    <button onClick={() => navigate('/satislar')} className="text-xs text-zinc-500 hover:text-lime-400 transition-colors">Tümü →</button>
                </div>
                {yukleniyor ? <SkeletonListe satir={4} /> : (
                    <div className="divide-y divide-zinc-800">
                        {satislar.length === 0 ? (
                            <div className="text-center py-6 text-zinc-500 text-sm">Henüz satış yok</div>
                        ) : satislar.map((s) => (
                            <div key={s.id} className="px-4 py-2.5 flex justify-between items-center">
                                <div>
                                    <div className="text-sm text-white">{s.recete?.ad}</div>
                                    <div className="text-xs text-zinc-500">{s.adet} adet — {new Date(s.tarih).toLocaleDateString('tr-TR')}</div>
                                </div>
                                <div className="text-sm font-mono font-bold text-lime-400">₺{fmt(s.toplam)}</div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
            <div className="mt-3 bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
                <div className="p-3.5 border-b border-zinc-800"><h2 className="text-sm font-bold text-white">⚡ Hızlı Erişim</h2></div>
                <div className="p-3.5">
                    <button onClick={() => navigate('/satislar')}
                        className="w-full border border-lime-500/20 hover:border-lime-500/50 bg-zinc-800/50 rounded-lg p-3.5 text-left transition-colors flex items-center gap-3">
                        <span className="text-xl">💰</span>
                        <div>
                            <div className="text-sm font-semibold text-white">Yeni Satış Ekle</div>
                            <div className="text-xs text-zinc-500 mt-0.5">Günlük satış girişi</div>
                        </div>
                    </button>
                </div>
            </div>
        </div>
    );
}

// ─── Depo Dashboard ───────────────────────────────────────────────────────────
function DepoDashboard() {
    const [stoklar, setStoklar] = useState([]);
    const [yukleniyor, setYukleniyor] = useState(true);
    const navigate = useNavigate();
    const { kullanici } = useAuthStore();
    const subeId = kullanici?.subeId;

    useEffect(() => {
        const subeQuery = subeId ? `?subeId=${subeId}` : '';
        const getir = async () => {
            try {
                const res = await api.get(`/api/stok/durum${subeQuery}`);
                setStoklar(res.data?.data || []);
            } catch (err) {
                console.error(err);
            } finally {
                setYukleniyor(false);
            }
        };
        getir();
    }, [subeId]);

    const kritikStoklar = stoklar.filter(s => s.kritik);

    return (
        <div>
            <div className="mb-6">
                <h1 className="text-xl font-bold text-white">Dashboard</h1>
                <p className="text-zinc-500 text-sm mt-0.5">{bugunTarih()}</p>
            </div>

            {/* Hiyerarşi: kritik stok varsa en üstte, büyük ve dikkat çekici */}
            {!yukleniyor && <KritikStokBandi adet={kritikStoklar.length} navigate={navigate} />}

            <div className="grid grid-cols-2 gap-3 mb-6">
                {yukleniyor ? <><SkeletonKart /><SkeletonKart /></> : (
                    <>
                        <OzetKart baslik="Kritik Stok" deger={kritikStoklar.length}
                            alt="kalem minimum altında" renk={kritikStoklar.length > 0 ? 'text-red-400' : 'text-lime-400'}
                            tikla={() => navigate('/stok/durum')} />
                        <OzetKart baslik="Stok Kalemi" deger={stoklar.length}
                            alt="toplam ürün" renk="text-zinc-300"
                            tikla={() => navigate('/stok/durum')} />
                    </>
                )}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
                    <div className="p-3.5 border-b border-zinc-800 flex justify-between items-center">
                        <h2 className="text-sm font-bold text-white">⚠️ Kritik Stoklar</h2>
                        <button onClick={() => navigate('/stok/durum')} className="text-xs text-zinc-500 hover:text-lime-400">Tümü →</button>
                    </div>
                    {yukleniyor ? <SkeletonListe satir={4} /> : (
                        <div className="divide-y divide-zinc-800">
                            {kritikStoklar.length === 0 ? (
                                <div className="text-center py-6 text-zinc-500 text-sm"><div className="text-2xl mb-2">✅</div>Kritik stok yok</div>
                            ) : kritikStoklar.slice(0, 6).map((s) => (
                                <div key={s.id} className="px-4 py-2.5 flex justify-between items-center">
                                    <div>
                                        <div className="text-sm text-white">{s.ad}</div>
                                        <div className="text-xs text-zinc-500">{s.kategori?.ad}</div>
                                    </div>
                                    <div className="text-right">
                                        <div className="text-sm font-mono text-red-400">{fmt(s.mevcutStok)} {s.birim?.kisaltma}</div>
                                        <div className="text-xs text-zinc-500">min: {s.minStok}</div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
                <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
                    <div className="p-3.5 border-b border-zinc-800"><h2 className="text-sm font-bold text-white">⚡ Hızlı Erişim</h2></div>
                    <div className="p-3.5 grid grid-cols-2 gap-2.5">
                        {[
                            { label: 'Giriş Faturası', path: '/stok/giris-faturasi', icon: '📥', renk: 'border-blue-500/20 hover:border-blue-500/50' },
                            { label: 'İade Faturası', path: '/stok/iade-faturasi', icon: '↩️', renk: 'border-zinc-500/20 hover:border-zinc-500/50' },
                            { label: 'Zayi Gideri', path: '/stok/zayi', icon: '🗑️', renk: 'border-red-500/20 hover:border-red-500/50' },
                            { label: 'Tüketim', path: '/stok/tuketim', icon: '🍽️', renk: 'border-amber-500/20 hover:border-amber-500/50' },
                        ].map((item) => (
                            <button key={item.path} onClick={() => navigate(item.path)}
                                className={`border ${item.renk} bg-zinc-800/50 rounded-lg p-3 text-left transition-colors`}>
                                <div className="text-lg mb-1">{item.icon}</div>
                                <div className="text-xs font-semibold text-zinc-300">{item.label}</div>
                            </button>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}

// ─── Ana Export ───────────────────────────────────────────────────────────────
export default function Dashboard() {
    const { kullanici } = useAuthStore();
    const rol = kullanici?.rol;

    if (rol === 'PERSONEL') return <PersonelDashboard />;
    if (rol === 'KASA') return <KasaDashboard />;
    if (rol === 'DEPO') return <DepoDashboard />;
    return <YonetimDashboard />;
}