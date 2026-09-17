const { PrismaClient } = require('@prisma/client');
const stokService = require('../services/stok.service');
const prisma = new PrismaClient();

const dashboardController = {

    async subeOzeti(req, res) {
        try {
            const tenantId = req.kullanici.tenantId;
            const rol = req.kullanici.rol;

            // MUDUR sadece kendi şubesini görür — diğer modüllerle (rapor,
            // export, personel, stok, sube) tutarlı olacak şekilde.
            const where = { tenantId, aktif: true };
            if (rol === 'MUDUR') {
                where.id = req.kullanici.subeId;
            }

            const subeler = await prisma.sube.findMany({
                where,
                include: {
                    kullanicilar: { where: { aktif: true }, select: { id: true } },
                    personeller: { select: { id: true } },
                }
            });

            if (subeler.length === 0) return res.json({ basarili: true, data: [] });
            const subeIdler = subeler.map(s => s.id);

            const bugun = new Date();
            bugun.setHours(0, 0, 0, 0);
            const yarin = new Date(bugun);
            yarin.setDate(yarin.getDate() + 1);

            // DÜZELTME (performans — N+1): Önceden her şube için DÖNGÜ
            // İÇİNDE ayrı ayrı hem satış hem stokKart+stokHareketleri
            // sorgusu atılıyordu. stokKart sorgusu tenantId'ye göre TÜM
            // stok kartlarını (o kartın TÜM geçmiş stok hareketleriyle
            // birlikte) her şube turunda YENİDEN çekiyordu — 3 şubeli bir
            // hesapta aynı ağır veri 3 kez sorgulanıyordu. Satış/hareket
            // sayısı arttıkça bu sorgu giderek ağırlaşıyor, Dashboard'un
            // her sayfada "yükleniyor" göstermesinin başlıca sebebi buydu.
            // Artık satışlar ve stok kartları/hareketleri TEK seferde,
            // tüm şubeler için birlikte çekiliyor; şube bazlı ayrım JS'de
            // (bellekte) yapılıyor.
            const [satislar, stokKartlari] = await Promise.all([
                prisma.satis.findMany({
                    where: { subeId: { in: subeIdler }, tarih: { gte: bugun, lt: yarin } },
                    select: { subeId: true, toplam: true },
                }),
                prisma.stokKart.findMany({
                    where: { tenantId },
                    include: {
                        stokHareketleri: { where: { subeId: { in: subeIdler } } }
                    }
                }),
            ]);

            const satisMap = new Map();
            for (const s of satislar) {
                if (!satisMap.has(s.subeId)) satisMap.set(s.subeId, { ciro: 0, adet: 0 });
                const kayit = satisMap.get(s.subeId);
                kayit.ciro += s.toplam;
                kayit.adet += 1;
            }

            // DÜZELTME (doğruluk — sube.controller.js'deki AYNI hata):
            // Önceden AY_SONU_SAYIM her zaman GİRİŞ (bakiyeye ekleniyor)
            // sayılıyordu — sayım düzeltmesinin gerçek yönüne (açıklamadaki
            // "fark: ±X") hiç bakılmıyordu. Bu, bir sayım kaydı stoku
            // AZALTMIŞ olsa bile kritik stok hesabında artış gibi
            // işlenmesine, dolayısıyla kritik stok sayısının yanlış
            // çıkmasına yol açabiliyordu. Artık stok.service.js'deki TEK
            // doğru fonksiyon (bakiyeHesapla) kullanılıyor — stokRaporu,
            // tumStokDurumu ve düzeltilmiş sube.controller.js ile birebir
            // aynı sonucu verir.
            const kritikSayacMap = new Map(subeIdler.map(id => [id, 0]));
            for (const kart of stokKartlari) {
                const subeHareketMap = new Map();
                for (const h of kart.stokHareketleri) {
                    if (!subeHareketMap.has(h.subeId)) subeHareketMap.set(h.subeId, []);
                    subeHareketMap.get(h.subeId).push(h);
                }
                for (const subeId of subeIdler) {
                    const bakiye = stokService.bakiyeHesapla(subeHareketMap.get(subeId) || []);
                    if (bakiye <= kart.minStok) {
                        kritikSayacMap.set(subeId, kritikSayacMap.get(subeId) + 1);
                    }
                }
            }

            const sonuc = subeler.map(sube => {
                const satisOzet = satisMap.get(sube.id) || { ciro: 0, adet: 0 };
                return {
                    id: sube.id,
                    ad: sube.ad,
                    telefon: sube.telefon,
                    adres: sube.adres,
                    aktif: sube.aktif,
                    kullaniciSayisi: sube.kullanicilar.length,
                    personelSayisi: sube.personeller.length,
                    gunlukCiro: satisOzet.ciro,
                    satisSayisi: satisOzet.adet,
                    kritikStokSayisi: kritikSayacMap.get(sube.id) || 0,
                };
            });

            res.json({ basarili: true, data: sonuc });
        } catch (err) {
            res.status(500).json({ basarili: false, mesaj: err.message });
        }
    }
};

module.exports = dashboardController;