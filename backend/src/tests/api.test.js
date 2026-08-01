import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';

const BASE = process.env.TEST_API_URL || 'https://api.gastrobrain.com.tr';
const IZINLI_ORIGIN = 'https://app.gastrobrain.com.tr';

// Bu testler gercek bir admin hesabiyla giris yapar. .env.test dosyanda su
// degiskenleri tanimla (yoksa tum bu dosya atlanir):
//   TEST_TENANT_SLUG=senin-firma-slug
//   TEST_ADMIN_EMAIL=gercek-admin@mail.com
//   TEST_ADMIN_SIFRE=gercek-sifre
const calisirMi = !!process.env.TEST_ADMIN_EMAIL;

let token = '';

beforeAll(async () => {
    if (!calisirMi) return;
    const res = await request(BASE)
        .post('/api/auth/giris')
        .set('Origin', IZINLI_ORIGIN)
        .send({
            email: process.env.TEST_ADMIN_EMAIL,
            sifre: process.env.TEST_ADMIN_SIFRE,
            tenantSlug: process.env.TEST_TENANT_SLUG,
        });
    token = res.body.data?.token;
});

describe.skipIf(!calisirMi)('Kategori API', () => {
    it('GET /api/kategoriler — listeyi getirmeli', async () => {
        const res = await request(BASE)
            .get('/api/kategoriler')
            .set('Origin', IZINLI_ORIGIN)
            .set('Authorization', `Bearer ${token}`);

        expect(res.status).toBe(200);
        expect(Array.isArray(res.body.data)).toBe(true);
    });

    it('GET /api/kategoriler — token olmadan 401 dönmeli', async () => {
        const res = await request(BASE)
            .get('/api/kategoriler')
            .set('Origin', IZINLI_ORIGIN);
        expect(res.status).toBe(401);
    });
});

describe.skipIf(!calisirMi)('Stok Kartları API', () => {
    it('GET /api/stok-kartlari — listeyi getirmeli', async () => {
        const res = await request(BASE)
            .get('/api/stok-kartlari')
            .set('Origin', IZINLI_ORIGIN)
            .set('Authorization', `Bearer ${token}`);

        expect(res.status).toBe(200);
        expect(Array.isArray(res.body.data)).toBe(true);
    });

    it('GET /api/stok-kartlari — her kartın kod ve ad alanı olmalı', async () => {
        const res = await request(BASE)
            .get('/api/stok-kartlari')
            .set('Origin', IZINLI_ORIGIN)
            .set('Authorization', `Bearer ${token}`);

        expect(res.status).toBe(200);
        for (const kart of res.body.data) {
            expect(kart).toHaveProperty('kod');
            expect(kart).toHaveProperty('ad');
        }
    });
});

describe.skipIf(!calisirMi)('Cari Kartlar API', () => {
    it('GET /api/cari-kartlar — listeyi getirmeli', async () => {
        const res = await request(BASE)
            .get('/api/cari-kartlar')
            .set('Origin', IZINLI_ORIGIN)
            .set('Authorization', `Bearer ${token}`);

        expect(res.status).toBe(200);
        expect(Array.isArray(res.body.data)).toBe(true);
    });
});

describe.skipIf(!calisirMi)('Reçete API', () => {
    it('GET /api/receteler — listeyi getirmeli', async () => {
        const res = await request(BASE)
            .get('/api/receteler')
            .set('Origin', IZINLI_ORIGIN)
            .set('Authorization', `Bearer ${token}`);

        expect(res.status).toBe(200);
        expect(Array.isArray(res.body.data)).toBe(true);
    });
});

describe.skipIf(!calisirMi)('Şube API', () => {
    it('GET /api/subeler — listeyi getirmeli', async () => {
        const res = await request(BASE)
            .get('/api/subeler')
            .set('Origin', IZINLI_ORIGIN)
            .set('Authorization', `Bearer ${token}`);

        expect(res.status).toBe(200);
        expect(Array.isArray(res.body)).toBe(true);
    });
});