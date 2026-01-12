import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Navbar } from '@/components/layout/Navbar'
import prisma from '@/lib/prisma'
import { getCurrentUser } from '@/lib/session'
import { Role } from '@prisma/client'

async function getAdminStats() {
  const [
    locationsCount,
    usersCount,
    plansCount,
    favoritesCount,
    sensorsCount,
    recentSyncLogs,
  ] = await Promise.all([
    prisma.location.count(),
    prisma.user.count(),
    prisma.studyPlan.count(),
    prisma.favorite.count(),
    prisma.sensor.count(),
    prisma.syncLog.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
    }),
  ])

  return {
    locations: locationsCount,
    users: usersCount,
    plans: plansCount,
    favorites: favoritesCount,
    sensors: sensorsCount,
    syncLogs: recentSyncLogs,
  }
}

export default async function AdminPage() {
  const user = await getCurrentUser()

  if (!user || user.role !== Role.ADMIN) {
    redirect('/login')
  }

  const stats = await getAdminStats()

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
          <p className="text-gray-500 mt-1">
            Manage locations, sensors, and view statistics
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
            <div className="text-2xl font-bold text-primary-600">
              {stats.locations}
            </div>
            <div className="text-gray-500 text-sm">Locations</div>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
            <div className="text-2xl font-bold text-green-600">
              {stats.sensors}
            </div>
            <div className="text-gray-500 text-sm">Sensors</div>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
            <div className="text-2xl font-bold text-blue-600">{stats.users}</div>
            <div className="text-gray-500 text-sm">Users</div>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
            <div className="text-2xl font-bold text-purple-600">
              {stats.plans}
            </div>
            <div className="text-gray-500 text-sm">Study Plans</div>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
            <div className="text-2xl font-bold text-pink-600">
              {stats.favorites}
            </div>
            <div className="text-gray-500 text-sm">Favorites</div>
          </div>
        </div>

        {/* Admin Actions */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          <Link
            href="/admin/locations"
            className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md hover:border-primary-200 transition-all"
          >
            <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center mb-4">
              <span className="text-2xl">📍</span>
            </div>
            <h3 className="font-semibold text-gray-900 text-lg mb-2">
              Manage Locations
            </h3>
            <p className="text-gray-500 text-sm">
              Add, edit, or delete study locations. View and manage all
              registered spots.
            </p>
          </Link>

          <Link
            href="/admin/sensors"
            className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md hover:border-primary-200 transition-all"
          >
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4">
              <span className="text-2xl">📊</span>
            </div>
            <h3 className="font-semibold text-gray-900 text-lg mb-2">
              Manage Sensors
            </h3>
            <p className="text-gray-500 text-sm">
              View live sensor data, override values for testing, and add new
              sensors.
            </p>
          </Link>

          <Link
            href="/admin/users"
            className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md hover:border-primary-200 transition-all"
          >
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
              <span className="text-2xl">👥</span>
            </div>
            <h3 className="font-semibold text-gray-900 text-lg mb-2">
              Manage Users
            </h3>
            <p className="text-gray-500 text-sm">
              View registered users, manage roles, and review activity.
            </p>
          </Link>
        </div>

        {/* Recent Sync Logs */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Recent Sync Logs
          </h2>
          {stats.syncLogs.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-100">
                    <th className="text-left py-2 px-3 text-sm font-medium text-gray-500">
                      Type
                    </th>
                    <th className="text-left py-2 px-3 text-sm font-medium text-gray-500">
                      Status
                    </th>
                    <th className="text-left py-2 px-3 text-sm font-medium text-gray-500">
                      Records
                    </th>
                    <th className="text-left py-2 px-3 text-sm font-medium text-gray-500">
                      Message
                    </th>
                    <th className="text-left py-2 px-3 text-sm font-medium text-gray-500">
                      Time
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {stats.syncLogs.map((log) => (
                    <tr key={log.id} className="border-b border-gray-50">
                      <td className="py-3 px-3 text-sm text-gray-900">
                        {log.syncType}
                      </td>
                      <td className="py-3 px-3">
                        <span
                          className={`text-xs px-2 py-1 rounded-full ${
                            log.status === 'success'
                              ? 'bg-green-100 text-green-700'
                              : 'bg-red-100 text-red-700'
                          }`}
                        >
                          {log.status}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-sm text-gray-600">
                        {log.recordCount}
                      </td>
                      <td className="py-3 px-3 text-sm text-gray-600">
                        {log.message || '-'}
                      </td>
                      <td className="py-3 px-3 text-sm text-gray-500">
                        {new Date(log.createdAt).toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-gray-500 text-center py-4">No sync logs yet</p>
          )}
        </div>
      </main>
    </div>
  )
}
