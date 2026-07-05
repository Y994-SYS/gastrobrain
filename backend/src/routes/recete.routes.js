const express = require('express');
const router = express.Router();
const receteController = require('../controllers/recete.controller');
const { authMiddleware, rolKontrol } = require('../middleware/auth.middleware');
const { validate, validateParams } = require('../middleware/validate.middleware');
const { receteSchema, idParamSchema } = require('../schemas/recete.schema');

router.use(authMiddleware);

const yonetimRol = rolKontrol('TENANT_ADMIN', 'MUDUR');

router.get('/', yonetimRol, receteController.hepsiniGetir);
router.get('/:id', yonetimRol, validateParams(idParamSchema), receteController.biriniGetir);
router.get('/:id/maliyet', yonetimRol, validateParams(idParamSchema), receteController.maliyetHesapla);
router.post('/', yonetimRol, validate(receteSchema), receteController.olustur);
router.put('/:id', yonetimRol, validateParams(idParamSchema), validate(receteSchema), receteController.guncelle);
router.delete('/:id', yonetimRol, validateParams(idParamSchema), receteController.sil);

module.exports = router;