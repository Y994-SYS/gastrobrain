const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const dashboardController = {

    async subeOzeti(req, res) {
        try {
            const tenantId = req.kullanici.tenantId;

            const subeler = await prisma.sube.findMany({
                where: { tenantId, aktif: true },
                include: {
                    kullanicilar: { where: { aktif: true }, select: { id: true } },
                    personeller: { select: { id: true } },
                }
            });

            const bugun = new Date();
            bugun.setHours(0, 0, 0, 0);
            const yarin = new Date(bugun);
            yarin.setDate(yarin.getDate() + 1);

            const sonuc = await Promise.all(subeler.map(async (sube) => {
                // Günlük satış
                const satislar = await prisma.satis.findMany({
                    where: { subeId: sube.id, tarih: { gte: bugun, lt: yarin } }
                });
                const gunlukCiro = satislar.reduce((t, s) => t + s.toplam, 0);

                // Kritik stok
                const stokKartlari = await prisma.stokKart.findMany({
                    where: { tenantId },
                    include: {
                        stokHareketleri: { where: { subeId: sube.id } }
                    }
                });

                let kritikSayisi = 0;
                for (const kart of stokKartlari) {
                    let miktar = 0;
                    for (const h of kart.stokHareketleri) {
                        const girisler = ['GIRIS_FATURA', 'AY_SONU_SAYIM', 'SUBE_TRANSFER_IN'];
                        const cikislar = ['IADE_FATURA', 'SATIS', 'ZAYI', 'TUKETIM', 'SUBE_TRANSFER_OUT'];
                        if (girisler.includes(h.tip)) miktar += h.miktar;
                        else if (cikislar.includes(h.tip)) miktar -= h.miktar;
                    }
                    if (miktar <= kart.minStok) kritikSayisi++;
                }

                return {
                    id: sube.id,
                    ad: sube.ad,
                    telefon: sube.telefon,
                    adres: sube.adres,
                    aktif: sube.aktif,
                    kullaniciSayisi: sube.kullanicilar.length,
                    personelSayisi: sube.personeller.length,
                    gunlukCiro,
                    satisSayisi: satislar.length,
                    kritikStokSayisi: kritikSayisi,
                };
            }));

            res.json({ basarili: true, data: sonuc });
        } catch (err) {
            res.status(500).json({ basarili: false, mesaj: err.message });
        }
    }
};

module.exports = dashboardController;