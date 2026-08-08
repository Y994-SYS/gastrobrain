const express = require('express');
const router = express.Router();
const planliTransferController = require('../controllers/planliTransfer.controller');
const { authMiddleware, rolKontrol } = require('../middleware/auth.middleware');
const paketKontrol = require('../middleware/paketKontrol.middleware');
const { validate } = require('../middleware/validate.middleware');
const { planliTransferOlusturSchema, planliTransferGuncelleSchema } = require('../schemas/planliTransfer.schema');

router.use(authMiddleware);

const yonetimRol = rolKontrol('TENANT_ADMIN', 'MUDUR');

router.get('/', yonetimRol, paketKontrol('planliTransfer'), planliTransferController.tumunuGetir);
router.post('/', yonetimRol, paketKontrol('planliTransfer'), validate(planliTransferOlusturSchema), planliTransferController.olustur);
router.put('/:id', yonetimRol, paketKontrol('planliTransfer'), validate(planliTransferGuncelleSchema), planliTransferController.guncelle);
router.delete('/:id', yonetimRol, paketKontrol('planliTransfer'), planliTransferController.sil);
router.patch('/:id/aktif', yonetimRol, paketKontrol('planliTransfer'), planliTransferController.aktifPasifYap);
router.post('/:id/calistir', yonetimRol, paketKontrol('planliTransfer'), planliTransferController.hemenCalistir);

module.exports = router;