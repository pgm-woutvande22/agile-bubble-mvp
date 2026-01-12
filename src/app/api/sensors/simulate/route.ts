import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

// POST endpoint to simulate sensor updates (for development/demo)
export async function POST() {
  try {
    // Get all sensors that are not in manual override mode
    const sensors = await prisma.sensor.findMany({
      where: {
        isManualOverride: false,
      },
      include: {
        location: true,
      },
    })

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
          // More people coming during peak hours
          occupancyChange = Math.floor(Math.random() * 10) - 3
        } else {
          // Slower changes during non-peak hours
          occupancyChange = Math.floor(Math.random() * 6) - 3
        }
      } else {
        // People leaving after hours
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

      updated++
    }

    return NextResponse.json({
      success: true,
      updated,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error('Simulation error:', error)
    return NextResponse.json(
      { error: 'Failed to simulate sensors' },
      { status: 500 }
    )
  }
}
