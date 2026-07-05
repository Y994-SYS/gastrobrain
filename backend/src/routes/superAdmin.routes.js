const express = require('express');
const router = express.Router();
const { authMiddleware, rolKontrol } = require('../middleware/auth.middleware');
const { validate, validateParams } = require('../middleware/validate.middleware');
const superAdminController = require('../controllers/superAdmin.controller');
const {
    aktifPasifSchema,
    planGuncelleSchema,
    lisansGuncelleSchema,
    idParamSchema,
} = require('../schemas/superAdmin.schema');

router.use(authMiddleware);
router.use(rolKontrol('SUPER_ADMIN'));

router.get('/tenantlar', superAdminController.tenantlariGetir);
router.get('/tenantlar/:id', validateParams(idParamSchema), superAdminController.tenantDetay);
router.patch('/tenantlar/:id/aktif', validateParams(idParamSchema), validate(aktifPasifSchema), superAdminController.aktifPasifYap);
router.patch('/tenantlar/:id/plan', validateParams(idParamSchema), validate(planGuncelleSchema), superAdminController.planGuncelle);
router.get('/istatistikler', superAdminController.istatistikler);
router.patch('/tenantlar/:id/lisans', validateParams(idParamSchema), validate(lisansGuncelleSchema), superAdminController.lisansGuncelle);
router.get('/lisans-durumlari', superAdminController.lisansDurumlari);

module.exports = router;