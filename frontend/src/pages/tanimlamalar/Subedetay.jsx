import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../services/api';
import toast from 'react-hot-toast';

const para = (n) => Number(n || 0).toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const miktar = (n) => Number(n || 0).toLocaleString('tr-TR', { maximumFractionDigits: 3 });
const tarih = (iso) => new Date(iso).toLocaleString('tr-TR', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
});
const tarihKisa = (iso) => new Date(iso).toLocaleDateString('tr-TR', {
    day: '2-digit', month: '2-digit', year: 'numeric',
});

// ── Özet kart bileşeni ────────────────────────────────────────────────────────
function OzetKart({ baslik, deger, alt, renk = 'text-white', icon }) {
    return (
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 space-y-1">
            <div className="flex items-center gap-2 text-zinc-500 text-xs">{icon} {baslik}</div>
            <div className={`text-xl font-bold ${renk}`}>{deger}</div>
            {alt && <div className="text-zinc-500 text-xs">{alt}</div>}
        </div>
    );
}

// ── Sekme başlıkları ──────────────────────────────────────────────────────────
const SEKMELER = [
    { id: 'stok', label: 'Stok Durumu' },
    { id: 'satislar', label: 'Son Satışlar' },
    { id: 'personel', label: 'Personel' },
    { id: 'transferler', label: 'Transferler' },
];

export default function SubeDetay() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [veri, setVeri] = useState(null);
    const [yukleniyor, setYukleniyor] = useState(true);
    const [aktifSekme, setAktifSekme] = useState('stok');
    const [stokArama, setStokArama] = useState('');

    useEffect(() => {
        const getir = async () => {
            try {
                const res = await api.get(`/api/subeler/${id}/detay`);
                setVeri(res.data);
            } catch {
                toast.error('Şube detayı yüklenemedi');
                navigate('/tanimlamalar/subeler');
            } finally {
                setYukleniyor(false);
            }
        };
        getir();
    }, [id]);

    if (yukleniyor) {
        return (
            <div className="p-6 text-zinc-400 text-center py-20">Yükleniyor...</div>
        );
    }

    if (!veri) return null;

    const { sube, ozet, sonSatislar, stokDurumu, personeller, sonTransferler } = veri;

    const filtreliStok = stokDurumu.filter(s =>
        s.ad.toLowerCase().includes(stokArama.toLowerCase()) ||
        s.kod.toLowerCase().includes(stokArama.toLowerCase())
    );

    return (
        <div className="p-6 space-y-6">

            {/* ── Başlık ── */}
            <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => navigate('/tanimlamalar/subeler')}
                        className="text-zinc-400 hover:text-white bg-zinc-800 hover:bg-zinc-700 px-3 py-1.5 rounded-lg text-sm transition-colors"
                    >
                        ← Şubeler
                    </button>
                    <div>
                        <div className="flex items-center gap-2">
                            <h1 className="text-2xl font-bold text-white">{sube.ad}</h1>
                            <span className={`text-xs px-2 py-0.5 rounded-full ${sube.aktif
                                ? 'bg-green-900/50 text-green-400'
                                : 'bg-red-900/50 text-red-400'}`}>
                                {sube.aktif ? 'Aktif' : 'Pasif'}
                            </span>
                        </div>
                        <div className="flex gap-4 mt-1 text-zinc-500 text-xs">
                            {sube.telefon && <span>📞 {sube.telefon}</span>}
                            {sube.adres && <span>📍 {sube.adres}</span>}
                        </div>
                    </div>
                </div>
            </div>

            {/* ── Özet kartlar ── */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <OzetKart
                    icon="💰"
                    baslik="Bugün Satış"
                    deger={`₺${para(ozet.bugunSatisToplam)}`}
                    alt={`${ozet.bugunSatisAdet} işlem`}
                    renk={ozet.bugunSatisToplam > 0 ? 'text-emerald-400' : 'text-zinc-500'}
                />
                <OzetKart
                    icon="📅"
                    baslik="Bu Ay Satış"
                    deger={`₺${para(ozet.buAySatisToplam)}`}
                    alt={`${ozet.buAySatisAdet} işlem`}
                    renk="text-white"
                />
                <OzetKart
                    icon="📦"
                    baslik="Stok Kalemleri"
                    deger={ozet.toplamStokKalem}
                    alt={ozet.kritikStokSayisi > 0
                        ? `⚠ ${ozet.kritikStokSayisi} kritik`
                        : '✓ Hepsi normal'}
                    renk={ozet.kritikStokSayisi > 0 ? 'text-red-400' : 'text-white'}
                />
                <OzetKart
                    icon="👥"
                    baslik="Personel"
                    deger={ozet.personelSayisi}
                    alt={`${sube._count.kullanicilar} kullanıcı`}
                    renk="text-white"
                />
            </div>

            {/* ── Sekmeler ── */}
            <div className="border-b border-zinc-800">
                <div className="flex gap-1">
                    {SEKMELER.map(s => (
                        <button
                            key={s.id}
                            onClick={() => setAktifSekme(s.id)}
                            className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${aktifSekme === s.id
                                ? 'border-lime-400 text-lime-400'
                                : 'border-transparent text-zinc-400 hover:text-white'}`}
                        >
                            {s.label}
                            {s.id === 'stok' && ozet.kritikStokSayisi > 0 && (
                                <span className="ml-1.5 bg-red-500 text-white text-xs px-1.5 py-0.5 rounded-full">
                                    {ozet.kritikStokSayisi}
                                </span>
                            )}
                        </button>
                    ))}
                </div>
            </div>

            {/* ── Sekme içerikleri ── */}

            {/* STOK DURUMU */}
            {aktifSekme === 'stok' && (
                <div className="space-y-3">
                    <input
                        value={stokArama}
                        onChange={e => setStokArama(e.target.value)}
                        placeholder="Stok adı veya kodu ile ara..."
                        className="w-full bg-zinc-900 border border-zinc-800 text-white rounded-lg px-4 py-2.5 text-sm outline-none focus:border-lime-400"
                    />
                    <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b border-zinc-800">
                                    <th className="text-left text-xs text-zinc-500 font-semibold uppercase tracking-wider py-3 px-4">Stok Adı</th>
                                    <th className="text-left text-xs text-zinc-500 font-semibold uppercase tracking-wider py-3 px-4 hidden sm:table-cell">Kategori</th>
                                    <th className="text-right text-xs text-zinc-500 font-semibold uppercase tracking-wider py-3 px-4">Mevcut</th>
                                    <th className="text-right text-xs text-zinc-500 font-semibold uppercase tracking-wider py-3 px-4 hidden sm:table-cell">Min.</th>
                                    <th className="text-center text-xs text-zinc-500 font-semibold uppercase tracking-wider py-3 px-4">Durum</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filtreliStok.length === 0 ? (
                                    <tr>
                                        <td colSpan={5} className="text-center py-12 text-zinc-500 text-sm">
                                            Bu şubede stok kaydı bulunamadı
                                        </td>
                                    </tr>
                                ) : filtreliStok.map(s => (
                                    <tr key={s.id} className="border-b border-zinc-800/50 hover:bg-zinc-800/30 transition-colors">
                                        <td className="py-3 px-4">
                                            <div className="text-white text-sm font-medium">{s.ad}</div>
                                            <div className="text-zinc-500 text-xs font-mono">{s.kod}</div>
                                        </td>
                                        <td className="py-3 px-4 hidden sm:table-cell">
                                            <div className="flex items-center gap-2">
                                                <div className="w-2 h-2 rounded-full" style={{ background: s.kategori?.renk }} />
                                                <span className="text-zinc-300 text-sm">{s.kategori?.ad}</span>
                                            </div>
                                        </td>
                                        <td className="py-3 px-4 text-right text-sm font-mono font-semibold text-white">
                                            {miktar(s.mevcutStok)} <span className="text-zinc-500 font-normal">{s.birim?.kisaltma}</span>
                                        </td>
                                        <td className="py-3 px-4 text-right text-sm font-mono text-zinc-400 hidden sm:table-cell">
                                            {miktar(s.minStok)} <span className="text-zinc-600">{s.birim?.kisaltma}</span>
                                        </td>
                                        <td className="py-3 px-4 text-center">
                                            {s.kritik ? (
                                                <span className="text-xs px-2 py-0.5 rounded-full bg-red-400/10 text-red-400">⚠ Kritik</span>
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
            )}

            {/* SON SATIŞLAR */}
            {aktifSekme === 'satislar' && (
                <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
                    <table className="w-full">
                        <thead>
                            <tr className="border-b border-zinc-800">
                                <th className="text-left text-xs text-zinc-500 font-semibold uppercase tracking-wider py-3 px-4">Ürün</th>
                                <th className="text-right text-xs text-zinc-500 font-semibold uppercase tracking-wider py-3 px-4">Adet</th>
                                <th className="text-right text-xs text-zinc-500 font-semibold uppercase tracking-wider py-3 px-4">Tutar</th>
                                <th className="text-right text-xs text-zinc-500 font-semibold uppercase tracking-wider py-3 px-4 hidden sm:table-cell">Tarih</th>
                            </tr>
                        </thead>
                        <tbody>
                            {sonSatislar.length === 0 ? (
                                <tr>
                                    <td colSpan={4} className="text-center py-12 text-zinc-500 text-sm">
                                        Henüz satış kaydı yok
                                    </td>
                                </tr>
                            ) : sonSatislar.map(s => (
                                <tr key={s.id} className="border-b border-zinc-800/50 hover:bg-zinc-800/30 transition-colors">
                                    <td className="py-3 px-4 text-white text-sm">{s.recete?.ad || '—'}</td>
                                    <td className="py-3 px-4 text-right text-zinc-300 text-sm font-mono">{miktar(s.adet)}</td>
                                    <td className="py-3 px-4 text-right text-emerald-400 text-sm font-semibold font-mono">
                                        ₺{para(s.toplam)}
                                    </td>
                                    <td className="py-3 px-4 text-right text-zinc-500 text-xs hidden sm:table-cell">
                                        {tarih(s.tarih)}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {/* PERSONEL */}
            {aktifSekme === 'personel' && (
                <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
                    <table className="w-full">
                        <thead>
                            <tr className="border-b border-zinc-800">
                                <th className="text-left text-xs text-zinc-500 font-semibold uppercase tracking-wider py-3 px-4">Ad Soyad</th>
                                <th className="text-left text-xs text-zinc-500 font-semibold uppercase tracking-wider py-3 px-4 hidden sm:table-cell">Telefon</th>
                                <th className="text-left text-xs text-zinc-500 font-semibold uppercase tracking-wider py-3 px-4 hidden sm:table-cell">Başlangıç</th>
                                <th className="text-right text-xs text-zinc-500 font-semibold uppercase tracking-wider py-3 px-4">Maaş</th>
                            </tr>
                        </thead>
                        <tbody>
                            {personeller.length === 0 ? (
                                <tr>
                                    <td colSpan={4} className="text-center py-12 text-zinc-500 text-sm">
                                        Bu şubede aktif personel yok
                                    </td>
                                </tr>
                            ) : personeller.map(p => (
                                <tr key={p.id} className="border-b border-zinc-800/50 hover:bg-zinc-800/30 transition-colors">
                                    <td className="py-3 px-4 text-white text-sm font-medium">
                                        {p.ad} {p.soyad}
                                    </td>
                                    <td className="py-3 px-4 text-zinc-400 text-sm hidden sm:table-cell">
                                        {p.telefon || '—'}
                                    </td>
                                    <td className="py-3 px-4 text-zinc-400 text-sm hidden sm:table-cell">
                                        {tarihKisa(p.baslangicTarihi)}
                                    </td>
                                    <td className="py-3 px-4 text-right text-white text-sm font-mono font-semibold">
                                        ₺{para(p.maas)}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {/* TRANSFERLER */}
            {aktifSekme === 'transferler' && (
                <div className="space-y-2">
                    {sonTransferler.length === 0 ? (
                        <div className="text-center py-12 text-zinc-500 text-sm bg-zinc-900 border border-zinc-800 rounded-xl">
                            Bu şube için transfer kaydı yok
                        </div>
                    ) : sonTransferler.map(h => (
                        <div key={h.id} className="bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 flex items-center justify-between gap-3">
                            <div className="flex items-center gap-3">
                                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${h.tip === 'SUBE_TRANSFER_IN'
                                    ? 'bg-emerald-900/50 text-emerald-400'
                                    : 'bg-red-900/50 text-red-400'}`}>
                                    {h.tip === 'SUBE_TRANSFER_IN' ? 'GİRİŞ' : 'ÇIKIŞ'}
                                </span>
                                <div>
                                    <p className="text-white text-sm font-medium">{h.stokKart.ad}</p>
                                    {h.aciklama && <p className="text-zinc-500 text-xs">{h.aciklama}</p>}
                                </div>
                            </div>
                            <div className="text-right shrink-0">
                                <p className={`text-sm font-semibold font-mono ${h.tip === 'SUBE_TRANSFER_IN' ? 'text-emerald-400' : 'text-red-400'}`}>
                                    {h.tip === 'SUBE_TRANSFER_IN' ? '+' : '-'}{miktar(h.miktar)}
                                </p>
                                <p className="text-zinc-500 text-xs">{tarih(h.tarih)}</p>
                            </div>
                        </div>
                    ))}
                </div>
            )}

        </div>
    );
}