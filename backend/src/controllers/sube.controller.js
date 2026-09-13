const { PrismaClient } = require('@prisma/client');
const stokService = require('../services/stok.service');
const prisma = new PrismaClient();

const bugunBaslangicTR = () => {
    const now = new Date();
    const trOffset = 3 * 60 * 60 * 1000;
    const trNow = new Date(now.getTime() + trOffset);
    const trBaslangic = new Date(Date.UTC(
        trNow.getUTCFullYear(), trNow.getUTCMonth(), trNow.getUTCDate(), 0, 0, 0, 0
    ));
    return new Date(trBaslangic.getTime() - trOffset);
};

const PLAN_LIMITLERI = {
    BASLANGIC: { maxSube: 1 },
    PROFESYONEL: { maxSube: Infinity },
    KURUMSAL: { maxSube: Infinity },
};

// MUDUR rolü sadece kendi şubesini görebilir/yönetebilir — diğer modüllerle
// (rapor, export, personel, stok, dashboard) tutarlı olacak şekilde.
const kendiSubesineKilitliMi = (req, id) => {
    return req.kullanici.rol === 'MUDUR' && id !== req.kullanici.subeId;
};

const hepsiniGetir = async (req, res) => {
    try {
        const tenantId = req.kullanici.tenantId;
        const rol = req.kullanici.rol;
        const bugun = bugunBaslangicTR();

        const where = { tenantId };
        if (rol === 'MUDUR') {
            where.id = req.kullanici.subeId;
        }

        const subeler = await prisma.sube.findMany({
            where,
            include: { _count: { select: { kullanicilar: true, personeller: true } } },
            orderBy: { id: 'asc' },
        });

        if (subeler.length === 0) return res.json([]);
        const subeIdler = subeler.map(s => s.id);

        const satisToplam = await prisma.satis.groupBy({
            by: ['subeId'],
            where: { subeId: { in: subeIdler }, tarih: { gte: bugun } },
            _sum: { toplam: true },
        });
        const satisMap = new Map(satisToplam.map(s => [s.subeId, s._sum.toplam || 0]));

        const stokKartlari = await prisma.stokKart.findMany({
            where: { tenantId, minStok: { gt: 0 }, aktif: true },
            select: { id: true, minStok: true },
        });
        const kritikMap = new Map(subeIdler.map(id => [id, 0]));

        if (stokKartlari.length > 0) {
            const kartIdler = stokKartlari.map(k => k.id);
            const minStokMap = new Map(stokKartlari.map(k => [k.id, k.minStok]));

            // DÜZELTME: Önceden burada groupBy + kendi (HATALI) GIRIS_TIPLER
            // listesiyle özet toplamlar üzerinden bakiye hesaplanıyordu.
            // Sorunlar: (1) IADE_FATURA yanlışlıkla GİRİŞ sayılıyordu —
            // oysa tedarikçiye iade stoku AZALTIR; (2) AY_SONU_SAYIM hiç
            // tanınmıyordu, bu yüzden sayım düzeltmesinin yönüne
            // bakılmaksızın her zaman ÇIKIŞ gibi işleniyordu. Bu ikisi
            // birlikte, özellikle çok sayım/iade geçmişi olan kartlarda
            // (Dana Kuşbaşı, Soğan gibi) devasa negatif/yanlış bakiyelere
            // yol açıyordu. groupBy ile özetlenmiş toplamlar üzerinden bu
            // düzeltilemez — AY_SONU_SAYIM'ın yönü her kaydın kendi
            // açıklamasında ("fark: ±X") saklı, tek bir SUM'a indirgenince
            // bu bilgi kayboluyor. Bu yüzden artık HAM hareket kayıtlarını
            // çekip stok.service.js'deki TEK doğru fonksiyonu
            // (bakiyeHesapla) kullanıyoruz — stokRaporu ve tumStokDurumu
            // ile birebir aynı sonucu verir.
            const hareketler = await prisma.stokHareket.findMany({
                where: { subeId: { in: subeIdler }, stokKartId: { in: kartIdler } },
                select: { subeId: true, stokKartId: true, tip: true, miktar: true, aciklama: true },
            });

            const bakiyeMap = new Map(); // subeId -> stokKartId -> hareket[]
            for (const h of hareketler) {
                if (!bakiyeMap.has(h.subeId)) bakiyeMap.set(h.subeId, new Map());
                const kartMap = bakiyeMap.get(h.subeId);
                if (!kartMap.has(h.stokKartId)) kartMap.set(h.stokKartId, []);
                kartMap.get(h.stokKartId).push(h);
            }

            for (const [subeId, kartMap] of bakiyeMap.entries()) {
                let kritik = 0;
                for (const [kartId, kartHareketleri] of kartMap.entries()) {
                    const min = minStokMap.get(kartId);
                    const bakiye = stokService.bakiyeHesapla(kartHareketleri);
                    if (min !== undefined && bakiye <= min) kritik++;
                }
                kritikMap.set(subeId, kritik);
            }
        }

        res.json(subeler.map(sube => ({
            ...sube,
            bugunSatis: satisMap.get(sube.id) || 0,
            kritikStok: kritikMap.get(sube.id) || 0,
        })));
    } catch (err) {
        res.status(500).json({ hata: err.message });
    }
};

const tekiniGetir = async (req, res) => {
    try {
        const id = parseInt(req.params.id);
        if (kendiSubesineKilitliMi(req, id)) {
            return res.status(403).json({ hata: 'Bu şubeye erişim yetkiniz yok' });
        }

        const sube = await prisma.sube.findFirst({
            where: { id, tenantId: req.kullanici.tenantId },
            include: { _count: { select: { kullanicilar: true, personeller: true } } },
        });
        if (!sube) return res.status(404).json({ hata: 'Şube bulunamadı' });
        res.json(sube);
    } catch (err) {
        res.status(500).json({ hata: err.message });
    }
};

const detayGetir = async (req, res) => {
    try {
        const tenantId = req.kullanici.tenantId;
        const subeId = parseInt(req.params.id);

        if (kendiSubesineKilitliMi(req, subeId)) {
            return res.status(403).json({ hata: 'Bu şubeye erişim yetkiniz yok' });
        }

        const bugun = bugunBaslangicTR();

        const sube = await prisma.sube.findFirst({
            where: { id: subeId, tenantId },
            include: { _count: { select: { kullanicilar: true, personeller: true } } },
        });
        if (!sube) return res.status(404).json({ hata: 'Şube bulunamadı' });

        const bugunSatislar = await prisma.satis.aggregate({
            where: { subeId, tarih: { gte: bugun } },
            _sum: { toplam: true }, _count: { id: true },
        });

        const ayBaslangic = new Date(bugun);
        ayBaslangic.setDate(1);
        const buAySatislar = await prisma.satis.aggregate({
            where: { subeId, tarih: { gte: ayBaslangic } },
            _sum: { toplam: true }, _count: { id: true },
        });

        const sonSatislar = await prisma.satis.findMany({
            where: { subeId },
            include: { recete: { select: { ad: true } } },
            orderBy: { tarih: 'desc' },
            take: 10,
        });

        const stokKartlari = await prisma.stokKart.findMany({
            where: { tenantId, aktif: true },
            include: { birim: true, kategori: true },
            orderBy: { ad: 'asc' },
        });

        // DÜZELTME: Aynı hata burada da vardı (bkz. hepsiniGetir yorumu).
        // groupBy özet toplamı + hatalı GIRIS_TIPLER yerine, ham hareket
        // kayıtlarını çekip stok.service.js'deki TEK doğru fonksiyonu
        // (bakiyeHesapla) kullanıyoruz. Bu, Stok Durumu sayfasıyla
        // (stokRaporu/tumStokDurumu) birebir aynı sonucu garanti eder.
        const stokHareketleri = await prisma.stokHareket.findMany({
            where: { subeId },
            select: { stokKartId: true, tip: true, miktar: true, aciklama: true },
        });

        const kartHareketMap = new Map();
        for (const h of stokHareketleri) {
            if (!kartHareketMap.has(h.stokKartId)) kartHareketMap.set(h.stokKartId, []);
            kartHareketMap.get(h.stokKartId).push(h);
        }

        const stokDurumu = stokKartlari
            .map(k => {
                const bakiye = stokService.bakiyeHesapla(kartHareketMap.get(k.id) || []);
                return {
                    ...k,
                    mevcutStok: Math.round(bakiye * 1000) / 1000,
                    kritik: bakiye <= k.minStok && k.minStok > 0,
                };
            })
            .filter(k => k.mevcutStok > 0 || k.minStok > 0);

        const personeller = await prisma.personel.findMany({
            where: { subeId, tenantId, aktif: true },
            select: { id: true, ad: true, soyad: true, telefon: true, baslangicTarihi: true, maas: true },
            orderBy: { ad: 'asc' },
        });

        const sonTransferler = await prisma.stokHareket.findMany({
            where: { subeId, tip: { in: ['SUBE_TRANSFER_IN', 'SUBE_TRANSFER_OUT'] } },
            include: { stokKart: { select: { ad: true } } },
            orderBy: { tarih: 'desc' },
            take: 20,
        });

        res.json({
            sube,
            ozet: {
                bugunSatisToplam: bugunSatislar._sum.toplam || 0,
                bugunSatisAdet: bugunSatislar._count.id || 0,
                buAySatisToplam: buAySatislar._sum.toplam || 0,
                buAySatisAdet: buAySatislar._count.id || 0,
                toplamStokKalem: stokDurumu.length,
                kritikStokSayisi: stokDurumu.filter(s => s.kritik).length,
                personelSayisi: personeller.length,
            },
            sonSatislar, stokDurumu, personeller, sonTransferler,
        });
    } catch (err) {
        res.status(500).json({ hata: err.message });
    }
};

const olustur = async (req, res) => {
    try {
        const { ad, adres, telefon } = req.body;
        if (!ad) return res.status(400).json({ hata: 'Şube adı zorunlu' });

        const tenantId = req.kullanici.tenantId;

        // ── Plan limiti kontrolü ─────────────────────────────────────────────
        const tenant = await prisma.tenant.findUnique({
            where: { id: tenantId },
            select: { plan: true, createdAt: true }
        });

        const denemede = tenant?.createdAt && new Date() <= (() => {
            const d = new Date(tenant.createdAt); d.setDate(d.getDate() + 30); return d;
        })();

        if (!denemede) {
            const limit = PLAN_LIMITLERI[tenant?.plan] || PLAN_LIMITLERI.BASLANGIC;
            if (limit.maxSube !== Infinity) {
                const mevcutSayisi = await prisma.sube.count({ where: { tenantId, aktif: true } });
                if (mevcutSayisi >= limit.maxSube) {
                    return res.status(403).json({
                        hata: `Başlangıç planında en fazla ${limit.maxSube} şube eklenebilir. Planınızı yükseltin.`,
                        planLimiti: true,
                    });
                }
            }
        }
        // ────────────────────────────────────────────────────────────────────

        const sube = await prisma.sube.create({
            data: { ad, adres, telefon, tenantId },
        });
        res.status(201).json(sube);
    } catch (err) {
        res.status(500).json({ hata: err.message });
    }
};

const guncelle = async (req, res) => {
    try {
        const mevcut = await prisma.sube.findFirst({
            where: { id: parseInt(req.params.id), tenantId: req.kullanici.tenantId },
        });
        if (!mevcut) return res.status(404).json({ hata: 'Şube bulunamadı' });

        const { ad, adres, telefon, aktif } = req.body;
        const sube = await prisma.sube.update({
            where: { id: parseInt(req.params.id) },
            data: { ad, adres, telefon, aktif },
        });
        res.json(sube);
    } catch (err) {
        res.status(500).json({ hata: err.message });
    }
};

// ── Merkez depo olarak işaretle ────────────────────────────────────────────
// Bir tenant'ta aynı anda tek bir merkez şube olabilir. Bu yüzden yeni bir
// şubeyi merkez yaparken önce tüm diğer şubelerin merkezMi'sini false'a
// çekip sonra hedef şubeyi true yapıyoruz — tek bir transaction içinde,
// yarım kalmış (iki merkez şube birden aktif) bir durum oluşmasın.
const merkezYap = async (req, res) => {
    try {
        const tenantId = req.kullanici.tenantId;
        const id = parseInt(req.params.id);

        const sube = await prisma.sube.findFirst({ where: { id, tenantId } });
        if (!sube) return res.status(404).json({ hata: 'Şube bulunamadı' });

        if (!sube.aktif) {
            return res.status(400).json({ hata: 'Pasif bir şube merkez depo olarak işaretlenemez' });
        }

        await prisma.$transaction([
            prisma.sube.updateMany({
                where: { tenantId, merkezMi: true },
                data: { merkezMi: false },
            }),
            prisma.sube.update({
                where: { id },
                data: { merkezMi: true },
            }),
        ]);

        res.json({ mesaj: `${sube.ad} merkez depo olarak işaretlendi` });
    } catch (err) {
        res.status(500).json({ hata: err.message });
    }
};

// ── Merkez depo işaretini kaldır ───────────────────────────────────────────
const merkezKaldir = async (req, res) => {
    try {
        const tenantId = req.kullanici.tenantId;
        const id = parseInt(req.params.id);

        const sube = await prisma.sube.findFirst({ where: { id, tenantId } });
        if (!sube) return res.status(404).json({ hata: 'Şube bulunamadı' });

        await prisma.sube.update({ where: { id }, data: { merkezMi: false } });
        res.json({ mesaj: 'Merkez depo işareti kaldırıldı' });
    } catch (err) {
        res.status(500).json({ hata: err.message });
    }
};

module.exports = { hepsiniGetir, tekiniGetir, detayGetir, olustur, guncelle, merkezYap, merkezKaldir };