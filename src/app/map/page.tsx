'use client'

import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { Navbar } from '@/components/layout/Navbar'
import { MapView } from '@/components/map/MapView'
import { LocationWithSensor, getLocationStatus } from '@/types'

export default function MapPage() {
  const searchParams = useSearchParams()
  const selectedId = searchParams.get('location')
  
  const [locations, setLocations] = useState<LocationWithSensor[]>([])
  const [selectedLocation, setSelectedLocation] = useState<string | undefined>(
    selectedId || undefined
  )
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'quiet' | 'available'>('all')

  useEffect(() => {
    async function fetchLocations() {
      try {
        const res = await fetch('/api/locations')
        const data = await res.json()
        setLocations(data)
      } catch (error) {
        console.error('Failed to fetch locations:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchLocations()

    // Refresh every 30 seconds
    const interval = setInterval(fetchLocations, 30000)
    return () => clearInterval(interval)
  }, [])

  const filteredLocations = locations.filter((loc) => {
    if (!loc.sensor) return filter === 'all'
    const status = getLocationStatus(loc.sensor, loc.capacity)

    if (filter === 'quiet') {
      return status.noiseLevel === 'quiet'
    }
    if (filter === 'available') {
      return status.occupancyLevel !== 'full'
    }
    return true
  })

  const selectedLocationData = locations.find((l) => l.id === selectedLocation)

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Navbar />

      <main className="flex-1 flex flex-col">
        {/* Filter bar */}
        <div className="bg-white border-b border-gray-100 px-4 py-3">
          <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-500">Filter:</span>
              <button
                onClick={() => setFilter('all')}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  filter === 'all'
                    ? 'bg-primary-100 text-primary-700'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                All ({locations.length})
              </button>
              <button
                onClick={() => setFilter('quiet')}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  filter === 'quiet'
                    ? 'bg-green-100 text-green-700'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                🟢 Quiet
              </button>
              <button
                onClick={() => setFilter('available')}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  filter === 'available'
                    ? 'bg-blue-100 text-blue-700'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                Seats Available
              </button>
            </div>

            <div className="text-sm text-gray-500">
              Showing {filteredLocations.length} locations
            </div>
          </div>
        </div>

        {/* Map and sidebar */}
        <div className="flex-1 flex">
          {/* Sidebar */}
          <div className="w-80 bg-white border-r border-gray-100 overflow-y-auto hidden lg:block">
            <div className="p-4">
              <h2 className="font-semibold text-gray-900 mb-4">Locations</h2>
              <div className="space-y-3">
                {filteredLocations.map((location) => {
                  const status = location.sensor
                    ? getLocationStatus(location.sensor, location.capacity)
                    : null

                  return (
                    <button
                      key={location.id}
                      onClick={() => setSelectedLocation(location.id)}
                      className={`w-full text-left p-3 rounded-lg transition-colors ${
                        selectedLocation === location.id
                          ? 'bg-primary-50 border-primary-200 border'
                          : 'bg-gray-50 hover:bg-gray-100 border border-transparent'
                      }`}
                    >
                      <div className="font-medium text-gray-900 text-sm mb-1 line-clamp-1">
                        {location.name}
                      </div>
                      <div className="text-gray-500 text-xs mb-2 line-clamp-1">
                        {location.address}
                      </div>
                      {status && (
                        <div className="flex gap-1.5">
                          <span
                            className={`text-xs px-1.5 py-0.5 rounded-full ${
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
                          <span
                            className={`text-xs px-1.5 py-0.5 rounded-full ${
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
                    </button>
                  )
                })}
              </div>
            </div>
          </div>

          {/* Map */}
          <div className="flex-1 relative">
            {loading ? (
              <div className="h-full flex items-center justify-center bg-gray-100">
                <div className="text-gray-500">Loading map...</div>
              </div>
            ) : (
              <MapView
                locations={filteredLocations}
                selectedLocation={selectedLocation}
                onLocationSelect={setSelectedLocation}
                height="100%"
              />
            )}

            {/* Selected location info card */}
            {selectedLocationData && (
              <div className="absolute bottom-4 left-4 right-4 lg:left-auto lg:right-4 lg:w-80 bg-white rounded-xl shadow-lg p-4 z-10">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-semibold text-gray-900">
                      {selectedLocationData.name}
                    </h3>
                    <p className="text-gray-500 text-sm">
                      {selectedLocationData.address}
                    </p>
                  </div>
                  <button
                    onClick={() => setSelectedLocation(undefined)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    ✕
                  </button>
                </div>
                {selectedLocationData.sensor && (
                  <div className="flex gap-2 mt-3">
                    {(() => {
                      const status = getLocationStatus(
                        selectedLocationData.sensor!,
                        selectedLocationData.capacity
                      )
                      return (
                        <>
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
                            {status.availableSeats} seats available
                          </span>
                        </>
                      )
                    })()}
                  </div>
                )}
                <a
                  href={`/locations/${selectedLocationData.id}`}
                  className="block mt-3 text-center bg-primary-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-primary-700 transition-colors"
                >
                  View Details
                </a>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}
