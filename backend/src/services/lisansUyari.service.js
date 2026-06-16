const { PrismaClient } = require('@prisma/client');
const { lisansBitisUyariGonder } = require('./mail.service');
const prisma = new PrismaClient();

const lisansUyariService = {
    async kontrol() {
        const bugun = new Date();

        // 7 gün ve 3 gün kala uyarı
        const uyariGunleri = [7, 3];

        for (const gun of uyariGunleri) {
            const hedefTarih = new Date();
            hedefTarih.setDate(bugun.getDate() + gun);

            // O gün biten lisansları bul
            const baslangic = new Date(hedefTarih);
            baslangic.setHours(0, 0, 0, 0);
            const bitis = new Date(hedefTarih);
            bitis.setHours(23, 59, 59, 999);

            const tenantlar = await prisma.tenant.findMany({
                where: {
                    aktif: true,
                    lisansBitis: {
                        gte: baslangic,
                        lte: bitis
                    }
                }
            });

            for (const tenant of tenantlar) {
                try {
                    await lisansBitisUyariGonder(
                        tenant.email,
                        tenant.ad,
                        gun,
                        tenant.lisansBitis
                    );
                    console.log(`✅ Uyarı maili gönderildi: ${tenant.ad} (${gun} gün kaldı)`);
                } catch (e) {
                    console.error(`❌ Mail hatası: ${tenant.ad}:`, e.message);
                }
            }
        }
    }
};

module.exports = lisansUyariService;