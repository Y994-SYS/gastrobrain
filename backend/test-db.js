const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();
p.$connect()
  .then(() => console.log('BAGLANDI'))
  .catch(e => console.log('HATA:', e.message));