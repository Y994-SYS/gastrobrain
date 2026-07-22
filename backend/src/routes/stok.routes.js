const express = require('express');
const router = express.Router();
const stokController = require('../controllers/stok.controller');
const { authMiddleware, rolKontrol } = require('../middleware/auth.middleware');
const { validate, validateParams, validateQuery } = require('../middleware/validate.middleware');
const {
    faturaSchema,
    hareketSchema,
    aySonuSayimSchema,
    tuketimReceteSchema,
    mevcutStokParamsSchema,
    hareketlerQuerySchema,
} = require('../schemas/stok.schema');

router.use(authMiddleware);

// Stok modülü: DEPO + MUDUR + ADMIN — SUPER_ADMIN tenant'sız olduğu için yok
const stokRol = rolKontrol('TENANT_ADMIN', 'MUDUR', 'DEPO');

router.get('/hareketler', stokRol, validateQuery(hareketlerQuerySchema), stokController.hareketleriGetir);
router.get('/durum', stokRol, stokController.tumStokDurumu);
router.get('/mevcut/:stokKartId/:subeId', stokRol, validateParams(mevcutStokParamsSchema), stokController.mevcutStokGetir);
router.post('/giris-faturasi', stokRol, validate(faturaSchema), stokController.girisFaturasiEkle);
router.post('/iade-faturasi', stokRol, validate(faturaSchema), stokController.iadeFaturasiEkle);
router.post('/zayi', stokRol, validate(hareketSchema), stokController.zayiEkle);
router.post('/tuketim', stokRol, validate(hareketSchema), stokController.tuketimEkle);
router.post('/tuketim-recete', stokRol, validate(tuketimReceteSchema), stokController.tuketimRecete);
router.post('/ay-sonu-sayim', stokRol, validate(aySonuSayimSchema), stokController.aySonuSayimEkle);

module.exports = router;