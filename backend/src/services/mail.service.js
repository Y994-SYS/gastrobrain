const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT),
    secure: false,
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
    },
    tls: { rejectUnauthorized: false }
});

const mailService = {
    async hosgeldinMailGonder(email, firmaAd, adminAd, lisansBitis) {
        const bitisStr = new Date(lisansBitis).toLocaleDateString('tr-TR');
        await transporter.sendMail({
            from: `"GastroBrain" <${process.env.SMTP_USER}>`,
            to: email,
            subject: `GastroBrain'e Hoş Geldiniz — ${firmaAd}`,
            html: `
                <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
                    <div style="background: #0a0a0a; padding: 32px; text-align: center;">
                        <h1 style="color: #a3e635; font-size: 28px; margin: 0;">GastroBrain</h1>
                        <p style="color: #888; margin: 8px 0 0;">Restoran Yönetim Sistemi</p>
                    </div>
                    <div style="padding: 32px; background: #f9f9f9;">
                        <h2 style="color: #111;">Merhaba ${adminAd},</h2>
                        <p style="color: #444; line-height: 1.6;">
                            <strong>${firmaAd}</strong> firması için GastroBrain hesabınız başarıyla oluşturuldu.
                        </p>
                        <div style="background: #fff; border: 1px solid #e5e5e5; border-radius: 8px; padding: 20px; margin: 24px 0;">
                            <p style="margin: 0 0 8px; color: #666; font-size: 14px;">ÜCRETSİZ DENEME SÜRENİZ</p>
                            <p style="margin: 0; font-size: 24px; font-weight: bold; color: #111;">${bitisStr} tarihine kadar</p>
                            <p style="margin: 8px 0 0; color: #666; font-size: 14px;">30 gün boyunca tüm özellikleri ücretsiz kullanın</p>
                        </div>
                        <div style="text-align: center; margin: 32px 0;">
                            <a href="${process.env.APP_URL || 'https://gastrobrain-frontend.onrender.com'}/giris" 
                               style="background: #a3e635; color: #0a0a0a; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: bold; font-size: 16px;">
                                Sisteme Giriş Yap →
                            </a>
                        </div>
                        <hr style="border: none; border-top: 1px solid #e5e5e5; margin: 24px 0;">
                        <p style="color: #666; font-size: 13px; line-height: 1.6;">
                            Sorularınız için <a href="mailto:${process.env.SMTP_USER}" style="color: #a3e635;">${process.env.SMTP_USER}</a> adresine yazabilirsiniz.
                        </p>
                    </div>
                </div>
            `
        });
    },

    async lisansBitisUyariGonder(email, firmaAd, kalanGun, lisansBitis) {
        const bitisStr = new Date(lisansBitis).toLocaleDateString('tr-TR');
        await transporter.sendMail({
            from: `"GastroBrain" <${process.env.SMTP_USER}>`,
            to: email,
            subject: `⚠️ Lisansınız ${kalanGun} gün içinde bitiyor — ${firmaAd}`,
            html: `
                <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
                    <div style="background: #0a0a0a; padding: 32px; text-align: center;">
                        <h1 style="color: #a3e635; font-size: 28px; margin: 0;">GastroBrain</h1>
                    </div>
                    <div style="padding: 32px; background: #f9f9f9;">
                        <h2 style="color: #111;">Lisans Yenileme Hatırlatması</h2>
                        <p style="color: #444; line-height: 1.6;">
                            <strong>${firmaAd}</strong> firmasının GastroBrain lisansı <strong>${bitisStr}</strong> tarihinde sona erecek.
                            (<strong>${kalanGun} gün</strong> kaldı)
                        </p>
                        <div style="background: #fff3cd; border: 1px solid #ffc107; border-radius: 8px; padding: 20px; margin: 24px 0;">
                            <p style="margin: 0; color: #856404;">
                                ⚠️ Lisansınız bittiğinde sisteme erişim 3 gün süreyle kısıtlanacak, ardından hesabınız pasife alınacaktır.
                            </p>
                        </div>
                        <p style="color: #444;">Lisans yenilemek için:</p>
                        <ul style="color: #444; line-height: 2;">
                            <li><strong>Aylık plan:</strong> ₺799</li>
                            <li><strong>Yıllık plan:</strong> ₺7.990 (%17 indirim)</li>
                        </ul>
                        <p style="color: #444;">
                            IBAN: <strong>TR00 0000 0000 0000 0000 0000 00</strong><br>
                            Açıklama: <strong>${firmaAd} - GastroBrain</strong>
                        </p>
                        <p style="color: #666; font-size: 13px;">
                            Ödeme sonrası <a href="mailto:${process.env.SMTP_USER}" style="color: #a3e635;">${process.env.SMTP_USER}</a> adresine bildirim yapın.
                        </p>
                    </div>
                </div>
            `
        });
    }
};

module.exports = mailService;