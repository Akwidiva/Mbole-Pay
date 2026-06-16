import { PrismaClient } from '@prisma/client'
const p = new PrismaClient({ datasourceUrl: 'postgresql://mbole:mbole_password@localhost:5432/mbole_pay' })
const users = await p.user.findMany({ select: { id: true, email: true, name: true, role: true, kycStatus: true } })
console.log(JSON.stringify(users, null, 2))
await p.$disconnect()
