const express = require('express');
const router = express.Router();
const cariHareketController = require('../controllers/cariHareket.controller');
const { authMiddleware, rolKontrol } = require('../middleware/auth.middleware');
const { validate, validateParams } = require('../middleware/validate.middleware');
const paketKontrol = require('../middleware/paketKontrol.middleware'); // ← EKLENDİ
const { odemeSchema, manuelHareketSchema, cariKartIdParamSchema } = require('../schemas/cariHareket.schema');

router.use(authMiddleware);

const yonetimRol = rolKontrol('TENANT_ADMIN', 'MUDUR');

// Okuma — her zaman serbest (paketKontrol GET isteklerini zaten bypass ediyor,
// ama burada hiç eklemedik ki bu netlik açısından daha okunur kalsın).
router.get('/bakiyeler', yonetimRol, cariHareketController.tumCarilerinBakiyeleriGetir);
router.get('/:cariKartId', yonetimRol, validateParams(cariKartIdParamSchema), cariHareketController.hareketleriGetir);
router.get('/:cariKartId/bakiye', yonetimRol, validateParams(cariKartIdParamSchema), cariHareketController.bakiyeGetir);

// Yazma — Profesyonel+ gerektirir. Deneme sırasında ve tam erişimde serbest,
// deneme bitip Başlangıç'ta kalınca 403 döner (frontend bu durumda zaten
// "+ Ödeme Ekle" butonunu gizliyor — bu, ikinci/gerçek güvenlik katmanı).
router.post('/odeme', yonetimRol, paketKontrol('cari'), validate(odemeSchema), cariHareketController.odemeEkle);
router.post('/manuel', yonetimRol, paketKontrol('cari'), validate(manuelHareketSchema), cariHareketController.manuelHareketEkle);

module.exports = router;