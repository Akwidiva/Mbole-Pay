import prisma from '../lib/db'
import { PaymentFactory } from '../lib/payments/payment-factory'

async function main() {
  const contributionId = process.env.CONTRIBUTION_ID || 'cmpi6enyf00019gp449540jc4'
  const phone = process.env.PHONE || '697000000'
  const provider = (process.env.PROVIDER as any) || 'MTN_MOMO'

  const contribution = await prisma.contribution.findUnique({ where: { id: contributionId }, include: { group: true, user: true } })
  if (!contribution) {
    console.error('Contribution not found:', contributionId)
    process.exit(2)
  }

  // Create payment record
  const payment = await prisma.payment.create({ data: {
    userId: contribution.userId,
    groupId: contribution.groupId,
    contributionId: contribution.id,
    amount: contribution.amount,
    currency: 'XAF',
    status: 'PENDING',
    provider: provider,
    phoneNumber: phone.replace(/\s/g, ''),
    retryCount: 0,
  } })

  console.log('Payment record created:', payment.id)

  // Call provider
  try {
    const providerInstance = PaymentFactory.getProvider(provider)
    const result = await providerInstance.requestToPay({ amount: payment.amount, phoneNumber: phone.replace(/\s/g, ''), externalId: payment.id, description: `Payment for ${contribution.group.name}` })
    console.log('Provider response:', result)

    const providerRef = (result as any).referenceId || (result as any).transactionId || null
    await prisma.payment.update({ where: { id: payment.id }, data: { providerRef: providerRef, status: 'PROCESSING' } })
    console.log('Payment updated with providerRef:', providerRef)
  } catch (err: any) {
    console.error('Provider call failed:', err.message || err)
    await prisma.payment.update({ where: { id: payment.id }, data: { status: 'FAILED' } })
  }

  await prisma.$disconnect()
}

main().catch(async (e) => {
  console.error(e)
  await prisma.$disconnect()
  process.exit(1)
})
