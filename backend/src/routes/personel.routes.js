const express = require('express');
const router = express.Router();
const personelController = require('../controllers/personel.controller');
const { authMiddleware, rolKontrol } = require('../middleware/auth.middleware');
const { validate, validateParams, validateQuery } = require('../middleware/validate.middleware');
const paketKontrol = require('../middleware/paketKontrol.middleware'); // ← EKLENDİ
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

// Okuma — her zaman serbest
router.get('/', yonetimRol, personelController.hepsiniGetir);
router.get('/pasif', yonetimRol, personelController.pasifleriGetir);
router.get('/:id', okumaRol, validateParams(idParamSchema), personelController.biriniGetir);

// Yazma — Profesyonel+ gerektirir. Tüm mutasyon uçlarına (personel
// oluşturma/düzenleme/silme/geri yükleme, maaş/avans/devam/izin kayıtları)
// tutarlı şekilde uygulandı — önceden hiçbirinde paket kontrolü yoktu.
router.post('/', yonetimRol, paketKontrol('personel'), validate(personelSchema), personelController.olustur);
router.put('/:id', yonetimRol, paketKontrol('personel'), validateParams(idParamSchema), validate(personelSchema), personelController.guncelle);
router.delete('/:id', yonetimRol, paketKontrol('personel'), validateParams(idParamSchema), personelController.sil);
router.put('/:id/geri-yukle', yonetimRol, paketKontrol('personel'), validateParams(idParamSchema), personelController.geriYukle);

router.post('/maas', yonetimRol, paketKontrol('personel'), validate(maasEkleSchema), personelController.maasEkle);
router.put('/maas/:id', yonetimRol, paketKontrol('personel'), validateParams(idParamSchema), validate(maasGuncelleSchema), personelController.maasGuncelle);
router.put('/maas/:id/odendi', yonetimRol, paketKontrol('personel'), validateParams(idParamSchema), personelController.maasOdendi);
router.post('/avans', yonetimRol, paketKontrol('personel'), validate(avansEkleSchema), personelController.avansEkle);
router.post('/devam', yonetimRol, paketKontrol('personel'), validate(devamEkleSchema), personelController.devamEkle);
router.post('/devam-toplu', yonetimRol, paketKontrol('personel'), validate(devamTopluEkleSchema), personelController.devamTopluEkle);

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
    paketKontrol('personel'),
    validate(izinKullanimSchema),
    personelController.izinKullanimGuncelle
);

module.exports = router;