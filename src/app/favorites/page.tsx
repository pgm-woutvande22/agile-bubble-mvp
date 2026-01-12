import { redirect } from 'next/navigation'
import { Navbar } from '@/components/layout/Navbar'
import { Footer } from '@/components/layout/Footer'
import { LocationCard } from '@/components/ui/LocationCard'
import prisma from '@/lib/prisma'
import { getCurrentUser } from '@/lib/session'

async function getFavorites(userId: string) {
  return prisma.favorite.findMany({
    where: { userId },
    include: {
      location: {
        include: {
          sensor: true,
          _count: {
            select: { favorites: true, studyPlans: true },
          },
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  })
}

export default async function FavoritesPage() {
  const user = await getCurrentUser()

  if (!user) {
    redirect('/login')
  }

  const favorites = await getFavorites(user.id)

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Navbar />

      <main className="flex-1">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">
              My Favorite Locations
            </h1>
            <p className="text-gray-500 mt-1">
              {favorites.length} saved location{favorites.length !== 1 && 's'}
            </p>
          </div>

          {favorites.length > 0 ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {favorites.map((fav) => (
                <LocationCard
                  key={fav.id}
                  location={fav.location}
                  isFavorite={true}
                  showFavoriteButton={true}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-16 bg-white rounded-xl">
              <div className="text-4xl mb-4">💔</div>
              <h2 className="text-xl font-semibold text-gray-900 mb-2">
                No favorites yet
              </h2>
              <p className="text-gray-500 mb-6">
                Browse study locations and add your favorites for quick access
              </p>
              <a
                href="/locations"
                className="inline-block bg-primary-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-primary-700 transition-colors"
              >
                Explore Locations
              </a>
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  )
}
