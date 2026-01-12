'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import Link from 'next/link'
import { Navbar } from '@/components/layout/Navbar'
import { Button } from '@/components/ui/Button'
import { Input, Textarea } from '@/components/ui/Input'
import { Modal } from '@/components/ui/Modal'
import { LocationWithSensor, getLocationStatus } from '@/types'

export default function AdminLocationsPage() {
  const { data: session, status: sessionStatus } = useSession()
  const router = useRouter()
  const [locations, setLocations] = useState<LocationWithSensor[]>([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [editingLocation, setEditingLocation] = useState<LocationWithSensor | null>(
    null
  )
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [formLoading, setFormLoading] = useState(false)
  const [error, setError] = useState('')

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    address: '',
    latitude: '',
    longitude: '',
    capacity: '',
    description: '',
    type: '',
    website: '',
    openingHours: '',
    // Sensor credentials
    sensorDeviceId: '',
    sensorPort: '',
    sensorPassword: '',
  })

  useEffect(() => {
    if (sessionStatus === 'loading') return

    if (sessionStatus === 'unauthenticated' || session?.user?.role !== 'ADMIN') {
      router.push('/login')
    }
  }, [sessionStatus, session, router])

  useEffect(() => {
    async function fetchLocations() {
      try {
        const res = await fetch('/api/locations')
        if (res.ok) {
          setLocations(await res.json())
        }
      } catch (error) {
        console.error('Failed to fetch locations:', error)
      } finally {
        setLoading(false)
      }
    }

    if (sessionStatus === 'authenticated') {
      fetchLocations()
    }
  }, [sessionStatus])

  // Generate random sensor credentials
  const generateSensorCredentials = () => {
    const deviceId = `SNS-${Math.random().toString(36).substring(2, 8).toUpperCase()}`
    const port = Math.floor(Math.random() * 9000) + 1000
    const password = Math.random().toString(36).substring(2, 14)
    return { deviceId, port: port.toString(), password }
  }

  const openCreateModal = () => {
    setEditingLocation(null)
    const creds = generateSensorCredentials()
    setFormData({
      name: '',
      address: '',
      latitude: '51.0543',
      longitude: '3.7174',
      capacity: '50',
      description: '',
      type: '',
      website: '',
      openingHours: '',
      sensorDeviceId: creds.deviceId,
      sensorPort: creds.port,
      sensorPassword: creds.password,
    })
    setError('')
    setModalOpen(true)
  }

  const openEditModal = (location: LocationWithSensor) => {
    setEditingLocation(location)
    setFormData({
      name: location.name,
      address: location.address,
      latitude: location.latitude.toString(),
      longitude: location.longitude.toString(),
      capacity: location.capacity.toString(),
      description: location.description || '',
      type: location.type || '',
      website: location.website || '',
      openingHours: location.openingHours || '',
      sensorDeviceId: location.sensor?.deviceId || '',
      sensorPort: location.sensor?.port?.toString() || '',
      sensorPassword: location.sensor?.password || '',
    })
    setError('')
    setModalOpen(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setFormLoading(true)

    try {
      const payload = {
        name: formData.name,
        address: formData.address,
        latitude: parseFloat(formData.latitude),
        longitude: parseFloat(formData.longitude),
        capacity: parseInt(formData.capacity),
        description: formData.description || undefined,
        type: formData.type || undefined,
        website: formData.website || undefined,
        openingHours: formData.openingHours || undefined,
        // Sensor credentials
        sensor: {
          deviceId: formData.sensorDeviceId || undefined,
          port: formData.sensorPort ? parseInt(formData.sensorPort) : undefined,
          password: formData.sensorPassword || undefined,
        },
      }

      let res
      if (editingLocation) {
        res = await fetch(`/api/locations/${editingLocation.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        })
      } else {
        res = await fetch('/api/locations', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        })
      }

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to save location')
      }

      const savedLocation = await res.json()

      if (editingLocation) {
        setLocations(
          locations.map((l) => (l.id === savedLocation.id ? savedLocation : l))
        )
      } else {
        setLocations([...locations, savedLocation])
      }

      setModalOpen(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setFormLoading(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this location?')) return

    setDeletingId(id)
    try {
      const res = await fetch(`/api/locations/${id}`, { method: 'DELETE' })
      if (res.ok) {
        setLocations(locations.filter((l) => l.id !== id))
      }
    } catch (error) {
      console.error('Failed to delete location:', error)
    } finally {
      setDeletingId(null)
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
            <h1 className="text-3xl font-bold text-gray-900">
              Manage Locations
            </h1>
            <p className="text-gray-500 mt-1">{locations.length} locations</p>
          </div>
          <Button onClick={openCreateModal}>+ Add Location</Button>
        </div>

        {/* Locations Table */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">
                    Name
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">
                    Address
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">
                    Capacity
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">
                    Status
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {locations.map((location) => {
                  const status = location.sensor
                    ? getLocationStatus(location.sensor, location.capacity)
                    : null

                  return (
                    <tr
                      key={location.id}
                      className="border-t border-gray-100 hover:bg-gray-50"
                    >
                      <td className="py-3 px-4">
                        <div className="font-medium text-gray-900">
                          {location.name}
                        </div>
                        {location.type && (
                          <span className="text-xs text-gray-500">
                            {location.type}
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-600">
                        {location.address}
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-600">
                        {location.capacity}
                      </td>
                      <td className="py-3 px-4">
                        {status ? (
                          <div className="flex gap-1.5">
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
                              {status.availableSeats} free
                            </span>
                          </div>
                        ) : (
                          <span className="text-xs text-gray-400">
                            No sensor
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openEditModal(location)}
                          >
                            Edit
                          </Button>
                          <Button
                            variant="danger"
                            size="sm"
                            loading={deletingId === location.id}
                            onClick={() => handleDelete(location.id)}
                          >
                            Delete
                          </Button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Create/Edit Modal */}
        <Modal
          isOpen={modalOpen}
          onClose={() => setModalOpen(false)}
          title={editingLocation ? 'Edit Location' : 'Add New Location'}
          size="lg"
        >
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                {error}
              </div>
            )}

            <Input
              label="Name"
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              required
            />

            <Input
              label="Address"
              value={formData.address}
              onChange={(e) =>
                setFormData({ ...formData, address: e.target.value })
              }
              required
            />

            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Latitude"
                type="number"
                step="any"
                value={formData.latitude}
                onChange={(e) =>
                  setFormData({ ...formData, latitude: e.target.value })
                }
                required
              />
              <Input
                label="Longitude"
                type="number"
                step="any"
                value={formData.longitude}
                onChange={(e) =>
                  setFormData({ ...formData, longitude: e.target.value })
                }
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Capacity"
                type="number"
                value={formData.capacity}
                onChange={(e) =>
                  setFormData({ ...formData, capacity: e.target.value })
                }
                required
              />
              <Input
                label="Type"
                value={formData.type}
                onChange={(e) =>
                  setFormData({ ...formData, type: e.target.value })
                }
                placeholder="e.g., bibliotheek, studiezaal"
              />
            </div>

            <Textarea
              label="Description"
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              rows={2}
            />

            <Input
              label="Website"
              type="url"
              value={formData.website}
              onChange={(e) =>
                setFormData({ ...formData, website: e.target.value })
              }
            />

            <Input
              label="Opening Hours"
              value={formData.openingHours}
              onChange={(e) =>
                setFormData({ ...formData, openingHours: e.target.value })
              }
              placeholder="e.g., Mon-Fri 8:00-22:00"
            />

            {/* Sensor Configuration */}
            <div className="border-t border-gray-200 pt-4 mt-4">
              <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                📡 Sensor Configuration
                <span className="text-xs font-normal text-gray-400">(simulated)</span>
              </h3>
              
              <div className="grid grid-cols-3 gap-4">
                <Input
                  label="Device ID"
                  value={formData.sensorDeviceId}
                  onChange={(e) =>
                    setFormData({ ...formData, sensorDeviceId: e.target.value })
                  }
                  placeholder="SNS-XXXXXX"
                />
                <Input
                  label="Port"
                  type="number"
                  value={formData.sensorPort}
                  onChange={(e) =>
                    setFormData({ ...formData, sensorPort: e.target.value })
                  }
                  placeholder="8080"
                />
                <Input
                  label="Password / API Key"
                  type="password"
                  value={formData.sensorPassword}
                  onChange={(e) =>
                    setFormData({ ...formData, sensorPassword: e.target.value })
                  }
                  placeholder="••••••••"
                />
              </div>
              
              {!editingLocation && (
                <p className="text-xs text-gray-400 mt-2">
                  💡 Credentials are auto-generated for new locations. You can modify them if needed.
                </p>
              )}
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
                {editingLocation ? 'Save Changes' : 'Create Location'}
              </Button>
            </div>
          </form>
        </Modal>
      </main>
    </div>
  )
}
