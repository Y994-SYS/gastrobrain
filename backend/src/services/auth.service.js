const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const prisma = new PrismaClient();

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
        let gercekTenantId = tenantId;
        if (tenantSlug && !tenantId) {
            const tenant = await prisma.tenant.findUnique({ where: { slug: tenantSlug } });
            if (!tenant) throw new Error('Firma bulunamadı');
            if (!tenant.aktif) throw new Error('Firma hesabı devre dışı');
            gercekTenantId = tenant.id;
        }

        if (!gercekTenantId) throw new Error('Firma bilgisi gerekli');

        const kullanici = await prisma.kullanici.findUnique({
            where: { email_tenantId: { email, tenantId: gercekTenantId } },
            include: { tenant: { select: { id: true, ad: true, aktif: true } } }
        });
        if (!kullanici) throw new Error('Email veya şifre hatalı');
        if (!kullanici.aktif) throw new Error('Hesabınız devre dışı');
        if (!kullanici.tenant.aktif) throw new Error('Firma hesabı devre dışı');

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
                tenantId: kullanici.tenantId, tenantAd: kullanici.tenant.ad
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
            const tenant = await tx.tenant.create({
                data: { ad: firmaAd, slug: slugTemiz, email: firmaEmail, telefon: firmaTelefon || null, plan: 'BASLANGIC' }
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

};

module.exports = authService;