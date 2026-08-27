const mailService = require('../services/mail.service');

// Basit email format kontrolü — RFC'nin tamamını kapsamaz ama form spam'ini
// ve bariz yanlış girişleri eler.
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const iletisimController = {
    async formuGonder(req, res) {
        try {
            const { ad, email, telefon, mesaj } = req.body;

            if (!ad || !ad.trim()) {
                return res.status(400).json({ hata: 'İsim zorunlu' });
            }
            if (!email || !EMAIL_REGEX.test(email.trim())) {
                return res.status(400).json({ hata: 'Geçerli bir e-posta girin' });
            }
            if (!mesaj || !mesaj.trim()) {
                return res.status(400).json({ hata: 'Mesaj zorunlu' });
            }
            if (mesaj.length > 5000) {
                return res.status(400).json({ hata: 'Mesaj çok uzun (maks. 5000 karakter)' });
            }
            if (ad.length > 200 || (telefon && telefon.length > 50)) {
                return res.status(400).json({ hata: 'Geçersiz giriş' });
            }

            await mailService.iletisimFormuMailGonder({
                ad: ad.trim(),
                email: email.trim(),
                telefon: telefon?.trim() || null,
                mesaj: mesaj.trim()
            });

            res.status(200).json({ basarili: true });
        } catch (err) {
            console.error('İletişim formu hatası:', err);
            res.status(500).json({ hata: 'Mesaj gönderilemedi, lütfen tekrar deneyin veya doğrudan email atın.' });
        }
    }
};

module.exports = iletisimController;