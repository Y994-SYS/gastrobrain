import { useState, useEffect } from 'react';
import api from '../../services/api';
import SubeSecici from '../../components/SubeSecici';
import useSubeStore from '../../store/subeStore';

const fmt = (n) => Number(n || 0).toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export default function StokDurumu() {
    const [veri, setVeri] = useState([]);
    const [aramaText, setAramaText] = useState('');
    const { seciliSubeId } = useSubeStore();
    const subeParam = seciliSubeId ? `?subeId=${seciliSubeId}` : '';

    const getir = async () => {
        try {
            const res = await api.get(`/api/stok/durum${subeParam}`);
            setVeri(res.data?.data || []);
        } catch (err) {
            console.error('Stok verisi alınamadı:', err);
        }
    };

    useEffect(() => { getir(); }, [seciliSubeId]);

    const filtrelenmis = veri.filter((s) =>
        s.ad?.toLowerCase().includes(aramaText.toLowerCase()) ||
        s.kod?.toLowerCase().includes(aramaText.toLowerCase())
    );

    return (
        <div>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-3">
                <div>
                    <h1 className="text-xl font-bold text-white">Stok Durumu</h1>
                    <p className="text-zinc-500 text-sm mt-0.5">
                        {veri.length} stok kalemi
                        {!seciliSubeId && <span className="text-zinc-600"> · Kendi şubeniz</span>}
                    </p>
                </div>
                <button onClick={getir} className="text-zinc-400 hover:text-white text-sm border border-zinc-700 px-4 py-2 rounded-lg transition-colors">
                    🔄 Yenile
                </button>
            </div>

            <SubeSecici />

            <div className="mb-4">
                <input
                    value={aramaText}
                    onChange={(e) => setAramaText(e.target.value)}
                    placeholder="Stok adı veya kodu ile ara..."
                    className="w-full bg-zinc-900 border border-zinc-800 text-white rounded-lg px-4 py-2.5 text-sm outline-none focus:border-lime-400 transition-colors"
                />
            </div>

            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="border-b border-zinc-800">
                                <th className="text-left text-xs text-zinc-500 font-semibold uppercase tracking-wider py-3 px-4 hidden sm:table-cell">Kod</th>
                                <th className="text-left text-xs text-zinc-500 font-semibold uppercase tracking-wider py-3 px-4">Stok Adı</th>
                                <th className="text-left text-xs text-zinc-500 font-semibold uppercase tracking-wider py-3 px-4 hidden sm:table-cell">Kategori</th>
                                <th className="text-right text-xs text-zinc-500 font-semibold uppercase tracking-wider py-3 px-4">Mevcut</th>
                                <th className="text-right text-xs text-zinc-500 font-semibold uppercase tracking-wider py-3 px-4 hidden sm:table-cell">Min.</th>
                                <th className="text-center text-xs text-zinc-500 font-semibold uppercase tracking-wider py-3 px-4">Durum</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filtrelenmis.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="text-center py-16 text-zinc-500 text-sm">Henüz stok kaydı yok</td>
                                </tr>
                            ) : filtrelenmis.map((s) => (
                                <tr key={s.id} className="border-b border-zinc-800/50 hover:bg-zinc-800/30 transition-colors">
                                    <td className="py-3 px-4 hidden sm:table-cell">
                                        <span className="bg-zinc-800 text-zinc-300 px-2 py-0.5 rounded text-xs font-mono">{s.kod}</span>
                                    </td>
                                    <td className="py-3 px-4 text-sm text-white">{s.ad}</td>
                                    <td className="py-3 px-4 hidden sm:table-cell">
                                        <div className="flex items-center gap-2">
                                            <div className="w-2 h-2 rounded-full" style={{ background: s.kategori?.renk }}></div>
                                            <span className="text-sm text-zinc-300">{s.kategori?.ad}</span>
                                        </div>
                                    </td>
                                    <td className="py-3 px-4 text-right text-sm font-mono font-semibold text-white">
                                        {fmt(s.mevcutStok)} <span className="text-zinc-500 font-normal">{s.birim?.kisaltma}</span>
                                    </td>
                                    <td className="py-3 px-4 text-right text-sm font-mono text-zinc-400 hidden sm:table-cell">
                                        {fmt(s.minStok)} <span className="text-zinc-600">{s.birim?.kisaltma}</span>
                                    </td>
                                    <td className="py-3 px-4 text-center">
                                        {s.kritik ? (
                                            <span className="text-xs px-2 py-0.5 rounded-full bg-red-400/10 text-red-400">⚠️ Kritik</span>
                                        ) : (
                                            <span className="text-xs px-2 py-0.5 rounded-full bg-lime-400/10 text-lime-400">✓ Normal</span>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}