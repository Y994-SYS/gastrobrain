// mail.service.js (RESEND API ile GÜNCELLENMİŞ — SMTP yerine HTTPS kullanır,
// Render'ın ücretsiz planındaki outbound SMTP port kısıtlamasını (587/465/25)
// bypass eder çünkü Resend'e istek normal HTTPS (443) üzerinden atılır.)

// GÜVENLİK: E-posta HTML injection önlemi — kullanıcı kontrolündeki serbest
// metin alanları (firma adı, admin adı, ödeme notu vb.) HTML'e gömülmeden
// önce kaçışlanır.
const htmlKacisla = (str) => String(str ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

const RESEND_API_KEY = process.env.RESEND_API_KEY;
// Domain doğrulanana kadar test için: 'onboarding@resend.dev'
// Domain doğrulandıktan sonra: 'GastroBrain <bildirim@gastrobrain.com.tr>' gibi
const GONDEREN = process.env.MAIL_FROM || 'GastroBrain <onboarding@resend.dev>';

// Ortak gönderim fonksiyonu — Resend REST API'sine HTTPS üzerinden istek atar.
async function mailGonder({ to, subject, html }) {
    if (!RESEND_API_KEY) {
        throw new Error('RESEND_API_KEY tanımlı değil (env variable eksik)');
    }

    const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${RESEND_API_KEY}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            from: GONDEREN,
            to: [to],
            subject,
            html,
        }),
    });

    if (!response.ok) {
        const hataMetni = await response.text().catch(() => '');
        throw new Error(`Resend API hatası (${response.status}): ${hataMetni}`);
    }

    return response.json();
}

const PLAN_ETIKET = { baslangic: 'Başlangıç', profesyonel: 'Profesyonel', kurumsal: 'Kurumsal' };
const PERIYOT_ETIKET = { aylik: 'Aylık', yillik: 'Yıllık' };

const mailService = {
    async hosgeldinMailGonder(email, firmaAd, adminAd, lisansBitis) {
        const bitisStr = new Date(lisansBitis).toLocaleDateString('tr-TR');
        const firmaAdGuvenli = htmlKacisla(firmaAd);
        const adminAdGuvenli = htmlKacisla(adminAd);
        await mailGonder({
            to: email,
            subject: `GastroBrain'e Hoş Geldiniz — ${firmaAdGuvenli}`,
            html: `
                <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
                    <div style="background: #0a0a0a; padding: 32px; text-align: center;">
                        <h1 style="color: #a3e635; font-size: 28px; margin: 0;">GastroBrain</h1>
                        <p style="color: #888; margin: 8px 0 0;">Restoran Yönetim Sistemi</p>
                    </div>
                    <div style="padding: 32px; background: #f9f9f9;">
                        <h2 style="color: #111;">Merhaba ${adminAdGuvenli},</h2>
                        <p style="color: #444; line-height: 1.6;">
                            <strong>${firmaAdGuvenli}</strong> firması için GastroBrain hesabınız başarıyla oluşturuldu.
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
        const firmaAdGuvenli = htmlKacisla(firmaAd);
        await mailGonder({
            to: email,
            subject: `⚠️ Lisansınız ${kalanGun} gün içinde bitiyor — ${firmaAdGuvenli}`,
            html: `
                <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
                    <div style="background: #0a0a0a; padding: 32px; text-align: center;">
                        <h1 style="color: #a3e635; font-size: 28px; margin: 0;">GastroBrain</h1>
                    </div>
                    <div style="padding: 32px; background: #f9f9f9;">
                        <h2 style="color: #111;">Lisans Yenileme Hatırlatması</h2>
                        <p style="color: #444; line-height: 1.6;">
                            <strong>${firmaAdGuvenli}</strong> firmasının GastroBrain lisansı <strong>${bitisStr}</strong> tarihinde sona erecek.
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
                            Açıklama: <strong>${firmaAdGuvenli} - GastroBrain</strong>
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
        const adGuvenli = htmlKacisla(ad);
        const firmaAdGuvenli = htmlKacisla(firmaAd);
        await mailGonder({
            to: email,
            subject: `GastroBrain — Şifre Sıfırlama`,
            html: `
            <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
                <div style="background: #0a0a0a; padding: 32px; text-align: center;">
                    <h1 style="color: #a3e635; font-size: 28px; margin: 0;">GastroBrain</h1>
                    <p style="color: #888; margin: 8px 0 0;">Restoran Yönetim Sistemi</p>
                </div>
                <div style="padding: 32px; background: #f9f9f9;">
                    <h2 style="color: #111;">Merhaba ${adGuvenli},</h2>
                    <p style="color: #444; line-height: 1.6;">
                        <strong>${firmaAdGuvenli}</strong> hesabınız için şifre sıfırlama talebinde bulunuldu.
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

    // ── Ödeme bildirimi geldiğinde admin'e mail ─────────────────────────────
    async odemeBildirimMailGonder(firmaAd, plan, periyot, tutar, not) {
        const adminEmail = process.env.FEEDBACK_EMAIL || process.env.SMTP_USER;
        const firmaAdGuvenli = htmlKacisla(firmaAd);
        const notGuvenli = not ? htmlKacisla(not) : null;

        await mailGonder({
            to: adminEmail,
            subject: `💰 Yeni Ödeme Bildirimi — ${firmaAdGuvenli}`,
            html: `
                <div style="font-family: sans-serif; max-width: 500px; margin: 0 auto;">
                    <h2 style="color: #18181b;">💰 Yeni Ödeme Bildirimi</h2>
                    <table style="width: 100%; border-collapse: collapse; margin-top: 16px;">
                        <tr><td style="padding: 8px 0; color: #71717a;">Firma:</td><td style="padding: 8px 0; font-weight: 600;">${firmaAdGuvenli}</td></tr>
                        <tr><td style="padding: 8px 0; color: #71717a;">Plan:</td><td style="padding: 8px 0; font-weight: 600;">${PLAN_ETIKET[plan] || plan}</td></tr>
                        <tr><td style="padding: 8px 0; color: #71717a;">Periyot:</td><td style="padding: 8px 0;">${PERIYOT_ETIKET[periyot] || periyot}</td></tr>
                        <tr><td style="padding: 8px 0; color: #71717a;">Tutar:</td><td style="padding: 8px 0; font-weight: 600; color: #65a30d;">₺${Number(tutar).toLocaleString('tr-TR')}</td></tr>
                        ${notGuvenli ? `<tr><td style="padding: 8px 0; color: #71717a;">Not:</td><td style="padding: 8px 0;">${notGuvenli}</td></tr>` : ''}
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

    // ── Kritik Stok Uyarı Maili ─────────────────────────────────────────────
    async kritikStokUyariGonder(email, firmaAd, kritikStoklar) {
        const firmaAdGuvenli = htmlKacisla(firmaAd);

        const satirlar = kritikStoklar.map(s => `
            <tr>
                <td style="padding: 10px 12px; border-bottom: 1px solid #e5e5e5;">${htmlKacisla(s.ad)}</td>
                <td style="padding: 10px 12px; border-bottom: 1px solid #e5e5e5; color: #666;">${htmlKacisla(s.kategori)}</td>
                <td style="padding: 10px 12px; border-bottom: 1px solid #e5e5e5; color: #ef4444; font-weight: bold; font-family: monospace;">
                    ${s.mevcutStok} ${htmlKacisla(s.birim)}
                </td>
                <td style="padding: 10px 12px; border-bottom: 1px solid #e5e5e5; color: #666;">
                    min: ${s.minStok}
                </td>
                ${s.subeAd ? `<td style="padding: 10px 12px; border-bottom: 1px solid #e5e5e5; color: #666;">${htmlKacisla(s.subeAd)}</td>` : ''}
            </tr>
        `).join('');

        await mailGonder({
            to: email,
            subject: `🚨 Kritik Stok Uyarısı — ${firmaAdGuvenli} (${kritikStoklar.length} ürün)`,
            html: `
                <div style="font-family: sans-serif; max-width: 650px; margin: 0 auto;">
                    <div style="background: #0a0a0a; padding: 24px 32px; display: flex; align-items: center; justify-content: space-between;">
                        <h1 style="color: #a3e635; font-size: 24px; margin: 0;">GastroBrain</h1>
                        <span style="color: #ef4444; font-size: 13px; font-weight: 600;">🚨 KRİTİK STOK</span>
                    </div>
                    <div style="padding: 32px; background: #f9f9f9;">
                        <h2 style="color: #111; margin-top: 0;">Kritik Stok Uyarısı</h2>
                        <p style="color: #444; line-height: 1.6;">
                            <strong>${firmaAdGuvenli}</strong> firmasında <strong>${kritikStoklar.length} ürün</strong> 
                            minimum stok seviyesinin altına düştü.
                        </p>

                        <div style="background: #fff; border-radius: 8px; overflow: hidden; border: 1px solid #e5e5e5; margin: 24px 0;">
                            <table style="width: 100%; border-collapse: collapse;">
                                <thead>
                                    <tr style="background: #f5f5f5;">
                                        <th style="padding: 10px 12px; text-align: left; font-size: 12px; color: #666; text-transform: uppercase;">Ürün</th>
                                        <th style="padding: 10px 12px; text-align: left; font-size: 12px; color: #666; text-transform: uppercase;">Kategori</th>
                                        <th style="padding: 10px 12px; text-align: left; font-size: 12px; color: #666; text-transform: uppercase;">Mevcut</th>
                                        <th style="padding: 10px 12px; text-align: left; font-size: 12px; color: #666; text-transform: uppercase;">Minimum</th>
                                        ${kritikStoklar[0]?.subeAd ? '<th style="padding: 10px 12px; text-align: left; font-size: 12px; color: #666; text-transform: uppercase;">Şube</th>' : ''}
                                    </tr>
                                </thead>
                                <tbody>${satirlar}</tbody>
                            </table>
                        </div>

                        <div style="text-align: center; margin: 24px 0;">
                            <a href="${process.env.APP_URL || 'https://app.gastrobrain.com.tr'}/stok/giris-faturasi"
                               style="background: #a3e635; color: #0a0a0a; padding: 12px 28px; border-radius: 8px; text-decoration: none; font-weight: bold; font-size: 15px;">
                                Stok Girişi Yap →
                            </a>
                        </div>

                        <p style="color: #888; font-size: 12px; text-align: center; margin-top: 24px;">
                            Bu uyarı GastroBrain tarafından otomatik gönderilmiştir.
                        </p>
                    </div>
                </div>
            `
        });
    },

    // ── Günlük Stok Raporu Maili ─────────────────────────────────────────────
    async gunlukStokRaporuGonder(email, firmaAd, ozet) {
        const firmaAdGuvenli = htmlKacisla(firmaAd);
        const bugun = new Date().toLocaleDateString('tr-TR', {
            weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
        });

        const kritikSatirlar = (ozet.kritikStoklar || []).slice(0, 10).map(s => `
            <tr>
                <td style="padding: 8px 12px; border-bottom: 1px solid #f0f0f0;">${htmlKacisla(s.ad)}</td>
                <td style="padding: 8px 12px; border-bottom: 1px solid #f0f0f0; color: #ef4444; font-family: monospace;">
                    ${s.mevcutStok} ${htmlKacisla(s.birim)}
                </td>
                <td style="padding: 8px 12px; border-bottom: 1px solid #f0f0f0; color: #888;">min: ${s.minStok}</td>
            </tr>
        `).join('');

        await mailGonder({
            to: email,
            subject: `📊 Günlük Stok Raporu — ${firmaAdGuvenli}`,
            html: `
                <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
                    <div style="background: #0a0a0a; padding: 24px 32px;">
                        <h1 style="color: #a3e635; font-size: 24px; margin: 0;">GastroBrain</h1>
                        <p style="color: #888; font-size: 13px; margin: 4px 0 0;">Günlük Stok Raporu — ${bugun}</p>
                    </div>
                    <div style="padding: 32px; background: #f9f9f9;">
                        <h2 style="color: #111; margin-top: 0;">${firmaAdGuvenli}</h2>

                        <!-- Özet Kartlar -->
                        <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; margin-bottom: 24px;">
                            <div style="background: #fff; border: 1px solid #e5e5e5; border-radius: 8px; padding: 16px; text-align: center;">
                                <div style="font-size: 24px; font-weight: bold; color: #111;">${ozet.toplamKart}</div>
                                <div style="font-size: 12px; color: #888; margin-top: 4px;">Toplam Ürün</div>
                            </div>
                            <div style="background: #fff; border: 1px solid ${ozet.kritikSayisi > 0 ? '#fca5a5' : '#e5e5e5'}; border-radius: 8px; padding: 16px; text-align: center;">
                                <div style="font-size: 24px; font-weight: bold; color: ${ozet.kritikSayisi > 0 ? '#ef4444' : '#22c55e'};">${ozet.kritikSayisi}</div>
                                <div style="font-size: 12px; color: #888; margin-top: 4px;">Kritik Stok</div>
                            </div>
                            <div style="background: #fff; border: 1px solid #e5e5e5; border-radius: 8px; padding: 16px; text-align: center;">
                                <div style="font-size: 24px; font-weight: bold; color: #a3e635;">₺${Number(ozet.gunlukCiro || 0).toLocaleString('tr-TR')}</div>
                                <div style="font-size: 12px; color: #888; margin-top: 4px;">Günlük Ciro</div>
                            </div>
                        </div>

                        <!-- Kritik Stoklar -->
                        ${ozet.kritikSayisi > 0 ? `
                        <h3 style="color: #ef4444; font-size: 15px; margin-bottom: 12px;">⚠️ Kritik Stoklar (${ozet.kritikSayisi})</h3>
                        <div style="background: #fff; border-radius: 8px; overflow: hidden; border: 1px solid #fca5a5; margin-bottom: 24px;">
                            <table style="width: 100%; border-collapse: collapse;">
                                <tbody>${kritikSatirlar}</tbody>
                            </table>
                            ${ozet.kritikStoklar?.length > 10 ? `<p style="text-align: center; color: #888; font-size: 12px; padding: 8px;">+${ozet.kritikStoklar.length - 10} ürün daha</p>` : ''}
                        </div>
                        ` : `
                        <div style="background: #f0fdf4; border: 1px solid #86efac; border-radius: 8px; padding: 16px; text-align: center; margin-bottom: 24px;">
                            <p style="color: #16a34a; margin: 0; font-weight: 600;">✅ Tüm stoklar yeterli seviyede</p>
                        </div>
                        `}

                        <div style="text-align: center;">
                            <a href="${process.env.APP_URL || 'https://app.gastrobrain.com.tr'}/stok/durum"
                               style="background: #a3e635; color: #0a0a0a; padding: 12px 28px; border-radius: 8px; text-decoration: none; font-weight: bold; font-size: 15px;">
                                Stok Durumunu Görüntüle →
                            </a>
                        </div>

                        <p style="color: #888; font-size: 12px; text-align: center; margin-top: 24px;">
                            Bu rapor her gün sabah 08:00'de otomatik gönderilir.
                        </p>
                    </div>
                </div>
            `
        });
    },

    // ── Geri Bildirim Maili ──────────────────────────────────────────────────
    // NOT: feedback.controller.js daha önce ayrı bir nodemailer/SMTP
    // transporter kullanıyordu — bu, mail.service.js'in başında bahsedilen
    // aynı Render SMTP port kısıtlaması (587/465/25) yüzünden isteğin hiç
    // sonuçlanmamasına (await'in sonsuza dek beklemesine) yol açıyordu.
    // Artık diğer tüm mailler gibi Resend HTTPS API'si üzerinden gönderiliyor.
    async geriBildirimMailGonder({ tip, mesaj, ad, email, tenantId }) {
        const adminEmail = process.env.FEEDBACK_EMAIL || process.env.SMTP_USER;
        const tipEtiket = {
            oneri: '💡 Öneri',
            hata: '🐛 Hata Bildirimi',
            diger: '💬 Diğer',
        }[tip] || '💬 Geri Bildirim';

        const adGuvenli = htmlKacisla(ad);
        const emailGuvenli = htmlKacisla(email);
        const mesajGuvenli = htmlKacisla(mesaj);

        await mailGonder({
            to: adminEmail,
            subject: `${tipEtiket} — ${adGuvenli} (Tenant: ${tenantId})`,
            html: `
                <div style="font-family: sans-serif; max-width: 600px;">
                    <h2 style="color: #a3e635;">${tipEtiket}</h2>
                    <table style="width:100%; border-collapse: collapse; margin-bottom: 20px;">
                        <tr><td style="padding: 8px; color: #666;">Kullanıcı</td><td style="padding: 8px;"><b>${adGuvenli}</b></td></tr>
                        <tr><td style="padding: 8px; color: #666;">Email</td><td style="padding: 8px;">${emailGuvenli}</td></tr>
                        <tr><td style="padding: 8px; color: #666;">Tenant ID</td><td style="padding: 8px;">${tenantId}</td></tr>
                    </table>
                    <div style="background: #f4f4f4; padding: 16px; border-radius: 8px; white-space: pre-wrap;">${mesajGuvenli}</div>
                </div>
            `,
        });
    },

    // ── İletişim Formu Maili (landing page'den) ─────────────────────────────
    // Landing page (gastrobrain.com.tr) üzerindeki iletişim formundan gelen
    // mesajları admin mailine iletir. Giriş yapmamış herkese açık bir uçtan
    // (iletisim.controller.js) çağrılır, bu yüzden ad/email/mesaj HTML'e
    // gömülmeden önce htmlKacisla ile kaçışlanıyor.
    async iletisimFormuMailGonder({ ad, email, telefon, mesaj }) {
        const adminEmail = process.env.FEEDBACK_EMAIL || process.env.SMTP_USER;
        const adGuvenli = htmlKacisla(ad);
        const emailGuvenli = htmlKacisla(email);
        const telefonGuvenli = telefon ? htmlKacisla(telefon) : null;
        const mesajGuvenli = htmlKacisla(mesaj).replace(/\n/g, '<br>');

        await mailGonder({
            to: adminEmail,
            subject: `📩 Yeni İletişim Formu Mesajı — ${adGuvenli}`,
            html: `
                <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
                    <div style="background: #0a0a0a; padding: 24px 32px;">
                        <h1 style="color: #a3e635; font-size: 24px; margin: 0;">GastroBrain</h1>
                        <p style="color: #888; font-size: 13px; margin: 4px 0 0;">Landing Page İletişim Formu</p>
                    </div>
                    <div style="padding: 32px; background: #f9f9f9;">
                        <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
                            <tr><td style="padding: 6px 0; color: #71717a; width: 100px;">İsim:</td><td style="padding: 6px 0; font-weight: 600;">${adGuvenli}</td></tr>
                            <tr><td style="padding: 6px 0; color: #71717a;">E-posta:</td><td style="padding: 6px 0;"><a href="mailto:${emailGuvenli}" style="color: #65a30d;">${emailGuvenli}</a></td></tr>
                            ${telefonGuvenli ? `<tr><td style="padding: 6px 0; color: #71717a;">Telefon:</td><td style="padding: 6px 0;">${telefonGuvenli}</td></tr>` : ''}
                        </table>
                        <div style="background: #fff; border: 1px solid #e5e5e5; border-radius: 8px; padding: 16px; line-height: 1.6; color: #333;">
                            ${mesajGuvenli}
                        </div>
                        <p style="margin-top: 20px;">
                            <a href="mailto:${emailGuvenli}" style="background: #a3e635; color: #18181b; padding: 10px 20px; border-radius: 8px; text-decoration: none; font-weight: 600;">
                                Yanıtla →
                            </a>
                        </p>
                    </div>
                </div>
            `
        });
    },
    // ── Yeni Kayıt Bildirimi (admin'e) ──────────────────────────────────────
    // Yeni bir firma (tenant) kaydolduğunda sana (FEEDBACK_EMAIL) haber
    // verir. hosgeldinMailGonder'ın hemen yanında, aynı try/catch deseniyle
    // çağrılır — bu mailin başarısız olması kayıt akışını ASLA engellemez.
    async yeniKayitBildirimMailGonder({ firmaAd, firmaEmail, firmaTelefon, adminAd, adminEmail }) {
        const hedefEmail = process.env.FEEDBACK_EMAIL || process.env.SMTP_USER;
        const firmaAdGuvenli = htmlKacisla(firmaAd);
        const firmaEmailGuvenli = htmlKacisla(firmaEmail);
        const adminAdGuvenli = htmlKacisla(adminAd);
        const adminEmailGuvenli = htmlKacisla(adminEmail);
        const telefonGuvenli = firmaTelefon ? htmlKacisla(firmaTelefon) : null;

        await mailGonder({
            to: hedefEmail,
            subject: `🎉 Yeni Kayıt — ${firmaAdGuvenli}`,
            html: `
                <div style="font-family: sans-serif; max-width: 500px; margin: 0 auto;">
                    <h2 style="color: #18181b;">🎉 Yeni Firma Kaydoldu</h2>
                    <table style="width: 100%; border-collapse: collapse; margin-top: 16px;">
                        <tr><td style="padding: 8px 0; color: #71717a;">Firma:</td><td style="padding: 8px 0; font-weight: 600;">${firmaAdGuvenli}</td></tr>
                        <tr><td style="padding: 8px 0; color: #71717a;">Firma Email:</td><td style="padding: 8px 0;">${firmaEmailGuvenli}</td></tr>
                        ${telefonGuvenli ? `<tr><td style="padding: 8px 0; color: #71717a;">Telefon:</td><td style="padding: 8px 0;">${telefonGuvenli}</td></tr>` : ''}
                        <tr><td style="padding: 8px 0; color: #71717a;">Admin:</td><td style="padding: 8px 0; font-weight: 600;">${adminAdGuvenli}</td></tr>
                        <tr><td style="padding: 8px 0; color: #71717a;">Admin Email:</td><td style="padding: 8px 0;">${adminEmailGuvenli}</td></tr>
                        <tr><td style="padding: 8px 0; color: #71717a;">Plan:</td><td style="padding: 8px 0;">Başlangıç (30 gün deneme)</td></tr>
                    </table>
                    <p style="margin-top: 20px;">
                        <a href="${process.env.APP_URL}/super-admin" style="background: #a3e635; color: #18181b; padding: 10px 20px; border-radius: 8px; text-decoration: none; font-weight: 600;">
                            Süper Admin Panelinde Görüntüle →
                        </a>
                    </p>
                </div>
            `
        });
    }

};

module.exports = mailService;