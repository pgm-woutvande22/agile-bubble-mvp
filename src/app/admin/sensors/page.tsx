'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import Link from 'next/link'
import { Navbar } from '@/components/layout/Navbar'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Modal } from '@/components/ui/Modal'
import { NoiseIndicator, OccupancyIndicator } from '@/components/ui/StatusBadge'

interface SensorWithLocation {
  id: string
  locationId: string
  deviceId: string | null
  port: number | null
  password: string | null
  currentNoiseLevel: number
  currentOccupancy: number
  lastUpdated: string
  isManualOverride: boolean
  location: {
    id: string
    name: string
    address: string
    capacity: number
  }
}

export default function AdminSensorsPage() {
  const { data: session, status: sessionStatus } = useSession()
  const router = useRouter()
  const [sensors, setSensors] = useState<SensorWithLocation[]>([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [editingSensor, setEditingSensor] = useState<SensorWithLocation | null>(
    null
  )
  const [formLoading, setFormLoading] = useState(false)
  const [error, setError] = useState('')

  const [formData, setFormData] = useState({
    noiseLevel: '',
    occupancy: '',
    isManualOverride: false,
  })

  useEffect(() => {
    if (sessionStatus === 'loading') return

    if (sessionStatus === 'unauthenticated' || session?.user?.role !== 'ADMIN') {
      router.push('/login')
    }
  }, [sessionStatus, session, router])

  const fetchSensors = async () => {
    try {
      const res = await fetch('/api/sensors')
      if (res.ok) {
        setSensors(await res.json())
      }
    } catch (error) {
      console.error('Failed to fetch sensors:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (sessionStatus === 'authenticated') {
      fetchSensors()

      // Auto-refresh every 10 seconds
      const interval = setInterval(fetchSensors, 10000)
      return () => clearInterval(interval)
    }
  }, [sessionStatus])

  const openEditModal = (sensor: SensorWithLocation) => {
    setEditingSensor(sensor)
    setFormData({
      noiseLevel: sensor.currentNoiseLevel.toString(),
      occupancy: sensor.currentOccupancy.toString(),
      isManualOverride: sensor.isManualOverride,
    })
    setError('')
    setModalOpen(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingSensor) return

    setError('')
    setFormLoading(true)

    try {
      const res = await fetch(`/api/sensors/${editingSensor.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentNoiseLevel: parseInt(formData.noiseLevel),
          currentOccupancy: parseInt(formData.occupancy),
          isManualOverride: formData.isManualOverride,
        }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to update sensor')
      }

      const updatedSensor = await res.json()
      setSensors(
        sensors.map((s) => (s.id === updatedSensor.id ? updatedSensor : s))
      )
      setModalOpen(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setFormLoading(false)
    }
  }

  const toggleOverride = async (sensor: SensorWithLocation) => {
    try {
      const res = await fetch(`/api/sensors/${sensor.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          isManualOverride: !sensor.isManualOverride,
        }),
      })

      if (res.ok) {
        const updated = await res.json()
        setSensors(sensors.map((s) => (s.id === updated.id ? updated : s)))
      }
    } catch (error) {
      console.error('Failed to toggle override:', error)
    }
  }

  if (sessionStatus === 'loading' || loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-gray-500">Loading...</div>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <nav className="mb-2">
              <Link
                href="/admin"
                className="text-primary-600 hover:text-primary-700 text-sm"
              >
                ← Back to Admin
              </Link>
            </nav>
            <h1 className="text-3xl font-bold text-gray-900">Manage Sensors</h1>
            <p className="text-gray-500 mt-1">
              {sensors.length} sensors • Auto-refreshes every 10 seconds
            </p>
          </div>
        </div>

        {/* Sensors Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {sensors.map((sensor) => (
            <div
              key={sensor.id}
              className={`bg-white rounded-xl shadow-sm border p-5 ${
                sensor.isManualOverride ? 'border-yellow-300' : 'border-gray-100'
              }`}
            >
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="font-semibold text-gray-900">
                    {sensor.location.name}
                  </h3>
                  <p className="text-sm text-gray-500">
                    {sensor.location.address}
                  </p>
                </div>
                {sensor.isManualOverride && (
                  <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-1 rounded-full">
                    Override
                  </span>
                )}
              </div>

              {/* Sensor Credentials */}
              <div className="bg-gray-50 rounded-lg p-3 mb-4 text-xs">
                <div className="flex items-center gap-1 text-gray-500 mb-1">
                  📡 <span className="font-medium">Sensor Info</span>
                </div>
                <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-gray-600">
                  <span>Device ID:</span>
                  <span className="font-mono">{sensor.deviceId || 'N/A'}</span>
                  <span>Port:</span>
                  <span className="font-mono">{sensor.port || 'N/A'}</span>
                  <span>API Key:</span>
                  <span className="font-mono">{sensor.password ? '••••••••' : 'N/A'}</span>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <div className="text-sm text-gray-500 mb-1">
                    <span>🔊 Noise Level</span>
                  </div>
                  <NoiseIndicator level={sensor.currentNoiseLevel} />
                </div>

                <div>
                  <div className="flex justify-between text-sm text-gray-500 mb-1">
                    <span>👥 Occupancy</span>
                    <span className="font-medium">
                      {sensor.currentOccupancy}/{sensor.location.capacity}
                    </span>
                  </div>
                  <OccupancyIndicator
                    current={sensor.currentOccupancy}
                    capacity={sensor.location.capacity}
                  />
                </div>
              </div>

              <div className="mt-4 pt-4 border-t border-gray-100">
                <p className="text-xs text-gray-400 mb-3">
                  Last updated:{' '}
                  {new Date(sensor.lastUpdated).toLocaleTimeString()}
                </p>

                <div className="flex gap-2">
                  <Button
                    variant="secondary"
                    size="sm"
                    className="flex-1"
                    onClick={() => openEditModal(sensor)}
                  >
                    Edit Values
                  </Button>
                  <Button
                    variant={sensor.isManualOverride ? 'danger' : 'ghost'}
                    size="sm"
                    onClick={() => toggleOverride(sensor)}
                  >
                    {sensor.isManualOverride ? 'Release' : 'Lock'}
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {sensors.length === 0 && (
          <div className="text-center py-12 bg-white rounded-xl">
            <p className="text-gray-500">No sensors found</p>
          </div>
        )}

        {/* Edit Modal */}
        <Modal
          isOpen={modalOpen}
          onClose={() => setModalOpen(false)}
          title={`Edit Sensor: ${editingSensor?.location.name}`}
        >
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                {error}
              </div>
            )}

            <Input
              label="Noise Level (0-100)"
              type="number"
              min="0"
              max="100"
              value={formData.noiseLevel}
              onChange={(e) =>
                setFormData({ ...formData, noiseLevel: e.target.value })
              }
              required
            />

            <Input
              label={`Occupancy (max: ${editingSensor?.location.capacity})`}
              type="number"
              min="0"
              max={editingSensor?.location.capacity}
              value={formData.occupancy}
              onChange={(e) =>
                setFormData({ ...formData, occupancy: e.target.value })
              }
              required
            />

            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="override"
                checked={formData.isManualOverride}
                onChange={(e) =>
                  setFormData({ ...formData, isManualOverride: e.target.checked })
                }
                className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
              />
              <label htmlFor="override" className="text-sm text-gray-700">
                Lock values (prevent automatic simulation updates)
              </label>
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <Button
                type="button"
                variant="secondary"
                onClick={() => setModalOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit" loading={formLoading}>
                Save Changes
              </Button>
            </div>
          </form>
        </Modal>
      </main>
    </div>
  )
}
