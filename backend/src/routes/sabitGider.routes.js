const express = require('express');
const router = express.Router();
const sabitGiderController = require('../controllers/sabitGider.controller');
const { authMiddleware, rolKontrol } = require('../middleware/auth.middleware');
const { validate, validateParams } = require('../middleware/validate.middleware');
const paketKontrol = require('../middleware/paketKontrol.middleware');
const {
    sabitGiderSchema,
    sabitGiderGuncelleSchema,
    idParamSchema,
} = require('../schemas/sabitGider.schema');

router.use(authMiddleware);

const yonetimRol = rolKontrol('TENANT_ADMIN', 'MUDUR');

// Okuma — her zaman serbest (personel/cari route'larıyla aynı ilke:
// paketKontrol GET isteklerini bypass ediyor, burada da hiç eklenmedi).
router.get('/', yonetimRol, sabitGiderController.hepsiniGetir);
router.get('/:id', yonetimRol, validateParams(idParamSchema), sabitGiderController.biriniGetir);

// Yazma — 'sabitGider' üç planda da temel özellik (personel/cari gibi),
// paketKontrol burada pratikte sadece "tenant var mı" kontrolü yapar.
router.post('/', yonetimRol, paketKontrol('sabitGider'), validate(sabitGiderSchema), sabitGiderController.olustur);
router.put('/:id', yonetimRol, paketKontrol('sabitGider'), validateParams(idParamSchema), validate(sabitGiderGuncelleSchema), sabitGiderController.guncelle);
router.put('/:id/odendi', yonetimRol, paketKontrol('sabitGider'), validateParams(idParamSchema), sabitGiderController.odendiIsaretle);
router.delete('/:id', yonetimRol, paketKontrol('sabitGider'), validateParams(idParamSchema), sabitGiderController.sil);

module.exports = router;