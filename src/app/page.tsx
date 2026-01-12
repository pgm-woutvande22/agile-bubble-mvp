import Link from 'next/link'
import { Navbar } from '@/components/layout/Navbar'
import { Footer } from '@/components/layout/Footer'
import prisma from '@/lib/prisma'
import { getLocationStatus } from '@/types'

async function getStats() {
  const [locationsCount, usersCount, plansCount] = await Promise.all([
    prisma.location.count(),
    prisma.user.count(),
    prisma.studyPlan.count(),
  ])

  const locations = await prisma.location.findMany({
    include: { sensor: true },
    take: 6,
    orderBy: { name: 'asc' },
  })

  // Calculate available spots
  const availableSpots = locations.filter((loc) => {
    if (!loc.sensor) return false
    const status = getLocationStatus(loc.sensor, loc.capacity)
    return status.occupancyLevel !== 'full' && status.noiseLevel !== 'loud'
  }).length

  return {
    locations: locationsCount,
    users: usersCount,
    plans: plansCount,
    availableSpots,
    recentLocations: locations,
  }
}

export default async function HomePage() {
  const stats = await getStats()

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Navbar />

      {/* Hero Section */}
      <section className="bg-gradient-to-br from-primary-600 to-primary-800 text-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-6">
              Find Your Perfect Study Spot in Ghent
            </h1>
            <p className="text-xl text-primary-100 mb-8 max-w-2xl mx-auto">
              Real-time occupancy and noise levels for study spaces across the
              city. Plan your study sessions and never waste time again.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/locations"
                className="bg-white text-primary-700 px-8 py-3 rounded-lg font-semibold hover:bg-primary-50 transition-colors"
              >
                Browse Locations
              </Link>
              <Link
                href="/map"
                className="border-2 border-white text-white px-8 py-3 rounded-lg font-semibold hover:bg-white/10 transition-colors"
              >
                View Map
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-12 -mt-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white rounded-xl shadow-sm p-6 text-center">
              <div className="text-3xl font-bold text-primary-600 mb-1">
                {stats.locations}
              </div>
              <div className="text-gray-500 text-sm">Study Locations</div>
            </div>
            <div className="bg-white rounded-xl shadow-sm p-6 text-center">
              <div className="text-3xl font-bold text-green-600 mb-1">
                {stats.availableSpots}
              </div>
              <div className="text-gray-500 text-sm">Available Now</div>
            </div>
            <div className="bg-white rounded-xl shadow-sm p-6 text-center">
              <div className="text-3xl font-bold text-primary-600 mb-1">
                {stats.users}
              </div>
              <div className="text-gray-500 text-sm">Active Users</div>
            </div>
            <div className="bg-white rounded-xl shadow-sm p-6 text-center">
              <div className="text-3xl font-bold text-primary-600 mb-1">
                {stats.plans}
              </div>
              <div className="text-gray-500 text-sm">Study Plans</div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">
            Why Use Ghent Study Spots?
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-white rounded-xl p-6 shadow-sm">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4">
                <span className="text-2xl">🟢</span>
              </div>
              <h3 className="font-semibold text-gray-900 text-lg mb-2">
                Real-Time Status
              </h3>
              <p className="text-gray-500">
                See live noise levels and occupancy for every location. No more
                arriving to find a crowded, noisy space.
              </p>
            </div>
            <div className="bg-white rounded-xl p-6 shadow-sm">
              <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center mb-4">
                <span className="text-2xl">📍</span>
              </div>
              <h3 className="font-semibold text-gray-900 text-lg mb-2">
                Map Integration
              </h3>
              <p className="text-gray-500">
                Find the closest quiet spot with our interactive map. Filter by
                noise level and availability.
              </p>
            </div>
            <div className="bg-white rounded-xl p-6 shadow-sm">
              <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center mb-4">
                <span className="text-2xl">📅</span>
              </div>
              <h3 className="font-semibold text-gray-900 text-lg mb-2">
                Study Planning
              </h3>
              <p className="text-gray-500">
                Plan your study sessions and get smart recommendations based on
                availability and conditions.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Recent Locations */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-2xl font-bold text-gray-900">
              Popular Locations
            </h2>
            <Link
              href="/locations"
              className="text-primary-600 hover:text-primary-700 font-medium"
            >
              View All →
            </Link>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {stats.recentLocations.map((location) => {
              const status = location.sensor
                ? getLocationStatus(location.sensor, location.capacity)
                : null

              return (
                <Link
                  key={location.id}
                  href={`/locations/${location.id}`}
                  className="bg-gray-50 rounded-xl p-5 hover:shadow-md transition-shadow"
                >
                  <h3 className="font-semibold text-gray-900 mb-1">
                    {location.name}
                  </h3>
                  <p className="text-gray-500 text-sm mb-3">{location.address}</p>
                  {status && (
                    <div className="flex gap-2">
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
                          : '🔴'}{' '}
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
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-primary-600">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">
            Ready to Find Your Study Spot?
          </h2>
          <p className="text-primary-100 mb-8 max-w-xl mx-auto">
            Join thousands of students who save time finding the perfect place
            to study. Create an account to save favorites and plan sessions.
          </p>
          <Link
            href="/register"
            className="inline-block bg-white text-primary-700 px-8 py-3 rounded-lg font-semibold hover:bg-primary-50 transition-colors"
          >
            Get Started Free
          </Link>
        </div>
      </section>

      <Footer />
    </div>
  )
}
