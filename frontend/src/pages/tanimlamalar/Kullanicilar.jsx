import { useState, useEffect, useCallback } from 'react';
import api from '../../services/api';
import toast from 'react-hot-toast';

// SUPER_ADMIN bilerek yok — güvenlik açığı önlemi
const ROLLER = ['TENANT_ADMIN', 'MUDUR', 'DEPO', 'KASA', 'PERSONEL'];

const ROL_RENK = {
    TENANT_ADMIN: 'bg-orange-900/50 text-orange-400',
    MUDUR: 'bg-yellow-900/50 text-yellow-400',
    DEPO: 'bg-blue-900/50 text-blue-400',
    KASA: 'bg-purple-900/50 text-purple-400',
    PERSONEL: 'bg-zinc-800 text-zinc-400',
};

const ROL_ETIKET = {
    TENANT_ADMIN: 'Admin',
    MUDUR: 'Müdür',
    DEPO: 'Depo',
    KASA: 'Kasa',
    PERSONEL: 'Personel',
};

const ROL_ACIKLAMA = {
    TENANT_ADMIN: {
        ozet: 'Tam yetki',
        detay: 'Firmanın tüm modüllerine erişir: stok, satış, reçete, cari hesap, raporlar, personel. Kullanıcı ekleyip çıkarabilir ve şube açabilir.',
        renk: 'border-orange-500/30 bg-orange-500/5 text-orange-300',
    },
    MUDUR: {
        ozet: 'Operasyonel yönetim',
        detay: 'Stok, satış, reçete, cari hesap, rapor ve personel modüllerine erişir. Kullanıcı ekleme/çıkarma ve şube ayarlarına giremez.',
        renk: 'border-yellow-500/30 bg-yellow-500/5 text-yellow-300',
    },
    DEPO: {
        ozet: 'Sadece stok',
        detay: 'Yalnızca Stok modülüne erişir: giriş/iade faturası, zayi, tüketim, ay sonu sayım, stok kartı tanımları. Satış ve cari hesaba dokunamaz.',
        renk: 'border-blue-500/30 bg-blue-500/5 text-blue-300',
    },
    KASA: {
        ozet: 'Sadece satış',
        detay: 'Yalnızca Satış ekranına erişir, günlük satış girişi yapar. Stok veya cari hesap bilgilerini göremez.',
        renk: 'border-purple-500/30 bg-purple-500/5 text-purple-300',
    },
    PERSONEL: {
        ozet: 'En kısıtlı erişim',
        detay: 'Sadece kendi devam/mesai/avans bilgisini görür. Başka hiçbir modüle erişimi yoktur.',
        renk: 'border-zinc-500/30 bg-zinc-500/5 text-zinc-300',
    },
};

const BOŞ_FORM = { ad: '', email: '', sifre: '', rol: 'PERSONEL', subeId: '', aktif: true };

const inputCls = "w-full bg-zinc-800 text-white px-3 py-2.5 rounded-lg text-sm border border-zinc-700 focus:outline-none focus:border-lime-400 transition-colors";

// ─── Skeleton satır ───────────────────────────────────────────────────────────
function SkeletonSatir() {
    return (
        <tr className="border-b border-zinc-800/50 animate-pulse">
            {[32, 40, 16, 20, 12, 20, 16].map((w, i) => (
                <td key={i} className={`px-4 py-3 ${i === 6 ? 'text-right' : ''}`}>
                    <div className={`h-4 w-${w} bg-zinc-800 rounded ${i === 6 ? 'ml-auto' : ''}`} />
                </td>
            ))}
        </tr>
    );
}

export default function Kullanicilar() {
    const [kullanicilar, setKullanicilar] = useState([]);
    const [subeler, setSubeler] = useState([]);
    const [yukleniyor, setYukleniyor] = useState(true);
    const [modalAcik, setModalAcik] = useState(false);
    const [silOnay, setSilOnay] = useState(null);
    const [form, setForm] = useState(BOŞ_FORM);
    const [duzenleId, setDuzenleId] = useState(null);
    const [kaydediyor, setKaydediyor] = useState(false);
    const [sifreGoster, setSifreGoster] = useState(false);

    const listele = useCallback(async () => {
        try {
            const [kulRes, subeRes] = await Promise.all([
                api.get('/api/kullanicilar'),
                api.get('/api/subeler'),
            ]);
            setKullanicilar(kulRes.data);
            setSubeler(subeRes.data);
        } catch {
            toast.error('Veriler yüklenemedi');
        } finally {
            setYukleniyor(false);
        }
    }, []);

    useEffect(() => { listele(); }, [listele]);

    const yeniAc = () => {
        setForm(BOŞ_FORM);
        setDuzenleId(null);
        setSifreGoster(false);
        setModalAcik(true);
    };

    const duzenleAc = (k) => {
        setForm({ ad: k.ad, email: k.email, sifre: '', rol: k.rol, subeId: k.sube?.id || '', aktif: k.aktif });
        setDuzenleId(k.id);
        setSifreGoster(false);
        setModalAcik(true);
    };

    const modalKapat = () => {
        setModalAcik(false);
        setForm(BOŞ_FORM);
        setDuzenleId(null);
        setSifreGoster(false);
    };

    const kaydet = async () => {
        if (!form.ad || !form.email) { toast.error('Ad ve email zorunlu'); return; }
        if (!duzenleId && !form.sifre) { toast.error('Şifre zorunlu'); return; }
        setKaydediyor(true);
        try {
            const payload = { ...form, subeId: form.subeId ? parseInt(form.subeId) : null };
            if (duzenleId) {
                if (!payload.sifre) delete payload.sifre;
                await api.put(`/api/kullanicilar/${duzenleId}`, payload);
                toast.success('Kullanıcı güncellendi');
            } else {
                await api.post('/api/kullanicilar', payload);
                toast.success('Kullanıcı eklendi');
            }
            modalKapat();
            listele();
        } catch (e) {
            toast.error(e.response?.data?.hata || 'Kayıt başarısız');
        } finally {
            setKaydediyor(false);
        }
    };

    const sil = async (id) => {
        try {
            await api.delete(`/api/kullanicilar/${id}`);
            toast.success('Kullanıcı silindi');
            setSilOnay(null);
            listele();
        } catch (e) {
            toast.error(e.response?.data?.hata || 'Silinemedi');
        }
    };

    const seciliRolBilgi = ROL_ACIKLAMA[form.rol];

    return (
        <div className="space-y-6">
            {/* Başlık */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                    <h1 className="text-xl font-bold text-white">Kullanıcı Yönetimi</h1>
                    <p className="text-zinc-500 text-sm mt-0.5">
                        {!yukleniyor && `${kullanicilar.length} kullanıcı`}
                    </p>
                </div>
                <button
                    onClick={yeniAc}
                    className="bg-lime-400 hover:bg-lime-300 active:scale-95 text-zinc-900 px-4 py-2 rounded-lg text-sm font-semibold transition-all w-full sm:w-auto"
                >
                    + Yeni Kullanıcı
                </button>
            </div>

            {/* İçerik */}
            {yukleniyor ? (
                /* Masaüstü skeleton */
                <div className="hidden sm:block bg-zinc-900 rounded-2xl border border-zinc-800 overflow-hidden">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="text-zinc-500 border-b border-zinc-800 bg-zinc-800/30">
                                {['Ad', 'Email', 'Rol', 'Şube', 'Durum', 'Kayıt Tarihi', 'İşlem'].map(h => (
                                    <th key={h} className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider">{h}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            <SkeletonSatir /><SkeletonSatir /><SkeletonSatir />
                        </tbody>
                    </table>
                </div>
            ) : kullanicilar.length === 0 ? (
                <div className="bg-zinc-900 rounded-2xl border border-zinc-800 text-center py-16">
                    <div className="text-3xl mb-2">👤</div>
                    <div className="text-zinc-500 text-sm">Henüz kullanıcı yok</div>
                </div>
            ) : (
                <>
                    {/* Mobil kart görünümü */}
                    <div className="space-y-3 sm:hidden">
                        {kullanicilar.map(k => (
                            <div key={k.id} className="bg-zinc-900 rounded-2xl border border-zinc-800 p-4">
                                <div className="flex items-start justify-between gap-2 mb-3">
                                    <div className="min-w-0">
                                        <div className="text-white font-medium truncate">{k.ad}</div>
                                        <div className="text-zinc-500 text-xs truncate mt-0.5">{k.email}</div>
                                    </div>
                                    <span className={`shrink-0 px-2 py-0.5 rounded text-xs font-medium ${ROL_RENK[k.rol] || 'bg-zinc-800 text-zinc-400'}`}>
                                        {ROL_ETIKET[k.rol] || k.rol}
                                    </span>
                                </div>

                                <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 text-xs text-zinc-400 mb-3">
                                    <span>🏪 {k.sube?.ad || 'Şube yok'}</span>
                                    <span className={`px-2 py-0.5 rounded-full ${k.aktif ? 'bg-green-900/50 text-green-400' : 'bg-red-900/50 text-red-400'}`}>
                                        {k.aktif ? 'Aktif' : 'Pasif'}
                                    </span>
                                    <span className="text-zinc-600">{new Date(k.createdAt).toLocaleDateString('tr-TR')}</span>
                                </div>

                                <div className="flex gap-2">
                                    <button onClick={() => duzenleAc(k)} className="flex-1 text-xs bg-zinc-800 hover:bg-zinc-700 text-zinc-300 py-2 rounded-lg transition-colors">
                                        Düzenle
                                    </button>
                                    <button onClick={() => setSilOnay(k)} className="flex-1 text-xs bg-red-900/30 hover:bg-red-900/60 text-red-400 py-2 rounded-lg transition-colors">
                                        Sil
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Masaüstü tablo */}
                    <div className="hidden sm:block bg-zinc-900 rounded-2xl border border-zinc-800 overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="text-zinc-500 border-b border-zinc-800 bg-zinc-800/30">
                                        {['Ad', 'Email', 'Rol', 'Şube', 'Durum', 'Kayıt Tarihi', 'İşlem'].map((h, i) => (
                                            <th key={h} className={`px-4 py-3 text-xs font-semibold uppercase tracking-wider ${i === 6 ? 'text-right' : 'text-left'}`}>{h}</th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {kullanicilar.map(k => (
                                        <tr key={k.id} className="border-b border-zinc-800/50 text-zinc-300 hover:bg-zinc-800/30 transition-colors">
                                            <td className="px-4 py-3 font-medium text-white">{k.ad}</td>
                                            <td className="px-4 py-3 text-zinc-400 text-xs">{k.email}</td>
                                            <td className="px-4 py-3">
                                                <span className={`px-2 py-0.5 rounded text-xs font-medium ${ROL_RENK[k.rol] || 'bg-zinc-800 text-zinc-400'}`}>
                                                    {ROL_ETIKET[k.rol] || k.rol}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 text-zinc-400 text-xs">{k.sube?.ad || '—'}</td>
                                            <td className="px-4 py-3">
                                                <span className={`px-2 py-0.5 rounded-full text-xs ${k.aktif ? 'bg-green-900/50 text-green-400' : 'bg-red-900/50 text-red-400'}`}>
                                                    {k.aktif ? 'Aktif' : 'Pasif'}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 text-zinc-500 text-xs">{new Date(k.createdAt).toLocaleDateString('tr-TR')}</td>
                                            <td className="px-4 py-3 text-right">
                                                <div className="flex gap-2 justify-end">
                                                    <button onClick={() => duzenleAc(k)} className="text-xs bg-zinc-700 hover:bg-zinc-600 text-zinc-300 px-3 py-1.5 rounded-lg transition-colors">
                                                        Düzenle
                                                    </button>
                                                    <button onClick={() => setSilOnay(k)} className="text-xs bg-red-900/30 hover:bg-red-900/60 text-red-400 px-3 py-1.5 rounded-lg transition-colors">
                                                        Sil
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </>
            )}

            {/* Ekle / Düzenle Modal */}
            {modalAcik && (
                <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
                    <div className="bg-zinc-900 rounded-2xl p-5 sm:p-6 w-full max-w-md border border-zinc-700 max-h-[90vh] overflow-y-auto">
                        <h2 className="text-white font-bold text-lg mb-5">
                            {duzenleId ? 'Kullanıcı Düzenle' : 'Yeni Kullanıcı Ekle'}
                        </h2>

                        <div className="space-y-3">
                            <div>
                                <label className="text-zinc-400 text-xs block mb-1.5">Ad Soyad *</label>
                                <input
                                    value={form.ad}
                                    onChange={e => setForm({ ...form, ad: e.target.value })}
                                    className={inputCls} placeholder="Ali Yılmaz"
                                />
                            </div>
                            <div>
                                <label className="text-zinc-400 text-xs block mb-1.5">Email *</label>
                                <input
                                    type="email" value={form.email}
                                    onChange={e => setForm({ ...form, email: e.target.value })}
                                    className={inputCls} placeholder="ali@gastrobrain.com"
                                    autoCapitalize="none" autoCorrect="off"
                                />
                            </div>
                            <div>
                                <label className="text-zinc-400 text-xs block mb-1.5">
                                    Şifre {duzenleId ? <span className="text-zinc-600">(boş bırakılırsa değişmez)</span> : '*'}
                                </label>
                                <div className="relative">
                                    <input
                                        type={sifreGoster ? 'text' : 'password'}
                                        value={form.sifre}
                                        onChange={e => setForm({ ...form, sifre: e.target.value })}
                                        className={`${inputCls} pr-10`}
                                        placeholder="••••••"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setSifreGoster(p => !p)}
                                        tabIndex={-1}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 text-sm transition-colors"
                                    >
                                        {sifreGoster ? '🙈' : '👁️'}
                                    </button>
                                </div>
                            </div>
                            <div>
                                <label className="text-zinc-400 text-xs block mb-1.5">Rol</label>
                                <select
                                    value={form.rol}
                                    onChange={e => setForm({ ...form, rol: e.target.value })}
                                    className={inputCls}
                                >
                                    {ROLLER.map(r => <option key={r} value={r}>{ROL_ETIKET[r]}</option>)}
                                </select>
                                {seciliRolBilgi && (
                                    <div className={`mt-2 rounded-lg border px-3 py-2.5 text-xs leading-relaxed ${seciliRolBilgi.renk}`}>
                                        <span className="font-semibold">{seciliRolBilgi.ozet}:</span>{' '}
                                        {seciliRolBilgi.detay}
                                    </div>
                                )}
                            </div>
                            <div>
                                <label className="text-zinc-400 text-xs block mb-1.5">Şube</label>
                                <select
                                    value={form.subeId}
                                    onChange={e => setForm({ ...form, subeId: e.target.value })}
                                    className={inputCls}
                                >
                                    <option value="">— Şube Seçin —</option>
                                    {subeler.map(s => <option key={s.id} value={s.id}>{s.ad}</option>)}
                                </select>
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

                        <div className="flex gap-3 mt-5 pt-4 border-t border-zinc-800">
                            <button onClick={modalKapat} className="flex-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 py-2.5 rounded-lg text-sm transition-colors">
                                İptal
                            </button>
                            <button
                                onClick={kaydet}
                                disabled={kaydediyor}
                                className="flex-1 bg-lime-400 hover:bg-lime-300 disabled:opacity-40 text-zinc-900 py-2.5 rounded-lg text-sm font-semibold transition-colors"
                            >
                                {kaydediyor ? 'Kaydediliyor...' : 'Kaydet'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Silme Onay Modal */}
            {silOnay && (
                <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
                    <div className="bg-zinc-900 rounded-2xl p-6 w-full max-w-sm border border-zinc-700 space-y-4">
                        <h2 className="text-white font-bold">Kullanıcıyı Sil</h2>
                        <p className="text-zinc-400 text-sm">
                            <span className="text-white font-medium">{silOnay.ad}</span> adlı kullanıcıyı silmek istediğinize emin misiniz?
                            <span className="block mt-1 text-zinc-600 text-xs">Bu işlem geri alınamaz.</span>
                        </p>
                        <div className="flex gap-3">
                            <button onClick={() => setSilOnay(null)} className="flex-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 py-2.5 rounded-lg text-sm transition-colors">
                                İptal
                            </button>
                            <button onClick={() => sil(silOnay.id)} className="flex-1 bg-red-600 hover:bg-red-500 text-white py-2.5 rounded-lg text-sm font-semibold transition-colors">
                                Sil
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}