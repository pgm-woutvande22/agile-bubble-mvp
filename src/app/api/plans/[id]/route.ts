import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { requireAuth } from '@/lib/session'
import { z } from 'zod'

interface RouteParams {
  params: { id: string }
}

// GET single plan
export async function GET(req: NextRequest, { params }: RouteParams) {
  try {
    const user = await requireAuth()

    const plan = await prisma.studyPlan.findFirst({
      where: {
        id: params.id,
        userId: user.id,
      },
      include: {
        location: {
          include: {
            sensor: true,
          },
        },
      },
    })

    if (!plan) {
      return NextResponse.json({ error: 'Plan not found' }, { status: 404 })
    }

    return NextResponse.json(plan)
  } catch (error) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    console.error('Error fetching plan:', error)
    return NextResponse.json(
      { error: 'Failed to fetch plan' },
      { status: 500 }
    )
  }
}

const updatePlanSchema = z.object({
  locationId: z.string().optional(),
  startTime: z.string().transform((s) => new Date(s)).optional(),
  endTime: z.string().transform((s) => new Date(s)).optional(),
  notes: z.string().optional(),
})

// PUT - Update plan
export async function PUT(req: NextRequest, { params }: RouteParams) {
  try {
    const user = await requireAuth()
    const body = await req.json()
    const data = updatePlanSchema.parse(body)

    // Verify ownership
    const existingPlan = await prisma.studyPlan.findFirst({
      where: {
        id: params.id,
        userId: user.id,
      },
    })

    if (!existingPlan) {
      return NextResponse.json({ error: 'Plan not found' }, { status: 404 })
    }

    const plan = await prisma.studyPlan.update({
      where: { id: params.id },
      data,
      include: {
        location: {
          include: {
            sensor: true,
          },
        },
      },
    })

    return NextResponse.json(plan)
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

    console.error('Error updating plan:', error)
    return NextResponse.json(
      { error: 'Failed to update plan' },
      { status: 500 }
    )
  }
}

// DELETE plan
export async function DELETE(req: NextRequest, { params }: RouteParams) {
  try {
    const user = await requireAuth()

    // Verify ownership
    const existingPlan = await prisma.studyPlan.findFirst({
      where: {
        id: params.id,
        userId: user.id,
      },
    })

    if (!existingPlan) {
      return NextResponse.json({ error: 'Plan not found' }, { status: 404 })
    }

    await prisma.studyPlan.delete({
      where: { id: params.id },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    console.error('Error deleting plan:', error)
    return NextResponse.json(
      { error: 'Failed to delete plan' },
      { status: 500 }
    )
  }
}
