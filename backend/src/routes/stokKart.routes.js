const express = require('express');
const router = express.Router();
const stokKartController = require('../controllers/stokKart.controller');
const { authMiddleware, rolKontrol } = require('../middleware/auth.middleware');
const { validate, validateParams } = require('../middleware/validate.middleware');
const { stokKartSchema, idParamSchema } = require('../schemas/stokKart.schema');

router.use(authMiddleware);

const stokRol = rolKontrol('SUPER_ADMIN', 'TENANT_ADMIN', 'MUDUR', 'DEPO');

router.get('/', stokRol, stokKartController.hepsiniGetir);
router.get('/:id', stokRol, validateParams(idParamSchema), stokKartController.biriniGetir);
router.post('/', stokRol, validate(stokKartSchema), stokKartController.olustur);
router.put('/:id', stokRol, validateParams(idParamSchema), validate(stokKartSchema), stokKartController.guncelle);
router.delete('/:id', stokRol, validateParams(idParamSchema), stokKartController.sil);

module.exports = router;