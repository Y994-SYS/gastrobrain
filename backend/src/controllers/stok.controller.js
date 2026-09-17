const { PrismaClient, Prisma } = require('@prisma/client');
const stokService = require('../services/stok.service');
const auditLog = require('../services/auditLog.service');
const prisma = new PrismaClient();

// Şube ID'sini belirle — MUDUR/DEPO/KASA/PERSONEL her zaman kendi şubesini
// görür. TENANT_ADMIN query'den subeId gelirse onu kullanır, gelmezse
// null döner (= "Tüm Şubeler" — tumStokDurumu bu durumda filtrelemeden
// tüm hareketleri toplu hesaplıyor). Önceki hâlde bu son durumda
// req.kullanici.subeId'ye (adminin kendi atanmış şubesine) düşülüyordu,
// bu da "Tüm Şubeler" seçiliyken tek bir şubenin rakamının gösterilip
// diğer şubelerin hiç toplanmamasına yol açıyordu.
const subeIdBelirle = (req) => {
    const rol = req.kullanici.rol;
    if (rol === 'MUDUR' || rol === 'DEPO' || rol === 'KASA' || rol === 'PERSONEL') {
        return req.kullanici.subeId;
    }
    // TENANT_ADMIN — query'den gelirse onu kullan, gelmezse null (tüm şubeler)
    return req.query.subeId ? Number(req.query.subeId) : null;
};

// Stok yetersizliğini bilerek geçebilecek roller — satis.service.js ile aynı liste.
const ZORLA_IZINLI_ROLLER = ['TENANT_ADMIN', 'ADMIN', 'MUDUR'];

const stokController = {

    async hareketleriGetir(req, res) {
        try {
            const data = await stokService.hareketleriGetir(req.query.stokKartId, req.kullanici.tenantId);
            res.json({ basarili: true, data });
        } catch (error) {
            res.status(500).json({ basarili: false, mesaj: error.message });
        }
    },

    async tumStokDurumu(req, res) {
        try {
            const subeId = subeIdBelirle(req);
            const data = await stokService.tumStokDurumu(subeId, req.kullanici.tenantId);
            res.json({ basarili: true, data });
        } catch (error) {
            res.status(500).json({ basarili: false, mesaj: error.message });
        }
    },

    async mevcutStokGetir(req, res) {
        try {
            const { stokKartId, subeId } = req.params;
            const miktar = await stokService.mevcutStokGetir(stokKartId, subeId, req.kullanici.tenantId);
            res.json({ basarili: true, data: { miktar } });
        } catch (error) {
            res.status(500).json({ basarili: false, mesaj: error.message });
        }
    },

    async girisFaturasiEkle(req, res) {
        try {
            if (!req.body.subeId) req.body.subeId = req.kullanici.subeId;
            const data = await stokService.girisFaturasiEkle(req.body, req.kullanici.tenantId);
            await auditLog.kaydet({
                eylem: 'STOK_GIRIS_FATURA',
                detay: { stokKartId: req.body.stokKartId, miktar: req.body.miktar, birimFiyat: req.body.birimFiyat },
                kullaniciId: req.kullanici.id,
                tenantId: req.kullanici.tenantId,
                ip: req.ip
            });
            res.status(201).json({ basarili: true, data });
        } catch (error) {
            res.status(400).json({ basarili: false, mesaj: error.message });
        }
    },

    async iadeFaturasiEkle(req, res) {
        try {
            if (!req.body.subeId) req.body.subeId = req.kullanici.subeId;
            const data = await stokService.iadeFaturasiEkle(req.body, req.kullanici.tenantId);
            await auditLog.kaydet({
                eylem: 'STOK_IADE_FATURA',
                detay: { stokKartId: req.body.stokKartId, miktar: req.body.miktar },
                kullaniciId: req.kullanici.id,
                tenantId: req.kullanici.tenantId,
                ip: req.ip
            });
            res.status(201).json({ basarili: true, data });
        } catch (error) {
            res.status(400).json({ basarili: false, mesaj: error.message });
        }
    },

    // GÜVENLİK: TOCTOU race condition düzeltmesi sonrası, eşzamanlı çakışma
    // durumunda stok.service.js P2034 (Prisma serializable conflict) hatası
    // fırlatabiliyor — bunu ayrı yakalayıp anlamlı bir 409 dönüyoruz.
    async zayiEkle(req, res) {
        try {
            if (!req.body.subeId) req.body.subeId = req.kullanici.subeId;
            const data = await stokService.zayiEkle(req.body, req.kullanici.tenantId);
            await auditLog.kaydet({
                eylem: 'STOK_ZAYI',
                detay: { stokKartId: req.body.stokKartId, miktar: req.body.miktar },
                kullaniciId: req.kullanici.id,
                tenantId: req.kullanici.tenantId,
                ip: req.ip
            });
            res.status(201).json({ basarili: true, data });
        } catch (error) {
            if (error.code === 'P2034') {
                return res.status(409).json({
                    basarili: false,
                    mesaj: 'Bu stok kartı üzerinde eşzamanlı bir işlem tespit edildi. Lütfen tekrar deneyin.'
                });
            }
            res.status(400).json({ basarili: false, mesaj: error.message });
        }
    },

    async tuketimEkle(req, res) {
        try {
            if (!req.body.subeId) req.body.subeId = req.kullanici.subeId;
            const data = await stokService.tuketimEkle(req.body, req.kullanici.tenantId);
            await auditLog.kaydet({
                eylem: 'STOK_TUKETIM',
                detay: { stokKartId: req.body.stokKartId, miktar: req.body.miktar },
                kullaniciId: req.kullanici.id,
                tenantId: req.kullanici.tenantId,
                ip: req.ip
            });
            res.status(201).json({ basarili: true, data });
        } catch (error) {
            if (error.code === 'P2034') {
                return res.status(409).json({
                    basarili: false,
                    mesaj: 'Bu stok kartı üzerinde eşzamanlı bir işlem tespit edildi. Lütfen tekrar deneyin.'
                });
            }
            res.status(400).json({ basarili: false, mesaj: error.message });
        }
    },

    // DÜZELTME (güvenlik — TOCTOU): Önceden stok yeterlilik kontrolü
    // (mevcutStokGetir) HAM prisma istemcisiyle yapılıyor, ardından yazma
    // AYRI bir $transaction (dizi formunda, kilit garantisi olmayan) ile
    // yapılıyordu. Bu iki adım arasında zaman farkı var — aynı reçeteyi
    // (veya aynı malzemeyi paylaşan farklı reçeteleri) aynı anda üreten
    // iki istek, ikisi de "stok yeterli" görüp ikisi de yazabiliyordu;
    // toplamda stok negatife düşebiliyordu. Bu, zayiEkle/tuketimEkle'de
    // (aynı dosya) ÇOK ÖNCEDEN düzeltilmiş olan AYNI hata sınıfıydı —
    // tuketimRecete bu düzeltmeyi almamıştı. Artık kontrol ve yazma TEK
    // bir serializable transaction (tx) içinde yapılıyor; eşzamanlı
    // çakışmada Prisma P2034 fırlatır, bunu diğer fonksiyonlarla aynı
    // şekilde 409 olarak yakalıyoruz.
    //
    // Ayrıca: subeId (TENANT_ADMIN için req.kullanici.subeId boş olabilir)
    // artık işleme başlamadan önce doğrulanıyor — boşsa Number(undefined)
    // = NaN ile devam edip belirsiz bir 500/FK hatası almak yerine, net
    // bir 400 dönülüyor.
    async tuketimRecete(req, res) {
        try {
            const { receteId, porsiyonSayisi, aciklama, tarih, zorla } = req.body;
            const tenantId = req.kullanici.tenantId;
            const subeId = req.kullanici.subeId;
            const rol = req.kullanici.rol;

            if (!receteId || !porsiyonSayisi || Number(porsiyonSayisi) <= 0) {
                return res.status(400).json({ basarili: false, mesaj: 'Reçete ve porsiyon sayısı zorunlu' });
            }
            if (!subeId) {
                return res.status(400).json({ basarili: false, mesaj: 'Şube seçimi zorunlu' });
            }

            const recete = await prisma.recete.findFirst({
                where: { id: Number(receteId), tenantId },
                include: {
                    kalemler: {
                        include: { stokKart: { include: { birim: true } } }
                    }
                }
            });

            if (!recete) return res.status(404).json({ basarili: false, mesaj: 'Reçete bulunamadı' });
            if (!recete.kalemler.length) return res.status(400).json({ basarili: false, mesaj: 'Reçetede kalem yok' });

            const tarihObj = tarih ? new Date(tarih) : new Date();

            const receteninKendiPorsiyonu = recete.porsiyonSayisi || 1;
            const oran = Number(porsiyonSayisi) / receteninKendiPorsiyonu;

            const zorlamaYetkisiVar = zorla === true && ZORLA_IZINLI_ROLLER.includes(rol);

            const sonuc = await prisma.$transaction(async (tx) => {
                const eksikKalemler = [];

                for (const kalem of recete.kalemler) {
                    if (kalem.stokTakipZorunlu === false) continue;

                    const gercekMiktar = ((kalem.miktar * (kalem.carpan || 1)) / (kalem.bolen || 1)) * oran;
                    const hareketler = await tx.stokHareket.findMany({
                        where: {
                            stokKartId: kalem.stokKartId,
                            stokKart: { tenantId },
                            subeId: Number(subeId),
                        }
                    });
                    const mevcutStok = stokService.bakiyeHesapla(hareketler);

                    if (mevcutStok < gercekMiktar) {
                        if (zorlamaYetkisiVar) {
                            eksikKalemler.push({
                                ad: kalem.stokKart.ad,
                                mevcut: mevcutStok,
                                gereken: gercekMiktar
                            });
                            continue;
                        }
                        // Transaction'ı iptal etmek için hata fırlat —
                        // catch bloğunda mesaj/kod ayrıştırılıp anlamlı
                        // bir 400 dönülecek.
                        const hata = new Error(
                            `Yetersiz stok: ${kalem.stokKart.ad} (mevcut: ${mevcutStok.toFixed(2)}, gereken: ${gercekMiktar.toFixed(2)})`
                        );
                        hata.yetersizStok = true;
                        throw hata;
                    }
                }

                const zorlamaNotu = eksikKalemler.length
                    ? ` [ZORLA KAYDEDİLDİ — yetersiz: ${eksikKalemler.map(k => k.ad).join(', ')}]`
                    : '';
                const varsayilanAciklama = `MUTFAK ÜRETİMİ (satış değildir) — ${recete.ad} x${porsiyonSayisi} porsiyon${zorlamaNotu}`;

                const kaydedilenler = [];
                for (const kalem of recete.kalemler) {
                    if (kalem.stokTakipZorunlu === false) continue;
                    const gercekMiktar = ((kalem.miktar * (kalem.carpan || 1)) / (kalem.bolen || 1)) * oran;
                    const hareket = await tx.stokHareket.create({
                        data: {
                            tip: 'TUKETIM',
                            miktar: Math.round(gercekMiktar * 1000) / 1000,
                            aciklama: (aciklama || varsayilanAciklama) + (aciklama ? zorlamaNotu : ''),
                            tarih: tarihObj,
                            stokKartId: kalem.stokKartId,
                            subeId: Number(subeId),
                        }
                    });
                    kaydedilenler.push(hareket);
                }

                return { kaydedilenler, eksikKalemler };
            }, {
                isolation: Prisma.TransactionIsolationLevel.Serializable,
                maxWait: 5000,
                timeout: 10000,
            });

            const { kaydedilenler, eksikKalemler } = sonuc;

            await auditLog.kaydet({
                eylem: eksikKalemler.length ? 'STOK_TUKETIM_RECETE_ZORLA' : 'STOK_TUKETIM_RECETE',
                detay: {
                    receteId, receteAd: recete.ad, porsiyonSayisi, kalemSayisi: kaydedilenler.length,
                    ...(eksikKalemler.length ? { eksikKalemler } : {})
                },
                kullaniciId: req.kullanici.id,
                tenantId,
                ip: req.ip
            });

            res.status(201).json({
                basarili: true,
                mesaj: `${recete.ad} — ${porsiyonSayisi} porsiyon için ${kaydedilenler.length} kalem düşüldü`,
                kalemSayisi: kaydedilenler.length,
                zorlandi: eksikKalemler.length > 0,
                eksikKalemler,
            });
        } catch (error) {
            if (error.code === 'P2034') {
                return res.status(409).json({
                    basarili: false,
                    mesaj: 'Bu reçete üzerinde eşzamanlı bir işlem tespit edildi. Lütfen tekrar deneyin.'
                });
            }
            if (error.yetersizStok) {
                return res.status(400).json({ basarili: false, mesaj: error.message });
            }
            res.status(500).json({ basarili: false, mesaj: error.message });
        }
    },

    async aySonuSayimEkle(req, res) {
        try {
            if (!req.body.subeId) req.body.subeId = req.kullanici.subeId;
            const data = await stokService.aySonuSayimEkle(req.body, req.kullanici.tenantId);
            await auditLog.kaydet({
                eylem: 'STOK_AY_SONU_SAYIM',
                detay: { stokKartId: req.body.stokKartId, sayimMiktari: req.body.sayimMiktari },
                kullaniciId: req.kullanici.id,
                tenantId: req.kullanici.tenantId,
                ip: req.ip
            });
            res.status(201).json({ basarili: true, data });
        } catch (error) {
            if (error.code === 'P2034') {
                return res.status(409).json({
                    basarili: false,
                    mesaj: 'Bu stok kartı üzerinde eşzamanlı bir işlem tespit edildi. Lütfen tekrar deneyin.'
                });
            }
            res.status(400).json({ basarili: false, mesaj: error.message });
        }
    }
};

module.exports = stokController;