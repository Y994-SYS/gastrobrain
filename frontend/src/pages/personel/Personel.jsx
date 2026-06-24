import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import api from '../../services/api';
import Modal from '../../components/Modal';
import SubeSecici from '../../components/SubeSecici';
import useSubeStore from '../../store/subeStore';

const bosPersonel = {
    ad: '', soyad: '', telefon: '', tcKimlik: '',
    baslangicTarihi: new Date().toISOString().split('T')[0],
    maas: '', subeId: ''
};

export default function Personel() {
    const { seciliSubeId, subeParam } = useSubeStore();
    const [veri, setVeri] = useState([]);
    const [secili, setSecili] = useState(null);
    const [personelModal, setPersonelModal] = useState(false);
    const [maasModal, setMaasModal] = useState(false);
    const [avansModal, setAvansModal] = useState(false);
    const [devamModal, setDevamModal] = useState(false);
    const [form, setForm] = useState(bosPersonel);
    const [duzenleId, setDuzenleId] = useState(null);
    const [yukleniyor, setYukleniyor] = useState(false);

    const buAy = new Date().getMonth() + 1;
    const buYil = new Date().getFullYear();

    const [maasForm, setMaasForm] = useState({
        yil: buYil, ay: buAy, tutar: '', odendi: false,
        tarih: new Date().toISOString().split('T')[0]
    });
    const [avansForm, setAvansForm] = useState({
        tutar: '', aciklama: '',
        tarih: new Date().toISOString().split('T')[0]
    });
    const [devamForm, setDevamForm] = useState({
        tarih: new Date().toISOString().split('T')[0],
        durum: 'CALISTI', mesai: '', aciklama: ''
    });

    const getir = async () => {
        try {
            const res = await api.get(`/api/personel${subeParam()}`);
            setVeri(res.data.data);
        } catch (err) {
            console.error('Personel listesi alınamadı:', err);
        }
    };

    const personelDetay = async (p) => {
        try {
            const res = await api.get(`/api/personel/${p.id}`);
            setSecili(res.data.data);
        } catch (err) {
            console.error('Personel detayı alınamadı:', err);
        }
    };

    useEffect(() => { getir(); }, [seciliSubeId]);

    const kaydet = async () => {
        if (!form.ad || !form.soyad || !form.maas) return toast.error('Ad, soyad ve maaş zorunlu');
        setYukleniyor(true);
        try {
            if (duzenleId) {
                await api.put(`/api/personel/${duzenleId}`, form);
                setVeri(prev => prev.map(p =>
                    p.id === duzenleId ? { ...p, ...form, maas: Number(form.maas) } : p
                ));
                if (secili?.id === duzenleId) {
                    setSecili(prev => ({ ...prev, ...form, maas: Number(form.maas) }));
                }
                toast.success('Güncellendi');
            } else {
                const res = await api.post('/api/personel', form);
                setVeri(prev => [...prev, res.data.data]);
                toast.success('Personel eklendi');
            }
            setPersonelModal(false);
            setForm(bosPersonel);
            setDuzenleId(null);
        } catch (err) {
            toast.error(err.response?.data?.mesaj || 'Hata oluştu');
        } finally {
            setYukleniyor(false);
        }
    };

    const duzenle = (p) => {
        setForm({
            ad: p.ad, soyad: p.soyad, telefon: p.telefon || '',
            tcKimlik: p.tcKimlik || '', maas: p.maas, subeId: p.subeId,
            baslangicTarihi: new Date(p.baslangicTarihi).toISOString().split('T')[0]
        });
        setDuzenleId(p.id);
        setPersonelModal(true);
    };

    const sil = async (id) => {
        if (!confirm('Personeli silmek istediğine emin misin?')) return;
        const silinen = veri.find(p => p.id === id);
        setVeri(prev => prev.filter(p => p.id !== id));
        if (secili?.id === id) setSecili(null);
        try {
            await api.delete(`/api/personel/${id}`);
            toast.success('Silindi');
        } catch (err) {
            setVeri(prev => [...prev, silinen]);
            toast.error(err.response?.data?.mesaj || 'Silinemedi');
        }
    };

    const maasKaydet = async () => {
        if (!maasForm.tutar) return toast.error('Tutar zorunlu');
        setYukleniyor(true);
        const yeniMaas = { id: Date.now(), ...maasForm, tutar: Number(maasForm.tutar), _gecici: true };
        setSecili(prev => ({ ...prev, maaslar: [yeniMaas, ...(prev.maaslar || [])] }));
        setMaasModal(false);
        try {
            const res = await api.post('/api/personel/maas', { ...maasForm, personelId: secili.id });
            setSecili(prev => ({
                ...prev,
                maaslar: prev.maaslar.map(m => m.id === yeniMaas.id ? res.data.data : m)
            }));
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
            setSecili(prev => ({
                ...prev,
                avanslar: prev.avanslar.map(a => a.id === yeniAvans.id ? res.data.data : a)
            }));
            toast.success('Avans kaydedildi');
        } catch (err) {
            setSecili(prev => ({ ...prev, avanslar: prev.avanslar.filter(a => a.id !== yeniAvans.id) }));
            setAvansModal(true);
            toast.error(err.response?.data?.mesaj || 'Hata oluştu');
        } finally {
            setYukleniyor(false);
        }
    };

    const devamKaydet = async () => {
        setYukleniyor(true);
        const yeniDevam = { id: Date.now(), ...devamForm, mesai: Number(devamForm.mesai), _gecici: true };
        setSecili(prev => ({ ...prev, devamlar: [yeniDevam, ...(prev.devamlar || [])] }));
        setDevamModal(false);
        try {
            const res = await api.post('/api/personel/devam', { ...devamForm, personelId: secili.id });
            setSecili(prev => ({
                ...prev,
                devamlar: prev.devamlar.map(d => d.id === yeniDevam.id ? res.data.data : d)
            }));
            toast.success('Devam kaydedildi');
        } catch (err) {
            setSecili(prev => ({ ...prev, devamlar: prev.devamlar.filter(d => d.id !== yeniDevam.id) }));
            setDevamModal(true);
            toast.error(err.response?.data?.mesaj || 'Hata oluştu');
        } finally {
            setYukleniyor(false);
        }
    };

    const durumRenk = (durum) => {
        const renkler = { CALISTI: 'text-lime-400', IZIN: 'text-blue-400', RAPOR: 'text-orange-400', DEVAMSIZ: 'text-red-400' };
        return renkler[durum] || 'text-zinc-400';
    };

    const aylar = ['', 'Oca', 'Şub', 'Mar', 'Nis', 'May', 'Haz', 'Tem', 'Ağu', 'Eyl', 'Eki', 'Kas', 'Ara'];

    return (
        <div>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-3">
                <div>
                    <h1 className="text-xl font-bold text-white">Personel</h1>
                    <p className="text-zinc-500 text-sm mt-0.5">{veri.length} personel</p>
                </div>
                <button
                    onClick={() => { setForm(bosPersonel); setDuzenleId(null); setPersonelModal(true); }}
                    className="bg-lime-400 hover:bg-lime-300 text-black font-bold text-sm px-4 py-2 rounded-lg transition-colors"
                >
                    + Yeni Personel
                </button>
            </div>

            <SubeSecici />

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden">
                    <div className="p-4 border-b border-zinc-800">
                        <h2 className="text-sm font-bold text-white">Personeller</h2>
                    </div>
                    <div className="divide-y divide-zinc-800">
                        {veri.length === 0 ? (
                            <div className="text-center py-10 text-zinc-500 text-sm">Personel yok</div>
                        ) : veri.map((p) => (
                            <div
                                key={p.id}
                                onClick={() => personelDetay(p)}
                                className={`p-4 cursor-pointer hover:bg-zinc-800/50 transition-colors ${secili?.id === p.id ? 'bg-zinc-800' : ''}`}
                            >
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
                        <div className="space-y-4">
                            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5">
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
                                        <button onClick={() => setMaasModal(true)} className="text-xs border border-zinc-700 text-zinc-400 hover:text-lime-400 hover:border-lime-400 px-3 py-1.5 rounded-lg transition-colors">💰 Maaş</button>
                                        <button onClick={() => setAvansModal(true)} className="text-xs border border-zinc-700 text-zinc-400 hover:text-orange-400 hover:border-orange-400 px-3 py-1.5 rounded-lg transition-colors">💳 Avans</button>
                                        <button onClick={() => setDevamModal(true)} className="text-xs border border-zinc-700 text-zinc-400 hover:text-blue-400 hover:border-blue-400 px-3 py-1.5 rounded-lg transition-colors">📋 Devam</button>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden">
                                <div className="p-4 border-b border-zinc-800">
                                    <h3 className="text-sm font-bold text-white">Maaş Geçmişi</h3>
                                </div>
                                <div className="divide-y divide-zinc-800 max-h-40 overflow-y-auto">
                                    {secili.maaslar?.length === 0 ? (
                                        <div className="text-center py-6 text-zinc-500 text-xs">Maaş kaydı yok</div>
                                    ) : secili.maaslar?.map((m) => (
                                        <div key={m.id} className={`px-4 py-2.5 flex justify-between items-center ${m._gecici ? 'opacity-60' : ''}`}>
                                            <div className="flex items-center gap-2">
                                                <span className="text-sm text-zinc-300">{aylar[m.ay]} {m.yil}</span>
                                                {m._gecici && <span className="text-xs text-zinc-600">kaydediliyor...</span>}
                                            </div>
                                            <div className="flex items-center gap-3">
                                                <span className="text-sm font-mono text-white">₺{m.tutar}</span>
                                                <span className={`text-xs px-2 py-0.5 rounded-full ${m.odendi ? 'bg-lime-400/10 text-lime-400' : 'bg-red-400/10 text-red-400'}`}>
                                                    {m.odendi ? 'Ödendi' : 'Bekliyor'}
                                                </span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden">
                                <div className="p-4 border-b border-zinc-800">
                                    <h3 className="text-sm font-bold text-white">Avans Geçmişi</h3>
                                </div>
                                <div className="divide-y divide-zinc-800 max-h-40 overflow-y-auto">
                                    {secili.avanslar?.length === 0 ? (
                                        <div className="text-center py-6 text-zinc-500 text-xs">Avans kaydı yok</div>
                                    ) : secili.avanslar?.map((a) => (
                                        <div key={a.id} className={`px-4 py-2.5 flex justify-between items-center ${a._gecici ? 'opacity-60' : ''}`}>
                                            <div>
                                                <div className="flex items-center gap-2">
                                                    <span className="text-sm text-zinc-300">{a.aciklama || 'Avans'}</span>
                                                    {a._gecici && <span className="text-xs text-zinc-600">kaydediliyor...</span>}
                                                </div>
                                                <div className="text-xs text-zinc-500">{new Date(a.tarih).toLocaleDateString('tr-TR')}</div>
                                            </div>
                                            <span className="text-sm font-mono text-orange-400">₺{a.tutar}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden">
                                <div className="p-4 border-b border-zinc-800">
                                    <h3 className="text-sm font-bold text-white">Devam Durumu</h3>
                                </div>
                                <div className="divide-y divide-zinc-800 max-h-40 overflow-y-auto">
                                    {secili.devamlar?.length === 0 ? (
                                        <div className="text-center py-6 text-zinc-500 text-xs">Devam kaydı yok</div>
                                    ) : secili.devamlar?.map((d) => (
                                        <div key={d.id} className={`px-4 py-2.5 flex justify-between items-center ${d._gecici ? 'opacity-60' : ''}`}>
                                            <div className="flex items-center gap-3">
                                                <span className={`text-xs font-semibold ${durumRenk(d.durum)}`}>{d.durum}</span>
                                                {d._gecici && <span className="text-xs text-zinc-600">kaydediliyor...</span>}
                                                {d.mesai > 0 && <span className="text-xs text-zinc-500">{d.mesai} saat mesai</span>}
                                            </div>
                                            <span className="text-xs text-zinc-500">{new Date(d.tarih).toLocaleDateString('tr-TR')}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl flex items-center justify-center h-48 text-zinc-500 text-sm">
                            Soldaki listeden bir personel seç
                        </div>
                    )}
                </div>
            </div>

            {personelModal && (
                <Modal baslik={duzenleId ? 'Personel Düzenle' : 'Yeni Personel'} onKapat={() => setPersonelModal(false)}>
                    <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="text-zinc-400 text-sm mb-1.5 block">Ad *</label>
                                <input value={form.ad} onChange={(e) => setForm({ ...form, ad: e.target.value })} className="w-full bg-zinc-800 border border-zinc-700 text-white rounded-lg px-3 py-2.5 text-sm outline-none focus:border-lime-400 transition-colors" />
                            </div>
                            <div>
                                <label className="text-zinc-400 text-sm mb-1.5 block">Soyad *</label>
                                <input value={form.soyad} onChange={(e) => setForm({ ...form, soyad: e.target.value })} className="w-full bg-zinc-800 border border-zinc-700 text-white rounded-lg px-3 py-2.5 text-sm outline-none focus:border-lime-400 transition-colors" />
                            </div>
                            <div>
                                <label className="text-zinc-400 text-sm mb-1.5 block">Telefon</label>
                                <input value={form.telefon} onChange={(e) => setForm({ ...form, telefon: e.target.value })} className="w-full bg-zinc-800 border border-zinc-700 text-white rounded-lg px-3 py-2.5 text-sm outline-none focus:border-lime-400 transition-colors" />
                            </div>
                            <div>
                                <label className="text-zinc-400 text-sm mb-1.5 block">TC Kimlik</label>
                                <input value={form.tcKimlik} onChange={(e) => setForm({ ...form, tcKimlik: e.target.value })} className="w-full bg-zinc-800 border border-zinc-700 text-white rounded-lg px-3 py-2.5 text-sm outline-none focus:border-lime-400 transition-colors" />
                            </div>
                            <div>
                                <label className="text-zinc-400 text-sm mb-1.5 block">Maaş (₺) *</label>
                                <input type="number" value={form.maas} onChange={(e) => setForm({ ...form, maas: e.target.value })} className="w-full bg-zinc-800 border border-zinc-700 text-white rounded-lg px-3 py-2.5 text-sm outline-none focus:border-lime-400 transition-colors" />
                            </div>
                            <div>
                                <label className="text-zinc-400 text-sm mb-1.5 block">Başlangıç Tarihi</label>
                                <input type="date" value={form.baslangicTarihi} onChange={(e) => setForm({ ...form, baslangicTarihi: e.target.value })} className="w-full bg-zinc-800 border border-zinc-700 text-white rounded-lg px-3 py-2.5 text-sm outline-none focus:border-lime-400 transition-colors" />
                            </div>
                        </div>
                        <button onClick={kaydet} disabled={yukleniyor} className="w-full bg-lime-400 hover:bg-lime-300 disabled:opacity-50 text-black font-bold rounded-lg py-2.5 text-sm transition-colors">
                            {yukleniyor ? 'Kaydediliyor...' : 'Kaydet'}
                        </button>
                    </div>
                </Modal>
            )}

            {maasModal && (
                <Modal baslik="Maaş Kaydı" onKapat={() => setMaasModal(false)}>
                    <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="text-zinc-400 text-sm mb-1.5 block">Yıl</label>
                                <input type="number" value={maasForm.yil} onChange={(e) => setMaasForm({ ...maasForm, yil: e.target.value })} className="w-full bg-zinc-800 border border-zinc-700 text-white rounded-lg px-3 py-2.5 text-sm outline-none focus:border-lime-400 transition-colors" />
                            </div>
                            <div>
                                <label className="text-zinc-400 text-sm mb-1.5 block">Ay</label>
                                <select value={maasForm.ay} onChange={(e) => setMaasForm({ ...maasForm, ay: e.target.value })} className="w-full bg-zinc-800 border border-zinc-700 text-white rounded-lg px-3 py-2.5 text-sm outline-none focus:border-lime-400 transition-colors">
                                    {aylar.slice(1).map((a, i) => <option key={i + 1} value={i + 1}>{a}</option>)}
                                </select>
                            </div>
                        </div>
                        <div>
                            <label className="text-zinc-400 text-sm mb-1.5 block">Tutar (₺)</label>
                            <input type="number" value={maasForm.tutar} onChange={(e) => setMaasForm({ ...maasForm, tutar: e.target.value })} placeholder={secili?.maas} className="w-full bg-zinc-800 border border-zinc-700 text-white rounded-lg px-4 py-2.5 text-sm outline-none focus:border-lime-400 transition-colors" />
                        </div>
                        <div className="flex items-center gap-3">
                            <input type="checkbox" id="odendi" checked={maasForm.odendi} onChange={(e) => setMaasForm({ ...maasForm, odendi: e.target.checked })} className="w-4 h-4 accent-lime-400" />
                            <label htmlFor="odendi" className="text-zinc-400 text-sm">Ödendi olarak işaretle</label>
                        </div>
                        <button onClick={maasKaydet} disabled={yukleniyor} className="w-full bg-lime-400 hover:bg-lime-300 disabled:opacity-50 text-black font-bold rounded-lg py-2.5 text-sm transition-colors">
                            {yukleniyor ? 'Kaydediliyor...' : 'Kaydet'}
                        </button>
                    </div>
                </Modal>
            )}

            {avansModal && (
                <Modal baslik="Avans Kaydı" onKapat={() => setAvansModal(false)}>
                    <div className="space-y-4">
                        <div>
                            <label className="text-zinc-400 text-sm mb-1.5 block">Tutar (₺) *</label>
                            <input type="number" value={avansForm.tutar} onChange={(e) => setAvansForm({ ...avansForm, tutar: e.target.value })} className="w-full bg-zinc-800 border border-zinc-700 text-white rounded-lg px-4 py-2.5 text-sm outline-none focus:border-lime-400 transition-colors" />
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
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="text-zinc-400 text-sm mb-1.5 block">Tarih</label>
                                <input type="date" value={devamForm.tarih} onChange={(e) => setDevamForm({ ...devamForm, tarih: e.target.value })} className="w-full bg-zinc-800 border border-zinc-700 text-white rounded-lg px-3 py-2.5 text-sm outline-none focus:border-lime-400 transition-colors" />
                            </div>
                            <div>
                                <label className="text-zinc-400 text-sm mb-1.5 block">Durum</label>
                                <select value={devamForm.durum} onChange={(e) => setDevamForm({ ...devamForm, durum: e.target.value })} className="w-full bg-zinc-800 border border-zinc-700 text-white rounded-lg px-3 py-2.5 text-sm outline-none focus:border-lime-400 transition-colors">
                                    <option value="CALISTI">Çalıştı</option>
                                    <option value="IZIN">İzin</option>
                                    <option value="RAPOR">Rapor</option>
                                    <option value="DEVAMSIZ">Devamsız</option>
                                </select>
                            </div>
                        </div>
                        <div>
                            <label className="text-zinc-400 text-sm mb-1.5 block">Mesai (saat)</label>
                            <input type="number" value={devamForm.mesai} onChange={(e) => setDevamForm({ ...devamForm, mesai: e.target.value })} placeholder="0" className="w-full bg-zinc-800 border border-zinc-700 text-white rounded-lg px-4 py-2.5 text-sm outline-none focus:border-lime-400 transition-colors" />
                        </div>
                        <div>
                            <label className="text-zinc-400 text-sm mb-1.5 block">Açıklama</label>
                            <input value={devamForm.aciklama} onChange={(e) => setDevamForm({ ...devamForm, aciklama: e.target.value })} className="w-full bg-zinc-800 border border-zinc-700 text-white rounded-lg px-4 py-2.5 text-sm outline-none focus:border-lime-400 transition-colors" />
                        </div>
                        <button onClick={devamKaydet} disabled={yukleniyor} className="w-full bg-lime-400 hover:bg-lime-300 disabled:opacity-50 text-black font-bold rounded-lg py-2.5 text-sm transition-colors">
                            {yukleniyor ? 'Kaydediliyor...' : 'Kaydet'}
                        </button>
                    </div>
                </Modal>
            )}
        </div>
    );
}