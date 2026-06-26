import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import toast from 'react-hot-toast';

const BOŞ_FORM = { ad: '', adres: '', telefon: '', aktif: true };

const paraFormat = (tutar) =>
    Number(tutar || 0).toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const inputCls = "w-full bg-zinc-800 text-white px-3 py-2.5 rounded-lg text-sm border border-zinc-700 focus:outline-none focus:border-lime-400 transition-colors";

// ─── Skeleton Kart ────────────────────────────────────────────────────────────
function SkeletonKart() {
    return (
        <div className="bg-zinc-900 rounded-2xl p-5 border border-zinc-800 space-y-3 animate-pulse">
            <div className="flex justify-between items-start">
                <div className="space-y-2">
                    <div className="h-5 w-32 bg-zinc-800 rounded" />
                    <div className="h-4 w-12 bg-zinc-800 rounded-full" />
                </div>
                <div className="h-7 w-20 bg-zinc-800 rounded-lg" />
            </div>
            <div className="h-4 w-28 bg-zinc-800 rounded" />
            <div className="pt-2 border-t border-zinc-800 flex gap-4">
                <div className="h-3 w-24 bg-zinc-800 rounded" />
                <div className="h-3 w-24 bg-zinc-800 rounded" />
            </div>
            <div className="pt-2 border-t border-zinc-800 flex justify-between">
                <div className="h-4 w-20 bg-zinc-800 rounded" />
                <div className="h-4 w-24 bg-zinc-800 rounded" />
            </div>
        </div>
    );
}

export default function Subeler() {
    const [subeler, setSubeler] = useState([]);
    const [yukleniyor, setYukleniyor] = useState(true);
    const [modalAcik, setModalAcik] = useState(false);
    const [form, setForm] = useState(BOŞ_FORM);
    const [duzenleId, setDuzenleId] = useState(null);
    const [kaydediyor, setKaydediyor] = useState(false);
    const navigate = useNavigate();

    const listele = useCallback(async () => {
        try {
            const res = await api.get('/api/subeler');
            setSubeler(res.data);
        } catch {
            toast.error('Şubeler yüklenemedi');
        } finally {
            setYukleniyor(false);
        }
    }, []);

    useEffect(() => { listele(); }, [listele]);

    const yeniAc = () => {
        setForm(BOŞ_FORM);
        setDuzenleId(null);
        setModalAcik(true);
    };

    const duzenleAc = (e, sube) => {
        e.stopPropagation(); // karta tıklamayı tetiklemesin
        setForm({ ad: sube.ad, adres: sube.adres || '', telefon: sube.telefon || '', aktif: sube.aktif });
        setDuzenleId(sube.id);
        setModalAcik(true);
    };

    const modalKapat = () => {
        setModalAcik(false);
        setForm(BOŞ_FORM);
        setDuzenleId(null);
    };

    const kaydet = async () => {
        if (!form.ad.trim()) { toast.error('Şube adı zorunlu'); return; }
        setKaydediyor(true);
        try {
            if (duzenleId) {
                await api.put(`/api/subeler/${duzenleId}`, form);
                toast.success('Şube güncellendi');
            } else {
                await api.post('/api/subeler', form);
                toast.success('Şube eklendi');
            }
            modalKapat();
            listele();
        } catch (e) {
            toast.error(e.response?.data?.hata || 'Kayıt başarısız');
        } finally {
            setKaydediyor(false);
        }
    };

    return (
        <div className="space-y-6">
            {/* Başlık */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                    <h1 className="text-xl font-bold text-white">Şube Yönetimi</h1>
                    <p className="text-zinc-500 text-sm mt-0.5">
                        {!yukleniyor && `${subeler.length} şube`}
                    </p>
                </div>
                <button
                    onClick={yeniAc}
                    className="bg-lime-400 hover:bg-lime-300 active:scale-95 text-zinc-900 px-4 py-2 rounded-lg text-sm font-semibold transition-all w-full sm:w-auto"
                >
                    + Yeni Şube
                </button>
            </div>

            {/* Kart Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {yukleniyor ? (
                    <><SkeletonKart /><SkeletonKart /><SkeletonKart /></>
                ) : subeler.length === 0 ? (
                    <div className="col-span-3 text-center py-16">
                        <div className="text-3xl mb-2">🏪</div>
                        <div className="text-zinc-500 text-sm">Henüz şube eklenmemiş</div>
                    </div>
                ) : subeler.map(sube => (
                    <div
                        key={sube.id}
                        onClick={() => navigate(`/tanimlamalar/subeler/${sube.id}`)}
                        className="bg-zinc-900 rounded-2xl p-5 border border-zinc-800 space-y-3 cursor-pointer hover:border-zinc-600 transition-colors"
                    >
                        {/* Başlık */}
                        <div className="flex justify-between items-start gap-2">
                            <div>
                                <h3 className="text-white font-semibold text-base leading-tight">{sube.ad}</h3>
                                <span className={`inline-block mt-1 text-xs px-2 py-0.5 rounded-full ${sube.aktif ? 'bg-green-900/50 text-green-400' : 'bg-red-900/50 text-red-400'
                                    }`}>
                                    {sube.aktif ? 'Aktif' : 'Pasif'}
                                </span>
                            </div>
                            <button
                                onClick={(e) => duzenleAc(e, sube)}
                                className="shrink-0 text-zinc-400 hover:text-white text-xs bg-zinc-800 hover:bg-zinc-700 px-3 py-1.5 rounded-lg transition-colors"
                            >
                                Düzenle
                            </button>
                        </div>

                        {/* İletişim */}
                        {(sube.telefon || sube.adres) && (
                            <div className="space-y-1">
                                {sube.telefon && (
                                    <div className="flex items-center gap-2 text-zinc-400 text-xs">
                                        <span>📞</span><span>{sube.telefon}</span>
                                    </div>
                                )}
                                {sube.adres && (
                                    <div className="flex items-start gap-2 text-zinc-400 text-xs">
                                        <span className="mt-0.5">📍</span>
                                        <span className="leading-relaxed">{sube.adres}</span>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Sayımlar */}
                        <div className="flex gap-4 pt-2 border-t border-zinc-800 text-xs text-zinc-500">
                            <span>👤 {sube._count?.kullanicilar ?? 0} kullanıcı</span>
                            <span>👥 {sube._count?.personeller ?? 0} personel</span>
                        </div>

                        {/* Günlük özet */}
                        <div className="flex items-center justify-between pt-2 border-t border-zinc-800">
                            <div className="flex items-center gap-1.5">
                                <span className="text-zinc-500 text-xs">Bugün</span>
                                <span className={`text-sm font-semibold ${sube.bugunSatis > 0 ? 'text-lime-400' : 'text-zinc-500'
                                    }`}>
                                    ₺{paraFormat(sube.bugunSatis)}
                                </span>
                            </div>
                            {sube.kritikStok > 0 ? (
                                <div className="flex items-center gap-1 bg-red-950/50 border border-red-800/40 px-2 py-0.5 rounded-full">
                                    <span className="text-red-400 text-xs">⚠</span>
                                    <span className="text-red-400 text-xs font-medium">{sube.kritikStok} kritik</span>
                                </div>
                            ) : (
                                <span className="text-zinc-600 text-xs">✓ Stok normal</span>
                            )}
                        </div>
                    </div>
                ))}
            </div>

            {/* Modal */}
            {modalAcik && (
                <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
                    <div className="bg-zinc-900 rounded-2xl p-6 w-full max-w-md border border-zinc-700 space-y-4">
                        <h2 className="text-white font-bold text-lg">
                            {duzenleId ? 'Şube Düzenle' : 'Yeni Şube Ekle'}
                        </h2>

                        <div className="space-y-3">
                            <div>
                                <label className="text-zinc-400 text-xs block mb-1.5">Şube Adı *</label>
                                <input
                                    value={form.ad}
                                    onChange={e => setForm({ ...form, ad: e.target.value })}
                                    className={inputCls}
                                    placeholder="Merkez Şube"
                                    autoFocus
                                />
                            </div>
                            <div>
                                <label className="text-zinc-400 text-xs block mb-1.5">Telefon</label>
                                <input
                                    type="tel"
                                    value={form.telefon}
                                    onChange={e => setForm({ ...form, telefon: e.target.value })}
                                    className={inputCls}
                                    placeholder="0212 555 00 00"
                                />
                            </div>
                            <div>
                                <label className="text-zinc-400 text-xs block mb-1.5">Adres</label>
                                <textarea
                                    value={form.adres}
                                    onChange={e => setForm({ ...form, adres: e.target.value })}
                                    rows={3}
                                    className={`${inputCls} resize-none`}
                                    placeholder="İstanbul, Kadıköy..."
                                />
                            </div>
                            {duzenleId && (
                                <div className="flex items-center gap-2 py-1">
                                    <input
                                        type="checkbox" id="aktif" checked={form.aktif}
                                        onChange={e => setForm({ ...form, aktif: e.target.checked })}
                                        className="accent-lime-400 w-4 h-4"
                                    />
                                    <label htmlFor="aktif" className="text-zinc-300 text-sm cursor-pointer">Aktif</label>
                                </div>
                            )}
                        </div>

                        <div className="flex gap-3 pt-2 border-t border-zinc-800">
                            <button onClick={modalKapat} className="flex-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 py-2.5 rounded-lg text-sm transition-colors">
                                İptal
                            </button>
                            <button
                                onClick={kaydet}
                                disabled={kaydediyor || !form.ad.trim()}
                                className="flex-1 bg-lime-400 hover:bg-lime-300 disabled:opacity-40 disabled:cursor-not-allowed text-zinc-900 py-2.5 rounded-lg text-sm font-semibold transition-colors"
                            >
                                {kaydediyor ? 'Kaydediliyor...' : 'Kaydet'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}