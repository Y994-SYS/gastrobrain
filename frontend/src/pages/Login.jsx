import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import useAuthStore from '../store/auth.store';
import api from '../services/api';

export default function Login() {
    const [adim, setAdim] = useState(1); // 1: email, 2: tenant seç + şifre
    const [email, setEmail] = useState('');
    const [sifre, setSifre] = useState('');
    const [tenantlar, setTenantlar] = useState([]);
    const [seciliTenant, setSeciliTenant] = useState(null);
    const [hata, setHata] = useState('');
    const [yukleniyor, setYukleniyor] = useState(false);
    const girisYap = useAuthStore((s) => s.girisYap);
    const navigate = useNavigate();

    const emailDevam = async () => {
        if (!email.trim()) { setHata('Email gerekli'); return; }
        setHata('');
        setYukleniyor(true);
        try {
            const res = await api.post('/api/auth/tenant-listesi', { email });
            const liste = res.data.data;
            setTenantlar(liste);
            if (liste.length === 1) {
                // Tek tenant varsa direkt seç
                setSeciliTenant(liste[0]);
            }
            setAdim(2);
        } catch (err) {
            setHata(err.response?.data?.mesaj || 'Email bulunamadı');
        } finally {
            setYukleniyor(false);
        }
    };

    const girisYapHandle = async () => {
        if (!seciliTenant) { setHata('Firma seçin'); return; }
        if (!sifre) { setHata('Şifre gerekli'); return; }
        setHata('');
        setYukleniyor(true);
        try {
            await girisYap(email, sifre, seciliTenant.tenantSlug);
            navigate('/');
        } catch (err) {
            setHata(err.response?.data?.mesaj || 'Giriş başarısız');
        } finally {
            setYukleniyor(false);
        }
    };

    const inputCls = "w-full bg-zinc-800 border border-zinc-700 text-white rounded-lg px-4 py-2.5 text-sm outline-none focus:border-lime-400 transition-colors";

    return (
        <div className="min-h-screen bg-zinc-950 flex items-center justify-center p-4">
            <div className="w-full max-w-sm">

                <div className="text-center mb-8">
                    <h1 className="text-3xl font-black text-white tracking-tight">
                        Gastro<span className="text-lime-400">BRAIN</span>
                    </h1>
                    <p className="text-zinc-500 text-sm mt-2">Restoran yönetim sistemi</p>
                </div>

                <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
                    <h2 className="text-white font-bold text-lg mb-6">Giriş Yap</h2>

                    {hata && (
                        <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-sm rounded-lg p-3 mb-4">
                            {hata}
                        </div>
                    )}

                    {/* ADIM 1 — Email */}
                    {adim === 1 && (
                        <div className="space-y-4">
                            <div>
                                <label className="text-zinc-400 text-sm mb-1.5 block">Email</label>
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && emailDevam()}
                                    placeholder="admin@gastrobrain.com"
                                    className={inputCls}
                                    autoFocus
                                />
                            </div>
                            <button
                                type="button"
                                onClick={emailDevam}
                                disabled={yukleniyor}
                                className="w-full bg-lime-400 hover:bg-lime-300 disabled:opacity-50 text-black font-bold rounded-lg py-2.5 text-sm transition-colors"
                            >
                                {yukleniyor ? 'Kontrol ediliyor...' : 'Devam Et →'}
                            </button>
                        </div>
                    )}

                    {/* ADIM 2 — Tenant seç + şifre */}
                    {adim === 2 && (
                        <div className="space-y-4">
                            {/* Email özeti + geri */}
                            <div className="flex items-center justify-between bg-zinc-800 rounded-lg px-3 py-2">
                                <span className="text-zinc-300 text-sm">{email}</span>
                                <button
                                    onClick={() => { setAdim(1); setHata(''); setSeciliTenant(null); setSifre(''); }}
                                    className="text-zinc-500 hover:text-lime-400 text-xs transition-colors"
                                >
                                    Değiştir
                                </button>
                            </div>

                            {/* Tenant seçimi — birden fazlaysa göster */}
                            {tenantlar.length > 1 && (
                                <div>
                                    <label className="text-zinc-400 text-sm mb-1.5 block">Firma Seç</label>
                                    <div className="space-y-2">
                                        {tenantlar.map(t => (
                                            <button
                                                key={t.tenantId}
                                                type="button"
                                                onClick={() => setSeciliTenant(t)}
                                                className={`w-full text-left px-3 py-2.5 rounded-lg border text-sm transition-colors ${seciliTenant?.tenantId === t.tenantId
                                                    ? 'border-lime-400 bg-lime-400/10 text-white'
                                                    : 'border-zinc-700 bg-zinc-800 text-zinc-300 hover:border-zinc-500'
                                                    } ${!t.tenantAktif ? 'opacity-40 cursor-not-allowed' : ''}`}
                                                disabled={!t.tenantAktif}
                                            >
                                                <span className="font-medium">{t.tenantAd}</span>
                                                <span className="text-zinc-500 font-mono text-xs ml-2">{t.tenantSlug}</span>
                                                {!t.tenantAktif && <span className="text-red-400 text-xs ml-2">(Pasif)</span>}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Tek tenant varsa küçük bilgi göster */}
                            {tenantlar.length === 1 && (
                                <div className="bg-zinc-800 rounded-lg px-3 py-2">
                                    <span className="text-zinc-400 text-xs">Firma: </span>
                                    <span className="text-white text-sm font-medium">{tenantlar[0].tenantAd}</span>
                                </div>
                            )}

                            {/* Şifre */}
                            <div>
                                <label className="text-zinc-400 text-sm mb-1.5 block">Şifre</label>
                                <input
                                    type="password"
                                    value={sifre}
                                    onChange={(e) => setSifre(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && girisYapHandle()}
                                    placeholder="••••••••"
                                    className={inputCls}
                                    autoFocus
                                />
                            </div>

                            <button
                                type="button"
                                onClick={girisYapHandle}
                                disabled={yukleniyor || !seciliTenant}
                                className="w-full bg-lime-400 hover:bg-lime-300 disabled:opacity-50 text-black font-bold rounded-lg py-2.5 text-sm transition-colors"
                            >
                                {yukleniyor ? 'Giriş yapılıyor...' : 'Giriş Yap'}
                            </button>
                        </div>
                    )}
                </div>

                <p className="text-center text-zinc-600 text-sm mt-4">
                    Hesabınız yok mu?{' '}
                    <Link to="/kayit" className="text-lime-400 hover:text-lime-300">Firma kaydı oluşturun</Link>
                </p>

            </div>
        </div>
    );
}