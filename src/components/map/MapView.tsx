'use client'

import { useEffect, useRef, useState } from 'react'
import type L from 'leaflet'
import { LocationWithSensor, getLocationStatus, getStatusColor } from '@/types'

interface MapViewProps {
  locations: LocationWithSensor[]
  selectedLocation?: string
  onLocationSelect?: (locationId: string) => void
  height?: string
}

export function MapView({
  locations,
  selectedLocation,
  onLocationSelect,
  height = '500px',
}: MapViewProps) {
  const mapRef = useRef<L.Map | null>(null)
  const markersRef = useRef<{ [key: string]: L.Marker }>({})
  const containerRef = useRef<HTMLDivElement>(null)
  const [isClient, setIsClient] = useState(false)
  const [leaflet, setLeaflet] = useState<typeof L | null>(null)

  useEffect(() => {
    setIsClient(true)
    // Dynamically import leaflet only on client
    import('leaflet').then((L) => {
      setLeaflet(L.default)
    })
  }, [])

  useEffect(() => {
    if (!isClient || !containerRef.current || mapRef.current || !leaflet) return

    // Initialize map centered on Ghent
    mapRef.current = leaflet.map(containerRef.current).setView([51.0543, 3.7174], 13)

    leaflet.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(mapRef.current)

    return () => {
      if (mapRef.current) {
        mapRef.current.remove()
        mapRef.current = null
      }
    }
  }, [isClient, leaflet])

  useEffect(() => {
    if (!mapRef.current || !isClient || !leaflet) return

    // Clear existing markers
    Object.values(markersRef.current).forEach((marker) => marker.remove())
    markersRef.current = {}

    // Add markers for each location
    locations.forEach((location) => {
      const status = location.sensor
        ? getLocationStatus(location.sensor, location.capacity)
        : null

      const color = status
        ? getStatusColor(status.noiseLevel, status.occupancyLevel)
        : 'gray'

      // Create custom icon
      const icon = leaflet.divIcon({
        className: 'custom-marker',
        html: `
          <div style="
            background-color: ${color === 'green' ? '#22c55e' : color === 'yellow' ? '#eab308' : color === 'red' ? '#ef4444' : '#9ca3af'};
            width: 24px;
            height: 24px;
            border-radius: 50%;
            border: 3px solid white;
            box-shadow: 0 2px 4px rgba(0,0,0,0.3);
            ${selectedLocation === location.id ? 'transform: scale(1.3);' : ''}
          "></div>
        `,
        iconSize: [24, 24],
        iconAnchor: [12, 12],
      })

      const marker = leaflet.marker([location.latitude, location.longitude], { icon })
        .addTo(mapRef.current!)
        .bindPopup(`
          <div style="min-width: 200px;">
            <h3 style="font-weight: 600; margin-bottom: 4px;">${location.name}</h3>
            <p style="color: #6b7280; font-size: 12px; margin-bottom: 8px;">${location.address}</p>
            ${
              status
                ? `
              <div style="display: flex; gap: 8px; margin-bottom: 8px;">
                <span style="
                  padding: 2px 8px;
                  border-radius: 9999px;
                  font-size: 11px;
                  background-color: ${status.noiseLevel === 'quiet' ? '#dcfce7' : status.noiseLevel === 'moderate' ? '#fef9c3' : '#fecaca'};
                  color: ${status.noiseLevel === 'quiet' ? '#166534' : status.noiseLevel === 'moderate' ? '#854d0e' : '#991b1b'};
                ">
                  ${status.noiseLevel === 'quiet' ? '🟢' : status.noiseLevel === 'moderate' ? '🟡' : '🔴'} ${status.noiseLevel}
                </span>
                <span style="
                  padding: 2px 8px;
                  border-radius: 9999px;
                  font-size: 11px;
                  background-color: ${status.occupancyLevel === 'available' ? '#dcfce7' : status.occupancyLevel === 'busy' ? '#fef9c3' : '#fecaca'};
                  color: ${status.occupancyLevel === 'available' ? '#166534' : status.occupancyLevel === 'busy' ? '#854d0e' : '#991b1b'};
                ">
                  ${status.occupancyLevel === 'available' ? '🟢' : status.occupancyLevel === 'busy' ? '🟡' : '🔴'} ${status.availableSeats} seats
                </span>
              </div>
            `
                : ''
            }
            <a href="/locations/${location.id}" style="color: #2563eb; font-size: 12px; text-decoration: none;">View Details →</a>
          </div>
        `)

      marker.on('click', () => {
        onLocationSelect?.(location.id)
      })

      markersRef.current[location.id] = marker
    })
  }, [locations, selectedLocation, onLocationSelect, isClient, leaflet])

  // Center on selected location
  useEffect(() => {
    if (!mapRef.current || !selectedLocation) return

    const marker = markersRef.current[selectedLocation]
    if (marker) {
      const latlng = marker.getLatLng()
      mapRef.current.setView(latlng, 15)
      marker.openPopup()
    }
  }, [selectedLocation])

  if (!isClient) {
    return (
      <div
        style={{ height }}
        className="bg-gray-100 rounded-xl flex items-center justify-center"
      >
        <div className="text-gray-500">Loading map...</div>
      </div>
    )
  }

  return (
    <div
      ref={containerRef}
      style={{ height }}
      className="rounded-xl overflow-hidden z-0"
    />
  )
}
