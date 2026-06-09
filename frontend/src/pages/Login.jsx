import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import useAuthStore from '../store/auth.store';

export default function Login() {
    const [email, setEmail] = useState('');
    const [sifre, setSifre] = useState('');
    const [hata, setHata] = useState('');
    const [yukleniyor, setYukleniyor] = useState(false);
    const girisYap = useAuthStore((s) => s.girisYap);
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setHata('');
        setYukleniyor(true);
        try {
            await girisYap(email, sifre);
            navigate('/');
        } catch (err) {
            setHata(err.response?.data?.mesaj || 'Giriş başarısız');
        } finally {
            setYukleniyor(false);
        }
    };

    return (
        <div className="min-h-screen bg-zinc-950 flex items-center justify-center p-4">
            <div className="w-full max-w-sm">

                {/* Logo */}
                <div className="text-center mb-8">
                    <h1 className="text-3xl font-black text-white tracking-tight">
                        Gastro<span className="text-lime-400">IQ</span>
                    </h1>
                    <p className="text-zinc-500 text-sm mt-2">Restoran yönetim sistemi</p>
                </div>

                {/* Form */}
                <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
                    <h2 className="text-white font-bold text-lg mb-6">Giriş Yap</h2>

                    {hata && (
                        <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-sm rounded-lg p-3 mb-4">
                            {hata}
                        </div>
                    )}

                    <div className="space-y-4">
                        <div>
                            <label className="text-zinc-400 text-sm mb-1.5 block">Email</label>
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="admin@gastroiq.com"
                                className="w-full bg-zinc-800 border border-zinc-700 text-white rounded-lg px-4 py-2.5 text-sm outline-none focus:border-lime-400 transition-colors"
                            />
                        </div>

                        <div>
                            <label className="text-zinc-400 text-sm mb-1.5 block">Şifre</label>
                            <input
                                type="password"
                                value={sifre}
                                onChange={(e) => setSifre(e.target.value)}
                                placeholder="••••••••"
                                className="w-full bg-zinc-800 border border-zinc-700 text-white rounded-lg px-4 py-2.5 text-sm outline-none focus:border-lime-400 transition-colors"
                            />
                        </div>

                        <button
                            type="button"
                            onClick={handleSubmit}
                            disabled={yukleniyor}
                            className="w-full bg-lime-400 hover:bg-lime-300 disabled:opacity-50 text-black font-bold rounded-lg py-2.5 text-sm transition-colors mt-2"
                        >
                            {yukleniyor ? 'Giriş yapılıyor...' : 'Giriş Yap'}
                        </button>
                    </div>
                </div>

            </div>
        </div>
    );
}