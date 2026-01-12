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
  const userMarkerRef = useRef<L.Marker | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const [isClient, setIsClient] = useState(false)
  const [leaflet, setLeaflet] = useState<typeof L | null>(null)
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null)

  useEffect(() => {
    setIsClient(true)
    // Dynamically import leaflet only on client
    import('leaflet').then((L) => {
      setLeaflet(L.default)
    })

    // Get user's current location
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          })
        },
        (error) => {
          console.log('Geolocation error:', error.message)
        },
        { enableHighAccuracy: true }
      )
    }
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

  // Add user location marker
  useEffect(() => {
    if (!mapRef.current || !leaflet || !userLocation) return

    // Remove existing user marker
    if (userMarkerRef.current) {
      userMarkerRef.current.remove()
    }

    // Create user location icon (blue pulsing dot)
    const userIcon = leaflet.divIcon({
      className: 'user-location-marker',
      html: `
        <div style="position: relative;">
          <div style="
            background-color: #3b82f6;
            width: 16px;
            height: 16px;
            border-radius: 50%;
            border: 3px solid white;
            box-shadow: 0 2px 8px rgba(59, 130, 246, 0.5);
          "></div>
          <div style="
            position: absolute;
            top: -8px;
            left: -8px;
            width: 32px;
            height: 32px;
            border-radius: 50%;
            background-color: rgba(59, 130, 246, 0.2);
            animation: pulse 2s infinite;
          "></div>
        </div>
        <style>
          @keyframes pulse {
            0% { transform: scale(1); opacity: 1; }
            100% { transform: scale(2); opacity: 0; }
          }
        </style>
      `,
      iconSize: [16, 16],
      iconAnchor: [8, 8],
    })

    userMarkerRef.current = leaflet
      .marker([userLocation.lat, userLocation.lng], { icon: userIcon })
      .addTo(mapRef.current)
      .bindPopup('<strong>📍 You are here</strong>')

  }, [userLocation, leaflet])

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
