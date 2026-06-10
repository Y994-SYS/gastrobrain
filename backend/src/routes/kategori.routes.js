const express = require('express');
const router = express.Router();
const kategoriController = require('../controllers/kategori.controller');
const { authMiddleware } = require('../middleware/auth.middleware');

router.use(authMiddleware);

router.get('/', kategoriController.hepsiniGetir);
router.get('/:id', kategoriController.biriniGetir);
router.post('/', kategoriController.olustur);
router.put('/:id', kategoriController.guncelle);
router.delete('/:id', kategoriController.sil);

module.exports = router;