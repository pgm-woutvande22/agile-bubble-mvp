import { Location, Sensor } from '@prisma/client'

export interface LocationWithSensor extends Location {
  sensor: Sensor | null
  _count?: {
    favorites: number
    studyPlans: number
  }
}

export interface GhentApiRecord {
  naam: string
  straat: string
  huisnummer: string
  postcode: string
  gemeente: string
  capaciteit: number
  type: string
  website: string
  openingsuren: string
  geo_punt: {
    lat: number
    lon: number
  }
  recordid: string
}

export interface GhentApiResponse {
  total_count: number
  results: GhentApiRecord[]
}

export type NoiseLevel = 'quiet' | 'moderate' | 'loud'
export type OccupancyLevel = 'available' | 'busy' | 'full'

export interface LocationStatus {
  noiseLevel: NoiseLevel
  occupancyLevel: OccupancyLevel
  noisePercentage: number
  occupancyPercentage: number
  availableSeats: number
}

export function getNoiseLevel(noise: number): NoiseLevel {
  if (noise <= 40) return 'quiet'
  if (noise <= 70) return 'moderate'
  return 'loud'
}

export function getOccupancyLevel(occupancy: number, capacity: number): OccupancyLevel {
  const percentage = (occupancy / capacity) * 100
  if (percentage <= 60) return 'available'
  if (percentage <= 90) return 'busy'
  return 'full'
}

export function getLocationStatus(
  sensor: { currentNoiseLevel: number; currentOccupancy: number },
  capacity: number
): LocationStatus {
  const noiseLevel = getNoiseLevel(sensor.currentNoiseLevel)
  const occupancyLevel = getOccupancyLevel(sensor.currentOccupancy, capacity)
  const occupancyPercentage = Math.round((sensor.currentOccupancy / capacity) * 100)
  const availableSeats = Math.max(0, capacity - sensor.currentOccupancy)

  return {
    noiseLevel,
    occupancyLevel,
    noisePercentage: sensor.currentNoiseLevel,
    occupancyPercentage,
    availableSeats,
  }
}

export function getStatusColor(noiseLevel: NoiseLevel, occupancyLevel: OccupancyLevel): string {
  if (noiseLevel === 'loud' || occupancyLevel === 'full') return 'red'
  if (noiseLevel === 'moderate' || occupancyLevel === 'busy') return 'yellow'
  return 'green'
}
