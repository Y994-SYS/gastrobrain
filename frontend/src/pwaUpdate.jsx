// src/pwaUpdate.jsx
//
// Yeni bir versiyon deploy edildiğinde kullanıcıya toast ile haber verir,
// "Yenile" butonuna basınca yeni service worker'ı devreye alıp sayfayı
// otomatik yeniler. main.jsx'te uygulama render edilmeden önce bir kez
// çağrılması yeterli — bkz. kullanım örneği en altta.

import { registerSW } from 'virtual:pwa-register';
import toast from 'react-hot-toast';

export function pwaGuncellemeyiBaslat() {
    const updateSW = registerSW({
        onNeedRefresh() {
            toast(
                (t) => (
                    <div className="flex items-center gap-3">
                        <span className="text-sm">🔄 Yeni bir sürüm var</span>
                        <button
                            onClick={() => {
                                toast.dismiss(t.id);
                                updateSW(true); // yeni SW'yi devreye al + sayfayı yenile
                            }}
                            className="bg-lime-400 text-zinc-900 text-xs font-bold px-3 py-1.5 rounded-lg hover:bg-lime-300 transition-colors"
                        >
                            Yenile
                        </button>
                    </div>
                ),
                { duration: Infinity, id: 'pwa-update' }
            );
        },
        onOfflineReady() {
            // İstersen burada da "Uygulama artık çevrimdışı kullanıma hazır"
            // gibi bilgilendirici bir toast gösterebilirsin. Şimdilik sessiz.
        },
        onRegisteredSW(_swUrl, registration) {
            // Her 60 dakikada bir yeni sürüm var mı diye arka planda kontrol et.
            // Kullanıcı uygulamayı uzun süre açık tutarsa yine de güncelleme
            // bildirimi alsın diye.
            if (registration) {
                setInterval(() => {
                    registration.update();
                }, 60 * 60 * 1000);
            }
        },
    });
}

// ── main.jsx içinde kullanım ────────────────────────────────────────────
// import { pwaGuncellemeyiBaslat } from './pwaUpdate';
// pwaGuncellemeyiBaslat();
// ReactDOM.createRoot(document.getElementById('root')).render(<App />);