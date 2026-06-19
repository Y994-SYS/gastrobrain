const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const guncellenen = await prisma.kullanici.updateMany({
        where: { email: 'super@gastroiq.com', rol: 'SUPER_ADMIN' },
        data: { tenantId: null, subeId: null }
    });

    console.log(`✅ ${guncellenen.count} süper admin kaydı tenant'sız hale getirildi.`);

    const kontrol = await prisma.kullanici.findFirst({
        where: { email: 'super@gastroiq.com' }
    });
    console.log('Güncel kayıt:', kontrol);

    await prisma.$disconnect();
}

main().catch(e => {
    console.error('❌ Hata:', e.message);
    process.exit(1);
});