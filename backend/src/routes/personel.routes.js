const express = require('express');
const router = express.Router();
const personelController = require('../controllers/personel.controller');
const { authMiddleware, rolKontrol } = require('../middleware/auth.middleware');
const { validate, validateParams, validateQuery } = require('../middleware/validate.middleware');
const {
    personelSchema,
    maasEkleSchema,
    maasGuncelleSchema,
    avansEkleSchema,
    devamEkleSchema,
    devamTopluEkleSchema,
    idParamSchema,
    izinKullanimSchema,
    izinDurumuQuerySchema,
} = require('../schemas/personel.schema');

router.use(authMiddleware);

const yonetimRol = rolKontrol('TENANT_ADMIN', 'MUDUR');
const okumaRol = rolKontrol('TENANT_ADMIN', 'MUDUR', 'PERSONEL');

router.get('/', yonetimRol, personelController.hepsiniGetir);
router.get('/pasif', yonetimRol, personelController.pasifleriGetir);
router.get('/:id', okumaRol, validateParams(idParamSchema), personelController.biriniGetir);
router.post('/', yonetimRol, validate(personelSchema), personelController.olustur);
router.put('/:id', yonetimRol, validateParams(idParamSchema), validate(personelSchema), personelController.guncelle);
router.delete('/:id', yonetimRol, validateParams(idParamSchema), personelController.sil);
router.put('/:id/geri-yukle', yonetimRol, validateParams(idParamSchema), personelController.geriYukle);

router.post('/maas', yonetimRol, validate(maasEkleSchema), personelController.maasEkle);
router.put('/maas/:id', yonetimRol, validateParams(idParamSchema), validate(maasGuncelleSchema), personelController.maasGuncelle);
router.put('/maas/:id/odendi', yonetimRol, validateParams(idParamSchema), personelController.maasOdendi);
router.post('/avans', yonetimRol, validate(avansEkleSchema), personelController.avansEkle);
router.post('/devam', yonetimRol, validate(devamEkleSchema), personelController.devamEkle);
router.post('/devam-toplu', yonetimRol, validate(devamTopluEkleSchema), personelController.devamTopluEkle);

// ── Yıllık izin takibi ────────────────────────────────────────────────────────
router.get(
    '/:id/izin-durumu',
    yonetimRol,
    validateParams(idParamSchema),
    validateQuery(izinDurumuQuerySchema),
    personelController.izinDurumuGetir
);
router.post(
    '/izin-kullanim',
    yonetimRol,
    validate(izinKullanimSchema),
    personelController.izinKullanimGuncelle
);

module.exports = router;