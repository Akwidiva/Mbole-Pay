const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const groupId = process.argv[2];
  if (!groupId) {
    console.error('Usage: node check_group.js <groupId>');
    process.exit(1);
  }

  const group = await prisma.group.findUnique({
    where: { id: groupId },
    include: { memberships: true }
  });

  console.log('Group:', group ? { id: group.id, name: group.name, memberships: group.memberships.length } : null);

  const memberships = await prisma.membership.findMany({ where: { groupId } });
  console.log('Memberships count:', memberships.length);
  console.log('Memberships sample:', memberships.slice(0,5));

  await prisma.$disconnect();
}

main().catch(e => { console.error(e); process.exit(1); });
