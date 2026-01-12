/**
 * Script to simulate sensor updates
 * Run with: npm run simulate
 * 
 * In production, this runs via Vercel Cron at /api/cron/simulate-sensors
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function simulateSensors() {
  console.log('📡 Starting sensor simulation...')

  const sensors = await prisma.sensor.findMany({
    where: {
      isManualOverride: false,
    },
    include: {
      location: true,
    },
  })

  console.log(`Found ${sensors.length} sensors to update`)

  const now = new Date()
  const hour = now.getHours()
  const isWorkingHours = hour >= 8 && hour <= 22
  const isPeakTime = (hour >= 10 && hour <= 12) || (hour >= 14 && hour <= 17)

  let updated = 0

  for (const sensor of sensors) {
    // Calculate realistic noise level fluctuation
    let baseNoise = 25
    if (isWorkingHours) {
      baseNoise = isPeakTime ? 45 : 35
    }

    const noiseFluctuation = Math.floor(Math.random() * 25) - 10
    let newNoiseLevel = Math.max(0, Math.min(100, baseNoise + noiseFluctuation))

    // Noise is correlated with occupancy
    const occupancyRatio = sensor.currentOccupancy / sensor.location.capacity
    newNoiseLevel = Math.round(newNoiseLevel + occupancyRatio * 20)
    newNoiseLevel = Math.max(0, Math.min(100, newNoiseLevel))

    // Calculate realistic occupancy changes
    let occupancyChange = 0

    if (isWorkingHours) {
      if (isPeakTime) {
        occupancyChange = Math.floor(Math.random() * 10) - 3
      } else {
        occupancyChange = Math.floor(Math.random() * 6) - 3
      }
    } else {
      occupancyChange = -Math.floor(Math.random() * 5)
    }

    let newOccupancy = sensor.currentOccupancy + occupancyChange
    newOccupancy = Math.max(0, Math.min(sensor.location.capacity, newOccupancy))

    await prisma.sensor.update({
      where: { id: sensor.id },
      data: {
        currentNoiseLevel: newNoiseLevel,
        currentOccupancy: newOccupancy,
        lastUpdated: new Date(),
      },
    })

    console.log(
      `Updated ${sensor.location.name}: noise=${newNoiseLevel}%, occupancy=${newOccupancy}/${sensor.location.capacity}`
    )
    updated++
  }

  console.log(`\n✅ Updated ${updated} sensors`)
}

simulateSensors()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
