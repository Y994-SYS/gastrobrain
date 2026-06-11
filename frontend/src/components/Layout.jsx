import { useState } from 'react';
import { NavLink } from 'react-router-dom';
import useAuthStore from '../store/auth.store';

const menuGruplari = [
    {
        baslik: 'Genel',
        items: [
            { path: '/', label: 'Dashboard', icon: '📊' },
        ]
    },
    {
        baslik: 'Stok',
        items: [
            { path: '/stok/durum', label: 'Stok Durumu', icon: '📦' },
            { path: '/stok/giris-faturasi', label: 'Giriş Faturası', icon: '📥' },
            { path: '/stok/iade-faturasi', label: 'İade Faturası', icon: '↩️' },
            { path: '/stok/zayi', label: 'Zayi Gideri', icon: '🗑️' },
            { path: '/stok/tuketim', label: 'Tüketim Gideri', icon: '🍽️' },
            { path: '/stok/ay-sonu-sayim', label: 'Ay Sonu Sayım', icon: '📋' },
        ]
    },
    {
        baslik: 'Satış',
        items: [
            { path: '/receteler', label: 'Reçeteler', icon: '📝' },
            { path: '/satislar', label: 'Satışlar', icon: '💰' },
        ]
    },
    {
        baslik: 'Finans',
        items: [
            { path: '/cari-hesap', label: 'Cari Hesap', icon: '🏦' },
            { path: '/raporlar', label: 'Raporlar', icon: '📈' },
        ]
    },
    {
        baslik: 'İnsan Kaynakları',
        items: [
            { path: '/personel', label: 'Personel', icon: '👥' },
        ]
    },
    {
        baslik: 'Tanımlamalar',
        items: [
            { path: '/tanimlamalar/kategoriler', label: 'Kategoriler', icon: '🏷️' },
            { path: '/tanimlamalar/olcu-birimleri', label: 'Ölçü Birimleri', icon: '⚖️' },
            { path: '/tanimlamalar/stok-kartlari', label: 'Stok Kartları', icon: '🗂️' },
            { path: '/tanimlamalar/cari-kartlar', label: 'Cari Kartlar', icon: '🏢' },
            { path: '/tanimlamalar/subeler', label: 'Şubeler', icon: '🏪' }
        ]
    },
];

export default function Layout({ children }) {
    const { kullanici, cikisYap } = useAuthStore();
    const [kapali, setKapali] = useState({});

    const toggleGrup = (baslik) => {
        setKapali(prev => ({ ...prev, [baslik]: !prev[baslik] }));
    };

    return (
        <div className="min-h-screen bg-zinc-950 flex">
            {/* Sidebar */}
            <aside className="w-56 bg-zinc-900 border-r border-zinc-800 flex flex-col fixed h-full">
                {/* Logo */}
                <div className="p-5 border-b border-zinc-800 flex-shrink-0">
                    <h1 className="text-xl font-black text-white">
                        Gastro<span className="text-lime-400">IQ</span>
                    </h1>
                    <p className="text-zinc-500 text-xs mt-0.5">{kullanici?.ad}</p>
                </div>

                {/* Menu */}
                <nav className="flex-1 overflow-y-auto p-2 space-y-1 scrollbar-thin">
                    {menuGruplari.map((grup) => (
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

                {/* Çıkış */}
                <div className="p-2 border-t border-zinc-800 flex-shrink-0">
                    <button
                        onClick={cikisYap}
                        className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-zinc-400 hover:text-red-400 hover:bg-zinc-800 transition-colors"
                    >
                        <span>🚪</span>
                        <span>Çıkış Yap</span>
                    </button>
                </div>
            </aside>

            {/* Main */}
            <main className="flex-1 ml-56 p-6">
                {children}
            </main>
        </div>
    );
}