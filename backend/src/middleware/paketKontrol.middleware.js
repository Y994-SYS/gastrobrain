// backend/src/middleware/paketKontrol.middleware.js

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const PAKET_OZELLIKLERI = {
    BASLANGIC: {
        maxSube: 1,
        subeTransferi: false,
        merkezDepo: false,
        subeKarsilastirmasi: false,
        planliTransfer: false,
    },
    PROFESYONEL: {
        maxSube: 5,
        subeTransferi: true,
        merkezDepo: true,
        subeKarsilastirmasi: true,
        planliTransfer: true,
    },
    KURUMSAL: {
        maxSube: 999,
        subeTransferi: true,
        merkezDepo: true,
        subeKarsilastirmasi: true,
        planliTransfer: true,
    },
};

/**
 * Paket Kontrol Middleware
 * Kullanım: router.post('/transfer', authMiddleware, paketKontrol('subeTransferi'), controller)
 */
const paketKontrol = (ozellik) => async (req, res, next) => {
    try {
        const tenant = await prisma.tenant.findUnique({
            where: { id: req.kullanici.tenantId },
            select: { plan: true, ad: true },
        });

        if (!tenant) {
            return res.status(404).json({ hata: 'Firma bulunamadı' });
        }

        const ozellikleriMevcut = PAKET_OZELLIKLERI[tenant.plan]?.[ozellik];

        if (!ozellikleriMevcut) {
            return res.status(403).json({
                basarili: false,
                hata: `Bu özellik ${tenant.plan} paketinde mevcut değildir`,
                mevcutPaket: tenant.plan,
                gerekliPaket: ozellik === 'subeTransferi' ? 'PROFESYONEL' : 'PROFESYONEL',
                paketYukseltUrl: '/abonelik',
            });
        }

        // middleware'den sonra controller'a paket bilgisi geç
        req.paket = tenant.plan;
        next();
    } catch (err) {
        console.error('Paket kontrol hatası:', err);
        res.status(500).json({ hata: 'Paket kontrol başarısız' });
    }
};

module.exports = paketKontrol;