'use client'

import Link from 'next/link'
import { LocationWithSensor, getLocationStatus } from '@/types'
import { StatusBadge, NoiseIndicator, OccupancyIndicator } from './StatusBadge'
import { useSession } from 'next-auth/react'
import { useState } from 'react'

interface LocationCardProps {
  location: LocationWithSensor
  showFavoriteButton?: boolean
  isFavorite?: boolean
  onFavoriteToggle?: (locationId: string, isFavorite: boolean) => void
}

export function LocationCard({
  location,
  showFavoriteButton = true,
  isFavorite = false,
  onFavoriteToggle,
}: LocationCardProps) {
  const { data: session } = useSession()
  const [favoriteLoading, setFavoriteLoading] = useState(false)

  const status = location.sensor
    ? getLocationStatus(location.sensor, location.capacity)
    : null

  const handleFavoriteClick = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()

    if (!session || favoriteLoading) return

    setFavoriteLoading(true)
    try {
      if (isFavorite) {
        await fetch(`/api/favorites?locationId=${location.id}`, {
          method: 'DELETE',
        })
      } else {
        await fetch('/api/favorites', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ locationId: location.id }),
        })
      }
      onFavoriteToggle?.(location.id, !isFavorite)
    } catch (error) {
      console.error('Failed to toggle favorite:', error)
    } finally {
      setFavoriteLoading(false)
    }
  }

  return (
    <Link href={`/locations/${location.id}`}>
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 hover:shadow-md hover:border-primary-100 transition-all duration-200 h-full">
        <div className="flex justify-between items-start mb-3">
          <div className="flex-1">
            <h3 className="font-semibold text-gray-900 text-lg mb-1 line-clamp-1">
              {location.name}
            </h3>
            <p className="text-gray-500 text-sm line-clamp-1">{location.address}</p>
          </div>
          {showFavoriteButton && session && (
            <button
              onClick={handleFavoriteClick}
              disabled={favoriteLoading}
              className={`ml-3 p-2 rounded-full transition-colors ${
                isFavorite
                  ? 'text-red-500 hover:bg-red-50'
                  : 'text-gray-400 hover:bg-gray-50 hover:text-gray-600'
              }`}
            >
              {isFavorite ? (
                <svg
                  className="w-5 h-5"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z"
                    clipRule="evenodd"
                  />
                </svg>
              ) : (
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                  />
                </svg>
              )}
            </button>
          )}
        </div>

        {location.type && (
          <span className="inline-block bg-gray-100 text-gray-600 text-xs px-2 py-1 rounded-full mb-3">
            {location.type}
          </span>
        )}

        {status && (
          <div className="space-y-3">
            <StatusBadge
              noiseLevel={status.noiseLevel}
              occupancyLevel={status.occupancyLevel}
              size="sm"
            />

            <div className="space-y-2">
              <div>
                <div className="flex justify-between text-xs text-gray-500 mb-1">
                  <span>Noise Level</span>
                </div>
                <NoiseIndicator level={status.noisePercentage} />
              </div>

              <div>
                <div className="flex justify-between text-xs text-gray-500 mb-1">
                  <span>Occupancy</span>
                  <span>
                    {status.availableSeats} seats free
                  </span>
                </div>
                <OccupancyIndicator
                  current={location.sensor!.currentOccupancy}
                  capacity={location.capacity}
                />
              </div>
            </div>
          </div>
        )}

        <div className="mt-4 pt-3 border-t border-gray-50 flex justify-between items-center">
          <span className="text-xs text-gray-400">
            Capacity: {location.capacity}
          </span>
          <span className="text-primary-600 text-sm font-medium">
            View Details →
          </span>
        </div>
      </div>
    </Link>
  )
}
