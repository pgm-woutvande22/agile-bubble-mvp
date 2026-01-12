import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  const adminHash = await bcrypt.hash('admin123', 12)
  const userHash = await bcrypt.hash('wout123', 12)

  const admin = await prisma.user.upsert({
    where: { email: 'admin@ghentstudyspots.be' },
    update: {},
    create: {
      name: 'Admin',
      email: 'admin@ghentstudyspots.be',
      passwordHash: adminHash,
      role: 'ADMIN',
    },
  })

  const wout = await prisma.user.upsert({
    where: { email: 'wout@ghentstudyspots.be' },
    update: {},
    create: {
      name: 'Wout',
      email: 'wout@ghentstudyspots.be',
      passwordHash: userHash,
      role: 'USER',
    },
  })

  console.log('✅ Admin created:', admin.email)
  console.log('✅ User created:', wout.email)
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
