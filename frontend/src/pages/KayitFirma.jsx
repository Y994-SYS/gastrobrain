import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import useAuthStore from '../store/auth.store';
import api from '../services/api';

export default function KayitFirma() {
    const [form, setForm] = useState({
        firmaAd: '', firmaSlug: '', firmaEmail: '', firmaTelefon: '',
        adminAd: '', adminEmail: '', adminSifre: '',
    });
    const [hata, setHata] = useState('');
    const [yukleniyor, setYukleniyor] = useState(false);
    const navigate = useNavigate();
    const { girisYap } = useAuthStore();

    const slugOlustur = (ad) =>
        ad.toLowerCase()
            .replace(/ğ/g, 'g').replace(/ü/g, 'u').replace(/ş/g, 's')
            .replace(/ı/g, 'i').replace(/ö/g, 'o').replace(/ç/g, 'c')
            .replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');

    const handleFirmaAdChange = (e) => {
        const ad = e.target.value;
        setForm(f => ({ ...f, firmaAd: ad, firmaSlug: slugOlustur(ad) }));
    };

    const handleSubmit = async () => {
        setHata('');
        if (!form.firmaAd || !form.firmaEmail || !form.adminAd || !form.adminEmail || !form.adminSifre) {
            setHata('Tüm zorunlu alanları doldurun');
            return;
        }
        setYukleniyor(true);
        try {
            const res = await api.post('/api/auth/kayit-firma', form);
            const { token, kullanici } = res.data.data;
            localStorage.setItem('gastroiq_token', token);
            localStorage.setItem('gastroiq_tenant', kullanici.tenantId);
            // Store'u güncelle
            useAuthStore.setState({ kullanici });
            navigate('/');
        } catch (err) {
            setHata(err.response?.data?.mesaj || 'Kayıt başarısız');
        } finally {
            setYukleniyor(false);
        }
    };

    const input = "w-full bg-zinc-800 border border-zinc-700 text-white rounded-lg px-4 py-2.5 text-sm outline-none focus:border-lime-400 transition-colors";

    return (
        <div className="min-h-screen bg-zinc-950 flex items-center justify-center p-4">
            <div className="w-full max-w-md">

                <div className="text-center mb-8">
                    <h1 className="text-3xl font-black text-white tracking-tight">
                        Gastro<span className="text-lime-400">BRAIN</span>
                    </h1>
                    <p className="text-zinc-500 text-sm mt-2">Yeni firma kaydı</p>
                </div>

                <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 space-y-6">

                    {hata && (
                        <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-sm rounded-lg p-3">
                            {hata}
                        </div>
                    )}

                    {/* Firma Bilgileri */}
                    <div>
                        <h3 className="text-zinc-400 text-xs font-semibold uppercase tracking-wider mb-3">
                            Firma Bilgileri
                        </h3>
                        <div className="space-y-3">
                            <div>
                                <label className="text-zinc-400 text-sm mb-1.5 block">Firma Adı <span className="text-red-400">*</span></label>
                                <input
                                    type="text"
                                    value={form.firmaAd}
                                    onChange={handleFirmaAdChange}
                                    placeholder="Örn: Pizza Palace"
                                    className={input}
                                />
                            </div>
                            <div>
                                <label className="text-zinc-400 text-sm mb-1.5 block">
                                    Firma Kodu
                                    <span className="text-zinc-600 ml-1 text-xs">(giriş için kullanılır)</span>
                                </label>
                                <input
                                    type="text"
                                    value={form.firmaSlug}
                                    onChange={(e) => setForm(f => ({ ...f, firmaSlug: e.target.value }))}
                                    placeholder="pizza-palace"
                                    className={`${input} font-mono`}
                                />
                            </div>
                            <div>
                                <label className="text-zinc-400 text-sm mb-1.5 block">Firma Email <span className="text-red-400">*</span></label>
                                <input
                                    type="email"
                                    value={form.firmaEmail}
                                    onChange={(e) => setForm(f => ({ ...f, firmaEmail: e.target.value }))}
                                    placeholder="info@firmaniz.com"
                                    className={input}
                                />
                            </div>
                            <div>
                                <label className="text-zinc-400 text-sm mb-1.5 block">Telefon</label>
                                <input
                                    type="text"
                                    value={form.firmaTelefon}
                                    onChange={(e) => setForm(f => ({ ...f, firmaTelefon: e.target.value }))}
                                    placeholder="0212 000 00 00"
                                    className={input}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Admin Kullanıcı */}
                    <div>
                        <h3 className="text-zinc-400 text-xs font-semibold uppercase tracking-wider mb-3">
                            Yönetici Hesabı
                        </h3>
                        <div className="space-y-3">
                            <div>
                                <label className="text-zinc-400 text-sm mb-1.5 block">Ad Soyad <span className="text-red-400">*</span></label>
                                <input
                                    type="text"
                                    value={form.adminAd}
                                    onChange={(e) => setForm(f => ({ ...f, adminAd: e.target.value }))}
                                    placeholder="Ahmet Yılmaz"
                                    className={input}
                                />
                            </div>
                            <div>
                                <label className="text-zinc-400 text-sm mb-1.5 block">Email <span className="text-red-400">*</span></label>
                                <input
                                    type="email"
                                    value={form.adminEmail}
                                    onChange={(e) => setForm(f => ({ ...f, adminEmail: e.target.value }))}
                                    placeholder="ahmet@firmaniz.com"
                                    className={input}
                                />
                            </div>
                            <div>
                                <label className="text-zinc-400 text-sm mb-1.5 block">Şifre <span className="text-red-400">*</span></label>
                                <input
                                    type="password"
                                    value={form.adminSifre}
                                    onChange={(e) => setForm(f => ({ ...f, adminSifre: e.target.value }))}
                                    placeholder="••••••••"
                                    className={input}
                                />
                            </div>
                        </div>
                    </div>

                    <button
                        type="button"
                        onClick={handleSubmit}
                        disabled={yukleniyor}
                        className="w-full bg-lime-400 hover:bg-lime-300 disabled:opacity-50 text-black font-bold rounded-lg py-2.5 text-sm transition-colors"
                    >
                        {yukleniyor ? 'Kayıt yapılıyor...' : 'Firmayı Kaydet ve Başla'}
                    </button>

                    <p className="text-center text-zinc-600 text-sm">
                        Zaten hesabınız var mı?{' '}
                        <Link to="/giris" className="text-lime-400 hover:text-lime-300">Giriş yapın</Link>
                    </p>

                </div>
            </div>
        </div>
    );
}