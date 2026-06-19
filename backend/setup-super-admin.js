const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();

async function main() {
    // 1. Tenant oluştur
    const tenant = await prisma.tenant.create({
        data: {
            ad: 'Merkez Restoran',
            slug: 'merkez-restoran',
            email: 'info@gastroiq.com',
            plan: 'BASLANGIC',
        }
    });
    console.log('✅ Tenant oluşturuldu, id:', tenant.id);

    // 2. Şube oluştur
    const sube = await prisma.sube.create({
        data: {
            ad: 'Merkez Şube',
            tenantId: tenant.id,
        }
    });
    console.log('✅ Şube oluşturuldu, id:', sube.id);

    // 3. Süper admin oluştur
    const sifre = await bcrypt.hash('123456', 10);
    const kullanici = await prisma.kullanici.create({
        data: {
            ad: 'Süper Admin',
            email: 'super@gastroiq.com',
            sifre,
            rol: 'SUPER_ADMIN',
            tenantId: tenant.id,
            subeId: sube.id,
        }
    });

    console.log('\n✅ HAZIR!');
    console.log('   Email :', kullanici.email);
    console.log('   Şifre : 123456');
    console.log('   Rol   :', kullanici.rol);
    console.log('   Tenant ID:', tenant.id, '/ Şube ID:', sube.id);

    await prisma.$disconnect();
}

main().catch(e => {
    console.error('❌ Hata:', e.message);
    process.exit(1);
});