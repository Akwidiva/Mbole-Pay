const prismaLib = require('../lib/db').default || require('../lib/db')
const { PaymentFactory } = require('../lib/payments/payment-factory')

async function main() {
  const contributionId = process.env.CONTRIBUTION_ID || 'cmpi6enyf00019gp449540jc4'
  const phone = process.env.PHONE || '697000000'
  const provider = process.env.PROVIDER || 'MTN_MOMO'

  const contribution = await prismaLib.contribution.findUnique({ where: { id: contributionId }, include: { group: true, user: true } })
  if (!contribution) {
    console.error('Contribution not found:', contributionId)
    process.exit(2)
  }

  // Create payment record
  const payment = await prismaLib.payment.create({ data: {
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

    const providerRef = result.referenceId || result.transactionId || null
    await prismaLib.payment.update({ where: { id: payment.id }, data: { providerRef: providerRef, status: 'PROCESSING' } })
    console.log('Payment updated with providerRef:', providerRef)
  } catch (err) {
    console.error('Provider call failed:', err.message || err)
    await prismaLib.payment.update({ where: { id: payment.id }, data: { status: 'FAILED' } })
  }

  await prismaLib.$disconnect()
}

main().catch(async (e) => {
  console.error(e)
  try { await prismaLib.$disconnect() } catch(e){}
  process.exit(1)
})
