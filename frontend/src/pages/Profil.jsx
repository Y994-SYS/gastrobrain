import { useState } from 'react';
import api from '../services/api';
import useAuthStore from '../store/auth.store';
import toast from 'react-hot-toast';

const inputCls = "w-full bg-zinc-800 border border-zinc-700 text-white rounded-lg px-3 py-2.5 text-sm outline-none focus:border-lime-400 transition-colors";

const ROL_ETIKET = {
    TENANT_ADMIN: '👑 Admin',
    MUDUR: '🏢 Müdür',
    DEPO: '📦 Depo',
    KASA: '💰 Kasa',
    PERSONEL: '👤 Personel',
    SUPER_ADMIN: '⚡ Süper Admin',
};

// Şifre gücü hesabı
function sifreGucu(sifre) {
    if (!sifre) return null;
    let puan = 0;
    if (sifre.length >= 8) puan++;
    if (/[A-Z]/.test(sifre)) puan++;
    if (/[0-9]/.test(sifre)) puan++;
    if (/[^A-Za-z0-9]/.test(sifre)) puan++;
    if (puan <= 1) return { label: 'Zayıf', renk: 'bg-red-400', genislik: 'w-1/4' };
    if (puan === 2) return { label: 'Orta', renk: 'bg-yellow-400', genislik: 'w-2/4' };
    if (puan === 3) return { label: 'İyi', renk: 'bg-blue-400', genislik: 'w-3/4' };
    return { label: 'Güçlü', renk: 'bg-lime-400', genislik: 'w-full' };
}

export default function Profil() {
    const kullanici = useAuthStore(s => s.kullanici);
    const setKullanici = useAuthStore(s => s.setKullanici) || (() => { });

    const [ad, setAd] = useState(kullanici?.ad || '');
    const [adDegisti, setAdDegisti] = useState(false);

    const [mevcutSifre, setMevcutSifre] = useState('');
    const [yeniSifre, setYeniSifre] = useState('');
    const [sifreTekrar, setSifreTekrar] = useState('');
    const [sifreGoster, setSifreGoster] = useState({ mevcut: false, yeni: false, tekrar: false });
    const [yukleniyor, setYukleniyor] = useState(false);

    const guc = sifreGucu(yeniSifre);
    const eslesiyor = yeniSifre && sifreTekrar && yeniSifre === sifreTekrar;
    const eslesmıyor = yeniSifre && sifreTekrar && yeniSifre !== sifreTekrar;

    const adGuncelle = async () => {
        if (!ad.trim()) return toast.error('Ad boş olamaz');
        if (ad.trim() === kullanici?.ad) return;
        setYukleniyor(true);
        try {
            const res = await api.put('/api/kullanicilar/profil', { ad });
            setKullanici({ ...kullanici, ad: res.data.data.ad });
            setAdDegisti(false);
            toast.success('Ad güncellendi');
        } catch (e) {
            toast.error(e.response?.data?.mesaj || 'Güncelleme başarısız');
        } finally {
            setYukleniyor(false);
        }
    };

    const sifreGuncelle = async () => {
        if (!mevcutSifre || !yeniSifre) return toast.error('Tüm alanları doldurun');
        if (yeniSifre !== sifreTekrar) return toast.error('Şifreler eşleşmiyor');
        if (yeniSifre.length < 6) return toast.error('Şifre en az 6 karakter olmalı');
        setYukleniyor(true);
        try {
            await api.put('/api/kullanicilar/sifre-degistir', { mevcutSifre, yeniSifre });
            toast.success('Şifre güncellendi');
            setMevcutSifre('');
            setYeniSifre('');
            setSifreTekrar('');
        } catch (e) {
            toast.error(e.response?.data?.mesaj || 'Şifre güncellenemedi');
        } finally {
            setYukleniyor(false);
        }
    };

    const toggleSifre = (alan) =>
        setSifreGoster(p => ({ ...p, [alan]: !p[alan] }));

    const SifreInput = ({ label, value, onChange, alan }) => (
        <div>
            <label className="text-zinc-400 text-sm mb-1.5 block">{label}</label>
            <div className="relative">
                <input
                    type={sifreGoster[alan] ? 'text' : 'password'}
                    value={value}
                    onChange={onChange}
                    className={`${inputCls} pr-10`}
                    placeholder="••••••••"
                />
                <button
                    type="button"
                    onClick={() => toggleSifre(alan)}
                    tabIndex={-1}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 transition-colors text-sm"
                >
                    {sifreGoster[alan] ? '🙈' : '👁️'}
                </button>
            </div>
        </div>
    );

    return (
        <div className="max-w-lg mx-auto space-y-4">
            <h1 className="text-xl font-bold text-white mb-6">Profil</h1>

            {/* Kullanıcı Bilgi Kartı */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
                {/* Avatar + bilgi */}
                <div className="flex items-center gap-4 mb-6 pb-6 border-b border-zinc-800">
                    <div className="w-14 h-14 rounded-full bg-lime-400/10 border border-lime-400/20 flex items-center justify-center text-2xl font-bold text-lime-400 shrink-0">
                        {kullanici?.ad?.charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                        <p className="font-semibold text-white truncate">{kullanici?.ad}</p>
                        <p className="text-sm text-zinc-400 truncate">{kullanici?.email}</p>
                        <span className="text-xs bg-zinc-800 text-zinc-400 px-2 py-0.5 rounded-full mt-1 inline-block">
                            {ROL_ETIKET[kullanici?.rol] ?? kullanici?.rol}
                        </span>
                    </div>
                </div>

                {/* Ad güncelle */}
                <div>
                    <label className="text-zinc-400 text-sm mb-1.5 block">Ad Soyad</label>
                    <div className="flex gap-2">
                        <input
                            type="text"
                            value={ad}
                            onChange={e => { setAd(e.target.value); setAdDegisti(e.target.value !== kullanici?.ad); }}
                            className={`flex-1 ${inputCls}`}
                            style={{ width: 'auto' }}
                        />
                        <button
                            onClick={adGuncelle}
                            disabled={yukleniyor || !adDegisti}
                            className="bg-lime-400 hover:bg-lime-300 disabled:opacity-40 disabled:cursor-not-allowed text-black font-semibold px-4 rounded-lg text-sm transition-colors shrink-0"
                        >
                            Kaydet
                        </button>
                    </div>
                    {adDegisti && (
                        <p className="text-xs text-zinc-500 mt-1.5">Kaydetmeden sayfadan ayrılırsanız değişiklik kaybolur.</p>
                    )}
                </div>
            </div>

            {/* Şifre Değiştir */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
                <h2 className="font-bold text-white mb-5">Şifre Değiştir</h2>
                <div className="space-y-4">
                    <SifreInput
                        label="Mevcut Şifre"
                        value={mevcutSifre}
                        onChange={e => setMevcutSifre(e.target.value)}
                        alan="mevcut"
                    />
                    <SifreInput
                        label="Yeni Şifre"
                        value={yeniSifre}
                        onChange={e => setYeniSifre(e.target.value)}
                        alan="yeni"
                    />

                    {/* Şifre gücü göstergesi */}
                    {yeniSifre && guc && (
                        <div>
                            <div className="flex justify-between text-xs mb-1">
                                <span className="text-zinc-500">Şifre gücü</span>
                                <span className={`font-medium ${guc.label === 'Güçlü' ? 'text-lime-400' :
                                        guc.label === 'İyi' ? 'text-blue-400' :
                                            guc.label === 'Orta' ? 'text-yellow-400' : 'text-red-400'
                                    }`}>{guc.label}</span>
                            </div>
                            <div className="h-1 bg-zinc-800 rounded-full overflow-hidden">
                                <div className={`h-full rounded-full transition-all duration-300 ${guc.renk} ${guc.genislik}`} />
                            </div>
                        </div>
                    )}

                    <div>
                        <label className="text-zinc-400 text-sm mb-1.5 block">Yeni Şifre Tekrar</label>
                        <div className="relative">
                            <input
                                type={sifreGoster.tekrar ? 'text' : 'password'}
                                value={sifreTekrar}
                                onChange={e => setSifreTekrar(e.target.value)}
                                placeholder="••••••••"
                                className={`${inputCls} pr-10 ${eslesiyor ? 'border-lime-400/50' :
                                        eslesmıyor ? 'border-red-400/50' : ''
                                    }`}
                            />
                            <button
                                type="button"
                                onClick={() => toggleSifre('tekrar')}
                                tabIndex={-1}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 transition-colors text-sm"
                            >
                                {sifreGoster.tekrar ? '🙈' : '👁️'}
                            </button>
                        </div>
                        {eslesiyor && <p className="text-xs text-lime-400 mt-1">✓ Şifreler eşleşiyor</p>}
                        {eslesmıyor && <p className="text-xs text-red-400 mt-1">✗ Şifreler eşleşmiyor</p>}
                    </div>

                    <button
                        onClick={sifreGuncelle}
                        disabled={yukleniyor || !mevcutSifre || !yeniSifre || !sifreTekrar}
                        className="w-full bg-zinc-700 hover:bg-zinc-600 disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold py-2.5 rounded-lg text-sm transition-colors"
                    >
                        {yukleniyor ? 'Güncelleniyor...' : 'Şifreyi Güncelle'}
                    </button>
                </div>
            </div>
        </div>
    );
}