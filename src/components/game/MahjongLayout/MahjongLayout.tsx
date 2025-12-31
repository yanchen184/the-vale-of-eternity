/**
 * MahjongLayout Component
 * 4-player mahjong-style game board layout
 * @version 1.0.0
 */
console.log('[components/game/MahjongLayout/MahjongLayout.tsx] v1.0.0 loaded')

import { memo, useMemo, type ReactNode } from 'react'
import { cn } from '@/lib/utils'
import type { CardInstance } from '@/types/cards'
import type { StonePool as StonePoolType } from '@/types/game'

// Base path for assets (matches vite.config.ts base)
const BASE_PATH = '/the-vale-of-eternity'

// ============================================
// TYPES
// ============================================

export type SeatPosition = 'SOUTH' | 'NORTH' | 'EAST' | 'WEST'

export interface PlayerSeatData {
  playerId: string
  name: string
  color: 'red' | 'blue' | 'green' | 'yellow'
  position: SeatPosition
  stones: StonePoolType
  hand: CardInstance[]
  field: CardInstance[]
  score: number
  isCurrentTurn: boolean
  hasPassed?: boolean
  isYou?: boolean
}

export interface StoneBankData {
  one: number
  three: number
  six: number
}

export interface MahjongLayoutProps {
  /** All players data indexed by position */
  players: Record<SeatPosition, PlayerSeatData | null>
  /** Stone bank (available stones to take) */
  stoneBank: StoneBankData
  /** Callback when stone is taken from bank */
  onTakeStone?: (type: 'one' | 'three' | 'six') => void
  /** Center area custom content (market cards, etc.) */
  centerContent?: ReactNode
  /** Additional className */
  className?: string
  /** Children for overlay content */
  children?: ReactNode
}

// ============================================
// CONSTANTS
// ============================================

const PLAYER_COLORS = {
  red: {
    bg: 'bg-red-900/40',
    border: 'border-red-600',
    text: 'text-red-400',
    glow: 'shadow-red-500/30',
    marker: 'bg-red-500',
  },
  blue: {
    bg: 'bg-blue-900/40',
    border: 'border-blue-600',
    text: 'text-blue-400',
    glow: 'shadow-blue-500/30',
    marker: 'bg-blue-500',
  },
  green: {
    bg: 'bg-emerald-900/40',
    border: 'border-emerald-600',
    text: 'text-emerald-400',
    glow: 'shadow-emerald-500/30',
    marker: 'bg-emerald-500',
  },
  yellow: {
    bg: 'bg-amber-900/40',
    border: 'border-amber-600',
    text: 'text-amber-400',
    glow: 'shadow-amber-500/30',
    marker: 'bg-amber-500',
  },
} as const

// Position labels for reference (can be used in future enhancements)
// const POSITION_LABELS: Record<SeatPosition, string> = {
//   SOUTH: 'South (You)',
//   NORTH: 'North',
//   EAST: 'East',
//   WEST: 'West',
// }

// Position rotations for reference (can be used for card orientation)
// const POSITION_ROTATION: Record<SeatPosition, string> = {
//   SOUTH: 'rotate-0',
//   NORTH: 'rotate-180',
//   EAST: '-rotate-90',
//   WEST: 'rotate-90',
// }

// ============================================
// SUB-COMPONENTS
// ============================================

interface PlayerSeatProps {
  player: PlayerSeatData | null
  position: SeatPosition
  compact?: boolean
}

const PlayerSeat = memo(function PlayerSeat({
  player,
  position,
  compact = false,
}: PlayerSeatProps) {
  if (!player) {
    return (
      <div
        className={cn(
          'flex items-center justify-center rounded-xl',
          'bg-slate-800/30 border-2 border-dashed border-slate-700',
          'min-h-[120px]'
        )}
        data-testid={`seat-${position.toLowerCase()}-empty`}
      >
        <span className="text-slate-600 text-sm">
          Waiting for player...
        </span>
      </div>
    )
  }

  const colors = PLAYER_COLORS[player.color]
  const isVertical = position === 'EAST' || position === 'WEST'

  return (
    <div
      className={cn(
        'relative flex flex-col rounded-xl border-2 transition-all duration-300',
        colors.bg,
        colors.border,
        player.isCurrentTurn && `ring-2 ring-offset-2 ring-offset-slate-900 ring-vale-400 ${colors.glow} shadow-lg`,
        player.hasPassed && 'opacity-50',
        compact ? 'p-2 gap-1' : 'p-3 gap-2',
        isVertical && 'h-full'
      )}
      data-testid={`seat-${position.toLowerCase()}`}
    >
      {/* Player Info Header */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          {/* Color Marker */}
          <div className={cn('w-3 h-3 rounded-full', colors.marker)} />

          {/* Name */}
          <span className={cn(
            'font-semibold truncate',
            colors.text,
            compact ? 'text-sm' : 'text-base'
          )}>
            {player.name}
            {player.isYou && <span className="text-xs text-slate-400 ml-1">(You)</span>}
          </span>
        </div>

        {/* Score Badge */}
        <div className={cn(
          'px-2 py-0.5 rounded-full text-xs font-bold',
          'bg-amber-900/50 border border-amber-600 text-amber-300'
        )}>
          {player.score} pts
        </div>
      </div>

      {/* Stone Pool (Compact) */}
      <div className="flex items-center gap-1 flex-wrap">
        <StoneDisplay type="one" count={player.stones.ONE} compact />
        <StoneDisplay type="three" count={player.stones.THREE} compact />
        <StoneDisplay type="six" count={player.stones.SIX} compact />
      </div>

      {/* Card Counts */}
      <div className="flex items-center gap-3 text-xs text-slate-400">
        <span>Hand: {player.hand.length}</span>
        <span>Field: {player.field.length}</span>
      </div>

      {/* Turn Indicator */}
      {player.isCurrentTurn && (
        <div className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-vale-500 animate-pulse" />
      )}

      {/* Passed Badge */}
      {player.hasPassed && (
        <div className="absolute inset-0 flex items-center justify-center bg-slate-900/60 rounded-xl">
          <span className="text-slate-400 font-semibold">PASSED</span>
        </div>
      )}
    </div>
  )
})

interface StoneDisplayProps {
  type: 'one' | 'three' | 'six'
  count: number
  compact?: boolean
  onClick?: () => void
  disabled?: boolean
}

const StoneDisplay = memo(function StoneDisplay({
  type,
  count,
  compact = false,
  onClick,
  disabled = false,
}: StoneDisplayProps) {
  const imageMap = {
    one: `${BASE_PATH}/assets/stones/stone-1.png`,
    three: `${BASE_PATH}/assets/stones/stone-3.png`,
    six: `${BASE_PATH}/assets/stones/stone-6.png`,
  }

  const valueMap = { one: 1, three: 3, six: 6 }

  if (compact) {
    return (
      <div className="flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-slate-700/50">
        <img
          src={imageMap[type]}
          alt={`${valueMap[type]}-point stone`}
          className="w-4 h-4"
        />
        <span className="text-xs font-bold text-slate-300">{count}</span>
      </div>
    )
  }

  const hasStones = count > 0

  return (
    <button
      onClick={onClick}
      disabled={disabled || !hasStones}
      className={cn(
        'relative flex flex-col items-center gap-1 p-3 rounded-xl border-2 transition-all',
        'bg-slate-800/60 border-slate-600',
        hasStones && !disabled && 'hover:bg-slate-700/60 hover:border-slate-500 hover:scale-105 cursor-pointer',
        (!hasStones || disabled) && 'opacity-40 cursor-not-allowed'
      )}
      data-testid={`stone-bank-${type}`}
    >
      <img
        src={imageMap[type]}
        alt={`${valueMap[type]}-point stone`}
        className="w-12 h-12 object-contain"
      />
      <span className="text-lg font-bold text-slate-200">{count}</span>
      <span className="text-xs text-slate-500">{valueMap[type]}pt</span>
    </button>
  )
})

interface StoneBankProps {
  stoneBank: StoneBankData
  onTakeStone?: (type: 'one' | 'three' | 'six') => void
}

const StoneBank = memo(function StoneBank({
  stoneBank,
  onTakeStone,
}: StoneBankProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center gap-3 p-4 rounded-2xl',
        'bg-gradient-to-b from-slate-800/80 to-slate-900/80',
        'border border-slate-700 backdrop-blur-sm'
      )}
      data-testid="stone-bank"
    >
      <h4 className="text-sm font-semibold text-slate-400 uppercase tracking-wide">
        Stone Bank
      </h4>
      <div className="flex items-center gap-3">
        <StoneDisplay
          type="one"
          count={stoneBank.one}
          onClick={() => onTakeStone?.('one')}
        />
        <StoneDisplay
          type="three"
          count={stoneBank.three}
          onClick={() => onTakeStone?.('three')}
        />
        <StoneDisplay
          type="six"
          count={stoneBank.six}
          onClick={() => onTakeStone?.('six')}
        />
      </div>
    </div>
  )
})

interface SpiralScoreTrackProps {
  players: (PlayerSeatData | null)[]
  maxScore?: number
}

const SpiralScoreTrack = memo(function SpiralScoreTrack({
  players,
  maxScore = 100,
}: SpiralScoreTrackProps) {
  // Generate spiral path points
  const spiralPoints = useMemo(() => {
    const points: { x: number; y: number; score: number }[] = []
    const centerX = 100
    const centerY = 100
    const maxRadius = 80
    const minRadius = 20
    const turns = 3
    // Total points: 21 intervals (0, 5, 10, 15... 100)

    for (let i = 0; i <= 20; i++) {
      const score = i * 5
      const t = i / 20
      const angle = t * turns * Math.PI * 2 - Math.PI / 2 // Start from top
      const radius = maxRadius - (maxRadius - minRadius) * t
      const x = centerX + radius * Math.cos(angle)
      const y = centerY + radius * Math.sin(angle)
      points.push({ x, y, score })
    }

    return points
  }, [])

  // Get position for each player's marker
  const getMarkerPosition = (score: number) => {
    const clampedScore = Math.min(Math.max(score, 0), maxScore)
    const index = Math.floor(clampedScore / 5)
    const nextIndex = Math.min(index + 1, spiralPoints.length - 1)
    const fraction = (clampedScore % 5) / 5

    const current = spiralPoints[index]
    const next = spiralPoints[nextIndex]

    return {
      x: current.x + (next.x - current.x) * fraction,
      y: current.y + (next.y - current.y) * fraction,
    }
  }

  const activePlayers = players.filter((p): p is PlayerSeatData => p !== null)

  return (
    <div
      className={cn(
        'relative w-[200px] h-[200px] rounded-full',
        'bg-gradient-to-br from-slate-800 to-slate-900',
        'border-2 border-slate-700'
      )}
      data-testid="spiral-score-track"
    >
      <svg viewBox="0 0 200 200" className="w-full h-full">
        {/* Spiral Track */}
        <path
          d={spiralPoints.reduce((acc, point, i) => {
            if (i === 0) return `M ${point.x} ${point.y}`
            return `${acc} L ${point.x} ${point.y}`
          }, '')}
          fill="none"
          stroke="rgba(148, 163, 184, 0.3)"
          strokeWidth="8"
          strokeLinecap="round"
        />

        {/* Score Markers on Track */}
        {spiralPoints.filter((_, i) => i % 2 === 0).map((point, i) => (
          <g key={i}>
            <circle
              cx={point.x}
              cy={point.y}
              r="4"
              fill="rgba(148, 163, 184, 0.5)"
            />
            <text
              x={point.x}
              y={point.y + 15}
              textAnchor="middle"
              fontSize="8"
              fill="rgba(148, 163, 184, 0.6)"
            >
              {point.score}
            </text>
          </g>
        ))}

        {/* Player Markers */}
        {activePlayers.map((player, index) => {
          const pos = getMarkerPosition(player.score)
          const colorMap = {
            red: '#ef4444',
            blue: '#3b82f6',
            green: '#10b981',
            yellow: '#f59e0b',
          }
          // Offset multiple players at same position
          const offset = index * 3 - (activePlayers.length - 1) * 1.5

          return (
            <g key={player.playerId}>
              {/* Player Cylinder Marker */}
              <ellipse
                cx={pos.x + offset}
                cy={pos.y + 5}
                rx="6"
                ry="3"
                fill="rgba(0,0,0,0.3)"
              />
              <rect
                x={pos.x - 5 + offset}
                y={pos.y - 12}
                width="10"
                height="14"
                rx="2"
                fill={colorMap[player.color]}
                stroke="white"
                strokeWidth="1"
              />
              <ellipse
                cx={pos.x + offset}
                cy={pos.y - 12}
                rx="5"
                ry="2"
                fill={colorMap[player.color]}
                stroke="white"
                strokeWidth="1"
              />
            </g>
          )
        })}

        {/* Center Label */}
        <text
          x="100"
          y="100"
          textAnchor="middle"
          dominantBaseline="middle"
          fontSize="12"
          fontWeight="bold"
          fill="rgba(148, 163, 184, 0.8)"
        >
          SCORE
        </text>
      </svg>
    </div>
  )
})

// ============================================
// MAIN COMPONENT
// ============================================

export const MahjongLayout = memo(function MahjongLayout({
  players,
  stoneBank,
  onTakeStone,
  centerContent,
  className,
  children,
}: MahjongLayoutProps) {
  const allPlayers = useMemo(() => {
    return [players.SOUTH, players.NORTH, players.EAST, players.WEST]
  }, [players])

  return (
    <div
      className={cn(
        'relative w-full min-h-screen',
        // Mahjong table background
        'bg-gradient-to-b from-slate-900 via-emerald-950/30 to-slate-900',
        className
      )}
      data-testid="mahjong-layout"
    >
      {/* Felt texture overlay */}
      <div
        className="absolute inset-0 opacity-20 pointer-events-none"
        style={{
          backgroundImage: `radial-gradient(circle at 2px 2px, rgba(16, 185, 129, 0.3) 1px, transparent 0)`,
          backgroundSize: '24px 24px',
        }}
      />

      {/* Main Grid Layout */}
      <div
        className={cn(
          'relative grid grid-cols-[200px_1fr_200px] grid-rows-[160px_1fr_200px]',
          'min-h-screen p-4 gap-4',
          // Desktop
          'lg:grid-cols-[220px_1fr_220px] lg:grid-rows-[180px_1fr_220px]'
        )}
      >
        {/* Top-Left Corner (Empty or Decoration) */}
        <div className="hidden lg:block" />

        {/* NORTH Player (Top Center) */}
        <div className="flex items-start justify-center pt-2">
          <div className="w-full max-w-md transform rotate-180">
            <PlayerSeat player={players.NORTH} position="NORTH" />
          </div>
        </div>

        {/* Top-Right Corner (Empty or Decoration) */}
        <div className="hidden lg:block" />

        {/* WEST Player (Left Side) */}
        <div className="flex items-center justify-start">
          <div className="h-full max-h-[400px] w-full">
            <PlayerSeat player={players.WEST} position="WEST" />
          </div>
        </div>

        {/* CENTER AREA */}
        <div
          className={cn(
            'flex flex-col items-center justify-center gap-6 p-6',
            'bg-gradient-to-br from-emerald-900/20 via-green-900/30 to-emerald-950/20',
            'rounded-3xl border border-emerald-800/30',
            'backdrop-blur-sm'
          )}
          data-testid="center-area"
        >
          {/* Score Track */}
          <SpiralScoreTrack players={allPlayers} />

          {/* Stone Bank */}
          <StoneBank stoneBank={stoneBank} onTakeStone={onTakeStone} />

          {/* Custom Center Content (Market, etc.) */}
          {centerContent}
        </div>

        {/* EAST Player (Right Side) */}
        <div className="flex items-center justify-end">
          <div className="h-full max-h-[400px] w-full">
            <PlayerSeat player={players.EAST} position="EAST" />
          </div>
        </div>

        {/* Bottom-Left Corner (Empty or Decoration) */}
        <div className="hidden lg:block" />

        {/* SOUTH Player (Bottom Center - Current Player) */}
        <div className="flex items-end justify-center pb-2">
          <div className="w-full max-w-2xl">
            <PlayerSeat player={players.SOUTH} position="SOUTH" />
          </div>
        </div>

        {/* Bottom-Right Corner (Empty or Decoration) */}
        <div className="hidden lg:block" />
      </div>

      {/* Overlay Content (Modals, etc.) */}
      {children}
    </div>
  )
})

export default MahjongLayout
