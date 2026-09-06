import { useState, useEffect, useCallback, useMemo } from 'react';
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
    const { seciliSubeId, subeler } = useSubeStore();
    const subeParam = seciliSubeId ? `?subeId=${seciliSubeId}` : '';
    const zorlaYetkisiVar = ZORLA_IZINLI_ROLLER.includes(kullanici?.rol);

    // KURAL: Bir satış her zaman, satışı giren kullanıcının KENDİ şubesi adına
    // kaydedilir — Dashboard'da veya başka bir sayfada hangi şubeyi
    // GÖRÜNTÜLEDİĞİ (seciliSubeId) bunu değiştirmez. Merkez şube müşterisine
    // merkez satış yapar, diğer şube kendi satışını kendi girer. Bu yüzden
    // satış formu şube seçtirmez; kullanici.subeId sabit kullanılır.
    const kendiSubeAdi = kullanici?.sube?.ad || subeler.find(s => s.id === kullanici?.subeId)?.ad;
    const baskaSubeGoruntuleniyor = seciliSubeId && seciliSubeId !== kullanici?.subeId;

    const bosForm = useCallback(() => ({
        receteId: '', subeId: kullanici?.subeId || '',
        adet: '1', birimFiyat: '', aciklama: '',
        tarih: new Date().toISOString().split('T')[0]
    }), [kullanici?.subeId]);

    const [veri, setVeri] = useState([]);
    const [receteler, setReceteler] = useState([]);
    const [kategoriler, setKategoriler] = useState([]);
    const [modal, setModal] = useState(false);
    const [form, setForm] = useState(bosForm);
    const [yukleniyor, setYukleniyor] = useState(false);
    const [tabloYukleniyor, setTabloYukleniyor] = useState(true);
    const [gunlukToplam, setGunlukToplam] = useState(0);
    const [silOnayId, setSilOnayId] = useState(null);

    // Reçete seçim adımı — POS ekranında hızlı arama/kategori filtresi için
    const [receteArama, setReceteArama] = useState('');
    const [receteKategoriFiltre, setReceteKategoriFiltre] = useState('');

    // Yetersiz stok hatası geldiğinde, zorla kaydet onayı için bekleyen hata mesajı
    const [zorlaOnayMesaji, setZorlaOnayMesaji] = useState(null);

    const goruntulenenSubeAdi = seciliSubeId
        ? subeler.find(s => s.id === seciliSubeId)?.ad
        : null;

    const getir = useCallback(async () => {
        setTabloYukleniyor(true);
        try {
            const [receteRes, satisRes, gunlukRes, katRes] = await Promise.allSettled([
                api.get('/api/receteler'),
                api.get(`/api/satislar${subeParam}`),
                api.get(`/api/satislar/gunluk-toplam${subeParam}`),
                api.get('/api/kategoriler?tip=RECETE'),
            ]);
            if (receteRes.status === 'fulfilled') setReceteler(receteRes.value.data?.data || []);
            if (satisRes.status === 'fulfilled') setVeri(satisRes.value.data?.data || []);
            else toast.error('Satışlar yüklenemedi');
            if (gunlukRes.status === 'fulfilled') setGunlukToplam(gunlukRes.value.data?.data?.toplam || 0);
            if (katRes.status === 'fulfilled') setKategoriler(katRes.value.data?.data || []);
        } finally {
            setTabloYukleniyor(false);
        }
    }, [subeParam]);

    useEffect(() => { getir(); }, [getir]);

    // Seçili reçetenin tam objesi — kart grid'inde vurgulamak ve özet
    // alanında adını/kategorisini göstermek için
    const seciliRecete = useMemo(
        () => receteler.find(r => r.id === Number(form.receteId)) || null,
        [receteler, form.receteId]
    );

    const filtrelenmisReceteler = useMemo(() => {
        let liste = receteler;
        if (receteKategoriFiltre) {
            liste = liste.filter(r => String(r.kategoriId) === String(receteKategoriFiltre));
        }
        if (receteArama.trim()) {
            const q = receteArama.trim().toLocaleLowerCase('tr-TR');
            liste = liste.filter(r =>
                r.ad.toLocaleLowerCase('tr-TR').includes(q) ||
                r.satisKodu?.toLocaleLowerCase('tr-TR').includes(q)
            );
        }
        return liste;
    }, [receteler, receteKategoriFiltre, receteArama]);

    const receteSec = (r) => {
        setForm(f => ({ ...f, receteId: String(r.id), birimFiyat: r.satisFiyati || f.birimFiyat }));
    };

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
            setReceteArama('');
            setReceteKategoriFiltre('');
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
            <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-5 gap-3">
                <div>
                    <h1 className="text-xl font-bold text-white">Satışlar</h1>
                    <p className="text-zinc-500 text-sm mt-0.5">
                        {tabloYukleniyor ? 'Yükleniyor...' : `${veri.length} kayıt`}
                        {' — '}
                        <span className="text-zinc-400">
                            {goruntulenenSubeAdi || 'Tüm Şubeler'}
                        </span>
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <div className="bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-2 text-right">
                        <div className="text-xs text-zinc-500">Günlük Toplam</div>
                        <div className="text-lime-400 font-bold text-sm">₺{fmt(gunlukToplam)}</div>
                    </div>
                    <button
                        onClick={() => { setForm(bosForm()); setReceteArama(''); setReceteKategoriFiltre(''); setModal(true); }}
                        className="bg-lime-400 hover:bg-lime-300 active:scale-95 text-black font-bold text-sm px-4 py-2 rounded-lg transition-all"
                    >
                        + Yeni Satış
                    </button>
                </div>
            </div>

            <SubeSecici />

            {/* Başka bir şube görüntülenirken bilgilendirme — satış yine de
                kullanıcının kendi şubesine kaydedilecek */}
            {baskaSubeGoruntuleniyor && (
                <div className="mb-4 bg-blue-500/10 border border-blue-500/30 rounded-lg px-4 py-2.5 text-xs text-blue-300">
                    ℹ️ Şu an <b>{goruntulenenSubeAdi}</b> şubesinin satışlarını görüntülüyorsunuz. Yeni satış eklerseniz bu, sizin şubeniz olan <b>{kendiSubeAdi || 'kendi şubeniz'}</b> adına kaydedilir.
                </div>
            )}

            {/* Tablo */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
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
                                    <td colSpan={6} className="text-center py-14 text-zinc-500 text-sm">
                                        <div className="text-3xl mb-2">🛒</div>
                                        Henüz satış kaydı yok
                                        {goruntulenenSubeAdi && (
                                            <div className="text-xs text-zinc-600 mt-1">
                                                ({goruntulenenSubeAdi} için gösteriliyor — üstteki şube seçiciden değiştirebilirsiniz)
                                            </div>
                                        )}
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
                        {/* Satışın hangi şube adına kaydedileceği — sabit ve değiştirilemez.
                            Bir kullanıcı sadece kendi şubesi adına satış girebilir. */}
                        <div className="bg-zinc-800/60 border border-zinc-700 rounded-lg px-3 py-2 flex items-center justify-between">
                            <span className="text-zinc-400 text-xs">Satış şubesi</span>
                            <span className="text-sm font-semibold text-white">🏪 {kendiSubeAdi || '—'}</span>
                        </div>

                        {/* ─── Reçete Seçimi: arama + kategori sekmeleri + kart grid ─── */}
                        <div>
                            <label className="text-zinc-400 text-sm mb-1.5 block">Reçete *</label>

                            {seciliRecete ? (
                                // Seçim yapıldıysa özet göster, "Değiştir" ile tekrar aramaya dön
                                <div className="flex items-center justify-between bg-zinc-800 rounded-lg px-3 py-2.5">
                                    <div className="flex items-center gap-2 min-w-0">
                                        {seciliRecete.kategori && (
                                            <span className="w-2 h-2 rounded-full shrink-0" style={{ background: seciliRecete.kategori.renk || '#71717a' }} />
                                        )}
                                        <span className="text-white text-sm font-medium truncate">{seciliRecete.ad}</span>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => setForm(f => ({ ...f, receteId: '' }))}
                                        className="text-xs text-zinc-500 hover:text-lime-400 transition-colors ml-3 shrink-0"
                                    >
                                        Değiştir
                                    </button>
                                </div>
                            ) : (
                                <div className="space-y-2">
                                    <input
                                        value={receteArama}
                                        onChange={(e) => setReceteArama(e.target.value)}
                                        placeholder="Reçete ara..."
                                        autoFocus
                                        className={inputCls}
                                    />

                                    {kategoriler.length > 0 && (
                                        <div className="flex gap-1.5 flex-wrap">
                                            <button
                                                type="button"
                                                onClick={() => setReceteKategoriFiltre('')}
                                                className={`text-xs font-semibold px-3 py-1 rounded-full transition-colors ${!receteKategoriFiltre
                                                    ? 'bg-lime-400 text-black'
                                                    : 'bg-zinc-800 text-zinc-400 hover:text-white'
                                                    }`}
                                            >
                                                Tümü
                                            </button>
                                            {kategoriler.map((k) => (
                                                <button
                                                    key={k.id}
                                                    type="button"
                                                    onClick={() => setReceteKategoriFiltre(k.id)}
                                                    className={`text-xs font-semibold px-3 py-1 rounded-full transition-colors flex items-center gap-1.5 ${String(receteKategoriFiltre) === String(k.id)
                                                        ? 'bg-lime-400 text-black'
                                                        : 'bg-zinc-800 text-zinc-400 hover:text-white'
                                                        }`}
                                                >
                                                    <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: k.renk || '#71717a' }} />
                                                    {k.ad}
                                                </button>
                                            ))}
                                        </div>
                                    )}

                                    <div className="max-h-52 overflow-y-auto grid grid-cols-2 gap-2 pr-0.5">
                                        {filtrelenmisReceteler.length === 0 ? (
                                            <div className="col-span-2 text-center py-6 text-zinc-500 text-xs">
                                                Sonuç bulunamadı
                                            </div>
                                        ) : filtrelenmisReceteler.map((r) => (
                                            <button
                                                key={r.id}
                                                type="button"
                                                onClick={() => receteSec(r)}
                                                className="text-left bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 hover:border-lime-400 rounded-lg px-3 py-2 transition-colors"
                                            >
                                                <div className="text-sm text-white font-medium truncate">{r.ad}</div>
                                                {r.satisFiyati > 0 && (
                                                    <div className="text-xs text-lime-400 mt-0.5">₺{fmt(r.satisFiyati)}</div>
                                                )}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}
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
                    <div className="bg-zinc-900 rounded-xl p-5 w-full max-w-sm border border-zinc-700 space-y-3.5">
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