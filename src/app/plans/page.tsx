'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Navbar } from '@/components/layout/Navbar'
import { Footer } from '@/components/layout/Footer'
import { Button } from '@/components/ui/Button'
import { getLocationStatus } from '@/types'
import { useSession } from 'next-auth/react'

interface StudyPlan {
  id: string
  startTime: string
  endTime: string
  notes: string | null
  location: {
    id: string
    name: string
    address: string
    capacity: number
    sensor: {
      currentNoiseLevel: number
      currentOccupancy: number
    } | null
  }
}

export default function PlansPage() {
  const { status: sessionStatus } = useSession()
  const router = useRouter()
  const [plans, setPlans] = useState<StudyPlan[]>([])
  const [loading, setLoading] = useState(true)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [filter, setFilter] = useState<'upcoming' | 'past' | 'all'>('upcoming')

  useEffect(() => {
    if (sessionStatus === 'unauthenticated') {
      router.push('/login')
    }
  }, [sessionStatus, router])

  useEffect(() => {
    async function fetchPlans() {
      try {
        const res = await fetch('/api/plans')
        if (res.ok) {
          const data = await res.json()
          setPlans(data)
        }
      } catch (error) {
        console.error('Failed to fetch plans:', error)
      } finally {
        setLoading(false)
      }
    }

    if (sessionStatus === 'authenticated') {
      fetchPlans()
    }
  }, [sessionStatus])

  const handleDelete = async (planId: string) => {
    if (!confirm('Are you sure you want to delete this study plan?')) return

    setDeletingId(planId)
    try {
      const res = await fetch(`/api/plans/${planId}`, {
        method: 'DELETE',
      })

      if (res.ok) {
        setPlans(plans.filter((p) => p.id !== planId))
      }
    } catch (error) {
      console.error('Failed to delete plan:', error)
    } finally {
      setDeletingId(null)
    }
  }

  const now = new Date()
  const filteredPlans = plans.filter((plan) => {
    const startTime = new Date(plan.startTime)
    if (filter === 'upcoming') return startTime >= now
    if (filter === 'past') return startTime < now
    return true
  })

  if (sessionStatus === 'loading' || loading) {
    return (
      <div className="min-h-screen flex flex-col bg-gray-50">
        <Navbar />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-gray-500">Loading...</div>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Navbar />

      <main className="flex-1">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                My Study Plans
              </h1>
              <p className="text-gray-500 mt-1">
                {filteredPlans.length} plan{filteredPlans.length !== 1 && 's'}
              </p>
            </div>

            <div className="flex items-center space-x-2">
              <button
                onClick={() => setFilter('upcoming')}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  filter === 'upcoming'
                    ? 'bg-primary-100 text-primary-700'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                Upcoming
              </button>
              <button
                onClick={() => setFilter('past')}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  filter === 'past'
                    ? 'bg-primary-100 text-primary-700'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                Past
              </button>
              <button
                onClick={() => setFilter('all')}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  filter === 'all'
                    ? 'bg-primary-100 text-primary-700'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                All
              </button>
            </div>
          </div>

          {filteredPlans.length > 0 ? (
            <div className="space-y-4">
              {filteredPlans.map((plan) => {
                const startTime = new Date(plan.startTime)
                const endTime = new Date(plan.endTime)
                const isPast = startTime < now
                const status = plan.location.sensor
                  ? getLocationStatus(plan.location.sensor, plan.location.capacity)
                  : null

                return (
                  <div
                    key={plan.id}
                    className={`bg-white rounded-xl shadow-sm border p-5 ${
                      isPast ? 'border-gray-200 opacity-75' : 'border-gray-100'
                    }`}
                  >
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3">
                          <Link
                            href={`/locations/${plan.location.id}`}
                            className="font-semibold text-gray-900 hover:text-primary-600"
                          >
                            {plan.location.name}
                          </Link>
                          {isPast && (
                            <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">
                              Completed
                            </span>
                          )}
                        </div>
                        <p className="text-gray-500 text-sm mt-1">
                          {plan.location.address}
                        </p>

                        <div className="flex items-center gap-4 mt-3">
                          <div className="text-sm">
                            <span className="text-gray-500">📅</span>{' '}
                            <span className="font-medium">
                              {startTime.toLocaleDateString('nl-BE', {
                                weekday: 'short',
                                month: 'short',
                                day: 'numeric',
                              })}
                            </span>
                          </div>
                          <div className="text-sm">
                            <span className="text-gray-500">🕐</span>{' '}
                            <span className="font-medium">
                              {startTime.toLocaleTimeString('nl-BE', {
                                hour: '2-digit',
                                minute: '2-digit',
                              })}{' '}
                              -{' '}
                              {endTime.toLocaleTimeString('nl-BE', {
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </span>
                          </div>
                        </div>

                        {plan.notes && (
                          <p className="text-gray-600 text-sm mt-2 bg-gray-50 p-2 rounded">
                            📝 {plan.notes}
                          </p>
                        )}
                      </div>

                      <div className="flex items-center gap-3">
                        {status && !isPast && (
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
                              {status.noiseLevel === 'quiet'
                                ? '🟢'
                                : status.noiseLevel === 'moderate'
                                ? '🟡'
                                : '🔴'}{' '}
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
                              {status.availableSeats} seats
                            </span>
                          </div>
                        )}

                        <Button
                          variant="danger"
                          size="sm"
                          loading={deletingId === plan.id}
                          onClick={() => handleDelete(plan.id)}
                        >
                          Delete
                        </Button>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="text-center py-16 bg-white rounded-xl">
              <div className="text-4xl mb-4">📅</div>
              <h2 className="text-xl font-semibold text-gray-900 mb-2">
                No {filter !== 'all' && filter} plans
              </h2>
              <p className="text-gray-500 mb-6">
                Browse study locations and create your first study plan
              </p>
              <Link
                href="/locations"
                className="inline-block bg-primary-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-primary-700 transition-colors"
              >
                Explore Locations
              </Link>
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  )
}
