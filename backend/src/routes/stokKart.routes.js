const express = require('express');
const router = express.Router();
const cariKartController = require('../controllers/cariKart.controller');
const { authMiddleware, rolKontrol } = require('../middleware/auth.middleware');
const { validate, validateParams } = require('../middleware/validate.middleware');
const { cariKartSchema, idParamSchema } = require('../schemas/cariKart.schema');

router.use(authMiddleware);

const yonetimRol = rolKontrol('TENANT_ADMIN', 'MUDUR');

router.get('/', yonetimRol, cariKartController.hepsiniGetir);
router.get('/:id', yonetimRol, validateParams(idParamSchema), cariKartController.biriniGetir);
router.get('/:id/bakiye', yonetimRol, validateParams(idParamSchema), cariKartController.bakiyeGetir);
router.post('/', yonetimRol, validate(cariKartSchema), cariKartController.olustur);
router.put('/:id', yonetimRol, validateParams(idParamSchema), validate(cariKartSchema), cariKartController.guncelle);
router.delete('/:id', yonetimRol, validateParams(idParamSchema), cariKartController.sil);

module.exports = router;