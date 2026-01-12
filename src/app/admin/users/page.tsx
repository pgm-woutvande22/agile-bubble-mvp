import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Navbar } from '@/components/layout/Navbar'
import prisma from '@/lib/prisma'
import { getCurrentUser } from '@/lib/session'
import { Role } from '@prisma/client'

async function getUsers() {
  return prisma.user.findMany({
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      createdAt: true,
      _count: {
        select: {
          favorites: true,
          studyPlans: true,
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  })
}

export default async function AdminUsersPage() {
  const user = await getCurrentUser()

  if (!user || user.role !== Role.ADMIN) {
    redirect('/login')
  }

  const users = await getUsers()

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <nav className="mb-2">
            <Link
              href="/admin"
              className="text-primary-600 hover:text-primary-700 text-sm"
            >
              ← Back to Admin
            </Link>
          </nav>
          <h1 className="text-3xl font-bold text-gray-900">Manage Users</h1>
          <p className="text-gray-500 mt-1">{users.length} registered users</p>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">
                    User
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">
                    Role
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">
                    Favorites
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">
                    Plans
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">
                    Registered
                  </th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr
                    key={user.id}
                    className="border-t border-gray-100 hover:bg-gray-50"
                  >
                    <td className="py-3 px-4">
                      <div className="font-medium text-gray-900">{user.name}</div>
                      <div className="text-sm text-gray-500">{user.email}</div>
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`text-xs px-2 py-1 rounded-full ${
                          user.role === Role.ADMIN
                            ? 'bg-purple-100 text-purple-700'
                            : 'bg-gray-100 text-gray-600'
                        }`}
                      >
                        {user.role}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-600">
                      {user._count.favorites}
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-600">
                      {user._count.studyPlans}
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-500">
                      {new Date(user.createdAt).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  )
}
