'use client'

import { useState } from 'react'

export function SyncLocationsButton() {
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<{
    success?: boolean
    created?: number
    updated?: number
    error?: string
  } | null>(null)

  const handleSync = async () => {
    setLoading(true)
    setResult(null)

    try {
      const response = await fetch('/api/admin/sync-locations', {
        method: 'POST',
      })

      const data = await response.json()

      if (response.ok) {
        setResult({ success: true, created: data.created, updated: data.updated })
        // Refresh the page after a short delay to show updated data
        setTimeout(() => window.location.reload(), 2000)
      } else {
        setResult({ error: data.error || 'Sync failed' })
      }
    } catch (error) {
      setResult({ error: 'Network error' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <button
        onClick={handleSync}
        disabled={loading}
        className="w-full bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md hover:border-primary-200 transition-all text-left disabled:opacity-50"
      >
        <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center mb-4">
          <span className="text-2xl">{loading ? '⏳' : '🔄'}</span>
        </div>
        <h3 className="font-semibold text-gray-900 text-lg mb-2">
          {loading ? 'Syncing...' : 'Sync Locations'}
        </h3>
        <p className="text-gray-500 text-sm">
          Fetch latest location data and images from Ghent Open Data API.
        </p>
      </button>
      
      {result && (
        <div className={`mt-3 p-3 rounded-lg text-sm ${
          result.success 
            ? 'bg-green-50 text-green-700' 
            : 'bg-red-50 text-red-700'
        }`}>
          {result.success 
            ? `✅ Sync complete! Created: ${result.created}, Updated: ${result.updated}`
            : `❌ ${result.error}`
          }
        </div>
      )}
    </div>
  )
}
