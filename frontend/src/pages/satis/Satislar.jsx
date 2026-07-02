import { useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';
import api from '../../services/api';
import Modal from '../../components/Modal';
import useAuthStore from '../../store/auth.store';
import SubeSecici from '../../components/SubeSecici';
import useSubeStore from '../../store/subeStore';

const fmt = (n) => Number(n || 0).toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const inputCls = "w-full bg-zinc-800 border border-zinc-700 text-white rounded-lg px-4 py-2.5 text-sm outline-none focus:border-lime-400 transition-colors";

// Stok yetersizliğini bilerek geçip satışı zorla kaydedebilecek roller.
// Backend'de de aynı liste var — burası sadece UI'da butonu göstermek/gizlemek için.
const ZORLA_IZINLI_ROLLER = ['TENANT_ADMIN', 'ADMIN', 'MUDUR'];

export default function Satislar() {
    const { kullanici } = useAuthStore();
    const { seciliSubeId } = useSubeStore();
    const subeParam = seciliSubeId ? `?subeId=${seciliSubeId}` : '';
    const zorlaYetkisiVar = ZORLA_IZINLI_ROLLER.includes(kullanici?.rol);

    const bosForm = useCallback(() => ({
        receteId: '', subeId: kullanici?.subeId || '',
        adet: '1', birimFiyat: '', aciklama: '',
        tarih: new Date().toISOString().split('T')[0]
    }), [kullanici?.subeId]);

    const [veri, setVeri] = useState([]);
    const [receteler, setReceteler] = useState([]);
    const [modal, setModal] = useState(false);
    const [form, setForm] = useState(bosForm);
    const [yukleniyor, setYukleniyor] = useState(false);
    const [tabloYukleniyor, setTabloYukleniyor] = useState(true);
    const [gunlukToplam, setGunlukToplam] = useState(0);
    const [silOnayId, setSilOnayId] = useState(null);

    // Yetersiz stok hatası geldiğinde, zorla kaydet onayı için bekleyen hata mesajı
    const [zorlaOnayMesaji, setZorlaOnayMesaji] = useState(null);

    const getir = useCallback(async () => {
        setTabloYukleniyor(true);
        try {
            const [receteRes, satisRes, gunlukRes] = await Promise.allSettled([
                api.get('/api/receteler'),
                api.get(`/api/satislar${subeParam}`),
                api.get(`/api/satislar/gunluk-toplam${subeParam}`),
            ]);
            if (receteRes.status === 'fulfilled') setReceteler(receteRes.value.data?.data || []);
            if (satisRes.status === 'fulfilled') setVeri(satisRes.value.data?.data || []);
            else toast.error('Satışlar yüklenemedi');
            if (gunlukRes.status === 'fulfilled') setGunlukToplam(gunlukRes.value.data?.data?.toplam || 0);
        } finally {
            setTabloYukleniyor(false);
        }
    }, [subeParam]);

    useEffect(() => { getir(); }, [getir]);

    const kaydet = async (zorla = false) => {
        if (!form.receteId || !form.adet || !form.birimFiyat)
            return toast.error('Reçete, adet ve fiyat zorunlu');
        setYukleniyor(true);
        try {
            const res = await api.post('/api/satislar', { ...form, zorla });
            if (res.data?.zorlandi) {
                toast.success('Satış stok yetersizliğine rağmen kaydedildi', { icon: '⚠️' });
            } else {
                toast.success('Satış kaydedildi');
            }
            setModal(false);
            setForm(bosForm());
            setZorlaOnayMesaji(null);
            getir();
        } catch (err) {
            const mesaj = err.response?.data?.mesaj || 'Hata oluştu';
            // Yetersiz stok hatası ve kullanıcının zorlama yetkisi varsa,
            // hatayı direkt göstermek yerine onay sorusuna çevir.
            if (mesaj.startsWith('Yetersiz stok') && zorlaYetkisiVar && !zorla) {
                setZorlaOnayMesaji(mesaj);
            } else {
                toast.error(mesaj);
            }
        } finally {
            setYukleniyor(false);
        }
    };

    const sil = async (id) => {
        try {
            await api.delete(`/api/satislar/${id}`);
            toast.success('Silindi');
            setSilOnayId(null);
            getir();
        } catch (err) {
            toast.error(err.response?.data?.mesaj || 'Silinemedi');
        }
    };

    const toplamTutar = form.adet && form.birimFiyat
        ? fmt(Number(form.adet) * Number(form.birimFiyat))
        : '0,00';

    const silOnay = veri.find(s => s.id === silOnayId);

    return (
        <div>
            {/* Başlık */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-3">
                <div>
                    <h1 className="text-xl font-bold text-white">Satışlar</h1>
                    <p className="text-zinc-500 text-sm mt-0.5">
                        {tabloYukleniyor ? 'Yükleniyor...' : `${veri.length} kayıt`}
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <div className="bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-2 text-right">
                        <div className="text-xs text-zinc-500">Günlük Toplam</div>
                        <div className="text-lime-400 font-bold text-sm">₺{fmt(gunlukToplam)}</div>
                    </div>
                    <button
                        onClick={() => { setForm(bosForm()); setModal(true); }}
                        className="bg-lime-400 hover:bg-lime-300 active:scale-95 text-black font-bold text-sm px-4 py-2 rounded-lg transition-all"
                    >
                        + Yeni Satış
                    </button>
                </div>
            </div>

            <SubeSecici />

            {/* Tablo */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="border-b border-zinc-800 bg-zinc-800/30">
                                <th className="text-left text-xs text-zinc-500 font-semibold uppercase tracking-wider py-3 px-4">Reçete</th>
                                <th className="text-right text-xs text-zinc-500 font-semibold uppercase tracking-wider py-3 px-4 hidden sm:table-cell">Adet</th>
                                <th className="text-right text-xs text-zinc-500 font-semibold uppercase tracking-wider py-3 px-4 hidden sm:table-cell">Birim Fiyat</th>
                                <th className="text-right text-xs text-zinc-500 font-semibold uppercase tracking-wider py-3 px-4">Toplam</th>
                                <th className="text-left text-xs text-zinc-500 font-semibold uppercase tracking-wider py-3 px-4 hidden sm:table-cell">Tarih</th>
                                <th className="text-right text-xs text-zinc-500 font-semibold uppercase tracking-wider py-3 px-4">İşlem</th>
                            </tr>
                        </thead>
                        <tbody>
                            {tabloYukleniyor ? (
                                Array.from({ length: 4 }).map((_, i) => (
                                    <tr key={i} className="border-b border-zinc-800/50 animate-pulse">
                                        <td className="py-3 px-4"><div className="h-4 w-32 bg-zinc-800 rounded" /></td>
                                        <td className="py-3 px-4 hidden sm:table-cell"><div className="h-4 w-8 bg-zinc-800 rounded ml-auto" /></td>
                                        <td className="py-3 px-4 hidden sm:table-cell"><div className="h-4 w-20 bg-zinc-800 rounded ml-auto" /></td>
                                        <td className="py-3 px-4"><div className="h-4 w-20 bg-zinc-800 rounded ml-auto" /></td>
                                        <td className="py-3 px-4 hidden sm:table-cell"><div className="h-4 w-24 bg-zinc-800 rounded" /></td>
                                        <td className="py-3 px-4"><div className="h-4 w-8 bg-zinc-800 rounded ml-auto" /></td>
                                    </tr>
                                ))
                            ) : veri.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="text-center py-16 text-zinc-500 text-sm">
                                        <div className="text-3xl mb-2">🛒</div>
                                        Henüz satış kaydı yok
                                    </td>
                                </tr>
                            ) : veri.map((s) => (
                                <tr key={s.id} className="border-b border-zinc-800/50 hover:bg-zinc-800/30 transition-colors">
                                    <td className="py-3 px-4 text-sm text-white font-medium">
                                        {s.recete?.ad}
                                        {s.aciklama?.includes('ZORLA KAYDEDİLDİ') && (
                                            <span className="ml-2 text-amber-400 text-xs" title="Yetersiz stoğa rağmen zorla kaydedildi">⚠️</span>
                                        )}
                                    </td>
                                    <td className="py-3 px-4 text-right text-sm font-mono text-zinc-300 hidden sm:table-cell">{s.adet}</td>
                                    <td className="py-3 px-4 text-right text-sm font-mono text-zinc-300 hidden sm:table-cell">₺{fmt(s.birimFiyat)}</td>
                                    <td className="py-3 px-4 text-right text-sm font-mono font-bold text-lime-400">₺{fmt(s.toplam)}</td>
                                    <td className="py-3 px-4 text-sm text-zinc-400 hidden sm:table-cell">
                                        {new Date(s.tarih).toLocaleDateString('tr-TR')}
                                    </td>
                                    <td className="py-3 px-4 text-right">
                                        <button
                                            onClick={() => setSilOnayId(s.id)}
                                            className="text-xs text-zinc-500 hover:text-red-400 transition-colors px-2 py-1 rounded hover:bg-red-400/10"
                                        >
                                            Sil
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Yeni Satış Modal */}
            {modal && (
                <Modal baslik="Yeni Satış" onKapat={() => setModal(false)}>
                    <div className="space-y-4">
                        <div>
                            <label className="text-zinc-400 text-sm mb-1.5 block">Reçete *</label>
                            <select
                                value={form.receteId}
                                onChange={(e) => {
                                    const rec = receteler.find(r => r.id === Number(e.target.value));
                                    setForm({ ...form, receteId: e.target.value, birimFiyat: rec?.satisFiyati || '' });
                                }}
                                className={inputCls}
                            >
                                <option value="">— Reçete seç —</option>
                                {receteler.map((r) => (
                                    <option key={r.id} value={r.id}>{r.ad}</option>
                                ))}
                            </select>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="text-zinc-400 text-sm mb-1.5 block">Adet *</label>
                                <input
                                    type="number" min="1" value={form.adet}
                                    onChange={(e) => setForm({ ...form, adet: e.target.value })}
                                    className={inputCls}
                                />
                            </div>
                            <div>
                                <label className="text-zinc-400 text-sm mb-1.5 block">Birim Fiyat (₺) *</label>
                                <input
                                    type="number" min="0" step="0.01" value={form.birimFiyat}
                                    onChange={(e) => setForm({ ...form, birimFiyat: e.target.value })}
                                    className={inputCls}
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="text-zinc-400 text-sm mb-1.5 block">Tarih</label>
                                <input
                                    type="date" value={form.tarih}
                                    onChange={(e) => setForm({ ...form, tarih: e.target.value })}
                                    className={inputCls}
                                />
                            </div>
                            <div>
                                <label className="text-zinc-400 text-sm mb-1.5 block">Açıklama</label>
                                <input
                                    value={form.aciklama}
                                    onChange={(e) => setForm({ ...form, aciklama: e.target.value })}
                                    placeholder="İsteğe bağlı"
                                    className={inputCls}
                                />
                            </div>
                        </div>

                        {/* Toplam özeti */}
                        <div className="bg-zinc-800 rounded-xl p-4 flex justify-between items-center">
                            <span className="text-zinc-400 text-sm">Toplam</span>
                            <span className="text-lime-400 font-bold text-lg">₺{toplamTutar}</span>
                        </div>

                        {/* Zorla kaydet onay bloğu — sadece yetersiz stok hatası geldiğinde ve yetkili rol ise görünür */}
                        {zorlaOnayMesaji && (
                            <div className="bg-amber-400/10 border border-amber-400/40 rounded-xl p-4 space-y-3">
                                <p className="text-amber-300 text-sm">
                                    {zorlaOnayMesaji}
                                    <span className="block mt-1 text-amber-400/80 text-xs">
                                        Stok yetersiz. Yine de kaydetmek istiyor musunuz? Bu tercih kayıt altına alınır.
                                    </span>
                                </p>
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => setZorlaOnayMesaji(null)}
                                        className="flex-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 py-2 rounded-lg text-sm transition-colors"
                                    >
                                        Vazgeç
                                    </button>
                                    <button
                                        onClick={() => kaydet(true)}
                                        disabled={yukleniyor}
                                        className="flex-1 bg-amber-400 hover:bg-amber-300 disabled:opacity-50 text-black font-bold py-2 rounded-lg text-sm transition-colors"
                                    >
                                        Yine de Kaydet
                                    </button>
                                </div>
                            </div>
                        )}

                        {!zorlaOnayMesaji && (
                            <button
                                onClick={() => kaydet(false)}
                                disabled={yukleniyor || !form.receteId || !form.adet || !form.birimFiyat}
                                className="w-full bg-lime-400 hover:bg-lime-300 disabled:opacity-40 disabled:cursor-not-allowed text-black font-bold rounded-lg py-2.5 text-sm transition-colors"
                            >
                                {yukleniyor ? 'Kaydediliyor...' : 'Satışı Kaydet'}
                            </button>
                        )}
                    </div>
                </Modal>
            )}

            {/* Silme Onay Modal */}
            {silOnayId && (
                <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
                    <div className="bg-zinc-900 rounded-2xl p-6 w-full max-w-sm border border-zinc-700 space-y-4">
                        <h2 className="text-white font-bold">Satışı Sil</h2>
                        <p className="text-zinc-400 text-sm">
                            <span className="text-white font-medium">{silOnay?.recete?.ad}</span> satışını silmek istediğinize emin misiniz?
                            <span className="block mt-1 text-zinc-500 text-xs">
                                Bu satış için düşülen stok geri yüklenecektir. İşlem geri alınamaz.
                            </span>
                        </p>
                        <div className="flex gap-3">
                            <button
                                onClick={() => setSilOnayId(null)}
                                className="flex-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 py-2.5 rounded-lg text-sm transition-colors"
                            >
                                İptal
                            </button>
                            <button
                                onClick={() => sil(silOnayId)}
                                className="flex-1 bg-red-600 hover:bg-red-500 text-white py-2.5 rounded-lg text-sm font-semibold transition-colors"
                            >
                                Sil
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}