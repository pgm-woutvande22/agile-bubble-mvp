'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/Button'
import { Input, Textarea } from '@/components/ui/Input'

interface CreatePlanFormProps {
  locationId: string
}

export function CreatePlanForm({ locationId }: CreatePlanFormProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [warnings, setWarnings] = useState<string[]>([])
  const [alternatives, setAlternatives] = useState<any[]>([])

  const [date, setDate] = useState('')
  const [startTime, setStartTime] = useState('')
  const [endTime, setEndTime] = useState('')
  const [notes, setNotes] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setWarnings([])
    setAlternatives([])
    setSuccess(false)

    if (!date || !startTime || !endTime) {
      setError('Please fill in all required fields')
      return
    }

    const startDateTime = new Date(`${date}T${startTime}`)
    const endDateTime = new Date(`${date}T${endTime}`)

    if (startDateTime >= endDateTime) {
      setError('End time must be after start time')
      return
    }

    if (startDateTime < new Date()) {
      setError('Cannot create plan in the past')
      return
    }

    setLoading(true)

    try {
      const res = await fetch('/api/plans', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          locationId,
          startTime: startDateTime.toISOString(),
          endTime: endDateTime.toISOString(),
          notes,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Failed to create plan')
        return
      }

      setSuccess(true)
      if (data.warnings) setWarnings(data.warnings)
      if (data.alternatives) setAlternatives(data.alternatives)

      // Reset form
      setDate('')
      setStartTime('')
      setEndTime('')
      setNotes('')

      router.refresh()
    } catch (err) {
      setError('An unexpected error occurred')
    } finally {
      setLoading(false)
    }
  }

  // Get tomorrow's date as default min
  const tomorrow = new Date()
  tomorrow.setDate(tomorrow.getDate())
  const minDate = tomorrow.toISOString().split('T')[0]

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
          {error}
        </div>
      )}

      {success && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg text-sm">
          ✓ Study plan created successfully!
        </div>
      )}

      {warnings.length > 0 && (
        <div className="bg-yellow-50 border border-yellow-200 text-yellow-700 px-4 py-3 rounded-lg text-sm space-y-1">
          {warnings.map((warning, i) => (
            <p key={i}>{warning}</p>
          ))}
        </div>
      )}

      {alternatives.length > 0 && (
        <div className="bg-blue-50 border border-blue-200 text-blue-700 px-4 py-3 rounded-lg text-sm">
          <p className="font-medium mb-2">💡 Recommended alternatives:</p>
          <ul className="space-y-1">
            {alternatives.map((alt) => (
              <li key={alt.id}>
                <a
                  href={`/locations/${alt.id}`}
                  className="underline hover:no-underline"
                >
                  {alt.name}
                </a>{' '}
                - {alt.distance}m away, {alt.noiseLevel}, {alt.availableSeats}{' '}
                seats
              </li>
            ))}
          </ul>
        </div>
      )}

      <Input
        label="Date"
        type="date"
        value={date}
        onChange={(e) => setDate(e.target.value)}
        min={minDate}
        required
      />

      <div className="grid grid-cols-2 gap-3">
        <Input
          label="Start Time"
          type="time"
          value={startTime}
          onChange={(e) => setStartTime(e.target.value)}
          required
        />
        <Input
          label="End Time"
          type="time"
          value={endTime}
          onChange={(e) => setEndTime(e.target.value)}
          required
        />
      </div>

      <Textarea
        label="Notes (optional)"
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        placeholder="What will you study?"
        rows={2}
      />

      <Button type="submit" className="w-full" loading={loading}>
        Create Study Plan
      </Button>
    </form>
  )
}
