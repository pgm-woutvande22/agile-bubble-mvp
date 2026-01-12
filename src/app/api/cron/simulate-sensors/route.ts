import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

// This endpoint is called every 30 seconds by Vercel Cron to simulate sensor updates
export async function GET(req: NextRequest) {
  try {
    // Verify cron secret
    const authHeader = req.headers.get('authorization')
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

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
      // Base noise varies with time of day
      let baseNoise = 25
      if (isWorkingHours) {
        baseNoise = isPeakTime ? 45 : 35
      }

      // Add random fluctuation (-10 to +15)
      const noiseFluctuation = Math.floor(Math.random() * 25) - 10
      let newNoiseLevel = Math.max(0, Math.min(100, baseNoise + noiseFluctuation))

      // Noise is correlated with occupancy
      const occupancyRatio = sensor.currentOccupancy / sensor.location.capacity
      newNoiseLevel = Math.round(newNoiseLevel + occupancyRatio * 20)
      newNoiseLevel = Math.max(0, Math.min(100, newNoiseLevel))

      // Calculate realistic occupancy changes
      let occupancyChange = 0

      if (isWorkingHours) {
        // During working hours, people come and go
        if (isPeakTime) {
          // Peak times: more likely to increase
          occupancyChange = Math.floor(Math.random() * 10) - 3 // -3 to +6
        } else {
          // Non-peak: slight fluctuation
          occupancyChange = Math.floor(Math.random() * 6) - 3 // -3 to +2
        }
      } else {
        // Outside working hours: people leave
        occupancyChange = -Math.floor(Math.random() * 5) // -4 to 0
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
    console.error('Sensor simulation error:', error)
    return NextResponse.json(
      { error: 'Failed to simulate sensors' },
      { status: 500 }
    )
  }
}
