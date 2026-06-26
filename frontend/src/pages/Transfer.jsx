import { useState, useEffect } from 'react';
import api from '../services/api';
import toast from 'react-hot-toast';

// ─── Yardımcı ────────────────────────────────────────────────────────────────
const miktarFormat = (n) =>
    Number(n).toLocaleString('tr-TR', { maximumFractionDigits: 3 });

const tarihFormat = (iso) =>
    new Date(iso).toLocaleString('tr-TR', {
        day: '2-digit', month: '2-digit', year: 'numeric',
        hour: '2-digit', minute: '2-digit',
    });

// ─── Ana bileşen ─────────────────────────────────────────────────────────────
export default function Transfer() {
    const [subeler, setSubeler] = useState([]);
    const [stoklar, setStoklar] = useState([]);
    const [gecmis, setGecmis] = useState([]);

    const [form, setForm] = useState({
        kaynakSubeId: '',
        hedefSubeId: '',
        stokKartId: '',
        miktar: '',
        aciklama: '',
    });

    const [stokYukleniyor, setStokYukleniyor] = useState(false);
    const [gonderiyor, setGonderiyor] = useState(false);
    const [gecmisYukleniyor, setGecmisYukleniyor] = useState(true);

    // Seçilen stok kartı
    const secilenStok = stoklar.find(s => s.id === parseInt(form.stokKartId));

    // ── Şubeleri yükle ───────────────────────────────────────────────────────
    useEffect(() => {
        api.get('/api/subeler')
            .then(r => setSubeler(r.data.filter(s => s.aktif)))
            .catch(() => toast.error('Şubeler yüklenemedi'));
    }, []);

    // ── Geçmişi yükle ────────────────────────────────────────────────────────
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

    // ── Kaynak şube değişince stokları getir ─────────────────────────────────
    useEffect(() => {
        if (!form.kaynakSubeId) {
            setStoklar([]);
            setForm(f => ({ ...f, stokKartId: '', miktar: '' }));
            return;
        }
        setStokYukleniyor(true);
        setForm(f => ({ ...f, stokKartId: '', miktar: '' }));
        api.get(`/api/transfer/stoklar?subeId=${form.kaynakSubeId}`)
            .then(r => setStoklar(r.data))
            .catch(() => toast.error('Stoklar yüklenemedi'))
            .finally(() => setStokYukleniyor(false));
    }, [form.kaynakSubeId]);

    // ── Transfer gönder ──────────────────────────────────────────────────────
    const gonder = async () => {
        const { kaynakSubeId, hedefSubeId, stokKartId, miktar } = form;

        if (!kaynakSubeId) { toast.error('Kaynak şube seçin'); return; }
        if (!hedefSubeId) { toast.error('Hedef şube seçin'); return; }
        if (kaynakSubeId === hedefSubeId) { toast.error('Kaynak ve hedef şube aynı olamaz'); return; }
        if (!stokKartId) { toast.error('Ürün seçin'); return; }
        if (!miktar || parseFloat(miktar) <= 0) { toast.error('Geçerli bir miktar girin'); return; }
        if (secilenStok && parseFloat(miktar) > secilenStok.mevcutBakiye) {
            toast.error(`Yetersiz stok. Mevcut: ${miktarFormat(secilenStok.mevcutBakiye)} ${secilenStok.birim.kisaltma}`);
            return;
        }

        setGonderiyor(true);
        try {
            await api.post('/api/transfer', {
                kaynakSubeId: parseInt(kaynakSubeId),
                hedefSubeId: parseInt(hedefSubeId),
                stokKartId: parseInt(stokKartId),
                miktar: parseFloat(miktar),
                aciklama: form.aciklama,
            });
            toast.success('Transfer tamamlandı');
            setForm(f => ({ ...f, stokKartId: '', miktar: '', aciklama: '' }));
            // Kaynak şubenin stoklarını güncelle
            const r = await api.get(`/api/transfer/stoklar?subeId=${kaynakSubeId}`);
            setStoklar(r.data);
            gecmisYukle();
        } catch (e) {
            toast.error(e.response?.data?.hata || 'Transfer başarısız');
        } finally {
            setGonderiyor(false);
        }
    };

    const hedefSubeler = subeler.filter(s => s.id !== parseInt(form.kaynakSubeId));

    // ─── Render ──────────────────────────────────────────────────────────────
    return (
        <div className="p-6 space-y-6">
            {/* Başlık */}
            <div>
                <h1 className="text-2xl font-bold text-white">Şubeler Arası Stok Transferi</h1>
                <p className="text-zinc-500 text-sm mt-1">
                    Kaynak şubedeki stoğu hedef şubeye aktar
                </p>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                {/* ── Sol: Transfer formu ──────────────────────────────────── */}
                <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 space-y-5">
                    <h2 className="text-white font-semibold text-base">Yeni Transfer</h2>

                    {/* Kaynak & Hedef şube */}
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="text-zinc-400 text-xs block mb-1">Kaynak Şube *</label>
                            <select
                                value={form.kaynakSubeId}
                                onChange={e => setForm(f => ({ ...f, kaynakSubeId: e.target.value, hedefSubeId: '' }))}
                                className="w-full bg-zinc-800 text-white px-3 py-2 rounded-lg text-sm border border-zinc-700 focus:outline-none focus:border-lime-400"
                            >
                                <option value="">Seçin...</option>
                                {subeler.map(s => (
                                    <option key={s.id} value={s.id}>{s.ad}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="text-zinc-400 text-xs block mb-1">Hedef Şube *</label>
                            <select
                                value={form.hedefSubeId}
                                onChange={e => setForm(f => ({ ...f, hedefSubeId: e.target.value }))}
                                disabled={!form.kaynakSubeId}
                                className="w-full bg-zinc-800 text-white px-3 py-2 rounded-lg text-sm border border-zinc-700 focus:outline-none focus:border-lime-400 disabled:opacity-40"
                            >
                                <option value="">Seçin...</option>
                                {hedefSubeler.map(s => (
                                    <option key={s.id} value={s.id}>{s.ad}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* Ok işareti */}
                    {form.kaynakSubeId && form.hedefSubeId && (
                        <div className="flex items-center justify-center gap-3 text-sm">
                            <span className="text-white font-medium">
                                {subeler.find(s => s.id === parseInt(form.kaynakSubeId))?.ad}
                            </span>
                            <span className="text-lime-400 text-lg">→</span>
                            <span className="text-white font-medium">
                                {subeler.find(s => s.id === parseInt(form.hedefSubeId))?.ad}
                            </span>
                        </div>
                    )}

                    {/* Ürün seçimi */}
                    <div>
                        <label className="text-zinc-400 text-xs block mb-1">Ürün *</label>
                        {stokYukleniyor ? (
                            <div className="text-zinc-500 text-sm py-2">Stoklar yükleniyor...</div>
                        ) : !form.kaynakSubeId ? (
                            <div className="text-zinc-600 text-sm py-2">Önce kaynak şube seçin</div>
                        ) : stoklar.length === 0 ? (
                            <div className="text-zinc-500 text-sm py-2">Bu şubede transfer edilebilir stok yok</div>
                        ) : (
                            <select
                                value={form.stokKartId}
                                onChange={e => setForm(f => ({ ...f, stokKartId: e.target.value, miktar: '' }))}
                                className="w-full bg-zinc-800 text-white px-3 py-2 rounded-lg text-sm border border-zinc-700 focus:outline-none focus:border-lime-400"
                            >
                                <option value="">Ürün seçin...</option>
                                {stoklar.map(s => (
                                    <option key={s.id} value={s.id}>
                                        {s.ad} — {miktarFormat(s.mevcutBakiye)} {s.birim.kisaltma}
                                    </option>
                                ))}
                            </select>
                        )}
                    </div>

                    {/* Mevcut bakiye göstergesi */}
                    {secilenStok && (
                        <div className="bg-zinc-800 rounded-lg px-4 py-3 flex items-center justify-between">
                            <div>
                                <p className="text-zinc-400 text-xs">Kaynak şubede mevcut</p>
                                <p className="text-white font-semibold text-lg">
                                    {miktarFormat(secilenStok.mevcutBakiye)}
                                    <span className="text-zinc-400 text-sm font-normal ml-1">
                                        {secilenStok.birim.kisaltma}
                                    </span>
                                </p>
                            </div>
                            <div className="text-right">
                                <p className="text-zinc-400 text-xs">Kategori</p>
                                <p className="text-zinc-300 text-sm">{secilenStok.kategori.ad}</p>
                            </div>
                        </div>
                    )}

                    {/* Miktar */}
                    <div>
                        <label className="text-zinc-400 text-xs block mb-1">Miktar *</label>
                        <div className="relative">
                            <input
                                type="number"
                                min="0"
                                step="0.001"
                                value={form.miktar}
                                onChange={e => setForm(f => ({ ...f, miktar: e.target.value }))}
                                disabled={!form.stokKartId}
                                className="w-full bg-zinc-800 text-white px-3 py-2 rounded-lg text-sm border border-zinc-700 focus:outline-none focus:border-lime-400 disabled:opacity-40 pr-16"
                                placeholder="0"
                            />
                            {secilenStok && (
                                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 text-xs">
                                    {secilenStok.birim.kisaltma}
                                </span>
                            )}
                        </div>

                        {/* Miktar yüzde kısayolları */}
                        {secilenStok && (
                            <div className="flex gap-2 mt-2">
                                {[25, 50, 75, 100].map(pct => (
                                    <button
                                        key={pct}
                                        onClick={() => setForm(f => ({
                                            ...f,
                                            miktar: String(
                                                Math.round(secilenStok.mevcutBakiye * pct / 100 * 1000) / 1000
                                            ),
                                        }))}
                                        className="flex-1 text-xs bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white py-1 rounded"
                                    >
                                        %{pct}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Açıklama */}
                    <div>
                        <label className="text-zinc-400 text-xs block mb-1">Açıklama</label>
                        <input
                            value={form.aciklama}
                            onChange={e => setForm(f => ({ ...f, aciklama: e.target.value }))}
                            className="w-full bg-zinc-800 text-white px-3 py-2 rounded-lg text-sm border border-zinc-700 focus:outline-none focus:border-lime-400"
                            placeholder="İsteğe bağlı not..."
                        />
                    </div>

                    {/* Gönder */}
                    <button
                        onClick={gonder}
                        disabled={gonderiyor || !form.kaynakSubeId || !form.hedefSubeId || !form.stokKartId || !form.miktar}
                        className="w-full bg-lime-400 text-zinc-900 py-2.5 rounded-lg text-sm font-semibold hover:bg-lime-300 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                    >
                        {gonderiyor ? 'Transfer yapılıyor...' : 'Transferi Gerçekleştir'}
                    </button>
                </div>

                {/* ── Sağ: Transfer geçmişi ────────────────────────────────── */}
                <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 space-y-4">
                    <h2 className="text-white font-semibold text-base">Son Transferler</h2>

                    {gecmisYukleniyor ? (
                        <div className="text-zinc-500 text-sm text-center py-8">Yükleniyor...</div>
                    ) : gecmis.length === 0 ? (
                        <div className="text-zinc-600 text-sm text-center py-8">
                            Henüz transfer yapılmamış
                        </div>
                    ) : (
                        <div className="space-y-2 max-h-400 overflow-y-auto pr-1">
                            {gecmis.map(h => (
                                <div
                                    key={h.id}
                                    className="bg-zinc-800 rounded-lg px-4 py-3 flex items-start justify-between gap-3"
                                >
                                    <div className="flex items-start gap-3 min-w-0">
                                        {/* IN / OUT badge */}
                                        <span className={`shrink-0 text-xs px-2 py-0.5 rounded-full font-medium mt-0.5 ${h.tip === 'SUBE_TRANSFER_IN'
                                            ? 'bg-emerald-900/50 text-emerald-400'
                                            : 'bg-red-900/50 text-red-400'
                                            }`}>
                                            {h.tip === 'SUBE_TRANSFER_IN' ? 'GİRİŞ' : 'ÇIKIŞ'}
                                        </span>
                                        <div className="min-w-0">
                                            <p className="text-white text-sm font-medium truncate">
                                                {h.stokKart.ad}
                                            </p>
                                            <p className="text-zinc-400 text-xs truncate">
                                                {h.sube.ad}
                                            </p>
                                            {h.aciklama && (
                                                <p className="text-zinc-500 text-xs truncate mt-0.5">
                                                    {h.aciklama}
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                    <div className="text-right shrink-0">
                                        <p className={`text-sm font-semibold ${h.tip === 'SUBE_TRANSFER_IN' ? 'text-emerald-400' : 'text-red-400'
                                            }`}>
                                            {h.tip === 'SUBE_TRANSFER_IN' ? '+' : '-'}
                                            {miktarFormat(h.miktar)}
                                        </p>
                                        <p className="text-zinc-500 text-xs mt-0.5">
                                            {tarihFormat(h.tarih)}
                                        </p>
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