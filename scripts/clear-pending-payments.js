const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

;(async () => {
  try {
    const result = await prisma.payment.updateMany({
      where: { status: 'PENDING' },
      data: { status: 'FAILED', errorMessage: 'Cleared for retry by dev script' },
    })

    console.log(`Updated ${result.count} payment(s) from PENDING -> FAILED`)
  } catch (e) {
    console.error(e)
    process.exitCode = 1
  } finally {
    await prisma.$disconnect()
  }
})()
