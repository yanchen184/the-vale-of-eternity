/**
 * MahjongGameBoard Component
 * Full game board with mahjong-style 4-player layout
 * Includes detailed player areas with cards display
 * @version 1.0.0
 */
console.log('[components/game/MahjongLayout/MahjongGameBoard.tsx] v1.0.0 loaded')

import { memo, useMemo, type ReactNode } from 'react'
import { cn } from '@/lib/utils'
import type { CardInstance } from '@/types/cards'
import type { StonePool as StonePoolType } from '@/types/game'
import { calculateStonePoolValue } from '@/types/game'

// Base path for assets (matches vite.config.ts base)
const BASE_PATH = '/the-vale-of-eternity'

// ============================================
// TYPES
// ============================================

export type SeatPosition = 'SOUTH' | 'NORTH' | 'EAST' | 'WEST'

export interface PlayerData {
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

export interface MahjongGameBoardProps {
  /** All players data indexed by position */
  players: Record<SeatPosition, PlayerData | null>
  /** Stone bank (available stones to take) */
  stoneBank: StoneBankData
  /** Current game phase */
  phase: 'WAITING' | 'HUNTING' | 'ACTION' | 'RESOLUTION' | 'ENDED'
  /** Current round number */
  round: number
  /** Callback when stone is taken from bank */
  onTakeStone?: (type: 'one' | 'three' | 'six') => void
  /** Callback when card is selected from hand */
  onCardSelect?: (cardId: string) => void
  /** Callback when card is played to field */
  onCardPlay?: (cardId: string) => void
  /** Center area custom content (market cards, etc.) */
  centerContent?: ReactNode
  /** Show detailed view for the current player */
  showDetailedSouth?: boolean
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
    bg: 'bg-red-900/30',
    bgHover: 'hover:bg-red-900/40',
    border: 'border-red-700/60',
    borderActive: 'border-red-500',
    text: 'text-red-400',
    textBright: 'text-red-300',
    glow: 'shadow-red-500/20',
    marker: 'bg-red-500',
    gradient: 'from-red-950/40 to-red-900/20',
  },
  blue: {
    bg: 'bg-blue-900/30',
    bgHover: 'hover:bg-blue-900/40',
    border: 'border-blue-700/60',
    borderActive: 'border-blue-500',
    text: 'text-blue-400',
    textBright: 'text-blue-300',
    glow: 'shadow-blue-500/20',
    marker: 'bg-blue-500',
    gradient: 'from-blue-950/40 to-blue-900/20',
  },
  green: {
    bg: 'bg-emerald-900/30',
    bgHover: 'hover:bg-emerald-900/40',
    border: 'border-emerald-700/60',
    borderActive: 'border-emerald-500',
    text: 'text-emerald-400',
    textBright: 'text-emerald-300',
    glow: 'shadow-emerald-500/20',
    marker: 'bg-emerald-500',
    gradient: 'from-emerald-950/40 to-emerald-900/20',
  },
  yellow: {
    bg: 'bg-amber-900/30',
    bgHover: 'hover:bg-amber-900/40',
    border: 'border-amber-700/60',
    borderActive: 'border-amber-500',
    text: 'text-amber-400',
    textBright: 'text-amber-300',
    glow: 'shadow-amber-500/20',
    marker: 'bg-amber-500',
    gradient: 'from-amber-950/40 to-amber-900/20',
  },
} as const

// ============================================
// SUB-COMPONENTS
// ============================================

/**
 * Stone Display - Shows stone count with image
 */
interface StoneDisplayProps {
  type: 'one' | 'three' | 'six'
  count: number
  size?: 'sm' | 'md' | 'lg'
  onClick?: () => void
  disabled?: boolean
  showValue?: boolean
}

const StoneDisplay = memo(function StoneDisplay({
  type,
  count,
  size = 'md',
  onClick,
  disabled = false,
  showValue = true,
}: StoneDisplayProps) {
  const imageMap = {
    one: `${BASE_PATH}/assets/stones/stone-1.png`,
    three: `${BASE_PATH}/assets/stones/stone-3.png`,
    six: `${BASE_PATH}/assets/stones/stone-6.png`,
  }
  const valueMap = { one: 1, three: 3, six: 6 }
  const sizeClasses = {
    sm: 'w-5 h-5',
    md: 'w-8 h-8',
    lg: 'w-12 h-12',
  }
  const hasStones = count > 0

  return (
    <button
      onClick={onClick}
      disabled={disabled || !hasStones || !onClick}
      className={cn(
        'flex items-center gap-1 rounded-lg transition-all',
        size === 'sm' && 'px-1.5 py-0.5 gap-0.5',
        size === 'md' && 'px-2 py-1',
        size === 'lg' && 'flex-col px-4 py-3',
        'bg-slate-800/50 border border-slate-700/50',
        hasStones && onClick && !disabled && 'hover:bg-slate-700/50 hover:border-slate-600 cursor-pointer',
        (!hasStones || disabled) && 'opacity-40 cursor-not-allowed'
      )}
      data-testid={`stone-${type}`}
    >
      <img
        src={imageMap[type]}
        alt={`${valueMap[type]}-point`}
        className={cn(sizeClasses[size], 'object-contain')}
      />
      <span className={cn(
        'font-bold text-slate-200',
        size === 'sm' && 'text-xs',
        size === 'md' && 'text-sm',
        size === 'lg' && 'text-xl'
      )}>
        {count}
      </span>
      {showValue && size === 'lg' && (
        <span className="text-xs text-slate-500">{valueMap[type]}pt</span>
      )}
    </button>
  )
})

/**
 * Player Stone Pool Display
 */
interface PlayerStonePoolProps {
  stones: StonePoolType
  compact?: boolean
}

const PlayerStonePool = memo(function PlayerStonePool({
  stones,
  compact = false,
}: PlayerStonePoolProps) {
  const totalValue = calculateStonePoolValue(stones)

  return (
    <div className={cn(
      'flex items-center gap-2',
      compact ? 'flex-wrap' : 'flex-wrap'
    )}>
      {/* Point Stones */}
      <StoneDisplay type="one" count={stones.ONE} size={compact ? 'sm' : 'md'} />
      <StoneDisplay type="three" count={stones.THREE} size={compact ? 'sm' : 'md'} />
      <StoneDisplay type="six" count={stones.SIX} size={compact ? 'sm' : 'md'} />

      {/* Element Stones (compact display) */}
      {!compact && (
        <>
          <div className="w-px h-6 bg-slate-700 mx-1" />
          <div className="flex items-center gap-1">
            {stones.FIRE > 0 && (
              <span className="px-1.5 py-0.5 rounded bg-red-900/50 text-red-400 text-xs font-bold">
                {stones.FIRE}
              </span>
            )}
            {stones.WATER > 0 && (
              <span className="px-1.5 py-0.5 rounded bg-blue-900/50 text-blue-400 text-xs font-bold">
                {stones.WATER}
              </span>
            )}
            {stones.EARTH > 0 && (
              <span className="px-1.5 py-0.5 rounded bg-green-900/50 text-green-400 text-xs font-bold">
                {stones.EARTH}
              </span>
            )}
            {stones.WIND > 0 && (
              <span className="px-1.5 py-0.5 rounded bg-purple-900/50 text-purple-400 text-xs font-bold">
                {stones.WIND}
              </span>
            )}
          </div>
        </>
      )}

      {/* Total Value */}
      <div className={cn(
        'ml-auto px-2 py-0.5 rounded-full',
        'bg-vale-900/50 border border-vale-700',
        compact ? 'text-xs' : 'text-sm'
      )}>
        <span className="text-vale-400 font-bold">{totalValue}</span>
        <span className="text-slate-500 ml-1">total</span>
      </div>
    </div>
  )
})

/**
 * Mini Card Display - For showing cards in opponent areas
 */
interface MiniCardProps {
  card: CardInstance
  faceDown?: boolean
  onClick?: () => void
}

const MiniCard = memo(function MiniCard({
  card,
  faceDown = false,
  onClick,
}: MiniCardProps) {
  const elementColors = {
    FIRE: 'bg-red-900/70 border-red-600',
    WATER: 'bg-blue-900/70 border-blue-600',
    EARTH: 'bg-green-900/70 border-green-600',
    WIND: 'bg-purple-900/70 border-purple-600',
    DRAGON: 'bg-amber-900/70 border-amber-600',
  }

  if (faceDown) {
    return (
      <div
        className={cn(
          'w-8 h-12 rounded-md',
          'bg-gradient-to-br from-slate-700 to-slate-800',
          'border border-slate-600',
          'flex items-center justify-center'
        )}
      >
        <div className="w-4 h-4 rounded-full bg-slate-600" />
      </div>
    )
  }

  return (
    <button
      onClick={onClick}
      className={cn(
        'w-8 h-12 rounded-md border transition-transform',
        elementColors[card.element] || 'bg-slate-800 border-slate-600',
        onClick && 'hover:scale-110 cursor-pointer'
      )}
      title={card.nameTw || card.name}
    >
      <div className="flex flex-col items-center justify-center h-full text-xs">
        <span className="text-amber-400 font-bold">{card.cost}</span>
        <span className="text-white font-bold">{card.baseScore}</span>
      </div>
    </button>
  )
})

/**
 * Card Pile Display - Shows stacked cards
 */
interface CardPileProps {
  cards: CardInstance[]
  label: string
  faceDown?: boolean
  maxVisible?: number
}

const CardPile = memo(function CardPile({
  cards,
  label,
  faceDown = false,
  maxVisible = 5,
}: CardPileProps) {
  const visibleCards = cards.slice(0, maxVisible)
  const hiddenCount = cards.length - maxVisible

  return (
    <div className="flex flex-col items-center gap-1">
      <span className="text-xs text-slate-500">{label}</span>
      <div className="relative h-14 w-12">
        {visibleCards.map((card, i) => (
          <div
            key={card.instanceId}
            className="absolute"
            style={{
              left: `${i * 3}px`,
              top: `${i * 2}px`,
              zIndex: i,
            }}
          >
            <MiniCard card={card} faceDown={faceDown} />
          </div>
        ))}
        {cards.length === 0 && (
          <div className="w-8 h-12 rounded-md border-2 border-dashed border-slate-700 flex items-center justify-center">
            <span className="text-slate-600 text-xs">0</span>
          </div>
        )}
      </div>
      {hiddenCount > 0 && (
        <span className="text-xs text-slate-500">+{hiddenCount}</span>
      )}
    </div>
  )
})

/**
 * Opponent Player Seat - Compact view for opponents
 */
interface OpponentSeatProps {
  player: PlayerData | null
  position: SeatPosition
}

const OpponentSeat = memo(function OpponentSeat({
  player,
  position,
}: OpponentSeatProps) {
  if (!player) {
    return (
      <div
        className={cn(
          'flex items-center justify-center rounded-xl h-full',
          'bg-slate-800/20 border-2 border-dashed border-slate-700/50'
        )}
        data-testid={`opponent-${position.toLowerCase()}-empty`}
      >
        <span className="text-slate-600 text-sm">Empty Seat</span>
      </div>
    )
  }

  const colors = PLAYER_COLORS[player.color]
  const isVertical = position === 'EAST' || position === 'WEST'

  return (
    <div
      className={cn(
        'relative rounded-xl border-2 transition-all duration-300 overflow-hidden',
        `bg-gradient-to-br ${colors.gradient}`,
        player.isCurrentTurn ? colors.borderActive : colors.border,
        player.isCurrentTurn && `shadow-lg ${colors.glow}`,
        player.hasPassed && 'opacity-50',
        isVertical ? 'h-full p-3' : 'p-3'
      )}
      data-testid={`opponent-${position.toLowerCase()}`}
    >
      {/* Turn Indicator Glow */}
      {player.isCurrentTurn && (
        <div className={cn(
          'absolute inset-0 animate-pulse',
          `bg-gradient-to-br ${colors.gradient}`,
          'opacity-30'
        )} />
      )}

      <div className={cn(
        'relative z-10 flex gap-3 h-full',
        isVertical ? 'flex-col' : 'items-center'
      )}>
        {/* Player Info */}
        <div className={cn(
          'flex items-center gap-2',
          isVertical ? 'flex-row' : ''
        )}>
          {/* Color Marker & Name */}
          <div className={cn('w-3 h-3 rounded-full flex-shrink-0', colors.marker)} />
          <div className="flex-1 min-w-0">
            <div className={cn('font-semibold truncate text-sm', colors.textBright)}>
              {player.name}
            </div>
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <span className="text-amber-400 font-bold">{player.score}pts</span>
            </div>
          </div>
        </div>

        {/* Stone Pool (Compact) */}
        <div className={cn(
          'flex gap-1',
          isVertical ? 'flex-wrap' : ''
        )}>
          <StoneDisplay type="one" count={player.stones.ONE} size="sm" />
          <StoneDisplay type="three" count={player.stones.THREE} size="sm" />
          <StoneDisplay type="six" count={player.stones.SIX} size="sm" />
        </div>

        {/* Card Piles */}
        <div className={cn(
          'flex gap-2',
          isVertical ? 'flex-col items-start' : 'items-center'
        )}>
          <CardPile cards={player.hand} label="Hand" faceDown />
          <CardPile cards={player.field} label="Field" />
        </div>
      </div>

      {/* Passed Overlay */}
      {player.hasPassed && (
        <div className="absolute inset-0 bg-slate-900/70 flex items-center justify-center z-20">
          <span className="text-slate-400 font-semibold text-sm uppercase tracking-wider">
            Passed
          </span>
        </div>
      )}

      {/* Turn Indicator Badge */}
      {player.isCurrentTurn && (
        <div className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-vale-500 animate-ping z-20" />
      )}
    </div>
  )
})

/**
 * Current Player Seat - Detailed view for the main player (SOUTH)
 */
interface CurrentPlayerSeatProps {
  player: PlayerData | null
  onCardSelect?: (cardId: string) => void
  onCardPlay?: (cardId: string) => void
}

const CurrentPlayerSeat = memo(function CurrentPlayerSeat({
  player,
  onCardSelect,
  // onCardPlay is available for future use when implementing card play functionality
  onCardPlay: _onCardPlay,
}: CurrentPlayerSeatProps) {
  // Suppress unused warning - onCardPlay will be used in future implementation
  void _onCardPlay
  if (!player) {
    return (
      <div
        className="flex items-center justify-center rounded-xl p-6 bg-slate-800/30 border-2 border-dashed border-slate-700"
        data-testid="current-player-empty"
      >
        <span className="text-slate-500">Your seat</span>
      </div>
    )
  }

  const colors = PLAYER_COLORS[player.color]

  return (
    <div
      className={cn(
        'relative rounded-2xl border-2 transition-all duration-300 overflow-hidden',
        `bg-gradient-to-t ${colors.gradient}`,
        player.isCurrentTurn ? colors.borderActive : colors.border,
        player.isCurrentTurn && `shadow-xl ${colors.glow} ring-2 ring-vale-400/30`
      )}
      data-testid="current-player-seat"
    >
      {/* Header */}
      <div className={cn(
        'flex items-center justify-between px-4 py-2 border-b',
        colors.border
      )}>
        <div className="flex items-center gap-3">
          <div className={cn('w-4 h-4 rounded-full', colors.marker)} />
          <span className={cn('font-bold text-lg', colors.textBright)}>
            {player.name}
          </span>
          <span className="text-slate-500 text-sm">(You)</span>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-sm">
            <span className="text-slate-400">Score: </span>
            <span className="text-amber-400 font-bold text-lg">{player.score}</span>
          </div>
          {player.isCurrentTurn && (
            <div className="px-3 py-1 rounded-full bg-vale-600 text-vale-100 text-sm font-semibold animate-pulse">
              Your Turn!
            </div>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="p-4 space-y-4">
        {/* Stone Pool */}
        <div>
          <h4 className="text-xs text-slate-500 uppercase tracking-wider mb-2">Your Stones</h4>
          <PlayerStonePool stones={player.stones} />
        </div>

        {/* Field Cards */}
        <div>
          <h4 className="text-xs text-slate-500 uppercase tracking-wider mb-2">
            Field ({player.field.length})
          </h4>
          <div className="flex gap-2 flex-wrap min-h-[48px]">
            {player.field.length === 0 ? (
              <span className="text-slate-600 text-sm">No creatures summoned</span>
            ) : (
              player.field.map((card) => (
                <MiniCard key={card.instanceId} card={card} />
              ))
            )}
          </div>
        </div>

        {/* Hand Cards */}
        <div>
          <h4 className="text-xs text-slate-500 uppercase tracking-wider mb-2">
            Hand ({player.hand.length})
          </h4>
          <div className="flex gap-2 flex-wrap min-h-[48px]">
            {player.hand.length === 0 ? (
              <span className="text-slate-600 text-sm">No cards in hand</span>
            ) : (
              player.hand.map((card) => (
                <MiniCard
                  key={card.instanceId}
                  card={card}
                  onClick={() => onCardSelect?.(card.instanceId)}
                />
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  )
})

/**
 * Stone Bank - Central stone supply
 */
interface StoneBankProps {
  stoneBank: StoneBankData
  onTakeStone?: (type: 'one' | 'three' | 'six') => void
  disabled?: boolean
}

const StoneBank = memo(function StoneBank({
  stoneBank,
  onTakeStone,
  disabled = false,
}: StoneBankProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center gap-3 p-4 rounded-2xl',
        'bg-gradient-to-b from-slate-800/90 to-slate-900/90',
        'border border-slate-700/80 backdrop-blur-sm',
        'shadow-xl'
      )}
      data-testid="stone-bank"
    >
      <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-widest">
        Stone Bank
      </h4>
      <div className="flex items-center gap-3">
        <StoneDisplay
          type="one"
          count={stoneBank.one}
          size="lg"
          onClick={() => onTakeStone?.('one')}
          disabled={disabled}
        />
        <StoneDisplay
          type="three"
          count={stoneBank.three}
          size="lg"
          onClick={() => onTakeStone?.('three')}
          disabled={disabled}
        />
        <StoneDisplay
          type="six"
          count={stoneBank.six}
          size="lg"
          onClick={() => onTakeStone?.('six')}
          disabled={disabled}
        />
      </div>
    </div>
  )
})

/**
 * Spiral Score Track - Visual score display
 */
interface SpiralScoreTrackProps {
  players: (PlayerData | null)[]
  maxScore?: number
}

const SpiralScoreTrack = memo(function SpiralScoreTrack({
  players,
  maxScore = 100,
}: SpiralScoreTrackProps) {
  const spiralPoints = useMemo(() => {
    const points: { x: number; y: number; score: number }[] = []
    const centerX = 100
    const centerY = 100
    const maxRadius = 80
    const minRadius = 15
    const turns = 3
    const totalSteps = 20

    for (let i = 0; i <= totalSteps; i++) {
      const score = i * 5
      const t = i / totalSteps
      const angle = t * turns * Math.PI * 2 - Math.PI / 2
      const radius = maxRadius - (maxRadius - minRadius) * t
      const x = centerX + radius * Math.cos(angle)
      const y = centerY + radius * Math.sin(angle)
      points.push({ x, y, score })
    }

    return points
  }, [])

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

  const activePlayers = players.filter((p): p is PlayerData => p !== null)
  const colorMap = {
    red: '#ef4444',
    blue: '#3b82f6',
    green: '#10b981',
    yellow: '#f59e0b',
  }

  return (
    <div
      className={cn(
        'relative w-[180px] h-[180px] rounded-full',
        'bg-gradient-to-br from-slate-800/90 to-slate-900/90',
        'border-2 border-slate-700/80',
        'shadow-inner'
      )}
      data-testid="spiral-score-track"
    >
      <svg viewBox="0 0 200 200" className="w-full h-full">
        {/* Track Path */}
        <path
          d={spiralPoints.reduce((acc, point, i) => {
            if (i === 0) return `M ${point.x} ${point.y}`
            return `${acc} L ${point.x} ${point.y}`
          }, '')}
          fill="none"
          stroke="rgba(71, 85, 105, 0.6)"
          strokeWidth="10"
          strokeLinecap="round"
        />

        {/* Score Dots */}
        {spiralPoints.filter((_, i) => i % 2 === 0).map((point, idx) => (
          <g key={idx}>
            <circle
              cx={point.x}
              cy={point.y}
              r="5"
              fill="rgba(100, 116, 139, 0.8)"
            />
            {idx % 2 === 0 && (
              <text
                x={point.x}
                y={point.y - 10}
                textAnchor="middle"
                fontSize="8"
                fill="rgba(148, 163, 184, 0.7)"
                fontWeight="bold"
              >
                {point.score}
              </text>
            )}
          </g>
        ))}

        {/* Player Markers */}
        {activePlayers.map((player, index) => {
          const pos = getMarkerPosition(player.score)
          const offset = (index - (activePlayers.length - 1) / 2) * 8

          return (
            <g key={player.playerId}>
              {/* Shadow */}
              <ellipse
                cx={pos.x + offset}
                cy={pos.y + 8}
                rx="7"
                ry="4"
                fill="rgba(0,0,0,0.4)"
              />
              {/* Cylinder Body */}
              <rect
                x={pos.x - 6 + offset}
                y={pos.y - 14}
                width="12"
                height="18"
                rx="3"
                fill={colorMap[player.color]}
                stroke="white"
                strokeWidth="1.5"
              />
              {/* Cylinder Top */}
              <ellipse
                cx={pos.x + offset}
                cy={pos.y - 14}
                rx="6"
                ry="3"
                fill={colorMap[player.color]}
                stroke="white"
                strokeWidth="1.5"
              />
              {/* Highlight */}
              <ellipse
                cx={pos.x + offset - 2}
                cy={pos.y - 14}
                rx="2"
                ry="1.5"
                fill="rgba(255,255,255,0.4)"
              />
            </g>
          )
        })}

        {/* Center Label */}
        <text
          x="100"
          y="96"
          textAnchor="middle"
          dominantBaseline="middle"
          fontSize="10"
          fontWeight="bold"
          fill="rgba(148, 163, 184, 0.9)"
        >
          SCORE
        </text>
        <text
          x="100"
          y="108"
          textAnchor="middle"
          dominantBaseline="middle"
          fontSize="8"
          fill="rgba(148, 163, 184, 0.6)"
        >
          TRACK
        </text>
      </svg>
    </div>
  )
})

/**
 * Phase Indicator
 */
interface PhaseIndicatorProps {
  phase: MahjongGameBoardProps['phase']
  round: number
}

const PhaseIndicator = memo(function PhaseIndicator({
  phase,
  round,
}: PhaseIndicatorProps) {
  const phaseConfig = {
    WAITING: { label: 'Waiting', color: 'bg-slate-600 text-slate-200' },
    HUNTING: { label: 'Hunting Phase', color: 'bg-blue-600 text-blue-100' },
    ACTION: { label: 'Action Phase', color: 'bg-emerald-600 text-emerald-100' },
    RESOLUTION: { label: 'Resolution', color: 'bg-amber-600 text-amber-100' },
    ENDED: { label: 'Game Over', color: 'bg-purple-600 text-purple-100' },
  }

  const config = phaseConfig[phase]

  return (
    <div className="flex items-center gap-3">
      <div className={cn('px-4 py-2 rounded-lg font-semibold', config.color)}>
        {config.label}
      </div>
      {phase !== 'WAITING' && phase !== 'ENDED' && (
        <div className="px-3 py-2 rounded-lg bg-slate-700/50 border border-slate-600">
          <span className="text-slate-400 text-sm">Round </span>
          <span className="text-slate-200 font-bold">{round}</span>
        </div>
      )}
    </div>
  )
})

// ============================================
// MAIN COMPONENT
// ============================================

export const MahjongGameBoard = memo(function MahjongGameBoard({
  players,
  stoneBank,
  phase,
  round,
  onTakeStone,
  onCardSelect,
  onCardPlay,
  centerContent,
  showDetailedSouth = true,
  className,
  children,
}: MahjongGameBoardProps) {
  const allPlayers = useMemo(() => {
    return [players.SOUTH, players.NORTH, players.EAST, players.WEST]
  }, [players])

  const isYourTurn = players.SOUTH?.isCurrentTurn ?? false

  return (
    <div
      className={cn(
        'relative w-full min-h-screen overflow-hidden',
        'bg-gradient-to-b from-slate-950 via-emerald-950/20 to-slate-950',
        className
      )}
      data-testid="mahjong-game-board"
    >
      {/* Felt Texture Overlay */}
      <div
        className="absolute inset-0 opacity-10 pointer-events-none"
        style={{
          backgroundImage: `
            radial-gradient(circle at 3px 3px, rgba(16, 185, 129, 0.4) 1px, transparent 0),
            radial-gradient(circle at 13px 13px, rgba(16, 185, 129, 0.2) 1px, transparent 0)
          `,
          backgroundSize: '20px 20px, 20px 20px',
        }}
      />

      {/* Vignette Effect */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse at center, transparent 30%, rgba(0,0,0,0.4) 100%)',
        }}
      />

      {/* Main Grid Layout */}
      <div
        className={cn(
          'relative grid min-h-screen p-3 gap-3',
          // Mobile: Stack vertically
          'grid-cols-1 grid-rows-[auto_1fr_auto]',
          // Tablet & Desktop: Full mahjong layout
          'md:grid-cols-[180px_1fr_180px]',
          'md:grid-rows-[140px_1fr_auto]',
          'lg:grid-cols-[200px_1fr_200px]',
          'lg:grid-rows-[160px_1fr_auto]',
          'lg:p-4 lg:gap-4'
        )}
      >
        {/* ===== TOP ROW ===== */}

        {/* Top-Left: Phase Indicator (Desktop) */}
        <div className="hidden md:flex items-start justify-start pt-2">
          <PhaseIndicator phase={phase} round={round} />
        </div>

        {/* Top-Center: NORTH Opponent */}
        <div className="order-1 md:order-none">
          <OpponentSeat player={players.NORTH} position="NORTH" />
        </div>

        {/* Top-Right: Empty or decoration */}
        <div className="hidden md:block" />

        {/* ===== MIDDLE ROW ===== */}

        {/* Left: WEST Opponent */}
        <div className="hidden md:block">
          <OpponentSeat player={players.WEST} position="WEST" />
        </div>

        {/* Center Area */}
        <div
          className={cn(
            'order-2 md:order-none',
            'flex flex-col items-center justify-center gap-4 p-4',
            'bg-gradient-to-br from-emerald-900/10 via-green-900/20 to-emerald-950/10',
            'rounded-2xl border border-emerald-800/20',
            'min-h-[300px]'
          )}
          data-testid="center-area"
        >
          {/* Mobile Phase Indicator */}
          <div className="md:hidden">
            <PhaseIndicator phase={phase} round={round} />
          </div>

          {/* Score Track */}
          <SpiralScoreTrack players={allPlayers} />

          {/* Stone Bank */}
          <StoneBank
            stoneBank={stoneBank}
            onTakeStone={onTakeStone}
            disabled={!isYourTurn}
          />

          {/* Custom Center Content */}
          {centerContent}
        </div>

        {/* Right: EAST Opponent */}
        <div className="hidden md:block">
          <OpponentSeat player={players.EAST} position="EAST" />
        </div>

        {/* ===== BOTTOM ROW ===== */}

        {/* Bottom spans full width on tablet+ */}
        <div className="order-3 md:order-none md:col-span-3">
          {showDetailedSouth ? (
            <CurrentPlayerSeat
              player={players.SOUTH}
              onCardSelect={onCardSelect}
              onCardPlay={onCardPlay}
            />
          ) : (
            <OpponentSeat player={players.SOUTH} position="SOUTH" />
          )}
        </div>

        {/* Mobile: Side opponents */}
        <div className="order-4 flex gap-3 md:hidden">
          <div className="flex-1">
            <OpponentSeat player={players.WEST} position="WEST" />
          </div>
          <div className="flex-1">
            <OpponentSeat player={players.EAST} position="EAST" />
          </div>
        </div>
      </div>

      {/* Overlay Children */}
      {children}
    </div>
  )
})

export default MahjongGameBoard
