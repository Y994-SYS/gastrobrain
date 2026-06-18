const express = require('express');
const router = express.Router();
const stokController = require('../controllers/stok.controller');
const { authMiddleware, rolKontrol } = require('../middleware/auth.middleware');

router.use(authMiddleware);

// Stok modülü: DEPO + MUDUR + ADMIN — KASA ve PERSONEL giremez
const stokRol = rolKontrol('SUPER_ADMIN', 'TENANT_ADMIN', 'MUDUR', 'DEPO');

router.get('/hareketler', stokRol, stokController.hareketleriGetir);
router.get('/durum', stokRol, stokController.tumStokDurumu);
router.get('/mevcut/:stokKartId/:subeId', stokRol, stokController.mevcutStokGetir);
router.post('/giris-faturasi', stokRol, stokController.girisFaturasiEkle);
router.post('/iade-faturasi', stokRol, stokController.iadeFaturasiEkle);
router.post('/zayi', stokRol, stokController.zayiEkle);
router.post('/tuketim', stokRol, stokController.tuketimEkle);
router.post('/ay-sonu-sayim', stokRol, stokController.aySonuSayimEkle);

module.exports = router;