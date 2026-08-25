// backend/src/services/merkezDepo.service.js

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const GIRIS_TIPLER = new Set(['GIRIS_FATURA', 'IADE_FATURA', 'SUBE_TRANSFER_IN']);

// Belirli bir şubede bir stok kartının bakiyesini hesapla
const bakiyeHesapla = async (subeId, stokKartId) => {
    const hareketler = await prisma.stokHareket.groupBy({
        by: ['tip'],
        where: { subeId, stokKartId },
        _sum: { miktar: true },
    });

    return hareketler.reduce((toplam, h) => {
        const miktar = h._sum.miktar || 0;
        return toplam + (GIRIS_TIPLER.has(h.tip) ? miktar : -miktar);
    }, 0);
};

// Tenant'ın merkez şubesini bul. Bulunamazsa net bir hata fırlatır
// (artık "ID 1" varsayımı yok — Sube.merkezMi alanına bakılıyor).
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

    // Manual dağıtım yap
    async manuelDagit({ tenantId, merkezDepoId, hedefSubeId, miktar, aciklama }) {
        if (!(miktar > 0)) {
            throw new Error('Miktar sıfırdan büyük olmalıdır');
        }

        // Merkez depo tanımı kontrol et
        const tanim = await prisma.merkezDepo.findFirst({
            where: { id: merkezDepoId, tenantId },
            include: { stokKart: true }
        });

        if (!tanim) throw new Error('Merkez depo tanımı bulunamadı');

        // Merkez şubeyi bul (artık hardcode değil)
        const merkezSube = await merkezSubeGetir(tenantId);

        // Hedef şubenin var olduğunu kontrol et
        const hedefSube = await prisma.sube.findFirst({
            where: { id: hedefSubeId, tenantId }
        });

        if (!hedefSube) throw new Error('Hedef şube bulunamadı');

        // Merkez şube kendi kendine hedef olamaz
        if (hedefSubeId === merkezSube.id) {
            throw new Error('Hedef şube, merkez depo ile aynı olamaz');
        }

        // Kaynak (merkez) şubede yeterli stok var mı kontrol et
        const merkezBakiye = await bakiyeHesapla(merkezSube.id, tanim.stokKartId);
        if (merkezBakiye < miktar) {
            throw new Error(
                `Merkez depoda yeterli stok yok. Mevcut: ${merkezBakiye}, istenen: ${miktar}`
            );
        }

        // Stok hareketi oluştur ve dağıtım kaydını tut
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

    // Otomatik dağıtım yap (Cron job tarafından çağrılır)
    async otomatiDagitimYap(tenantId) {
        const merkezSube = await merkezSubeGetir(tenantId);

        const tanimlar = await prisma.merkezDepo.findMany({
            where: { tenantId, otomatiDagit: true },
            include: {
                stokKart: true,
                tenant: { include: { subeler: { where: { aktif: true } } } }
            }
        });

        const sonuclar = [];

        for (const tanim of tanimlar) {
            // Merkez şubeyi hedef listesinden çıkar — kendi kendine transfer olmasın
            const subeler = tanim.tenant.subeler.filter(s => s.id !== merkezSube.id);

            for (const sube of subeler) {
                // Şubenin mevcut bakiyesini hesapla
                const mevcut = await bakiyeHesapla(sube.id, tanim.stokKartId);

                // Min stok seviyesinin altında mı?
                if (mevcut < tanim.minStokSeviyesi) {
                    const gerekenMiktar = tanim.minStokSeviyesi - mevcut;

                    try {
                        // Dağıtım yap (manuelDagit içinde merkez stok kontrolü de yapılıyor)
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
                        // Örn: merkez depoda yeterli stok yok — akış durmaz, diğer
                        // şubeler/tanımlar için devam eder, hata kaydedilir.
                        sonuclar.push({
                            basarili: false,
                            tanim: tanim.stokKart.ad,
                            sube: sube.ad,
                            hata: err.message
                        });
                    }
                }
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

    // Merkez depo durum özeti
    async durumuGetir(tenantId) {
        const merkezSube = await merkezSubeGetir(tenantId);

        const tanimlar = await prisma.merkezDepo.findMany({
            where: { tenantId },
            include: {
                stokKart: true,
                tenant: { include: { subeler: true } }
            }
        });

        const ozet = [];

        for (const tanim of tanimlar) {
            // Merkez şube kendi durumunda "aşağıda" sayılmasın
            const subeler = tanim.tenant.subeler.filter(s => s.id !== merkezSube.id);
            let altındaSayisi = 0;

            for (const sube of subeler) {
                const mevcut = await bakiyeHesapla(sube.id, tanim.stokKartId);
                if (mevcut < tanim.minStokSeviyesi) {
                    altındaSayisi++;
                }
            }

            const merkezBakiye = await bakiyeHesapla(merkezSube.id, tanim.stokKartId);

            ozet.push({
                tanim: tanim.stokKart.ad,
                toplamSube: subeler.length,
                altındaSayisi,
                minStokSeviyesi: tanim.minStokSeviyesi,
                otomatiDagit: tanim.otomatiDagit,
                merkezBakiye,
                durum: altındaSayisi > 0 ? 'UYARI' : 'NORMAL'
            });
        }

        return ozet;
    }
};

module.exports = merkezDepoService;