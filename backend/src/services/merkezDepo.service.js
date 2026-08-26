// backend/src/services/merkezDepo.service.js

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// ÖNEMLİ: Bakiye hesaplama burada YENİDEN yazılmıyor — stok.service.js'deki
// mevcutStokHesapla/bakiyeHesapla TEK doğru kaynak (IADE_FATURA'nın ÇIKIŞ
// sayılması ve AY_SONU_SAYIM'ın "fark: ±X" mantığı orada doğru işleniyor).
const stokService = require('./stok.service');

// Tenant'ın merkez şubesini bul.
const merkezSubeGetir = async (tenantId) => {
    const merkezSube = await prisma.sube.findFirst({
        where: { tenantId, merkezMi: true, aktif: true }
    });

    if (!merkezSube) {
        throw new Error(
            'Merkez depo olarak işaretlenmiş bir şube bulunamadı. ' +
            'Lütfen Şubeler bölümünden bir şubeyi "Merkez Depo" olarak işaretleyin.'
        );
    }

    return merkezSube;
};

const merkezDepoService = {
    // Merkez depo tanımını oluştur/güncelle
    async tanımlaEkle({ tenantId, stokKartId, minStokSeviyesi, otomatiDagit, aciklama }) {
        const mevcut = await prisma.merkezDepo.findUnique({
            where: { stokKartId_tenantId: { stokKartId, tenantId } }
        });

        if (mevcut) {
            return await prisma.merkezDepo.update({
                where: { id: mevcut.id },
                data: { minStokSeviyesi, otomatiDagit, aciklama }
            });
        }

        return await prisma.merkezDepo.create({
            data: { tenantId, stokKartId, minStokSeviyesi, otomatiDagit, aciklama }
        });
    },

    // Tüm stok kartlarını, StokKart.minStok değerini varsayılan alarak toplu
    // tanımla. Sadece henüz tanımı olmayan kartlar eklenir.
    async tumunuEkle(tenantId) {
        const stokKartlari = await prisma.stokKart.findMany({ where: { tenantId } });

        const mevcutTanimlar = await prisma.merkezDepo.findMany({
            where: { tenantId },
            select: { stokKartId: true }
        });
        const mevcutIdSet = new Set(mevcutTanimlar.map(t => t.stokKartId));

        const eklenecekler = stokKartlari.filter(k => !mevcutIdSet.has(k.id));

        if (eklenecekler.length === 0) {
            return { eklenen: 0, mesaj: 'Tüm stok kartları zaten tanımlı' };
        }

        await prisma.merkezDepo.createMany({
            data: eklenecekler.map(k => ({
                tenantId,
                stokKartId: k.id,
                minStokSeviyesi: k.minStok || 0,
                otomatiDagit: true,
            }))
        });

        return { eklenen: eklenecekler.length };
    },

    // Tüm merkez depo tanımlarını getir
    async tumTanimlarGetir(tenantId) {
        return await prisma.merkezDepo.findMany({
            where: { tenantId },
            include: {
                stokKart: { include: { birim: true, kategori: true } },
                dagitimlar: { orderBy: { tarih: 'desc' }, take: 10 }
            },
            orderBy: { createdAt: 'desc' }
        });
    },

    // Merkez depo tanımını sil
    async sil(id, tenantId) {
        const mevcutTanim = await prisma.merkezDepo.findFirst({
            where: { id, tenant: { id: tenantId } }
        });

        if (!mevcutTanim) throw new Error('Merkez depo tanımı bulunamadı');

        return await prisma.merkezDepo.delete({ where: { id } });
    },

    // Manual dağıtım yap (tek kalem) — YAZMA işlemi, bilerek sıralı/atomik.
    async manuelDagit({ tenantId, merkezDepoId, hedefSubeId, miktar, aciklama }) {
        if (!(miktar > 0)) {
            throw new Error('Miktar sıfırdan büyük olmalıdır');
        }

        const tanim = await prisma.merkezDepo.findFirst({
            where: { id: merkezDepoId, tenantId },
            include: { stokKart: true }
        });

        if (!tanim) throw new Error('Merkez depo tanımı bulunamadı');

        const merkezSube = await merkezSubeGetir(tenantId);

        const hedefSube = await prisma.sube.findFirst({
            where: { id: hedefSubeId, tenantId }
        });

        if (!hedefSube) throw new Error('Hedef şube bulunamadı');

        if (hedefSubeId === merkezSube.id) {
            throw new Error('Hedef şube, merkez depo ile aynı olamaz');
        }

        const merkezBakiye = await stokService.mevcutStokGetir(
            tanim.stokKartId, merkezSube.id, tenantId
        );
        if (merkezBakiye < miktar) {
            throw new Error(
                `${tanim.stokKart.ad}: Merkez depoda yeterli stok yok. Mevcut: ${merkezBakiye.toFixed(2)}, istenen: ${miktar}`
            );
        }

        const dagitim = await prisma.$transaction(async (tx) => {
            await tx.stokHareket.create({
                data: {
                    tip: 'SUBE_TRANSFER_OUT',
                    miktar,
                    aciklama: `[MERKEZ DEPO] ${aciklama || 'Manuel dağıtım'}`,
                    tarih: new Date(),
                    stokKartId: tanim.stokKartId,
                    subeId: merkezSube.id,
                }
            });

            await tx.stokHareket.create({
                data: {
                    tip: 'SUBE_TRANSFER_IN',
                    miktar,
                    aciklama: `[MERKEZ DEPO] ${aciklama || 'Manuel dağıtım'}`,
                    tarih: new Date(),
                    stokKartId: tanim.stokKartId,
                    subeId: hedefSubeId,
                }
            });

            const kayit = await tx.merkezDagitim.create({
                data: {
                    merkezDepoId,
                    hedefSubeId,
                    miktar,
                    aciklama: aciklama || 'Manuel dağıtım',
                }
            });

            return kayit;
        });

        return dagitim;
    },

    // Toplu dağıtım — YAZMA işlemleri, bilerek sıralı. Her kalem merkez
    // stokunu tükettiği için paralel çalıştırılırsa aynı anda başlayan iki
    // istek merkez bakiyesini "yeterli" görüp stoku negatife düşürebilir
    // (TOCTOU) — bu yüzden burası bilinçli olarak for...of + await.
    async topluDagit({ tenantId, hedefSubeId, kalemler }) {
        if (!Array.isArray(kalemler) || kalemler.length === 0) {
            throw new Error('En az bir kalem seçilmeli');
        }

        const sonuclar = [];

        for (const kalem of kalemler) {
            try {
                const dagitim = await this.manuelDagit({
                    tenantId,
                    merkezDepoId: Number(kalem.merkezDepoId),
                    hedefSubeId: Number(hedefSubeId),
                    miktar: Number(kalem.miktar),
                    aciklama: kalem.aciklama
                });
                sonuclar.push({ basarili: true, merkezDepoId: kalem.merkezDepoId, dagitimId: dagitim.id });
            } catch (err) {
                sonuclar.push({ basarili: false, merkezDepoId: kalem.merkezDepoId, hata: err.message });
            }
        }

        return sonuclar;
    },

    // Otomatik dağıtım yap (Cron job tarafından çağrılır).
    // PERFORMANS: Hangi şubelerin dağıtıma ihtiyacı olduğunu belirlemek için
    // gereken OKUMA işlemleri (bakiye hesaplama) artık tanım × şube bazında
    // paralel (Promise.all) yapılıyor — önceden tamamen sıralıydı. Asıl
    // dağıtım (YAZMA) adımı ise TOCTOU riski nedeniyle bilerek sıralı kaldı.
    async otomatiDagitimYap(tenantId) {
        const merkezSube = await merkezSubeGetir(tenantId);

        const tanimlar = await prisma.merkezDepo.findMany({
            where: { tenantId, otomatiDagit: true },
            include: {
                stokKart: true,
                tenant: { include: { subeler: { where: { aktif: true } } } }
            }
        });

        // 1. Adım: Tüm ihtiyaç durumlarını PARALEL oku (yazma yok, güvenli)
        const ihtiyacListesi = (await Promise.all(
            tanimlar.map(async (tanim) => {
                const subeler = tanim.tenant.subeler.filter(s => s.id !== merkezSube.id);

                const bakiyeler = await Promise.all(
                    subeler.map(sube => stokService.mevcutStokGetir(tanim.stokKartId, sube.id, tenantId))
                );

                return subeler
                    .map((sube, i) => ({ tanim, sube, mevcut: bakiyeler[i] }))
                    .filter(({ mevcut }) => mevcut < tanim.minStokSeviyesi);
            })
        )).flat();

        // 2. Adım: Gerçek dağıtımları SIRALI yap (her biri merkez stokunu
        // tükettiği için paralel yapılamaz)
        const sonuclar = [];
        for (const { tanim, sube, mevcut } of ihtiyacListesi) {
            const gerekenMiktar = tanim.minStokSeviyesi - mevcut;

            try {
                const dagitim = await this.manuelDagit({
                    tenantId,
                    merkezDepoId: tanim.id,
                    hedefSubeId: sube.id,
                    miktar: gerekenMiktar,
                    aciklama: `Otomatik dağıtım (Min stok aşağında)`
                });

                sonuclar.push({
                    basarili: true,
                    tanim: tanim.stokKart.ad,
                    sube: sube.ad,
                    miktar: gerekenMiktar,
                    dagitimId: dagitim.id
                });
            } catch (err) {
                sonuclar.push({
                    basarili: false,
                    tanim: tanim.stokKart.ad,
                    sube: sube.ad,
                    hata: err.message
                });
            }
        }

        return sonuclar;
    },

    // Dağıtım geçmişini getir
    async dagitimGecmisiGetir(tenantId, merkezDepoId, limit = 50) {
        return await prisma.merkezDagitim.findMany({
            where: {
                merkezDepo: { tenantId },
                ...(merkezDepoId ? { merkezDepoId } : {})
            },
            include: {
                merkezDepo: { include: { stokKart: true } },
                hedefSube: true
            },
            orderBy: { tarih: 'desc' },
            take: limit
        });
    },

    // Merkez depo durum özeti.
    // PERFORMANS: Bu, kullanıcının 20 saniyelik yavaşlığını bildirdiği
    // fonksiyondu. Önceden her tanım için her şube TEK TEK, sırayla
    // (await ile bloklayarak) sorgulanıyordu — 22 tanım × 2 şube = 44 art
    // arda bekleyen sorgu. Artık her tanımın kendi içindeki şube bakiyeleri
    // Promise.all ile paralel çekiliyor, tanımların kendisi de Promise.all
    // ile paralel işleniyor. Bu salt okuma (yazma yok) olduğu için tamamen
    // güvenli. Toplam veritabanı yükü aynı ama bekleme süresi ciddi düşer.
    async durumuGetir(tenantId) {
        const merkezSube = await merkezSubeGetir(tenantId);

        const tanimlar = await prisma.merkezDepo.findMany({
            where: { tenantId },
            include: {
                stokKart: true,
                tenant: { include: { subeler: true } }
            }
        });

        const ozet = await Promise.all(tanimlar.map(async (tanim) => {
            const subeler = tanim.tenant.subeler.filter(s => s.id !== merkezSube.id);

            const [bakiyeler, merkezBakiye] = await Promise.all([
                Promise.all(subeler.map(sube => stokService.mevcutStokGetir(tanim.stokKartId, sube.id, tenantId))),
                stokService.mevcutStokGetir(tanim.stokKartId, merkezSube.id, tenantId)
            ]);

            const altındaSayisi = bakiyeler.filter(mevcut => mevcut < tanim.minStokSeviyesi).length;

            return {
                tanim: tanim.stokKart.ad,
                toplamSube: subeler.length,
                altındaSayisi,
                minStokSeviyesi: tanim.minStokSeviyesi,
                otomatiDagit: tanim.otomatiDagit,
                merkezBakiye,
                durum: altındaSayisi > 0 ? 'UYARI' : 'NORMAL'
            };
        }));

        return ozet;
    }
};

module.exports = merkezDepoService;