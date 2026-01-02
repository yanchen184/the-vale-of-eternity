/**
 * GameBoard Page
 * Main game interface integrating all core UI components
 * @version 1.3.0 - 完整中文化
 */
console.log('[pages/GameBoard.tsx] v1.3.0 loaded')

import { useEffect, useCallback, useState, useRef, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { Home, RefreshCw, HelpCircle, Pause } from 'lucide-react'
import { Button } from '@/components/ui'
import {
  PlayerHand,
  PlayField,
  MarketArea,
  StonePool,
  GameModeToggle,
  ManualControlPanel,
} from '@/components/game'
import {
  useGameStore,
  SinglePlayerPhase,
} from '@/stores'
import { calculateStonePoolValue } from '@/types/game'
import { GameMode } from '@/types/manual'
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
  const phaseLabels: Partial<Record<SinglePlayerPhase, string>> = {
    [SinglePlayerPhase.DRAW]: '抽牌階段',
    [SinglePlayerPhase.ACTION]: '行動階段',
    [SinglePlayerPhase.SCORE]: '計分階段',
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
                玩家：<span className="text-vale-400 font-medium">{playerName}</span>
              </span>
              <span className="text-slate-400">
                回合：<span className="text-amber-400 font-medium">{round}</span>
              </span>
              <span className="text-slate-400">
                牌庫：<span className="text-slate-300 font-medium">{deckSize}</span>
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
            說明
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={onPause}
            leftIcon={<Pause className="h-4 w-4" />}
            data-testid="pause-btn"
          >
            暫停
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={onRestart}
            leftIcon={<RefreshCw className="h-4 w-4" />}
            data-testid="restart-btn"
          >
            重新開始
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={onHome}
            leftIcon={<Home className="h-4 w-4" />}
            data-testid="home-btn"
          >
            主選單
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
          title: '抽牌階段',
          description: '從牌庫抽取一張卡片加入你的手牌。',
          actions: ['點擊牌庫或「抽牌」按鈕'],
        }
      case SinglePlayerPhase.ACTION:
        return {
          title: '行動階段',
          description: '從手牌或市場馴服生物，或選擇跳過回合。',
          actions: [
            '從手牌馴服：將生物打出到你的場地',
            '從市場馴服：購買並打出市場中的生物',
            '跳過：結束本回合',
          ],
        }
      case SinglePlayerPhase.SCORE:
        return {
          title: '計分階段',
          description: '遊戲已結束，查看你的最終分數。',
          actions: [],
        }
      default:
        return {
          title: '等待中...',
          description: '遊戲載入中。',
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
      title="遊戲結束"
      showCloseButton={false}
      size="md"
    >
      <div className="text-center py-6">
        {/* Score Display */}
        <div className="mb-6">
          <div className="text-sm text-slate-400 mb-2">最終分數</div>
          <div className="text-6xl font-bold text-vale-400 mb-2">{score ?? 0}</div>
          <div className="text-sm text-slate-500">
            {reason && reasonText[reason as keyof typeof reasonText]}
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-4 justify-center">
          <Button onClick={onRestart} data-testid="play-again-btn">
            再玩一次
          </Button>
          <Button variant="secondary" onClick={onHome} data-testid="go-home-btn">
            主選單
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
  onDrawCard,
  onPass,
  onEndGame,
}: {
  phase: SinglePlayerPhase | null
  onDrawCard: () => void
  onPass: () => void
  onEndGame: () => void
}) {
  // Determine available actions based on phase
  const canDraw = phase === SinglePlayerPhase.DRAW
  const canPass = phase === SinglePlayerPhase.ACTION
  const canEnd = phase === SinglePlayerPhase.ACTION

  return (
    <div className="flex gap-3 justify-center" data-testid="action-buttons">
      {phase === SinglePlayerPhase.DRAW && canDraw && (
        <Button
          onClick={onDrawCard}
          className="px-8"
          data-testid="draw-card-btn"
        >
          抽牌
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

  // Get gameState directly - don't destructure arrays to avoid reference changes
  const gameState = useGameStore((state) => state.gameState)
  const error = useGameStore((state) => state.error)
  const setError = useGameStore((state) => state.setError)

  // Get actions
  const startGame = useGameStore((state) => state.startGame)
  const resetGame = useGameStore((state) => state.resetGame)
  const drawCard = useGameStore((state) => state.drawCard)
  const tameCreature = useGameStore((state) => state.tameCreature)
  const pass = useGameStore((state) => state.pass)
  const endGame = useGameStore((state) => state.endGame)
  const canTameCard = useGameStore((state) => state.canTameCard)
  const getCardCost = useGameStore((state) => state.getCardCost)
  const setGameMode = useGameStore((state) => state.setGameMode)

  // Derive values from gameState
  const phase = gameState?.phase ?? null
  const round = gameState?.round ?? 0
  const market = gameState?.market ?? []
  const hand = gameState?.player.hand ?? []
  const field = gameState?.player.field ?? []
  const stones = gameState?.player.stones ?? null
  const deckSize = gameState?.deck.length ?? 0
  const isOver = gameState?.isGameOver ?? false
  const score = gameState?.finalScore ?? null
  const reason = gameState?.endReason ?? null
  const playerName = gameState?.player.name ?? ''
  const gameMode = gameState?.gameMode ?? GameMode.AUTOMATIC

  // Compute stone value with useMemo to prevent infinite loop
  const totalStoneValue = useMemo(() => {
    return stones ? calculateStonePoolValue(stones) : 0
  }, [stones])

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
        {/* Game Mode Toggle */}
        <GameModeToggle
          currentMode={gameMode}
          onModeChange={setGameMode}
        />

        {/* Manual Control Panel (only in MANUAL mode) */}
        {gameMode === GameMode.MANUAL && <ManualControlPanel />}

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
        <PhaseInstructions phase={phase} />
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
