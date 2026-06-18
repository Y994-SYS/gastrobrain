const express = require('express');
const router = express.Router();
const { authMiddleware, rolKontrol } = require('../middleware/auth.middleware');
const auditLog = require('../services/auditLog.service');

router.get('/', authMiddleware, rolKontrol('SUPER_ADMIN', 'TENANT_ADMIN', 'ADMIN'), async (req, res) => {
    try {
        const limit = Number(req.query.limit) || 100;
        const data = await auditLog.getir(req.kullanici.tenantId, limit);
        res.json({ basarili: true, data });
    } catch (err) {
        res.status(500).json({ basarili: false, mesaj: err.message });
    }
});

module.exports = router;