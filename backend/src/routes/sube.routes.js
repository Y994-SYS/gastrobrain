const express = require('express');
const router = express.Router();
const { hepsiniGetir, tekiniGetir, olustur, guncelle } = require('../controllers/sube.controller');
const { authMiddleware, rolKontrol } = require('../middleware/auth.middleware');

router.use(authMiddleware);

// Şube listeleme: MUDUR da kendi şubesini görmeli
const okuma = rolKontrol('SUPER_ADMIN', 'TENANT_ADMIN', 'MUDUR');
// Şube oluşturma/güncelleme: sadece ADMIN
const yonetim = rolKontrol('SUPER_ADMIN', 'TENANT_ADMIN');

router.get('/', okuma, hepsiniGetir);
router.get('/:id', okuma, tekiniGetir);
router.post('/', yonetim, olustur);
router.put('/:id', yonetim, guncelle);

module.exports = router;