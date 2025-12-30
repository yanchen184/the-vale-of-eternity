/**
 * Game page component for MVP 1.0
 * Local multiplayer (hot-seat) game
 * @version 1.0.0
 */
console.log('[pages/Game.tsx] v1.0.0 loaded')

import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Home, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui'
import {
  useGameStore,
  useGamePhase,
  useRound,
  useMarket,
  useGameOver,
  GamePhase,
} from '@/stores'
import type { CardInstance } from '@/types/cards'
import type { MVPPlayerState } from '@/stores'

export function Game() {
  const navigate = useNavigate()
  const gameState = useGameStore(state => state.gameState)
  const error = useGameStore(state => state.error)
  const setError = useGameStore(state => state.setError)
  const resetGame = useGameStore(state => state.resetGame)
  const initGame = useGameStore(state => state.initGame)
  const takeMarketCard = useGameStore(state => state.takeMarketCard)
  const tameMarketCard = useGameStore(state => state.tameMarketCard)
  const tameFromHand = useGameStore(state => state.tameFromHand)
  const sellCard = useGameStore(state => state.sellCard)
  const pass = useGameStore(state => state.pass)
  const nextRound = useGameStore(state => state.nextRound)
  const canTameCard = useGameStore(state => state.canTameCard)

  const phase = useGamePhase()
  const round = useRound()
  const market = useMarket()
  const { isOver, winner, reason } = useGameOver()

  // Initialize game if not started
  useEffect(() => {
    if (!gameState) {
      initGame('Player 1', 'Player 2')
    }
  }, [gameState, initGame])

  // Clear error after 3 seconds
  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setError(null), 3000)
      return () => clearTimeout(timer)
    }
  }, [error, setError])

  const handleRestartGame = () => {
    resetGame()
    initGame('Player 1', 'Player 2')
  }

  if (!gameState) {
    return (
      <div
        className="min-h-screen bg-slate-900 flex items-center justify-center"
        data-testid="game-loading"
      >
        <div className="text-slate-400 text-lg animate-pulse">Loading game...</div>
      </div>
    )
  }

  const currentPlayer = gameState.players[gameState.currentPlayerIndex]
  const opponentPlayer = gameState.players[gameState.currentPlayerIndex === 0 ? 1 : 0]

  return (
    <div
      className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900"
      data-testid="game-page"
    >
      {/* Error Toast */}
      {error && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 bg-red-600 text-white px-4 py-2 rounded-lg shadow-lg">
          {error}
        </div>
      )}

      {/* Game Header */}
      <header className="bg-slate-800/50 border-b border-slate-700 p-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-slate-100">The Vale of Eternity</h1>
            <p className="text-sm text-slate-400">
              Round {round} / 10 | Phase: {phase}
            </p>
          </div>

          <div className="flex items-center gap-4">
            {/* Current Turn Indicator */}
            <div className="text-sm text-slate-300">
              Current Turn: <span className="text-vale-400 font-bold">{currentPlayer.name}</span>
            </div>

            <Button
              variant="ghost"
              size="sm"
              onClick={handleRestartGame}
              leftIcon={<RefreshCw className="h-4 w-4" />}
              data-testid="restart-btn"
            >
              Restart
            </Button>

            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/')}
              leftIcon={<Home className="h-4 w-4" />}
              data-testid="back-home-btn"
            >
              Home
            </Button>
          </div>
        </div>
      </header>

      {/* Game Over Overlay */}
      {isOver && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-40">
          <div className="bg-slate-800 p-8 rounded-xl text-center max-w-md">
            <h2 className="text-3xl font-bold text-vale-400 mb-4">Game Over!</h2>
            <p className="text-xl text-slate-200 mb-2">
              {winner === 'draw'
                ? 'Draw!'
                : `${gameState.players[winner as 0 | 1].name} Wins!`}
            </p>
            <p className="text-slate-400 mb-6">
              {reason === 'SCORE_REACHED' ? 'Reached 60 points' : 'Completed 10 rounds'}
            </p>
            <div className="flex gap-4 justify-center">
              <Button onClick={handleRestartGame} data-testid="play-again-btn">
                Play Again
              </Button>
              <Button variant="secondary" onClick={() => navigate('/')}>
                Home
              </Button>
            </div>
          </div>
        </div>
      )}

      <main className="max-w-7xl mx-auto p-4">
        {/* Opponent Area */}
        <PlayerArea
          player={opponentPlayer}
          isCurrentTurn={gameState.currentPlayerIndex !== opponentPlayer.index}
          isOpponent={true}
        />

        {/* Market Area */}
        <section className="my-6 bg-slate-800/30 rounded-xl p-6 border border-slate-700">
          <h2 className="text-lg font-semibold text-slate-200 mb-4">
            Market ({market.length} cards)
          </h2>
          <div className="grid grid-cols-4 gap-4">
            {market.map((card, i) => (
              <CardComponent
                key={card.instanceId}
                card={card}
                index={i}
                showActions={phase === GamePhase.HUNTING}
                onTake={() => takeMarketCard(card.instanceId)}
                onTame={() => tameMarketCard(card.instanceId)}
                canTame={canTameCard(card.instanceId)}
              />
            ))}
            {/* Empty slots */}
            {Array.from({ length: 4 - market.length }).map((_, i) => (
              <div
                key={`empty-${i}`}
                className="aspect-[2/3] bg-slate-700/30 rounded-lg border-2 border-dashed border-slate-600 flex items-center justify-center"
              >
                <span className="text-slate-600">Empty</span>
              </div>
            ))}
          </div>
        </section>

        {/* Current Player Area */}
        <PlayerArea
          player={currentPlayer}
          isCurrentTurn={true}
          isOpponent={false}
          onTameFromHand={tameFromHand}
          onSellCard={sellCard}
          canTameCard={canTameCard}
          showHandActions={phase === GamePhase.ACTION}
        />

        {/* Action Buttons */}
        <div className="mt-6 flex justify-center gap-4">
          {phase === GamePhase.ACTION && (
            <Button
              onClick={pass}
              variant="secondary"
              data-testid="pass-btn"
            >
              Pass Turn
            </Button>
          )}
          {phase === GamePhase.RESOLUTION && !isOver && (
            <Button
              onClick={nextRound}
              data-testid="next-round-btn"
            >
              Next Round
            </Button>
          )}
        </div>

        {/* Phase Instructions */}
        <div className="mt-6 text-center text-slate-400">
          {phase === GamePhase.HUNTING && (
            <p>Select a card from the market: Take (free) or Tame (pay stones)</p>
          )}
          {phase === GamePhase.ACTION && (
            <p>Your turn: Tame from hand, Sell a card, or Pass</p>
          )}
          {phase === GamePhase.RESOLUTION && !isOver && (
            <p>Round ended. Click Next Round to continue.</p>
          )}
        </div>
      </main>
    </div>
  )
}

// ============================================
// SUB-COMPONENTS
// ============================================

interface PlayerAreaProps {
  player: MVPPlayerState
  isCurrentTurn: boolean
  isOpponent: boolean
  onTameFromHand?: (cardId: string) => void
  onSellCard?: (cardId: string) => void
  canTameCard?: (cardId: string) => boolean
  showHandActions?: boolean
}

function PlayerArea({
  player,
  isCurrentTurn,
  isOpponent,
  onTameFromHand,
  onSellCard,
  canTameCard,
  showHandActions = false,
}: PlayerAreaProps) {
  return (
    <section
      className={`bg-slate-800/30 rounded-xl p-4 border ${
        isCurrentTurn ? 'border-vale-500' : 'border-slate-700'
      }`}
    >
      {/* Player Info */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-vale-600 flex items-center justify-center text-lg font-bold text-white">
            {player.name.charAt(0)}
          </div>
          <div>
            <h3 className="font-semibold text-slate-100">
              {player.name}
              {isCurrentTurn && <span className="ml-2 text-vale-400">(Current Turn)</span>}
            </h3>
            <p className="text-sm text-slate-400">
              Score: <span className="text-vale-400 font-bold">{player.score}</span>
            </p>
          </div>
        </div>
        <div className="flex gap-4 text-sm">
          <div className="text-center">
            <div className="text-2xl font-bold text-yellow-500">{player.stones}</div>
            <div className="text-slate-500">/{player.stoneLimit} Stones</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-slate-300">{player.field.length}</div>
            <div className="text-slate-500">/12 Field</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-slate-300">{player.hand.length}</div>
            <div className="text-slate-500">Hand</div>
          </div>
        </div>
      </div>

      {/* Field */}
      <div className="mb-4">
        <h4 className="text-sm text-slate-400 mb-2">Field</h4>
        <div className="flex gap-2 overflow-x-auto pb-2">
          {player.field.length === 0 ? (
            <div className="text-slate-600 py-4">No cards on field</div>
          ) : (
            player.field.map((card, i) => (
              <CardComponent
                key={card.instanceId}
                card={card}
                index={i}
                compact
              />
            ))
          )}
        </div>
      </div>

      {/* Hand (hidden for opponent) */}
      {!isOpponent && (
        <div>
          <h4 className="text-sm text-slate-400 mb-2">Hand</h4>
          <div className="flex gap-2 overflow-x-auto pb-2">
            {player.hand.length === 0 ? (
              <div className="text-slate-600 py-4">No cards in hand</div>
            ) : (
              player.hand.map((card, i) => (
                <CardComponent
                  key={card.instanceId}
                  card={card}
                  index={i}
                  showActions={showHandActions}
                  onTame={() => onTameFromHand?.(card.instanceId)}
                  onSell={() => onSellCard?.(card.instanceId)}
                  canTame={canTameCard?.(card.instanceId) ?? false}
                />
              ))
            )}
          </div>
        </div>
      )}
    </section>
  )
}

interface CardComponentProps {
  card: CardInstance
  index: number
  compact?: boolean
  showActions?: boolean
  onTake?: () => void
  onTame?: () => void
  onSell?: () => void
  canTame?: boolean
}

function CardComponent({
  card,
  index,
  compact = false,
  showActions = false,
  onTake,
  onTame,
  onSell,
  canTame = false,
}: CardComponentProps) {
  const elementColors: Record<string, string> = {
    FIRE: 'border-red-500 bg-red-500/10',
    WATER: 'border-blue-500 bg-blue-500/10',
    EARTH: 'border-green-500 bg-green-500/10',
    WIND: 'border-purple-500 bg-purple-500/10',
    DRAGON: 'border-amber-500 bg-amber-500/10',
  }

  const colorClass = elementColors[card.element] || 'border-slate-500 bg-slate-500/10'

  if (compact) {
    return (
      <div
        className={`flex-shrink-0 w-20 aspect-[2/3] rounded-lg border-2 ${colorClass} p-1 text-center`}
        data-testid={`card-${card.instanceId}`}
      >
        <div className="text-xs text-slate-300 truncate">{card.nameTw}</div>
        <div className="text-lg font-bold text-slate-200">{card.baseScore}</div>
        <div className="text-xs text-slate-500">{card.element.charAt(0)}</div>
      </div>
    )
  }

  return (
    <div
      className={`flex-shrink-0 w-32 aspect-[2/3] rounded-lg border-2 ${colorClass} p-2 flex flex-col`}
      data-testid={`card-${index}`}
    >
      <div className="text-xs text-slate-400">Cost: {card.cost}</div>
      <div className="text-sm font-semibold text-slate-200 truncate">{card.nameTw}</div>
      <div className="flex-1 flex items-center justify-center">
        <div className="text-2xl font-bold text-slate-100">{card.baseScore}</div>
      </div>
      <div className="text-xs text-slate-400 text-center truncate">
        {card.effectDescriptionTw || 'No effect'}
      </div>

      {showActions && (
        <div className="mt-2 flex gap-1">
          {onTake && (
            <button
              onClick={onTake}
              className="flex-1 text-xs bg-slate-600 hover:bg-slate-500 text-white py-1 px-2 rounded"
            >
              Take
            </button>
          )}
          {onTame && (
            <button
              onClick={onTame}
              disabled={!canTame}
              className={`flex-1 text-xs py-1 px-2 rounded ${
                canTame
                  ? 'bg-vale-600 hover:bg-vale-500 text-white'
                  : 'bg-slate-700 text-slate-500 cursor-not-allowed'
              }`}
            >
              Tame
            </button>
          )}
          {onSell && (
            <button
              onClick={onSell}
              className="flex-1 text-xs bg-yellow-600 hover:bg-yellow-500 text-white py-1 px-2 rounded"
            >
              Sell
            </button>
          )}
        </div>
      )}
    </div>
  )
}

export default Game
