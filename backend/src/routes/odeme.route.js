const express = require('express');
const router = express.Router();
const {
    bildirimOlustur, kendiDurumu, bekleyenleriGetir, onayla, reddet,
} = require('../controllers/odeme.controller');
const { authMiddleware, rolKontrol } = require('../middleware/auth.middleware');

router.use(authMiddleware);

// Tenant kullanıcıları — kendi ödeme bildirimi
router.post('/bildir', bildirimOlustur);
router.get('/durumum', kendiDurumu);

// Super admin — bekleyen ödemeleri yönet
router.get('/bekleyenler', rolKontrol('SUPER_ADMIN'), bekleyenleriGetir);
router.patch('/:id/onayla', rolKontrol('SUPER_ADMIN'), onayla);
router.patch('/:id/reddet', rolKontrol('SUPER_ADMIN'), reddet);

module.exports = router;