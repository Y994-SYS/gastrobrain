const express = require('express');
const router = express.Router();
const receteController = require('../controllers/recete.controller');
const { authMiddleware } = require('../middleware/auth.middleware');

router.use(authMiddleware);

router.get('/', receteController.hepsiniGetir);
router.get('/:id', receteController.biriniGetir);
router.get('/:id/maliyet', receteController.maliyetHesapla);
router.post('/', receteController.olustur);
router.put('/:id', receteController.guncelle);
router.delete('/:id', receteController.sil);

module.exports = router;