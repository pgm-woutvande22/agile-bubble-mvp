import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Navbar } from '@/components/layout/Navbar'
import { Footer } from '@/components/layout/Footer'
import prisma from '@/lib/prisma'
import { getCurrentUser } from '@/lib/session'
import { getLocationStatus } from '@/types'

async function getDashboardData(userId: string) {
  const [favorites, upcomingPlans, recentPlans] = await Promise.all([
    prisma.favorite.findMany({
      where: { userId },
      include: {
        location: {
          include: { sensor: true },
        },
      },
      take: 4,
      orderBy: { createdAt: 'desc' },
    }),
    prisma.studyPlan.findMany({
      where: {
        userId,
        startTime: { gte: new Date() },
      },
      include: {
        location: {
          include: { sensor: true },
        },
      },
      take: 5,
      orderBy: { startTime: 'asc' },
    }),
    prisma.studyPlan.findMany({
      where: {
        userId,
        endTime: { lt: new Date() },
      },
      take: 3,
      orderBy: { endTime: 'desc' },
    }),
  ])

  const stats = await prisma.$transaction([
    prisma.favorite.count({ where: { userId } }),
    prisma.studyPlan.count({ where: { userId } }),
    prisma.studyPlan.count({
      where: {
        userId,
        startTime: { gte: new Date() },
      },
    }),
  ])

  return {
    favorites,
    upcomingPlans,
    recentPlans,
    stats: {
      totalFavorites: stats[0],
      totalPlans: stats[1],
      upcomingPlans: stats[2],
    },
  }
}

export default async function DashboardPage() {
  const user = await getCurrentUser()

  if (!user) {
    redirect('/login')
  }

  const data = await getDashboardData(user.id)

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Navbar />

      <main className="flex-1">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Welcome Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">
              Welcome back, {user.name}!
            </h1>
            <p className="text-gray-500 mt-1">
              Here's an overview of your study planning
            </p>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <div className="text-3xl font-bold text-primary-600 mb-1">
                {data.stats.totalFavorites}
              </div>
              <div className="text-gray-500 text-sm">Favorite Locations</div>
            </div>
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <div className="text-3xl font-bold text-green-600 mb-1">
                {data.stats.upcomingPlans}
              </div>
              <div className="text-gray-500 text-sm">Upcoming Sessions</div>
            </div>
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <div className="text-3xl font-bold text-gray-600 mb-1">
                {data.stats.totalPlans}
              </div>
              <div className="text-gray-500 text-sm">Total Study Plans</div>
            </div>
          </div>

          <div className="grid lg:grid-cols-2 gap-8">
            {/* Upcoming Plans */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-semibold text-gray-900">
                  Upcoming Sessions
                </h2>
                <Link
                  href="/plans"
                  className="text-primary-600 hover:text-primary-700 text-sm font-medium"
                >
                  View All →
                </Link>
              </div>

              {data.upcomingPlans.length > 0 ? (
                <div className="space-y-4">
                  {data.upcomingPlans.map((plan) => {
                    const status = plan.location.sensor
                      ? getLocationStatus(
                          plan.location.sensor,
                          plan.location.capacity
                        )
                      : null

                    return (
                      <div
                        key={plan.id}
                        className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
                      >
                        <div>
                          <div className="font-medium text-gray-900">
                            {plan.location.name}
                          </div>
                          <div className="text-sm text-gray-500">
                            {new Date(plan.startTime).toLocaleDateString('nl-BE', {
                              weekday: 'short',
                              month: 'short',
                              day: 'numeric',
                            })}{' '}
                            •{' '}
                            {new Date(plan.startTime).toLocaleTimeString('nl-BE', {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}{' '}
                            -{' '}
                            {new Date(plan.endTime).toLocaleTimeString('nl-BE', {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </div>
                        </div>
                        {status && (
                          <div className="flex gap-1">
                            <span
                              className={`text-xs px-2 py-1 rounded-full ${
                                status.noiseLevel === 'quiet'
                                  ? 'bg-green-100 text-green-700'
                                  : status.noiseLevel === 'moderate'
                                  ? 'bg-yellow-100 text-yellow-700'
                                  : 'bg-red-100 text-red-700'
                              }`}
                            >
                              {status.noiseLevel === 'quiet'
                                ? '🟢'
                                : status.noiseLevel === 'moderate'
                                ? '🟡'
                                : '🔴'}
                            </span>
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <p>No upcoming sessions</p>
                  <Link
                    href="/locations"
                    className="text-primary-600 hover:text-primary-700 text-sm mt-2 inline-block"
                  >
                    Browse locations to plan a session
                  </Link>
                </div>
              )}
            </div>

            {/* Favorites */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-semibold text-gray-900">
                  Favorite Locations
                </h2>
                <Link
                  href="/favorites"
                  className="text-primary-600 hover:text-primary-700 text-sm font-medium"
                >
                  View All →
                </Link>
              </div>

              {data.favorites.length > 0 ? (
                <div className="space-y-4">
                  {data.favorites.map((fav) => {
                    const status = fav.location.sensor
                      ? getLocationStatus(
                          fav.location.sensor,
                          fav.location.capacity
                        )
                      : null

                    return (
                      <Link
                        key={fav.id}
                        href={`/locations/${fav.location.id}`}
                        className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                      >
                        <div>
                          <div className="font-medium text-gray-900">
                            {fav.location.name}
                          </div>
                          <div className="text-sm text-gray-500">
                            {fav.location.address}
                          </div>
                        </div>
                        {status && (
                          <div className="flex gap-1.5">
                            <span
                              className={`text-xs px-2 py-1 rounded-full ${
                                status.noiseLevel === 'quiet'
                                  ? 'bg-green-100 text-green-700'
                                  : status.noiseLevel === 'moderate'
                                  ? 'bg-yellow-100 text-yellow-700'
                                  : 'bg-red-100 text-red-700'
                              }`}
                            >
                              {status.noiseLevel}
                            </span>
                            <span
                              className={`text-xs px-2 py-1 rounded-full ${
                                status.occupancyLevel === 'available'
                                  ? 'bg-green-100 text-green-700'
                                  : status.occupancyLevel === 'busy'
                                  ? 'bg-yellow-100 text-yellow-700'
                                  : 'bg-red-100 text-red-700'
                              }`}
                            >
                              {status.availableSeats} seats
                            </span>
                          </div>
                        )}
                      </Link>
                    )
                  })}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <p>No favorite locations yet</p>
                  <Link
                    href="/locations"
                    className="text-primary-600 hover:text-primary-700 text-sm mt-2 inline-block"
                  >
                    Explore locations
                  </Link>
                </div>
              )}
            </div>
          </div>

          {/* Quick Actions */}
          <div className="mt-8 bg-primary-50 rounded-xl p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Quick Actions
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Link
                href="/locations"
                className="bg-white rounded-lg p-4 text-center hover:shadow-md transition-shadow"
              >
                <span className="text-2xl mb-2 block">📍</span>
                <span className="text-sm font-medium text-gray-900">
                  Browse Locations
                </span>
              </Link>
              <Link
                href="/map"
                className="bg-white rounded-lg p-4 text-center hover:shadow-md transition-shadow"
              >
                <span className="text-2xl mb-2 block">🗺️</span>
                <span className="text-sm font-medium text-gray-900">
                  View Map
                </span>
              </Link>
              <Link
                href="/plans"
                className="bg-white rounded-lg p-4 text-center hover:shadow-md transition-shadow"
              >
                <span className="text-2xl mb-2 block">📅</span>
                <span className="text-sm font-medium text-gray-900">
                  My Plans
                </span>
              </Link>
              <Link
                href="/favorites"
                className="bg-white rounded-lg p-4 text-center hover:shadow-md transition-shadow"
              >
                <span className="text-2xl mb-2 block">❤️</span>
                <span className="text-sm font-medium text-gray-900">
                  Favorites
                </span>
              </Link>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}
