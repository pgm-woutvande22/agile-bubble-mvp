import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getCurrentUser } from '@/lib/session'
import { Role } from '@prisma/client'

// Force dynamic - API routes should not be pre-rendered
export const dynamic = 'force-dynamic'

// Admin endpoint to manually trigger location sync
export async function POST() {
  try {
    // Check admin auth
    const user = await getCurrentUser()
    if (!user || user.role !== Role.ADMIN) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const apiUrl = process.env.GHENT_API_URL || 'https://data.stad.gent/api/explore/v2.1/catalog/datasets/bloklocaties-gent/records'
    
    const response = await fetch(`${apiUrl}?limit=100`)
    
    if (!response.ok) {
      throw new Error(`API responded with status ${response.status}`)
    }

    const data = await response.json()
    const records = data.results || []

    let created = 0
    let updated = 0
    let skipped = 0

    for (const record of records) {
      // Skip records without coordinates
      if (!record.geo_punt?.lat || !record.geo_punt?.lon) {
        skipped++
        continue
      }

      const locationData = {
        name: record.titel || 'Unknown Location',
        address: record.adres || 'Ghent',
        latitude: record.geo_punt.lat,
        longitude: record.geo_punt.lon,
        capacity: record.totale_capaciteit || 50,
        type: record.label_1 || null,
        website: record.lees_meer || null,
        openingHours: record.openingsuren || null,
        description: record.teaser_text || null,
        imageUrl: record.teaser_img_url || null,
      }

      const externalId = `ghent-${record.id}`

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
        message: `Manual sync: Created ${created}, Updated ${updated}, Skipped ${skipped}`,
      },
    })

    return NextResponse.json({
      success: true,
      total: records.length,
      created,
      updated,
      skipped,
    })
  } catch (error) {
    console.error('Sync error:', error)

    return NextResponse.json(
      { error: 'Failed to sync locations', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
