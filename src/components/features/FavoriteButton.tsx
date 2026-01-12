'use client'

import { useState } from 'react'

interface FavoriteButtonProps {
  locationId: string
  initialFavorite: boolean
}

export function FavoriteButton({ locationId, initialFavorite }: FavoriteButtonProps) {
  const [isFavorite, setIsFavorite] = useState(initialFavorite)
  const [loading, setLoading] = useState(false)

  const handleClick = async () => {
    if (loading) return

    setLoading(true)
    try {
      if (isFavorite) {
        await fetch(`/api/favorites?locationId=${locationId}`, {
          method: 'DELETE',
        })
        setIsFavorite(false)
      } else {
        await fetch('/api/favorites', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ locationId }),
        })
        setIsFavorite(true)
      }
    } catch (error) {
      console.error('Failed to toggle favorite:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <button
      onClick={handleClick}
      disabled={loading}
      className={`p-3 rounded-xl transition-colors ${
        isFavorite
          ? 'bg-red-50 text-red-500 hover:bg-red-100'
          : 'bg-gray-50 text-gray-400 hover:bg-gray-100 hover:text-gray-600'
      }`}
    >
      {isFavorite ? (
        <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
          <path
            fillRule="evenodd"
            d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z"
            clipRule="evenodd"
          />
        </svg>
      ) : (
        <svg
          className="w-6 h-6"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
          />
        </svg>
      )}
    </button>
  )
}
