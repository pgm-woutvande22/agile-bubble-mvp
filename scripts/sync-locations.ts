/**
 * Script to sync locations from Ghent Open Data API
 * Run with: npm run db:sync
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

interface GhentRecord {
  id: number
  titel: string
  adres?: string
  postcode?: string
  gemeente?: string
  totale_capaciteit?: number
  label_1?: string
  openingsuren?: string
  teaser_text?: string
  lees_meer?: string
  geo_punt?: {
    lat: number
    lon: number
  }
}

async function syncLocations() {
  console.log('🔄 Starting location sync from Ghent Open Data API...')

  const apiUrl =
    process.env.GHENT_API_URL ||
    'https://data.stad.gent/api/explore/v2.1/catalog/datasets/bloklocaties-gent/records'

  try {
    const response = await fetch(`${apiUrl}?limit=100`)

    if (!response.ok) {
      throw new Error(`API responded with status ${response.status}`)
    }

    const data = await response.json()
    const records: GhentRecord[] = data.results || []

    console.log(`📦 Fetched ${records.length} records from API`)

    let created = 0
    let updated = 0
    let skipped = 0

    for (const record of records) {
      // Skip records without coordinates
      if (!record.geo_punt?.lat || !record.geo_punt?.lon) {
        console.log(`⚠️ Skipping ${record.titel}: no coordinates`)
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
      }

      const externalId = `ghent-${record.id}`

      try {
        const existing = await prisma.location.findUnique({
          where: { externalId },
        })

        if (existing) {
          await prisma.location.update({
            where: { externalId },
            data: locationData,
          })
          console.log(`✏️ Updated: ${locationData.name}`)
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
              currentOccupancy: Math.floor(
                Math.random() * (location.capacity * 0.5)
              ),
            },
          })

          console.log(`✅ Created: ${locationData.name}`)
          created++
        }
      } catch (err) {
        console.error(`❌ Error processing ${record.naam}:`, err)
      }
    }

    // Log sync
    await prisma.syncLog.create({
      data: {
        syncType: 'locations',
        status: 'success',
        recordCount: records.length,
        message: `Created ${created}, Updated ${updated}, Skipped ${skipped}`,
      },
    })

    console.log('\n📊 Sync Summary:')
    console.log(`   Total records: ${records.length}`)
    console.log(`   Created: ${created}`)
    console.log(`   Updated: ${updated}`)
    console.log(`   Skipped: ${skipped}`)
    console.log('\n🎉 Sync completed successfully!')
  } catch (error) {
    console.error('❌ Sync failed:', error)

    await prisma.syncLog.create({
      data: {
        syncType: 'locations',
        status: 'error',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
    })

    process.exit(1)
  }
}

syncLocations()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
