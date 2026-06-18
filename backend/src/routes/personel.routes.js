const express = require('express');
const router = express.Router();
const personelController = require('../controllers/personel.controller');
const { authMiddleware, rolKontrol } = require('../middleware/auth.middleware');

router.use(authMiddleware);

// Yönetim işlemleri: MUDUR + ADMIN
const yonetimRol = rolKontrol('SUPER_ADMIN', 'TENANT_ADMIN', 'MUDUR');

// Okuma: PERSONEL de kendi bilgisini görebilir
const okumaRol = rolKontrol('SUPER_ADMIN', 'TENANT_ADMIN', 'MUDUR', 'PERSONEL');

router.get('/', yonetimRol, personelController.hepsiniGetir);
router.get('/:id', okumaRol, personelController.biriniGetir);  // PERSONEL kendi id'siyle istek atar
router.post('/', yonetimRol, personelController.olustur);
router.put('/:id', yonetimRol, personelController.guncelle);
router.delete('/:id', yonetimRol, personelController.sil);

// Maaş/avans/devam — sadece yönetim
router.post('/maas', yonetimRol, personelController.maasEkle);
router.put('/maas/:id/odendi', yonetimRol, personelController.maasOdendi);
router.post('/avans', yonetimRol, personelController.avansEkle);
router.post('/devam', yonetimRol, personelController.devamEkle);

module.exports = router;