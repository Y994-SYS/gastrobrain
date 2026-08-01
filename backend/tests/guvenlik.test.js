import { describe, it, expect } from 'vitest';

const BASE_URL = process.env.TEST_API_URL || 'https://api.gastrobrain.com.tr';
const IZINLI_ORIGIN = 'https://app.gastrobrain.com.tr';

function testFetch(path, options = {}) {
    return fetch(BASE_URL + path, {
        ...options,
        headers: {
            ...(options.headers || {}),
            Origin: IZINLI_ORIGIN,
        },
    });
}

async function girisYap(email, sifre, tenantSlug) {
    const res = await testFetch('/api/auth/giris', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, sifre, tenantSlug }),
    });
    const data = await res.json();
    if (!data.basarili) throw new Error('Test girisi basarisiz: ' + data.mesaj);
    return data.data.token;
}

describe('Guvenlik regresyon testleri', () => {

    it('saglik kontrolu - API ayakta', async () => {
        const res = await testFetch('/');
        expect(res.status).toBe(200);
        const data = await res.json();
        expect(data.message).toMatch(/GastroBRAIN/);
    });

    it('KRITIK: /api/auth/kayit kimliksiz erisimi reddetmeli', async () => {
        const res = await testFetch('/api/auth/kayit', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                ad: 'guvenlik-test',
                email: 'guvenlik-test-' + Date.now() + '@test.com',
                sifre: '123456',
                rol: 'SUPER_ADMIN',
            }),
        });
        expect(res.status).toBe(401);
        const data = await res.json();
        expect(data.basarili).toBe(false);
    });

    it('/api/dashboard/subeler kimliksiz erisimi reddetmeli', async () => {
        const res = await testFetch('/api/dashboard/subeler');
        expect(res.status).toBe(401);
    });

    it('gecersiz JWT ile korumali endpoint erisimi reddedilmeli', async () => {
        const res = await testFetch('/api/auth/ben', {
            headers: { Authorization: 'Bearer gecersiz.bir.token' },
        });
        expect(res.status).toBe(401);
    });

    const personelVarMi = !!process.env.TEST_PERSONEL_EMAIL;

    it.skipIf(!personelVarMi)('PERSONEL rolu dashboard erisememeli', async () => {
        const token = await girisYap(
            process.env.TEST_PERSONEL_EMAIL,
            process.env.TEST_PERSONEL_SIFRE,
            process.env.TEST_TENANT_SLUG
        );
        const res = await testFetch('/api/dashboard/subeler', {
            headers: { Authorization: 'Bearer ' + token },
        });
        expect(res.status).toBe(403);
    });

    const mudurVarMi = !!process.env.TEST_MUDUR_EMAIL;

    it.skipIf(!mudurVarMi)('MUDUR kendi subesi disina erisememeli', async () => {
        const token = await girisYap(
            process.env.TEST_MUDUR_EMAIL,
            process.env.TEST_MUDUR_SIFRE,
            process.env.TEST_TENANT_SLUG
        );
        const res = await testFetch('/api/subeler/999999', {
            headers: { Authorization: 'Bearer ' + token },
        });
        expect(res.status).toBe(403);
    });
});
