const express = require('express');
const router = express.Router();
const { hepsiniGetir, olustur, guncelle, sil, profilGuncelle, sifreDegistir } = require('../controllers/kullanici.controller');
const { authMiddleware, rolKontrol } = require('../middleware/auth.middleware');
const { validate, validateParams } = require('../middleware/validate.middleware');
const {
    kullaniciOlusturSchema,
    kullaniciGuncelleSchema,
    profilGuncelleSchema,
    sifreDegistirSchema,
    idParamSchema,
} = require('../schemas/kullanici.schema');

router.use(authMiddleware);

router.put('/profil', validate(profilGuncelleSchema), profilGuncelle);
router.put('/sifre-degistir', validate(sifreDegistirSchema), sifreDegistir);

router.get('/', rolKontrol('TENANT_ADMIN'), hepsiniGetir);
router.post('/', rolKontrol('TENANT_ADMIN'), validate(kullaniciOlusturSchema), olustur);
router.put('/:id', rolKontrol('TENANT_ADMIN'), validateParams(idParamSchema), validate(kullaniciGuncelleSchema), guncelle);
router.delete('/:id', rolKontrol('TENANT_ADMIN'), validateParams(idParamSchema), sil);

module.exports = router;