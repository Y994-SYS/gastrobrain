const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth.controller');
const { authMiddleware } = require('../middleware/auth.middleware');
const { validate } = require('../middleware/validate.middleware');
const {
    kayitOlSchema,
    girisYapSchema,
    kayitFirmaSchema,
    tenantListesiSchema,
    sifreSifirlamaTalepSchema,
    sifreSifirlaSchema,
} = require('../schemas/auth.schema');

router.post('/kayit', validate(kayitOlSchema), authController.kayitOl);
router.post('/giris', validate(girisYapSchema), authController.girisYap);
router.get('/ben', authMiddleware, authController.beniKontrolEt);
router.post('/kayit-firma', validate(kayitFirmaSchema), authController.kayitFirma);
router.post('/tenant-listesi', validate(tenantListesiSchema), authController.tenantListesiGetir);
router.post('/sifre-sifirlama-talep', validate(sifreSifirlamaTalepSchema), authController.sifreSifirlamaTalep);
router.post('/sifre-sifirla', validate(sifreSifirlaSchema), authController.sifreSifirla);

router.get('/lisans-durum', authMiddleware, authController.lisansDurum);
module.exports = router;