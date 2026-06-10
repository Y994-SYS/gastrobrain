import { NavLink, useNavigate } from 'react-router-dom';
import useAuthStore from '../store/auth.store';

const menuItems = [
    { path: '/', label: 'Dashboard', icon: '📊' },
    { path: '/stok/durum', label: 'Stok Durumu', icon: '📦' },
    { path: '/stok/giris-faturasi', label: 'Giriş Faturası', icon: '📥' },
    { path: '/stok/iade-faturasi', label: 'İade Faturası', icon: '↩️' },
    { path: '/stok/zayi', label: 'Zayi Gideri', icon: '🗑️' },
    { path: '/stok/tuketim', label: 'Tüketim Gideri', icon: '🍽️' },
    { path: '/stok/ay-sonu-sayim', label: 'Ay Sonu Sayım', icon: '📋' },
    { path: '/tanimlamalar/kategoriler', label: 'Kategoriler', icon: '🏷️' },
    { path: '/tanimlamalar/olcu-birimleri', label: 'Ölçü Birimleri', icon: '⚖️' },
    { path: '/tanimlamalar/stok-kartlari', label: 'Stok Kartları', icon: '🗂️' },
    { path: '/tanimlamalar/cari-kartlar', label: 'Cari Kartlar', icon: '🏢' },
    { path: '/receteler', label: 'Reçeteler', icon: '📝' },
    { path: '/satislar', label: 'Satışlar', icon: '💰' },

];

export default function Layout({ children }) {
    const { kullanici, cikisYap } = useAuthStore();
    const navigate = useNavigate();

    return (
        <div className="min-h-screen bg-zinc-950 flex">
            {/* Sidebar */}
            <aside className="w-56 bg-zinc-900 border-r border-zinc-800 flex flex-col fixed h-full">
                {/* Logo */}
                <div className="p-5 border-b border-zinc-800">
                    <h1 className="text-xl font-black text-white">
                        Gastro<span className="text-lime-400">IQ</span>
                    </h1>
                    <p className="text-zinc-500 text-xs mt-0.5">{kullanici?.ad}</p>
                </div>

                {/* Menu */}
                <nav className="flex-1 p-3 space-y-1">
                    {menuItems.map((item) => (
                        <NavLink
                            key={item.path}
                            to={item.path}
                            end={item.path === '/'}
                            className={({ isActive }) =>
                                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${isActive
                                    ? 'bg-lime-400/10 text-lime-400 font-semibold'
                                    : 'text-zinc-400 hover:text-white hover:bg-zinc-800'
                                }`
                            }
                        >
                            <span>{item.icon}</span>
                            <span>{item.label}</span>
                        </NavLink>
                    ))}
                </nav>

                {/* Çıkış */}
                <div className="p-3 border-t border-zinc-800">
                    <button
                        onClick={cikisYap}
                        className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-zinc-400 hover:text-red-400 hover:bg-zinc-800 transition-colors"
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