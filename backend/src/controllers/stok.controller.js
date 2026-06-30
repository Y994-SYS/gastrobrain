const { PrismaClient } = require('@prisma/client');
const stokService = require('../services/stok.service');
const auditLog = require('../services/auditLog.service');
const prisma = new PrismaClient();

// Şube ID'sini belirle — MUDUR kendi şubesini görür, ADMIN query'den alır
const subeIdBelirle = (req) => {
    const rol = req.kullanici.rol;
    if (rol === 'MUDUR' || rol === 'DEPO' || rol === 'KASA' || rol === 'PERSONEL') {
        return req.kullanici.subeId;
    }
    // TENANT_ADMIN — query'den gelirse onu kullan, gelmezse null (tüm şubeler)
    return req.query.subeId ? Number(req.query.subeId) : req.kullanici.subeId;
};

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
            res.status(400).json({ basarili: false, mesaj: error.message });
        }
    },

    async tuketimRecete(req, res) {
        try {
            const { receteId, porsiyonSayisi, aciklama, tarih } = req.body;
            const tenantId = req.kullanici.tenantId;
            const subeId = req.kullanici.subeId;

            if (!receteId || !porsiyonSayisi || Number(porsiyonSayisi) <= 0) {
                return res.status(400).json({ basarili: false, mesaj: 'Reçete ve porsiyon sayısı zorunlu' });
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

            // Reçetenin kendi kazan porsiyonu (örn. 50) — kalem miktarları bu porsiyon için tanımlı.
            // Eğer reçetede porsiyonSayisi tanımlı değilse, kalemler "1 porsiyon" için kabul edilir (oran = girilen porsiyon).
            const receteninKendiPorsiyonu = recete.porsiyonSayisi || 1;
            const oran = Number(porsiyonSayisi) / receteninKendiPorsiyonu;

            const kaydedilenler = await prisma.$transaction(
                recete.kalemler.map(kalem => {
                    const gercekMiktar = ((kalem.miktar * (kalem.carpan || 1)) / (kalem.bolen || 1)) * oran;
                    return prisma.stokHareket.create({
                        data: {
                            tip: 'TUKETIM',
                            miktar: Math.round(gercekMiktar * 1000) / 1000,
                            aciklama: aciklama || `Reçete tüketimi: ${recete.ad} x${porsiyonSayisi} porsiyon`,
                            tarih: tarihObj,
                            stokKartId: kalem.stokKartId,
                            subeId: Number(subeId),
                        }
                    });
                })
            );

            await auditLog.kaydet({
                eylem: 'STOK_TUKETIM_RECETE',
                detay: { receteId, receteAd: recete.ad, porsiyonSayisi, kalemSayisi: kaydedilenler.length },
                kullaniciId: req.kullanici.id,
                tenantId,
                ip: req.ip
            });

            res.status(201).json({
                basarili: true,
                mesaj: `${recete.ad} — ${porsiyonSayisi} porsiyon için ${kaydedilenler.length} kalem düşüldü`,
                kalemSayisi: kaydedilenler.length,
            });
        } catch (error) {
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
            res.status(400).json({ basarili: false, mesaj: error.message });
        }
    }
};

module.exports = stokController;