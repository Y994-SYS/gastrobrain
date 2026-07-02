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
            const { receteId, porsiyonSayisi, aciklama, tarih, zorla } = req.body;
            const tenantId = req.kullanici.tenantId;
            const subeId = req.kullanici.subeId;
            const rol = req.kullanici.rol;

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

            // zorla=true isteği ROL kontrolünden geçmiyorsa görmezden gelinir —
            // frontend'den gelen bayrağa asla körü körüne güvenilmez.
            const zorlamaYetkisiVar = zorla === true && ZORLA_IZINLI_ROLLER.includes(rol);
            const eksikKalemler = [];

            // Stok kontrolü — satış akışıyla aynı mantık: stokTakipZorunlu=false olan
            // kalemler (tuz, baharat vb.) kontrolden muaf; diğerleri yetersizse
            // yetkisiz kullanıcı için engellenir, yetkili kullanıcı zorla=true ile geçebilir.
            for (const kalem of recete.kalemler) {
                if (kalem.stokTakipZorunlu === false) continue;

                const gercekMiktar = ((kalem.miktar * (kalem.carpan || 1)) / (kalem.bolen || 1)) * oran;
                const mevcutStok = await stokService.mevcutStokGetir(kalem.stokKartId, subeId, tenantId);

                if (mevcutStok < gercekMiktar) {
                    if (zorlamaYetkisiVar) {
                        eksikKalemler.push({
                            ad: kalem.stokKart.ad,
                            mevcut: mevcutStok,
                            gereken: gercekMiktar
                        });
                        continue;
                    }
                    return res.status(400).json({
                        basarili: false,
                        mesaj: `Yetersiz stok: ${kalem.stokKart.ad} (mevcut: ${mevcutStok.toFixed(2)}, gereken: ${gercekMiktar.toFixed(2)})`
                    });
                }
            }

            // Açıklamaya net etiket eklenir — bu kaydın bir SATIŞ olmadığı,
            // mutfak içi üretim/tüketim olduğu raporlarda ayırt edilebilsin.
            // Aynı üretim için Satışlar ekranından AYRICA satış girilmemelidir —
            // aksi halde aynı malzemeler iki kez düşer.
            const zorlamaNotu = eksikKalemler.length
                ? ` [ZORLA KAYDEDİLDİ — yetersiz: ${eksikKalemler.map(k => k.ad).join(', ')}]`
                : '';
            const varsayilanAciklama = `MUTFAK ÜRETİMİ (satış değildir) — ${recete.ad} x${porsiyonSayisi} porsiyon${zorlamaNotu}`;

            const kaydedilenler = await prisma.$transaction(
                recete.kalemler.map(kalem => {
                    const gercekMiktar = ((kalem.miktar * (kalem.carpan || 1)) / (kalem.bolen || 1)) * oran;
                    return prisma.stokHareket.create({
                        data: {
                            tip: 'TUKETIM',
                            miktar: Math.round(gercekMiktar * 1000) / 1000,
                            aciklama: (aciklama || varsayilanAciklama) + (aciklama ? zorlamaNotu : ''),
                            tarih: tarihObj,
                            stokKartId: kalem.stokKartId,
                            subeId: Number(subeId),
                        }
                    });
                })
            );

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