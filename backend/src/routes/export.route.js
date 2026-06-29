const express = require('express');
const router = express.Router();
const { tumVeriExport } = require('../controllers/export.controller');
const { authMiddleware, rolKontrol } = require('../middleware/auth.middleware');

router.use(authMiddleware);

// Sadece TENANT_ADMIN kendi verisini export edebilir
router.post('/', rolKontrol('TENANT_ADMIN'), tumVeriExport);

module.exports = router;