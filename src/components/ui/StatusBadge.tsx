import { NoiseLevel, OccupancyLevel } from '@/types'

interface StatusBadgeProps {
  noiseLevel: NoiseLevel
  occupancyLevel: OccupancyLevel
  showLabels?: boolean
  size?: 'sm' | 'md' | 'lg'
}

export function StatusBadge({
  noiseLevel,
  occupancyLevel,
  showLabels = true,
  size = 'md',
}: StatusBadgeProps) {
  const getNoiseColor = (level: NoiseLevel) => {
    switch (level) {
      case 'quiet':
        return 'bg-green-100 text-green-800 border-green-200'
      case 'moderate':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'loud':
        return 'bg-red-100 text-red-800 border-red-200'
    }
  }

  const getOccupancyColor = (level: OccupancyLevel) => {
    switch (level) {
      case 'available':
        return 'bg-green-100 text-green-800 border-green-200'
      case 'busy':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'full':
        return 'bg-red-100 text-red-800 border-red-200'
    }
  }

  const getNoiseEmoji = (level: NoiseLevel) => {
    switch (level) {
      case 'quiet':
        return '🟢'
      case 'moderate':
        return '🟡'
      case 'loud':
        return '🔴'
    }
  }

  const getOccupancyEmoji = (level: OccupancyLevel) => {
    switch (level) {
      case 'available':
        return '🟢'
      case 'busy':
        return '🟡'
      case 'full':
        return '🔴'
    }
  }

  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5',
    md: 'text-sm px-2.5 py-1',
    lg: 'text-base px-3 py-1.5',
  }

  return (
    <div className="flex flex-wrap gap-2">
      <span
        className={`inline-flex items-center rounded-full border font-medium ${getNoiseColor(noiseLevel)} ${sizeClasses[size]}`}
      >
        {getNoiseEmoji(noiseLevel)}{' '}
        {showLabels && (
          <span className="ml-1 capitalize">{noiseLevel}</span>
        )}
      </span>
      <span
        className={`inline-flex items-center rounded-full border font-medium ${getOccupancyColor(occupancyLevel)} ${sizeClasses[size]}`}
      >
        {getOccupancyEmoji(occupancyLevel)}{' '}
        {showLabels && (
          <span className="ml-1 capitalize">{occupancyLevel}</span>
        )}
      </span>
    </div>
  )
}

interface NoiseIndicatorProps {
  level: number
  showValue?: boolean
}

export function NoiseIndicator({ level }: NoiseIndicatorProps) {
  const getNoiseLabel = () => {
    if (level <= 40) return { label: 'Quiet', color: 'bg-green-100 text-green-800', icon: '🤫' }
    if (level <= 70) return { label: 'Moderate', color: 'bg-yellow-100 text-yellow-800', icon: '🔉' }
    return { label: 'Loud', color: 'bg-red-100 text-red-800', icon: '🔊' }
  }

  const noise = getNoiseLabel()

  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-sm font-medium ${noise.color}`}>
      {noise.icon} {noise.label}
    </span>
  )
}

interface OccupancyIndicatorProps {
  current: number
  capacity: number
  showValue?: boolean
}

export function OccupancyIndicator({
  current,
  capacity,
  showValue = false,
}: OccupancyIndicatorProps) {
  const percentage = Math.round((current / capacity) * 100)

  const getColor = () => {
    if (percentage <= 60) return 'bg-green-500'
    if (percentage <= 90) return 'bg-yellow-500'
    return 'bg-red-500'
  }

  return (
    <div className="flex items-center space-x-2">
      <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
        <div
          className={`h-full ${getColor()} transition-all duration-500`}
          style={{ width: `${Math.min(percentage, 100)}%` }}
        />
      </div>
      {showValue && (
        <span className="text-sm text-gray-600 whitespace-nowrap">
          {current}/{capacity}
        </span>
      )}
    </div>
  )
}
