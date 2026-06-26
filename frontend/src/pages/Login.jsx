import { useState, useRef, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import useAuthStore from '../store/auth.store';
import api from '../services/api';

const inputCls = "w-full bg-zinc-800 border border-zinc-700 text-white rounded-lg px-4 py-2.5 text-sm outline-none focus:border-lime-400 transition-colors placeholder:text-zinc-600";

export default function Login() {
    const [adim, setAdim] = useState(1);
    const [email, setEmail] = useState('');
    const [sifre, setSifre] = useState('');
    const [sifreGoster, setSifreGoster] = useState(false);
    const [tenantlar, setTenantlar] = useState([]);
    const [seciliTenant, setSeciliTenant] = useState(null);
    const [hata, setHata] = useState('');
    const [yukleniyor, setYukleniyor] = useState(false);

    const girisYap = useAuthStore((s) => s.girisYap);
    const navigate = useNavigate();
    const sifreRef = useRef(null);

    // Adım 2'ye geçince şifre input'a odaklan
    useEffect(() => {
        if (adim === 2) {
            setTimeout(() => sifreRef.current?.focus(), 100);
        }
    }, [adim]);

    const emailDevam = async () => {
        if (!email.trim()) { setHata('Email adresi gerekli'); return; }
        setHata('');
        setYukleniyor(true);
        try {
            const res = await api.post('/api/auth/tenant-listesi', { email });
            const liste = res.data.data;
            setTenantlar(liste);
            if (liste.length === 1) setSeciliTenant(liste[0]);
            setAdim(2);
        } catch (err) {
            setHata(err.response?.data?.mesaj || 'Bu email adresi bulunamadı');
        } finally {
            setYukleniyor(false);
        }
    };

    const girisYapHandle = async () => {
        if (!seciliTenant) { setHata('Lütfen firma seçin'); return; }
        if (!sifre) { setHata('Şifre gerekli'); return; }
        setHata('');
        setYukleniyor(true);
        try {
            await girisYap(email, sifre, seciliTenant.tenantSlug);
            const kullanici = useAuthStore.getState().kullanici;
            navigate(kullanici?.rol === 'SUPER_ADMIN' ? '/super-admin' : '/');
        } catch (err) {
            setHata(err.response?.data?.mesaj || 'Email veya şifre hatalı');
        } finally {
            setYukleniyor(false);
        }
    };

    const geriDon = () => {
        setAdim(1);
        setHata('');
        setSeciliTenant(null);
        setSifre('');
        setSifreGoster(false);
    };

    return (
        <div className="min-h-screen bg-zinc-950 flex items-center justify-center p-4">
            <div className="w-full max-w-sm">

                {/* Logo */}
                <div className="text-center mb-8">
                    <div className="flex justify-center mb-3">
                        <img src="/logo.png" alt="GastroBRAIN" className="w-16 h-16 object-contain" />
                    </div>
                    <h1 className="text-3xl font-black text-white tracking-tight">
                        Gastro<span className="text-lime-400">BRAIN</span>
                    </h1>
                    <p className="text-zinc-500 text-sm mt-1">Restoran yönetim sistemi</p>
                </div>

                {/* Kart */}
                <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">

                    {/* Başlık + adım göstergesi */}
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-white font-bold text-lg">Giriş Yap</h2>
                        <div className="flex items-center gap-1.5">
                            <div className={`w-2 h-2 rounded-full transition-colors ${adim >= 1 ? 'bg-lime-400' : 'bg-zinc-700'}`} />
                            <div className={`w-6 h-0.5 transition-colors ${adim >= 2 ? 'bg-lime-400' : 'bg-zinc-700'}`} />
                            <div className={`w-2 h-2 rounded-full transition-colors ${adim >= 2 ? 'bg-lime-400' : 'bg-zinc-700'}`} />
                        </div>
                    </div>

                    {/* Hata */}
                    {hata && (
                        <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-sm rounded-lg px-3 py-2.5 mb-4 flex items-center gap-2">
                            <span>⚠️</span>
                            <span>{hata}</span>
                        </div>
                    )}

                    {/* ADIM 1 — Email */}
                    {adim === 1 && (
                        <div className="space-y-4">
                            <div>
                                <label className="text-zinc-400 text-sm mb-1.5 block">Email adresi</label>
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => { setEmail(e.target.value); setHata(''); }}
                                    onKeyDown={(e) => e.key === 'Enter' && emailDevam()}
                                    placeholder="ornek@firma.com"
                                    className={inputCls}
                                    autoFocus
                                    autoCapitalize="none"
                                    autoCorrect="off"
                                />
                            </div>
                            <button
                                type="button"
                                onClick={emailDevam}
                                disabled={yukleniyor || !email.trim()}
                                className="w-full bg-lime-400 hover:bg-lime-300 disabled:opacity-40 disabled:cursor-not-allowed text-black font-bold rounded-lg py-2.5 text-sm transition-colors"
                            >
                                {yukleniyor ? (
                                    <span className="flex items-center justify-center gap-2">
                                        <span className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                                        Kontrol ediliyor...
                                    </span>
                                ) : 'Devam Et →'}
                            </button>
                        </div>
                    )}

                    {/* ADIM 2 — Firma + Şifre */}
                    {adim === 2 && (
                        <div className="space-y-4">
                            {/* Email özeti */}
                            <div className="flex items-center justify-between bg-zinc-800 rounded-lg px-3 py-2">
                                <span className="text-zinc-300 text-sm truncate">{email}</span>
                                <button
                                    onClick={geriDon}
                                    className="text-zinc-500 hover:text-lime-400 text-xs transition-colors ml-3 shrink-0"
                                >
                                    Değiştir
                                </button>
                            </div>

                            {/* Birden fazla tenant */}
                            {tenantlar.length > 1 && (
                                <div>
                                    <label className="text-zinc-400 text-sm mb-1.5 block">Firma Seç</label>
                                    <div className="space-y-2">
                                        {tenantlar.map(t => (
                                            <button
                                                key={t.tenantId}
                                                type="button"
                                                onClick={() => !t.tenantAktif ? null : setSeciliTenant(t)}
                                                disabled={!t.tenantAktif}
                                                className={`w-full text-left px-3 py-2.5 rounded-lg border text-sm transition-colors ${seciliTenant?.tenantId === t.tenantId
                                                        ? 'border-lime-400 bg-lime-400/10 text-white'
                                                        : 'border-zinc-700 bg-zinc-800 text-zinc-300 hover:border-zinc-500'
                                                    } ${!t.tenantAktif ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'}`}
                                            >
                                                <span className="font-medium">{t.tenantAd}</span>
                                                <span className="text-zinc-500 font-mono text-xs ml-2">{t.tenantSlug}</span>
                                                {!t.tenantAktif && <span className="text-red-400 text-xs ml-2">(Pasif)</span>}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Tek tenant */}
                            {tenantlar.length === 1 && (
                                <div className="flex items-center gap-2 bg-zinc-800 rounded-lg px-3 py-2">
                                    <span className="text-lg">🏢</span>
                                    <div>
                                        <div className="text-white text-sm font-medium">{tenantlar[0].tenantAd}</div>
                                        <div className="text-zinc-500 text-xs font-mono">{tenantlar[0].tenantSlug}</div>
                                    </div>
                                </div>
                            )}

                            {/* Şifre */}
                            <div>
                                <label className="text-zinc-400 text-sm mb-1.5 block">Şifre</label>
                                <div className="relative">
                                    <input
                                        ref={sifreRef}
                                        type={sifreGoster ? 'text' : 'password'}
                                        value={sifre}
                                        onChange={(e) => { setSifre(e.target.value); setHata(''); }}
                                        onKeyDown={(e) => e.key === 'Enter' && girisYapHandle()}
                                        placeholder="••••••••"
                                        className={`${inputCls} pr-10`}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setSifreGoster(p => !p)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 text-sm transition-colors"
                                        tabIndex={-1}
                                    >
                                        {sifreGoster ? '🙈' : '👁️'}
                                    </button>
                                </div>
                                <div className="text-right mt-1.5">
                                    <Link to="/sifremi-unuttum" className="text-xs text-zinc-500 hover:text-lime-400 transition-colors">
                                        Şifremi unuttum
                                    </Link>
                                </div>
                            </div>

                            <button
                                type="button"
                                onClick={girisYapHandle}
                                disabled={yukleniyor || !seciliTenant || !sifre}
                                className="w-full bg-lime-400 hover:bg-lime-300 disabled:opacity-40 disabled:cursor-not-allowed text-black font-bold rounded-lg py-2.5 text-sm transition-colors"
                            >
                                {yukleniyor ? (
                                    <span className="flex items-center justify-center gap-2">
                                        <span className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                                        Giriş yapılıyor...
                                    </span>
                                ) : 'Giriş Yap'}
                            </button>
                        </div>
                    )}
                </div>

                <p className="text-center text-zinc-600 text-sm mt-4">
                    Hesabınız yok mu?{' '}
                    <Link to="/kayit" className="text-lime-400 hover:text-lime-300 transition-colors">
                        Firma kaydı oluşturun
                    </Link>
                </p>

            </div>
        </div>
    );
}