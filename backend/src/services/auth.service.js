const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { demoBilgileriOlustur } = require('./demoSeed.service');
const prisma = new PrismaClient();
const { hosgeldinMailGonder } = require('./mail.service');

// Deneme süresi kontrolü — lisansBitis > şimdi ise deneme/aktif,
// ama kayıt tarihinden 30 gün içindeyse "deneme döneminde" sayılır.
const denemeDonemindeMi = (tenant) => {
    if (!tenant?.createdAt) return false;
    const otuzGun = new Date(tenant.createdAt);
    otuzGun.setDate(otuzGun.getDate() + 30);
    return new Date() <= otuzGun;
};

const authService = {

    async kayitOl({ ad, email, sifre, rol, subeId, tenantId }) {
        const mevcutKullanici = await prisma.kullanici.findUnique({
            where: { email_tenantId: { email, tenantId } }
        });
        if (mevcutKullanici) throw new Error('Bu email bu firmada zaten kayıtlı');

        const hashedSifre = await bcrypt.hash(sifre, 10);
        const kullanici = await prisma.kullanici.create({
            data: { ad, email, sifre: hashedSifre, rol, subeId, tenantId },
            select: { id: true, ad: true, email: true, rol: true, subeId: true, tenantId: true }
        });
        return kullanici;
    },

    async girisYap({ email, sifre, tenantId, tenantSlug }) {
        let gercekTenantId = tenantId ?? null;

        if (tenantSlug) {
            const tenant = await prisma.tenant.findUnique({ where: { slug: tenantSlug } });
            if (!tenant) throw new Error('Firma bulunamadı');
            if (!tenant.aktif) throw new Error('Firma hesabı devre dışı');
            gercekTenantId = tenant.id;
        }

        let kullanici;

        if (gercekTenantId) {
            kullanici = await prisma.kullanici.findUnique({
                where: { email_tenantId: { email, tenantId: gercekTenantId } },
                include: {
                    tenant: {
                        select: { id: true, ad: true, aktif: true, lisansBitis: true, plan: true, createdAt: true }
                    }
                }
            });
        } else {
            kullanici = await prisma.kullanici.findFirst({
                where: { email, tenantId: null, rol: 'SUPER_ADMIN' }
            });
            if (!kullanici) throw new Error('Firma bilgisi gerekli');
        }

        if (!kullanici) throw new Error('Email veya şifre hatalı');
        if (!kullanici.aktif) throw new Error('Hesabınız devre dışı');

        if (kullanici.tenantId) {
            if (!kullanici.tenant.aktif) throw new Error('Firma hesabı devre dışı');
        }

        const sifreDoğru = await bcrypt.compare(sifre, kullanici.sifre);
        if (!sifreDoğru) throw new Error('Email veya şifre hatalı');

        // Lisans & plan bilgileri
        let lisansDoldu = false;
        let denemede = false;
        let plan = kullanici.tenant?.plan || null;

        if (kullanici.tenantId && kullanici.tenant) {
            if (kullanici.tenant.lisansBitis) {
                lisansDoldu = new Date(kullanici.tenant.lisansBitis) < new Date();
            }
            denemede = denemeDonemindeVe(kullanici.tenant);
        }

        const token = jwt.sign(
            { id: kullanici.id, email: kullanici.email, rol: kullanici.rol, tenantId: kullanici.tenantId, lisansDoldu, plan, denemede },
            process.env.JWT_SECRET,
            { expiresIn: process.env.JWT_EXPIRES_IN }
        );

        return {
            token,
            kullanici: {
                id: kullanici.id, ad: kullanici.ad, email: kullanici.email,
                rol: kullanici.rol, subeId: kullanici.subeId,
                tenantId: kullanici.tenantId,
                tenantAd: kullanici.tenantId ? kullanici.tenant.ad : null,
                lisansDoldu, plan, denemede,
            }
        };
    },

    async tokenDogrula(token) {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const kullanici = await prisma.kullanici.findUnique({
            where: { id: decoded.id },
            include: { tenant: { select: { lisansBitis: true, plan: true, createdAt: true } } },
        });
        if (!kullanici || !kullanici.aktif) throw new Error('Geçersiz token');

        let lisansDoldu = false;
        let denemede = false;
        let plan = kullanici.tenant?.plan || null;

        if (kullanici.tenantId && kullanici.tenant) {
            if (kullanici.tenant.lisansBitis) {
                lisansDoldu = new Date(kullanici.tenant.lisansBitis) < new Date();
            }
            denemede = denemeDonemindeVe(kullanici.tenant);
        }

        return {
            id: kullanici.id, ad: kullanici.ad, email: kullanici.email,
            rol: kullanici.rol, subeId: kullanici.subeId,
            tenantId: kullanici.tenantId, aktif: kullanici.aktif,
            lisansDoldu, plan, denemede,
        };
    },

    async kayitFirma({ firmaAd, firmaSlug, firmaEmail, firmaTelefon, adminAd, adminEmail, adminSifre }) {
        const slugTemiz = firmaSlug
            ? firmaSlug.toLowerCase().replace(/[^a-z0-9-]/g, '-')
            : firmaAd.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-');

        const mevcutTenant = await prisma.tenant.findUnique({ where: { slug: slugTemiz } });
        if (mevcutTenant) throw new Error('Bu firma kodu zaten kullanımda');

        const mevcutEmail = await prisma.tenant.findUnique({ where: { email: firmaEmail } });
        if (mevcutEmail) throw new Error('Bu firma emaili zaten kayıtlı');

        const sonuc = await prisma.$transaction(async (tx) => {
            const lisansBitis = new Date();
            lisansBitis.setDate(lisansBitis.getDate() + 30);

            const tenant = await tx.tenant.create({
                data: {
                    ad: firmaAd, slug: slugTemiz, email: firmaEmail,
                    telefon: firmaTelefon || null, plan: 'BASLANGIC', lisansBitis,
                }
            });
            const sube = await tx.sube.create({
                data: { ad: `${firmaAd} - Merkez`, tenantId: tenant.id }
            });
            const hashedSifre = await bcrypt.hash(adminSifre, 10);
            const kullanici = await tx.kullanici.create({
                data: { ad: adminAd, email: adminEmail, sifre: hashedSifre, rol: 'TENANT_ADMIN', tenantId: tenant.id, subeId: sube.id }
            });

            return { tenant, sube, kullanici };
        });

        demoBilgileriOlustur(sonuc.tenant.id, sonuc.sube.id);
        try {
            await hosgeldinMailGonder(firmaEmail, firmaAd, adminAd, sonuc.tenant.lisansBitis);
        } catch (e) {
            console.error('Mail gönderilemedi:', e.message);
        }

        const token = jwt.sign(
            {
                id: sonuc.kullanici.id, email: sonuc.kullanici.email,
                rol: sonuc.kullanici.rol, tenantId: sonuc.tenant.id,
                lisansDoldu: false, plan: 'BASLANGIC', denemede: true,
            },
            process.env.JWT_SECRET,
            { expiresIn: process.env.JWT_EXPIRES_IN }
        );

        return {
            token,
            kullanici: {
                id: sonuc.kullanici.id, ad: sonuc.kullanici.ad, email: sonuc.kullanici.email,
                rol: sonuc.kullanici.rol, tenantId: sonuc.tenant.id,
                tenantAd: sonuc.tenant.ad, subeId: sonuc.sube.id,
                lisansDoldu: false, plan: 'BASLANGIC', denemede: true,
            }
        };
    },

    async tenantListesiGetir({ email }) {
        const kullanicilar = await prisma.kullanici.findMany({
            where: { email },
            include: { tenant: { select: { id: true, ad: true, slug: true, aktif: true } } }
        });

        if (kullanicilar.length === 0) throw new Error('Bu email ile kayıtlı hesap bulunamadı');

        return kullanicilar.map(k => {
            if (!k.tenantId) {
                return { tenantId: null, tenantAd: 'Süper Admin Paneli', tenantSlug: null, tenantAktif: true, rol: k.rol };
            }
            return {
                tenantId: k.tenantId, tenantAd: k.tenant.ad,
                tenantSlug: k.tenant.slug, tenantAktif: k.tenant.aktif, rol: k.rol,
            };
        });
    },

    async sifreSifirlamaTalep({ email }) {
        const crypto = require('crypto');
        const kullanicilar = await prisma.kullanici.findMany({
            where: { email, aktif: true },
            include: { tenant: { select: { ad: true } } }
        });

        if (kullanicilar.length === 0) return { mesaj: 'Email gönderildi' };

        for (const k of kullanicilar) {
            await prisma.sifreToken.updateMany({
                where: { email, tenantId: k.tenantId, kullanildi: false },
                data: { kullanildi: true }
            });

            const token = crypto.randomBytes(32).toString('hex');
            const sonTarih = new Date(Date.now() + 60 * 60 * 1000);

            await prisma.sifreToken.create({
                data: { token, email, tenantId: k.tenantId, sonTarih }
            });

            const appUrl = process.env.APP_URL || 'https://app.gastrobrain.com.tr';
            const resetUrl = `${appUrl}/sifre-sifirla?token=${token}`;
            const { sifreSifirlamaMailGonder } = require('./mail.service');
            await sifreSifirlamaMailGonder(email, k.ad, k.tenant?.ad || 'GastroBrain', resetUrl);
        }

        return { mesaj: 'Email gönderildi' };
    },

    async sifreSifirla({ token, yeniSifre }) {
        const kayit = await prisma.sifreToken.findUnique({ where: { token } });

        if (!kayit) throw new Error('Geçersiz veya süresi dolmuş bağlantı');
        if (kayit.kullanildi) throw new Error('Bu bağlantı daha önce kullanılmış');
        if (new Date() > kayit.sonTarih) throw new Error('Bağlantının süresi dolmuş');
        if (yeniSifre.length < 6) throw new Error('Şifre en az 6 karakter olmalı');

        const hash = await bcrypt.hash(yeniSifre, 10);

        await prisma.kullanici.updateMany({
            where: { email: kayit.email, tenantId: kayit.tenantId },
            data: { sifre: hash }
        });

        await prisma.sifreToken.update({
            where: { token },
            data: { kullanildi: true }
        });

        return { mesaj: 'Şifre güncellendi' };
    },
};

// İsim çakışması önlemi — fonksiyon adını düzelttik
function denemeDonemindeVe(tenant) {
    if (!tenant?.createdAt) return false;
    const otuzGun = new Date(tenant.createdAt);
    otuzGun.setDate(otuzGun.getDate() + 30);
    return new Date() <= otuzGun;
}

module.exports = authService;