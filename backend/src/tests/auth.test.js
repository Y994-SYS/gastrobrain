import { describe, it, expect } from 'vitest';
import request from 'supertest';

const BASE = process.env.TEST_API_URL || 'https://api.gastrobrain.com.tr';
const IZINLI_ORIGIN = 'https://app.gastrobrain.com.tr';

// .env.test dosyanda su degiskenleri tanimla (yoksa gecerli-giris testi atlanir):
//   TEST_TENANT_SLUG=senin-firma-slug
//   TEST_ADMIN_EMAIL=gercek-admin@mail.com
//   TEST_ADMIN_SIFRE=gercek-sifre
const calisirMi = !!process.env.TEST_ADMIN_EMAIL;

describe('Auth API', () => {
    it.skipIf(!calisirMi)('POST /api/auth/giris — geçerli kullanıcı ile giriş yapabilmeli', async () => {
        const res = await request(BASE)
            .post('/api/auth/giris')
            .set('Origin', IZINLI_ORIGIN)
            .send({
                email: process.env.TEST_ADMIN_EMAIL,
                sifre: process.env.TEST_ADMIN_SIFRE,
                tenantSlug: process.env.TEST_TENANT_SLUG,
            });

        expect(res.status).toBe(200);
        expect(res.body.basarili).toBe(true);
        expect(res.body.data).toHaveProperty('token');
        expect(res.body.data.kullanici).toHaveProperty('email', process.env.TEST_ADMIN_EMAIL);
    });

    it.skipIf(!calisirMi)('POST /api/auth/giris — yanlış şifre ile giriş yapamamalı', async () => {
        const res = await request(BASE)
            .post('/api/auth/giris')
            .set('Origin', IZINLI_ORIGIN)
            .send({
                email: process.env.TEST_ADMIN_EMAIL,
                sifre: 'kesinlikle_yanlis_sifre_123',
                tenantSlug: process.env.TEST_TENANT_SLUG,
            });

        expect(res.status).toBe(401);
    });

    it('POST /api/auth/giris — var olmayan kullanıcı ile giriş yapamamalı', async () => {
        const res = await request(BASE)
            .post('/api/auth/giris')
            .set('Origin', IZINLI_ORIGIN)
            .send({ email: 'kesinlikle-yok-' + Date.now() + '@gastroiq.com', sifre: '123456' });

        expect(res.status).toBe(401);
    });

    it('GET /api/auth/ben — geçersiz token ile 401 dönmeli', async () => {
        const res = await request(BASE)
            .get('/api/auth/ben')
            .set('Origin', IZINLI_ORIGIN)
            .set('Authorization', 'Bearer gecersiz_token');

        expect(res.status).toBe(401);
    });
});