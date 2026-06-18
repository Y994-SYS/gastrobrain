import { useNavigate } from 'react-router-dom';
import useAuthStore from '../store/auth.store';

const ROL_ETIKET = {
    SUPER_ADMIN: 'Süper Admin',
    TENANT_ADMIN: 'Admin',
    MUDUR: 'Müdür',
    DEPO: 'Depo',
    KASA: 'Kasa',
    PERSONEL: 'Personel',
};

export default function Yetkisiz() {
    const navigate = useNavigate();
    const { kullanici } = useAuthStore();

    return (
        <div className="min-h-screen bg-zinc-950 flex items-center justify-center p-4">
            <div className="max-w-md w-full text-center space-y-6">

                <div className="flex justify-center">
                    <div className="w-20 h-20 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center">
                        <span className="text-4xl">🔒</span>
                    </div>
                </div>

                <div>
                    <h1 className="text-2xl font-bold text-white">Erişim Yetkisi Yok</h1>
                    <p className="mt-2 text-zinc-400 text-sm">
                        Bu sayfayı görüntülemek için gerekli yetkiniz bulunmuyor.
                    </p>
                </div>

                {kullanici && (
                    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 text-sm">
                        <p className="text-zinc-500">Mevcut rolünüz</p>
                        <p className="text-lime-400 font-semibold mt-1">
                            {ROL_ETIKET[kullanici.rol] ?? kullanici.rol}
                        </p>
                    </div>
                )}

                <div className="flex gap-3">
                    <button
                        onClick={() => navigate(-1)}
                        className="flex-1 px-4 py-2.5 rounded-lg border border-zinc-700 text-zinc-300 text-sm hover:border-zinc-500 hover:text-white transition-colors"
                    >
                        Geri Dön
                    </button>
                    <button
                        onClick={() => navigate('/')}
                        className="flex-1 px-4 py-2.5 rounded-lg bg-lime-400 text-zinc-900 text-sm font-semibold hover:bg-lime-300 transition-colors"
                    >
                        Ana Sayfa
                    </button>
                </div>

                <p className="text-zinc-600 text-xs">
                    Bu sayfaya erişim ihtiyacınız varsa sistem yöneticinizle iletişime geçin.
                </p>
            </div>
        </div>
    );
}