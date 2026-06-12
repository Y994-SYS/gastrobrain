const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();

async function main() {
    const tenant2 = await prisma.tenant.create({
        data: { ad: 'Test Restoran 2', slug: 'test-restoran-2', email: 'info@test2.com', plan: 'BASLANGIC' }
    });
    const sube2 = await prisma.sube.create({
        data: { ad: 'Test Şube', tenantId: tenant2.id }
    });
    const sifre = await bcrypt.hash('123456', 10);
    await prisma.kullanici.create({
        data: { ad: 'Test Admin 2', email: 'admin@test2.com', sifre, rol: 'TENANT_ADMIN', tenantId: tenant2.id, subeId: sube2.id }
    });
    console.log('✅ Tenant 2 oluşturuldu, id:', tenant2.id);
    await prisma.$disconnect();
}

main().catch(e => { console.error(e); process.exit(1); });