import { useState } from 'react';
import api from '../services/api';
import useAuthStore from '../store/auth.store';
import toast from 'react-hot-toast';

export default function Profil() {
    const kullanici = useAuthStore(s => s.kullanici);
    const setKullanici = useAuthStore(s => s.setKullanici);

    const [ad, setAd] = useState(kullanici?.ad || '');
    const [mevcutSifre, setMevcutSifre] = useState('');
    const [yeniSifre, setYeniSifre] = useState('');
    const [sifreTekrar, setSifreTekrar] = useState('');
    const [yukleniyor, setYukleniyor] = useState(false);

    const adGuncelle = async () => {
        if (!ad.trim()) return toast.error('Ad boş olamaz');
        setYukleniyor(true);
        try {
            const res = await api.put('/api/kullanicilar/profil', { ad });
            setKullanici({ ...kullanici, ad: res.data.data.ad });
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

    return (
        <div className="max-w-lg mx-auto p-6">
            <h1 className="text-2xl font-semibold text-zinc-100 mb-8">Profil</h1>

            {/* Bilgi kartı */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 mb-4">
                <div className="flex items-center gap-4 mb-6">
                    <div className="w-14 h-14 rounded-full bg-lime-400/10 border border-lime-400/20 flex items-center justify-center text-2xl">
                        {kullanici?.ad?.charAt(0).toUpperCase()}
                    </div>
                    <div>
                        <p className="font-semibold text-zinc-100">{kullanici?.ad}</p>
                        <p className="text-sm text-zinc-400">{kullanici?.email}</p>
                        <span className="text-xs bg-zinc-800 text-zinc-400 px-2 py-0.5 rounded mt-1 inline-block">
                            {kullanici?.rol}
                        </span>
                    </div>
                </div>

                <div>
                    <label className="text-zinc-400 text-sm mb-1 block">Ad Soyad</label>
                    <div className="flex gap-2">
                        <input
                            type="text"
                            value={ad}
                            onChange={e => setAd(e.target.value)}
                            className="flex-1 bg-zinc-800 border border-zinc-700 text-white rounded-lg px-3 py-2 text-sm outline-none focus:border-lime-400 transition-colors"
                        />
                        <button
                            onClick={adGuncelle}
                            disabled={yukleniyor}
                            className="bg-lime-400 hover:bg-lime-300 disabled:opacity-50 text-black font-semibold px-4 rounded-lg text-sm transition-colors"
                        >
                            Kaydet
                        </button>
                    </div>
                </div>
            </div>

            {/* Şifre değiştir */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
                <h2 className="font-semibold text-zinc-100 mb-4">Şifre Değiştir</h2>
                <div className="space-y-3">
                    <div>
                        <label className="text-zinc-400 text-sm mb-1 block">Mevcut Şifre</label>
                        <input
                            type="password"
                            value={mevcutSifre}
                            onChange={e => setMevcutSifre(e.target.value)}
                            className="w-full bg-zinc-800 border border-zinc-700 text-white rounded-lg px-3 py-2 text-sm outline-none focus:border-lime-400 transition-colors"
                        />
                    </div>
                    <div>
                        <label className="text-zinc-400 text-sm mb-1 block">Yeni Şifre</label>
                        <input
                            type="password"
                            value={yeniSifre}
                            onChange={e => setYeniSifre(e.target.value)}
                            className="w-full bg-zinc-800 border border-zinc-700 text-white rounded-lg px-3 py-2 text-sm outline-none focus:border-lime-400 transition-colors"
                        />
                    </div>
                    <div>
                        <label className="text-zinc-400 text-sm mb-1 block">Yeni Şifre Tekrar</label>
                        <input
                            type="password"
                            value={sifreTekrar}
                            onChange={e => setSifreTekrar(e.target.value)}
                            className="w-full bg-zinc-800 border border-zinc-700 text-white rounded-lg px-3 py-2 text-sm outline-none focus:border-lime-400 transition-colors"
                        />
                    </div>
                    <button
                        onClick={sifreGuncelle}
                        disabled={yukleniyor}
                        className="w-full bg-zinc-700 hover:bg-zinc-600 disabled:opacity-50 text-white font-semibold py-2 rounded-lg text-sm transition-colors"
                    >
                        {yukleniyor ? 'Güncelleniyor...' : 'Şifreyi Güncelle'}
                    </button>
                </div>
            </div>
        </div>
    );
}