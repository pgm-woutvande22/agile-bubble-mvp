import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { requireAdmin } from '@/lib/session'
import { z } from 'zod'

interface RouteParams {
  params: { id: string }
}

// GET single location
export async function GET(req: NextRequest, { params }: RouteParams) {
  try {
    const location = await prisma.location.findUnique({
      where: { id: params.id },
      include: {
        sensor: true,
        _count: {
          select: {
            favorites: true,
            studyPlans: true,
          },
        },
      },
    })

    if (!location) {
      return NextResponse.json({ error: 'Location not found' }, { status: 404 })
    }

    return NextResponse.json(location)
  } catch (error) {
    console.error('Error fetching location:', error)
    return NextResponse.json(
      { error: 'Failed to fetch location' },
      { status: 500 }
    )
  }
}

const updateLocationSchema = z.object({
  name: z.string().min(2).optional(),
  address: z.string().min(5).optional(),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
  capacity: z.number().min(1).optional(),
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

// PUT - Update location (Admin only)
export async function PUT(req: NextRequest, { params }: RouteParams) {
  try {
    await requireAdmin()

    const body = await req.json()
    const data = updateLocationSchema.parse(body)

    const { sensor: sensorData, ...locationData } = data

    // Update location
    const location = await prisma.location.update({
      where: { id: params.id },
      data: locationData,
      include: {
        sensor: true,
      },
    })

    // Update sensor if sensor data provided
    if (sensorData && location.sensor) {
      await prisma.sensor.update({
        where: { id: location.sensor.id },
        data: {
          deviceId: sensorData.deviceId,
          port: sensorData.port,
          password: sensorData.password,
        },
      })
    }

    // Refetch with updated sensor
    const updatedLocation = await prisma.location.findUnique({
      where: { id: params.id },
      include: {
        sensor: true,
      },
    })

    return NextResponse.json(updatedLocation)
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

    console.error('Error updating location:', error)
    return NextResponse.json(
      { error: 'Failed to update location' },
      { status: 500 }
    )
  }
}

// DELETE location (Admin only)
export async function DELETE(req: NextRequest, { params }: RouteParams) {
  try {
    await requireAdmin()

    await prisma.location.delete({
      where: { id: params.id },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    if (error instanceof Error && error.message === 'Forbidden: Admin access required') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    console.error('Error deleting location:', error)
    return NextResponse.json(
      { error: 'Failed to delete location' },
      { status: 500 }
    )
  }
}
