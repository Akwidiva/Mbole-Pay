import { PrismaClient } from '@prisma/client'
const p = new PrismaClient({ datasourceUrl: 'postgresql://mbole:mbole_password@localhost:5432/mbole_pay' })

const nonAdmins = await p.user.findMany({
  where: { role: { not: 'SUPER_ADMIN' } },
  select: { id: true, email: true }
})

if (nonAdmins.length === 0) {
  console.log('No non-admin users found.')
  await p.$disconnect()
  process.exit(0)
}

const ids = nonAdmins.map(u => u.id)
console.log(`Deleting ${ids.length} user(s): ${nonAdmins.map(u => u.email).join(', ')}`)

// Delete in dependency order
await p.payment.deleteMany({ where: { userId: { in: ids } } })
await p.contribution.deleteMany({ where: { userId: { in: ids } } })
await p.payout.deleteMany({ where: { recipientId: { in: ids } } })
await p.withdrawalRequest.deleteMany({ where: { userId: { in: ids } } })
await p.membership.deleteMany({ where: { userId: { in: ids } } })
await p.groupInvitation.deleteMany({ where: { invitedById: { in: ids } } })

// Delete any groups created by these users that now have no members
const orphanedGroups = await p.group.findMany({
  where: { creator_id: { in: ids } },
  select: { id: true }
})
if (orphanedGroups.length > 0) {
  const gids = orphanedGroups.map(g => g.id)
  await p.dispute.deleteMany({ where: { groupId: { in: gids } } })
  await p.groupInvitation.deleteMany({ where: { groupId: { in: gids } } })
  await p.group.deleteMany({ where: { id: { in: gids } } })
  console.log(`Deleted ${orphanedGroups.length} orphaned group(s)`)
}

const result = await p.user.deleteMany({ where: { id: { in: ids } } })
console.log(`Done — deleted ${result.count} user(s). Only SUPER_ADMIN remains.`)

await p.$disconnect()
