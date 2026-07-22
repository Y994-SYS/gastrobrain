const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { odemeBildirimMailGonder } = require('../services/mail.service');

// Bir bildirim zaten işlenmişken tekrar işlenmeye çalışıldığını ayırt etmek
// için özel hata sınıfı (eşzamanlı onay/red çakışması)
class AlreadyProcessedError extends Error { }

// POST /api/odeme/bildir — kullanıcı "Ödeme Yaptım" der
const bildirimOlustur = async (req, res) => {
    try {
        const { plan, periyot, tutar, not } = req.body;
        const tenantId = req.kullanici.tenantId;

        if (!plan || !periyot || !tutar) {
            return res.status(400).json({ hata: 'Plan, periyot ve tutar zorunlu' });
        }

        // Aynı tenant'ın zaten bekleyen bir bildirimi varsa engelle
        const mevcut = await prisma.odemeBildirimi.findFirst({
            where: { tenantId, durum: 'BEKLIYOR' },
        });
        if (mevcut) {
            return res.status(400).json({ hata: 'Zaten bekleyen bir ödeme bildiriminiz var' });
        }

        const bildirim = await prisma.odemeBildirimi.create({
            data: { plan, periyot, tutar: Number(tutar), not, tenantId },
        });

        // Admin'e bilgi maili (best-effort, hata olsa da akışı durdurmaz)
        try {
            const tenant = await prisma.tenant.findUnique({ where: { id: tenantId } });
            await odemeBildirimMailGonder(tenant.ad, plan, periyot, tutar, not);
        } catch (e) {
            console.error('Ödeme bildirim maili gönderilemedi:', e.message);
        }

        res.status(201).json({ mesaj: 'Ödeme bildiriminiz alındı', data: bildirim });
    } catch (err) {
        res.status(500).json({ hata: err.message });
    }
};

// GET /api/odeme/durumum — kullanıcı kendi bekleyen bildirimini görsün
const kendiDurumu = async (req, res) => {
    try {
        const son = await prisma.odemeBildirimi.findFirst({
            where: { tenantId: req.kullanici.tenantId },
            orderBy: { createdAt: 'desc' },
        });
        res.json(son);
    } catch (err) {
        res.status(500).json({ hata: err.message });
    }
};

// ── SUPER ADMIN ──────────────────────────────────────────────────────────────

// GET /api/odeme/bekleyenler
const bekleyenleriGetir = async (req, res) => {
    try {
        const durum = req.query.durum || 'BEKLIYOR';
        const bildirimler = await prisma.odemeBildirimi.findMany({
            where: { durum },
            include: { tenant: { select: { id: true, ad: true, slug: true, email: true, lisansBitis: true } } },
            orderBy: { createdAt: 'desc' },
        });
        res.json(bildirimler);
    } catch (err) {
        res.status(500).json({ hata: err.message });
    }
};

const PERIYOT_GUN = { aylik: 30, yillik: 365 };

// PATCH /api/odeme/:id/onayla
const onayla = async (req, res) => {
    try {
        const id = parseInt(req.params.id);
        const bildirim = await prisma.odemeBildirimi.findUnique({
            where: { id },
            include: { tenant: true },
        });
        if (!bildirim) return res.status(404).json({ hata: 'Bildirim bulunamadı' });
        if (bildirim.durum !== 'BEKLIYOR') return res.status(400).json({ hata: 'Bu bildirim zaten işlenmiş' });

        const gun = PERIYOT_GUN[bildirim.periyot] || 30;
        const mevcutBitis = bildirim.tenant.lisansBitis
            ? new Date(bildirim.tenant.lisansBitis)
            : new Date();
        const baz = mevcutBitis > new Date() ? mevcutBitis : new Date(); // geçmiş tarihliyse bugünden say
        const yeniBitis = new Date(baz);
        yeniBitis.setDate(yeniBitis.getDate() + gun);

        const planMap = { baslangic: 'BASLANGIC', profesyonel: 'PROFESYONEL', kurumsal: 'KURUMSAL' };

        try {
            await prisma.$transaction(async (tx) => {
                // Atomik "claim": sadece bildirim hâlâ BEKLIYOR durumundaysa
                // güncelle. updateMany'nin döndürdüğü count 0 ise, bildirim bu
                // sırada başka bir istek tarafından (çift tıklama, eşzamanlı
                // ikinci bir admin isteği vb.) zaten işlenmiş demektir — bu
                // sayede lisansın iki kere uzatılması engellenir.
                const claim = await tx.odemeBildirimi.updateMany({
                    where: { id, durum: 'BEKLIYOR' },
                    data: { durum: 'ONAYLANDI', islenmeTarihi: new Date() },
                });

                if (claim.count === 0) {
                    throw new AlreadyProcessedError();
                }

                await tx.tenant.update({
                    where: { id: bildirim.tenantId },
                    data: {
                        lisansBitis: yeniBitis,
                        plan: planMap[bildirim.plan] || bildirim.tenant.plan,
                        lisansNot: `Ödeme onaylandı — ${bildirim.periyot} (${new Date().toLocaleDateString('tr-TR')})`,
                    },
                });
            });
        } catch (err) {
            if (err instanceof AlreadyProcessedError) {
                return res.status(409).json({ hata: 'Bu bildirim başka bir işlem tarafından zaten işlendi' });
            }
            throw err;
        }

        res.json({ mesaj: 'Ödeme onaylandı, lisans uzatıldı' });
    } catch (err) {
        res.status(500).json({ hata: err.message });
    }
};

// PATCH /api/odeme/:id/reddet
const reddet = async (req, res) => {
    try {
        const id = parseInt(req.params.id);
        const { redNotu } = req.body;

        const bildirim = await prisma.odemeBildirimi.findUnique({ where: { id } });
        if (!bildirim) return res.status(404).json({ hata: 'Bildirim bulunamadı' });
        if (bildirim.durum !== 'BEKLIYOR') return res.status(400).json({ hata: 'Bu bildirim zaten işlenmiş' });

        // Aynı atomik "claim" deseni — onayla ile aynı anda tetiklenirse
        // (ya da reddet çift tıklanırsa) sadece biri işlemi tamamlar.
        const claim = await prisma.odemeBildirimi.updateMany({
            where: { id, durum: 'BEKLIYOR' },
            data: { durum: 'REDDEDILDI', redNotu, islenmeTarihi: new Date() },
        });

        if (claim.count === 0) {
            return res.status(409).json({ hata: 'Bu bildirim başka bir işlem tarafından zaten işlendi' });
        }

        res.json({ mesaj: 'Bildirim reddedildi' });
    } catch (err) {
        res.status(500).json({ hata: err.message });
    }
};

module.exports = { bildirimOlustur, kendiDurumu, bekleyenleriGetir, onayla, reddet };