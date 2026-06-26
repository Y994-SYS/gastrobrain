import { useState, useRef, useEffect, useCallback } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import useAuthStore from '../store/auth.store';
import FeedbackModal from './FeedbackModal';
import LisansBanner from './LisansBanner';

// ─── Rol Grupları ─────────────────────────────────────────────────────────────
const R = {
    STOK: ['TENANT_ADMIN', 'MUDUR', 'DEPO'],
    SATIS: ['TENANT_ADMIN', 'MUDUR', 'KASA'],
    YONETIM: ['TENANT_ADMIN', 'MUDUR'],
    ADMIN: ['TENANT_ADMIN'],
    PERSONEL: ['TENANT_ADMIN', 'MUDUR', 'PERSONEL'],
    HERKES: ['TENANT_ADMIN', 'MUDUR', 'DEPO', 'KASA', 'PERSONEL'],
};

const menuGruplari = [
    {
        baslik: 'Genel',
        roller: R.HERKES,
        items: [
            { path: '/', label: 'Dashboard', icon: '📊', roller: R.HERKES },
        ]
    },
    {
        baslik: 'Satış',
        roller: [...new Set([...R.YONETIM, ...R.SATIS])],
        items: [
            { path: '/satislar', label: 'Satışlar', icon: '💰', roller: R.SATIS },
            { path: '/receteler', label: 'Reçeteler', icon: '📝', roller: R.YONETIM },
        ]
    },
    {
        baslik: 'Stok',
        roller: R.STOK,
        items: [
            { path: '/stok/durum', label: 'Stok Durumu', icon: '📦', roller: R.STOK },
            { path: '/stok/giris-faturasi', label: 'Giriş Faturası', icon: '📥', roller: R.STOK },
            { path: '/stok/iade-faturasi', label: 'İade Faturası', icon: '↩️', roller: R.STOK },
            { path: '/stok/zayi', label: 'Zayi Gideri', icon: '🗑️', roller: R.STOK },
            { path: '/stok/tuketim', label: 'Tüketim Gideri', icon: '🍽️', roller: R.STOK },
            { path: '/stok/ay-sonu-sayim', label: 'Ay Sonu Sayım', icon: '📋', roller: R.STOK },
            { path: '/stok/transfer', label: 'Şube Transferi', icon: '🔀', roller: R.YONETIM },
        ]
    },
    {
        baslik: 'Finans',
        roller: R.YONETIM,
        items: [
            { path: '/raporlar', label: 'Raporlar', icon: '📈', roller: R.YONETIM },
            { path: '/cari-hesap', label: 'Cari Hesap', icon: '🏦', roller: R.YONETIM },
        ]
    },
    {
        baslik: 'İnsan Kaynakları',
        roller: R.PERSONEL,
        items: [
            { path: '/personel', label: 'Personel', icon: '👥', roller: R.PERSONEL },
        ]
    },
    {
        baslik: 'Tanımlamalar',
        roller: R.STOK,
        items: [
            { path: '/tanimlamalar/kategoriler', label: 'Kategoriler', icon: '🏷️', roller: R.STOK },
            { path: '/tanimlamalar/olcu-birimleri', label: 'Ölçü Birimleri', icon: '⚖️', roller: R.STOK },
            { path: '/tanimlamalar/stok-kartlari', label: 'Stok Kartları', icon: '🗂️', roller: R.STOK },
            { path: '/tanimlamalar/cari-kartlar', label: 'Cari Kartlar', icon: '🏢', roller: R.YONETIM },
            { path: '/tanimlamalar/subeler', label: 'Şubeler', icon: '🏪', roller: R.ADMIN },
            { path: '/tanimlamalar/kullanicilar', label: 'Kullanıcılar', icon: '👤', roller: R.ADMIN },

        ]
    },
    {
        baslik: 'Yardım',
        roller: R.HERKES,
        items: [
            { path: '/islem-gecmisi', label: 'İşlem Geçmişi', icon: '📜', roller: R.ADMIN },
            { path: '/abonelik', label: 'Abonelik', icon: '💳', roller: R.HERKES },
            { path: '/yardim', label: 'Yardım', icon: '❓', roller: R.HERKES },
            { path: '/profil', label: 'Profil', icon: '🙍', roller: R.HERKES },
        ]
    }
];

const ROL_ETIKET = {
    TENANT_ADMIN: '👑 Admin',
    MUDUR: '🏢 Müdür',
    DEPO: '📦 Depo',
    KASA: '💰 Kasa',
    PERSONEL: '👤 Personel',
};

// ─── Sidebar Nav İçeriği ──────────────────────────────────────────────────────
// Layout dışına alındı → gereksiz re-render önlendi
function SidebarNav({ navRef, aktifRef, gorunurMenu, kapali, toggleGrup, sidebarKapat, kullanici, rol, cikisYap }) {
    return (
        <>
            {/* Logo + Kullanıcı */}
            <div className="p-5 border-b border-zinc-800 flex-shrink-0 flex items-center justify-between">
                <div>
                    <div className="flex items-center gap-2">
                        <img src="/logo.png" alt="GastroBRAIN" className="w-8 h-8 object-contain" />
                        <h1 className="text-xl font-black text-white">
                            Gastro<span className="text-lime-400">BRAIN</span>
                        </h1>
                    </div>
                    <p className="text-zinc-400 text-xs mt-1 font-medium">{kullanici?.ad}</p>
                    {rol && (
                        <span className="text-zinc-600 text-xs">{ROL_ETIKET[rol] ?? rol}</span>
                    )}
                </div>
                {/* Sadece mobil'de görünen kapat butonu */}
                <button
                    onClick={sidebarKapat}
                    className="md:hidden text-zinc-400 hover:text-white p-1.5 rounded-lg hover:bg-zinc-800 transition-colors"
                    aria-label="Menüyü kapat"
                >
                    ✕
                </button>
            </div>

            {/* Navigasyon */}
            <nav
                ref={navRef}
                className="flex-1 overflow-y-auto p-2 space-y-1 scrollbar-thin scrollbar-thumb-zinc-700 scrollbar-track-transparent"
            >
                {gorunurMenu.map((grup) => (
                    <div key={grup.baslik}>
                        {/* Grup başlığı — tıklanabilir collapse */}
                        <button
                            onClick={() => toggleGrup(grup.baslik)}
                            className="w-full flex items-center justify-between px-3 py-1.5 text-xs font-bold text-zinc-500 uppercase tracking-wider hover:text-zinc-300 transition-colors rounded-md"
                        >
                            <span>{grup.baslik}</span>
                            <span
                                className="text-zinc-600 transition-transform duration-200"
                                style={{ display: 'inline-block', transform: kapali[grup.baslik] ? 'rotate(-90deg)' : 'rotate(0deg)' }}
                            >
                                ⌄
                            </span>
                        </button>

                        {!kapali[grup.baslik] && (
                            <div className="space-y-0.5 mb-1">
                                {grup.items.map((item) => {
                                    const isActive = item.path === '/'
                                        ? location.pathname === '/'
                                        : location.pathname.startsWith(item.path);

                                    return (
                                        <NavLink
                                            key={item.path}
                                            to={item.path}
                                            end={item.path === '/'}
                                            onClick={sidebarKapat}
                                            ref={isActive ? aktifRef : null}
                                            className={({ isActive }) =>
                                                [
                                                    'relative flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-all duration-150 overflow-hidden',
                                                    isActive
                                                        ? 'bg-lime-400/10 text-lime-400 font-semibold'
                                                        : 'text-zinc-400 hover:bg-zinc-800/70 hover:text-zinc-200'
                                                ].join(' ')
                                            }
                                        >
                                            {({ isActive }) => (
                                                <>
                                                    {/* Sol kenar çizgisi — aktif göstergesi */}
                                                    {isActive && (
                                                        <span className="absolute left-0 top-1 bottom-1 w-0.5 bg-lime-400 rounded-full" />
                                                    )}
                                                    <span className="text-base leading-none">{item.icon}</span>
                                                    <span className="truncate">{item.label}</span>
                                                </>
                                            )}
                                        </NavLink>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                ))}
            </nav>

            {/* Geri Bildirim */}
            <FeedbackModal />

            {/* Çıkış */}
            <div className="p-2 border-t border-zinc-800 flex-shrink-0">
                <button
                    onClick={cikisYap}
                    className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-zinc-400 hover:text-red-400 hover:bg-red-400/5 transition-colors"
                >
                    <span>🚪</span>
                    <span>Çıkış Yap</span>
                </button>
            </div>
        </>
    );
}

// ─── Ana Layout ───────────────────────────────────────────────────────────────
export default function Layout({ children }) {
    const { kullanici, cikisYap } = useAuthStore();
    const location = useLocation();
    const navRef = useRef(null);
    const aktifRef = useRef(null);
    const [sidebarAcik, setSidebarAcik] = useState(false);

    const rol = kullanici?.rol;

    // Görünür menüyü rol'e göre filtrele
    const gorunurMenu = menuGruplari
        .map(grup => ({
            ...grup,
            items: grup.items.filter(item => item.roller.includes(rol))
        }))
        .filter(grup => grup.items.length > 0);

    // Aktif sayfanın grubu açık, diğerleri kapalı başlar
    const [kapali, setKapali] = useState(() => {
        const aktifGrup = gorunurMenu.find(g =>
            g.items.some(item =>
                item.path === '/'
                    ? location.pathname === '/'
                    : location.pathname.startsWith(item.path)
            )
        )?.baslik;

        return Object.fromEntries(
            gorunurMenu.map(g => [g.baslik, g.baslik !== aktifGrup])
        );
    });

    // Aktif item'a scroll et — sayfa değişince
    useEffect(() => {
        const id = requestAnimationFrame(() => {
            if (aktifRef.current && navRef.current) {
                const nav = navRef.current;
                const item = aktifRef.current;
                const navTop = nav.scrollTop;
                const navBottom = navTop + nav.clientHeight;
                const itemTop = item.offsetTop;
                const itemBottom = itemTop + item.clientHeight;

                if (itemTop < navTop || itemBottom > navBottom) {
                    nav.scrollTo({
                        top: itemTop - nav.clientHeight / 2 + item.clientHeight / 2,
                        behavior: 'smooth'
                    });
                }
            }
        });
        return () => cancelAnimationFrame(id);
    }, [location.pathname]);

    // Sayfa değişince aktif grubun açık kalmasını sağla
    useEffect(() => {
        const aktifGrup = gorunurMenu.find(g =>
            g.items.some(item =>
                item.path === '/'
                    ? location.pathname === '/'
                    : location.pathname.startsWith(item.path)
            )
        )?.baslik;

        if (aktifGrup) {
            setKapali(prev => ({ ...prev, [aktifGrup]: false }));
        }
    }, [location.pathname]);

    const toggleGrup = useCallback((baslik) => {
        setKapali(prev => ({ ...prev, [baslik]: !prev[baslik] }));
    }, []);

    const sidebarKapat = useCallback(() => setSidebarAcik(false), []);

    const sidebarProps = {
        navRef,
        aktifRef,
        gorunurMenu,
        kapali,
        toggleGrup,
        sidebarKapat,
        kullanici,
        rol,
        cikisYap,
    };

    return (
        <div className="min-h-screen bg-zinc-950 flex">

            {/* ── Masaüstü Sidebar (sabit) ── */}
            <aside className="hidden md:flex w-56 bg-zinc-900 border-r border-zinc-800 flex-col fixed h-full z-30">
                <SidebarNav {...sidebarProps} />
            </aside>

            {/* ── Mobil Overlay ── */}
            {sidebarAcik && (
                <div
                    className="fixed inset-0 bg-black/70 z-40 md:hidden backdrop-blur-sm"
                    onClick={sidebarKapat}
                    aria-hidden="true"
                />
            )}

            {/* ── Mobil Sidebar (drawer) ── */}
            <aside
                className={`
                    fixed top-0 left-0 h-full w-64 bg-zinc-900 border-r border-zinc-800
                    flex flex-col z-50 transform transition-transform duration-300 ease-in-out md:hidden
                    ${sidebarAcik ? 'translate-x-0 shadow-2xl' : '-translate-x-full'}
                `}
                aria-label="Navigasyon menüsü"
            >
                <SidebarNav {...sidebarProps} />
            </aside>

            {/* ── İçerik Alanı ── */}
            <main className="flex-1 md:ml-56 flex flex-col min-h-screen">

                {/* Mobil Header */}
                <header className="md:hidden sticky top-0 z-20 bg-zinc-900/95 backdrop-blur border-b border-zinc-800">
                    <div className="grid grid-cols-3 items-center px-4 py-3">
                        {/* Sol — hamburger */}
                        <button
                            onClick={() => setSidebarAcik(true)}
                            className="text-zinc-400 hover:text-white p-1 justify-self-start"
                            aria-label="Menüyü aç"
                        >
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                            </svg>
                        </button>

                        {/* Orta — logo */}
                        <div className="flex items-center gap-1.5 justify-self-center">
                            <img src="/logo.png" alt="GastroBRAIN" className="w-6 h-6 object-contain" />
                            <span className="text-base font-black text-white">
                                Gastro<span className="text-lime-400">BRAIN</span>
                            </span>
                        </div>

                        {/* Sağ — boş ama dengeli */}
                        <div className="w-8 justify-self-end" />
                    </div>
                </header>

                {/* Sayfa İçeriği */}
                <div className="flex-1 p-4 md:p-6">
                    <LisansBanner />
                    {children}
                </div>
            </main>
        </div>
    );
}