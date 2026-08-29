import { useState, useEffect } from 'react';
import api from '../services/api';
import toast from 'react-hot-toast';
import { usePaketDurumu, SaltOkunurUyari } from '../components/PlanKilidi';

const miktarFormat = (n) =>
    Number(n).toLocaleString('tr-TR', { maximumFractionDigits: 3 });

const tarihFormat = (iso) =>
    new Date(iso).toLocaleString('tr-TR', {
        day: '2-digit', month: '2-digit', year: 'numeric',
        hour: '2-digit', minute: '2-digit',
    });

const bosKalem = () => ({ stokKartId: '', miktar: '' });

export default function Transfer() {
    // Paket/deneme bilgisi App.jsx'teki <PrivateRoute planOzellik="transfer">
    // tarafından sağlanan <PaketProvider> context'inden geliyor. Eski hâlde
    // bu sayfa kendi '/api/auth/beni-getir' çağrısını yapıp paket yetersizse
    // sayfayı TAMAMEN bir "yetkisiz" ekranıyla değiştiriyordu — artık öyle
    // değil: sayfa her zaman açılıyor, sadece transfer gönderme (yazma)
    // gizleniyor, geçmiş her zaman görünür.
    const { tamErisim } = usePaketDurumu();

    const [subeler, setSubeler] = useState([]);
    const [stoklar, setStoklar] = useState([]);
    const [gecmis, setGecmis] = useState([]);
    const [gecmisYukleniyor, setGecmisYukleniyor] = useState(true);
    const [gonderiyor, setGonderiyor] = useState(false);

    const [kaynakSubeId, setKaynakSubeId] = useState('');
    const [hedefSubeId, setHedefSubeId] = useState('');
    const [aciklama, setAciklama] = useState('');
    const [kalemler, setKalemler] = useState([bosKalem()]);

    // ── Şubeleri Yükle ────────────────────────────────────────
    useEffect(() => {
        api.get('/api/subeler')
            .then(r => setSubeler(r.data.filter(s => s.aktif)))
            .catch(() => toast.error('Şubeler yüklenemedi'));
    }, []);

    // ── Geçmişi Yükle ────────────────────────────────────────
    const gecmisYukle = async () => {
        setGecmisYukleniyor(true);
        try {
            const r = await api.get('/api/transfer/gecmis');
            setGecmis(r.data);
        } catch {
            toast.error('Geçmiş yüklenemedi');
        } finally {
            setGecmisYukleniyor(false);
        }
    };

    useEffect(() => { gecmisYukle(); }, []);

    // ── Kaynak Şube Değişince Stokları Getir ─────────────────
    useEffect(() => {
        if (!kaynakSubeId) {
            setStoklar([]);
            setKalemler([bosKalem()]);
            return;
        }
        api.get(`/api/transfer/stoklar?subeId=${kaynakSubeId}`)
            .then(r => setStoklar(r.data))
            .catch(() => toast.error('Stoklar yüklenemedi'));
        setKalemler([bosKalem()]);
    }, [kaynakSubeId]);

    // ── Kalem İşlemleri ───────────────────────────────────────
    const kalemEkle = () => setKalemler(k => [...k, bosKalem()]);

    const kalemSil = (i) => setKalemler(k => k.filter((_, idx) => idx !== i));

    const kalemGuncelle = (i, alan, deger) =>
        setKalemler(k => k.map((kalem, idx) => idx === i ? { ...kalem, [alan]: deger } : kalem));

    // Seçilen stok kartının bakiyesini bul
    const stokBakiye = (stokKartId) =>
        stoklar.find(s => s.id === parseInt(stokKartId));

    // ── Transfer Gönder ───────────────────────────────────────
    const gonder = async () => {
        if (!kaynakSubeId) { toast.error('Kaynak şube seçin'); return; }
        if (!hedefSubeId) { toast.error('Hedef şube seçin'); return; }
        if (kaynakSubeId === hedefSubeId) { toast.error('Kaynak ve hedef şube aynı olamaz'); return; }

        for (const [i, k] of kalemler.entries()) {
            if (!k.stokKartId) { toast.error(`${i + 1}. kalemde ürün seçin`); return; }
            if (!k.miktar || parseFloat(k.miktar) <= 0) { toast.error(`${i + 1}. kalemde miktar girin`); return; }
            const stok = stokBakiye(k.stokKartId);
            if (stok && parseFloat(k.miktar) > stok.mevcutBakiye) {
                toast.error(`${stok.ad}: Yetersiz stok (Mevcut: ${miktarFormat(stok.mevcutBakiye)} ${stok.birim.kisaltma})`);
                return;
            }
        }

        setGonderiyor(true);
        try {
            // Her kalem için ayrı transfer yap
            for (const k of kalemler) {
                await api.post('/api/transfer', {
                    kaynakSubeId: parseInt(kaynakSubeId),
                    hedefSubeId: parseInt(hedefSubeId),
                    stokKartId: parseInt(k.stokKartId),
                    miktar: parseFloat(k.miktar),
                    aciklama: aciklama || undefined,
                });
            }

            toast.success(`${kalemler.length} ürün transferi tamamlandı`);
            setKalemler([bosKalem()]);
            setAciklama('');

            // Stokları güncelle
            const r = await api.get(`/api/transfer/stoklar?subeId=${kaynakSubeId}`);
            setStoklar(r.data);
            gecmisYukle();
        } catch (e) {
            toast.error(e.response?.data?.hata || 'Transfer başarısız');
        } finally {
            setGonderiyor(false);
        }
    };

    const hedefSubeler = subeler.filter(s => s.id !== parseInt(kaynakSubeId));

    return (
        <div className="p-6 space-y-5">
            <div>
                <h1 className="text-2xl font-bold text-white">Şubeler Arası Stok Transferi</h1>
                <p className="text-zinc-500 text-sm mt-1">Birden fazla ürünü tek seferde transfer edin</p>
            </div>

            <SaltOkunurUyari />

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
                {/* ── Sol: Transfer Formu — yazma işlemi, salt okunurda gizli ── */}
                {tamErisim ? (
                    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 space-y-4">
                        <h2 className="text-white font-semibold text-base">Yeni Transfer</h2>

                        {/* Kaynak & Hedef Şube */}
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="text-zinc-400 text-xs block mb-1">Kaynak Şube *</label>
                                <select
                                    value={kaynakSubeId}
                                    onChange={e => { setKaynakSubeId(e.target.value); setHedefSubeId(''); }}
                                    className="w-full bg-zinc-800 text-white px-3 py-2 rounded-lg text-sm border border-zinc-700 focus:outline-none focus:border-lime-400"
                                >
                                    <option value="">Seçin...</option>
                                    {subeler.map(s => <option key={s.id} value={s.id}>{s.ad}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="text-zinc-400 text-xs block mb-1">Hedef Şube *</label>
                                <select
                                    value={hedefSubeId}
                                    onChange={e => setHedefSubeId(e.target.value)}
                                    disabled={!kaynakSubeId}
                                    className="w-full bg-zinc-800 text-white px-3 py-2 rounded-lg text-sm border border-zinc-700 focus:outline-none focus:border-lime-400 disabled:opacity-40"
                                >
                                    <option value="">Seçin...</option>
                                    {hedefSubeler.map(s => <option key={s.id} value={s.id}>{s.ad}</option>)}
                                </select>
                            </div>
                        </div>

                        {/* Ok İşareti */}
                        {kaynakSubeId && hedefSubeId && (
                            <div className="flex items-center justify-center gap-3 text-sm">
                                <span className="text-white font-medium">
                                    {subeler.find(s => s.id === parseInt(kaynakSubeId))?.ad}
                                </span>
                                <span className="text-lime-400 text-lg">→</span>
                                <span className="text-white font-medium">
                                    {subeler.find(s => s.id === parseInt(hedefSubeId))?.ad}
                                </span>
                            </div>
                        )}

                        {/* Kalemler */}
                        <div>
                            <div className="flex items-center justify-between mb-2">
                                <label className="text-zinc-400 text-xs">Ürünler *</label>
                                {kaynakSubeId && stoklar.length > 0 && (
                                    <button
                                        onClick={kalemEkle}
                                        className="text-lime-400 hover:text-lime-300 text-xs font-semibold"
                                    >
                                        + Ürün Ekle
                                    </button>
                                )}
                            </div>

                            {!kaynakSubeId ? (
                                <p className="text-zinc-600 text-sm py-2">Önce kaynak şube seçin</p>
                            ) : stoklar.length === 0 ? (
                                <p className="text-zinc-500 text-sm py-2">Bu şubede transfer edilebilir stok yok</p>
                            ) : (
                                <div className="space-y-2.5">
                                    {kalemler.map((kalem, i) => {
                                        const secilen = stokBakiye(kalem.stokKartId);
                                        return (
                                            <div key={i} className="bg-zinc-800 rounded-lg p-3 space-y-2">
                                                <div className="flex items-center justify-between">
                                                    <span className="text-zinc-500 text-xs">Ürün {i + 1}</span>
                                                    {kalemler.length > 1 && (
                                                        <button
                                                            onClick={() => kalemSil(i)}
                                                            className="text-red-400 hover:text-red-300 text-xs"
                                                        >
                                                            Sil
                                                        </button>
                                                    )}
                                                </div>

                                                <select
                                                    value={kalem.stokKartId}
                                                    onChange={e => kalemGuncelle(i, 'stokKartId', e.target.value)}
                                                    className="w-full bg-zinc-700 text-white px-3 py-2 rounded text-sm border border-zinc-600 focus:outline-none focus:border-lime-400"
                                                >
                                                    <option value="">Ürün seçin...</option>
                                                    {stoklar.map(s => (
                                                        <option key={s.id} value={s.id}>
                                                            {s.ad} — {miktarFormat(s.mevcutBakiye)} {s.birim.kisaltma}
                                                        </option>
                                                    ))}
                                                </select>

                                                {secilen && (
                                                    <div className="flex gap-2 items-center">
                                                        <div className="relative flex-1">
                                                            <input
                                                                type="number"
                                                                min="0"
                                                                step="0.001"
                                                                value={kalem.miktar}
                                                                onChange={e => kalemGuncelle(i, 'miktar', e.target.value)}
                                                                className="w-full bg-zinc-700 text-white px-3 py-2 rounded text-sm border border-zinc-600 focus:outline-none focus:border-lime-400 pr-12"
                                                                placeholder="0"
                                                            />
                                                            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 text-xs">
                                                                {secilen.birim.kisaltma}
                                                            </span>
                                                        </div>
                                                        {/* Yüzde Kısayolları */}
                                                        <div className="flex gap-1">
                                                            {[25, 50, 100].map(pct => (
                                                                <button
                                                                    key={pct}
                                                                    onClick={() => kalemGuncelle(i, 'miktar', String(
                                                                        Math.round(secilen.mevcutBakiye * pct / 100 * 1000) / 1000
                                                                    ))}
                                                                    className="text-xs bg-zinc-700 hover:bg-zinc-600 text-zinc-400 hover:text-white px-1.5 py-1 rounded"
                                                                >
                                                                    %{pct}
                                                                </button>
                                                            ))}
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>

                        {/* Açıklama */}
                        <div>
                            <label className="text-zinc-400 text-xs block mb-1">Açıklama</label>
                            <input
                                value={aciklama}
                                onChange={e => setAciklama(e.target.value)}
                                className="w-full bg-zinc-800 text-white px-3 py-2 rounded-lg text-sm border border-zinc-700 focus:outline-none focus:border-lime-400"
                                placeholder="İsteğe bağlı not..."
                            />
                        </div>

                        {/* Gönder */}
                        <button
                            onClick={gonder}
                            disabled={gonderiyor || !kaynakSubeId || !hedefSubeId || kalemler.every(k => !k.stokKartId || !k.miktar)}
                            className="w-full bg-lime-400 text-zinc-900 py-2.5 rounded-lg text-sm font-semibold hover:bg-lime-300 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                        >
                            {gonderiyor ? 'Transfer yapılıyor...' : `${kalemler.filter(k => k.stokKartId && k.miktar).length} Ürün Transferini Gerçekleştir`}
                        </button>
                    </div>
                ) : (
                    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 flex items-center justify-center text-zinc-500 text-sm min-h-[200px]">
                        Yeni transfer oluşturmak için planınızı yükseltmeniz gerekiyor. Yukarıdaki uyarıdan devam edebilirsiniz.
                    </div>
                )}

                {/* ── Sağ: Transfer Geçmişi — okuma, her zaman görünür ── */}
                <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 space-y-3.5">
                    <h2 className="text-white font-semibold text-base">Son Transferler</h2>

                    {gecmisYukleniyor ? (
                        <div className="text-zinc-500 text-sm text-center py-8">Yükleniyor...</div>
                    ) : gecmis.length === 0 ? (
                        <div className="text-zinc-600 text-sm text-center py-8">Henüz transfer yapılmamış</div>
                    ) : (
                        <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1">
                            {gecmis.map(h => (
                                <div
                                    key={h.id}
                                    className="bg-zinc-800 rounded-lg px-4 py-3 flex items-start justify-between gap-3"
                                >
                                    {/* GİRİŞ = pozitif (lime), ÇIKIŞ = kritik/uyarı (red) — tek yeşil ton standardı */}
                                    <div className="flex items-start gap-3 min-w-0">
                                        <span className={`shrink-0 text-xs px-2 py-0.5 rounded-full font-medium mt-0.5 ${h.tip === 'SUBE_TRANSFER_IN'
                                            ? 'bg-lime-900/40 text-lime-400'
                                            : 'bg-red-900/50 text-red-400'
                                            }`}>
                                            {h.tip === 'SUBE_TRANSFER_IN' ? 'GİRİŞ' : 'ÇIKIŞ'}
                                        </span>
                                        <div className="min-w-0">
                                            <p className="text-white text-sm font-medium truncate">{h.stokKart.ad}</p>
                                            <p className="text-zinc-400 text-xs truncate">{h.sube.ad}</p>
                                            {h.aciklama && (
                                                <p className="text-zinc-500 text-xs truncate mt-0.5">{h.aciklama}</p>
                                            )}
                                        </div>
                                    </div>
                                    <div className="text-right shrink-0">
                                        <p className={`text-sm font-semibold ${h.tip === 'SUBE_TRANSFER_IN' ? 'text-lime-400' : 'text-red-400'
                                            }`}>
                                            {h.tip === 'SUBE_TRANSFER_IN' ? '+' : '-'}{miktarFormat(h.miktar)}
                                        </p>
                                        <p className="text-zinc-500 text-xs mt-0.5">{tarihFormat(h.tarih)}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}