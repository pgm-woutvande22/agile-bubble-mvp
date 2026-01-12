'use client'

import { useState, useEffect } from 'react'
import { LocationCard } from '@/components/ui/LocationCard'
import { LocationWithSensor } from '@/types'

interface LocationsListProps {
  initialLocations: LocationWithSensor[]
  initialFavoriteIds: string[]
  userId?: string
  refreshInterval?: number // in seconds
}

export function LocationsList({
  initialLocations,
  initialFavoriteIds,
  userId,
  refreshInterval = 30,
}: LocationsListProps) {
  const [locations, setLocations] = useState(initialLocations)
  const [favoriteIds, setFavoriteIds] = useState(initialFavoriteIds)
  const [lastUpdated, setLastUpdated] = useState(new Date())
  const [isRefreshing, setIsRefreshing] = useState(false)

  useEffect(() => {
    const refreshData = async () => {
      setIsRefreshing(true)
      try {
        // First, trigger sensor simulation to update values
        await fetch('/api/sensors/simulate', { method: 'POST' })
        
        // Then fetch the updated locations
        const res = await fetch('/api/locations')
        if (res.ok) {
          const data = await res.json()
          setLocations(data)
          setLastUpdated(new Date())
        }
      } catch (error) {
        console.error('Failed to refresh locations:', error)
      } finally {
        setIsRefreshing(false)
      }
    }

    // Set up interval for auto-refresh
    const interval = setInterval(refreshData, refreshInterval * 1000)

    return () => clearInterval(interval)
  }, [refreshInterval])

  const handleFavoriteToggle = (locationId: string, isFavorite: boolean) => {
    if (isFavorite) {
      setFavoriteIds((prev) => [...prev, locationId])
    } else {
      setFavoriteIds((prev) => prev.filter((id) => id !== locationId))
    }
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <p className="text-sm text-gray-500">
          {locations.length} locations available
        </p>
        <p className="text-xs text-gray-400 flex items-center gap-2">
          {isRefreshing && (
            <span className="inline-block w-3 h-3 border-2 border-primary-500 border-t-transparent rounded-full animate-spin"></span>
          )}
          🔄 Auto-updates every {refreshInterval}s • Last: {lastUpdated.toLocaleTimeString()}
        </p>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {locations.map((location) => (
          <LocationCard
            key={location.id}
            location={location}
            isFavorite={favoriteIds.includes(location.id)}
            showFavoriteButton={!!userId}
            onFavoriteToggle={handleFavoriteToggle}
          />
        ))}
      </div>

      {locations.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-500">No locations found. Check back later!</p>
        </div>
      )}
    </div>
  )
}
