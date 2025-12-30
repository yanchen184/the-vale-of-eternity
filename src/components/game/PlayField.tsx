/**
 * PlayField Component
 * Displays cards on the battlefield for player and opponent
 * @version 1.0.0
 */
console.log('[components/game/PlayField.tsx] v1.0.0 loaded')

import { useState, useCallback, memo } from 'react'
import type { CardInstance } from '@/types/cards'
import { Card } from './Card'
import { cn } from '@/lib/utils'

// ============================================
// TYPES
// ============================================

export interface PlayFieldProps {
  /** Cards on player's field */
  playerCards: CardInstance[]
  /** Cards on opponent's field (optional for single player) */
  opponentCards?: CardInstance[]
  /** Maximum cards allowed on field */
  maxFieldSize?: number
  /** Selected card ID */
  selectedCardId?: string | null
  /** Whether this is the player's turn */
  isPlayerTurn?: boolean
  /** Whether to show opponent's cards face down */
  hideOpponentCards?: boolean
  /** Accept drag drop from hand */
  acceptDrop?: boolean
  /** Callback when a player card is selected */
  onCardSelect?: (cardId: string) => void
  /** Callback when a card attacks */
  onCardAttack?: (attackerId: string, targetId: string) => void
  /** Callback when card is dropped from hand */
  onCardDrop?: (cardId: string) => void
  /** Callback when card effect is activated */
  onActivateEffect?: (cardId: string) => void
  /** Additional CSS classes */
  className?: string
}

export interface FieldCardState {
  isTapped: boolean
  hasAttacked: boolean
  hasActivatedEffect: boolean
}

// ============================================
// CONSTANTS
// ============================================

const MAX_FIELD_SIZE = 5
// SLOT_WIDTH available for future layout calculations
// const SLOT_WIDTH = 144 // w-36 = 9rem = 144px

// ============================================
// EMPTY SLOT COMPONENT
// ============================================

interface EmptySlotProps {
  index: number
  isDropTarget: boolean
  onDragOver: (e: React.DragEvent) => void
  onDragLeave: () => void
  onDrop: (e: React.DragEvent) => void
}

const EmptySlot = memo(function EmptySlot({
  index,
  isDropTarget,
  onDragOver,
  onDragLeave,
  onDrop,
}: EmptySlotProps) {
  return (
    <div
      className={cn(
        'w-36 h-52 rounded-lg border-2 border-dashed transition-all duration-200',
        'flex items-center justify-center',
        isDropTarget
          ? 'border-vale-400 bg-vale-500/20 shadow-lg shadow-vale-500/30'
          : 'border-slate-600 bg-slate-800/30'
      )}
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
      data-testid={`field-slot-empty-${index}`}
    >
      <span className={cn(
        'text-sm transition-colors',
        isDropTarget ? 'text-vale-400' : 'text-slate-600'
      )}>
        {isDropTarget ? 'Drop Here' : 'Empty'}
      </span>
    </div>
  )
})

// ============================================
// FIELD CARD COMPONENT
// ============================================

interface FieldCardItemProps {
  card: CardInstance
  index: number
  isSelected: boolean
  isTapped: boolean
  isAttacking: boolean
  isTargeted: boolean
  canActivateEffect: boolean
  onSelect: () => void
  onActivateEffect?: () => void
}

const FieldCardItem = memo(function FieldCardItem({
  card,
  index,
  isSelected,
  isTapped,
  isAttacking,
  isTargeted,
  canActivateEffect,
  onSelect,
  onActivateEffect,
}: FieldCardItemProps) {
  return (
    <div
      className={cn(
        'relative transition-all duration-300',
        isTapped && 'rotate-90 opacity-70',
        isAttacking && 'animate-pulse scale-110',
        isTargeted && 'ring-2 ring-red-500'
      )}
      data-testid={`field-card-${index}`}
    >
      <Card
        card={card}
        index={index}
        compact
        isSelected={isSelected}
        onClick={onSelect}
        className={cn(
          'transition-all duration-200',
          isSelected && 'ring-2 ring-vale-400 shadow-lg shadow-vale-500/30'
        )}
      />

      {/* Effect activation button */}
      {canActivateEffect && card.effects.length > 0 && !card.hasUsedAbility && (
        <button
          onClick={(e) => {
            e.stopPropagation()
            onActivateEffect?.()
          }}
          className={cn(
            'absolute -top-2 -right-2 w-6 h-6 rounded-full',
            'bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold',
            'flex items-center justify-center',
            'shadow-lg shadow-purple-500/50',
            'transition-transform hover:scale-110',
            'animate-pulse'
          )}
          title="Activate Effect"
          data-testid={`field-card-${index}-effect-btn`}
        >
          !
        </button>
      )}

      {/* Tapped indicator */}
      {isTapped && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-lg">
          <span className="text-xs text-slate-300">Tapped</span>
        </div>
      )}
    </div>
  )
})

// ============================================
// FIELD SECTION COMPONENT
// ============================================

interface FieldSectionProps {
  title: string
  cards: CardInstance[]
  maxSize: number
  isOpponent: boolean
  hideCards: boolean
  selectedCardId: string | null
  attackingCardId: string | null
  targetedCardId: string | null
  acceptDrop: boolean
  dropTargetIndex: number | null
  onCardSelect?: (cardId: string) => void
  onActivateEffect?: (cardId: string) => void
  onDragOver: (e: React.DragEvent, index: number) => void
  onDragLeave: () => void
  onDrop: (e: React.DragEvent) => void
}

const FieldSection = memo(function FieldSection({
  title,
  cards,
  maxSize,
  isOpponent,
  hideCards,
  selectedCardId,
  attackingCardId,
  targetedCardId,
  acceptDrop,
  dropTargetIndex,
  onCardSelect,
  onActivateEffect,
  onDragOver,
  onDragLeave,
  onDrop,
}: FieldSectionProps) {
  const emptySlots = maxSize - cards.length

  return (
    <div
      className={cn(
        'relative p-4 rounded-xl border transition-colors duration-200',
        isOpponent
          ? 'bg-red-900/10 border-red-900/30'
          : 'bg-emerald-900/10 border-emerald-900/30'
      )}
      data-testid={isOpponent ? 'opponent-field' : 'player-field'}
    >
      {/* Section Header */}
      <div className="flex items-center justify-between mb-3">
        <h4 className={cn(
          'text-sm font-semibold',
          isOpponent ? 'text-red-400' : 'text-emerald-400'
        )}>
          {title}
        </h4>
        <span className="text-xs text-slate-500">
          {cards.length} / {maxSize}
        </span>
      </div>

      {/* Cards Grid */}
      <div className="flex gap-3 justify-center min-h-[220px] items-center overflow-x-auto">
        {cards.map((card, index) => (
          hideCards && isOpponent ? (
            <div
              key={card.instanceId}
              className="w-20 h-28 rounded-lg bg-slate-700 border-2 border-slate-600 flex items-center justify-center"
              data-testid={`opponent-card-hidden-${index}`}
            >
              <span className="text-2xl text-slate-500">?</span>
            </div>
          ) : (
            <FieldCardItem
              key={card.instanceId}
              card={card}
              index={index}
              isSelected={selectedCardId === card.instanceId}
              isTapped={false}
              isAttacking={attackingCardId === card.instanceId}
              isTargeted={targetedCardId === card.instanceId}
              canActivateEffect={!isOpponent}
              onSelect={() => onCardSelect?.(card.instanceId)}
              onActivateEffect={() => onActivateEffect?.(card.instanceId)}
            />
          )
        ))}

        {/* Empty Slots (only for player) */}
        {!isOpponent && acceptDrop && Array.from({ length: emptySlots }).map((_, i) => (
          <EmptySlot
            key={`empty-${i}`}
            index={cards.length + i}
            isDropTarget={dropTargetIndex === cards.length + i}
            onDragOver={(e) => onDragOver(e, cards.length + i)}
            onDragLeave={onDragLeave}
            onDrop={onDrop}
          />
        ))}

        {/* Show empty state if no cards and no drop slots */}
        {cards.length === 0 && (!acceptDrop || isOpponent) && (
          <div className="flex items-center justify-center w-full h-32 text-slate-500">
            <span>No creatures on field</span>
          </div>
        )}
      </div>
    </div>
  )
})

// ============================================
// MAIN COMPONENT
// ============================================

export const PlayField = memo(function PlayField({
  playerCards,
  opponentCards = [],
  maxFieldSize = MAX_FIELD_SIZE,
  selectedCardId = null,
  isPlayerTurn = true,
  hideOpponentCards = false,
  acceptDrop = true,
  onCardSelect,
  onCardAttack,
  onCardDrop,
  onActivateEffect,
  className,
}: PlayFieldProps) {
  const [dropTargetIndex, setDropTargetIndex] = useState<number | null>(null)
  // Attack states for future multiplayer functionality
  const [attackingCardId] = useState<string | null>(null)
  const [targetedCardId] = useState<string | null>(null)

  // Handle drag over
  const handleDragOver = useCallback((e: React.DragEvent, index: number) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
    setDropTargetIndex(index)
  }, [])

  // Handle drag leave
  const handleDragLeave = useCallback(() => {
    setDropTargetIndex(null)
  }, [])

  // Handle drop
  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    const cardId = e.dataTransfer.getData('cardId')
    const source = e.dataTransfer.getData('source')

    if (cardId && source === 'hand') {
      onCardDrop?.(cardId)
    }

    setDropTargetIndex(null)
  }, [onCardDrop])

  // Attack animation - available for future multiplayer functionality
  // const triggerAttack = useCallback((attackerId: string, targetId: string) => {
  //   setAttackingCardId(attackerId)
  //   setTargetedCardId(targetId)
  //   setTimeout(() => {
  //     setAttackingCardId(null)
  //     setTargetedCardId(null)
  //     onCardAttack?.(attackerId, targetId)
  //   }, 500)
  // }, [onCardAttack])
  void onCardAttack // Suppress unused variable warning

  return (
    <section
      className={cn(
        'relative bg-gradient-to-b from-slate-800/50 to-slate-900/50',
        'rounded-2xl border border-slate-700 p-4',
        className
      )}
      data-testid="play-field"
    >
      {/* Header */}
      <div className="flex items-center justify-center mb-4">
        <h3 className="text-lg font-semibold text-slate-200 font-game">
          Battlefield
        </h3>
      </div>

      {/* Opponent Field */}
      {opponentCards.length > 0 || !hideOpponentCards ? (
        <FieldSection
          title="Opponent's Field"
          cards={opponentCards}
          maxSize={maxFieldSize}
          isOpponent={true}
          hideCards={hideOpponentCards}
          selectedCardId={selectedCardId}
          attackingCardId={attackingCardId}
          targetedCardId={targetedCardId}
          acceptDrop={false}
          dropTargetIndex={null}
          onCardSelect={onCardSelect}
          onDragOver={() => {}}
          onDragLeave={() => {}}
          onDrop={() => {}}
        />
      ) : null}

      {/* Divider */}
      {opponentCards.length > 0 && (
        <div className="flex items-center my-4">
          <div className="flex-1 h-px bg-gradient-to-r from-transparent via-slate-600 to-transparent" />
          <span className="px-4 text-xs text-slate-500">VS</span>
          <div className="flex-1 h-px bg-gradient-to-r from-transparent via-slate-600 to-transparent" />
        </div>
      )}

      {/* Player Field */}
      <FieldSection
        title="Your Field"
        cards={playerCards}
        maxSize={maxFieldSize}
        isOpponent={false}
        hideCards={false}
        selectedCardId={selectedCardId}
        attackingCardId={attackingCardId}
        targetedCardId={targetedCardId}
        acceptDrop={acceptDrop && isPlayerTurn && playerCards.length < maxFieldSize}
        dropTargetIndex={dropTargetIndex}
        onCardSelect={onCardSelect}
        onActivateEffect={onActivateEffect}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      />

      {/* Turn Indicator */}
      <div className="absolute top-4 right-4">
        <div className={cn(
          'px-3 py-1 rounded-full text-xs font-medium',
          isPlayerTurn
            ? 'bg-emerald-600/20 text-emerald-400 border border-emerald-500/30'
            : 'bg-red-600/20 text-red-400 border border-red-500/30'
        )}>
          {isPlayerTurn ? 'Your Turn' : "Opponent's Turn"}
        </div>
      </div>

      {/* Field full warning */}
      {playerCards.length >= maxFieldSize && (
        <div className="mt-3 text-center text-xs text-amber-400">
          Field is full! Remove a creature to play more.
        </div>
      )}
    </section>
  )
})

export default PlayField
