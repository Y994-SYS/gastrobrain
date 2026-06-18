import { useState, useEffect } from 'react';
import api from '../services/api';

const EYLEM_RENK = {
    SATIS_EKLE: 'text-lime-400 bg-lime-400/10',
    SATIS_SIL: 'text-red-400 bg-red-400/10',
    STOK_GIRIS_FATURA: 'text-blue-400 bg-blue-400/10',
    STOK_IADE_FATURA: 'text-orange-400 bg-orange-400/10',
    STOK_ZAYI: 'text-red-400 bg-red-400/10',
    STOK_TUKETIM: 'text-orange-400 bg-orange-400/10',
    STOK_AY_SONU_SAYIM: 'text-purple-400 bg-purple-400/10',
    KULLANICI_EKLE: 'text-blue-400 bg-blue-400/10',
    KULLANICI_GUNCELLE: 'text-yellow-400 bg-yellow-400/10',
    KULLANICI_SIL: 'text-red-400 bg-red-400/10',
    SIFRE_DEGISTIR: 'text-zinc-400 bg-zinc-400/10',
};

const EYLEM_LABEL = {
    SATIS_EKLE: 'Satış Eklendi',
    SATIS_SIL: 'Satış Silindi',
    STOK_GIRIS_FATURA: 'Giriş Faturası',
    STOK_IADE_FATURA: 'İade Faturası',
    STOK_ZAYI: 'Zayi Gideri',
    STOK_TUKETIM: 'Tüketim Gideri',
    STOK_AY_SONU_SAYIM: 'Ay Sonu Sayım',
    KULLANICI_EKLE: 'Kullanıcı Eklendi',
    KULLANICI_GUNCELLE: 'Kullanıcı Güncellendi',
    KULLANICI_SIL: 'Kullanıcı Silindi',
    SIFRE_DEGISTIR: 'Şifre Değiştirildi',
};

export default function AuditLog() {
    const [veri, setVeri] = useState([]);
    const [yukleniyor, setYukleniyor] = useState(true);
    const [filtre, setFiltre] = useState('');

    const getir = async () => {
        setYukleniyor(true);
        try {
            const res = await api.get('/api/audit-log?limit=200');
            setVeri(res.data.data);
        } catch (err) {
            console.error(err);
        } finally {
            setYukleniyor(false);
        }
    };

    useEffect(() => { getir(); }, []);

    const filtrelenmis = veri.filter(log =>
        !filtre || log.eylem === filtre
    );

    const benzersizEylemler = [...new Set(veri.map(l => l.eylem))];

    return (
        <div>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-3">
                <div>
                    <h1 className="text-xl font-bold text-white">İşlem Geçmişi</h1>
                    <p className="text-zinc-500 text-sm mt-0.5">{filtrelenmis.length} kayıt</p>
                </div>
                <div className="flex items-center gap-2">
                    <select
                        value={filtre}
                        onChange={(e) => setFiltre(e.target.value)}
                        className="bg-zinc-900 border border-zinc-800 text-white rounded-lg px-3 py-2 text-sm outline-none focus:border-lime-400"
                    >
                        <option value="">Tüm İşlemler</option>
                        {benzersizEylemler.map(e => (
                            <option key={e} value={e}>{EYLEM_LABEL[e] || e}</option>
                        ))}
                    </select>
                    <button onClick={getir} className="text-zinc-400 hover:text-white border border-zinc-700 px-3 py-2 rounded-lg text-sm transition-colors">
                        🔄
                    </button>
                </div>
            </div>

            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden">
                {yukleniyor ? (
                    <div className="text-center py-16 text-zinc-500 text-sm">Yükleniyor...</div>
                ) : filtrelenmis.length === 0 ? (
                    <div className="text-center py-16 text-zinc-500 text-sm">Kayıt bulunamadı</div>
                ) : (
                    <div className="divide-y divide-zinc-800">
                        {filtrelenmis.map((log) => (
                            <div key={log.id} className="px-4 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2 hover:bg-zinc-800/30 transition-colors">
                                <div className="flex items-center gap-3">
                                    <span className={`text-xs px-2 py-1 rounded-lg font-medium shrink-0 ${EYLEM_RENK[log.eylem] || 'text-zinc-400 bg-zinc-400/10'}`}>
                                        {EYLEM_LABEL[log.eylem] || log.eylem}
                                    </span>
                                    <div>
                                        <span className="text-sm text-white">{log.kullanici?.ad || 'Sistem'}</span>
                                        <span className="text-xs text-zinc-500 ml-2">{log.kullanici?.email}</span>
                                        {log.detay && (
                                            <div className="text-xs text-zinc-500 mt-0.5 font-mono">
                                                {Object.entries(JSON.parse(log.detay))
                                                    .map(([k, v]) => `${k}: ${v}`)
                                                    .join(' · ')}
                                            </div>
                                        )}
                                    </div>
                                </div>
                                <div className="text-xs text-zinc-500 shrink-0">
                                    {new Date(log.createdAt).toLocaleString('tr-TR')}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}