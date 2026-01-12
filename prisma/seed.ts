import { PrismaClient, Role } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Starting database seed...')

  // Create admin user
  const adminPassword = await bcrypt.hash('admin123', 12)
  const admin = await prisma.user.upsert({
    where: { email: 'admin@ghentstudyspots.be' },
    update: {},
    create: {
      name: 'Admin',
      email: 'admin@ghentstudyspots.be',
      passwordHash: adminPassword,
      role: Role.ADMIN,
    },
  })
  console.log('✅ Created admin user:', admin.email)

  // Create test user
  const userPassword = await bcrypt.hash('user123', 12)
  const user = await prisma.user.upsert({
    where: { email: 'student@ugent.be' },
    update: {},
    create: {
      name: 'Test Student',
      email: 'student@ugent.be',
      passwordHash: userPassword,
      role: Role.USER,
    },
  })
  console.log('✅ Created test user:', user.email)

  // Create some sample locations (before syncing from API)
  const sampleLocations = [
    {
      externalId: 'sample-1',
      name: 'Boekentoren UGent',
      address: 'Rozier 9, 9000 Gent',
      latitude: 51.0425,
      longitude: 3.7255,
      capacity: 200,
      description: 'Historische bibliotheek van de Universiteit Gent',
      type: 'bibliotheek',
    },
    {
      externalId: 'sample-2',
      name: 'Blokspot Sint-Pietersplein',
      address: 'Sint-Pietersplein 6, 9000 Gent',
      latitude: 51.0393,
      longitude: 3.7247,
      capacity: 100,
      description: 'Rustige studieruimte voor studenten',
      type: 'studiezaal',
    },
    {
      externalId: 'sample-3',
      name: 'Bibliotheek Tweebronnen',
      address: 'Jozef Plateaustraat 40, 9000 Gent',
      latitude: 51.0479,
      longitude: 3.7229,
      capacity: 80,
      description: 'Moderne bibliotheek met studieplaatsen',
      type: 'bibliotheek',
    },
  ]

  for (const loc of sampleLocations) {
    const location = await prisma.location.upsert({
      where: { externalId: loc.externalId },
      update: loc,
      create: loc,
    })

    // Create sensor for each location
    await prisma.sensor.upsert({
      where: { locationId: location.id },
      update: {},
      create: {
        locationId: location.id,
        currentNoiseLevel: Math.floor(Math.random() * 50) + 20,
        currentOccupancy: Math.floor(Math.random() * (location.capacity * 0.7)),
      },
    })

    console.log('✅ Created location with sensor:', location.name)
  }

  // Create sample favorite
  const firstLocation = await prisma.location.findFirst()
  if (firstLocation) {
    await prisma.favorite.upsert({
      where: {
        userId_locationId: {
          userId: user.id,
          locationId: firstLocation.id,
        },
      },
      update: {},
      create: {
        userId: user.id,
        locationId: firstLocation.id,
      },
    })
    console.log('✅ Created sample favorite')

    // Create sample study plan
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)
    tomorrow.setHours(9, 0, 0, 0)

    const endTime = new Date(tomorrow)
    endTime.setHours(12, 0, 0, 0)

    await prisma.studyPlan.create({
      data: {
        userId: user.id,
        locationId: firstLocation.id,
        startTime: tomorrow,
        endTime: endTime,
        notes: 'Studeren voor examens',
      },
    })
    console.log('✅ Created sample study plan')
  }

  console.log('🎉 Database seed completed!')
}

main()
  .catch((e) => {
    console.error('❌ Seed error:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
