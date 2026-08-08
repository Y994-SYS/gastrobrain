const express = require('express');
const router = express.Router();
const merkezDepoController = require('../controllers/merkezDepo.controller');
const { authMiddleware, rolKontrol } = require('../middleware/auth.middleware');
const paketKontrol = require('../middleware/paketKontrol.middleware');
const { validate, validateQuery } = require('../middleware/validate.middleware');
const { tanımEkleSchema, manuelDagitSchema, gecmisQuerySchema } = require('../schemas/merkezDepo.schema');

router.use(authMiddleware);

const yonetimRol = rolKontrol('TENANT_ADMIN', 'MUDUR');

router.get('/durum', yonetimRol, paketKontrol('merkezDepo'), merkezDepoController.durumuGetir);
router.get('/tanimlar', yonetimRol, paketKontrol('merkezDepo'), merkezDepoController.tanimlarGetir);
router.post('/tanim', yonetimRol, paketKontrol('merkezDepo'), validate(tanımEkleSchema), merkezDepoController.taninmEkle);
router.delete('/tanim/:id', yonetimRol, paketKontrol('merkezDepo'), merkezDepoController.taninmSil);
router.post('/dagit', yonetimRol, paketKontrol('merkezDepo'), validate(manuelDagitSchema), merkezDepoController.manuelDagit);
router.get('/gecmis', yonetimRol, paketKontrol('merkezDepo'), validateQuery(gecmisQuerySchema), merkezDepoController.dagitimGecmisiGetir);

module.exports = router;