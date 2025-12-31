/**
 * Player Marker Component
 * Displays a colored circular marker to indicate player selection
 * @version 1.1.0 - Added isConfirmed state with lock icon
 */
console.log('[components/game/PlayerMarker.tsx] v1.1.0 loaded')

import { memo, useMemo } from 'react'
import { type PlayerColor, PLAYER_COLORS } from '@/types/player-color'

// ============================================
// TYPES
// ============================================

export interface PlayerMarkerProps {
  /** Player marker color */
  color: PlayerColor
  /** Size variant */
  size?: 'sm' | 'md' | 'lg'
  /** Whether to show glow effect */
  showGlow?: boolean
  /** Player name to display (optional tooltip) */
  playerName?: string
  /** Whether the selection is confirmed (locked) - shows lock icon, no pulse animation */
  isConfirmed?: boolean
  /** Additional CSS classes */
  className?: string
}

// ============================================
// SIZE CONFIGURATIONS
// ============================================

const SIZE_CLASSES = {
  sm: {
    wrapper: 'w-5 h-5',
    inner: 'w-4 h-4',
    fontSize: 'text-[8px]',
  },
  md: {
    wrapper: 'w-8 h-8',
    inner: 'w-6 h-6',
    fontSize: 'text-[10px]',
  },
  lg: {
    wrapper: 'w-10 h-10',
    inner: 'w-8 h-8',
    fontSize: 'text-xs',
  },
}

// ============================================
// COMPONENT
// ============================================

export const PlayerMarker = memo(function PlayerMarker({
  color,
  size = 'md',
  showGlow = true,
  playerName,
  isConfirmed = false,
  className = '',
}: PlayerMarkerProps) {
  const colorConfig = PLAYER_COLORS[color]
  const sizeConfig = SIZE_CLASSES[size]

  // When confirmed, don't show glow animation
  const effectiveShowGlow = showGlow && !isConfirmed

  // Generate inline styles for the marker
  const markerStyle = useMemo(() => ({
    backgroundColor: colorConfig.hex,
    boxShadow: effectiveShowGlow
      ? `0 0 12px ${colorConfig.hex}80, 0 0 24px ${colorConfig.hex}40, inset 0 2px 4px rgba(255,255,255,0.3)`
      : `inset 0 2px 4px rgba(255,255,255,0.3)`,
  }), [colorConfig.hex, effectiveShowGlow])

  // Generate styles for the outer ring
  const ringStyle = useMemo(() => ({
    backgroundColor: `${colorConfig.hex}30`,
    borderColor: isConfirmed ? `${colorConfig.hex}` : `${colorConfig.hex}60`,
  }), [colorConfig.hex, isConfirmed])

  // Lock icon sizes based on marker size
  const lockIconSizes = {
    sm: 'w-2.5 h-2.5',
    md: 'w-3.5 h-3.5',
    lg: 'w-4 h-4',
  }

  return (
    <div
      className={`
        relative flex items-center justify-center rounded-full
        border-2 transition-all duration-300
        ${sizeConfig.wrapper}
        ${isConfirmed ? 'border-solid' : ''}
        ${className}
      `}
      style={ringStyle}
      title={playerName ? `${playerName}${isConfirmed ? ' (已確認)' : ''}` : undefined}
      data-testid={`player-marker-${color}${isConfirmed ? '-confirmed' : ''}`}
    >
      {/* Inner solid circle */}
      <div
        className={`
          rounded-full transition-all duration-300
          ${sizeConfig.inner}
          flex items-center justify-center
        `}
        style={markerStyle}
      >
        {/* Lock icon for confirmed state */}
        {isConfirmed && (
          <svg
            className={`${lockIconSizes[size]} text-white drop-shadow-md`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2.5}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
            />
          </svg>
        )}
      </div>

      {/* Pulse animation for active state (only when not confirmed) */}
      {effectiveShowGlow && (
        <div
          className={`
            absolute inset-0 rounded-full animate-ping opacity-30
          `}
          style={{ backgroundColor: colorConfig.hex }}
        />
      )}
    </div>
  )
})

// ============================================
// COLOR PICKER COMPONENT
// ============================================

export interface ColorPickerProps {
  /** Currently selected color */
  selectedColor: PlayerColor
  /** Colors already taken by other players */
  takenColors?: PlayerColor[]
  /** Callback when color is selected */
  onColorSelect: (color: PlayerColor) => void
  /** Additional CSS classes */
  className?: string
}

export const ColorPicker = memo(function ColorPicker({
  selectedColor,
  takenColors = [],
  onColorSelect,
  className = '',
}: ColorPickerProps) {
  const allColors: PlayerColor[] = ['green', 'red', 'purple', 'black']

  return (
    <div
      className={`flex items-center gap-2 ${className}`}
      data-testid="color-picker"
    >
      {allColors.map((color) => {
        const isTaken = takenColors.includes(color) && color !== selectedColor
        const isSelected = color === selectedColor
        const colorConfig = PLAYER_COLORS[color]

        return (
          <button
            key={color}
            type="button"
            disabled={isTaken}
            onClick={() => onColorSelect(color)}
            className={`
              relative w-10 h-10 rounded-full border-2 transition-all duration-200
              flex items-center justify-center
              ${isTaken
                ? 'opacity-30 cursor-not-allowed'
                : 'hover:scale-110 cursor-pointer'
              }
              ${isSelected
                ? 'ring-2 ring-offset-2 ring-offset-slate-800 ring-white scale-110'
                : ''
              }
            `}
            style={{
              backgroundColor: colorConfig.hex,
              borderColor: isSelected ? 'white' : `${colorConfig.hex}80`,
            }}
            title={`${colorConfig.nameTw}${isTaken ? ' (已被選擇)' : ''}`}
            data-testid={`color-option-${color}`}
          >
            {isSelected && (
              <svg
                className="w-5 h-5 text-white drop-shadow-lg"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={3}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            )}
            {isTaken && (
              <svg
                className="w-5 h-5 text-white/80"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            )}
          </button>
        )
      })}
    </div>
  )
})

export default PlayerMarker
