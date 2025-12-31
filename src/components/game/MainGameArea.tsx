/**
 * MainGameArea Component
 * Central game area for multiplayer game - displays main gameplay content
 * Adapts based on game phase (HUNTING vs ACTION)
 * @version 1.0.0
 */
console.log('[components/game/MainGameArea.tsx] v1.0.0 loaded')

import { memo } from 'react'
import { cn } from '@/lib/utils'
import type { CardInstance } from '@/types/cards'
import type { PlayerFieldData } from './PlayersFieldArea'
import { type PlayerColor } from '@/types/player-color'

// ============================================
// TYPES
// ============================================

export type GamePhase = 'WAITING' | 'HUNTING' | 'ACTION' | 'RESOLUTION' | 'ENDED'

export interface MainGameAreaProps {
  /** Current game phase */
  phase: GamePhase
  /** Current player ID */
  currentPlayerId: string
  /** Whether it's the current player's turn */
  isYourTurn: boolean
  /** Current turn player's name */
  currentTurnPlayerName: string

  // === HUNTING PHASE PROPS ===
  /** Market cards for hunting phase */
  marketCards?: CardInstance[]
  /** Card selection map for hunting phase */
  cardSelectionMap?: Map<string, { color: PlayerColor; playerName: string; isConfirmed: boolean }>
  /** Currently selected card ID (not confirmed) */
  mySelectedCardId?: string | null
  /** Whether player has selected a card */
  hasSelectedCard?: boolean
  /** Toggle card selection */
  onToggleCard?: (cardId: string) => void
  /** Confirm selection */
  onConfirmSelection?: () => void

  // === ACTION PHASE PROPS ===
  /** Players field data for field area */
  playersFieldData?: PlayerFieldData[]
  /** Hand cards */
  handCards?: CardInstance[]
  /** Max hand size */
  maxHandSize?: number
  /** Card handlers */
  onCardPlay?: (cardId: string) => void
  onCardSell?: (cardId: string) => void
  onCardReturn?: (playerId: string, cardId: string) => void
  /** Check if card can be tamed */
  canTameCard?: (cardId: string) => boolean

  /** Additional CSS classes */
  className?: string
  /** Children for custom content */
  children?: React.ReactNode
}

// ============================================
// COMPACT HUNTING PHASE UI
// ============================================

interface CompactHuntingUIProps {
  marketCards: CardInstance[]
  isYourTurn: boolean
  currentTurnPlayerName: string
  cardSelectionMap: Map<string, { color: PlayerColor; playerName: string; isConfirmed: boolean }>
  mySelectedCardId: string | null
  hasSelectedCard: boolean
  onToggleCard: (cardId: string) => void
  onConfirmSelection: () => void
}

const CompactHuntingUI = memo(function CompactHuntingUI({
  marketCards,
  isYourTurn,
  currentTurnPlayerName,
  cardSelectionMap,
  mySelectedCardId,
  hasSelectedCard,
  onToggleCard,
  onConfirmSelection,
}: CompactHuntingUIProps) {
  // Import Card component dynamically to avoid circular dependency
  const Card = require('./Card').Card

  return (
    <div className="flex-1 flex flex-col p-4 overflow-hidden">
      {/* Header */}
      <div className="text-center mb-4 flex-shrink-0">
        <h2 className="text-xl font-bold text-blue-400 mb-1">選卡階段</h2>
        <p className="text-sm text-slate-400">
          {isYourTurn
            ? hasSelectedCard
              ? '點擊「確認選擇」鎖定卡片'
              : '點擊一張卡片進行選擇'
            : `等待 ${currentTurnPlayerName} 選擇卡片...`}
        </p>
      </div>

      {/* Card Grid - Scrollable */}
      <div className="flex-1 overflow-y-auto custom-scrollbar">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 justify-items-center pb-4">
          {marketCards.map((card, index) => {
            const selectionInfo = cardSelectionMap.get(card.instanceId)
            const isConfirmed = selectionInfo?.isConfirmed ?? false
            const isMySelection = mySelectedCardId === card.instanceId
            const canClick = isYourTurn && !isConfirmed

            return (
              <div
                key={card.instanceId}
                className={cn(
                  'transition-all relative',
                  canClick
                    ? 'hover:scale-105 cursor-pointer'
                    : isConfirmed
                      ? 'cursor-default'
                      : 'opacity-60 cursor-not-allowed'
                )}
                data-testid={`hunting-card-${index}`}
              >
                <Card
                  card={card}
                  index={index}
                  compact={true}
                  onClick={() => canClick && onToggleCard(card.instanceId)}
                  selectedByColor={selectionInfo?.color}
                  selectedByName={selectionInfo?.playerName}
                  isConfirmed={isConfirmed}
                  isSelected={isMySelection}
                  className={cn(
                    isMySelection && !isConfirmed && 'ring-4 ring-blue-400 ring-opacity-75',
                    canClick && 'hover:border-blue-400 hover:shadow-blue-500/50',
                    isConfirmed && 'border-slate-500'
                  )}
                />
                {isConfirmed && (
                  <div className="absolute inset-0 bg-black/30 rounded-lg pointer-events-none" />
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* Confirm Button */}
      {isYourTurn && (
        <div className="flex-shrink-0 pt-4 border-t border-slate-700/50">
          <button
            onClick={onConfirmSelection}
            disabled={!hasSelectedCard}
            className={cn(
              'w-full py-3 rounded-xl font-semibold text-white transition-all',
              hasSelectedCard
                ? 'bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 shadow-lg shadow-emerald-500/30 animate-pulse'
                : 'bg-slate-700 cursor-not-allowed text-slate-400'
            )}
            data-testid="confirm-selection-btn"
          >
            {hasSelectedCard ? '確認選擇' : '請先選擇一張卡片'}
          </button>
        </div>
      )}
    </div>
  )
})

// ============================================
// COMPACT ACTION PHASE UI
// ============================================

interface CompactActionUIProps {
  playersFieldData: PlayerFieldData[]
  handCards: CardInstance[]
  maxHandSize: number
  currentPlayerId: string
  isYourTurn: boolean
  onCardPlay: (cardId: string) => void
  onCardSell: (cardId: string) => void
  onCardReturn: (playerId: string, cardId: string) => void
  canTameCard: (cardId: string) => boolean
}

const CompactActionUI = memo(function CompactActionUI({
  playersFieldData,
  handCards,
  maxHandSize,
  currentPlayerId,
  isYourTurn,
  onCardPlay,
  onCardSell,
  onCardReturn,
  canTameCard,
}: CompactActionUIProps) {
  // Import components dynamically
  const { PlayersFieldArea } = require('./PlayersFieldArea')
  const { PlayerHand } = require('./PlayerHand')

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Field Area - Takes available space */}
      <div className="flex-1 overflow-y-auto p-3 custom-scrollbar">
        <PlayersFieldArea
          players={playersFieldData}
          currentPlayerId={currentPlayerId}
          onCardReturn={onCardReturn}
          className="min-h-0"
        />
      </div>

      {/* Hand Area - Fixed at bottom with max height */}
      <div className="flex-shrink-0 border-t border-purple-900/30 bg-gradient-to-t from-slate-900/80 to-transparent">
        <PlayerHand
          cards={handCards}
          maxHandSize={maxHandSize}
          showActions={isYourTurn}
          enableDrag={isYourTurn}
          onCardPlay={onCardPlay}
          onCardSell={onCardSell}
          canTameCard={canTameCard}
          className="rounded-none border-0 bg-transparent max-h-[280px]"
        />
      </div>
    </div>
  )
})

// ============================================
// MAIN COMPONENT
// ============================================

export const MainGameArea = memo(function MainGameArea({
  phase,
  currentPlayerId,
  isYourTurn,
  currentTurnPlayerName,
  // Hunting props
  marketCards = [],
  cardSelectionMap = new Map(),
  mySelectedCardId = null,
  hasSelectedCard = false,
  onToggleCard = () => {},
  onConfirmSelection = () => {},
  // Action props
  playersFieldData = [],
  handCards = [],
  maxHandSize = 10,
  onCardPlay = () => {},
  onCardSell = () => {},
  onCardReturn = () => {},
  canTameCard = () => true,
  // General
  className,
  children,
}: MainGameAreaProps) {
  return (
    <main
      className={cn(
        // Fill available space
        'flex-1 flex flex-col overflow-hidden',
        // Background
        'bg-gradient-to-b from-slate-800/20 to-slate-900/40',
        className
      )}
      data-testid="main-game-area"
    >
      {/* Hunting Phase */}
      {phase === 'HUNTING' && (
        <CompactHuntingUI
          marketCards={marketCards}
          isYourTurn={isYourTurn}
          currentTurnPlayerName={currentTurnPlayerName}
          cardSelectionMap={cardSelectionMap}
          mySelectedCardId={mySelectedCardId}
          hasSelectedCard={hasSelectedCard}
          onToggleCard={onToggleCard}
          onConfirmSelection={onConfirmSelection}
        />
      )}

      {/* Action Phase */}
      {phase === 'ACTION' && (
        <CompactActionUI
          playersFieldData={playersFieldData}
          handCards={handCards}
          maxHandSize={maxHandSize}
          currentPlayerId={currentPlayerId}
          isYourTurn={isYourTurn}
          onCardPlay={onCardPlay}
          onCardSell={onCardSell}
          onCardReturn={onCardReturn}
          canTameCard={canTameCard}
        />
      )}

      {/* Waiting Phase */}
      {phase === 'WAITING' && (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="text-6xl mb-4 animate-pulse">Waiting</div>
            <h2 className="text-2xl font-bold text-slate-300 mb-2">等待開始</h2>
            <p className="text-slate-500">等待房主開始遊戲...</p>
          </div>
        </div>
      )}

      {/* Resolution Phase */}
      {phase === 'RESOLUTION' && (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="text-6xl mb-4 animate-spin-slow">Calculating</div>
            <h2 className="text-2xl font-bold text-amber-400 mb-2">結算中</h2>
            <p className="text-slate-500">正在計算分數...</p>
          </div>
        </div>
      )}

      {/* Game Ended */}
      {phase === 'ENDED' && (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="text-6xl mb-4">Game Over</div>
            <h2 className="text-2xl font-bold text-purple-400 mb-2">遊戲結束</h2>
            <p className="text-slate-500">感謝遊玩！</p>
          </div>
        </div>
      )}

      {/* Custom Children */}
      {children}
    </main>
  )
})

export default MainGameArea
