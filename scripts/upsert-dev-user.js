const { PrismaClient } = require('@prisma/client');
(async () => {
  const prisma = new PrismaClient();
  try {
    const u = await prisma.user.upsert({
      where: { id: 'user-1' },
      update: { email: 'akwifonguhjoy@gmail.com' },
      create: { id: 'user-1', email: 'akwifonguhjoy@gmail.com', name: 'Dev User', password: null }
    });
    console.log('Upserted user:', u.id, u.email);
  } catch (e) {
    console.error(e);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
})();