const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();

async function main() {
    const sifre = await bcrypt.hash('superadmin123', 10);
    const kullanici = await prisma.kullanici.create({
        data: {
            ad: 'Süper Admin',
            email: 'super@gastroiq.com',
            sifre,
            rol: 'SUPER_ADMIN',
            tenantId: 1,
            subeId: 1
        }
    });
    console.log('✅ Süper admin oluşturuldu:', kullanici.email);
    await prisma.$disconnect();
}

main().catch(e => { console.error(e.message); process.exit(1); });