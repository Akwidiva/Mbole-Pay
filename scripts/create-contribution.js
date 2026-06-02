const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function main() {
  const email = process.env.TEST_USER_EMAIL || 'test@example.com'
  const groupId = process.env.GROUP_ID || 'cmpi0nko200019gno8e1xcf9z'

  const user = await prisma.user.findUnique({ where: { email } })
  if (!user) {
    console.error('User not found:', email)
    process.exit(2)
  }

  const membership = await prisma.membership.findUnique({ where: { userId_groupId: { userId: user.id, groupId } } })
  if (!membership) {
    console.error('User is not a member of group:', groupId)
    process.exit(3)
  }

  const contribution = await prisma.contribution.create({
    data: {
      amount: 2500,
      dueDate: new Date(Date.now() + 24 * 60 * 60 * 1000),
      status: 'PENDING',
      userId: user.id,
      groupId,
    },
  })

  console.log('Created contribution:', contribution)
  await prisma.$disconnect()
}

main().catch(async (e) => {
  console.error(e)
  await prisma.$disconnect()
  process.exit(1)
})
