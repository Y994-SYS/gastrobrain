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

const PLAN_ETIKET = { baslangic: 'Başlangıç', profesyonel: 'Profesyonel', kurumsal: 'Kurumsal' };
const PERIYOT_ETIKET = { aylik: 'Aylık', yillik: 'Yıllık' };

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
                            IBAN: <strong>TR64 0006 2001 2620 0006 6629 79</strong><br>
                            Açıklama: <strong>${firmaAd} - GastroBrain</strong>
                        </p>
                        <p style="color: #666; font-size: 13px;">
                            Ödeme sonrası <a href="mailto:${process.env.SMTP_USER}" style="color: #a3e635;">${process.env.SMTP_USER}</a> adresine bildirim yapın.
                        </p>
                    </div>
                </div>
            `
        });
    },

    async sifreSifirlamaMailGonder(email, ad, firmaAd, resetUrl) {
        await transporter.sendMail({
            from: `"GastroBrain" <${process.env.SMTP_USER}>`,
            to: email,
            subject: `GastroBrain — Şifre Sıfırlama`,
            html: `
            <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
                <div style="background: #0a0a0a; padding: 32px; text-align: center;">
                    <h1 style="color: #a3e635; font-size: 28px; margin: 0;">GastroBrain</h1>
                    <p style="color: #888; margin: 8px 0 0;">Restoran Yönetim Sistemi</p>
                </div>
                <div style="padding: 32px; background: #f9f9f9;">
                    <h2 style="color: #111;">Merhaba ${ad},</h2>
                    <p style="color: #444; line-height: 1.6;">
                        <strong>${firmaAd}</strong> hesabınız için şifre sıfırlama talebinde bulunuldu.
                    </p>
                    <div style="text-align: center; margin: 32px 0;">
                        <a href="${resetUrl}" 
                           style="background: #a3e635; color: #0a0a0a; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: bold; font-size: 16px;">
                            Şifremi Sıfırla →
                        </a>
                    </div>
                    <p style="color: #666; font-size: 13px; text-align: center;">
                        Bu bağlantı 1 saat geçerlidir. Talebi siz yapmadıysanız bu emaili görmezden gelin.
                    </p>
                </div>
            </div>
        `
        });
    },

    // ── YENİ — Ödeme bildirimi geldiğinde admin'e mail ─────────────────────────
    async odemeBildirimMailGonder(firmaAd, plan, periyot, tutar, not) {
        const adminEmail = process.env.FEEDBACK_EMAIL || process.env.SMTP_USER;

        await transporter.sendMail({
            from: `"GastroBrain" <${process.env.SMTP_USER}>`,
            to: adminEmail,
            subject: `💰 Yeni Ödeme Bildirimi — ${firmaAd}`,
            html: `
                <div style="font-family: sans-serif; max-width: 500px; margin: 0 auto;">
                    <h2 style="color: #18181b;">💰 Yeni Ödeme Bildirimi</h2>
                    <table style="width: 100%; border-collapse: collapse; margin-top: 16px;">
                        <tr><td style="padding: 8px 0; color: #71717a;">Firma:</td><td style="padding: 8px 0; font-weight: 600;">${firmaAd}</td></tr>
                        <tr><td style="padding: 8px 0; color: #71717a;">Plan:</td><td style="padding: 8px 0; font-weight: 600;">${PLAN_ETIKET[plan] || plan}</td></tr>
                        <tr><td style="padding: 8px 0; color: #71717a;">Periyot:</td><td style="padding: 8px 0;">${PERIYOT_ETIKET[periyot] || periyot}</td></tr>
                        <tr><td style="padding: 8px 0; color: #71717a;">Tutar:</td><td style="padding: 8px 0; font-weight: 600; color: #65a30d;">₺${Number(tutar).toLocaleString('tr-TR')}</td></tr>
                        ${not ? `<tr><td style="padding: 8px 0; color: #71717a;">Not:</td><td style="padding: 8px 0;">${not}</td></tr>` : ''}
                    </table>
                    <p style="margin-top: 20px;">
                        <a href="${process.env.APP_URL}/super-admin" style="background: #a3e635; color: #18181b; padding: 10px 20px; border-radius: 8px; text-decoration: none; font-weight: 600;">
                            Süper Admin Panelinde Görüntüle →
                        </a>
                    </p>
                </div>
            `
        });
    },
};


module.exports = mailService;