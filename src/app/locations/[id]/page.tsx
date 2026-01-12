import { notFound } from 'next/navigation'
import Link from 'next/link'
import { Navbar } from '@/components/layout/Navbar'
import { Footer } from '@/components/layout/Footer'
import { StatusBadge, NoiseIndicator, OccupancyIndicator } from '@/components/ui/StatusBadge'
import { Button } from '@/components/ui/Button'
import prisma from '@/lib/prisma'
import { getCurrentUser } from '@/lib/session'
import { getLocationStatus } from '@/types'
import { CreatePlanForm } from '@/components/forms/CreatePlanForm'
import { FavoriteButton } from '@/components/features/FavoriteButton'

interface LocationPageProps {
  params: { id: string }
}

async function getLocation(id: string) {
  return prisma.location.findUnique({
    where: { id },
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
}

async function checkFavorite(userId: string | undefined, locationId: string) {
  if (!userId) return false
  const favorite = await prisma.favorite.findUnique({
    where: {
      userId_locationId: { userId, locationId },
    },
  })
  return !!favorite
}

export default async function LocationPage({ params }: LocationPageProps) {
  const [location, user] = await Promise.all([
    getLocation(params.id),
    getCurrentUser(),
  ])

  if (!location) {
    notFound()
  }

  const isFavorite = await checkFavorite(user?.id, location.id)
  const status = location.sensor
    ? getLocationStatus(location.sensor, location.capacity)
    : null

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Navbar />

      <main className="flex-1">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Breadcrumb */}
          <nav className="mb-6">
            <Link
              href="/locations"
              className="text-primary-600 hover:text-primary-700 text-sm"
            >
              ← Back to Locations
            </Link>
          </nav>

          <div className="grid lg:grid-cols-3 gap-8">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-6">
              {/* Header */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <div className="flex justify-between items-start">
                  <div>
                    <h1 className="text-2xl font-bold text-gray-900 mb-2">
                      {location.name}
                    </h1>
                    <p className="text-gray-500">{location.address}</p>
                    {location.type && (
                      <span className="inline-block bg-gray-100 text-gray-600 text-xs px-2 py-1 rounded-full mt-2">
                        {location.type}
                      </span>
                    )}
                  </div>
                  {user && (
                    <FavoriteButton
                      locationId={location.id}
                      initialFavorite={isFavorite}
                    />
                  )}
                </div>

                {location.description && (
                  <p className="text-gray-600 mt-4">{location.description}</p>
                )}

                <div className="grid grid-cols-2 gap-4 mt-6">
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="text-sm text-gray-500 mb-1">Capacity</div>
                    <div className="text-xl font-semibold text-gray-900">
                      {location.capacity} seats
                    </div>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="text-sm text-gray-500 mb-1">Favorites</div>
                    <div className="text-xl font-semibold text-gray-900">
                      {location._count?.favorites || 0}
                    </div>
                  </div>
                </div>

                {location.website && (
                  <a
                    href={location.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center text-primary-600 hover:text-primary-700 mt-4 text-sm"
                  >
                    Visit Website →
                  </a>
                )}

                {location.openingHours && (
                  <div className="mt-4 pt-4 border-t border-gray-100">
                    <div className="text-sm text-gray-500 mb-1">
                      Opening Hours
                    </div>
                    <p className="text-gray-700">{location.openingHours}</p>
                  </div>
                )}
              </div>

              {/* Live Status */}
              {status && location.sensor && (
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-semibold text-gray-900">
                      Live Status
                    </h2>
                    <span className="text-xs text-gray-400">
                      Updated:{' '}
                      {new Date(location.sensor.lastUpdated).toLocaleTimeString()}
                    </span>
                  </div>

                  <StatusBadge
                    noiseLevel={status.noiseLevel}
                    occupancyLevel={status.occupancyLevel}
                    size="lg"
                  />

                  <div className="grid md:grid-cols-2 gap-6 mt-6">
                    <div>
                      <div className="text-sm text-gray-500 mb-2">
                        <span>🔊 Noise Level</span>
                      </div>
                      <NoiseIndicator level={status.noisePercentage} />
                      <p className="text-xs text-gray-400 mt-2">
                        {status.noiseLevel === 'quiet'
                          ? 'Great for focused study'
                          : status.noiseLevel === 'moderate'
                          ? 'Some background noise'
                          : 'Quite noisy right now'}
                      </p>
                    </div>

                    <div>
                      <div className="flex justify-between text-sm text-gray-500 mb-2">
                        <span>👥 Occupancy</span>
                        <span className="font-medium">
                          {location.sensor.currentOccupancy}/{location.capacity}
                        </span>
                      </div>
                      <OccupancyIndicator
                        current={location.sensor.currentOccupancy}
                        capacity={location.capacity}
                      />
                      <p className="text-xs text-gray-400 mt-1">
                        {status.availableSeats} seats available
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Map preview placeholder */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">
                  Location
                </h2>
                <div className="aspect-video bg-gray-100 rounded-lg flex items-center justify-center">
                  <Link
                    href={`/map?location=${location.id}`}
                    className="text-primary-600 hover:text-primary-700"
                  >
                    View on Map →
                  </Link>
                </div>
                <p className="text-sm text-gray-500 mt-2">
                  Coordinates: {location.latitude.toFixed(4)},{' '}
                  {location.longitude.toFixed(4)}
                </p>
              </div>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Quick Actions */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">
                  Quick Actions
                </h2>
                <div className="space-y-3">
                  <Link href={`/map?location=${location.id}`} className="block">
                    <Button variant="secondary" className="w-full">
                      📍 View on Map
                    </Button>
                  </Link>
                  {location.website && (
                    <a
                      href={location.website}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <Button variant="secondary" className="w-full">
                        🌐 Visit Website
                      </Button>
                    </a>
                  )}
                </div>
              </div>

              {/* Create Study Plan */}
              {user && (
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                  <h2 className="text-lg font-semibold text-gray-900 mb-4">
                    Plan Study Session
                  </h2>
                  <CreatePlanForm locationId={location.id} />
                </div>
              )}

              {!user && (
                <div className="bg-primary-50 rounded-xl p-6 text-center">
                  <p className="text-primary-700 mb-4">
                    Sign in to save favorites and create study plans
                  </p>
                  <Link href="/login">
                    <Button>Sign In</Button>
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}
