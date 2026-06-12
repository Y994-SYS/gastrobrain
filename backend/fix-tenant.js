const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const t = await prisma.tenant.update({ where: { id: 1 }, data: { aktif: true } });
    console.log('✅ Aktif edildi:', t.ad);
    await prisma.$disconnect();
}

main();