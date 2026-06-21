const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { demoBilgileriOlustur } = require('./demoSeed.service');
const prisma = new PrismaClient();
const { hosgeldinMailGonder } = require('./mail.service');

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
        let tenant = null;

        // Tenant slug verilmişse normal firma girişi
        if (tenantSlug) {
            tenant = await prisma.tenant.findUnique({ where: { slug: tenantSlug } });
            if (!tenant) throw new Error('Firma bulunamadı');
            if (!tenant.aktif) throw new Error('Firma hesabı devre dışı');
            gercekTenantId = tenant.id;
        }

        let kullanici;

        if (gercekTenantId) {
            // ── Normal (tenant'a bağlı) kullanıcı girişi ──
            kullanici = await prisma.kullanici.findUnique({
                where: { email_tenantId: { email, tenantId: gercekTenantId } },
                include: { tenant: { select: { id: true, ad: true, aktif: true, lisansBitis: true } } }
            });
        } else {
            // ── Tenant belirtilmemiş — tenant'sız SUPER_ADMIN hesabı ara ──
            kullanici = await prisma.kullanici.findFirst({
                where: { email, tenantId: null, rol: 'SUPER_ADMIN' }
            });
            if (!kullanici) throw new Error('Firma bilgisi gerekli');
        }

        if (!kullanici) throw new Error('Email veya şifre hatalı');
        if (!kullanici.aktif) throw new Error('Hesabınız devre dışı');

        // Tenant'a bağlı kullanıcılar için firma aktiflik ve lisans kontrolü
        if (kullanici.tenantId) {
            if (!kullanici.tenant.aktif) throw new Error('Firma hesabı devre dışı');
            if (kullanici.tenant.lisansBitis) {
                const bugun = new Date();
                const bitis = new Date(kullanici.tenant.lisansBitis);
                if (bitis < bugun) throw new Error('Lisans süreniz dolmuştur. Lütfen yöneticinizle iletişime geçin.');
            }
        }

        const sifreDoğru = await bcrypt.compare(sifre, kullanici.sifre);
        if (!sifreDoğru) throw new Error('Email veya şifre hatalı');

        const token = jwt.sign(
            { id: kullanici.id, email: kullanici.email, rol: kullanici.rol, tenantId: kullanici.tenantId },
            process.env.JWT_SECRET,
            { expiresIn: process.env.JWT_EXPIRES_IN }
        );

        return {
            token,
            kullanici: {
                id: kullanici.id, ad: kullanici.ad, email: kullanici.email,
                rol: kullanici.rol, subeId: kullanici.subeId,
                tenantId: kullanici.tenantId,
                tenantAd: kullanici.tenantId ? kullanici.tenant.ad : null
            }
        };
    },

    async tokenDogrula(token) {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const kullanici = await prisma.kullanici.findUnique({
            where: { id: decoded.id },
            select: { id: true, ad: true, email: true, rol: true, subeId: true, tenantId: true, aktif: true }
        });
        if (!kullanici || !kullanici.aktif) throw new Error('Geçersiz token');
        return kullanici;
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
                    ad: firmaAd,
                    slug: slugTemiz,
                    email: firmaEmail,
                    telefon: firmaTelefon || null,
                    plan: 'BASLANGIC',
                    lisansBitis: lisansBitis
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
            { id: sonuc.kullanici.id, email: sonuc.kullanici.email, rol: sonuc.kullanici.rol, tenantId: sonuc.tenant.id },
            process.env.JWT_SECRET,
            { expiresIn: process.env.JWT_EXPIRES_IN }
        );

        return {
            token,
            kullanici: {
                id: sonuc.kullanici.id, ad: sonuc.kullanici.ad, email: sonuc.kullanici.email,
                rol: sonuc.kullanici.rol, tenantId: sonuc.tenant.id,
                tenantAd: sonuc.tenant.ad, subeId: sonuc.sube.id,
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
            // Tenant'sız SUPER_ADMIN kaydı
            if (!k.tenantId) {
                return {
                    tenantId: null,
                    tenantAd: 'Süper Admin Paneli',
                    tenantSlug: null,
                    tenantAktif: true,
                    rol: k.rol,
                };
            }
            return {
                tenantId: k.tenantId,
                tenantAd: k.tenant.ad,
                tenantSlug: k.tenant.slug,
                tenantAktif: k.tenant.aktif,
                rol: k.rol,
            };
        });
    },


    async sifreSifirlamaTalep({ email }) {
        const crypto = require('crypto');

        // Bu emaile sahip kullanıcıları bul
        const kullanicilar = await prisma.kullanici.findMany({
            where: { email, aktif: true },
            include: { tenant: { select: { ad: true } } }
        });

        if (kullanicilar.length === 0) {
            // Güvenlik: email bulunsun ya da bulunmasın aynı mesajı ver
            return { mesaj: 'Email gönderildi' };
        }

        // Her tenant için ayrı token oluştur
        for (const k of kullanicilar) {
            // Eski tokenları iptal et
            await prisma.sifreToken.updateMany({
                where: { email, tenantId: k.tenantId, kullanildi: false },
                data: { kullanildi: true }
            });

            const token = crypto.randomBytes(32).toString('hex');
            const sonTarih = new Date(Date.now() + 60 * 60 * 1000); // 1 saat

            await prisma.sifreToken.create({
                data: { token, email, tenantId: k.tenantId, sonTarih }
            });

            const resetUrl = `${process.env.APP_URL}/sifre-sifirla?token=${token}`;
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



module.exports = authService;