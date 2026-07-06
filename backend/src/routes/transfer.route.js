const express = require('express');
const router = express.Router();
const { subeStoklar, transferYap, transferGecmisi } = require('../controllers/transfer.controller');
const { authMiddleware, rolKontrol } = require('../middleware/auth.middleware');
const { validate, validateQuery } = require('../middleware/validate.middleware');
const {
    subeStoklarQuerySchema,
    transferYapSchema,
    transferGecmisiQuerySchema,
} = require('../schemas/transfer.schema');

router.use(authMiddleware);

// TENANT_ADMIN ve MUDUR erişebilir
const transferYetki = rolKontrol('TENANT_ADMIN', 'MUDUR');

router.get('/stoklar', transferYetki, validateQuery(subeStoklarQuerySchema), subeStoklar);
router.post('/', transferYetki, validate(transferYapSchema), transferYap);
router.get('/gecmis', transferYetki, validateQuery(transferGecmisiQuerySchema), transferGecmisi);

module.exports = router;