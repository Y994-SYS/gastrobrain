const express = require('express');
const router = express.Router();
const cariHareketController = require('../controllers/cariHareket.controller');
const { authMiddleware } = require('../middleware/auth.middleware');

router.use(authMiddleware);

router.get('/bakiyeler', cariHareketController.tumCarilerinBakiyeleriGetir);
router.get('/:cariKartId', cariHareketController.hareketleriGetir);
router.get('/:cariKartId/bakiye', cariHareketController.bakiyeGetir);
router.post('/odeme', cariHareketController.odemeEkle);
router.post('/manuel', cariHareketController.manuelHareketEkle);

module.exports = router;