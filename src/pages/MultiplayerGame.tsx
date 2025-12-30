/**
 * MultiplayerGame Page
 * Main multiplayer game interface with Firebase real-time synchronization
 * @version 3.1.0
 */
console.log('[pages/MultiplayerGame.tsx] v3.1.0 loaded')

import { useEffect, useState, useCallback, useRef, useMemo } from 'react'
import { useParams, useLocation, useNavigate } from 'react-router-dom'
import { ref, onValue, off } from 'firebase/database'
import { database } from '@/lib/firebase'
import {
  multiplayerGameService,
  type GameRoom,
  type PlayerState,
  type CardInstanceData,
  type GamePhase,
} from '@/services/multiplayer-game'
import { PlayerHand, PlayField, MarketArea, StonePool } from '@/components/game'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { cn } from '@/lib/utils'
import type { CardInstance } from '@/types/cards'
import type { StonePool as StonePoolType } from '@/types/game'
import { calculateStonePoolValue } from '@/types/game'

// ============================================
// TYPES
// ============================================

interface LocationState {
  playerId: string
  playerName: string
  roomCode: string
  isHost: boolean
}

interface GameHeaderProps {
  roomCode: string
  phase: GamePhase
  round: number
  currentPlayerName: string
  isYourTurn: boolean
  onLeave: () => void
}

interface PlayerListProps {
  players: PlayerState[]
  currentPlayerId: string
  currentTurnPlayerId: string
  phase: GamePhase
}

interface WaitingRoomProps {
  roomCode: string
  players: PlayerState[]
  isHost: boolean
  maxPlayers: number
  onStartGame: () => void
  onLeave: () => void
}

interface HuntingPhaseProps {
  marketCards: CardInstance[]
  isYourTurn: boolean
  currentPlayerName: string
  onSelectCard: (cardId: string) => void
}

// ============================================
// SUB-COMPONENTS
// ============================================

/**
 * Game Header Component
 */
function GameHeader({
  roomCode,
  phase,
  round,
  currentPlayerName,
  isYourTurn,
  onLeave,
}: GameHeaderProps) {
  const phaseLabels: Record<GamePhase, string> = {
    WAITING: 'Waiting',
    HUNTING: 'Hunting Phase',
    ACTION: 'Action Phase',
    RESOLUTION: 'Resolution',
    ENDED: 'Game Over',
  }

  const phaseColors: Record<GamePhase, string> = {
    WAITING: 'bg-slate-600 text-slate-200',
    HUNTING: 'bg-blue-600 text-blue-100',
    ACTION: 'bg-emerald-600 text-emerald-100',
    RESOLUTION: 'bg-amber-600 text-amber-100',
    ENDED: 'bg-purple-600 text-purple-100',
  }

  return (
    <header
      className="bg-slate-800/90 backdrop-blur-sm border-b border-slate-700 sticky top-0 z-30"
      data-testid="multiplayer-header"
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
                Room: <span className="text-amber-400 font-mono font-bold">{roomCode}</span>
              </span>
              {phase !== 'WAITING' && (
                <span className="text-slate-400">
                  Round: <span className="text-slate-200 font-medium">{round}</span>
                </span>
              )}
            </div>
          </div>

          {/* Phase Badge */}
          <div className={cn('px-4 py-2 rounded-lg font-medium', phaseColors[phase])}>
            {phaseLabels[phase]}
          </div>

          {/* Turn Indicator */}
          {phase !== 'WAITING' && phase !== 'ENDED' && (
            <div
              className={cn(
                'px-4 py-2 rounded-lg border-2',
                isYourTurn
                  ? 'bg-vale-600/20 border-vale-500 text-vale-300'
                  : 'bg-slate-700/50 border-slate-600 text-slate-400'
              )}
            >
              {isYourTurn ? 'Your Turn!' : `${currentPlayerName}'s Turn`}
            </div>
          )}
        </div>

        {/* Right: Leave Button */}
        <Button
          variant="ghost"
          size="sm"
          onClick={onLeave}
          data-testid="leave-game-btn"
        >
          Leave Game
        </Button>
      </div>
    </header>
  )
}

/**
 * Player List Sidebar
 */
function PlayerList({ players, currentPlayerId, currentTurnPlayerId, phase }: PlayerListProps) {
  return (
    <aside
      className="w-64 bg-slate-800/50 rounded-xl border border-slate-700 p-4"
      data-testid="player-list"
    >
      <h3 className="text-lg font-semibold text-slate-200 mb-4">Players</h3>
      <div className="space-y-3">
        {players.map((player) => {
          const isCurrentTurn = player.playerId === currentTurnPlayerId
          const isYou = player.playerId === currentPlayerId
          const totalStoneValue = calculateStonePoolValue(player.stones)

          return (
            <div
              key={player.playerId}
              className={cn(
                'p-3 rounded-lg border transition-all',
                isCurrentTurn && phase !== 'WAITING'
                  ? 'bg-vale-900/30 border-vale-500'
                  : 'bg-slate-900/50 border-slate-700',
                player.hasPassed && 'opacity-50'
              )}
              data-testid={`player-${player.index}`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className={cn('font-medium', isYou ? 'text-vale-400' : 'text-slate-200')}>
                  {player.name}
                  {isYou && ' (You)'}
                </span>
                {player.hasPassed && (
                  <span className="text-xs text-slate-500 px-2 py-0.5 rounded bg-slate-700">
                    Passed
                  </span>
                )}
              </div>
              <div className="flex items-center gap-3 text-xs text-slate-400">
                <span>Hand: {player.hand.length}</span>
                <span>Field: {player.field.length}</span>
                <span>Stones: {totalStoneValue}</span>
              </div>
              {player.isReady && phase === 'WAITING' && (
                <div className="mt-2 text-xs text-emerald-400">Ready</div>
              )}
            </div>
          )
        })}
      </div>
    </aside>
  )
}

/**
 * Waiting Room Component
 */
function WaitingRoom({ roomCode, players, isHost, maxPlayers, onStartGame, onLeave }: WaitingRoomProps) {
  const canStart = players.length >= 2

  return (
    <div
      className="min-h-screen bg-gradient-to-br from-purple-900 via-indigo-900 to-blue-900 flex items-center justify-center p-8"
      data-testid="waiting-room"
    >
      <div className="max-w-lg w-full bg-white/10 backdrop-blur-md rounded-2xl p-8 shadow-2xl">
        {/* Room Code Display */}
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold text-white mb-2">Game Room</h2>
          <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-600">
            <span className="text-sm text-slate-400">Room Code</span>
            <div className="text-4xl font-mono font-bold text-amber-400 tracking-wider">
              {roomCode}
            </div>
            <span className="text-xs text-slate-500">
              Share this code with friends to join
            </span>
          </div>
        </div>

        {/* Player List */}
        <div className="mb-8">
          <h3 className="text-lg font-semibold text-slate-200 mb-4">
            Players ({players.length}/{maxPlayers})
          </h3>
          <div className="space-y-2">
            {players.map((player, index) => (
              <div
                key={player.playerId}
                className="flex items-center gap-3 p-3 rounded-lg bg-slate-800/50 border border-slate-700"
                data-testid={`waiting-player-${index}`}
              >
                <div className="w-8 h-8 rounded-full bg-vale-600 flex items-center justify-center text-white font-bold">
                  {index + 1}
                </div>
                <span className="flex-1 text-slate-200">{player.name}</span>
                {index === 0 && (
                  <span className="text-xs text-amber-400 px-2 py-1 rounded bg-amber-900/30">
                    Host
                  </span>
                )}
              </div>
            ))}

            {/* Empty Slots */}
            {Array.from({ length: maxPlayers - players.length }).map((_, i) => (
              <div
                key={`empty-${i}`}
                className="flex items-center gap-3 p-3 rounded-lg bg-slate-800/20 border border-dashed border-slate-700"
              >
                <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center text-slate-500">
                  {players.length + i + 1}
                </div>
                <span className="text-slate-500">Waiting for player...</span>
              </div>
            ))}
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-4">
          <Button
            variant="secondary"
            onClick={onLeave}
            className="flex-1"
            data-testid="leave-waiting-btn"
          >
            Leave
          </Button>
          {isHost && (
            <Button
              variant="primary"
              onClick={onStartGame}
              disabled={!canStart}
              className="flex-1"
              data-testid="start-game-btn"
            >
              {canStart ? 'Start Game' : `Need ${2 - players.length} more`}
            </Button>
          )}
        </div>

        {!isHost && (
          <p className="text-center text-sm text-slate-400 mt-4">
            Waiting for host to start the game...
          </p>
        )}
      </div>
    </div>
  )
}

/**
 * Hunting Phase UI
 */
function HuntingPhaseUI({ marketCards, isYourTurn, currentPlayerName, onSelectCard }: HuntingPhaseProps) {
  return (
    <div
      className="bg-slate-800/50 rounded-xl border border-blue-700/50 p-6 mb-6"
      data-testid="hunting-phase"
    >
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-blue-400 mb-2">Hunting Phase</h2>
        <p className="text-slate-400">
          {isYourTurn
            ? 'Select a card from the market to add to your hand'
            : `Waiting for ${currentPlayerName} to select a card...`}
        </p>
      </div>

      <div className="grid grid-cols-3 lg:grid-cols-6 gap-4 justify-items-center">
        {marketCards.map((card, index) => (
          <button
            key={card.instanceId}
            onClick={() => isYourTurn && onSelectCard(card.instanceId)}
            disabled={!isYourTurn}
            className={cn(
              'relative p-4 rounded-xl border-2 transition-all',
              isYourTurn
                ? 'hover:border-blue-400 hover:bg-blue-900/30 cursor-pointer border-slate-600'
                : 'border-slate-700 opacity-60 cursor-not-allowed'
            )}
            data-testid={`hunting-card-${index}`}
          >
            <div className="text-center">
              <div className="text-lg font-bold text-slate-200">{card.name}</div>
              <div className="text-sm text-slate-400">{card.nameTw}</div>
              <div className="mt-2 text-amber-400">Cost: {card.cost}</div>
              <div className="text-emerald-400">Score: {card.baseScore}</div>
            </div>
          </button>
        ))}
      </div>
    </div>
  )
}

// ============================================
// MAIN COMPONENT
// ============================================

export function MultiplayerGame() {
  const { gameId } = useParams<{ gameId: string }>()
  const location = useLocation()
  const navigate = useNavigate()
  const state = location.state as LocationState | null

  // Refs for cleanup
  const unsubscribeRef = useRef<(() => void) | null>(null)

  // State
  const [gameRoom, setGameRoom] = useState<GameRoom | null>(null)
  const [players, setPlayers] = useState<PlayerState[]>([])
  const [cards, setCards] = useState<Record<string, CardInstanceData>>({})
  const [currentPlayer, setCurrentPlayer] = useState<PlayerState | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [showLeaveModal, setShowLeaveModal] = useState(false)
  const [showGameOverModal, setShowGameOverModal] = useState(false)
  const [scores, setScores] = useState<{ playerId: string; name: string; score: number }[]>([])

  // Extract state from location or redirect
  const playerId = state?.playerId
  const playerName = state?.playerName
  const roomCode = state?.roomCode
  const isHost = state?.isHost ?? false

  // Validate required state
  useEffect(() => {
    if (!gameId || !playerId || !playerName || !roomCode) {
      console.error('[MultiplayerGame] Missing required state, redirecting...')
      navigate('/multiplayer')
    }
  }, [gameId, playerId, playerName, roomCode, navigate])

  // Subscribe to game updates
  useEffect(() => {
    if (!gameId) return

    console.log('[MultiplayerGame] Setting up Firebase listeners for game:', gameId)
    setIsLoading(true)

    // Subscribe to game room
    const gameRef = ref(database, `games/${gameId}`)
    const playersRef = ref(database, `games/${gameId}/players`)
    const cardsRef = ref(database, `games/${gameId}/cards`)

    const handleGameUpdate = (snapshot: any) => {
      if (snapshot.exists()) {
        const data = snapshot.val() as GameRoom
        console.log('[MultiplayerGame] Game update:', data.status)
        setGameRoom(data)

        // Check if game ended
        if (data.status === 'ENDED' && !showGameOverModal) {
          handleGameEnd()
        }
      } else {
        setError('Game not found')
        setTimeout(() => navigate('/multiplayer'), 2000)
      }
      setIsLoading(false)
    }

    const handlePlayersUpdate = (snapshot: any) => {
      if (snapshot.exists()) {
        const data = snapshot.val() as Record<string, PlayerState>
        const playersList = Object.values(data).sort((a, b) => a.index - b.index)
        setPlayers(playersList)

        // Update current player
        if (playerId) {
          const me = playersList.find((p) => p.playerId === playerId)
          if (me) {
            setCurrentPlayer(me)
          }
        }
      }
    }

    const handleCardsUpdate = (snapshot: any) => {
      if (snapshot.exists()) {
        setCards(snapshot.val())
      }
    }

    onValue(gameRef, handleGameUpdate)
    onValue(playersRef, handlePlayersUpdate)
    onValue(cardsRef, handleCardsUpdate)

    // Cleanup
    return () => {
      off(gameRef)
      off(playersRef)
      off(cardsRef)
      if (unsubscribeRef.current) {
        unsubscribeRef.current()
      }
    }
  }, [gameId, playerId, navigate, showGameOverModal])

  // Handle game end
  const handleGameEnd = useCallback(async () => {
    if (!gameId) return

    try {
      const finalScores = await multiplayerGameService.calculateFinalScores(gameId)
      const scoreList = finalScores.map((s) => ({
        playerId: s.playerId,
        name: players.find((p) => p.playerId === s.playerId)?.name ?? 'Unknown',
        score: s.totalScore,
      }))
      scoreList.sort((a, b) => b.score - a.score)
      setScores(scoreList)
      setShowGameOverModal(true)
    } catch (err) {
      console.error('[MultiplayerGame] Error calculating scores:', err)
    }
  }, [gameId, players])

  // Convert card data to CardInstance format
  const convertToCardInstance = useCallback(
    (instanceId: string): CardInstance | null => {
      const cardData = cards[instanceId]
      if (!cardData) return null

      return {
        instanceId: cardData.instanceId,
        cardId: cardData.cardId,
        name: cardData.name,
        nameTw: cardData.nameTw,
        element: cardData.element,
        cost: cardData.cost,
        baseScore: cardData.baseScore,
        effects: [], // Effects need to be resolved from card templates
        ownerId: cardData.ownerId,
        location: cardData.location,
        isRevealed: true,
        scoreModifier: cardData.scoreModifier,
        hasUsedAbility: cardData.hasUsedAbility,
      }
    },
    [cards]
  )

  // Get cards for different areas
  const marketCards = useMemo(() => {
    if (!gameRoom) return []
    return gameRoom.marketIds
      .map(convertToCardInstance)
      .filter((c): c is CardInstance => c !== null)
  }, [gameRoom, convertToCardInstance])

  const handCards = useMemo(() => {
    if (!currentPlayer) return []
    return currentPlayer.hand
      .map(convertToCardInstance)
      .filter((c): c is CardInstance => c !== null)
  }, [currentPlayer, convertToCardInstance])

  const fieldCards = useMemo(() => {
    if (!currentPlayer) return []
    return currentPlayer.field
      .map(convertToCardInstance)
      .filter((c): c is CardInstance => c !== null)
  }, [currentPlayer, convertToCardInstance])

  // Get current turn player
  const currentTurnPlayerId = useMemo(() => {
    if (!gameRoom || !players.length) return ''

    if (gameRoom.status === 'HUNTING' && gameRoom.huntingPhase) {
      const playerIndex = gameRoom.huntingPhase.currentPlayerIndex
      return gameRoom.playerIds[playerIndex] ?? ''
    }

    if (gameRoom.status === 'ACTION') {
      const playerIndex = gameRoom.currentPlayerIndex
      return gameRoom.playerIds[playerIndex] ?? ''
    }

    return ''
  }, [gameRoom, players])

  const currentTurnPlayer = useMemo(() => {
    return players.find((p) => p.playerId === currentTurnPlayerId)
  }, [players, currentTurnPlayerId])

  const isYourTurn = playerId === currentTurnPlayerId

  // Stone pool for current player
  const stonePool = useMemo((): StonePoolType | null => {
    if (!currentPlayer) return null
    return currentPlayer.stones
  }, [currentPlayer])

  const totalStoneValue = useMemo(() => {
    if (!stonePool) return 0
    return calculateStonePoolValue(stonePool)
  }, [stonePool])

  // Handlers
  const handleStartGame = useCallback(async () => {
    if (!gameId || !playerId) return

    try {
      await multiplayerGameService.startGame(gameId, playerId)
    } catch (err: any) {
      setError(err.message || 'Failed to start game')
    }
  }, [gameId, playerId])

  const handleLeaveGame = useCallback(() => {
    setShowLeaveModal(true)
  }, [])

  const confirmLeaveGame = useCallback(() => {
    navigate('/multiplayer')
  }, [navigate])

  const handleSelectCardInHunting = useCallback(
    async (cardInstanceId: string) => {
      if (!gameId || !playerId) return

      try {
        await multiplayerGameService.selectCardInHunting(gameId, playerId, cardInstanceId)
      } catch (err: any) {
        setError(err.message || 'Failed to select card')
      }
    },
    [gameId, playerId]
  )

  const handleTameCard = useCallback(
    async (cardInstanceId: string) => {
      if (!gameId || !playerId) return

      try {
        await multiplayerGameService.tameCard(gameId, playerId, cardInstanceId)
      } catch (err: any) {
        setError(err.message || 'Failed to tame card')
      }
    },
    [gameId, playerId]
  )

  const handleSellCard = useCallback(
    async (cardInstanceId: string) => {
      if (!gameId || !playerId) return

      try {
        await multiplayerGameService.sellCard(gameId, playerId, cardInstanceId)
      } catch (err: any) {
        setError(err.message || 'Failed to sell card')
      }
    },
    [gameId, playerId]
  )

  const handlePassTurn = useCallback(async () => {
    if (!gameId || !playerId) return

    try {
      await multiplayerGameService.passTurn(gameId, playerId)
    } catch (err: any) {
      setError(err.message || 'Failed to pass turn')
    }
  }, [gameId, playerId])

  const canTameCard = useCallback(
    (cardInstanceId: string): boolean => {
      const card = cards[cardInstanceId]
      if (!card || !currentPlayer) return false
      return totalStoneValue >= card.cost
    },
    [cards, currentPlayer, totalStoneValue]
  )

  const getCardCost = useCallback(
    (cardInstanceId: string): number => {
      const card = cards[cardInstanceId]
      return card?.cost ?? 0
    },
    [cards]
  )

  // Clear error after timeout
  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setError(null), 5000)
      return () => clearTimeout(timer)
    }
  }, [error])

  // Loading state
  if (isLoading) {
    return (
      <div
        className="min-h-screen bg-slate-900 flex items-center justify-center"
        data-testid="multiplayer-loading"
      >
        <div className="text-center">
          <div className="text-slate-400 text-lg mb-4">Connecting to game...</div>
          <div className="w-12 h-12 border-4 border-vale-500 border-t-transparent rounded-full animate-spin mx-auto" />
        </div>
      </div>
    )
  }

  // Error state
  if (!gameRoom) {
    return (
      <div
        className="min-h-screen bg-slate-900 flex items-center justify-center"
        data-testid="multiplayer-error"
      >
        <div className="text-center">
          <div className="text-red-400 text-lg mb-4">{error || 'Game not found'}</div>
          <Button onClick={() => navigate('/multiplayer')}>Back to Lobby</Button>
        </div>
      </div>
    )
  }

  // Waiting Room
  if (gameRoom.status === 'WAITING') {
    return (
      <WaitingRoom
        roomCode={gameRoom.roomCode}
        players={players}
        isHost={isHost}
        maxPlayers={gameRoom.maxPlayers}
        onStartGame={handleStartGame}
        onLeave={handleLeaveGame}
      />
    )
  }

  // Main Game UI
  return (
    <div
      className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900"
      data-testid="multiplayer-game"
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
        roomCode={gameRoom.roomCode}
        phase={gameRoom.status}
        round={gameRoom.currentRound}
        currentPlayerName={currentTurnPlayer?.name ?? 'Unknown'}
        isYourTurn={isYourTurn}
        onLeave={handleLeaveGame}
      />

      {/* Main Content */}
      <div className="flex max-w-7xl mx-auto px-4 py-6 gap-6">
        {/* Player List Sidebar */}
        <PlayerList
          players={players}
          currentPlayerId={playerId ?? ''}
          currentTurnPlayerId={currentTurnPlayerId}
          phase={gameRoom.status}
        />

        {/* Game Area */}
        <main className="flex-1 space-y-6">
          {/* Hunting Phase UI */}
          {gameRoom.status === 'HUNTING' && (
            <HuntingPhaseUI
              marketCards={marketCards}
              isYourTurn={isYourTurn}
              currentPlayerName={currentTurnPlayer?.name ?? 'Unknown'}
              onSelectCard={handleSelectCardInHunting}
            />
          )}

          {/* Action Phase UI */}
          {gameRoom.status === 'ACTION' && (
            <>
              {/* Stone Pool */}
              <StonePool stones={stonePool} showExchange={false} data-testid="player-stones" />

              {/* Play Field */}
              <PlayField
                playerCards={fieldCards}
                maxFieldSize={5}
                isPlayerTurn={isYourTurn}
                acceptDrop={isYourTurn}
              />

              {/* Market Area */}
              <MarketArea
                cards={marketCards}
                deckCount={gameRoom.deckIds.length}
                maxMarketSize={6}
                currentStones={totalStoneValue}
                onTameCard={handleTameCard}
                canTameCard={canTameCard}
                getCardCost={getCardCost}
                allowTake={false}
                allowTame={isYourTurn}
              />

              {/* Action Buttons */}
              {isYourTurn && (
                <div className="flex gap-4 justify-center" data-testid="action-buttons">
                  <Button
                    variant="secondary"
                    onClick={handlePassTurn}
                    data-testid="pass-turn-btn"
                  >
                    Pass Turn
                  </Button>
                </div>
              )}

              {/* Player Hand */}
              <PlayerHand
                cards={handCards}
                maxHandSize={10}
                showActions={isYourTurn}
                enableDrag={isYourTurn}
                onCardPlay={handleTameCard}
                onCardSell={handleSellCard}
                canTameCard={canTameCard}
              />
            </>
          )}

          {/* Not Your Turn Overlay */}
          {gameRoom.status === 'ACTION' && !isYourTurn && (
            <div className="text-center py-4">
              <div className="inline-block px-6 py-3 rounded-lg bg-slate-700/50 border border-slate-600">
                <span className="text-slate-300">
                  Waiting for <span className="text-vale-400 font-semibold">{currentTurnPlayer?.name}</span> to finish their turn...
                </span>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* Leave Confirmation Modal */}
      <Modal
        isOpen={showLeaveModal}
        onClose={() => setShowLeaveModal(false)}
        title="Leave Game?"
        size="sm"
      >
        <div className="text-center">
          <p className="text-slate-400 mb-6">
            Are you sure you want to leave the game? You won't be able to rejoin.
          </p>
          <div className="flex gap-4 justify-center">
            <Button variant="secondary" onClick={() => setShowLeaveModal(false)}>
              Cancel
            </Button>
            <Button variant="primary" onClick={confirmLeaveGame} data-testid="confirm-leave-btn">
              Leave Game
            </Button>
          </div>
        </div>
      </Modal>

      {/* Game Over Modal */}
      <Modal
        isOpen={showGameOverModal}
        onClose={() => {}}
        title="Game Over"
        size="md"
        showCloseButton={false}
      >
        <div className="text-center py-4">
          <h3 className="text-2xl font-bold text-vale-400 mb-6">Final Scores</h3>
          <div className="space-y-3 mb-6">
            {scores.map((player, index) => (
              <div
                key={player.playerId}
                className={cn(
                  'flex items-center justify-between p-4 rounded-lg',
                  index === 0
                    ? 'bg-amber-900/30 border border-amber-500'
                    : 'bg-slate-700/50 border border-slate-600'
                )}
              >
                <div className="flex items-center gap-3">
                  <span
                    className={cn(
                      'w-8 h-8 rounded-full flex items-center justify-center font-bold',
                      index === 0 ? 'bg-amber-500 text-amber-900' : 'bg-slate-600 text-slate-300'
                    )}
                  >
                    {index + 1}
                  </span>
                  <span
                    className={cn(
                      'font-semibold',
                      player.playerId === playerId ? 'text-vale-400' : 'text-slate-200'
                    )}
                  >
                    {player.name}
                    {player.playerId === playerId && ' (You)'}
                  </span>
                </div>
                <span className="text-2xl font-bold text-amber-400">{player.score}</span>
              </div>
            ))}
          </div>

          <Button onClick={confirmLeaveGame} data-testid="back-to-lobby-btn">
            Back to Lobby
          </Button>
        </div>
      </Modal>
    </div>
  )
}

export default MultiplayerGame
