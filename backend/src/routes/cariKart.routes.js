const express = require('express');
const router = express.Router();
const cariKartController = require('../controllers/cariKart.controller');
const { authMiddleware } = require('../middleware/auth.middleware');

router.use(authMiddleware);

router.get('/', cariKartController.hepsiniGetir);
router.get('/:id', cariKartController.biriniGetir);
router.get('/:id/bakiye', cariKartController.bakiyeGetir);
router.post('/', cariKartController.olustur);
router.put('/:id', cariKartController.guncelle);
router.delete('/:id', cariKartController.sil);

module.exports = router;