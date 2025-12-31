/**
 * PlayersFieldArea Component
 * Displays all players' field cards - each player gets a horizontal row
 * @version 1.3.0 - Cards wrap to new row after 5 cards
 */
console.log('[components/game/PlayersFieldArea.tsx] v1.3.0 loaded')

import { memo, useMemo, useCallback } from 'react'
import { Card } from './Card'
import { PlayerMarker } from './PlayerMarker'
import { type PlayerColor, PLAYER_COLORS } from '@/types/player-color'
import type { CardInstance } from '@/types/cards'
import { cn } from '@/lib/utils'

// ============================================
// TYPES
// ============================================

export interface PlayerFieldData {
  playerId: string
  name: string
  color: PlayerColor
  fieldCards: CardInstance[]
  isCurrentTurn: boolean
  hasPassed: boolean
}

export interface PlayersFieldAreaProps {
  /** Array of player field data */
  players: PlayerFieldData[]
  /** Current player's ID (self) */
  currentPlayerId: string
  /** Callback when a card is clicked (optional) */
  onCardClick?: (playerId: string, cardId: string) => void
  /** Callback when a card is returned to hand (optional) */
  onCardReturn?: (playerId: string, cardId: string) => void
  /** Additional CSS classes */
  className?: string
}

// ============================================
// PLAYER FIELD SECTION COMPONENT
// ============================================

interface PlayerFieldSectionProps {
  player: PlayerFieldData
  isCurrentPlayer: boolean
  position: 'top' | 'bottom' | 'left' | 'right' | 'grid'
  onCardClick?: (cardId: string) => void
  onCardReturn?: (cardId: string) => void
}

const PlayerFieldSection = memo(function PlayerFieldSection({
  player,
  isCurrentPlayer,
  position,
  onCardClick,
  onCardReturn,
}: PlayerFieldSectionProps) {
  const colorConfig = PLAYER_COLORS[player.color]

  const handleCardClick = useCallback((cardId: string) => {
    onCardClick?.(cardId)
  }, [onCardClick])

  const handleCardReturn = useCallback((cardId: string) => {
    onCardReturn?.(cardId)
  }, [onCardReturn])

  return (
    <div
      className={cn(
        'relative p-3 rounded-xl border-2 transition-all duration-300',
        // Base styles
        'bg-slate-800/40 backdrop-blur-sm',
        // Current turn highlight
        player.isCurrentTurn && !player.hasPassed && [
          'border-vale-500/70',
          'shadow-lg shadow-vale-500/20',
        ],
        // Self highlight
        isCurrentPlayer && !player.isCurrentTurn && 'border-slate-500/50',
        // Default border
        !player.isCurrentTurn && !isCurrentPlayer && 'border-slate-700/30',
        // Passed state
        player.hasPassed && 'opacity-60',
        // Position-specific sizing
        position === 'grid' && 'min-h-[180px]'
      )}
      data-testid={`player-field-${player.playerId}`}
    >
      {/* Player Header */}
      <div className="flex items-center gap-2 mb-3">
        <PlayerMarker
          color={player.color}
          size="sm"
          showGlow={player.isCurrentTurn && !player.hasPassed}
          playerName={player.name}
        />
        <span
          className={cn(
            'text-sm font-semibold truncate',
            isCurrentPlayer ? 'text-vale-400' : 'text-slate-300'
          )}
        >
          {player.name}
          {isCurrentPlayer && ' (你)'}
        </span>
        {player.isCurrentTurn && !player.hasPassed && (
          <span className="ml-auto text-xs text-vale-400 bg-vale-500/20 px-2 py-0.5 rounded-full">
            回合中
          </span>
        )}
        {player.hasPassed && (
          <span className="ml-auto text-xs text-slate-500">已跳過</span>
        )}
        <span className="text-xs text-slate-500">
          ({player.fieldCards.length} 張)
        </span>
      </div>

      {/* Cards Container - Wraps after 5 cards */}
      {player.fieldCards.length === 0 ? (
        <div className="flex items-center justify-center h-24 text-slate-600 text-sm">
          <span>尚無場上卡片</span>
        </div>
      ) : (
        <div className="flex flex-wrap gap-2">
          {player.fieldCards.map((card, index) => (
            <div
              key={card.instanceId}
              className="relative group transform transition-transform duration-200 hover:scale-105 hover:z-10"
            >
              <Card
                card={card}
                index={index}
                compact={true}
                onClick={() => handleCardClick(card.instanceId)}
                className={cn(
                  'shadow-md',
                  player.isCurrentTurn && 'ring-1 ring-vale-500/30'
                )}
              />
              {/* Return button - only show for current player's own cards during their turn */}
              {isCurrentPlayer && player.isCurrentTurn && !player.hasPassed && onCardReturn && (
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    handleCardReturn(card.instanceId)
                  }}
                  className={cn(
                    'absolute -bottom-2 left-1/2 -translate-x-1/2',
                    'px-2 py-1 text-xs rounded-md',
                    'bg-amber-600 hover:bg-amber-500 text-white',
                    'opacity-0 group-hover:opacity-100',
                    'transition-opacity duration-200',
                    'shadow-lg border border-amber-400/50',
                    'whitespace-nowrap z-20'
                  )}
                  type="button"
                >
                  撤回
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Decorative corner based on player color */}
      <div
        className="absolute top-0 left-0 w-3 h-3 rounded-tl-xl"
        style={{ backgroundColor: `${colorConfig.hex}40` }}
      />
      <div
        className="absolute top-0 right-0 w-3 h-3 rounded-tr-xl"
        style={{ backgroundColor: `${colorConfig.hex}40` }}
      />
    </div>
  )
})

// ============================================
// MAIN COMPONENT
// ============================================

export const PlayersFieldArea = memo(function PlayersFieldArea({
  players,
  currentPlayerId,
  onCardClick,
  onCardReturn,
  className,
}: PlayersFieldAreaProps) {
  // Sort players: self first, then others by index
  const sortedPlayers = useMemo(() => {
    const self = players.find(p => p.playerId === currentPlayerId)
    const others = players.filter(p => p.playerId !== currentPlayerId)
    return self ? [self, ...others] : players
  }, [players, currentPlayerId])

  // Calculate total cards on all fields
  const totalFieldCards = useMemo(() => {
    return players.reduce((sum, p) => sum + p.fieldCards.length, 0)
  }, [players])

  const handlePlayerCardClick = useCallback((playerId: string, cardId: string) => {
    onCardClick?.(playerId, cardId)
  }, [onCardClick])

  const handlePlayerCardReturn = useCallback((playerId: string, cardId: string) => {
    onCardReturn?.(playerId, cardId)
  }, [onCardReturn])

  return (
    <section
      className={cn(
        'bg-slate-800/20 rounded-xl border border-slate-700/30 p-4',
        className
      )}
      data-testid="players-field-area"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-slate-200">場上怪獸</h3>
        <span className="text-sm text-slate-500">
          共 {totalFieldCards} 張卡片
        </span>
      </div>

      {/* Players' Fields - Stacked Rows (每個玩家一列) */}
      <div className="space-y-3">
        {sortedPlayers.map((player) => (
          <PlayerFieldSection
            key={player.playerId}
            player={player}
            isCurrentPlayer={player.playerId === currentPlayerId}
            position="grid"
            onCardClick={(cardId) => handlePlayerCardClick(player.playerId, cardId)}
            onCardReturn={(cardId) => handlePlayerCardReturn(player.playerId, cardId)}
          />
        ))}
      </div>

      {/* Empty State */}
      {totalFieldCards === 0 && (
        <div className="text-center py-8 text-slate-500">
          <div className="text-4xl mb-2 opacity-30">-</div>
          <span>目前沒有玩家放置怪獸</span>
        </div>
      )}
    </section>
  )
})

export default PlayersFieldArea
