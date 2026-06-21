import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import api from '../services/api';
import toast from 'react-hot-toast';

export default function SifreSifirla() {
    const [searchParams] = useSearchParams();
    const token = searchParams.get('token');
    const navigate = useNavigate();

    const [yeniSifre, setYeniSifre] = useState('');
    const [sifreTekrar, setSifreTekrar] = useState('');
    const [yukleniyor, setYukleniyor] = useState(false);
    const [tamamlandi, setTamamlandi] = useState(false);

    useEffect(() => {
        if (!token) navigate('/giris');
    }, [token]);

    const kaydet = async (e) => {
        e.preventDefault();
        if (yeniSifre.length < 6) return toast.error('Şifre en az 6 karakter olmalı');
        if (yeniSifre !== sifreTekrar) return toast.error('Şifreler eşleşmiyor');
        setYukleniyor(true);
        try {
            await api.post('/api/auth/sifre-sifirla', { token, yeniSifre });
            setTamamlandi(true);
            toast.success('Şifreniz güncellendi');
            setTimeout(() => navigate('/giris'), 2000);
        } catch (err) {
            toast.error(err.response?.data?.mesaj || 'Bir hata oluştu');
        } finally {
            setYukleniyor(false);
        }
    };

    return (
        <div className="min-h-screen bg-zinc-950 flex items-center justify-center p-4">
            <div className="w-full max-w-md">
                <div className="text-center mb-8">
                    <img src="/logo.png" alt="GastroBrain" className="h-14 mx-auto mb-3" />
                    <h1 className="text-2xl font-black text-white">
                        Gastro<span className="text-lime-400">BRAIN</span>
                    </h1>
                    <p className="text-zinc-400 text-sm mt-1">Restoran yönetim sistemi</p>
                </div>

                <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-8">
                    {tamamlandi ? (
                        <div className="text-center">
                            <div className="text-4xl mb-4">✅</div>
                            <h2 className="text-white font-bold text-lg mb-2">Şifre güncellendi!</h2>
                            <p className="text-zinc-400 text-sm">Giriş sayfasına yönlendiriliyorsunuz...</p>
                        </div>
                    ) : (
                        <>
                            <h2 className="text-white font-bold text-lg mb-1">Yeni şifre belirle</h2>
                            <p className="text-zinc-400 text-sm mb-6">En az 6 karakter olmalı.</p>
                            <form onSubmit={kaydet} className="space-y-4">
                                <div>
                                    <label className="text-zinc-400 text-sm mb-1 block">Yeni Şifre</label>
                                    <input
                                        type="password"
                                        value={yeniSifre}
                                        onChange={e => setYeniSifre(e.target.value)}
                                        required
                                        className="w-full bg-zinc-800 border border-zinc-700 text-white rounded-lg px-4 py-3 text-sm outline-none focus:border-lime-400 transition-colors"
                                    />
                                </div>
                                <div>
                                    <label className="text-zinc-400 text-sm mb-1 block">Yeni Şifre Tekrar</label>
                                    <input
                                        type="password"
                                        value={sifreTekrar}
                                        onChange={e => setSifreTekrar(e.target.value)}
                                        required
                                        className="w-full bg-zinc-800 border border-zinc-700 text-white rounded-lg px-4 py-3 text-sm outline-none focus:border-lime-400 transition-colors"
                                    />
                                </div>
                                <button
                                    type="submit"
                                    disabled={yukleniyor}
                                    className="w-full bg-lime-400 hover:bg-lime-300 disabled:opacity-50 text-black font-bold py-3 rounded-lg text-sm transition-colors"
                                >
                                    {yukleniyor ? 'Kaydediliyor...' : 'Şifremi Güncelle'}
                                </button>
                            </form>
                            <div className="text-center mt-4">
                                <Link to="/giris" className="text-zinc-500 text-sm hover:text-zinc-300">
                                    ← Giriş sayfasına dön
                                </Link>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}