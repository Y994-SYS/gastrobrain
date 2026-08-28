const express = require('express');
const router = express.Router();
const { hepsiniGetir, tekiniGetir, detayGetir, olustur, guncelle, merkezYap, merkezKaldir } = require('../controllers/sube.controller');
const { authMiddleware, rolKontrol } = require('../middleware/auth.middleware');
const { validate, validateParams } = require('../middleware/validate.middleware');
const { subeOlusturSchema, subeGuncelleSchema, idParamSchema } = require('../schemas/sube.schema');

router.use(authMiddleware);

const okuma = rolKontrol('TENANT_ADMIN', 'MUDUR');
const yonetim = rolKontrol('TENANT_ADMIN');

router.get('/', okuma, hepsiniGetir);
router.get('/:id/detay', okuma, validateParams(idParamSchema), detayGetir);
router.get('/:id', okuma, validateParams(idParamSchema), tekiniGetir);
router.post('/', yonetim, validate(subeOlusturSchema), olustur);
router.put('/:id', yonetim, validateParams(idParamSchema), validate(subeGuncelleSchema), guncelle);
// Merkez depo işaretleme — sadece TENANT_ADMIN (yapısal bir ayar, MUDUR'un
// kendi şubesini merkez yapıp yapamayacağına dair bir belirsizlik olmasın
// diye bilerek en üst role kısıtlandı).
router.patch('/:id/merkez-yap', yonetim, validateParams(idParamSchema), merkezYap);
router.patch('/:id/merkez-kaldir', yonetim, validateParams(idParamSchema), merkezKaldir);

module.exports = router;