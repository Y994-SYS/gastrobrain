const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const auditLog = {
    async kaydet({ eylem, detay, kullaniciId, tenantId, ip }) {
        try {
            await prisma.auditLog.create({
                data: {
                    eylem,
                    detay: detay ? JSON.stringify(detay) : null,
                    kullaniciId: kullaniciId || null,
                    tenantId,
                    ip: ip || null,
                }
            });
        } catch (err) {
            // Audit log hatası ana işlemi durdurmasın
            console.error('AuditLog hatası:', err.message);
        }
    },

    async getir(tenantId, limit = 100) {
        return prisma.auditLog.findMany({
            where: { tenantId },
            include: {
                kullanici: { select: { id: true, ad: true, email: true, rol: true } }
            },
            orderBy: { createdAt: 'desc' },
            take: limit
        });
    }
};

module.exports = auditLog;