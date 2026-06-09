const authService = require('../services/auth.service');

const authMiddleware = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ basarili: false, mesaj: 'Token bulunamadı' });
        }

        const token = authHeader.split(' ')[1];
        const kullanici = await authService.tokenDogrula(token);
        req.kullanici = kullanici;
        next();
    } catch (error) {
        res.status(401).json({ basarili: false, mesaj: 'Geçersiz veya süresi dolmuş token' });
    }
};

const rolKontrol = (...roller) => {
    return (req, res, next) => {
        if (!roller.includes(req.kullanici.rol)) {
            return res.status(403).json({ basarili: false, mesaj: 'Bu işlem için yetkiniz yok' });
        }
        next();
    };
};

module.exports = { authMiddleware, rolKontrol };