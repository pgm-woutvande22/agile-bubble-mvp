import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { requireAdmin } from '@/lib/session'
import { z } from 'zod'

// GET all sensors
export async function GET() {
  try {
    const sensors = await prisma.sensor.findMany({
      include: {
        location: {
          select: {
            id: true,
            name: true,
            address: true,
            capacity: true,
          },
        },
      },
      orderBy: {
        lastUpdated: 'desc',
      },
    })

    return NextResponse.json(sensors)
  } catch (error) {
    console.error('Error fetching sensors:', error)
    return NextResponse.json(
      { error: 'Failed to fetch sensors' },
      { status: 500 }
    )
  }
}

const createSensorSchema = z.object({
  locationId: z.string(),
  currentNoiseLevel: z.number().min(0).max(100).default(30),
  currentOccupancy: z.number().min(0).default(0),
})

// POST - Create sensor for location (Admin only)
export async function POST(req: NextRequest) {
  try {
    await requireAdmin()

    const body = await req.json()
    const data = createSensorSchema.parse(body)

    // Check if location exists
    const location = await prisma.location.findUnique({
      where: { id: data.locationId },
      include: { sensor: true },
    })

    if (!location) {
      return NextResponse.json({ error: 'Location not found' }, { status: 404 })
    }

    if (location.sensor) {
      return NextResponse.json(
        { error: 'Location already has a sensor' },
        { status: 400 }
      )
    }

    const sensor = await prisma.sensor.create({
      data: {
        locationId: data.locationId,
        currentNoiseLevel: data.currentNoiseLevel,
        currentOccupancy: Math.min(data.currentOccupancy, location.capacity),
      },
      include: {
        location: true,
      },
    })

    return NextResponse.json(sensor, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors[0].message },
        { status: 400 }
      )
    }

    if (error instanceof Error && error.message === 'Forbidden: Admin access required') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    console.error('Error creating sensor:', error)
    return NextResponse.json(
      { error: 'Failed to create sensor' },
      { status: 500 }
    )
  }
}
