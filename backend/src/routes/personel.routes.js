const express = require('express');
const router = express.Router();
const personelController = require('../controllers/personel.controller');
const { authMiddleware, rolKontrol } = require('../middleware/auth.middleware');
const { validate, validateParams } = require('../middleware/validate.middleware');
const {
    personelSchema,
    maasEkleSchema,
    avansEkleSchema,
    devamEkleSchema,
    idParamSchema,
} = require('../schemas/personel.schema');

router.use(authMiddleware);

const yonetimRol = rolKontrol('TENANT_ADMIN', 'MUDUR');
const okumaRol = rolKontrol('TENANT_ADMIN', 'MUDUR', 'PERSONEL');

router.get('/', yonetimRol, personelController.hepsiniGetir);
router.get('/:id', okumaRol, validateParams(idParamSchema), personelController.biriniGetir);
router.post('/', yonetimRol, validate(personelSchema), personelController.olustur);
router.put('/:id', yonetimRol, validateParams(idParamSchema), validate(personelSchema), personelController.guncelle);
router.delete('/:id', yonetimRol, validateParams(idParamSchema), personelController.sil);

router.post('/maas', yonetimRol, validate(maasEkleSchema), personelController.maasEkle);
router.put('/maas/:id/odendi', yonetimRol, validateParams(idParamSchema), personelController.maasOdendi);
router.post('/avans', yonetimRol, validate(avansEkleSchema), personelController.avansEkle);
router.post('/devam', yonetimRol, validate(devamEkleSchema), personelController.devamEkle);

module.exports = router;