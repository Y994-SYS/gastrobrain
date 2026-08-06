const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth.controller');
const { authMiddleware, rolKontrol } = require('../middleware/auth.middleware');
const { validate } = require('../middleware/validate.middleware');
const {
    kayitOlSchema,
    girisYapSchema,
    kayitFirmaSchema,
    tenantListesiSchema,
    sifreSifirlamaTalepSchema,
    sifreSifirlaSchema,
} = require('../schemas/auth.schema');

// GÜVENLİK DÜZELTMESİ: Bu route daha önce authMiddleware'siz açıktı ve
// kayitOlSchema client'ın "rol": "SUPER_ADMIN" ve keyfi bir "tenantId"
// göndermesine izin veriyordu — kimliği doğrulanmamış herhangi biri, tenant'sız
// tam yetkili bir SUPER_ADMIN hesabı ya da başka bir firmaya sahte admin
// hesabı oluşturabiliyordu. Artık sadece giriş yapmış bir TENANT_ADMIN,
// KENDİ firmasına (tenantId zorla req.kullanici'den) yeni kullanıcı ekleyebilir.
router.post(
    '/kayit',
    authMiddleware,
    rolKontrol('TENANT_ADMIN'),
    validate(kayitOlSchema),
    authController.kayitOl
);

router.post('/giris', validate(girisYapSchema), authController.girisYap);
router.get('/ben', authMiddleware, authController.beniKontrolEt);
router.post('/kayit-firma', validate(kayitFirmaSchema), authController.kayitFirma);
router.post('/tenant-listesi', validate(tenantListesiSchema), authController.tenantListesiGetir);
router.post('/sifre-sifirlama-talep', validate(sifreSifirlamaTalepSchema), authController.sifreSifirlamaTalep);
router.post('/sifre-sifirla', validate(sifreSifirlaSchema), authController.sifreSifirla);
router.get('/beni-getir', authMiddleware, authController.beniGetir);
router.get('/lisans-durum', authMiddleware, authController.lisansDurum);
module.exports = router;