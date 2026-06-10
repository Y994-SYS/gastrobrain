const express = require('express');
const router = express.Router();
const stokController = require('../controllers/stok.controller');
const { authMiddleware } = require('../middleware/auth.middleware');

router.use(authMiddleware);

router.get('/hareketler', stokController.hareketleriGetir);
router.get('/durum', stokController.tumStokDurumu);
router.get('/mevcut/:stokKartId/:subeId', stokController.mevcutStokGetir);
router.post('/giris-faturasi', stokController.girisFaturasiEkle);
router.post('/iade-faturasi', stokController.iadeFaturasiEkle);
router.post('/zayi', stokController.zayiEkle);
router.post('/tuketim', stokController.tuketimEkle);
router.post('/ay-sonu-sayim', stokController.aySonuSayimEkle);

module.exports = router;