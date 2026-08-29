const express = require('express');
const router = express.Router();
const cariKartController = require('../controllers/cariKart.controller');
const { authMiddleware, rolKontrol } = require('../middleware/auth.middleware');
const paketKontrol = require('../middleware/paketKontrol.middleware'); // ← EKLENDİ

router.use(authMiddleware);

const yonetimRol = rolKontrol('TENANT_ADMIN', 'MUDUR');

// Okuma — her zaman serbest
router.get('/', yonetimRol, cariKartController.hepsiniGetir);
router.get('/:id', yonetimRol, cariKartController.biriniGetir);
router.get('/:id/bakiye', yonetimRol, cariKartController.bakiyeGetir);

// Yazma — Profesyonel+ gerektirir
router.post('/', yonetimRol, paketKontrol('cari'), cariKartController.olustur);
router.put('/:id', yonetimRol, paketKontrol('cari'), cariKartController.guncelle);
router.delete('/:id', yonetimRol, paketKontrol('cari'), cariKartController.sil);

module.exports = router;