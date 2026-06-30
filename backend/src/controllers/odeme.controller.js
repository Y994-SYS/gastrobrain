const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { odemeBildirimMailGonder } = require('../services/mail.service');

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

        await prisma.$transaction([
            prisma.tenant.update({
                where: { id: bildirim.tenantId },
                data: {
                    lisansBitis: yeniBitis,
                    plan: planMap[bildirim.plan] || bildirim.tenant.plan,
                    lisansNot: `Ödeme onaylandı — ${bildirim.periyot} (${new Date().toLocaleDateString('tr-TR')})`,
                },
            }),
            prisma.odemeBildirimi.update({
                where: { id },
                data: { durum: 'ONAYLANDI', islenmeTarihi: new Date() },
            }),
        ]);

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

        await prisma.odemeBildirimi.update({
            where: { id },
            data: { durum: 'REDDEDILDI', redNotu, islenmeTarihi: new Date() },
        });

        res.json({ mesaj: 'Bildirim reddedildi' });
    } catch (err) {
        res.status(500).json({ hata: err.message });
    }
};

module.exports = { bildirimOlustur, kendiDurumu, bekleyenleriGetir, onayla, reddet };