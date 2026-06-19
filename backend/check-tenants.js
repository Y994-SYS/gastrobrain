const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const tenantlar = await prisma.tenant.findMany({
        select: { id: true, ad: true, slug: true, aktif: true }
    });
    console.log('📋 TENANT LİSTESİ:');
    console.table(tenantlar);

    if (tenantlar.length > 0) {
        const subeler = await prisma.sube.findMany({
            where: { tenantId: tenantlar[0].id },
            select: { id: true, ad: true, tenantId: true }
        });
        console.log(`\n📋 İlk tenant'ın (id: ${tenantlar[0].id}) ŞUBE LİSTESİ:`);
        console.table(subeler);
    } else {
        console.log('\n⚠️ Hiç tenant yok! Önce bir tenant oluşturulmalı.');
    }

    await prisma.$disconnect();
}

main().catch(e => { console.error(e.message); process.exit(1); });