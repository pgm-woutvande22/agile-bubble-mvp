import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

// This endpoint is called by Vercel Cron to sync locations from Ghent API
export async function GET(req: NextRequest) {
  try {
    // Verify cron secret
    const authHeader = req.headers.get('authorization')
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const apiUrl = process.env.GHENT_API_URL || 'https://data.stad.gent/api/explore/v2.1/catalog/datasets/bloklocaties-gent/records'
    
    // Fetch all records
    const response = await fetch(`${apiUrl}?limit=100`)
    
    if (!response.ok) {
      throw new Error(`API responded with status ${response.status}`)
    }

    const data = await response.json()
    const records = data.results || []

    let created = 0
    let updated = 0

    for (const record of records) {
      const locationData = {
        name: record.naam || 'Unknown Location',
        address: [
          record.straat,
          record.huisnummer,
          record.postcode,
          record.gemeente,
        ]
          .filter(Boolean)
          .join(' '),
        latitude: record.geo_punt?.lat || 51.0543,
        longitude: record.geo_punt?.lon || 3.7174,
        capacity: record.capaciteit || 50,
        type: record.type || null,
        website: record.website || null,
        openingHours: record.openingsuren || null,
        description: record.beschrijving || null,
      }

      const externalId = record.recordid || `ghent-${record.naam?.toLowerCase().replace(/\s+/g, '-')}`

      const existing = await prisma.location.findUnique({
        where: { externalId },
      })

      if (existing) {
        await prisma.location.update({
          where: { externalId },
          data: locationData,
        })
        updated++
      } else {
        const location = await prisma.location.create({
          data: {
            ...locationData,
            externalId,
          },
        })

        // Create sensor for new location
        await prisma.sensor.create({
          data: {
            locationId: location.id,
            currentNoiseLevel: Math.floor(Math.random() * 40) + 20,
            currentOccupancy: Math.floor(Math.random() * (location.capacity * 0.5)),
          },
        })
        created++
      }
    }

    // Log sync
    await prisma.syncLog.create({
      data: {
        syncType: 'locations',
        status: 'success',
        recordCount: records.length,
        message: `Created ${created}, Updated ${updated} locations`,
      },
    })

    return NextResponse.json({
      success: true,
      total: records.length,
      created,
      updated,
    })
  } catch (error) {
    console.error('Sync error:', error)

    // Log error
    await prisma.syncLog.create({
      data: {
        syncType: 'locations',
        status: 'error',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
    })

    return NextResponse.json(
      { error: 'Failed to sync locations' },
      { status: 500 }
    )
  }
}
