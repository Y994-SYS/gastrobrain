const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();

async function main() {
    // Eskiyi sil
    await prisma.kullanici.deleteMany({ where: { email: 'super@gastroiq.com' } });

    // Yeniden oluştur
    const sifre = await bcrypt.hash('123456', 10);
    const k = await prisma.kullanici.create({
        data: {
            ad: 'Süper Admin',
            email: 'super@gastroiq.com',
            sifre,
            rol: 'SUPER_ADMIN',
            tenantId: 1,
            subeId: 1
        }
    });
    console.log('✅ Süper admin hazır:', k.email, '/ şifre: 123456');
    await prisma.$disconnect();
}

main().catch(e => { console.error(e.message); process.exit(1); });