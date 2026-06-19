import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import useAuthStore from '../store/auth.store';

// ─── Personel Dashboard ───────────────────────────────────────────────────────
// PERSONEL rolü için — sadece kendi bilgilerini görür, finansal veriye dokunmaz
function PersonelDashboard() {
    const { kullanici } = useAuthStore();
    const navigate = useNavigate();
    const bugun = new Date().toLocaleDateString('tr-TR', {
        weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
    });

    return (
        <div>
            <div className="mb-6">
                <h1 className="text-xl font-bold text-white">Dashboard</h1>
                <p className="text-zinc-500 text-sm mt-0.5">{bugun}</p>
            </div>

            {/* Hoş geldin kartı */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 mb-4">
                <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-full bg-lime-400/10 border border-lime-400/20 flex items-center justify-center text-2xl">
                        👤
                    </div>
                    <div>
                        <p className="text-zinc-400 text-sm">Hoş geldin,</p>
                        <p className="text-white text-xl font-bold">{kullanici?.ad}</p>
                        <span className="inline-block mt-1 text-xs bg-zinc-800 text-zinc-400 px-2 py-0.5 rounded-full">
                            Personel
                        </span>
                    </div>
                </div>
            </div>

            {/* Hızlı erişim */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden">
                <div className="p-4 border-b border-zinc-800">
                    <h2 className="text-sm font-bold text-white">⚡ Hızlı Erişim</h2>
                </div>
                <div className="p-4 grid grid-cols-1 gap-3">
                    <button
                        onClick={() => navigate('/personel')}
                        className="border border-lime-500/20 hover:border-lime-500/50 bg-zinc-800/50 rounded-xl p-4 text-left transition-colors flex items-center gap-3"
                    >
                        <span className="text-2xl">👥</span>
                        <div>
                            <div className="text-sm font-semibold text-white">Personel Bilgilerim</div>
                            <div className="text-xs text-zinc-500 mt-0.5">Devam, mesai ve avans kayıtlarım</div>
                        </div>
                    </button>
                    <button
                        onClick={() => navigate('/profil')}
                        className="border border-zinc-700 hover:border-zinc-500 bg-zinc-800/50 rounded-xl p-4 text-left transition-colors flex items-center gap-3"
                    >
                        <span className="text-2xl">🙍</span>
                        <div>
                            <div className="text-sm font-semibold text-white">Profilim</div>
                            <div className="text-xs text-zinc-500 mt-0.5">Şifre değiştir, bilgilerimi güncelle</div>
                        </div>
                    </button>
                    <button
                        onClick={() => navigate('/yardim')}
                        className="border border-zinc-700 hover:border-zinc-500 bg-zinc-800/50 rounded-xl p-4 text-left transition-colors flex items-center gap-3"
                    >
                        <span className="text-2xl">❓</span>
                        <div>
                            <div className="text-sm font-semibold text-white">Yardım</div>
                            <div className="text-xs text-zinc-500 mt-0.5">Kullanım kılavuzu ve SSS</div>
                        </div>
                    </button>
                </div>
            </div>
        </div>
    );
}

// ─── Yönetim Dashboard ────────────────────────────────────────────────────────
// TENANT_ADMIN, MUDUR, SUPER_ADMIN için tam dashboard
function YonetimDashboard() {
    const [stoklar, setStoklar] = useState([]);
    const [satislar, setSatislar] = useState([]);
    const [cariler, setCariler] = useState([]);
    const [gunlukToplam, setGunlukToplam] = useState(0);
    const navigate = useNavigate();
    const { kullanici } = useAuthStore();
    const rol = kullanici?.rol;

    useEffect(() => {
        const getir = async () => {
            try {
                const [stokRes, satisRes, cariRes, gunlukRes] = await Promise.all([
                    api.get('/api/stok/durum?subeId=1'),
                    api.get('/api/satislar?subeId=1'),
                    api.get('/api/cari-hareketler/bakiyeler'),
                    api.get('/api/satislar/gunluk-toplam?subeId=1'),
                ]);
                setStoklar(stokRes.data.data);
                setSatislar(satisRes.data.data.slice(0, 5));
                setCariler(cariRes.data.data.filter(c => c.bakiye > 0).slice(0, 5));
                setGunlukToplam(gunlukRes.data.data.toplam);
            } catch (err) {
                console.error(err);
            }
        };
        getir();
    }, []);

    const kritikStoklar = stoklar.filter(s => s.kritik);
    const toplamBorc = cariler.reduce((t, c) => t + c.bakiye, 0);
    const bugunSatisSayisi = satislar.filter(s => {
        const bugun = new Date().toDateString();
        return new Date(s.tarih).toDateString() === bugun;
    }).length;

    // Hızlı erişim butonları — role göre filtrele
    const hizliErisim = [
        { label: 'Giriş Faturası', path: '/stok/giris-faturasi', icon: '📥', renk: 'border-blue-500/20 hover:border-blue-500/50', roller: ['SUPER_ADMIN', 'TENANT_ADMIN', 'MUDUR', 'DEPO'] },
        { label: 'Yeni Satış', path: '/satislar', icon: '💰', renk: 'border-lime-500/20 hover:border-lime-500/50', roller: ['SUPER_ADMIN', 'TENANT_ADMIN', 'MUDUR', 'KASA'] },
        { label: 'Zayi Gideri', path: '/stok/zayi', icon: '🗑️', renk: 'border-red-500/20 hover:border-red-500/50', roller: ['SUPER_ADMIN', 'TENANT_ADMIN', 'MUDUR', 'DEPO'] },
        { label: 'Tüketim', path: '/stok/tuketim', icon: '🍽️', renk: 'border-orange-500/20 hover:border-orange-500/50', roller: ['SUPER_ADMIN', 'TENANT_ADMIN', 'MUDUR', 'DEPO'] },
        { label: 'Reçete Ekle', path: '/receteler', icon: '📝', renk: 'border-purple-500/20 hover:border-purple-500/50', roller: ['SUPER_ADMIN', 'TENANT_ADMIN', 'MUDUR'] },
        { label: 'Ay Sonu Sayım', path: '/stok/ay-sonu-sayim', icon: '📋', renk: 'border-zinc-500/20 hover:border-zinc-500/50', roller: ['SUPER_ADMIN', 'TENANT_ADMIN', 'MUDUR', 'DEPO'] },
    ].filter(item => item.roller.includes(rol));

    return (
        <div>
            <div className="mb-6">
                <h1 className="text-xl font-bold text-white">Dashboard</h1>
                <p className="text-zinc-500 text-sm mt-0.5">
                    {new Date().toLocaleDateString('tr-TR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                </p>
            </div>

            {/* Özet Kartlar */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5">
                    <div className="text-xs text-zinc-500 mb-1">Günlük Satış</div>
                    <div className="text-2xl font-black text-lime-400">₺{gunlukToplam.toFixed(2)}</div>
                    <div className="text-xs text-zinc-500 mt-1">{bugunSatisSayisi} işlem</div>
                </div>
                <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5">
                    <div className="text-xs text-zinc-500 mb-1">Kritik Stok</div>
                    <div className="text-2xl font-black text-red-400">{kritikStoklar.length}</div>
                    <div className="text-xs text-zinc-500 mt-1">kalem minimum altında</div>
                </div>
                <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5">
                    <div className="text-xs text-zinc-500 mb-1">Toplam Borç</div>
                    <div className="text-2xl font-black text-orange-400">₺{toplamBorc.toFixed(2)}</div>
                    <div className="text-xs text-zinc-500 mt-1">{cariler.length} tedarikçi</div>
                </div>
                <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5">
                    <div className="text-xs text-zinc-500 mb-1">Stok Kalemi</div>
                    <div className="text-2xl font-black text-blue-400">{stoklar.length}</div>
                    <div className="text-xs text-zinc-500 mt-1">toplam ürün</div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Kritik Stoklar */}
                <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden">
                    <div className="p-4 border-b border-zinc-800 flex justify-between items-center">
                        <h2 className="text-sm font-bold text-white">⚠️ Kritik Stoklar</h2>
                        <button onClick={() => navigate('/stok/durum')} className="text-xs text-zinc-500 hover:text-lime-400 transition-colors">Tümü →</button>
                    </div>
                    <div className="divide-y divide-zinc-800">
                        {kritikStoklar.length === 0 ? (
                            <div className="text-center py-8 text-zinc-500 text-sm">✓ Kritik stok yok</div>
                        ) : kritikStoklar.slice(0, 6).map((s) => (
                            <div key={s.id} className="px-4 py-3 flex justify-between items-center">
                                <div>
                                    <div className="text-sm text-white">{s.ad}</div>
                                    <div className="text-xs text-zinc-500">{s.kategori?.ad}</div>
                                </div>
                                <div className="text-right">
                                    <div className="text-sm font-mono text-red-400">{s.mevcutStok.toFixed(2)} {s.birim?.kisaltma}</div>
                                    <div className="text-xs text-zinc-500">min: {s.minStok}</div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Son Satışlar */}
                <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden">
                    <div className="p-4 border-b border-zinc-800 flex justify-between items-center">
                        <h2 className="text-sm font-bold text-white">💰 Son Satışlar</h2>
                        <button onClick={() => navigate('/satislar')} className="text-xs text-zinc-500 hover:text-lime-400 transition-colors">Tümü →</button>
                    </div>
                    <div className="divide-y divide-zinc-800">
                        {satislar.length === 0 ? (
                            <div className="text-center py-8 text-zinc-500 text-sm">Henüz satış yok</div>
                        ) : satislar.map((s) => (
                            <div key={s.id} className="px-4 py-3 flex justify-between items-center">
                                <div>
                                    <div className="text-sm text-white">{s.recete?.ad}</div>
                                    <div className="text-xs text-zinc-500">{s.adet} adet — {new Date(s.tarih).toLocaleDateString('tr-TR')}</div>
                                </div>
                                <div className="text-sm font-mono font-bold text-lime-400">₺{s.toplam}</div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Bekleyen Borçlar */}
                <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden">
                    <div className="p-4 border-b border-zinc-800 flex justify-between items-center">
                        <h2 className="text-sm font-bold text-white">🏦 Bekleyen Borçlar</h2>
                        <button onClick={() => navigate('/cari-hesap')} className="text-xs text-zinc-500 hover:text-lime-400 transition-colors">Tümü →</button>
                    </div>
                    <div className="divide-y divide-zinc-800">
                        {cariler.length === 0 ? (
                            <div className="text-center py-8 text-zinc-500 text-sm">✓ Bekleyen borç yok</div>
                        ) : cariler.map((c) => (
                            <div key={c.id} className="px-4 py-3 flex justify-between items-center">
                                <div>
                                    <div className="text-sm text-white">{c.ad}</div>
                                    <div className="text-xs text-zinc-500 font-mono">{c.kod}</div>
                                </div>
                                <div className="text-sm font-mono font-bold text-red-400">₺{c.bakiye.toFixed(2)}</div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Hızlı Erişim */}
                <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden">
                    <div className="p-4 border-b border-zinc-800">
                        <h2 className="text-sm font-bold text-white">⚡ Hızlı Erişim</h2>
                    </div>
                    <div className="p-4 grid grid-cols-2 gap-3">
                        {hizliErisim.map((item) => (
                            <button
                                key={item.path}
                                onClick={() => navigate(item.path)}
                                className={`border ${item.renk} bg-zinc-800/50 rounded-xl p-3 text-left transition-colors`}
                            >
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
// KASA rolü için — sadece satış ile ilgili veriler
function KasaDashboard() {
    const [satislar, setSatislar] = useState([]);
    const [gunlukToplam, setGunlukToplam] = useState(0);
    const navigate = useNavigate();

    useEffect(() => {
        const getir = async () => {
            try {
                const [satisRes, gunlukRes] = await Promise.all([
                    api.get('/api/satislar?subeId=1'),
                    api.get('/api/satislar/gunluk-toplam?subeId=1'),
                ]);
                setSatislar(satisRes.data.data.slice(0, 5));
                setGunlukToplam(gunlukRes.data.data.toplam);
            } catch (err) {
                console.error(err);
            }
        };
        getir();
    }, []);

    const bugunSatisSayisi = satislar.filter(s => {
        const bugun = new Date().toDateString();
        return new Date(s.tarih).toDateString() === bugun;
    }).length;

    return (
        <div>
            <div className="mb-6">
                <h1 className="text-xl font-bold text-white">Dashboard</h1>
                <p className="text-zinc-500 text-sm mt-0.5">
                    {new Date().toLocaleDateString('tr-TR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                </p>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5">
                    <div className="text-xs text-zinc-500 mb-1">Günlük Satış</div>
                    <div className="text-2xl font-black text-lime-400">₺{gunlukToplam.toFixed(2)}</div>
                    <div className="text-xs text-zinc-500 mt-1">{bugunSatisSayisi} işlem</div>
                </div>
                <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5">
                    <div className="text-xs text-zinc-500 mb-1">Son Satışlar</div>
                    <div className="text-2xl font-black text-blue-400">{satislar.length}</div>
                    <div className="text-xs text-zinc-500 mt-1">kayıt</div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden">
                    <div className="p-4 border-b border-zinc-800 flex justify-between items-center">
                        <h2 className="text-sm font-bold text-white">💰 Son Satışlar</h2>
                        <button onClick={() => navigate('/satislar')} className="text-xs text-zinc-500 hover:text-lime-400 transition-colors">Tümü →</button>
                    </div>
                    <div className="divide-y divide-zinc-800">
                        {satislar.length === 0 ? (
                            <div className="text-center py-8 text-zinc-500 text-sm">Henüz satış yok</div>
                        ) : satislar.map((s) => (
                            <div key={s.id} className="px-4 py-3 flex justify-between items-center">
                                <div>
                                    <div className="text-sm text-white">{s.recete?.ad}</div>
                                    <div className="text-xs text-zinc-500">{s.adet} adet — {new Date(s.tarih).toLocaleDateString('tr-TR')}</div>
                                </div>
                                <div className="text-sm font-mono font-bold text-lime-400">₺{s.toplam}</div>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden">
                    <div className="p-4 border-b border-zinc-800">
                        <h2 className="text-sm font-bold text-white">⚡ Hızlı Erişim</h2>
                    </div>
                    <div className="p-4 grid grid-cols-1 gap-3">
                        <button
                            onClick={() => navigate('/satislar')}
                            className="border border-lime-500/20 hover:border-lime-500/50 bg-zinc-800/50 rounded-xl p-4 text-left transition-colors flex items-center gap-3"
                        >
                            <span className="text-2xl">💰</span>
                            <div>
                                <div className="text-sm font-semibold text-white">Yeni Satış Ekle</div>
                                <div className="text-xs text-zinc-500 mt-0.5">Günlük satış girişi</div>
                            </div>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

// ─── DEPO Dashboard ───────────────────────────────────────────────────────────
// DEPO rolü için — sadece stok verileri
function DepoDashboard() {
    const [stoklar, setStoklar] = useState([]);
    const navigate = useNavigate();

    useEffect(() => {
        const getir = async () => {
            try {
                const stokRes = await api.get('/api/stok/durum?subeId=1');
                setStoklar(stokRes.data.data);
            } catch (err) {
                console.error(err);
            }
        };
        getir();
    }, []);

    const kritikStoklar = stoklar.filter(s => s.kritik);

    return (
        <div>
            <div className="mb-6">
                <h1 className="text-xl font-bold text-white">Dashboard</h1>
                <p className="text-zinc-500 text-sm mt-0.5">
                    {new Date().toLocaleDateString('tr-TR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                </p>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5">
                    <div className="text-xs text-zinc-500 mb-1">Kritik Stok</div>
                    <div className="text-2xl font-black text-red-400">{kritikStoklar.length}</div>
                    <div className="text-xs text-zinc-500 mt-1">kalem minimum altında</div>
                </div>
                <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5">
                    <div className="text-xs text-zinc-500 mb-1">Stok Kalemi</div>
                    <div className="text-2xl font-black text-blue-400">{stoklar.length}</div>
                    <div className="text-xs text-zinc-500 mt-1">toplam ürün</div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden">
                    <div className="p-4 border-b border-zinc-800 flex justify-between items-center">
                        <h2 className="text-sm font-bold text-white">⚠️ Kritik Stoklar</h2>
                        <button onClick={() => navigate('/stok/durum')} className="text-xs text-zinc-500 hover:text-lime-400 transition-colors">Tümü →</button>
                    </div>
                    <div className="divide-y divide-zinc-800">
                        {kritikStoklar.length === 0 ? (
                            <div className="text-center py-8 text-zinc-500 text-sm">✓ Kritik stok yok</div>
                        ) : kritikStoklar.slice(0, 6).map((s) => (
                            <div key={s.id} className="px-4 py-3 flex justify-between items-center">
                                <div>
                                    <div className="text-sm text-white">{s.ad}</div>
                                    <div className="text-xs text-zinc-500">{s.kategori?.ad}</div>
                                </div>
                                <div className="text-right">
                                    <div className="text-sm font-mono text-red-400">{s.mevcutStok.toFixed(2)} {s.birim?.kisaltma}</div>
                                    <div className="text-xs text-zinc-500">min: {s.minStok}</div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden">
                    <div className="p-4 border-b border-zinc-800">
                        <h2 className="text-sm font-bold text-white">⚡ Hızlı Erişim</h2>
                    </div>
                    <div className="p-4 grid grid-cols-2 gap-3">
                        {[
                            { label: 'Giriş Faturası', path: '/stok/giris-faturasi', icon: '📥', renk: 'border-blue-500/20 hover:border-blue-500/50' },
                            { label: 'İade Faturası', path: '/stok/iade-faturasi', icon: '↩️', renk: 'border-zinc-500/20 hover:border-zinc-500/50' },
                            { label: 'Zayi Gideri', path: '/stok/zayi', icon: '🗑️', renk: 'border-red-500/20 hover:border-red-500/50' },
                            { label: 'Tüketim', path: '/stok/tuketim', icon: '🍽️', renk: 'border-orange-500/20 hover:border-orange-500/50' },
                        ].map((item) => (
                            <button
                                key={item.path}
                                onClick={() => navigate(item.path)}
                                className={`border ${item.renk} bg-zinc-800/50 rounded-xl p-3 text-left transition-colors`}
                            >
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

// ─── Ana Export — Role göre doğru dashboard'u render eder ────────────────────
export default function Dashboard() {
    const { kullanici } = useAuthStore();
    const rol = kullanici?.rol;

    if (rol === 'PERSONEL') return <PersonelDashboard />;
    if (rol === 'KASA') return <KasaDashboard />;
    if (rol === 'DEPO') return <DepoDashboard />;

    // SUPER_ADMIN, TENANT_ADMIN, MUDUR
    return <YonetimDashboard />;
}