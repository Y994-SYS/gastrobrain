const express = require('express');
const router = express.Router();
const { authMiddleware, rolKontrol } = require('../middleware/auth.middleware');
const { validateQuery } = require('../middleware/validate.middleware');
const { auditLogQuerySchema } = require('../schemas/auditLog.schema');
const auditLog = require('../services/auditLog.service');

router.get(
    '/',
    authMiddleware,
    rolKontrol('SUPER_ADMIN', 'TENANT_ADMIN', 'ADMIN'),
    validateQuery(auditLogQuerySchema),
    async (req, res) => {
        try {
            const data = await auditLog.getir(req.kullanici.tenantId, req.query.limit);
            res.json({ basarili: true, data });
        } catch (err) {
            res.status(500).json({ basarili: false, mesaj: err.message });
        }
    }
);

module.exports = router;