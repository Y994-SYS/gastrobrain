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
    // Merkez depo tanımını oluştur/güncelle.
    // DÜZELTME: mevcut tanım PASİF (aktif: false, önceden "silinmiş") ise
    // artık otomatik olarak yeniden aktive ediliyor — aksi hâlde kullanıcı
    // bir tanımı sildikten sonra aynı ürün için tekrar tanım eklemeye
    // çalıştığında sessizce pasif kalırdı.
    async tanımlaEkle({ tenantId, stokKartId, minStokSeviyesi, otomatiDagit, aciklama }) {
        const mevcut = await prisma.merkezDepo.findUnique({
            where: { stokKartId_tenantId: { stokKartId, tenantId } }
        });

        if (mevcut) {
            return await prisma.merkezDepo.update({
                where: { id: mevcut.id },
                data: { minStokSeviyesi, otomatiDagit, aciklama, aktif: true }
            });
        }

        return await prisma.merkezDepo.create({
            data: { tenantId, stokKartId, minStokSeviyesi, otomatiDagit, aciklama, aktif: true }
        });
    },

    // Tüm stok kartlarını, StokKart.minStok değerini varsayılan alarak toplu
    // tanımla. Sadece henüz AKTİF tanımı olmayan kartlar eklenir (pasif bir
    // tanım varsa bu fonksiyon ona dokunmuyor — kullanıcı onu ayrı olarak
    // "Yeni Tanım" formundan yeniden ekleyip aktive edebilir).
    async tumunuEkle(tenantId) {
        const stokKartlari = await prisma.stokKart.findMany({ where: { tenantId } });

        const mevcutAktifTanimlar = await prisma.merkezDepo.findMany({
            where: { tenantId, aktif: true },
            select: { stokKartId: true }
        });
        const mevcutIdSet = new Set(mevcutAktifTanimlar.map(t => t.stokKartId));

        const eklenecekler = stokKartlari.filter(k => !mevcutIdSet.has(k.id));

        if (eklenecekler.length === 0) {
            return { eklenen: 0, mesaj: 'Tüm stok kartları zaten tanımlı' };
        }

        // NOT: createMany, stokKartId+tenantId unique constraint'ine takılan
        // (yani pasif bir tanımı zaten var olan) kartları sessizce atlar —
        // bu bilinçli bir davranış, hata fırlatmaz.
        await prisma.merkezDepo.createMany({
            data: eklenecekler.map(k => ({
                tenantId,
                stokKartId: k.id,
                minStokSeviyesi: k.minStok || 0,
                otomatiDagit: true,
                aktif: true,
            })),
            skipDuplicates: true,
        });

        return { eklenen: eklenecekler.length };
    },

    // Tüm AKTİF merkez depo tanımlarını getir
    async tumTanimlarGetir(tenantId) {
        return await prisma.merkezDepo.findMany({
            where: { tenantId, aktif: true },
            include: {
                stokKart: { include: { birim: true, kategori: true } },
                dagitimlar: { orderBy: { tarih: 'desc' }, take: 10 }
            },
            orderBy: { createdAt: 'desc' }
        });
    },

    // Merkez depo tanımını "sil".
    // DÜZELTME (kritik bug): Önceden gerçek `prisma.merkezDepo.delete(...)`
    // yapılıyordu. Bir tanıma bağlı geçmiş dağıtım kaydı (MerkezDagitim)
    // varsa bu, foreign key constraint hatasıyla çöküyordu — çünkü geçmiş
    // kayıtlar hâlâ o tanımı referans ediyor. Artık gerçek silme yerine
    // "pasife alma" (aktif: false) yapılıyor: tanım listede ve yeni
    // dağıtımlarda görünmez oluyor, ama geçmiş dağıtım kayıtlarındaki ürün
    // bilgisi (stokKart adı vb.) bozulmadan kalıyor.
    async sil(id, tenantId) {
        const mevcutTanim = await prisma.merkezDepo.findFirst({
            where: { id, tenantId }
        });

        if (!mevcutTanim) throw new Error('Merkez depo tanımı bulunamadı');

        return await prisma.merkezDepo.update({
            where: { id },
            data: { aktif: false }
        });
    },

    // Manual dağıtım yap (tek kalem) — YAZMA işlemi, bilerek sıralı/atomik.
    async manuelDagit({ tenantId, merkezDepoId, hedefSubeId, miktar, aciklama }) {
        if (!(miktar > 0)) {
            throw new Error('Miktar sıfırdan büyük olmalıdır');
        }

        const tanim = await prisma.merkezDepo.findFirst({
            where: { id: merkezDepoId, tenantId, aktif: true },
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
    async otomatiDagitimYap(tenantId) {
        const merkezSube = await merkezSubeGetir(tenantId);

        const tanimlar = await prisma.merkezDepo.findMany({
            where: { tenantId, otomatiDagit: true, aktif: true },
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

    // Dağıtım geçmişini getir — tanım pasife alınmış olsa bile (silinmediği
    // için) buradaki ürün/tarih bilgisi bozulmadan görünmeye devam eder.
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

    // Merkez depo durum özeti — sadece AKTİF tanımlar için hesaplanır.
    async durumuGetir(tenantId) {
        const merkezSube = await merkezSubeGetir(tenantId);

        const tanimlar = await prisma.merkezDepo.findMany({
            where: { tenantId, aktif: true },
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