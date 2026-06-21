import { useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import toast from 'react-hot-toast';

export default function SifremiUnuttum() {
    const [email, setEmail] = useState('');
    const [gonderildi, setGonderildi] = useState(false);
    const [yukleniyor, setYukleniyor] = useState(false);

    const gonder = async (e) => {
        e.preventDefault();
        if (!email.trim()) return toast.error('Email girin');
        setYukleniyor(true);
        try {
            await api.post('/api/auth/sifre-sifirlama-talep', { email });
            setGonderildi(true);
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
                    {gonderildi ? (
                        <div className="text-center">
                            <div className="text-4xl mb-4">📧</div>
                            <h2 className="text-white font-bold text-lg mb-2">Email gönderildi</h2>
                            <p className="text-zinc-400 text-sm mb-6">
                                Eğer bu email ile kayıtlı bir hesap varsa, şifre sıfırlama bağlantısı gönderildi. Spam klasörünüzü de kontrol edin.
                            </p>
                            <Link to="/giris" className="text-lime-400 text-sm hover:underline">
                                Giriş sayfasına dön →
                            </Link>
                        </div>
                    ) : (
                        <>
                            <h2 className="text-white font-bold text-lg mb-1">Şifremi unuttum</h2>
                            <p className="text-zinc-400 text-sm mb-6">
                                Email adresinizi girin, şifre sıfırlama bağlantısı gönderelim.
                            </p>
                            <form onSubmit={gonder} className="space-y-4">
                                <div>
                                    <label className="text-zinc-400 text-sm mb-1 block">Email</label>
                                    <input
                                        type="email"
                                        value={email}
                                        onChange={e => setEmail(e.target.value)}
                                        placeholder="ornek@email.com"
                                        required
                                        className="w-full bg-zinc-800 border border-zinc-700 text-white rounded-lg px-4 py-3 text-sm outline-none focus:border-lime-400 transition-colors"
                                    />
                                </div>
                                <button
                                    type="submit"
                                    disabled={yukleniyor}
                                    className="w-full bg-lime-400 hover:bg-lime-300 disabled:opacity-50 text-black font-bold py-3 rounded-lg text-sm transition-colors"
                                >
                                    {yukleniyor ? 'Gönderiliyor...' : 'Sıfırlama Bağlantısı Gönder'}
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