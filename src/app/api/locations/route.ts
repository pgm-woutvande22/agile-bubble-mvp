import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getCurrentUser, requireAdmin } from '@/lib/session'
import { z } from 'zod'

// GET all locations with sensors
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const includeStatus = searchParams.get('includeStatus') === 'true'

    const locations = await prisma.location.findMany({
      include: {
        sensor: true,
        _count: {
          select: {
            favorites: true,
            studyPlans: true,
          },
        },
      },
      orderBy: {
        name: 'asc',
      },
    })

    return NextResponse.json(locations)
  } catch (error) {
    console.error('Error fetching locations:', error)
    return NextResponse.json(
      { error: 'Failed to fetch locations' },
      { status: 500 }
    )
  }
}

const createLocationSchema = z.object({
  name: z.string().min(2),
  address: z.string().min(5),
  latitude: z.number(),
  longitude: z.number(),
  capacity: z.number().min(1).default(50),
  description: z.string().optional(),
  type: z.string().optional(),
  website: z.string().optional(),
  openingHours: z.string().optional(),
  sensor: z.object({
    deviceId: z.string().optional(),
    port: z.number().optional(),
    password: z.string().optional(),
  }).optional(),
})

// POST - Create new location (Admin only)
export async function POST(req: NextRequest) {
  try {
    await requireAdmin()

    const body = await req.json()
    const data = createLocationSchema.parse(body)

    const { sensor: sensorData, ...locationData } = data

    const location = await prisma.location.create({
      data: {
        ...locationData,
        sensor: {
          create: {
            deviceId: sensorData?.deviceId,
            port: sensorData?.port,
            password: sensorData?.password,
            currentNoiseLevel: 30,
            currentOccupancy: 0,
          },
        },
      },
      include: {
        sensor: true,
      },
    })

    return NextResponse.json(location, { status: 201 })
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

    console.error('Error creating location:', error)
    return NextResponse.json(
      { error: 'Failed to create location' },
      { status: 500 }
    )
  }
}
