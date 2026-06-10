const express = require('express');
const router = express.Router();
const stokKartController = require('../controllers/stokKart.controller');
const { authMiddleware } = require('../middleware/auth.middleware');

router.use(authMiddleware);

router.get('/', stokKartController.hepsiniGetir);
router.get('/:id', stokKartController.biriniGetir);
router.post('/', stokKartController.olustur);
router.put('/:id', stokKartController.guncelle);
router.delete('/:id', stokKartController.sil);

module.exports = router;