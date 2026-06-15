import { useState } from 'react';
import api from '../services/api';
import toast from 'react-hot-toast';

export default function FeedbackModal() {
    const [acik, setAcik] = useState(false);
    const [tip, setTip] = useState('oneri');
    const [mesaj, setMesaj] = useState('');
    const [yukleniyor, setYukleniyor] = useState(false);

    const gonder = async () => {
        if (!mesaj.trim()) { toast.error('Mesaj boş olamaz'); return; }
        setYukleniyor(true);
        try {
            const res = await api.post('/api/feedback', { tip, mesaj });
            toast.success(res.data.mesaj);
            setMesaj('');
            setAcik(false);
        } catch (err) {
            toast.error(err.response?.data?.mesaj || 'Gönderilemedi');
        } finally {
            setYukleniyor(false);
        }
    };

    return (
        <>
            <button
                onClick={() => setAcik(true)}
                className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-zinc-400 hover:text-lime-400 hover:bg-zinc-800 transition-colors mb-1"
            >
                <span>💬</span>
                <span>Geri Bildirim</span>
            </button>

            {acik && (
                <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
                    <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 w-full max-w-md">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-white font-bold">Geri Bildirim Gönder</h2>
                            <button onClick={() => setAcik(false)} className="text-zinc-500 hover:text-white text-xl">×</button>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="text-zinc-400 text-sm mb-2 block">Tür</label>
                                <div className="flex gap-2">
                                    {[
                                        { value: 'oneri', label: '💡 Öneri' },
                                        { value: 'hata', label: '🐛 Hata' },
                                        { value: 'diger', label: '💬 Diğer' },
                                    ].map(t => (
                                        <button
                                            key={t.value}
                                            onClick={() => setTip(t.value)}
                                            className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${tip === t.value
                                                    ? 'bg-lime-400/10 border border-lime-400 text-lime-400'
                                                    : 'bg-zinc-800 border border-zinc-700 text-zinc-400 hover:text-white'
                                                }`}
                                        >
                                            {t.label}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div>
                                <label className="text-zinc-400 text-sm mb-2 block">Mesajınız</label>
                                <textarea
                                    value={mesaj}
                                    onChange={(e) => setMesaj(e.target.value)}
                                    placeholder="Öneri, şikayet veya hata bildirimi yazın..."
                                    rows={5}
                                    className="w-full bg-zinc-800 border border-zinc-700 text-white rounded-lg px-4 py-3 text-sm outline-none focus:border-lime-400 transition-colors resize-none"
                                />
                            </div>

                            <button
                                onClick={gonder}
                                disabled={yukleniyor}
                                className="w-full bg-lime-400 hover:bg-lime-300 disabled:opacity-50 text-black font-bold rounded-lg py-2.5 text-sm transition-colors"
                            >
                                {yukleniyor ? 'Gönderiliyor...' : 'Gönder'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}