const express = require('express');
const router = express.Router();
const cariHareketController = require('../controllers/cariHareket.controller');
const { authMiddleware, rolKontrol } = require('../middleware/auth.middleware');
const { validate, validateParams } = require('../middleware/validate.middleware');
const { odemeSchema, manuelHareketSchema, cariKartIdParamSchema } = require('../schemas/cariHareket.schema');

router.use(authMiddleware);

const yonetimRol = rolKontrol('TENANT_ADMIN', 'MUDUR');

router.get('/bakiyeler', yonetimRol, cariHareketController.tumCarilerinBakiyeleriGetir);
router.get('/:cariKartId', yonetimRol, validateParams(cariKartIdParamSchema), cariHareketController.hareketleriGetir);
router.get('/:cariKartId/bakiye', yonetimRol, validateParams(cariKartIdParamSchema), cariHareketController.bakiyeGetir);
router.post('/odeme', yonetimRol, validate(odemeSchema), cariHareketController.odemeEkle);
router.post('/manuel', yonetimRol, validate(manuelHareketSchema), cariHareketController.manuelHareketEkle);

module.exports = router;