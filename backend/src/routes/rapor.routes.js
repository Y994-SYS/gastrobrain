const express = require('express');
const router = express.Router();
const receteController = require('../controllers/recete.controller');
const { authMiddleware, rolKontrol } = require('../middleware/auth.middleware');

router.use(authMiddleware);

const yonetimRol = rolKontrol('TENANT_ADMIN', 'MUDUR');

router.get('/', yonetimRol, receteController.hepsiniGetir);
router.get('/:id', yonetimRol, receteController.biriniGetir);
router.get('/:id/maliyet', yonetimRol, receteController.maliyetHesapla);
router.post('/', yonetimRol, receteController.olustur);
router.put('/:id', yonetimRol, receteController.guncelle);
router.delete('/:id', yonetimRol, receteController.sil);

module.exports = router;