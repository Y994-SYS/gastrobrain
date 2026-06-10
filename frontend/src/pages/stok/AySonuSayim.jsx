import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import api from '../../services/api';

export default function AySonuSayim() {
    const [stoklar, setStoklar] = useState([]);
    const [sayimlar, setSayimlar] = useState({});
    const [yukleniyor, setYukleniyor] = useState(false);

    useEffect(() => {
        api.get('/api/stok/durum?subeId=1').then(res => setStoklar(res.data.data));
    }, []);

    const kaydet = async () => {
        const girilmis = Object.entries(sayimlar).filter(([_, v]) => v !== '');
        if (girilmis.length === 0) return toast.error('En az bir stok sayımı girin');

        setYukleniyor(true);
        try {
            await Promise.all(
                girilmis.map(([stokKartId, sayimMiktari]) =>
                    api.post('/api/stok/ay-sonu-sayim', {
                        stokKartId: Number(stokKartId),
                        subeId: 1,
                        sayimMiktari: Number(sayimMiktari),
                        aciklama: 'Ay sonu sayım'
                    })
                )
            );
            toast.success(`${girilmis.length} kalem sayım kaydedildi`);
            setSayimlar({});
            api.get('/api/stok/durum?subeId=1').then(res => setStoklar(res.data.data));
        } catch (err) {
            toast.error(err.response?.data?.mesaj || 'Hata oluştu');
        } finally {
            setYukleniyor(false);
        }
    };

    const girilmisAdet = Object.values(sayimlar).filter(v => v !== '').length;

    return (
        <div>
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-xl font-bold text-white">Ay Sonu Sayım</h1>
                    <p className="text-zinc-500 text-sm mt-0.5">Sayım sonuçlarını gir, sistem farkı hesaplayıp stoğu günceller</p>
                </div>
                <button
                    onClick={kaydet}
                    disabled={yukleniyor || girilmisAdet === 0}
                    className="bg-lime-400 hover:bg-lime-300 disabled:opacity-50 text-black font-bold text-sm px-4 py-2 rounded-lg transition-colors"
                >
                    {yukleniyor ? 'Kaydediliyor...' : `${girilmisAdet} Kalemi Kaydet`}
                </button>
            </div>

            <div className="bg-blue-500/5 border border-blue-500/20 rounded-xl p-4 mb-6">
                <p className="text-blue-400 text-sm">📋 Saydığın miktarı gir. Boş bıraktığın kalemler işlenmez. Kaydet butonuna basınca sistem mevcut stok ile farkı hesaplayıp düzeltir.</p>
            </div>

            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden">
                <table className="w-full">
                    <thead>
                        <tr className="border-b border-zinc-800">
                            <th className="text-left text-xs text-zinc-500 font-semibold uppercase tracking-wider py-3 px-4">Stok</th>
                            <th className="text-right text-xs text-zinc-500 font-semibold uppercase tracking-wider py-3 px-4">Sistemdeki</th>
                            <th className="text-right text-xs text-zinc-500 font-semibold uppercase tracking-wider py-3 px-4">Sayılan</th>
                            <th className="text-right text-xs text-zinc-500 font-semibold uppercase tracking-wider py-3 px-4">Fark</th>
                        </tr>
                    </thead>
                    <tbody>
                        {stoklar.map((s) => {
                            const sayilan = sayimlar[s.id];
                            const fark = sayilan !== undefined && sayilan !== ''
                                ? (Number(sayilan) - s.mevcutStok).toFixed(2)
                                : null;
                            return (
                                <tr key={s.id} className="border-b border-zinc-800/50 hover:bg-zinc-800/20 transition-colors">
                                    <td className="py-3 px-4">
                                        <div className="text-sm text-white">{s.ad}</div>
                                        <div className="text-xs text-zinc-500">{s.kod}</div>
                                    </td>
                                    <td className="py-3 px-4 text-right text-sm font-mono text-zinc-300">
                                        {s.mevcutStok.toFixed(2)} <span className="text-zinc-500">{s.birim?.kisaltma}</span>
                                    </td>
                                    <td className="py-3 px-4 text-right">
                                        <input
                                            type="number"
                                            value={sayimlar[s.id] || ''}
                                            onChange={(e) => setSayimlar({ ...sayimlar, [s.id]: e.target.value })}
                                            placeholder="-"
                                            className="w-24 bg-zinc-800 border border-zinc-700 text-white rounded-lg px-3 py-1.5 text-sm text-right outline-none focus:border-lime-400 transition-colors"
                                        />
                                    </td>
                                    <td className="py-3 px-4 text-right text-sm font-mono">
                                        {fark !== null ? (
                                            <span className={Number(fark) >= 0 ? 'text-lime-400' : 'text-red-400'}>
                                                {Number(fark) >= 0 ? '+' : ''}{fark}
                                            </span>
                                        ) : (
                                            <span className="text-zinc-600">—</span>
                                        )}
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    );
}