import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { requireAdmin } from '@/lib/session'
import { z } from 'zod'

interface RouteParams {
  params: { id: string }
}

// GET single sensor
export async function GET(req: NextRequest, { params }: RouteParams) {
  try {
    const sensor = await prisma.sensor.findUnique({
      where: { id: params.id },
      include: {
        location: true,
      },
    })

    if (!sensor) {
      return NextResponse.json({ error: 'Sensor not found' }, { status: 404 })
    }

    return NextResponse.json(sensor)
  } catch (error) {
    console.error('Error fetching sensor:', error)
    return NextResponse.json(
      { error: 'Failed to fetch sensor' },
      { status: 500 }
    )
  }
}

const updateSensorSchema = z.object({
  currentNoiseLevel: z.number().min(0).max(100).optional(),
  currentOccupancy: z.number().min(0).optional(),
  isManualOverride: z.boolean().optional(),
})

// PUT - Update sensor values (Admin only)
export async function PUT(req: NextRequest, { params }: RouteParams) {
  try {
    await requireAdmin()

    const body = await req.json()
    const data = updateSensorSchema.parse(body)

    const sensor = await prisma.sensor.findUnique({
      where: { id: params.id },
      include: { location: true },
    })

    if (!sensor) {
      return NextResponse.json({ error: 'Sensor not found' }, { status: 404 })
    }

    // Ensure occupancy doesn't exceed capacity
    if (data.currentOccupancy !== undefined) {
      data.currentOccupancy = Math.min(data.currentOccupancy, sensor.location.capacity)
    }

    const updatedSensor = await prisma.sensor.update({
      where: { id: params.id },
      data: {
        ...data,
        lastUpdated: new Date(),
      },
      include: {
        location: true,
      },
    })

    return NextResponse.json(updatedSensor)
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

    console.error('Error updating sensor:', error)
    return NextResponse.json(
      { error: 'Failed to update sensor' },
      { status: 500 }
    )
  }
}

// DELETE sensor (Admin only)
export async function DELETE(req: NextRequest, { params }: RouteParams) {
  try {
    await requireAdmin()

    await prisma.sensor.delete({
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

    console.error('Error deleting sensor:', error)
    return NextResponse.json(
      { error: 'Failed to delete sensor' },
      { status: 500 }
    )
  }
}
