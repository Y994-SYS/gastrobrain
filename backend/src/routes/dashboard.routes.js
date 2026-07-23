const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/dashboard.controller');
const { authMiddleware, rolKontrol } = require('../middleware/auth.middleware');

router.use(authMiddleware);

// Diğer modüllerdeki (rapor, export, cariHareket, transfer) yönetim
// yetkisiyle tutarlı olacak şekilde, şube bazlı ciro/personel/kritik stok
// özetini sadece TENANT_ADMIN ve MUDUR görebilir. Önceden hiçbir rol
// kısıtlaması yoktu — herhangi bir giriş yapmış kullanıcı (PERSONEL, KASA
// dahil) tüm şubelerin ciro ve personel verisini görebiliyordu.
const yonetimRol = rolKontrol('TENANT_ADMIN', 'MUDUR');

router.get('/subeler', yonetimRol, dashboardController.subeOzeti);

module.exports = router;