const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const prisma = new PrismaClient();

const authService = {

    async kayitOl({ ad, email, sifre, rol, subeId }) {
        const mevcutKullanici = await prisma.kullanici.findUnique({ where: { email } });
        if (mevcutKullanici) throw new Error('Bu email zaten kayıtlı');

        const hashedSifre = await bcrypt.hash(sifre, 10);

        const kullanici = await prisma.kullanici.create({
            data: { ad, email, sifre: hashedSifre, rol, subeId },
            select: { id: true, ad: true, email: true, rol: true, subeId: true }
        });

        return kullanici;
    },

    async girisYap({ email, sifre }) {
        const kullanici = await prisma.kullanici.findUnique({ where: { email } });
        if (!kullanici) throw new Error('Email veya şifre hatalı');
        if (!kullanici.aktif) throw new Error('Hesabınız devre dışı');

        const sifreDoğru = await bcrypt.compare(sifre, kullanici.sifre);
        if (!sifreDoğru) throw new Error('Email veya şifre hatalı');

        const token = jwt.sign(
            { id: kullanici.id, email: kullanici.email, rol: kullanici.rol },
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
                subeId: kullanici.subeId
            }
        };
    },

    async tokenDogrula(token) {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const kullanici = await prisma.kullanici.findUnique({
            where: { id: decoded.id },
            select: { id: true, ad: true, email: true, rol: true, subeId: true, aktif: true }
        });
        if (!kullanici || !kullanici.aktif) throw new Error('Geçersiz token');
        return kullanici;
    }

};

module.exports = authService;