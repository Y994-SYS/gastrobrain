const express = require('express');
const router = express.Router();
const { authMiddleware, rolKontrol } = require('../middleware/auth.middleware');
const superAdminController = require('../controllers/superAdmin.controller');

// Tüm route'lar SUPER_ADMIN gerektiriyor
router.use(authMiddleware);
router.use(rolKontrol('SUPER_ADMIN'));

router.get('/tenantlar', superAdminController.tenantlariGetir);
router.get('/tenantlar/:id', superAdminController.tenantDetay);
router.patch('/tenantlar/:id/aktif', superAdminController.aktifPasifYap);
router.patch('/tenantlar/:id/plan', superAdminController.planGuncelle);
router.get('/istatistikler', superAdminController.istatistikler);
router.patch('/tenantlar/:id/lisans', superAdminController.lisansGuncelle);
router.get('/lisans-durumlari', superAdminController.lisansDurumlari);

module.exports = router;