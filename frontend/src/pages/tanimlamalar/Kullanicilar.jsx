import { useState, useEffect } from 'react';
import api from '../../services/api';
import toast from 'react-hot-toast';

const ROLLER = ['SUPER_ADMIN', 'ADMIN', 'MUDUR', 'DEPO', 'KASA', 'PERSONEL'];
const ROL_RENK = {
    SUPER_ADMIN: 'bg-red-900/50 text-red-400',
    ADMIN: 'bg-orange-900/50 text-orange-400',
    MUDUR: 'bg-yellow-900/50 text-yellow-400',
    DEPO: 'bg-blue-900/50 text-blue-400',
    KASA: 'bg-purple-900/50 text-purple-400',
    PERSONEL: 'bg-zinc-800 text-zinc-400',
};
const BOŞ_FORM = { ad: '', email: '', sifre: '', rol: 'PERSONEL', subeId: '', aktif: true };

export default function Kullanicilar() {
    const [kullanicilar, setKullanicilar] = useState([]);
    const [subeler, setSubeler] = useState([]);
    const [yukleniyor, setYukleniyor] = useState(true);
    const [modalAcik, setModalAcik] = useState(false);
    const [silOnay, setSilOnay] = useState(null);
    const [form, setForm] = useState(BOŞ_FORM);
    const [duzenleId, setDuzenleId] = useState(null);
    const [kaydediyor, setKaydediyor] = useState(false);

    const listele = async () => {
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
    };

    useEffect(() => { listele(); }, []);

    const yeniAc = () => {
        setForm(BOŞ_FORM);
        setDuzenleId(null);
        setModalAcik(true);
    };

    const duzenleAc = (k) => {
        setForm({ ad: k.ad, email: k.email, sifre: '', rol: k.rol, subeId: k.sube?.id || '', aktif: k.aktif });
        setDuzenleId(k.id);
        setModalAcik(true);
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
            setModalAcik(false);
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

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <h1 className="text-xl font-bold text-white">Kullanıcı Yönetimi</h1>
                <button onClick={yeniAc} className="bg-lime-400 text-zinc-900 px-4 py-2 rounded-lg text-sm font-semibold hover:bg-lime-300">
                    + Yeni Kullanıcı
                </button>
            </div>

            {yukleniyor ? (
                <div className="text-zinc-400 text-center py-12">Yükleniyor...</div>
            ) : (
                <div className="bg-zinc-900 rounded-xl border border-zinc-800 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="text-zinc-400 border-b border-zinc-800 bg-zinc-800/50">
                                    <th className="text-left px-4 py-3">Ad</th>
                                    <th className="text-left px-4 py-3 hidden sm:table-cell">Email</th>
                                    <th className="text-left px-4 py-3">Rol</th>
                                    <th className="text-left px-4 py-3 hidden sm:table-cell">Şube</th>
                                    <th className="text-left px-4 py-3 hidden sm:table-cell">Durum</th>
                                    <th className="text-left px-4 py-3 hidden sm:table-cell">Kayıt Tarihi</th>
                                    <th className="text-right px-4 py-3">İşlem</th>
                                </tr>
                            </thead>
                            <tbody>
                                {kullanicilar.map(k => (
                                    <tr key={k.id} className="border-b border-zinc-800/50 text-zinc-300 hover:bg-zinc-800/30">
                                        <td className="px-4 py-3 font-medium text-white">{k.ad}</td>
                                        <td className="px-4 py-3 text-zinc-400">{k.email}</td>
                                        <td className="px-4 py-3">
                                            <span className={`px-2 py-0.5 rounded text-xs font-medium ${ROL_RENK[k.rol]}`}>
                                                {k.rol}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 text-zinc-400">{k.sube?.ad || '-'}</td>
                                        <td className="px-4 py-3">
                                            <span className={`px-2 py-0.5 rounded text-xs ${k.aktif ? 'bg-green-900/50 text-green-400' : 'bg-red-900/50 text-red-400'}`}>
                                                {k.aktif ? 'Aktif' : 'Pasif'}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 text-zinc-500">{new Date(k.createdAt).toLocaleDateString('tr-TR')}</td>
                                        <td className="px-4 py-3 text-right">
                                            <div className="flex gap-2 justify-end">
                                                <button onClick={() => duzenleAc(k)} className="text-xs bg-zinc-700 text-zinc-300 px-3 py-1 rounded hover:bg-zinc-600">
                                                    Düzenle
                                                </button>
                                                <button onClick={() => setSilOnay(k)} className="text-xs bg-red-900/40 text-red-400 px-3 py-1 rounded hover:bg-red-900/70">
                                                    Sil
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                                {kullanicilar.length === 0 && (
                                    <tr><td colSpan={7} className="text-center text-zinc-500 py-8">Kullanıcı bulunamadı</td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Ekle/Düzenle Modal */}
            {modalAcik && (
                <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
                    <div className="bg-zinc-900 rounded-xl p-6 w-full max-w-md space-y-4 border border-zinc-700">
                        <h2 className="text-white font-semibold text-lg">
                            {duzenleId ? 'Kullanıcı Düzenle' : 'Yeni Kullanıcı Ekle'}
                        </h2>
                        <div className="space-y-3">
                            <div>
                                <label className="text-zinc-400 text-xs block mb-1">Ad Soyad *</label>
                                <input value={form.ad} onChange={e => setForm({ ...form, ad: e.target.value })}
                                    className="w-full bg-zinc-800 text-white px-3 py-2 rounded-lg text-sm border border-zinc-700 focus:outline-none focus:border-lime-400"
                                    placeholder="Ali Yılmaz" />
                            </div>
                            <div>
                                <label className="text-zinc-400 text-xs block mb-1">Email *</label>
                                <input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })}
                                    className="w-full bg-zinc-800 text-white px-3 py-2 rounded-lg text-sm border border-zinc-700 focus:outline-none focus:border-lime-400"
                                    placeholder="ali@gastroiq.com" />
                            </div>
                            <div>
                                <label className="text-zinc-400 text-xs block mb-1">
                                    Şifre {duzenleId ? '(boş bırakılırsa değişmez)' : '*'}
                                </label>
                                <input type="password" value={form.sifre} onChange={e => setForm({ ...form, sifre: e.target.value })}
                                    className="w-full bg-zinc-800 text-white px-3 py-2 rounded-lg text-sm border border-zinc-700 focus:outline-none focus:border-lime-400"
                                    placeholder="••••••" />
                            </div>
                            <div>
                                <label className="text-zinc-400 text-xs block mb-1">Rol</label>
                                <select value={form.rol} onChange={e => setForm({ ...form, rol: e.target.value })}
                                    className="w-full bg-zinc-800 text-white px-3 py-2 rounded-lg text-sm border border-zinc-700 focus:outline-none focus:border-lime-400">
                                    {ROLLER.map(r => <option key={r} value={r}>{r}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="text-zinc-400 text-xs block mb-1">Şube</label>
                                <select value={form.subeId} onChange={e => setForm({ ...form, subeId: e.target.value })}
                                    className="w-full bg-zinc-800 text-white px-3 py-2 rounded-lg text-sm border border-zinc-700 focus:outline-none focus:border-lime-400">
                                    <option value="">— Şube Seçin —</option>
                                    {subeler.map(s => <option key={s.id} value={s.id}>{s.ad}</option>)}
                                </select>
                            </div>
                            {duzenleId && (
                                <div className="flex items-center gap-2">
                                    <input type="checkbox" id="aktif" checked={form.aktif} onChange={e => setForm({ ...form, aktif: e.target.checked })} className="accent-lime-400" />
                                    <label htmlFor="aktif" className="text-zinc-300 text-sm">Aktif</label>
                                </div>
                            )}
                        </div>
                        <div className="flex gap-3 pt-2">
                            <button onClick={() => setModalAcik(false)} className="flex-1 bg-zinc-800 text-zinc-300 py-2 rounded-lg text-sm hover:bg-zinc-700">İptal</button>
                            <button onClick={kaydet} disabled={kaydediyor} className="flex-1 bg-lime-400 text-zinc-900 py-2 rounded-lg text-sm font-semibold hover:bg-lime-300 disabled:opacity-50">
                                {kaydediyor ? 'Kaydediliyor...' : 'Kaydet'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Silme Onay Modal */}
            {silOnay && (
                <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
                    <div className="bg-zinc-900 rounded-xl p-6 w-full max-w-sm space-y-4 border border-zinc-700">
                        <h2 className="text-white font-semibold">Kullanıcıyı Sil</h2>
                        <p className="text-zinc-400 text-sm">
                            <span className="text-white font-medium">{silOnay.ad}</span> adlı kullanıcıyı silmek istediğinize emin misiniz?
                        </p>
                        <div className="flex gap-3">
                            <button onClick={() => setSilOnay(null)} className="flex-1 bg-zinc-800 text-zinc-300 py-2 rounded-lg text-sm hover:bg-zinc-700">İptal</button>
                            <button onClick={() => sil(silOnay.id)} className="flex-1 bg-red-600 text-white py-2 rounded-lg text-sm font-semibold hover:bg-red-500">Sil</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}