import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import api from '../../services/api';
import Modal from '../../components/Modal';

export default function CariHesap() {
    const [cariler, setCariler] = useState([]);
    const [seciliCari, setSeciliCari] = useState(null);
    const [hareketler, setHareketler] = useState([]);
    const [odemeModal, setOdemeModal] = useState(false);
    const [yukleniyor, setYukleniyor] = useState(false);
    const [odemeForm, setOdemeForm] = useState({
        tutar: '', aciklama: '', belgeNo: '',
        tarih: new Date().toISOString().split('T')[0]
    });

    const getir = async () => {
        const res = await api.get('/api/cari-hareketler/bakiyeler');
        setCariler(res.data.data);
    };

    useEffect(() => { getir(); }, []);

    const cariSec = async (cari) => {
        setSeciliCari(cari);
        const res = await api.get(`/api/cari-hareketler/${cari.id}`);
        setHareketler(res.data.data);
    };

    const odemeKaydet = async () => {
        if (!odemeForm.tutar) return toast.error('Tutar zorunlu');
        setYukleniyor(true);
        try {
            await api.post('/api/cari-hareketler/odeme', {
                ...odemeForm,
                cariKartId: seciliCari.id
            });
            toast.success('Ödeme kaydedildi');
            setOdemeModal(false);
            setOdemeForm({ tutar: '', aciklama: '', belgeNo: '', tarih: new Date().toISOString().split('T')[0] });
            getir();
            cariSec(seciliCari);
        } catch (err) {
            toast.error(err.response?.data?.mesaj || 'Hata oluştu');
        } finally {
            setYukleniyor(false);
        }
    };

    const tipRenk = (tip) => {
        if (tip === 'BORC') return 'text-red-400';
        if (tip === 'ALACAK' || tip === 'ODEME') return 'text-lime-400';
        return 'text-zinc-400';
    };

    const tipEtiket = (tip) => {
        const etiketler = { BORC: 'Borç', ALACAK: 'Alacak', ODEME: 'Ödeme', TAHSILAT: 'Tahsilat' };
        return etiketler[tip] || tip;
    };

    const toplamBorc = cariler.reduce((t, c) => c.bakiye > 0 ? t + c.bakiye : t, 0);
    const toplamAlacak = cariler.reduce((t, c) => c.bakiye < 0 ? t + Math.abs(c.bakiye) : t, 0);

    return (
        <div>
            <div className="mb-6">
                <h1 className="text-xl font-bold text-white">Cari Hesap</h1>
                <p className="text-zinc-500 text-sm mt-0.5">Tedarikçi bakiyeleri ve ödeme takibi</p>
            </div>

            {/* Özet */}
            <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="bg-zinc-900 border border-red-500/20 rounded-2xl p-4">
                    <div className="text-xs text-zinc-500 mb-1">Toplam Borç</div>
                    <div className="text-red-400 font-bold text-xl">₺{toplamBorc.toFixed(2)}</div>
                </div>
                <div className="bg-zinc-900 border border-lime-500/20 rounded-2xl p-4">
                    <div className="text-xs text-zinc-500 mb-1">Toplam Alacak</div>
                    <div className="text-lime-400 font-bold text-xl">₺{toplamAlacak.toFixed(2)}</div>
                </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
                {/* Sol — Cari Listesi */}
                <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden">
                    <div className="p-4 border-b border-zinc-800">
                        <h2 className="text-sm font-bold text-white">Cariler</h2>
                    </div>
                    <div className="divide-y divide-zinc-800">
                        {cariler.length === 0 ? (
                            <div className="text-center py-10 text-zinc-500 text-sm">Cari kart yok</div>
                        ) : cariler.map((c) => (
                            <div
                                key={c.id}
                                onClick={() => cariSec(c)}
                                className={`p-4 cursor-pointer hover:bg-zinc-800/50 transition-colors ${seciliCari?.id === c.id ? 'bg-zinc-800' : ''}`}
                            >
                                <div className="flex justify-between items-start">
                                    <div>
                                        <div className="text-sm font-semibold text-white">{c.ad}</div>
                                        <div className="text-xs text-zinc-500 font-mono mt-0.5">{c.kod}</div>
                                    </div>
                                    <div className={`text-sm font-bold font-mono ${c.bakiye > 0 ? 'text-red-400' : c.bakiye < 0 ? 'text-lime-400' : 'text-zinc-500'}`}>
                                        {c.bakiye > 0 ? '-' : c.bakiye < 0 ? '+' : ''}₺{Math.abs(c.bakiye).toFixed(2)}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Sağ — Hareketler */}
                <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden">
                    {seciliCari ? (
                        <>
                            <div className="p-4 border-b border-zinc-800 flex justify-between items-center">
                                <div>
                                    <h2 className="text-sm font-bold text-white">{seciliCari.ad}</h2>
                                    <div className={`text-xs font-mono mt-0.5 ${seciliCari.bakiye > 0 ? 'text-red-400' : 'text-lime-400'}`}>
                                        Bakiye: ₺{seciliCari.bakiye?.toFixed(2)}
                                    </div>
                                </div>
                                <button
                                    onClick={() => setOdemeModal(true)}
                                    className="bg-lime-400 hover:bg-lime-300 text-black font-bold text-xs px-3 py-1.5 rounded-lg transition-colors"
                                >
                                    + Ödeme Ekle
                                </button>
                            </div>
                            <div className="divide-y divide-zinc-800 max-h-96 overflow-y-auto">
                                {hareketler.length === 0 ? (
                                    <div className="text-center py-10 text-zinc-500 text-sm">Hareket yok</div>
                                ) : hareketler.map((h) => (
                                    <div key={h.id} className="p-3 flex justify-between items-start">
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <span className={`text-xs font-semibold ${tipRenk(h.tip)}`}>{tipEtiket(h.tip)}</span>
                                                {h.belgeNo && <span className="text-xs text-zinc-500 font-mono">{h.belgeNo}</span>}
                                            </div>
                                            <div className="text-xs text-zinc-500 mt-0.5">{h.aciklama}</div>
                                            <div className="text-xs text-zinc-600">{new Date(h.tarih).toLocaleDateString('tr-TR')}</div>
                                        </div>
                                        <span className={`text-sm font-bold font-mono ${tipRenk(h.tip)}`}>
                                            {h.tip === 'BORC' ? '-' : '+'}₺{h.tutar.toFixed(2)}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </>
                    ) : (
                        <div className="flex items-center justify-center h-48 text-zinc-500 text-sm">
                            Soldaki listeden bir cari seç
                        </div>
                    )}
                </div>
            </div>

            {odemeModal && (
                <Modal baslik="Ödeme Ekle" onKapat={() => setOdemeModal(false)}>
                    <div className="space-y-4">
                        <div className="bg-zinc-800 rounded-lg p-3 text-sm text-zinc-300">
                            <span className="text-zinc-500">Cari: </span>{seciliCari?.ad}
                        </div>
                        <div>
                            <label className="text-zinc-400 text-sm mb-1.5 block">Tutar (₺) *</label>
                            <input
                                type="number"
                                value={odemeForm.tutar}
                                onChange={(e) => setOdemeForm({ ...odemeForm, tutar: e.target.value })}
                                placeholder="0.00"
                                className="w-full bg-zinc-800 border border-zinc-700 text-white rounded-lg px-4 py-2.5 text-sm outline-none focus:border-lime-400 transition-colors"
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="text-zinc-400 text-sm mb-1.5 block">Belge No</label>
                                <input
                                    value={odemeForm.belgeNo}
                                    onChange={(e) => setOdemeForm({ ...odemeForm, belgeNo: e.target.value })}
                                    placeholder="Makbuz no"
                                    className="w-full bg-zinc-800 border border-zinc-700 text-white rounded-lg px-3 py-2.5 text-sm outline-none focus:border-lime-400 transition-colors"
                                />
                            </div>
                            <div>
                                <label className="text-zinc-400 text-sm mb-1.5 block">Tarih</label>
                                <input
                                    type="date"
                                    value={odemeForm.tarih}
                                    onChange={(e) => setOdemeForm({ ...odemeForm, tarih: e.target.value })}
                                    className="w-full bg-zinc-800 border border-zinc-700 text-white rounded-lg px-3 py-2.5 text-sm outline-none focus:border-lime-400 transition-colors"
                                />
                            </div>
                        </div>
                        <div>
                            <label className="text-zinc-400 text-sm mb-1.5 block">Açıklama</label>
                            <input
                                value={odemeForm.aciklama}
                                onChange={(e) => setOdemeForm({ ...odemeForm, aciklama: e.target.value })}
                                placeholder="İsteğe bağlı"
                                className="w-full bg-zinc-800 border border-zinc-700 text-white rounded-lg px-4 py-2.5 text-sm outline-none focus:border-lime-400 transition-colors"
                            />
                        </div>
                        <button
                            onClick={odemeKaydet}
                            disabled={yukleniyor}
                            className="w-full bg-lime-400 hover:bg-lime-300 disabled:opacity-50 text-black font-bold rounded-lg py-2.5 text-sm transition-colors"
                        >
                            {yukleniyor ? 'Kaydediliyor...' : 'Ödemeyi Kaydet'}
                        </button>
                    </div>
                </Modal>
            )}
        </div>
    );
}