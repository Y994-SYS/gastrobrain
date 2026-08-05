const express = require('express');
const router = express.Router();
const satisController = require('../controllers/satis.controller');
const { authMiddleware, rolKontrol } = require('../middleware/auth.middleware');
const { validate, validateParams } = require('../middleware/validate.middleware');
const { satisSchema, idParamSchema } = require('../schemas/satis.schema');

router.use(authMiddleware);

const satisRol = rolKontrol('TENANT_ADMIN', 'MUDUR', 'KASA');

router.get('/', satisRol, satisController.hepsiniGetir);
router.get('/gunluk-toplam', satisRol, satisController.gunlukToplam);
router.get('/aylik-toplam', satisRol, satisController.aylikToplam);
router.post('/', satisRol, validate(satisSchema), satisController.ekle);
router.delete('/:id', satisRol, validateParams(idParamSchema), satisController.sil);

module.exports = router;