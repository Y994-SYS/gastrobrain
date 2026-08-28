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

// Bir özelliğin gerektirdiği en düşük planı bul (mesaj için) — sabit
// 'PROFESYONEL' yerine, ileride yeni bir ara plan eklenirse otomatik doğru
// cevap versin diye.
const gerekliPlaniBul = (ozellik) => {
    const siralama = ['PROFESYONEL', 'KURUMSAL'];
    return siralama.find(p => PAKET_OZELLIKLERI[p]?.[ozellik]) || 'PROFESYONEL';
};

const denemedeMi = (tenant) => {
    if (!tenant?.createdAt) return false;
    const bitis = new Date(tenant.createdAt);
    bitis.setDate(bitis.getDate() + 30);
    return new Date() <= bitis;
};

/**
 * Paket Kontrol Middleware
 * Kullanım: router.post('/transfer', authMiddleware, paketKontrol('subeTransferi'), controller)
 *
 * DAVRANIŞ (güncellendi — "salt okunur" modeli):
 * - GET istekleri HER ZAMAN serbest. Bir tenant'ın planı düşürülse (ya da
 *   hiç yükseltmeden deneme bitse) bile, deneme sırasında oluşturduğu
 *   veriler (transfer geçmişi, merkez depo tanımları vb.) görüntülenebilir
 *   kalmalı. Kısıtlama sadece YENİ veri oluşturma/değiştirme/silme
 *   (POST/PUT/PATCH/DELETE) işlemlerinde devreye giriyor.
 * - Deneme süresi (kayıttan itibaren 30 gün) boyunca TÜM özellikler,
 *   tenant'ın seçtiği/varsayılan planı ne olursa olsun açık. Bu kontrol
 *   daha önce bu middleware'de hiç yoktu — sube.controller.js'deki
 *   `olustur` fonksiyonunda ayrıca yapılıyordu. Artık tüm paket kontrollü
 *   route'larda tutarlı şekilde burada da uygulanıyor.
 */
const paketKontrol = (ozellik) => async (req, res, next) => {
    try {
        // Okuma işlemleri her zaman serbest — veri asla "kaybolmaz",
        // sadece üzerine yeni işlem yapılamaz.
        if (req.method === 'GET') return next();

        const tenant = await prisma.tenant.findUnique({
            where: { id: req.kullanici.tenantId },
            select: { plan: true, ad: true, createdAt: true },
        });

        if (!tenant) {
            return res.status(404).json({ hata: 'Firma bulunamadı' });
        }

        // Deneme döneminde yazma işlemleri de serbest.
        if (denemedeMi(tenant)) {
            req.paket = tenant.plan;
            req.denemede = true;
            return next();
        }

        const ozellikMevcut = PAKET_OZELLIKLERI[tenant.plan]?.[ozellik];

        if (!ozellikMevcut) {
            return res.status(403).json({
                basarili: false,
                hata: `Bu özellik ${tenant.plan} paketinde mevcut değildir`,
                mevcutPaket: tenant.plan,
                gerekliPaket: gerekliPlaniBul(ozellik),
                paketYukseltUrl: '/abonelik',
                saltOkunur: true, // frontend'e "veri kaybolmadı, sadece yazma kapalı" sinyali
            });
        }

        // middleware'den sonra controller'a paket bilgisi geç
        req.paket = tenant.plan;
        req.denemede = false;
        next();
    } catch (err) {
        console.error('Paket kontrol hatası:', err);
        res.status(500).json({ hata: 'Paket kontrol başarısız' });
    }
};

module.exports = paketKontrol;