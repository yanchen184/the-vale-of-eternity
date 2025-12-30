/**
 * GameBoard Page
 * Main game interface integrating all core UI components
 * @version 1.0.0
 */
console.log('[pages/GameBoard.tsx] v1.0.0 loaded')

import { useEffect, useCallback, useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { Home, RefreshCw, HelpCircle, Pause } from 'lucide-react'
import { Button } from '@/components/ui'
import { PlayerHand, PlayField, MarketArea, StonePool } from '@/components/game'
import {
  useGameStore,
  useGamePhase,
  useRound,
  useMarket,
  useHand,
  useField,
  useStones,
  useDeckSize,
  useGameOver,
  usePlayerName,
  useTotalStoneValue,
  useAvailableActions,
  SinglePlayerPhase,
  SinglePlayerActionType,
} from '@/stores'
import { Modal } from '@/components/ui/Modal'
import { cn } from '@/lib/utils'

// ============================================
// TYPES
// ============================================

interface GameHeaderProps {
  playerName: string
  round: number
  phase: SinglePlayerPhase | null
  deckSize: number
  onRestart: () => void
  onHome: () => void
  onHelp: () => void
  onPause: () => void
}

interface PhaseIndicatorProps {
  phase: SinglePlayerPhase | null
  availableActions: SinglePlayerActionType[]
}

interface GameOverModalProps {
  isOpen: boolean
  score: number | null
  reason: string | null
  onRestart: () => void
  onHome: () => void
}

// ============================================
// SUB-COMPONENTS
// ============================================

/**
 * Game Header Component
 */
function GameHeader({
  playerName,
  round,
  phase,
  deckSize,
  onRestart,
  onHome,
  onHelp,
  onPause,
}: GameHeaderProps) {
  const phaseLabels: Record<SinglePlayerPhase, string> = {
    [SinglePlayerPhase.DRAW]: 'Draw Phase',
    [SinglePlayerPhase.ACTION]: 'Action Phase',
    [SinglePlayerPhase.SCORE]: 'Score Phase',
  }

  return (
    <header
      className="bg-slate-800/80 backdrop-blur-sm border-b border-slate-700 sticky top-0 z-30"
      data-testid="game-header"
    >
      <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
        {/* Left: Game Info */}
        <div className="flex items-center gap-6">
          <div>
            <h1 className="text-xl font-bold text-slate-100 font-game">
              The Vale of Eternity
            </h1>
            <div className="flex items-center gap-4 text-sm">
              <span className="text-slate-400">
                Player: <span className="text-vale-400 font-medium">{playerName}</span>
              </span>
              <span className="text-slate-400">
                Round: <span className="text-amber-400 font-medium">{round}</span>
              </span>
              <span className="text-slate-400">
                Deck: <span className="text-slate-300 font-medium">{deckSize}</span>
              </span>
            </div>
          </div>

          {/* Phase Indicator */}
          {phase && (
            <div className={cn(
              'px-4 py-2 rounded-lg border',
              phase === SinglePlayerPhase.DRAW && 'bg-blue-900/30 border-blue-500/50 text-blue-400',
              phase === SinglePlayerPhase.ACTION && 'bg-emerald-900/30 border-emerald-500/50 text-emerald-400',
              phase === SinglePlayerPhase.SCORE && 'bg-amber-900/30 border-amber-500/50 text-amber-400'
            )}>
              <span className="font-medium">{phaseLabels[phase]}</span>
            </div>
          )}
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={onHelp}
            leftIcon={<HelpCircle className="h-4 w-4" />}
            data-testid="help-btn"
          >
            Help
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={onPause}
            leftIcon={<Pause className="h-4 w-4" />}
            data-testid="pause-btn"
          >
            Pause
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={onRestart}
            leftIcon={<RefreshCw className="h-4 w-4" />}
            data-testid="restart-btn"
          >
            Restart
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={onHome}
            leftIcon={<Home className="h-4 w-4" />}
            data-testid="home-btn"
          >
            Home
          </Button>
        </div>
      </div>
    </header>
  )
}

/**
 * Phase Instructions Component
 */
function PhaseInstructions({ phase }: PhaseIndicatorProps) {
  const getInstructions = () => {
    switch (phase) {
      case SinglePlayerPhase.DRAW:
        return {
          title: 'Draw Phase',
          description: 'Draw a card from the deck to add to your hand.',
          actions: ['Click the deck or "Draw Card" button'],
        }
      case SinglePlayerPhase.ACTION:
        return {
          title: 'Action Phase',
          description: 'Tame creatures from your hand or the market, or pass to end your turn.',
          actions: [
            'Tame from hand: Play a creature to your field',
            'Tame from market: Purchase and play a creature',
            'Pass: Skip to next round',
          ],
        }
      case SinglePlayerPhase.SCORE:
        return {
          title: 'Scoring Phase',
          description: 'Game has ended. View your final score.',
          actions: [],
        }
      default:
        return {
          title: 'Waiting...',
          description: 'Game is loading.',
          actions: [],
        }
    }
  }

  const instructions = getInstructions()

  return (
    <div
      className="bg-slate-800/50 rounded-xl border border-slate-700 p-4"
      data-testid="phase-instructions"
    >
      <h4 className="text-sm font-semibold text-slate-200 mb-2">
        {instructions.title}
      </h4>
      <p className="text-sm text-slate-400 mb-2">
        {instructions.description}
      </p>
      {instructions.actions.length > 0 && (
        <ul className="text-xs text-slate-500 space-y-1">
          {instructions.actions.map((action, i) => (
            <li key={i} className="flex items-start gap-2">
              <span className="text-vale-400">-</span>
              <span>{action}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

/**
 * Game Over Modal Component
 */
function GameOverModal({ isOpen, score, reason, onRestart, onHome }: GameOverModalProps) {
  const reasonText = {
    DECK_EMPTY: 'The deck is empty!',
    MANUAL_END: 'Game ended manually.',
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={() => {}}
      title="Game Over"
      showCloseButton={false}
      size="md"
    >
      <div className="text-center py-6">
        {/* Score Display */}
        <div className="mb-6">
          <div className="text-sm text-slate-400 mb-2">Final Score</div>
          <div className="text-6xl font-bold text-vale-400 mb-2">{score ?? 0}</div>
          <div className="text-sm text-slate-500">
            {reason && reasonText[reason as keyof typeof reasonText]}
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-4 justify-center">
          <Button onClick={onRestart} data-testid="play-again-btn">
            Play Again
          </Button>
          <Button variant="secondary" onClick={onHome} data-testid="go-home-btn">
            Home
          </Button>
        </div>
      </div>
    </Modal>
  )
}

/**
 * Action Buttons Component
 */
function ActionButtons({
  phase,
  availableActions,
  onDrawCard,
  onPass,
  onEndGame,
}: {
  phase: SinglePlayerPhase | null
  availableActions: SinglePlayerActionType[]
  onDrawCard: () => void
  onPass: () => void
  onEndGame: () => void
}) {
  const canDraw = availableActions.includes(SinglePlayerActionType.DRAW_CARD)
  const canPass = availableActions.includes(SinglePlayerActionType.PASS)
  const canEnd = availableActions.includes(SinglePlayerActionType.END_GAME)

  return (
    <div className="flex gap-3 justify-center" data-testid="action-buttons">
      {phase === SinglePlayerPhase.DRAW && canDraw && (
        <Button
          onClick={onDrawCard}
          className="px-8"
          data-testid="draw-card-btn"
        >
          Draw Card
        </Button>
      )}

      {phase === SinglePlayerPhase.ACTION && (
        <>
          {canPass && (
            <Button
              variant="secondary"
              onClick={onPass}
              data-testid="pass-btn"
            >
              Pass Turn
            </Button>
          )}
          {canEnd && (
            <Button
              variant="outline"
              onClick={onEndGame}
              data-testid="end-game-btn"
            >
              End Game
            </Button>
          )}
        </>
      )}
    </div>
  )
}

// ============================================
// MAIN COMPONENT
// ============================================

export function GameBoard() {
  const navigate = useNavigate()

  // Store hooks
  const gameState = useGameStore((state) => state.gameState)
  const error = useGameStore((state) => state.error)
  const setError = useGameStore((state) => state.setError)
  const startGame = useGameStore((state) => state.startGame)
  const resetGame = useGameStore((state) => state.resetGame)
  const drawCard = useGameStore((state) => state.drawCard)
  const tameCreature = useGameStore((state) => state.tameCreature)
  const pass = useGameStore((state) => state.pass)
  const endGame = useGameStore((state) => state.endGame)
  const canTameCard = useGameStore((state) => state.canTameCard)
  const getCardCost = useGameStore((state) => state.getCardCost)

  // Selector hooks
  const phase = useGamePhase()
  const round = useRound()
  const market = useMarket()
  const hand = useHand()
  const field = useField()
  const stones = useStones()
  const deckSize = useDeckSize()
  const { isOver, score, reason } = useGameOver()
  const playerName = usePlayerName()
  const totalStoneValue = useTotalStoneValue()
  const availableActions = useAvailableActions()

  // Local state
  const [selectedCardId, setSelectedCardId] = useState<string | null>(null)
  const [showHelpModal, setShowHelpModal] = useState(false)
  const [showPauseModal, setShowPauseModal] = useState(false)

  // Track if game has been initialized
  const hasInitialized = useRef(false)

  // Initialize game if not started (only once)
  useEffect(() => {
    if (!gameState && !hasInitialized.current) {
      hasInitialized.current = true
      startGame('Player')
    }
  }, []) // Empty dependency array - run only once on mount

  // Clear error after 3 seconds
  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setError(null), 3000)
      return () => clearTimeout(timer)
    }
  }, [error, setError])

  // Handlers
  const handleRestart = useCallback(() => {
    resetGame()
    startGame('Player')
    setSelectedCardId(null)
    setShowPauseModal(false)
  }, [resetGame, startGame])

  const handleHome = useCallback(() => {
    navigate('/')
  }, [navigate])

  const handleHelp = useCallback(() => {
    setShowHelpModal(true)
  }, [])

  const handlePause = useCallback(() => {
    setShowPauseModal(true)
  }, [])

  const handleDrawCard = useCallback(() => {
    drawCard()
  }, [drawCard])

  const handlePass = useCallback(() => {
    pass()
    setSelectedCardId(null)
  }, [pass])

  const handleEndGame = useCallback(() => {
    endGame()
  }, [endGame])

  const handleCardSelect = useCallback((cardId: string) => {
    setSelectedCardId((prev) => (prev === cardId ? null : cardId))
  }, [])

  const handleTameFromHand = useCallback((cardId: string) => {
    tameCreature(cardId, 'HAND')
    setSelectedCardId(null)
  }, [tameCreature])

  const handleTameFromMarket = useCallback((cardId: string) => {
    tameCreature(cardId, 'MARKET')
    setSelectedCardId(null)
  }, [tameCreature])

  const handleCardDropToField = useCallback((cardId: string) => {
    // Find if card is in hand
    const isInHand = hand.some((c) => c.instanceId === cardId)
    if (isInHand && canTameCard(cardId)) {
      tameCreature(cardId, 'HAND')
      setSelectedCardId(null)
    }
  }, [hand, canTameCard, tameCreature])

  // Loading state
  if (!gameState) {
    return (
      <div
        className="min-h-screen bg-slate-900 flex items-center justify-center"
        data-testid="game-loading"
      >
        <div className="text-center">
          <div className="text-slate-400 text-lg animate-pulse mb-4">Loading game...</div>
          <div className="w-12 h-12 border-4 border-vale-500 border-t-transparent rounded-full animate-spin mx-auto" />
        </div>
      </div>
    )
  }

  return (
    <div
      className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900"
      data-testid="game-board"
    >
      {/* Error Toast */}
      {error && (
        <div
          className="fixed top-20 left-1/2 -translate-x-1/2 z-50 bg-red-600 text-white px-6 py-3 rounded-lg shadow-lg animate-slide-up"
          data-testid="error-toast"
        >
          {error}
        </div>
      )}

      {/* Header */}
      <GameHeader
        playerName={playerName}
        round={round}
        phase={phase}
        deckSize={deckSize}
        onRestart={handleRestart}
        onHome={handleHome}
        onHelp={handleHelp}
        onPause={handlePause}
      />

      {/* Main Game Area */}
      <main className="max-w-7xl mx-auto px-4 py-6 space-y-6">
        {/* Stone Pool */}
        <StonePool
          stones={stones}
          showExchange={phase === SinglePlayerPhase.ACTION}
          data-testid="player-stones"
        />

        {/* Play Field */}
        <PlayField
          playerCards={field}
          maxFieldSize={5}
          selectedCardId={selectedCardId}
          isPlayerTurn={phase === SinglePlayerPhase.ACTION}
          acceptDrop={phase === SinglePlayerPhase.ACTION}
          onCardSelect={handleCardSelect}
          onCardDrop={handleCardDropToField}
        />

        {/* Market Area */}
        <MarketArea
          cards={market}
          deckCount={deckSize}
          maxMarketSize={4}
          currentStones={totalStoneValue}
          selectedCardId={selectedCardId}
          onCardSelect={handleCardSelect}
          onTameCard={handleTameFromMarket}
          canTameCard={canTameCard}
          getCardCost={getCardCost}
          allowTake={false}
          allowTame={phase === SinglePlayerPhase.ACTION}
        />

        {/* Action Buttons */}
        <ActionButtons
          phase={phase}
          availableActions={availableActions}
          onDrawCard={handleDrawCard}
          onPass={handlePass}
          onEndGame={handleEndGame}
        />

        {/* Player Hand */}
        <PlayerHand
          cards={hand}
          maxHandSize={7}
          selectedCardId={selectedCardId}
          showActions={phase === SinglePlayerPhase.ACTION}
          enableDrag={phase === SinglePlayerPhase.ACTION}
          onCardSelect={handleCardSelect}
          onCardPlay={handleTameFromHand}
          canTameCard={canTameCard}
        />

        {/* Phase Instructions */}
        <PhaseInstructions phase={phase} availableActions={availableActions} />
      </main>

      {/* Game Over Modal */}
      <GameOverModal
        isOpen={isOver}
        score={score}
        reason={reason}
        onRestart={handleRestart}
        onHome={handleHome}
      />

      {/* Help Modal */}
      <Modal
        isOpen={showHelpModal}
        onClose={() => setShowHelpModal(false)}
        title="How to Play"
        size="lg"
      >
        <div className="space-y-4 text-slate-300">
          <section>
            <h4 className="font-semibold text-slate-200 mb-2">Objective</h4>
            <p className="text-sm">
              Collect creatures and score points. The game ends when the deck is empty
              or you choose to end it manually.
            </p>
          </section>

          <section>
            <h4 className="font-semibold text-slate-200 mb-2">Phases</h4>
            <ul className="text-sm space-y-2">
              <li>
                <span className="text-blue-400">Draw Phase:</span> Draw a card from the deck.
              </li>
              <li>
                <span className="text-emerald-400">Action Phase:</span> Tame creatures or pass.
              </li>
            </ul>
          </section>

          <section>
            <h4 className="font-semibold text-slate-200 mb-2">Taming Creatures</h4>
            <p className="text-sm">
              Pay stones equal to the creature's cost to add it to your field.
              Creatures on your field score points at the end of the game.
            </p>
          </section>

          <section>
            <h4 className="font-semibold text-slate-200 mb-2">Stones</h4>
            <p className="text-sm">
              Collect stones through card effects. Different stone types have different values:
              1-point, 3-point, 6-point, and element stones (1 point each).
            </p>
          </section>
        </div>
      </Modal>

      {/* Pause Modal */}
      <Modal
        isOpen={showPauseModal}
        onClose={() => setShowPauseModal(false)}
        title="Game Paused"
        size="sm"
      >
        <div className="space-y-4">
          <p className="text-slate-400 text-center">
            Game is paused. What would you like to do?
          </p>
          <div className="flex flex-col gap-2">
            <Button onClick={() => setShowPauseModal(false)}>
              Resume Game
            </Button>
            <Button variant="secondary" onClick={handleRestart}>
              Restart Game
            </Button>
            <Button variant="ghost" onClick={handleHome}>
              Return to Home
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}

export default GameBoard
