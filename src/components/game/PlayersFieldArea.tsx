/**
 * PlayersFieldArea Component
 * Displays all players' field cards - each player gets a horizontal row
 * Integrated with hand preview and current turn cards display
 * @version 5.2.0 - Field cards now scroll horizontally instead of wrapping
 */
console.log('[components/game/PlayersFieldArea.tsx] v5.2.0 loaded')

import { memo, useMemo, useCallback, useState } from 'react'
import { Card } from './Card'
import { PlayerMarker } from './PlayerMarker'
import { CardPreviewModal } from './CardPreviewModal'
import { PlayerHandPreview } from './PlayerHandPreview'
import { type PlayerColor, PLAYER_COLORS } from '@/types/player-color'
import type { CardInstance } from '@/types/cards'
import { cn } from '@/lib/utils'
import { getElementSellValue } from '@/services/multiplayer-game'

// ============================================
// TYPES
// ============================================

export interface PlayerFieldData {
  playerId: string
  name: string
  color: PlayerColor
  fieldCards: CardInstance[]
  sanctuaryCards?: CardInstance[]  // Cards in sanctuary (expansion mode)
  handCount: number  // Number of cards in hand
  currentTurnCards?: CardInstance[]  // Cards drawn/selected this turn
  selectedArtifact?: CardInstance  // Selected artifact card
  isCurrentTurn: boolean
  hasPassed: boolean
  maxFieldSlots?: number  // Maximum field slots available (default: 10)
}

export interface PlayersFieldAreaProps {
  /** Array of player field data */
  players: PlayerFieldData[]
  /** Current player's ID (self) */
  currentPlayerId: string
  /** Current game phase */
  phase?: 'WAITING' | 'HUNTING' | 'ACTION' | 'RESOLUTION' | 'ENDED'
  /** Current round number (for showing "new this round" badge) */
  currentRound?: number
  /** Callback when a card is clicked (optional) */
  onCardClick?: (playerId: string, cardId: string) => void
  /** Callback when a card is returned to hand (optional) */
  onCardReturn?: (playerId: string, cardId: string) => void
  /** Callback when a card is discarded from field (optional) */
  onCardDiscard?: (playerId: string, cardId: string) => void
  /** Callback when a current turn card is moved to hand (optional) */
  onCurrentCardMoveToHand?: (playerId: string, cardId: string) => void
  /** Callback when a current turn card is sold (optional) */
  onCurrentCardSell?: (playerId: string, cardId: string) => void
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
  phase?: 'WAITING' | 'HUNTING' | 'ACTION' | 'RESOLUTION' | 'ENDED'
  currentRound?: number
  onCardClick?: (cardId: string) => void
  onCardReturn?: (cardId: string) => void
  onCardDiscard?: (cardId: string) => void
  onCurrentCardMoveToHand?: (cardId: string) => void
  onCurrentCardSell?: (cardId: string) => void
  onCurrentTurnCardClick?: (cardId: string) => void
}

const PlayerFieldSection = memo(function PlayerFieldSection({
  player,
  isCurrentPlayer,
  position,
  phase,
  currentRound,
  onCardClick,
  onCardReturn,
  onCardDiscard,
  onCurrentCardMoveToHand,
  onCurrentCardSell,
  onCurrentTurnCardClick,
}: PlayerFieldSectionProps) {
  const colorConfig = PLAYER_COLORS[player.color]

  const handleCardClick = useCallback((cardId: string) => {
    onCardClick?.(cardId)
  }, [onCardClick])

  const handleCardReturn = useCallback((cardId: string) => {
    onCardReturn?.(cardId)
  }, [onCardReturn])

  const handleCardDiscard = useCallback((cardId: string) => {
    onCardDiscard?.(cardId)
  }, [onCardDiscard])

  const handleCurrentCardMoveToHand = useCallback((cardId: string) => {
    console.log('[PlayerFieldSection] handleCurrentCardMoveToHand called:', { playerId: player.playerId, cardId })
    onCurrentCardMoveToHand?.(cardId)
  }, [onCurrentCardMoveToHand, player.playerId])

  const handleCurrentCardSell = useCallback((cardId: string) => {
    console.log('[PlayerFieldSection] handleCurrentCardSell called:', { playerId: player.playerId, cardId })
    onCurrentCardSell?.(cardId)
  }, [onCurrentCardSell, player.playerId])

  // Get phase label for current turn cards
  const getPhaseLabel = () => {
    if (phase === 'HUNTING') return '選卡階段'
    if (phase === 'ACTION') return '行動階段'
    return '本回合卡片'
  }

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

      {/* Main Content: Current Turn Cards + Field Cards in same row */}
      <div className="flex gap-4">
        {/* All Cards Container - Current Turn Cards + Field Cards in one row */}
        <div className="flex-1">
          <div className="flex flex-col gap-2">
            {/* Cards Row - Action Phase Slots + Divider + Field Cards */}
            <div className="flex gap-4 items-start">
              {/* Action Phase Section - Fixed 2 slots - Always show during player's turn */}
              {player.isCurrentTurn ? (
                  <div className="flex-shrink-0 p-3 rounded-lg bg-blue-900/20 border-2 border-blue-500/40">
                    {/* Phase Label */}
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-xs font-bold text-blue-300 uppercase tracking-wider">
                        ⚡ {getPhaseLabel()}
                      </span>
                      {player.isCurrentTurn && (
                        <span className="text-xs text-blue-200 bg-blue-500/30 px-2 py-0.5 rounded-full font-semibold">
                          進行中
                        </span>
                      )}
                    </div>

                    {/* Fixed 2 Slots for Action Phase Cards */}
                    <div className="flex gap-2">
                      {[0, 1].map((slotIndex) => {
                        const card = player.currentTurnCards?.[slotIndex]
                        return (
                          <div
                            key={`action-slot-${slotIndex}`}
                            className={cn(
                              'relative rounded-lg transition-all duration-200 flex items-center justify-center',
                              card
                                ? 'bg-transparent'
                                : 'border-2 border-dashed border-blue-400/30 bg-blue-900/10'
                            )}
                            style={{
                              width: '11rem',    // 176px - slightly larger than card (168px)
                              height: '16.5rem', // 264px - slightly larger than card (252px)
                            }}
                          >
                            {card ? (
                              <div className="relative group h-full">
                                <div
                                  className="relative h-full"
                                  onMouseEnter={(e) => {
                                    e.currentTarget.style.zIndex = '999'
                                  }}
                                  onMouseLeave={(e) => {
                                    e.currentTarget.style.zIndex = String(slotIndex)
                                  }}
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    onCurrentTurnCardClick?.(card.instanceId)
                                  }}
                                >
                                  <Card
                                    card={card}
                                    index={slotIndex}
                                    compact={true}
                                    currentRound={currentRound}
                                    className="shadow-md ring-2 ring-blue-400/50"
                                  />

                                  {/* Action buttons for Current Turn Cards */}
                                  {isCurrentPlayer && player.isCurrentTurn && (
                                    <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-20">
                                      {/* Move to Hand button */}
                                      {onCurrentCardMoveToHand && (
                                        <button
                                          onClick={(e) => {
                                            e.stopPropagation()
                                            handleCurrentCardMoveToHand(card.instanceId)
                                          }}
                                          className={cn(
                                            'px-2 py-1 text-xs rounded-md',
                                            'bg-green-600 hover:bg-green-500 text-white',
                                            'shadow-lg border border-green-400/50',
                                            'whitespace-nowrap'
                                          )}
                                          type="button"
                                          title="加入手牌"
                                        >
                                          上手
                                        </button>
                                      )}

                                      {/* Sell button */}
                                      {onCurrentCardSell && (() => {
                                        const sellValue = getElementSellValue(card.element)
                                        return (
                                          <button
                                            onClick={(e) => {
                                              e.stopPropagation()
                                              handleCurrentCardSell(card.instanceId)
                                            }}
                                            className={cn(
                                              'px-2 py-1 text-xs rounded-md',
                                              'bg-amber-600 hover:bg-amber-500 text-white',
                                              'shadow-lg border border-amber-400/50',
                                              'whitespace-nowrap'
                                            )}
                                            type="button"
                                            title={`賣掉換 ${sellValue} 元`}
                                          >
                                            賣 {sellValue}元
                                          </button>
                                        )
                                      })()}
                                    </div>
                                  )}
                                </div>
                              </div>
                            ) : (
                              // Empty slot placeholder
                              <div className="flex items-center justify-center h-full">
                                <span className="text-xs text-blue-400/50">
                                  空位 {slotIndex + 1}
                                </span>
                              </div>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  </div>
                ) : null}

                {/* Vertical Divider */}
                {player.isCurrentTurn ? (
                  <div className="flex-shrink-0 w-1 bg-gradient-to-b from-blue-500/20 via-slate-600 to-blue-500/20 self-stretch rounded-full" />
                ) : null}

                {/* Field Cards Section */}
                <div className="flex-1 min-w-0 p-3 rounded-lg bg-slate-800/30 border-2 border-slate-600/30">
                  {/* Field Label */}
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                      🏰 場上怪獸
                    </span>
                    <span className="text-xs text-slate-400 bg-slate-700/30 px-2 py-0.5 rounded-full">
                      {player.fieldCards.length} / {player.maxFieldSlots || 10}
                    </span>
                  </div>

                  <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-slate-600 scrollbar-track-slate-800/50">
                    {/* Render slots with cards or empty placeholders */}
                    {Array.from({ length: player.maxFieldSlots || 10 }).map((_, slotIndex) => {
                      const card = player.fieldCards[slotIndex]
                      return (
                        <div
                          key={`field-slot-${slotIndex}`}
                          className={cn(
                            'relative rounded-lg transition-all duration-200 flex items-center justify-center flex-shrink-0',
                            card
                              ? 'bg-transparent'
                              : 'border-2 border-dashed border-slate-600/30 bg-slate-800/20'
                          )}
                          style={{
                            width: '11rem',    // 176px - slightly larger than card (168px)
                            height: '16.5rem', // 264px - slightly larger than card (252px)
                          }}
                        >
                          {card ? (
                            <div className="relative group h-full">
                              <div
                                className="relative h-full"
                                onMouseEnter={(e) => {
                                  e.currentTarget.style.zIndex = '999'
                                }}
                                onMouseLeave={(e) => {
                                  e.currentTarget.style.zIndex = String(slotIndex)
                                }}
                                onClick={(e) => {
                                  e.stopPropagation()
                                  e.currentTarget.style.zIndex = '999'
                                }}
                              >
                                <Card
                                  card={card}
                                  index={slotIndex}
                                  compact={true}
                                  currentRound={currentRound}
                                  onClick={onCardClick ? () => handleCardClick(card.instanceId) : undefined}
                                  className={cn(
                                    'shadow-md',
                                    player.isCurrentTurn && 'ring-1 ring-vale-500/30'
                                  )}
                                />

                                {/* Action buttons for Field Cards - only for current player */}
                                {isCurrentPlayer && (
                                  <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-20">
                                    {/* Return to Hand button */}
                                    {player.isCurrentTurn && !player.hasPassed && (phase === 'ACTION' || phase === 'RESOLUTION') && onCardReturn && (
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation()
                                          handleCardReturn(card.instanceId)
                                        }}
                                        className={cn(
                                          'px-2 py-1 text-xs rounded-md',
                                          'bg-blue-600 hover:bg-blue-500 text-white',
                                          'shadow-lg border border-blue-400/50',
                                          'whitespace-nowrap'
                                        )}
                                        type="button"
                                        title="回到手牌"
                                      >
                                        回手
                                      </button>
                                    )}

                                    {/* Discard button */}
                                    {onCardDiscard && (
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation()
                                          handleCardDiscard(card.instanceId)
                                        }}
                                        className={cn(
                                          'px-2 py-1 text-xs rounded-md',
                                          'bg-red-600 hover:bg-red-500 text-white',
                                          'shadow-lg border border-red-400/50',
                                          'whitespace-nowrap'
                                        )}
                                        type="button"
                                        title="棄置到棄牌堆"
                                      >
                                        棄置
                                      </button>
                                    )}
                                  </div>
                                )}
                              </div>
                            </div>
                          ) : (
                            // Empty slot placeholder
                            <div className="flex items-center justify-center h-full">
                              <span className="text-xs text-slate-500/50">
                                {slotIndex + 1}
                              </span>
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                </div>

                {/* Sanctuary - Stacked Cards on Right Side */}
                {player.sanctuaryCards && player.sanctuaryCards.length > 0 && (
                  <div className="flex-shrink-0 border-l-2 border-amber-500/30 pl-4">
                    <div className="text-xs text-amber-400 mb-2 flex items-center gap-2">
                      <span className="font-semibold">棲息地</span>
                      <span className="bg-amber-500/20 px-2 py-0.5 rounded-full">
                        {player.sanctuaryCards.length}
                      </span>
                    </div>
                    <div className="relative" style={{ width: '120px', minHeight: '160px' }}>
                      {player.sanctuaryCards.map((card, index) => (
                        <div
                          key={card.instanceId}
                          className="absolute transition-all duration-200"
                          style={{
                            left: `${index * 15}px`,
                            top: `${index * 6}px`,
                            zIndex: index,
                          }}
                        >
                          <Card
                            card={card}
                            index={index}
                            compact={true}
                            className="shadow-lg pointer-events-none"
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
        </div>
      </div>

      {/* Hand Preview - Below field cards */}
      <div className="mt-4 pt-3 border-t border-slate-700/30">
        <PlayerHandPreview
          handCount={player.handCount}
          playerName={player.name}
        />
      </div>

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
  phase,
  currentRound,
  onCardClick,
  onCardReturn,
  onCardDiscard,
  onCurrentCardMoveToHand,
  onCurrentCardSell,
  className,
}: PlayersFieldAreaProps) {
  console.log('[PlayersFieldArea] Props received:', {
    hasOnCurrentCardMoveToHand: !!onCurrentCardMoveToHand,
    hasOnCurrentCardSell: !!onCurrentCardSell,
  })

  // Card preview state
  const [previewCard, setPreviewCard] = useState<CardInstance | null>(null)

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
    // Find the clicked card
    const player = players.find(p => p.playerId === playerId)
    const card = player?.fieldCards.find(c => c.instanceId === cardId)

    if (card) {
      // Show preview modal
      setPreviewCard(card)
    }

    // Also call the original callback if provided
    onCardClick?.(playerId, cardId)
  }, [players, onCardClick])

  const handleCurrentTurnCardClick = useCallback((playerId: string, cardId: string) => {
    // Find the clicked card from current turn cards
    const player = players.find(p => p.playerId === playerId)
    const card = player?.currentTurnCards?.find(c => c.instanceId === cardId)

    if (card) {
      // Show preview modal
      setPreviewCard(card)
    }
  }, [players])

  const handlePlayerCardReturn = useCallback((playerId: string, cardId: string) => {
    onCardReturn?.(playerId, cardId)
  }, [onCardReturn])

  const handlePlayerCardDiscard = useCallback((playerId: string, cardId: string) => {
    onCardDiscard?.(playerId, cardId)
  }, [onCardDiscard])

  const handlePlayerCurrentCardMoveToHand = useCallback((playerId: string, cardId: string) => {
    console.log('[PlayersFieldArea] handlePlayerCurrentCardMoveToHand called:', {
      playerId,
      cardId,
      callbackExists: !!onCurrentCardMoveToHand,
      callbackType: typeof onCurrentCardMoveToHand
    })
    if (onCurrentCardMoveToHand) {
      onCurrentCardMoveToHand(playerId, cardId)
    } else {
      console.error('[PlayersFieldArea] onCurrentCardMoveToHand is undefined!')
    }
  }, [onCurrentCardMoveToHand])

  const handlePlayerCurrentCardSell = useCallback((playerId: string, cardId: string) => {
    console.log('[PlayersFieldArea] handlePlayerCurrentCardSell called:', {
      playerId,
      cardId,
      callbackExists: !!onCurrentCardSell,
      callbackType: typeof onCurrentCardSell
    })
    if (onCurrentCardSell) {
      onCurrentCardSell(playerId, cardId)
    } else {
      console.error('[PlayersFieldArea] onCurrentCardSell is undefined!')
    }
  }, [onCurrentCardSell])

  return (
    <>
      <section
        className={cn(
          'bg-slate-800/20 rounded-xl border border-slate-700/30 p-2',
          className
        )}
        data-testid="players-field-area"
      >
        {/* Header - Removed to save space */}

        {/* Players' Fields - Stacked Rows (每個玩家一列) */}
        <div className="space-y-1">
          {sortedPlayers.map((player) => (
            <PlayerFieldSection
              key={player.playerId}
              player={player}
              isCurrentPlayer={player.playerId === currentPlayerId}
              position="grid"
              phase={phase}
              currentRound={currentRound}
              onCardClick={(cardId) => handlePlayerCardClick(player.playerId, cardId)}
              onCardReturn={(cardId) => handlePlayerCardReturn(player.playerId, cardId)}
              onCardDiscard={(cardId) => handlePlayerCardDiscard(player.playerId, cardId)}
              onCurrentCardMoveToHand={(cardId) => handlePlayerCurrentCardMoveToHand(player.playerId, cardId)}
              onCurrentCardSell={(cardId) => handlePlayerCurrentCardSell(player.playerId, cardId)}
              onCurrentTurnCardClick={(cardId) => handleCurrentTurnCardClick(player.playerId, cardId)}
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

      {/* Card Preview Modal */}
      <CardPreviewModal
        card={previewCard}
        isOpen={!!previewCard}
        onClose={() => setPreviewCard(null)}
      />
    </>
  )
})

export default PlayersFieldArea
