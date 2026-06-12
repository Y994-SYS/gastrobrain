const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const prisma = new PrismaClient();

const authService = {

    // Tenant bazlı kayıt (yeni firma kaydında kullanılacak)
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

    // tenantId ile giriş — aynı email farklı firmalarda olabilir
    async girisYap({ email, sifre, tenantId, tenantSlug }) {
        // tenantSlug verilmişse önce tenant'ı bul
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
            {
                id: kullanici.id,
                email: kullanici.email,
                rol: kullanici.rol,
                tenantId: kullanici.tenantId
            },
            process.env.JWT_SECRET,
            { expiresIn: process.env.JWT_EXPIRES_IN }
        );

        return {
            token,
            kullanici: {
                id: kullanici.id,
                ad: kullanici.ad,
                email: kullanici.email,
                rol: kullanici.rol,
                subeId: kullanici.subeId,
                tenantId: kullanici.tenantId,
                tenantAd: kullanici.tenant.ad
            }
        };
    },

    async tokenDogrula(token) {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const kullanici = await prisma.kullanici.findUnique({
            where: { id: decoded.id },
            select: {
                id: true, ad: true, email: true, rol: true,
                subeId: true, tenantId: true, aktif: true
            }
        });
        if (!kullanici || !kullanici.aktif) throw new Error('Geçersiz token');
        return kullanici;
    }

};

module.exports = authService;