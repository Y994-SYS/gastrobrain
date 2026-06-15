const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT),
    secure: false,
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
    },
    tls: {
        rejectUnauthorized: false
    }
});

const feedbackController = {
    async gonder(req, res) {
        try {
            const { tip, mesaj } = req.body;
            const { ad, email, tenantId } = req.kullanici;

            if (!mesaj?.trim()) {
                return res.status(400).json({ basarili: false, mesaj: 'Mesaj boş olamaz' });
            }

            const tipEtiket = {
                oneri: '💡 Öneri',
                hata: '🐛 Hata Bildirimi',
                diger: '💬 Diğer',
            }[tip] || '💬 Geri Bildirim';

            await transporter.sendMail({
                from: `"GastroBrain Feedback" <${process.env.SMTP_USER}>`,
                to: process.env.FEEDBACK_EMAIL,
                subject: `${tipEtiket} — ${ad} (Tenant: ${tenantId})`,
                html: `
                    <div style="font-family: sans-serif; max-width: 600px;">
                        <h2 style="color: #a3e635;">${tipEtiket}</h2>
                        <table style="width:100%; border-collapse: collapse; margin-bottom: 20px;">
                            <tr><td style="padding: 8px; color: #666;">Kullanıcı</td><td style="padding: 8px;"><b>${ad}</b></td></tr>
                            <tr><td style="padding: 8px; color: #666;">Email</td><td style="padding: 8px;">${email}</td></tr>
                            <tr><td style="padding: 8px; color: #666;">Tenant ID</td><td style="padding: 8px;">${tenantId}</td></tr>
                        </table>
                        <div style="background: #f4f4f4; padding: 16px; border-radius: 8px; white-space: pre-wrap;">${mesaj}</div>
                    </div>
                `,
            });

            res.json({ basarili: true, mesaj: 'Geri bildiriminiz iletildi, teşekkürler!' });
        } catch (err) {
            console.error('Feedback hatası:', err.message);
            res.status(500).json({ basarili: false, mesaj: 'Gönderilemedi, lütfen tekrar deneyin.' });
        }
    }
};

module.exports = feedbackController;