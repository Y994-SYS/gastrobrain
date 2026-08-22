import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import api from '../../services/api';
import Modal from '../../components/Modal';
import SubeSecici from '../../components/SubeSecici';
import useSubeStore from '../../store/subeStore';
import useAuthStore from '../../store/auth.store';

// Native <input type="number"> bazı tarayıcı/bölge ayarlarında "." veya ","
// karakterini binlik ayraç sanıp değeri bozabiliyor (örn. "20.000" yazınca
// tarayıcı bunu ondalık sayı olarak "20" okuyabiliyor). Bunun önüne geçmek
// için tutar/maaş gibi alanları type="text" yapıp elle temizliyoruz.
const tamSayiTemizle = (deger) => deger.replace(/[^0-9]/g, '');
const ondalikSayiTemizle = (deger) => {
    let temiz = deger.replace(/[^0-9.]/g, '');
    const parcalar = temiz.split('.');
    if (parcalar.length > 2) temiz = parcalar[0] + '.' + parcalar.slice(1).join('');
    return temiz;
};

const bosPersonel = (subeId = '') => ({
    ad: '', soyad: '', telefon: '',
    baslangicTarihi: new Date().toISOString().split('T')[0],
    maas: '', subeId
});

export default function Personel() {
    const { kullanici } = useAuthStore();
    const { seciliSubeId, subeler } = useSubeStore();
    const subeParam = seciliSubeId ? `?subeId=${seciliSubeId}` : '';

    // TENANT_ADMIN ve birden fazla şubesi olan kullanıcılar için personel formunda
    // şube seçimi gösterilir — aksi halde personel her zaman sessizce kullanıcının
    // kendi şubesine kaydedilir, bu da görüntülenen şubeyle tutarsızlığa yol açar
    // (bkz. Satışlar sayfasındaki aynı sorun).
    const subeSecimiGerekli = kullanici?.rol === 'TENANT_ADMIN' && subeler.length > 1;

    const goruntulenenSubeAdi = seciliSubeId
        ? subeler.find(s => s.id === seciliSubeId)?.ad
        : null;

    const [veri, setVeri] = useState([]);
    const [secili, setSecili] = useState(null);
    const [personelModal, setPersonelModal] = useState(false);
    const [maasModal, setMaasModal] = useState(false);
    const [avansModal, setAvansModal] = useState(false);
    const [devamModal, setDevamModal] = useState(false);
    const [izinModal, setIzinModal] = useState(false);
    const [form, setForm] = useState(bosPersonel());
    const [duzenleId, setDuzenleId] = useState(null);
    const [yukleniyor, setYukleniyor] = useState(false);

    const buAy = new Date().getMonth() + 1;
    const buYil = new Date().getFullYear();
    const bugun = new Date().toISOString().split('T')[0];

    const [maasForm, setMaasForm] = useState({ yil: buYil, ay: buAy, tutar: '', odendi: false, tarih: bugun });
    const [maasDuzenleId, setMaasDuzenleId] = useState(null);
    const [avansForm, setAvansForm] = useState({ tutar: '', aciklama: '', tarih: bugun });

    const [devamModu, setDevamModu] = useState('tekGun'); // 'tekGun' | 'aralik'
    const [devamForm, setDevamForm] = useState({ tarih: bugun, bitisTarihi: bugun, durum: 'CALISTI', mesai: '', aciklama: '' });

    const [izinDurumu, setIzinDurumu] = useState(null);
    const [izinYukleniyor, setIzinYukleniyor] = useState(false);
    const [izinForm, setIzinForm] = useState({ yil: buYil, kullanilanGun: '', aciklama: '' });

    const getir = async () => {
        try {
            const res = await api.get(`/api/personel${subeParam}`);
            setVeri(res.data?.data || []);
        } catch (err) {
            console.error('Personel listesi alınamadı:', err);
        }
    };

    const izinDurumuGetir = async (personelId, yil = buYil) => {
        setIzinYukleniyor(true);
        try {
            const res = await api.get(`/api/personel/${personelId}/izin-durumu?yil=${yil}`);
            setIzinDurumu(res.data?.data || null);
        } catch (err) {
            console.error('İzin durumu alınamadı:', err);
            setIzinDurumu(null);
        } finally {
            setIzinYukleniyor(false);
        }
    };

    const personelDetayYenile = async (id) => {
        try {
            const res = await api.get(`/api/personel/${id}`);
            setSecili(res.data?.data || null);
        } catch (err) {
            console.error('Personel detayı alınamadı:', err);
        }
    };

    const personelDetay = async (p) => {
        await personelDetayYenile(p.id);
        izinDurumuGetir(p.id, buYil);
    };

    useEffect(() => { getir(); }, [seciliSubeId]);

    const kaydet = async () => {
        if (!form.ad || !form.soyad || !form.maas) return toast.error('Ad, soyad ve maaş zorunlu');
        if (subeSecimiGerekli && !form.subeId) return toast.error('Şube seçimi zorunlu');
        setYukleniyor(true);
        try {
            if (duzenleId) {
                await api.put(`/api/personel/${duzenleId}`, form);
                setVeri(prev => prev.map(p => p.id === duzenleId ? { ...p, ...form, maas: Number(form.maas) } : p));
                if (secili?.id === duzenleId) setSecili(prev => ({ ...prev, ...form, maas: Number(form.maas) }));
                toast.success('Güncellendi');
            } else {
                const res = await api.post('/api/personel', form);
                setVeri(prev => [...prev, res.data.data]);
                toast.success('Personel eklendi');
            }
            setPersonelModal(false);
            setForm(bosPersonel(seciliSubeId || ''));
            setDuzenleId(null);
        } catch (err) {
            toast.error(err.response?.data?.mesaj || 'Hata oluştu');
        } finally {
            setYukleniyor(false);
        }
    };

    const duzenle = (p) => {
        setForm({ ad: p.ad, soyad: p.soyad, telefon: p.telefon || '', maas: p.maas, subeId: p.subeId, baslangicTarihi: new Date(p.baslangicTarihi).toISOString().split('T')[0] });
        setDuzenleId(p.id);
        setPersonelModal(true);
    };

    const yeniPersonelModalAc = () => {
        // Yeni personel formu, ekranda o an GÖRÜNTÜLENEN şubeyi varsayılan alır
        // (seciliSubeId). "Tüm Şubeler" görünümündeyse (null) ve TENANT_ADMIN
        // birden fazla şubeye sahipse, formda seçim alanı zaten görünür olacak.
        setForm(bosPersonel(seciliSubeId || ''));
        setDuzenleId(null);
        setPersonelModal(true);
    };

    const sil = async (id) => {
        if (!confirm('Personeli silmek istediğine emin misin?')) return;
        const silinen = veri.find(p => p.id === id);
        setVeri(prev => prev.filter(p => p.id !== id));
        if (secili?.id === id) { setSecili(null); setIzinDurumu(null); }
        try {
            await api.delete(`/api/personel/${id}`);
            toast.success('Silindi');
        } catch (err) {
            setVeri(prev => [...prev, silinen]);
            toast.error(err.response?.data?.mesaj || 'Silinemedi');
        }
    };

    // O yıl/ay için zaten kaydedilmiş (geçici olmayan) bir maaş kaydı var mı bul
    const maasKaydiBul = (yil, ay) =>
        secili?.maaslar?.find(m => Number(m.yil) === Number(yil) && Number(m.ay) === Number(ay) && !m._gecici);

    // Maaş modalını, seçilen yıl/ay için mevcut kayıt varsa düzenleme moduyla,
    // yoksa boş/yeni kayıt moduyla açar
    const maasModalAc = (yil = buYil, ay = buAy) => {
        const mevcut = maasKaydiBul(yil, ay);
        if (mevcut) {
            setMaasForm({ yil: mevcut.yil, ay: mevcut.ay, tutar: mevcut.tutar, odendi: mevcut.odendi, tarih: mevcut.tarih?.split('T')[0] || bugun });
            setMaasDuzenleId(mevcut.id);
        } else {
            setMaasForm({ yil, ay, tutar: '', odendi: false, tarih: bugun });
            setMaasDuzenleId(null);
        }
        setMaasModal(true);
    };

    // Modal içinde yıl/ay değiştiğinde de aynı kontrolü yapar
    const maasFormYilAyDegistir = (yeniYil, yeniAy) => {
        const mevcut = maasKaydiBul(yeniYil, yeniAy);
        if (mevcut) {
            setMaasForm({ yil: mevcut.yil, ay: mevcut.ay, tutar: mevcut.tutar, odendi: mevcut.odendi, tarih: mevcut.tarih?.split('T')[0] || bugun });
            setMaasDuzenleId(mevcut.id);
        } else {
            setMaasForm(prev => ({ ...prev, yil: yeniYil, ay: yeniAy }));
            setMaasDuzenleId(null);
        }
    };

    const maasKaydet = async () => {
        if (!maasForm.tutar) return toast.error('Tutar zorunlu');
        setYukleniyor(true);

        if (maasDuzenleId) {
            // Mevcut kaydı güncelle (yeni kayıt oluşturmaz, "bu ay zaten var" hatasını önler)
            const guncel = { ...maasForm, tutar: Number(maasForm.tutar) };
            setSecili(prev => ({
                ...prev,
                maaslar: prev.maaslar.map(m => m.id === maasDuzenleId ? { ...m, ...guncel } : m)
            }));
            setMaasModal(false);
            try {
                const res = await api.put(`/api/personel/maas/${maasDuzenleId}`, guncel);
                setSecili(prev => ({
                    ...prev,
                    maaslar: prev.maaslar.map(m => m.id === maasDuzenleId ? res.data.data : m)
                }));
                toast.success('Maaş güncellendi');
            } catch (err) {
                toast.error(err.response?.data?.mesaj || 'Güncellenemedi');
                await personelDetayYenile(secili.id);
            } finally {
                setYukleniyor(false);
                setMaasDuzenleId(null);
            }
            return;
        }

        // Yeni kayıt ekle
        const yeniMaas = { id: Date.now(), ...maasForm, tutar: Number(maasForm.tutar), _gecici: true };
        setSecili(prev => ({ ...prev, maaslar: [yeniMaas, ...(prev.maaslar || [])] }));
        setMaasModal(false);
        try {
            const res = await api.post('/api/personel/maas', { ...maasForm, personelId: secili.id });
            setSecili(prev => ({ ...prev, maaslar: prev.maaslar.map(m => m.id === yeniMaas.id ? res.data.data : m) }));
            toast.success('Maaş kaydedildi');
        } catch (err) {
            setSecili(prev => ({ ...prev, maaslar: prev.maaslar.filter(m => m.id !== yeniMaas.id) }));
            setMaasModal(true);
            toast.error(err.response?.data?.mesaj || 'Hata oluştu');
        } finally {
            setYukleniyor(false);
        }
    };

    const avansKaydet = async () => {
        if (!avansForm.tutar) return toast.error('Tutar zorunlu');
        setYukleniyor(true);
        const yeniAvans = { id: Date.now(), ...avansForm, tutar: Number(avansForm.tutar), _gecici: true };
        setSecili(prev => ({ ...prev, avanslar: [yeniAvans, ...(prev.avanslar || [])] }));
        setAvansModal(false);
        try {
            const res = await api.post('/api/personel/avans', { ...avansForm, personelId: secili.id });
            setSecili(prev => ({ ...prev, avanslar: prev.avanslar.map(a => a.id === yeniAvans.id ? res.data.data : a) }));
            toast.success('Avans kaydedildi');
        } catch (err) {
            setSecili(prev => ({ ...prev, avanslar: prev.avanslar.filter(a => a.id !== yeniAvans.id) }));
            setAvansModal(true);
            toast.error(err.response?.data?.mesaj || 'Hata oluştu');
        } finally { setYukleniyor(false); }
    };

    const devamKaydet = async () => {
        if (devamModu === 'aralik' && devamForm.bitisTarihi < devamForm.tarih) {
            return toast.error('Bitiş tarihi başlangıçtan önce olamaz');
        }
        setYukleniyor(true);
        try {
            if (devamModu === 'tekGun') {
                const yeniDevam = { id: Date.now(), ...devamForm, mesai: devamForm.mesai ? Number(devamForm.mesai) : null, _gecici: true };
                setSecili(prev => ({ ...prev, devamlar: [yeniDevam, ...(prev.devamlar || [])] }));
                setDevamModal(false);
                try {
                    // devamEkleSchema .strict() olduğu için sadece backend'in
                    // tanıdığı alanlar gönderilmeli — bitisTarihi burada gitmemeli
                    const res = await api.post('/api/personel/devam', {
                        personelId: secili.id,
                        tarih: devamForm.tarih,
                        durum: devamForm.durum,
                        mesai: devamForm.mesai,
                        aciklama: devamForm.aciklama,
                    });
                    setSecili(prev => ({ ...prev, devamlar: prev.devamlar.map(d => d.id === yeniDevam.id ? res.data.data : d) }));
                    toast.success('Devam kaydedildi');
                } catch (err) {
                    setSecili(prev => ({ ...prev, devamlar: prev.devamlar.filter(d => d.id !== yeniDevam.id) }));
                    setDevamModal(true);
                    throw err;
                }
            } else {
                const res = await api.post('/api/personel/devam-toplu', {
                    personelId: secili.id,
                    baslangicTarihi: devamForm.tarih,
                    bitisTarihi: devamForm.bitisTarihi,
                    durum: devamForm.durum,
                    mesai: devamForm.mesai,
                    aciklama: devamForm.aciklama,
                });
                setDevamModal(false);
                toast.success(`${res.data.data.eklenenGunSayisi} günlük kayıt eklendi`);
                await personelDetayYenile(secili.id);
            }

            // Devam kaydı IZIN ise, yıllık izin sayacı otomatik değiştiği için tazele
            if (devamForm.durum === 'IZIN') {
                const yil = new Date(devamForm.tarih).getFullYear();
                izinDurumuGetir(secili.id, yil);
            }
        } catch (err) {
            toast.error(err.response?.data?.mesaj || 'Hata oluştu');
        } finally {
            setYukleniyor(false);
        }
    };

    const izinKaydet = async () => {
        if (izinForm.kullanilanGun === '' || izinForm.kullanilanGun === null) return toast.error('Düzeltme miktarı zorunlu');
        setYukleniyor(true);
        try {
            await api.post('/api/personel/izin-kullanim', {
                personelId: secili.id,
                yil: Number(izinForm.yil),
                kullanilanGun: Number(izinForm.kullanilanGun),
                aciklama: izinForm.aciklama,
            });
            toast.success('İzin düzeltmesi kaydedildi');
            setIzinModal(false);
            await izinDurumuGetir(secili.id, Number(izinForm.yil));
        } catch (err) {
            toast.error(err.response?.data?.mesaj || 'Hata oluştu');
        } finally {
            setYukleniyor(false);
        }
    };

    const izinModalAc = () => {
        setIzinForm({
            yil: izinDurumu?.yil || buYil,
            kullanilanGun: izinDurumu?.manuelDuzeltme ?? '',
            aciklama: '',
        });
        setIzinModal(true);
    };

    const devamModalAc = () => {
        setDevamModu('tekGun');
        setDevamForm({ tarih: bugun, bitisTarihi: bugun, durum: 'CALISTI', mesai: '', aciklama: '' });
        setDevamModal(true);
    };

    // Durum renkleri: CALISTI = pozitif (lime), DEVAMSIZ = kritik (red),
    // RAPOR = dikkat gerektiren (amber), IZIN = nötr/planlı (zinc)
    const durumRenk = (durum) => ({ CALISTI: 'text-lime-400', IZIN: 'text-zinc-400', RAPOR: 'text-amber-400', DEVAMSIZ: 'text-red-400' }[durum] || 'text-zinc-400');
    const aylar = ['', 'Oca', 'Şub', 'Mar', 'Nis', 'May', 'Haz', 'Tem', 'Ağu', 'Eyl', 'Eki', 'Kas', 'Ara'];

    return (
        <div>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-5 gap-3">
                <div>
                    <h1 className="text-xl font-bold text-white">Personel</h1>
                    <p className="text-zinc-500 text-sm mt-0.5">
                        {veri.length} personel
                        {' — '}
                        <span className="text-zinc-400">
                            {goruntulenenSubeAdi || 'Tüm Şubeler'}
                        </span>
                    </p>
                </div>
                <button onClick={yeniPersonelModalAc} className="bg-lime-400 hover:bg-lime-300 text-black font-bold text-sm px-4 py-2 rounded-lg transition-colors">
                    + Yeni Personel
                </button>
            </div>

            <SubeSecici />

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
                    <div className="p-3.5 border-b border-zinc-800"><h2 className="text-sm font-bold text-white">Personeller</h2></div>
                    <div className="divide-y divide-zinc-800">
                        {veri.length === 0 ? (
                            <div className="text-center py-8 text-zinc-500 text-sm">
                                Personel yok
                                {goruntulenenSubeAdi && (
                                    <div className="text-xs text-zinc-600 mt-1">
                                        ({goruntulenenSubeAdi} için gösteriliyor)
                                    </div>
                                )}
                            </div>
                        ) : veri.map((p) => (
                            <div key={p.id} onClick={() => personelDetay(p)} className={`p-3.5 cursor-pointer hover:bg-zinc-800/50 transition-colors ${secili?.id === p.id ? 'bg-zinc-800' : ''}`}>
                                <div className="flex justify-between items-start">
                                    <div>
                                        <div className="text-sm font-semibold text-white">{p.ad} {p.soyad}</div>
                                        <div className="text-xs text-zinc-500 mt-0.5">₺{p.maas} / ay</div>
                                        {p.sube && <div className="text-xs text-zinc-600 mt-0.5">{p.sube.ad}</div>}
                                    </div>
                                    <div className="flex gap-1">
                                        <button onClick={(e) => { e.stopPropagation(); duzenle(p); }} className="text-xs text-zinc-500 hover:text-white px-2 py-1 rounded transition-colors">✏️</button>
                                        <button onClick={(e) => { e.stopPropagation(); sil(p.id); }} className="text-xs text-zinc-500 hover:text-red-400 px-2 py-1 rounded transition-colors">🗑️</button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="md:col-span-2">
                    {secili ? (
                        <div className="space-y-3.5">
                            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
                                <div className="flex flex-col sm:flex-row justify-between gap-3">
                                    <div>
                                        <h2 className="text-white font-bold text-lg">{secili.ad} {secili.soyad}</h2>
                                        <div className="flex flex-wrap gap-3 mt-2 text-sm text-zinc-400">
                                            {secili.telefon && <span>📞 {secili.telefon}</span>}
                                            <span>💰 ₺{secili.maas} / ay</span>
                                            <span>📅 {new Date(secili.baslangicTarihi).toLocaleDateString('tr-TR')}'den beri</span>
                                            {secili.sube && <span>🏪 {secili.sube.ad}</span>}
                                        </div>
                                    </div>
                                    <div className="flex flex-wrap gap-2">
                                        <button onClick={() => maasModalAc()} className="text-xs border border-zinc-700 text-zinc-400 hover:text-lime-400 hover:border-lime-400 px-3 py-1.5 rounded-lg transition-colors">💰 Maaş</button>
                                        <button onClick={() => setAvansModal(true)} className="text-xs border border-zinc-700 text-zinc-400 hover:text-amber-400 hover:border-amber-400 px-3 py-1.5 rounded-lg transition-colors">💳 Avans</button>
                                        <button onClick={devamModalAc} className="text-xs border border-zinc-700 text-zinc-400 hover:text-blue-400 hover:border-blue-400 px-3 py-1.5 rounded-lg transition-colors">📋 Devam</button>
                                        <button onClick={izinModalAc} className="text-xs border border-zinc-700 text-zinc-400 hover:text-lime-400 hover:border-lime-400 px-3 py-1.5 rounded-lg transition-colors">🏖️ Düzeltme</button>
                                    </div>
                                </div>
                            </div>

                            {/* Yıllık İzin Durumu kartı */}
                            <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
                                <div className="p-3.5 border-b border-zinc-800 flex justify-between items-center">
                                    <h3 className="text-sm font-bold text-white">Yıllık İzin Durumu {izinDurumu?.yil || buYil}</h3>
                                    {izinYukleniyor && <span className="text-xs text-zinc-600">yükleniyor...</span>}
                                </div>
                                {izinDurumu ? (
                                    <div className="grid grid-cols-2 sm:grid-cols-4 divide-x divide-zinc-800">
                                        <div className="p-3.5 text-center">
                                            <div className="text-xs text-zinc-500 mb-1">Kıdem</div>
                                            <div className="text-lg font-bold text-white">{izinDurumu.kidemYili} yıl</div>
                                        </div>
                                        <div className="p-3.5 text-center">
                                            <div className="text-xs text-zinc-500 mb-1">Hak Edilen</div>
                                            <div className="text-lg font-bold text-lime-400">{izinDurumu.hakEdilenGun} gün</div>
                                        </div>
                                        <div className="p-3.5 text-center">
                                            <div className="text-xs text-zinc-500 mb-1">Kullanılan</div>
                                            <div className="text-lg font-bold text-amber-400">{izinDurumu.kullanilanGun} gün</div>
                                            <div className="text-[11px] text-zinc-600 mt-1">
                                                {izinDurumu.otomatikGun} devam kaydı{izinDurumu.manuelDuzeltme !== 0 ? ` + ${izinDurumu.manuelDuzeltme} düzeltme` : ''}
                                            </div>
                                        </div>
                                        <div className="p-3.5 text-center">
                                            <div className="text-xs text-zinc-500 mb-1">Kalan</div>
                                            <div className={`text-lg font-bold ${izinDurumu.kalanGun < 0 ? 'text-red-400' : 'text-lime-400'}`}>{izinDurumu.kalanGun} gün</div>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="text-center py-5 text-zinc-500 text-xs">İzin bilgisi alınamadı</div>
                                )}
                            </div>

                            {[
                                {
                                    baslik: 'Maaş Geçmişi', liste: secili.maaslar, bos: 'Maaş kaydı yok', render: (m) => (
                                        <div
                                            key={m.id}
                                            onClick={() => !m._gecici && maasModalAc(m.yil, m.ay)}
                                            className={`px-4 py-2.5 flex justify-between items-center ${m._gecici ? 'opacity-60' : 'cursor-pointer hover:bg-zinc-800/50 transition-colors'}`}
                                        >
                                            <div className="flex items-center gap-2">
                                                <span className="text-sm text-zinc-300">{aylar[m.ay]} {m.yil}</span>
                                                {m._gecici && <span className="text-xs text-zinc-600">kaydediliyor...</span>}
                                            </div>
                                            <div className="flex items-center gap-3">
                                                <span className="text-sm font-mono text-white">₺{m.tutar}</span>
                                                <span className={`text-xs px-2 py-0.5 rounded-full ${m.odendi ? 'bg-lime-400/10 text-lime-400' : 'bg-amber-400/10 text-amber-400'}`}>{m.odendi ? 'Ödendi' : 'Bekliyor'}</span>
                                            </div>
                                        </div>
                                    )
                                },
                                {
                                    baslik: 'Avans Geçmişi', liste: secili.avanslar, bos: 'Avans kaydı yok', render: (a) => (
                                        <div key={a.id} className={`px-4 py-2.5 flex justify-between items-center ${a._gecici ? 'opacity-60' : ''}`}>
                                            <div>
                                                <div className="flex items-center gap-2">
                                                    <span className="text-sm text-zinc-300">{a.aciklama || 'Avans'}</span>
                                                    {a._gecici && <span className="text-xs text-zinc-600">kaydediliyor...</span>}
                                                </div>
                                                <div className="text-xs text-zinc-500">{new Date(a.tarih).toLocaleDateString('tr-TR')}</div>
                                            </div>
                                            <span className="text-sm font-mono text-amber-400">₺{a.tutar}</span>
                                        </div>
                                    )
                                },
                                {
                                    baslik: 'Devam Durumu', liste: secili.devamlar, bos: 'Devam kaydı yok', render: (d) => (
                                        <div key={d.id} className={`px-4 py-2.5 flex justify-between items-center ${d._gecici ? 'opacity-60' : ''}`}>
                                            <div className="flex items-center gap-3">
                                                <span className={`text-xs font-semibold ${durumRenk(d.durum)}`}>{d.durum}</span>
                                                {d._gecici && <span className="text-xs text-zinc-600">kaydediliyor...</span>}
                                                {d.durum === 'CALISTI' && d.mesai > 0 && <span className="text-xs text-zinc-500">{d.mesai} saat mesai</span>}
                                            </div>
                                            <span className="text-xs text-zinc-500">{new Date(d.tarih).toLocaleDateString('tr-TR')}</span>
                                        </div>
                                    )
                                }
                            ].map(({ baslik, liste, bos, render }) => (
                                <div key={baslik} className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
                                    <div className="p-3.5 border-b border-zinc-800"><h3 className="text-sm font-bold text-white">{baslik}</h3></div>
                                    <div className="divide-y divide-zinc-800 max-h-40 overflow-y-auto">
                                        {!liste?.length ? (
                                            <div className="text-center py-5 text-zinc-500 text-xs">{bos}</div>
                                        ) : liste.map(render)}
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="bg-zinc-900 border border-zinc-800 rounded-xl flex items-center justify-center h-48 text-zinc-500 text-sm">
                            Soldaki listeden bir personel seç
                        </div>
                    )}
                </div>
            </div>

            {personelModal && (
                <Modal baslik={duzenleId ? 'Personel Düzenle' : 'Yeni Personel'} onKapat={() => setPersonelModal(false)}>
                    <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-3">
                            {[['Ad *', 'ad'], ['Soyad *', 'soyad'], ['Telefon', 'telefon']].map(([lbl, key]) => (
                                <div key={key}>
                                    <label className="text-zinc-400 text-sm mb-1.5 block">{lbl}</label>
                                    <input value={form[key]} onChange={(e) => setForm({ ...form, [key]: e.target.value })} className="w-full bg-zinc-800 border border-zinc-700 text-white rounded-lg px-3 py-2.5 text-sm outline-none focus:border-lime-400 transition-colors" />
                                </div>
                            ))}
                            <div>
                                <label className="text-zinc-400 text-sm mb-1.5 block">Maaş (₺) *</label>
                                <input type="text" inputMode="numeric" value={form.maas} onChange={(e) => setForm({ ...form, maas: tamSayiTemizle(e.target.value) })} className="w-full bg-zinc-800 border border-zinc-700 text-white rounded-lg px-3 py-2.5 text-sm outline-none focus:border-lime-400 transition-colors" />
                            </div>
                        </div>

                        {/* Şube seçimi — sadece TENANT_ADMIN ve birden fazla şube varsa gösterilir.
                            Diğer roller için backend zaten kendi şubelerini zorluyor. */}
                        {subeSecimiGerekli && (
                            <div>
                                <label className="text-zinc-400 text-sm mb-1.5 block">Şube *</label>
                                <select
                                    value={form.subeId}
                                    onChange={(e) => setForm({ ...form, subeId: e.target.value })}
                                    className="w-full bg-zinc-800 border border-zinc-700 text-white rounded-lg px-3 py-2.5 text-sm outline-none focus:border-lime-400 transition-colors"
                                >
                                    <option value="">— Şube seç —</option>
                                    {subeler.map(s => (
                                        <option key={s.id} value={s.id}>{s.ad}</option>
                                    ))}
                                </select>
                            </div>
                        )}

                        <div>
                            <label className="text-zinc-400 text-sm mb-1.5 block">Başlangıç Tarihi</label>
                            <input type="date" value={form.baslangicTarihi} onChange={(e) => setForm({ ...form, baslangicTarihi: e.target.value })} className="w-full bg-zinc-800 border border-zinc-700 text-white rounded-lg px-3 py-2.5 text-sm outline-none focus:border-lime-400 transition-colors" />
                        </div>

                        <button
                            onClick={kaydet}
                            disabled={yukleniyor || (subeSecimiGerekli && !form.subeId)}
                            className="w-full bg-lime-400 hover:bg-lime-300 disabled:opacity-50 text-black font-bold rounded-lg py-2.5 text-sm transition-colors"
                        >
                            {yukleniyor ? 'Kaydediliyor...' : 'Kaydet'}
                        </button>
                    </div>
                </Modal>
            )}

            {maasModal && (
                <Modal baslik={maasDuzenleId ? 'Maaş Kaydını Güncelle' : 'Maaş Kaydı'} onKapat={() => setMaasModal(false)}>
                    <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="text-zinc-400 text-sm mb-1.5 block">Yıl</label>
                                <input
                                    type="number"
                                    value={maasForm.yil}
                                    onChange={(e) => maasFormYilAyDegistir(e.target.value, maasForm.ay)}
                                    className="w-full bg-zinc-800 border border-zinc-700 text-white rounded-lg px-3 py-2.5 text-sm outline-none focus:border-lime-400 transition-colors"
                                />
                            </div>
                            <div>
                                <label className="text-zinc-400 text-sm mb-1.5 block">Ay</label>
                                <select
                                    value={maasForm.ay}
                                    onChange={(e) => maasFormYilAyDegistir(maasForm.yil, e.target.value)}
                                    className="w-full bg-zinc-800 border border-zinc-700 text-white rounded-lg px-3 py-2.5 text-sm outline-none focus:border-lime-400 transition-colors"
                                >
                                    {aylar.slice(1).map((a, i) => <option key={i + 1} value={i + 1}>{a}</option>)}
                                </select>
                            </div>
                        </div>
                        {maasDuzenleId && (
                            <p className="text-xs text-lime-400 bg-lime-400/10 rounded-lg px-3 py-2">
                                Bu dönem için zaten bir kayıt var — üzerine kaydedersen mevcut kayıt güncellenecek.
                            </p>
                        )}
                        <div>
                            <label className="text-zinc-400 text-sm mb-1.5 block">Tutar (₺)</label>
                            <input type="text" inputMode="numeric" value={maasForm.tutar} onChange={(e) => setMaasForm({ ...maasForm, tutar: tamSayiTemizle(e.target.value) })} placeholder={secili?.maas} className="w-full bg-zinc-800 border border-zinc-700 text-white rounded-lg px-4 py-2.5 text-sm outline-none focus:border-lime-400 transition-colors" />
                        </div>
                        <div className="flex items-center gap-3">
                            <input type="checkbox" id="odendi" checked={maasForm.odendi} onChange={(e) => setMaasForm({ ...maasForm, odendi: e.target.checked })} className="w-4 h-4 accent-lime-400" />
                            <label htmlFor="odendi" className="text-zinc-400 text-sm">Ödendi olarak işaretle</label>
                        </div>
                        <button onClick={maasKaydet} disabled={yukleniyor} className="w-full bg-lime-400 hover:bg-lime-300 disabled:opacity-50 text-black font-bold rounded-lg py-2.5 text-sm transition-colors">
                            {yukleniyor ? 'Kaydediliyor...' : (maasDuzenleId ? 'Güncelle' : 'Kaydet')}
                        </button>
                    </div>
                </Modal>
            )}

            {avansModal && (
                <Modal baslik="Avans Kaydı" onKapat={() => setAvansModal(false)}>
                    <div className="space-y-4">
                        <div>
                            <label className="text-zinc-400 text-sm mb-1.5 block">Tutar (₺) *</label>
                            <input type="text" inputMode="numeric" value={avansForm.tutar} onChange={(e) => setAvansForm({ ...avansForm, tutar: tamSayiTemizle(e.target.value) })} className="w-full bg-zinc-800 border border-zinc-700 text-white rounded-lg px-4 py-2.5 text-sm outline-none focus:border-lime-400 transition-colors" />
                        </div>
                        <div>
                            <label className="text-zinc-400 text-sm mb-1.5 block">Açıklama</label>
                            <input value={avansForm.aciklama} onChange={(e) => setAvansForm({ ...avansForm, aciklama: e.target.value })} className="w-full bg-zinc-800 border border-zinc-700 text-white rounded-lg px-4 py-2.5 text-sm outline-none focus:border-lime-400 transition-colors" />
                        </div>
                        <div>
                            <label className="text-zinc-400 text-sm mb-1.5 block">Tarih</label>
                            <input type="date" value={avansForm.tarih} onChange={(e) => setAvansForm({ ...avansForm, tarih: e.target.value })} className="w-full bg-zinc-800 border border-zinc-700 text-white rounded-lg px-4 py-2.5 text-sm outline-none focus:border-lime-400 transition-colors" />
                        </div>
                        <button onClick={avansKaydet} disabled={yukleniyor} className="w-full bg-lime-400 hover:bg-lime-300 disabled:opacity-50 text-black font-bold rounded-lg py-2.5 text-sm transition-colors">
                            {yukleniyor ? 'Kaydediliyor...' : 'Kaydet'}
                        </button>
                    </div>
                </Modal>
            )}

            {devamModal && (
                <Modal baslik="Devam Kaydı" onKapat={() => setDevamModal(false)}>
                    <div className="space-y-4">
                        <div className="flex bg-zinc-800 rounded-lg p-1 gap-1">
                            <button
                                onClick={() => setDevamModu('tekGun')}
                                className={`flex-1 text-xs font-semibold py-2 rounded-md transition-colors ${devamModu === 'tekGun' ? 'bg-lime-400 text-black' : 'text-zinc-400 hover:text-white'}`}
                            >
                                Tek Gün
                            </button>
                            <button
                                onClick={() => setDevamModu('aralik')}
                                className={`flex-1 text-xs font-semibold py-2 rounded-md transition-colors ${devamModu === 'aralik' ? 'bg-lime-400 text-black' : 'text-zinc-400 hover:text-white'}`}
                            >
                                Tarih Aralığı
                            </button>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="text-zinc-400 text-sm mb-1.5 block">{devamModu === 'aralik' ? 'Başlangıç' : 'Tarih'}</label>
                                <input type="date" value={devamForm.tarih} onChange={(e) => setDevamForm({ ...devamForm, tarih: e.target.value })} className="w-full bg-zinc-800 border border-zinc-700 text-white rounded-lg px-3 py-2.5 text-sm outline-none focus:border-lime-400 transition-colors" />
                            </div>
                            {devamModu === 'aralik' ? (
                                <div>
                                    <label className="text-zinc-400 text-sm mb-1.5 block">Bitiş</label>
                                    <input type="date" value={devamForm.bitisTarihi} onChange={(e) => setDevamForm({ ...devamForm, bitisTarihi: e.target.value })} className="w-full bg-zinc-800 border border-zinc-700 text-white rounded-lg px-3 py-2.5 text-sm outline-none focus:border-lime-400 transition-colors" />
                                </div>
                            ) : (
                                <div>
                                    <label className="text-zinc-400 text-sm mb-1.5 block">Durum</label>
                                    <select value={devamForm.durum} onChange={(e) => setDevamForm({ ...devamForm, durum: e.target.value, mesai: e.target.value === 'CALISTI' ? devamForm.mesai : '' })} className="w-full bg-zinc-800 border border-zinc-700 text-white rounded-lg px-3 py-2.5 text-sm outline-none focus:border-lime-400 transition-colors">
                                        <option value="CALISTI">Çalıştı</option>
                                        <option value="IZIN">İzin</option>
                                        <option value="RAPOR">Rapor</option>
                                        <option value="DEVAMSIZ">Devamsız</option>
                                    </select>
                                </div>
                            )}
                        </div>

                        {devamModu === 'aralik' && (
                            <div>
                                <label className="text-zinc-400 text-sm mb-1.5 block">Durum</label>
                                <select value={devamForm.durum} onChange={(e) => setDevamForm({ ...devamForm, durum: e.target.value, mesai: e.target.value === 'CALISTI' ? devamForm.mesai : '' })} className="w-full bg-zinc-800 border border-zinc-700 text-white rounded-lg px-3 py-2.5 text-sm outline-none focus:border-lime-400 transition-colors">
                                    <option value="CALISTI">Çalıştı</option>
                                    <option value="IZIN">İzin</option>
                                    <option value="RAPOR">Rapor</option>
                                    <option value="DEVAMSIZ">Devamsız</option>
                                </select>
                            </div>
                        )}

                        {devamForm.durum === 'CALISTI' && (
                            <div>
                                <label className="text-zinc-400 text-sm mb-1.5 block">Mesai (saat{devamModu === 'aralik' ? ' — her gün için' : ''})</label>
                                <input type="text" inputMode="decimal" value={devamForm.mesai} onChange={(e) => setDevamForm({ ...devamForm, mesai: ondalikSayiTemizle(e.target.value) })} placeholder="0" className="w-full bg-zinc-800 border border-zinc-700 text-white rounded-lg px-4 py-2.5 text-sm outline-none focus:border-lime-400 transition-colors" />
                            </div>
                        )}
                        {devamForm.durum === 'IZIN' && (
                            <p className="text-xs text-lime-400 bg-lime-400/10 rounded-lg px-3 py-2">
                                {devamModu === 'aralik'
                                    ? 'Bu aralıktaki her gün, yıllık izin sayacına otomatik olarak eklenecek.'
                                    : 'Bu kayıt, yıllık izin sayacına otomatik olarak 1 gün ekleyecek.'}
                            </p>
                        )}
                        <div>
                            <label className="text-zinc-400 text-sm mb-1.5 block">Açıklama</label>
                            <input value={devamForm.aciklama} onChange={(e) => setDevamForm({ ...devamForm, aciklama: e.target.value })} className="w-full bg-zinc-800 border border-zinc-700 text-white rounded-lg px-4 py-2.5 text-sm outline-none focus:border-lime-400 transition-colors" />
                        </div>
                        <button onClick={devamKaydet} disabled={yukleniyor} className="w-full bg-lime-400 hover:bg-lime-300 disabled:opacity-50 text-black font-bold rounded-lg py-2.5 text-sm transition-colors">
                            {yukleniyor ? 'Kaydediliyor...' : (devamModu === 'aralik' ? 'Aralığı Kaydet' : 'Kaydet')}
                        </button>
                    </div>
                </Modal>
            )}

            {izinModal && (
                <Modal baslik="İzin Düzeltmesi" onKapat={() => setIzinModal(false)}>
                    <div className="space-y-4">
                        <div>
                            <label className="text-zinc-400 text-sm mb-1.5 block">Yıl</label>
                            <input type="number" value={izinForm.yil} onChange={(e) => setIzinForm({ ...izinForm, yil: e.target.value })} className="w-full bg-zinc-800 border border-zinc-700 text-white rounded-lg px-3 py-2.5 text-sm outline-none focus:border-lime-400 transition-colors" />
                        </div>
                        <div>
                            <label className="text-zinc-400 text-sm mb-1.5 block">Düzeltme (gün) *</label>
                            <input
                                type="text"
                                inputMode="decimal"
                                value={izinForm.kullanilanGun}
                                onChange={(e) => {
                                    const negatif = e.target.value.trim().startsWith('-');
                                    const temiz = ondalikSayiTemizle(e.target.value);
                                    setIzinForm({ ...izinForm, kullanilanGun: negatif ? `-${temiz}` : temiz });
                                }}
                                className="w-full bg-zinc-800 border border-zinc-700 text-white rounded-lg px-4 py-2.5 text-sm outline-none focus:border-lime-400 transition-colors"
                            />
                            <p className="text-xs text-zinc-500 mt-1">
                                Bu, Devam Kaydı'ndan otomatik sayılan izin gününe <b>eklenecek</b> (veya negatif girilirse <b>çıkarılacak</b>) ek miktardır — toplam kullanılan gün değildir.
                            </p>
                        </div>
                        <div>
                            <label className="text-zinc-400 text-sm mb-1.5 block">Açıklama</label>
                            <input value={izinForm.aciklama} onChange={(e) => setIzinForm({ ...izinForm, aciklama: e.target.value })} placeholder="Örn. Geçen yıldan devreden izin" className="w-full bg-zinc-800 border border-zinc-700 text-white rounded-lg px-4 py-2.5 text-sm outline-none focus:border-lime-400 transition-colors" />
                        </div>
                        <button onClick={izinKaydet} disabled={yukleniyor} className="w-full bg-lime-400 hover:bg-lime-300 disabled:opacity-50 text-black font-bold rounded-lg py-2.5 text-sm transition-colors">
                            {yukleniyor ? 'Kaydediliyor...' : 'Kaydet'}
                        </button>
                    </div>
                </Modal>
            )}
        </div>
    );
}