const express = require('express');
const router = express.Router();
const {
    bildirimOlustur, kendiDurumu, bekleyenleriGetir, onayla, reddet,
} = require('../controllers/odeme.controller');
const { authMiddleware, rolKontrol } = require('../middleware/auth.middleware');
const { validate, validateQuery, validateParams } = require('../middleware/validate.middleware');
const {
    bildirimOlusturSchema,
    bekleyenlerQuerySchema,
    idParamSchema,
    reddetSchema,
} = require('../schemas/odeme.schema');

router.use(authMiddleware);

// Tenant kullanıcıları — kendi ödeme bildirimi
router.post('/bildir', validate(bildirimOlusturSchema), bildirimOlustur);
router.get('/durumum', kendiDurumu);

// Super admin — bekleyen ödemeleri yönet
router.get('/bekleyenler', rolKontrol('SUPER_ADMIN'), validateQuery(bekleyenlerQuerySchema), bekleyenleriGetir);
router.patch('/:id/onayla', rolKontrol('SUPER_ADMIN'), validateParams(idParamSchema), onayla);
router.patch('/:id/reddet', rolKontrol('SUPER_ADMIN'), validateParams(idParamSchema), validate(reddetSchema), reddet);

module.exports = router;