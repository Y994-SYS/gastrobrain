const express = require('express');
const router = express.Router();
const olcuBirimiController = require('../controllers/olcuBirimi.controller');
const { authMiddleware, rolKontrol } = require('../middleware/auth.middleware');
const { validate, validateParams } = require('../middleware/validate.middleware');
const { olcuBirimiSchema, idParamSchema } = require('../schemas/olcuBirimi.schema');

router.use(authMiddleware);

const stokRol = rolKontrol('TENANT_ADMIN', 'MUDUR', 'DEPO');

router.get('/', stokRol, olcuBirimiController.hepsiniGetir);
router.get('/:id', stokRol, validateParams(idParamSchema), olcuBirimiController.biriniGetir);
router.post('/', stokRol, validate(olcuBirimiSchema), olcuBirimiController.olustur);
router.put('/:id', stokRol, validateParams(idParamSchema), validate(olcuBirimiSchema), olcuBirimiController.guncelle);
router.delete('/:id', stokRol, validateParams(idParamSchema), olcuBirimiController.sil);

module.exports = router;