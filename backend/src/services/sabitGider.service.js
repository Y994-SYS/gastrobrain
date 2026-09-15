const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// stokKart / cariKart / personel gibi diğer servislerle aynı ilke: her
// sorgu tenantId ile sınırlanır, IDOR riskine karşı ilişkili kayıtlar
// (burada: sube) da tenant'a ait olduğu doğrulanarak bağlanır.

const subeDogrula = async (subeId, tenantId) => {
    if (subeId === undefined || subeId === null || subeId === '') return null;
    const sube = await prisma.sube.findFirst({
        where: { id: Number(subeId), tenantId },
        select: { id: true }
    });
    if (!sube) {
        throw new Error('Geçersiz şube: bulunamadı veya erişim yetkiniz yok');
    }
    return sube.id;
};

const sabitGiderService = {

    // subeId verilirse hem o şubenin gideri hem de "tüm işletme geneli"
    // (subeId: null) giderler birlikte döner — Kâr-Zarar raporunda da
    // aynı mantık uygulanacak (bkz. karZararRaporu güncellemesi).
    async hepsiniGetir(tenantId, { subeId, yil, ay, kategori } = {}) {
        const where = { tenantId };

        if (subeId) {
            where.OR = [{ subeId: Number(subeId) }, { subeId: null }];
        }
        if (yil) where.yil = Number(yil);
        if (ay) where.ay = Number(ay);
        if (kategori) where.kategori = kategori;

        return prisma.sabitGider.findMany({
            where,
            include: { sube: { select: { id: true, ad: true } } },
            orderBy: [{ yil: 'desc' }, { ay: 'desc' }, { id: 'desc' }],
        });
    },

    async biriniGetir(id, tenantId) {
        const gider = await prisma.sabitGider.findFirst({
            where: { id: Number(id), tenantId },
            include: { sube: { select: { id: true, ad: true } } },
        });
        if (!gider) throw new Error('Sabit gider bulunamadı');
        return gider;
    },

    async olustur({ kategori, ad, yil, ay, tutar, aciklama, subeId }, tenantId) {
        if (!kategori) throw new Error('Kategori zorunlu');
        if (!yil || !ay) throw new Error('Yıl ve ay zorunlu');
        if (ay < 1 || ay > 12) throw new Error('Ay 1-12 arasında olmalı');
        if (tutar === undefined || tutar === null || Number(tutar) <= 0) {
            throw new Error('Tutar sıfırdan büyük olmalı');
        }

        const dogrulanmisSubeId = await subeDogrula(subeId, tenantId);

        return prisma.sabitGider.create({
            data: {
                kategori, ad, aciklama,
                yil: Number(yil), ay: Number(ay), tutar: Number(tutar),
                subeId: dogrulanmisSubeId,
                tenantId,
            },
            include: { sube: { select: { id: true, ad: true } } },
        });
    },

    async guncelle(id, { kategori, ad, yil, ay, tutar, aciklama, subeId }, tenantId) {
        await this.biriniGetir(id, tenantId);

        if (ay !== undefined && ay !== null && (ay < 1 || ay > 12)) {
            throw new Error('Ay 1-12 arasında olmalı');
        }
        if (tutar !== undefined && tutar !== null && Number(tutar) <= 0) {
            throw new Error('Tutar sıfırdan büyük olmalı');
        }

        const dogrulanmisSubeId = subeId !== undefined
            ? await subeDogrula(subeId, tenantId)
            : undefined;

        return prisma.sabitGider.update({
            where: { id: Number(id) },
            data: {
                ...(kategori !== undefined && { kategori }),
                ...(ad !== undefined && { ad }),
                ...(aciklama !== undefined && { aciklama }),
                ...(yil !== undefined && { yil: Number(yil) }),
                ...(ay !== undefined && { ay: Number(ay) }),
                ...(tutar !== undefined && { tutar: Number(tutar) }),
                ...(dogrulanmisSubeId !== undefined && { subeId: dogrulanmisSubeId }),
            },
            include: { sube: { select: { id: true, ad: true } } },
        });
    },

    // PersonelMaas'taki maasOdendi ile aynı desen — sadece odendi/odemeTarihi
    // günceller, diğer alanlara dokunmaz.
    async odendiIsaretle(id, tenantId) {
        await this.biriniGetir(id, tenantId);
        return prisma.sabitGider.update({
            where: { id: Number(id) },
            data: { odendi: true, odemeTarihi: new Date() },
        });
    },

    async sil(id, tenantId) {
        await this.biriniGetir(id, tenantId);
        return prisma.sabitGider.delete({ where: { id: Number(id) } });
    },

    // karZararRaporu'nun ihtiyacı olan tek şey: verilen tarih aralığındaki
    // toplam tutar. yil/ay bazlı bir model olduğu için tarih aralığını
    // yıl+ay çiftlerine çevirip filtreliyoruz — StokHareket/Satis gibi
    // gerçek DateTime alanı yok, PersonelMaas ile aynı kısıt.
    async toplamGetir(tenantId, { subeId, baslangicTarihi, bitisTarihi } = {}) {
        const where = { tenantId };

        if (subeId) {
            where.OR = [{ subeId: Number(subeId) }, { subeId: null }];
        }

        if (baslangicTarihi && bitisTarihi) {
            const b = new Date(baslangicTarihi);
            const s = new Date(bitisTarihi);
            // yil*12+ay üzerinden aralık karşılaştırması — ay bazlı
            // modelde en basit doğru yaklaşım bu.
            const baslangicKod = b.getFullYear() * 12 + b.getMonth();
            const bitisKod = s.getFullYear() * 12 + s.getMonth();

            const hepsi = await prisma.sabitGider.findMany({ where, select: { yil: true, ay: true, tutar: true } });
            const filtrelenmis = hepsi.filter(g => {
                const kod = g.yil * 12 + (g.ay - 1);
                return kod >= baslangicKod && kod <= bitisKod;
            });
            return filtrelenmis.reduce((t, g) => t + g.tutar, 0);
        }

        const toplam = await prisma.sabitGider.aggregate({ where, _sum: { tutar: true } });
        return toplam._sum.tutar || 0;
    },

};

module.exports = sabitGiderService;