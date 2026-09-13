import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import api from '../../services/api';
import Modal from '../../components/Modal';
import { usePaketDurumu, SaltOkunurUyari } from '../../components/PlanKilidi';

const fmt = (n) => Number(n || 0).toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export default function CariHesap() {
    // Paket/deneme bilgisi App.jsx'teki <PrivateRoute planOzellik="cari">
    // tarafından sağlanan <PaketProvider> context'inden geliyor. Deneme
    // bitip plan yetersiz kalınca sayfa kapanmıyor — sadece "+ Ödeme Ekle"
    // (yazma işlemi) gizleniyor, bakiyeler ve hareket geçmişi her zaman
    // görünür kalıyor.
    const { tamErisim } = usePaketDurumu();

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

    // DÜZELTME 2: "Tamamını doldur" butonu sadece TAM ödeme senaryosunu
    // çözüyordu. Kısmi bir tutar (örn. 10.245,60 TL'nin sadece 10.245,60'ı
    // değil, 10245,60 gibi bir kısmı) elle yazılmak istendiğinde kullanıcı
    // yine aynı tuzağa düşüyordu — çünkü input type="number" olduğu
    // sürece SADECE nokta ondalık ayıracı kabul edilir, virgül tamamen
    // reddedilir. Türkçe klavyede insanlar doğal olarak virgülle yazar
    // ("10245,60"); bu yüzden number input'u tamamen bırakıp virgülü
    // ondalık ayıracı sayan bir metin alanına geçildi. Nokta karakteri
    // burada hiç kabul edilmiyor (binlik ayıracına gerek yok, kafa
    // karıştırmasın diye) — kullanıcı yalnızca rakam ve tek bir virgül
    // yazabilir. Gönderirken virgül noktaya çevrilip sayıya dönüştürülür.
    const tutarDegisti = (e) => {
        let deger = e.target.value;
        // Sadece rakam ve virgül — nokta girilirse yok sayılır.
        deger = deger.replace(/[^0-9,]/g, '');
        // Birden fazla virgül girilirse ilkinden sonrakileri at.
        const ilkVirgul = deger.indexOf(',');
        if (ilkVirgul !== -1) {
            deger = deger.slice(0, ilkVirgul + 1) + deger.slice(ilkVirgul + 1).replace(/,/g, '');
        }
        setOdemeForm(prev => ({ ...prev, tutar: deger }));
    };

    const tutarSayiyaCevir = (deger) => Number(String(deger).replace(',', '.'));

    const tamaminiDoldur = () => {
        if (!seciliCari) return;
        const tutar = Math.abs(seciliCari.bakiye);
        // Bu alan artık virgül ondalık ayıracı bekliyor — nokta değil.
        setOdemeForm(prev => ({ ...prev, tutar: tutar.toFixed(2).replace('.', ',') }));
    };

    const odemeKaydet = async () => {
        if (!odemeForm.tutar) return toast.error('Tutar zorunlu');
        setYukleniyor(true);

        const tutar = tutarSayiyaCevir(odemeForm.tutar);

        // Optimistic: anında güncelle
        const yeniHareket = {
            id: Date.now(),
            tip: 'ODEME',
            tutar,
            aciklama: odemeForm.aciklama,
            belgeNo: odemeForm.belgeNo,
            tarih: odemeForm.tarih,
            _gecici: true
        };
        setHareketler(prev => [yeniHareket, ...prev]);
        setCariler(prev => prev.map(c =>
            c.id === seciliCari.id ? { ...c, bakiye: c.bakiye - tutar } : c
        ));
        setSeciliCari(prev => ({ ...prev, bakiye: prev.bakiye - tutar }));
        setOdemeModal(false);
        setOdemeForm({ tutar: '', aciklama: '', belgeNo: '', tarih: new Date().toISOString().split('T')[0] });

        try {
            const res = await api.post('/api/cari-hareketler/odeme', {
                ...odemeForm,
                tutar,
                cariKartId: seciliCari.id
            });
            // Geçici kaydı gerçek veriyle değiştir
            setHareketler(prev => prev.map(h =>
                h.id === yeniHareket.id ? res.data.data : h
            ));
            toast.success('Ödeme kaydedildi');
        } catch (err) {
            // Hata varsa geri al
            setHareketler(prev => prev.filter(h => h.id !== yeniHareket.id));
            setCariler(prev => prev.map(c =>
                c.id === seciliCari.id ? { ...c, bakiye: c.bakiye + tutar } : c
            ));
            setSeciliCari(prev => ({ ...prev, bakiye: prev.bakiye + tutar }));
            setOdemeModal(true);
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
            <div className="mb-5">
                <h1 className="text-xl font-bold text-white">Cari Hesap</h1>
                <p className="text-zinc-500 text-sm mt-0.5">Tedarikçi bakiyeleri ve ödeme takibi</p>
            </div>

            <SaltOkunurUyari />

            <div className="grid grid-cols-2 gap-3 mb-5">
                <div className="bg-zinc-900 border border-red-500/20 rounded-xl p-4">
                    <div className="text-xs text-zinc-500 mb-1">Toplam Borç</div>
                    <div className="text-red-400 font-bold text-xl">₺{fmt(toplamBorc)}</div>
                </div>
                <div className="bg-zinc-900 border border-lime-500/20 rounded-xl p-4">
                    <div className="text-xs text-zinc-500 mb-1">Toplam Alacak</div>
                    <div className="text-lime-400 font-bold text-xl">₺{fmt(toplamAlacak)}</div>
                </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
                <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
                    <div className="p-3.5 border-b border-zinc-800">
                        <h2 className="text-sm font-bold text-white">Cariler</h2>
                    </div>
                    <div className="divide-y divide-zinc-800">
                        {cariler.length === 0 ? (
                            <div className="text-center py-8 text-zinc-500 text-sm">Cari kart yok</div>
                        ) : cariler.map((c) => (
                            <div
                                key={c.id}
                                onClick={() => cariSec(c)}
                                className={`p-3.5 cursor-pointer hover:bg-zinc-800/50 transition-colors ${seciliCari?.id === c.id ? 'bg-zinc-800' : ''}`}
                            >
                                <div className="flex justify-between items-start">
                                    <div>
                                        <div className="text-sm font-semibold text-white">{c.ad}</div>
                                        <div className="text-xs text-zinc-500 font-mono mt-0.5">{c.kod}</div>
                                    </div>
                                    <div className={`text-sm font-bold font-mono ${c.bakiye > 0 ? 'text-red-400' : c.bakiye < 0 ? 'text-lime-400' : 'text-zinc-500'}`}>
                                        {c.bakiye > 0 ? '-' : c.bakiye < 0 ? '+' : ''}₺{fmt(Math.abs(c.bakiye))}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
                    {seciliCari ? (
                        <>
                            <div className="p-3.5 border-b border-zinc-800 flex justify-between items-center">
                                <div>
                                    <h2 className="text-sm font-bold text-white">{seciliCari.ad}</h2>
                                    <div className={`text-xs font-mono mt-0.5 ${seciliCari.bakiye > 0 ? 'text-red-400' : 'text-lime-400'}`}>
                                        Bakiye: ₺{fmt(seciliCari.bakiye)}
                                    </div>
                                </div>
                                {/* Ödeme ekleme — yazma işlemi, salt okunurda gizli */}
                                {tamErisim && (
                                    <button
                                        onClick={() => setOdemeModal(true)}
                                        className="bg-lime-400 hover:bg-lime-300 text-black font-bold text-xs px-3 py-1.5 rounded-lg transition-colors"
                                    >
                                        + Ödeme Ekle
                                    </button>
                                )}
                            </div>
                            <div className="divide-y divide-zinc-800 max-h-96 overflow-y-auto">
                                {hareketler.length === 0 ? (
                                    <div className="text-center py-8 text-zinc-500 text-sm">Hareket yok</div>
                                ) : hareketler.map((h) => (
                                    <div key={h.id} className={`p-3 flex justify-between items-start ${h._gecici ? 'opacity-60' : ''}`}>
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <span className={`text-xs font-semibold ${tipRenk(h.tip)}`}>{tipEtiket(h.tip)}</span>
                                                {h._gecici && <span className="text-xs text-zinc-600">kaydediliyor...</span>}
                                                {h.belgeNo && <span className="text-xs text-zinc-500 font-mono">{h.belgeNo}</span>}
                                            </div>
                                            <div className="text-xs text-zinc-500 mt-0.5">{h.aciklama}</div>
                                            <div className="text-xs text-zinc-600">{new Date(h.tarih).toLocaleDateString('tr-TR')}</div>
                                        </div>
                                        <span className={`text-sm font-bold font-mono ${tipRenk(h.tip)}`}>
                                            {h.tip === 'BORC' ? '-' : '+'}₺{fmt(h.tutar)}
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

            {odemeModal && tamErisim && (
                <Modal baslik="Ödeme Ekle" onKapat={() => setOdemeModal(false)}>
                    <div className="space-y-4">
                        <div className="bg-zinc-800 rounded-lg p-3 text-sm text-zinc-300">
                            <span className="text-zinc-500">Cari: </span>{seciliCari?.ad}
                        </div>
                        <div>
                            <div className="flex items-center justify-between mb-1.5">
                                <label className="text-zinc-400 text-sm">Tutar (₺) *</label>
                                {/* DÜZELTME: bakiyeyi doğrudan doldurur — elle
                                    "102.045,60" gibi Türkçe formatlı bir sayı
                                    yazma girişimini (ve number input'un bunu
                                    sessizce ~₺102'ye indirgemesini) tamamen
                                    ortadan kaldırır. */}
                                {seciliCari && (
                                    <button
                                        type="button"
                                        onClick={tamaminiDoldur}
                                        className="text-lime-400 hover:text-lime-300 text-xs font-semibold"
                                    >
                                        Bakiyenin tamamını doldur (₺{fmt(Math.abs(seciliCari.bakiye))})
                                    </button>
                                )}
                            </div>
                            <input
                                type="text"
                                inputMode="decimal"
                                value={odemeForm.tutar}
                                onChange={tutarDegisti}
                                placeholder="0,00"
                                className="w-full bg-zinc-800 border border-zinc-700 text-white rounded-lg px-4 py-2.5 text-sm outline-none focus:border-lime-400 transition-colors"
                            />
                            {/* Bu alan artık SADECE virgülü ondalık ayıracı
                                olarak kabul ediyor (nokta karakteri hiç
                                girilemiyor) — Türkçe klavyede doğal yazım
                                şekliyle birebir örtüşüyor, kısmi ödemelerde
                                bile yanlış tutar girme riski kalmıyor. */}
                            <p className="text-zinc-600 text-xs mt-1.5">
                                Ondalık için virgül kullanın (ör. 1500,50). Tamamını ödemek için yukarıdaki butonu kullanabilirsiniz.
                            </p>
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