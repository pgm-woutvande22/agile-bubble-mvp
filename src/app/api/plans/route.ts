import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { requireAuth, getCurrentUser } from '@/lib/session'
import { z } from 'zod'
import { getLocationStatus, getNoiseLevel, getOccupancyLevel } from '@/types'

// GET user's study plans
export async function GET() {
  try {
    const user = await getCurrentUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const plans = await prisma.studyPlan.findMany({
      where: { userId: user.id },
      include: {
        location: {
          include: {
            sensor: true,
          },
        },
      },
      orderBy: {
        startTime: 'asc',
      },
    })

    return NextResponse.json(plans)
  } catch (error) {
    console.error('Error fetching study plans:', error)
    return NextResponse.json(
      { error: 'Failed to fetch study plans' },
      { status: 500 }
    )
  }
}

const createPlanSchema = z.object({
  locationId: z.string(),
  startTime: z.string().transform((s) => new Date(s)),
  endTime: z.string().transform((s) => new Date(s)),
  notes: z.string().optional(),
})

// POST - Create study plan with validation
export async function POST(req: NextRequest) {
  try {
    const user = await requireAuth()
    const body = await req.json()
    const data = createPlanSchema.parse(body)

    // Validate time range
    if (data.startTime >= data.endTime) {
      return NextResponse.json(
        { error: 'End time must be after start time' },
        { status: 400 }
      )
    }

    if (data.startTime < new Date()) {
      return NextResponse.json(
        { error: 'Cannot create plan in the past' },
        { status: 400 }
      )
    }

    // Get location with sensor
    const location = await prisma.location.findUnique({
      where: { id: data.locationId },
      include: { sensor: true },
    })

    if (!location) {
      return NextResponse.json({ error: 'Location not found' }, { status: 404 })
    }

    // Get warnings based on current sensor data
    const warnings: string[] = []
    let alternatives: any[] = []

    if (location.sensor) {
      const status = getLocationStatus(location.sensor, location.capacity)

      if (status.noiseLevel === 'loud') {
        warnings.push('⚠️ This location is currently loud')
      }

      if (status.occupancyLevel === 'full') {
        warnings.push('⚠️ This location is currently full (no seats available)')
      } else if (status.occupancyLevel === 'busy') {
        warnings.push('ℹ️ This location is busy (' + status.availableSeats + ' seats remaining)')
      }

      // If there are warnings, find alternatives
      if (warnings.length > 0) {
        const allLocations = await prisma.location.findMany({
          where: {
            id: { not: location.id },
          },
          include: { sensor: true },
        })

        // Calculate distance and filter better alternatives
        alternatives = allLocations
          .filter((loc) => {
            if (!loc.sensor) return false
            const locStatus = getLocationStatus(loc.sensor, loc.capacity)
            // Only suggest if it's quieter or has more availability
            return (
              (getNoiseLevel(loc.sensor.currentNoiseLevel) !== 'loud' &&
                getOccupancyLevel(loc.sensor.currentOccupancy, loc.capacity) !== 'full')
            )
          })
          .map((loc) => {
            // Calculate distance (Haversine formula)
            const R = 6371 // Earth's radius in km
            const dLat = ((loc.latitude - location.latitude) * Math.PI) / 180
            const dLon = ((loc.longitude - location.longitude) * Math.PI) / 180
            const a =
              Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos((location.latitude * Math.PI) / 180) *
                Math.cos((loc.latitude * Math.PI) / 180) *
                Math.sin(dLon / 2) *
                Math.sin(dLon / 2)
            const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
            const distance = R * c

            const status = getLocationStatus(loc.sensor!, loc.capacity)

            return {
              id: loc.id,
              name: loc.name,
              address: loc.address,
              distance: Math.round(distance * 1000), // in meters
              noiseLevel: status.noiseLevel,
              availableSeats: status.availableSeats,
            }
          })
          .sort((a, b) => a.distance - b.distance)
          .slice(0, 3)
      }
    }

    // Create the plan
    const plan = await prisma.studyPlan.create({
      data: {
        userId: user.id,
        locationId: data.locationId,
        startTime: data.startTime,
        endTime: data.endTime,
        notes: data.notes,
      },
      include: {
        location: {
          include: {
            sensor: true,
          },
        },
      },
    })

    return NextResponse.json(
      {
        plan,
        warnings,
        alternatives: alternatives.length > 0 ? alternatives : undefined,
      },
      { status: 201 }
    )
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors[0].message },
        { status: 400 }
      )
    }

    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    console.error('Error creating study plan:', error)
    return NextResponse.json(
      { error: 'Failed to create study plan' },
      { status: 500 }
    )
  }
}
