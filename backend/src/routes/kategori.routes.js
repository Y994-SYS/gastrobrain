const express = require('express');
const router = express.Router();
const kategoriController = require('../controllers/kategori.controller');
const { authMiddleware, rolKontrol } = require('../middleware/auth.middleware');
const { validate, validateParams } = require('../middleware/validate.middleware');
const { kategoriSchema, idParamSchema } = require('../schemas/kategori.schema');

router.use(authMiddleware);

const stokRol = rolKontrol('TENANT_ADMIN', 'MUDUR', 'DEPO');

router.get('/', stokRol, kategoriController.hepsiniGetir);
router.get('/:id', stokRol, validateParams(idParamSchema), kategoriController.biriniGetir);
router.post('/', stokRol, validate(kategoriSchema), kategoriController.olustur);
router.put('/:id', stokRol, validateParams(idParamSchema), validate(kategoriSchema), kategoriController.guncelle);
router.delete('/:id', stokRol, validateParams(idParamSchema), kategoriController.sil);

module.exports = router;