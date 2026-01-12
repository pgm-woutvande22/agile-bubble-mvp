import { Navbar } from '@/components/layout/Navbar'
import { Footer } from '@/components/layout/Footer'
import { LocationsList } from '@/components/features/LocationsList'
import prisma from '@/lib/prisma'
import { getCurrentUser } from '@/lib/session'
import { LocationWithSensor } from '@/types'

async function getLocations(): Promise<LocationWithSensor[]> {
  return prisma.location.findMany({
    include: {
      sensor: true,
      _count: {
        select: {
          favorites: true,
          studyPlans: true,
        },
      },
    },
    orderBy: { name: 'asc' },
  })
}

async function getUserFavorites(userId: string | undefined) {
  if (!userId) return []
  const favorites = await prisma.favorite.findMany({
    where: { userId },
    select: { locationId: true },
  })
  return favorites.map((f) => f.locationId)
}

export default async function LocationsPage() {
  const user = await getCurrentUser()
  const [locations, favoriteIds] = await Promise.all([
    getLocations(),
    getUserFavorites(user?.id),
  ])

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Navbar />

      <main className="flex-1">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Study Locations
              </h1>
              <p className="text-gray-500 mt-1">
                Live noise and occupancy updates every 30 seconds
              </p>
            </div>

            <div className="flex items-center space-x-3">
              <span className="text-sm text-gray-500">Legend:</span>
              <span className="flex items-center text-sm text-gray-600">
                <span className="w-3 h-3 rounded-full bg-green-500 mr-1.5"></span>
                Quiet
              </span>
              <span className="flex items-center text-sm text-gray-600">
                <span className="w-3 h-3 rounded-full bg-yellow-500 mr-1.5"></span>
                Moderate
              </span>
              <span className="flex items-center text-sm text-gray-600">
                <span className="w-3 h-3 rounded-full bg-red-500 mr-1.5"></span>
                Loud
              </span>
            </div>
          </div>

          <LocationsList
            initialLocations={locations}
            initialFavoriteIds={favoriteIds}
            userId={user?.id}
            refreshInterval={30}
          />
        </div>
      </main>

      <Footer />
    </div>
  )
}
