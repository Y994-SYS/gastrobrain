import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';

const BASE = 'http://localhost:3001';
let token = '';

beforeAll(async () => {
    const res = await request(BASE)
        .post('/api/auth/giris')
        .send({ email: 'admin@gastroiq.com', sifre: '123456' });
    token = res.body.data?.token;
});

describe('Kategori API', () => {
    it('GET /api/kategoriler — listeyi getirmeli', async () => {
        const res = await request(BASE)
            .get('/api/kategoriler')
            .set('Authorization', `Bearer ${token}`);

        expect(res.status).toBe(200);
        expect(Array.isArray(res.body.data)).toBe(true);
        expect(res.body.data.length).toBeGreaterThan(0);
    });

    it('GET /api/kategoriler — token olmadan 401 dönmeli', async () => {
        const res = await request(BASE).get('/api/kategoriler');
        expect(res.status).toBe(401);
    });
});

describe('Stok Kartları API', () => {
    it('GET /api/stok-kartlari — listeyi getirmeli', async () => {
        const res = await request(BASE)
            .get('/api/stok-kartlari')
            .set('Authorization', `Bearer ${token}`);

        expect(res.status).toBe(200);
        expect(Array.isArray(res.body.data)).toBe(true);
        expect(res.body.data.length).toBeGreaterThan(0);
    });

    it('GET /api/stok-kartlari — her kartın kod ve ad alanı olmalı', async () => {
        const res = await request(BASE)
            .get('/api/stok-kartlari')
            .set('Authorization', `Bearer ${token}`);

        expect(res.status).toBe(200);
        for (const kart of res.body.data) {
            expect(kart).toHaveProperty('kod');
            expect(kart).toHaveProperty('ad');
        }
    });
});

describe('Cari Kartlar API', () => {
    it('GET /api/cari-kartlar — listeyi getirmeli', async () => {
        const res = await request(BASE)
            .get('/api/cari-kartlar')
            .set('Authorization', `Bearer ${token}`);

        expect(res.status).toBe(200);
        expect(Array.isArray(res.body.data)).toBe(true);
        expect(res.body.data.length).toBeGreaterThan(0);
    });
});

describe('Reçete API', () => {
    it('GET /api/receteler — listeyi getirmeli', async () => {
        const res = await request(BASE)
            .get('/api/receteler')
            .set('Authorization', `Bearer ${token}`);

        expect(res.status).toBe(200);
        expect(Array.isArray(res.body.data)).toBe(true);
    });
});

describe('Şube API', () => {
    it('GET /api/subeler — listeyi getirmeli', async () => {
        const res = await request(BASE)
            .get('/api/subeler')
            .set('Authorization', `Bearer ${token}`);

        expect(res.status).toBe(200);
        expect(Array.isArray(res.body)).toBe(true);
        expect(res.body.length).toBeGreaterThan(0);
    });
});