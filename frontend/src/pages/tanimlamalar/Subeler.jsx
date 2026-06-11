import { useState, useEffect } from 'react';
import api from '../../services/api';
import toast from 'react-hot-toast';

const BOŞ_FORM = { ad: '', adres: '', telefon: '', aktif: true };

export default function Subeler() {
    const [subeler, setSubeler] = useState([]);
    const [yukleniyor, setYukleniyor] = useState(true);
    const [modalAcik, setModalAcik] = useState(false);
    const [form, setForm] = useState(BOŞ_FORM);
    const [duzenleId, setDuzenleId] = useState(null);
    const [kaydediyor, setKaydediyor] = useState(false);

    const listele = async () => {
        try {
            const res = await api.get('/api/subeler');
            setSubeler(res.data);
        } catch {
            toast.error('Şubeler yüklenemedi');
        } finally {
            setYukleniyor(false);
        }
    };

    useEffect(() => { listele(); }, []);

    const yeniAc = () => {
        setForm(BOŞ_FORM);
        setDuzenleId(null);
        setModalAcik(true);
    };

    const duzenleAc = (sube) => {
        setForm({ ad: sube.ad, adres: sube.adres || '', telefon: sube.telefon || '', aktif: sube.aktif });
        setDuzenleId(sube.id);
        setModalAcik(true);
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
            setModalAcik(false);
            listele();
        } catch (e) {
            toast.error(e.response?.data?.hata || 'Kayıt başarısız');
        } finally {
            setKaydediyor(false);
        }
    };

    return (
        <div className="p-6 space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold text-white">Şube Yönetimi</h1>
                <button
                    onClick={yeniAc}
                    className="bg-lime-400 text-zinc-900 px-4 py-2 rounded-lg text-sm font-semibold hover:bg-lime-300"
                >
                    + Yeni Şube
                </button>
            </div>

            {yukleniyor ? (
                <div className="text-zinc-400 text-center py-12">Yükleniyor...</div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                    {subeler.map(sube => (
                        <div key={sube.id} className="bg-zinc-900 rounded-xl p-5 border border-zinc-800 space-y-3">
                            <div className="flex justify-between items-start">
                                <div>
                                    <h3 className="text-white font-semibold text-lg">{sube.ad}</h3>
                                    <span className={`text-xs px-2 py-0.5 rounded-full ${sube.aktif ? 'bg-green-900/50 text-green-400' : 'bg-red-900/50 text-red-400'
                                        }`}>
                                        {sube.aktif ? 'Aktif' : 'Pasif'}
                                    </span>
                                </div>
                                <button
                                    onClick={() => duzenleAc(sube)}
                                    className="text-zinc-400 hover:text-white text-sm bg-zinc-800 px-3 py-1 rounded-lg"
                                >
                                    Düzenle
                                </button>
                            </div>

                            {sube.telefon && (
                                <div className="flex items-center gap-2 text-zinc-400 text-sm">
                                    <span>📞</span> {sube.telefon}
                                </div>
                            )}
                            {sube.adres && (
                                <div className="flex items-center gap-2 text-zinc-400 text-sm">
                                    <span>📍</span> {sube.adres}
                                </div>
                            )}

                            <div className="flex gap-4 pt-2 border-t border-zinc-800 text-xs text-zinc-500">
                                <span>👤 {sube._count.kullanicilar} kullanıcı</span>
                                <span>👥 {sube._count.personeller} personel</span>
                            </div>
                        </div>
                    ))}

                    {subeler.length === 0 && (
                        <div className="col-span-3 text-center text-zinc-500 py-12">Henüz şube eklenmemiş</div>
                    )}
                </div>
            )}

            {/* Modal */}
            {modalAcik && (
                <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
                    <div className="bg-zinc-900 rounded-xl p-6 w-full max-w-md space-y-4 border border-zinc-700">
                        <h2 className="text-white font-semibold text-lg">
                            {duzenleId ? 'Şube Düzenle' : 'Yeni Şube Ekle'}
                        </h2>

                        <div className="space-y-3">
                            <div>
                                <label className="text-zinc-400 text-xs block mb-1">Şube Adı *</label>
                                <input
                                    value={form.ad}
                                    onChange={e => setForm({ ...form, ad: e.target.value })}
                                    className="w-full bg-zinc-800 text-white px-3 py-2 rounded-lg text-sm border border-zinc-700 focus:outline-none focus:border-lime-400"
                                    placeholder="Merkez Şube"
                                />
                            </div>
                            <div>
                                <label className="text-zinc-400 text-xs block mb-1">Telefon</label>
                                <input
                                    value={form.telefon}
                                    onChange={e => setForm({ ...form, telefon: e.target.value })}
                                    className="w-full bg-zinc-800 text-white px-3 py-2 rounded-lg text-sm border border-zinc-700 focus:outline-none focus:border-lime-400"
                                    placeholder="0212 555 00 00"
                                />
                            </div>
                            <div>
                                <label className="text-zinc-400 text-xs block mb-1">Adres</label>
                                <textarea
                                    value={form.adres}
                                    onChange={e => setForm({ ...form, adres: e.target.value })}
                                    rows={3}
                                    className="w-full bg-zinc-800 text-white px-3 py-2 rounded-lg text-sm border border-zinc-700 focus:outline-none focus:border-lime-400 resize-none"
                                    placeholder="İstanbul, Kadıköy..."
                                />
                            </div>
                            {duzenleId && (
                                <div className="flex items-center gap-2">
                                    <input
                                        type="checkbox"
                                        id="aktif"
                                        checked={form.aktif}
                                        onChange={e => setForm({ ...form, aktif: e.target.checked })}
                                        className="accent-lime-400"
                                    />
                                    <label htmlFor="aktif" className="text-zinc-300 text-sm">Aktif</label>
                                </div>
                            )}
                        </div>

                        <div className="flex gap-3 pt-2">
                            <button
                                onClick={() => setModalAcik(false)}
                                className="flex-1 bg-zinc-800 text-zinc-300 py-2 rounded-lg text-sm hover:bg-zinc-700"
                            >
                                İptal
                            </button>
                            <button
                                onClick={kaydet}
                                disabled={kaydediyor}
                                className="flex-1 bg-lime-400 text-zinc-900 py-2 rounded-lg text-sm font-semibold hover:bg-lime-300 disabled:opacity-50"
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