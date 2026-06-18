const express = require('express');
const router = express.Router();
const cariHareketController = require('../controllers/cariHareket.controller');
const { authMiddleware, rolKontrol } = require('../middleware/auth.middleware');

router.use(authMiddleware);

// Cari hareketler: MUDUR + ADMIN — hassas finansal veri
const yonetimRol = rolKontrol('SUPER_ADMIN', 'TENANT_ADMIN', 'MUDUR');

router.get('/bakiyeler', yonetimRol, cariHareketController.tumCarilerinBakiyeleriGetir);
router.get('/:cariKartId', yonetimRol, cariHareketController.hareketleriGetir);
router.get('/:cariKartId/bakiye', yonetimRol, cariHareketController.bakiyeGetir);
router.post('/odeme', yonetimRol, cariHareketController.odemeEkle);
router.post('/manuel', yonetimRol, cariHareketController.manuelHareketEkle);

module.exports = router;