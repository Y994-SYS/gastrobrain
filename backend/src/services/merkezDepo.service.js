// backend/src/services/merkezDepo.service.js

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// ÖNEMLİ: Bakiye hesaplama burada YENİDEN yazılmıyor. Daha önce bu dosyada
// kendi (hatalı) bakiyeHesapla kopyamız vardı:
//   - IADE_FATURA yanlışlıkla GİRİŞ sayılıyordu (doğrusu: ÇIKIŞ — tedarikçiye
//     iade stoktan düşer)
//   - AY_SONU_SAYIM hiç özel işlenmiyordu, "fark: ±X" açıklaması parse
//     edilmediği için büyük sayım düzeltmelerinde bakiye tamamen yanlış
//     çıkıyordu (örn. -2990 gibi anlamsız değerler)
// stok.service.js'deki mevcutStokHesapla/bakiyeHesapla TEK doğru kaynak.
// Merkez depo da diğer her modül gibi onu kullanıyor.
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
    // tanımla. Kullanıcının 100+ ürünü tek tek elle girmesini önler — zaten
    // stok kartında tanımlı olan min seviye tekrar sorulmaz. Sadece henüz
    // merkez depo tanımı olmayan kartlar eklenir; var olanlara dokunulmaz.
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
                minStokSeviyesi: k.minStok || 0, // stok kartındaki mevcut min seviye
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

        // Merkez şubeyi bul
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

        // Kaynak (merkez) şubede yeterli stok var mı — TEK doğru bakiye
        // kaynağından (stok.service.js) oku, kendi kopyamızı hesaplama.
        const merkezBakiye = await stokService.mevcutStokGetir(
            tanim.stokKartId, merkezSube.id, tenantId
        );
        if (merkezBakiye < miktar) {
            throw new Error(
                `Merkez depoda yeterli stok yok. Mevcut: ${merkezBakiye.toFixed(2)}, istenen: ${miktar}`
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
                const mevcut = await stokService.mevcutStokGetir(tanim.stokKartId, sube.id, tenantId);

                if (mevcut < tanim.minStokSeviyesi) {
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
            const subeler = tanim.tenant.subeler.filter(s => s.id !== merkezSube.id);
            let altındaSayisi = 0;

            for (const sube of subeler) {
                const mevcut = await stokService.mevcutStokGetir(tanim.stokKartId, sube.id, tenantId);
                if (mevcut < tanim.minStokSeviyesi) {
                    altındaSayisi++;
                }
            }

            const merkezBakiye = await stokService.mevcutStokGetir(tanim.stokKartId, merkezSube.id, tenantId);

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