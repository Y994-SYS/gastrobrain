// Basit TTL tabanlı bellek-içi cache. Tek process için yeterlidir; Render
// gibi tek instance'lı ortamlarda güvenle çalışır. Birden fazla
// instance/worker'a yatay ölçeklenirse bu cache instance'lar arasında
// PAYLAŞILMAZ — o noktaya gelinirse Redis gibi paylaşılan bir cache'e
// geçmek gerekir.

const store = new Map();

const get = (key) => {
    const entry = store.get(key);
    if (!entry) return undefined;
    if (Date.now() > entry.expiresAt) {
        store.delete(key);
        return undefined;
    }
    return entry.value;
};

const set = (key, value, ttlSaniye) => {
    store.set(key, {
        value,
        expiresAt: Date.now() + ttlSaniye * 1000,
    });
};

// Belirli bir tenant'a ait tüm cache kayıtlarını temizler. Satış/stok/cari
// gibi veriyi değiştiren endpoint'lerden çağrılabilir — şu an hiçbir
// yerden çağrılmıyor, TTL süresi dolunca kayıtlar kendiliğinden
// geçersizleşiyor. Belirli bir raporda anlık tutarlılık gerekirse, ilgili
// yazma endpoint'inin sonuna `cacheService.tenantTemizle(tenantId)`
// eklenmesi yeterli.
const tenantTemizle = (tenantId) => {
    for (const key of store.keys()) {
        if (key.startsWith(`${tenantId}:`)) store.delete(key);
    }
};

const temizle = () => store.clear();

module.exports = { get, set, tenantTemizle, temizle };