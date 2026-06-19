const express = require('express');
const router = express.Router();
const cariKartController = require('../controllers/cariKart.controller');
const { authMiddleware, rolKontrol } = require('../middleware/auth.middleware');

router.use(authMiddleware);

const yonetimRol = rolKontrol('TENANT_ADMIN', 'MUDUR');

router.get('/', yonetimRol, cariKartController.hepsiniGetir);
router.get('/:id', yonetimRol, cariKartController.biriniGetir);
router.get('/:id/bakiye', yonetimRol, cariKartController.bakiyeGetir);
router.post('/', yonetimRol, cariKartController.olustur);
router.put('/:id', yonetimRol, cariKartController.guncelle);
router.delete('/:id', yonetimRol, cariKartController.sil);

module.exports = router;