/**
 * Player Marker Component
 * Displays a beautiful magic gem marker to indicate player selection
 * Features 3D gem effect with drop-in animation
 * @version 2.0.0 - Redesigned as magic gem with drop animation
 */
console.log('[components/game/PlayerMarker.tsx] v2.0.0 loaded')

import { memo, useMemo, useState, useEffect } from 'react'
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
  /** Whether this is a newly placed marker (triggers drop animation) */
  isNew?: boolean
  /** Player index (1-4) to display in center */
  playerIndex?: number
  /** Additional CSS classes */
  className?: string
}

// ============================================
// SIZE CONFIGURATIONS
// ============================================

const SIZE_CONFIGS = {
  sm: {
    wrapper: 'w-6 h-6',
    gem: 'w-5 h-5',
    innerGem: 'w-4 h-4',
    highlight: 'w-2 h-1',
    fontSize: 'text-[8px]',
    lockSize: 'w-2 h-2',
    glowSize: 'w-8 h-8',
    shadowSize: 'w-4 h-1',
  },
  md: {
    wrapper: 'w-10 h-10',
    gem: 'w-8 h-8',
    innerGem: 'w-6 h-6',
    highlight: 'w-3 h-1.5',
    fontSize: 'text-[10px]',
    lockSize: 'w-3 h-3',
    glowSize: 'w-12 h-12',
    shadowSize: 'w-6 h-1.5',
  },
  lg: {
    wrapper: 'w-12 h-12',
    gem: 'w-10 h-10',
    innerGem: 'w-8 h-8',
    highlight: 'w-4 h-2',
    fontSize: 'text-xs',
    lockSize: 'w-4 h-4',
    glowSize: 'w-16 h-16',
    shadowSize: 'w-8 h-2',
  },
}

// ============================================
// COLOR HELPERS
// ============================================

/**
 * Generate lighter shade of a hex color
 */
function lightenColor(hex: string, percent: number): string {
  const num = parseInt(hex.replace('#', ''), 16)
  const r = Math.min(255, (num >> 16) + Math.round(255 * percent))
  const g = Math.min(255, ((num >> 8) & 0x00ff) + Math.round(255 * percent))
  const b = Math.min(255, (num & 0x0000ff) + Math.round(255 * percent))
  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, '0')}`
}

/**
 * Generate darker shade of a hex color
 */
function darkenColor(hex: string, percent: number): string {
  const num = parseInt(hex.replace('#', ''), 16)
  const r = Math.max(0, (num >> 16) - Math.round(255 * percent))
  const g = Math.max(0, ((num >> 8) & 0x00ff) - Math.round(255 * percent))
  const b = Math.max(0, (num & 0x0000ff) - Math.round(255 * percent))
  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, '0')}`
}

// ============================================
// LOCK ICON COMPONENT
// ============================================

interface LockIconProps {
  className?: string
}

const LockIcon = memo(function LockIcon({ className = '' }: LockIconProps) {
  return (
    <svg
      className={className}
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
  )
})

// ============================================
// MAIN COMPONENT - MAGIC GEM MARKER
// ============================================

export const PlayerMarker = memo(function PlayerMarker({
  color,
  size = 'md',
  showGlow = true,
  playerName,
  isConfirmed = false,
  isNew = false,
  playerIndex,
  className = '',
}: PlayerMarkerProps) {
  const colorConfig = PLAYER_COLORS[color]
  const sizeConfig = SIZE_CONFIGS[size]

  // Track animation state
  const [shouldAnimate, setShouldAnimate] = useState(isNew)

  // Clear animation flag after animation completes
  useEffect(() => {
    if (isNew) {
      setShouldAnimate(true)
      const timer = setTimeout(() => {
        setShouldAnimate(false)
      }, 800) // Animation duration + buffer
      return () => clearTimeout(timer)
    }
  }, [isNew])

  // Generate color variations for 3D effect
  const colorLight = useMemo(() => lightenColor(colorConfig.hex, 0.3), [colorConfig.hex])
  const colorMedium = colorConfig.hex
  const colorDark = useMemo(() => darkenColor(colorConfig.hex, 0.3), [colorConfig.hex])

  // Gem gradient style
  const gemStyle = useMemo(() => ({
    background: `linear-gradient(135deg, ${colorLight} 0%, ${colorMedium} 40%, ${colorDark} 100%)`,
    borderColor: colorLight,
    boxShadow: showGlow && !isConfirmed
      ? `
        0 0 15px ${colorMedium}80,
        0 0 30px ${colorMedium}40,
        inset 0 -3px 8px rgba(0,0,0,0.4),
        inset 0 3px 8px rgba(255,255,255,0.3)
      `
      : `
        inset 0 -3px 8px rgba(0,0,0,0.4),
        inset 0 3px 8px rgba(255,255,255,0.3)
      `,
    '--glow-color': colorMedium,
  } as React.CSSProperties), [colorLight, colorMedium, colorDark, showGlow, isConfirmed])

  // Outer glow style
  const glowStyle = useMemo(() => ({
    background: `radial-gradient(circle, ${colorMedium}60 0%, transparent 70%)`,
  }), [colorMedium])

  // Bottom shadow style
  const shadowStyle = useMemo(() => ({
    background: `radial-gradient(ellipse, ${colorDark}50 0%, transparent 70%)`,
  }), [colorDark])

  return (
    <div
      className={`
        relative flex items-center justify-center
        ${sizeConfig.wrapper}
        ${shouldAnimate ? 'animate-marker-drop-in' : ''}
        ${className}
      `}
      title={playerName ? `${playerName}${isConfirmed ? ' (已確認)' : ''}` : undefined}
      data-testid={`player-marker-${color}${isConfirmed ? '-confirmed' : ''}`}
    >
      {/* Outer glow aura (only when not confirmed) */}
      {showGlow && !isConfirmed && (
        <div
          className={`
            absolute -inset-1 rounded-full animate-marker-pulse-glow opacity-60
            ${sizeConfig.glowSize}
          `}
          style={glowStyle}
        />
      )}

      {/* Main gem body */}
      <div
        className={`
          relative rounded-full overflow-hidden border-2
          transition-all duration-300
          ${sizeConfig.gem}
          ${showGlow && !isConfirmed ? 'animate-marker-gem-glow' : ''}
        `}
        style={gemStyle}
      >
        {/* Inner gem facet */}
        <div
          className={`
            absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2
            rounded-full
            ${sizeConfig.innerGem}
          `}
          style={{
            background: `radial-gradient(circle at 30% 30%, ${colorLight}90 0%, ${colorMedium}60 50%, ${colorDark}40 100%)`,
          }}
        />

        {/* Top highlight (glass reflection) */}
        <div
          className={`
            absolute top-1 left-1/2 -translate-x-1/2
            rounded-full bg-white/50 blur-[1px]
            ${sizeConfig.highlight}
          `}
        />

        {/* Secondary highlight */}
        <div
          className="absolute top-2 left-1/4 w-1 h-1 rounded-full bg-white/40"
        />

        {/* Center content: Lock icon or player number */}
        <div className="absolute inset-0 flex items-center justify-center">
          {isConfirmed ? (
            <LockIcon className={`${sizeConfig.lockSize} text-white drop-shadow-lg`} />
          ) : playerIndex !== undefined ? (
            <span className={`${sizeConfig.fontSize} font-bold text-white drop-shadow-lg`}>
              {playerIndex}
            </span>
          ) : null}
        </div>
      </div>

      {/* Bottom shadow (3D effect) */}
      <div
        className={`
          absolute -bottom-0.5 left-1/2 -translate-x-1/2 rounded-full
          ${sizeConfig.shadowSize}
        `}
        style={shadowStyle}
      />

      {/* Ping animation for active selection */}
      {showGlow && !isConfirmed && (
        <div
          className={`
            absolute inset-0 rounded-full animate-ping opacity-20
            ${sizeConfig.gem}
          `}
          style={{ backgroundColor: colorMedium }}
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
      className={`flex items-center gap-3 ${className}`}
      data-testid="color-picker"
    >
      {allColors.map((color) => {
        const isTaken = takenColors.includes(color) && color !== selectedColor
        const isSelected = color === selectedColor
        const colorConfig = PLAYER_COLORS[color]
        const colorLight = lightenColor(colorConfig.hex, 0.2)

        return (
          <button
            key={color}
            type="button"
            disabled={isTaken}
            onClick={() => onColorSelect(color)}
            className={`
              relative w-12 h-12 rounded-full border-2 transition-all duration-200
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
              background: `linear-gradient(135deg, ${colorLight} 0%, ${colorConfig.hex} 50%, ${darkenColor(colorConfig.hex, 0.2)} 100%)`,
              borderColor: isSelected ? 'white' : colorLight,
              boxShadow: isSelected
                ? `0 0 20px ${colorConfig.hex}80, inset 0 2px 4px rgba(255,255,255,0.3)`
                : 'inset 0 2px 4px rgba(255,255,255,0.3)',
            }}
            title={`${colorConfig.nameTw}${isTaken ? ' (已被選擇)' : ''}`}
            data-testid={`color-option-${color}`}
          >
            {/* Highlight */}
            <div className="absolute top-1 left-1/2 -translate-x-1/2 w-4 h-1.5 rounded-full bg-white/40" />

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
