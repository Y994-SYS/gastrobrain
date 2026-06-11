import { describe, it, expect } from 'vitest';
import request from 'supertest';

const BASE = 'http://localhost:3001';

describe('Auth API', () => {
    it('POST /api/auth/giris — geçerli kullanıcı ile giriş yapabilmeli', async () => {
        const res = await request(BASE)
            .post('/api/auth/giris')
            .send({ email: 'admin@gastroiq.com', sifre: '123456' });

        expect(res.status).toBe(200);
        expect(res.body.basarili).toBe(true);
        expect(res.body.data).toHaveProperty('token');
        expect(res.body.data.kullanici).toHaveProperty('email', 'admin@gastroiq.com');
    });

    it('POST /api/auth/giris — yanlış şifre ile giriş yapamamalı', async () => {
        const res = await request(BASE)
            .post('/api/auth/giris')
            .send({ email: 'admin@gastroiq.com', sifre: 'yanlis_sifre' });

        expect(res.status).toBe(401);
    });

    it('POST /api/auth/giris — var olmayan kullanıcı ile giriş yapamamalı', async () => {
        const res = await request(BASE)
            .post('/api/auth/giris')
            .send({ email: 'yok@gastroiq.com', sifre: '123456' });

        expect(res.status).toBe(401);
    });

    it('GET /api/auth/ben — geçersiz token ile 401 dönmeli', async () => {
        const res = await request(BASE)
            .get('/api/auth/ben')
            .set('Authorization', 'Bearer gecersiz_token');

        expect(res.status).toBe(401);
    });
});