import { useState } from 'react';
import { NavLink } from 'react-router-dom';
import useAuthStore from '../store/auth.store';
import FeedbackModal from './FeedbackModal';
import LisansBanner from './LisansBanner';

// ─── Rol Grupları ─────────────────────────────────────────────────────────────
// NOT: SUPER_ADMIN bilerek burada yok — süper admin bu Layout'u (normal uygulama
// arayüzünü) hiç görmüyor, App.jsx içindeki PrivateRoute onu /super-admin'e
// yönlendiriyor. Bu yüzden sidebar filtrelemesi sadece tenant'lı roller içindir.
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
        baslik: 'Stok',
        roller: R.STOK,
        items: [
            { path: '/stok/durum', label: 'Stok Durumu', icon: '📦', roller: R.STOK },
            { path: '/stok/giris-faturasi', label: 'Giriş Faturası', icon: '📥', roller: R.STOK },
            { path: '/stok/iade-faturasi', label: 'İade Faturası', icon: '↩️', roller: R.STOK },
            { path: '/stok/zayi', label: 'Zayi Gideri', icon: '🗑️', roller: R.STOK },
            { path: '/stok/tuketim', label: 'Tüketim Gideri', icon: '🍽️', roller: R.STOK },
            { path: '/stok/ay-sonu-sayim', label: 'Ay Sonu Sayım', icon: '📋', roller: R.STOK },
        ]
    },
    {
        baslik: 'Satış',
        roller: [...new Set([...R.YONETIM, ...R.SATIS])],
        items: [
            { path: '/receteler', label: 'Reçeteler', icon: '📝', roller: R.YONETIM },
            { path: '/satislar', label: 'Satışlar', icon: '💰', roller: R.SATIS },
        ]
    },
    {
        baslik: 'Finans',
        roller: R.YONETIM,
        items: [
            { path: '/cari-hesap', label: 'Cari Hesap', icon: '🏦', roller: R.YONETIM },
            { path: '/raporlar', label: 'Raporlar', icon: '📈', roller: R.YONETIM },
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
            { path: '/abonelik', label: 'Abonelik', icon: '💳', roller: R.HERKES },
            { path: '/yardim', label: 'Yardım', icon: '❓', roller: R.HERKES },
            { path: '/profil', label: 'Profil', icon: '🙍', roller: R.HERKES },
        ]
    }
];

export default function Layout({ children }) {
    const { kullanici, cikisYap } = useAuthStore();
    const [kapali, setKapali] = useState({});
    const [sidebarAcik, setSidebarAcik] = useState(false);

    const rol = kullanici?.rol;

    const gorunurMenu = menuGruplari
        .map(grup => ({
            ...grup,
            items: grup.items.filter(item => item.roller.includes(rol))
        }))
        .filter(grup => grup.items.length > 0);

    const toggleGrup = (baslik) => {
        setKapali(prev => ({ ...prev, [baslik]: !prev[baslik] }));
    };

    const sidebarKapat = () => setSidebarAcik(false);

    const ROL_ETIKET = {
        TENANT_ADMIN: '👑 Admin',
        MUDUR: '🏢 Müdür',
        DEPO: '📦 Depo',
        KASA: '💰 Kasa',
        PERSONEL: '👤 Personel',
    };

    const SidebarIcerik = () => (
        <>
            <div className="p-5 border-b border-zinc-800 flex-shrink-0 flex items-center justify-between">
                <div>
                    <h1 className="text-xl font-black text-white">
                        Gastro<span className="text-lime-400">BRAIN</span>
                    </h1>
                    <p className="text-zinc-500 text-xs mt-0.5">{kullanici?.ad}</p>
                    {rol && (
                        <span className="text-zinc-600 text-xs">{ROL_ETIKET[rol] ?? rol}</span>
                    )}
                </div>
                <button
                    onClick={sidebarKapat}
                    className="md:hidden text-zinc-400 hover:text-white p-1"
                >
                    ✕
                </button>
            </div>

            <nav className="flex-1 overflow-y-auto p-2 space-y-1 scrollbar-thin">
                {gorunurMenu.map((grup) => (
                    <div key={grup.baslik}>
                        <button
                            onClick={() => toggleGrup(grup.baslik)}
                            className="w-full flex items-center justify-between px-3 py-1.5 text-xs font-bold text-zinc-500 uppercase tracking-wider hover:text-zinc-300 transition-colors"
                        >
                            <span>{grup.baslik}</span>
                            <span className="text-zinc-600">{kapali[grup.baslik] ? '›' : '⌄'}</span>
                        </button>

                        {!kapali[grup.baslik] && (
                            <div className="space-y-0.5 mb-1">
                                {grup.items.map((item) => (
                                    <NavLink
                                        key={item.path}
                                        to={item.path}
                                        end={item.path === '/'}
                                        onClick={sidebarKapat}
                                        className={({ isActive }) =>
                                            `flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors ${isActive
                                                ? 'bg-lime-400/10 text-lime-400 font-semibold'
                                                : 'text-zinc-400 hover:text-white hover:bg-zinc-800'
                                            }`
                                        }
                                    >
                                        <span className="text-base">{item.icon}</span>
                                        <span className="truncate">{item.label}</span>
                                    </NavLink>
                                ))}
                            </div>
                        )}
                    </div>
                ))}
            </nav>

            <FeedbackModal />

            <div className="p-2 border-t border-zinc-800 flex-shrink-0">
                <button
                    onClick={cikisYap}
                    className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-zinc-400 hover:text-red-400 hover:bg-zinc-800 transition-colors"
                >
                    <span>🚪</span>
                    <span>Çıkış Yap</span>
                </button>
            </div>
        </>
    );

    return (
        <div className="min-h-screen bg-zinc-950 flex">
            <aside className="hidden md:flex w-56 bg-zinc-900 border-r border-zinc-800 flex-col fixed h-full z-30">
                <SidebarIcerik />
            </aside>

            {sidebarAcik && (
                <div
                    className="fixed inset-0 bg-black/60 z-40 md:hidden"
                    onClick={sidebarKapat}
                />
            )}

            <aside className={`
        fixed top-0 left-0 h-full w-64 bg-zinc-900 border-r border-zinc-800
        flex flex-col z-50 transform transition-transform duration-300 md:hidden
        ${sidebarAcik ? 'translate-x-0' : '-translate-x-full'}
      `}>
                <SidebarIcerik />
            </aside>

            <main className="flex-1 md:ml-56 flex flex-col min-h-screen">
                <div className="md:hidden flex items-center justify-between px-4 py-3 bg-zinc-900 border-b border-zinc-800 sticky top-0 z-20">
                    <button
                        onClick={() => setSidebarAcik(true)}
                        className="text-zinc-400 hover:text-white p-1"
                    >
                        <span className="text-2xl">☰</span>
                    </button>
                    <h1 className="text-lg font-black text-white">
                        Gastro<span className="text-lime-400">BRAIN</span>
                    </h1>
                    <div className="w-8" />
                </div>

                <div className="flex-1 p-4 md:p-6">
                    <LisansBanner />
                    {children}
                </div>
            </main>
        </div>
    );
}