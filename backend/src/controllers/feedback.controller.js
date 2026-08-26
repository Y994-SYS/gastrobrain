const mailService = require('../services/mail.service');

// GÜVENLİK/HTML-INJECTION kaçışlama mail.service.js içinde yapılıyor,
// burada tekrar etmiyoruz.

// DÜZELTME: Bu controller daha önce doğrudan nodemailer + SMTP
// (transporter.sendMail) kullanıyordu. Render'ın ücretsiz planı outbound
// SMTP portlarını (587/465/25) engellediği için istek hiç sonuçlanmıyor,
// `await` sonsuza dek bekliyor, response hiç gönderilmiyordu — frontend'de
// "Gönderiliyor..." butonunun takılı kalmasının sebebi buydu. Artık diğer
// tüm mailler gibi mail.service.js üzerinden Resend HTTPS API'sine gidiyor.
const feedbackController = {
    async gonder(req, res) {
        try {
            const { tip, mesaj } = req.body;
            const { ad, email, tenantId } = req.kullanici;

            if (!mesaj?.trim()) {
                return res.status(400).json({ basarili: false, mesaj: 'Mesaj boş olamaz' });
            }

            await mailService.geriBildirimMailGonder({ tip, mesaj, ad, email, tenantId });

            res.json({ basarili: true, mesaj: 'Geri bildiriminiz iletildi, teşekkürler!' });
        } catch (err) {
            console.error('Feedback hatası:', err.message);
            res.status(500).json({ basarili: false, mesaj: 'Gönderilemedi, lütfen tekrar deneyin.' });
        }
    }
};

module.exports = feedbackController;