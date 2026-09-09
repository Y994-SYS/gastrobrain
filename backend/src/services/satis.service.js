const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Stok yetersizliğini bilerek geçebilecek roller
const ZORLA_IZINLI_ROLLER = ['TENANT_ADMIN', 'ADMIN', 'MUDUR'];

const satisService = {

    async hepsiniGetir(subeId, tarihBaslangic, tarihBitis, tenantId) {
        const where = subeId
            ? { subeId: Number(subeId), sube: { tenantId } }
            : { sube: { tenantId } };

        if (tarihBaslangic && tarihBitis) {
            where.tarih = {
                gte: new Date(tarihBaslangic),
                lte: new Date(tarihBitis)
            };
        }
        return prisma.satis.findMany({
            where,
            include: { recete: true, sube: true },
            orderBy: { tarih: 'desc' }
        });
    },

    async gunlukToplam(subeId, tenantId) {
        const bugun = new Date();
        bugun.setHours(0, 0, 0, 0);
        const yarin = new Date(bugun);
        yarin.setDate(yarin.getDate() + 1);

        const where = subeId
            ? { subeId: Number(subeId), sube: { tenantId }, tarih: { gte: bugun, lt: yarin } }
            : { sube: { tenantId }, tarih: { gte: bugun, lt: yarin } };

        const satislar = await prisma.satis.findMany({ where });
        return satislar.reduce((t, s) => t + s.toplam, 0);
    },

    async aylikToplam(subeId, tenantId) {
        const now = new Date();
        const ayBasi = new Date(now.getFullYear(), now.getMonth(), 1);
        ayBasi.setHours(0, 0, 0, 0);
        const ayBitisi = new Date(now.getFullYear(), now.getMonth() + 1, 1);
        ayBitisi.setHours(0, 0, 0, 0);

        const where = subeId
            ? { subeId: Number(subeId), sube: { tenantId }, tarih: { gte: ayBasi, lt: ayBitisi } }
            : { sube: { tenantId }, tarih: { gte: ayBasi, lt: ayBitisi } };

        const satislar = await prisma.satis.findMany({ where });
        const toplam = satislar.reduce((t, s) => t + s.toplam, 0);
        return { toplam, islemSayisi: satislar.length };
    },

    // Satış anındaki PORSİYON MALİYETİNİ hesaplar — receteService.maliyetHesapla
    // ve rapor.controller.js'teki hesaplaMaliyetRaporu ile BİREBİR aynı formül
    // (carpan/bolen dönüşümü + porsiyonSayisi'na bölme). Üç yerde formül
    // sapması olmasın diye ayrı bir yardımcı fonksiyon olarak tutuluyor.
    //
    // Bu değer satış kaydı oluşturulurken DONDURULUP saklanır (Satis.birimMaliyet)
    // — stok fiyatı sonradan değişse bile o satışın gerçek maliyeti sabit kalır.
    async _porsiyonMaliyetiHesapla(recete, tenantId) {
        let uretimMaliyeti = 0;
        for (const kalem of recete.kalemler) {
            const sonHareket = await prisma.stokHareket.findFirst({
                where: {
                    stokKartId: kalem.stokKartId,
                    tip: 'GIRIS_FATURA',
                    birimFiyat: { not: null },
                    stokKart: { tenantId }
                },
                orderBy: [{ tarih: 'desc' }, { id: 'desc' }]
            });
            const birimFiyat = sonHareket?.birimFiyat || 0;
            const gercekMiktar = (kalem.miktar * kalem.carpan) / kalem.bolen;
            uretimMaliyeti += birimFiyat * gercekMiktar;
        }
        const efektifPorsiyon = recete.porsiyonSayisi || 1;
        return uretimMaliyeti / efektifPorsiyon;
    },

    /**
     * @param {object} data - receteId, subeId, adet, birimFiyat, aciklama, tarih
     * @param {number} tenantId
     * @param {object} opts - { zorla: boolean, rol: string }
     *   zorla: true ise ve rol yetkiliyse, yetersiz stok satışı engellemez.
     */
    async ekle({ receteId, subeId, adet, birimFiyat, aciklama, tarih }, tenantId, opts = {}) {
        const { zorla = false, rol = null } = opts;
        const zorlamaYetkisiVar = zorla && ZORLA_IZINLI_ROLLER.includes(rol);

        const recete = await prisma.recete.findFirst({
            where: { id: Number(receteId), tenantId },
            include: {
                kalemler: { include: { stokKart: true } }
            }
        });
        if (!recete) throw new Error('Reçete bulunamadı');

        const sube = await prisma.sube.findFirst({
            where: { id: Number(subeId), tenantId }
        });
        if (!sube) throw new Error('Şube bulunamadı');

        // Satış anındaki porsiyon maliyetini hesapla — bu, işlem transaction'a
        // girmeden ÖNCE yapılır (salt okuma, yazma değil), sonra satış
        // kaydına dondurularak yazılır.
        const birimMaliyetSatisAni = await satisService._porsiyonMaliyetiHesapla(recete, tenantId);

        // KRİTİK: Reçetedeki kalem miktarları, reçetenin kendi "kazan porsiyonu"
        // için tanımlıdır (örn. adana kebap 50 porsiyonluk kazan için 10kg kıyma).
        // "adet" alanı ise satılan PORSİYON sayısıdır — kazan sayısı değil.
        // Bu yüzden kalem miktarını doğrudan adet ile çarpmak YANLIŞ:
        // 50 porsiyonluk satış, 50 KAZAN satış gibi hesaplanıp 500kg çıkıyordu.
        // Doğrusu: oran = satılan porsiyon / reçetenin kendi kazan porsiyonu.
        // tuketimRecete() fonksiyonundaki mantıkla birebir aynı olmalı.
        const receteninKendiPorsiyonu = recete.porsiyonSayisi || 1;
        const oran = Number(adet) / receteninKendiPorsiyonu;

        const eksikKalemler = [];

        const sonuc = await prisma.$transaction(async (tx) => {
            for (const kalem of recete.kalemler) {
                if (kalem.stokTakipZorunlu === false) continue;

                const gercekMiktar = ((kalem.miktar * kalem.carpan) / kalem.bolen) * oran;

                const girisler = await tx.stokHareket.aggregate({
                    where: {
                        stokKartId: kalem.stokKartId,
                        subeId: Number(subeId),
                        tip: { in: ['GIRIS_FATURA', 'AY_SONU_SAYIM', 'SUBE_TRANSFER_IN'] }
                    },
                    _sum: { miktar: true }
                });

                const cikislar = await tx.stokHareket.aggregate({
                    where: {
                        stokKartId: kalem.stokKartId,
                        subeId: Number(subeId),
                        tip: { in: ['IADE_FATURA', 'SATIS', 'ZAYI', 'TUKETIM', 'SUBE_TRANSFER_OUT'] }
                    },
                    _sum: { miktar: true }
                });

                const mevcutMiktar = (girisler._sum.miktar || 0) - (cikislar._sum.miktar || 0);

                if (mevcutMiktar < gercekMiktar) {
                    if (zorlamaYetkisiVar) {
                        eksikKalemler.push({
                            ad: kalem.stokKart.ad,
                            mevcut: mevcutMiktar,
                            gereken: gercekMiktar
                        });
                        continue;
                    }
                    throw new Error(
                        `Yetersiz stok: ${kalem.stokKart.ad} (mevcut: ${mevcutMiktar.toFixed(2)}, gereken: ${gercekMiktar.toFixed(2)})`
                    );
                }
            }

            const zorlamaNotu = eksikKalemler.length
                ? ` [ZORLA KAYDEDİLDİ — yetersiz: ${eksikKalemler.map(k => k.ad).join(', ')}]`
                : '';

            const satis = await tx.satis.create({
                data: {
                    receteId: Number(receteId),
                    subeId: Number(subeId),
                    adet: Number(adet),
                    birimFiyat: Number(birimFiyat),
                    birimMaliyet: Math.round(birimMaliyetSatisAni * 100) / 100,
                    toplam: Number(adet) * Number(birimFiyat),
                    aciklama: (aciklama || '') + zorlamaNotu,
                    tarih: tarih ? new Date(tarih) : new Date(),
                }
            });

            for (const kalem of recete.kalemler) {
                const gercekMiktar = ((kalem.miktar * kalem.carpan) / kalem.bolen) * oran;
                await tx.stokHareket.create({
                    data: {
                        tip: 'SATIS',
                        miktar: gercekMiktar,
                        aciklama: `Satış — ${recete.ad} x${adet}`,
                        tarih: tarih ? new Date(tarih) : new Date(),
                        stokKartId: kalem.stokKartId,
                        subeId: Number(subeId),
                        satisId: satis.id,
                    }
                });
            }

            return { satis, zorlandi: eksikKalemler.length > 0, eksikKalemler };
        });

        // DÜZELTME: receteAdi eklendi — controller artık audit log'a
        // "receteId: 48" yerine "recete: TAVUKSUYU" yazabiliyor.
        return { ...sonuc, receteAdi: recete.ad };
    },

    // DÜZELTME: silme işlemi artık silinen satışın reçete adını da
    // döndürüyor (audit log'da isimle görünsün diye) — silmeden önce
    // recete include edilerek kaydediliyor, çünkü kayıt silindikten sonra
    // ilişkiden isim çekilemez.
    async sil(id, tenantId) {
        const satis = await prisma.satis.findFirst({
            where: { id, sube: { tenantId } },
            include: { recete: true }
        });
        if (!satis) throw new Error('Satış bulunamadı');
        // Not: stokHareket kayıtları silinir — bu, satışla düşülen stoğu
        // fiilen geri yükler. Frontend uyarı metni buna göre yazıldı.
        await prisma.stokHareket.deleteMany({ where: { satisId: id } });
        await prisma.satis.delete({ where: { id } });
        return { receteAdi: satis.recete?.ad, toplam: satis.toplam };
    }

};

module.exports = satisService;