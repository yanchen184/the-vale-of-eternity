/**
 * MultiplayerGame Page
 * Main multiplayer game interface with Firebase real-time synchronization
 * @version 3.7.0 - Refactored ACTION phase layout with PlayersInfoArea and PlayersFieldArea
 */
console.log('[pages/MultiplayerGame.tsx] v3.7.0 loaded')

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
import {
  PlayerHand,
  Card,
  PlayerMarker,
  ScoreTrack,
  PlayersInfoArea,
  PlayersFieldArea,
  BankArea,
} from '@/components/game'
import type { PlayerScoreInfo, PlayerInfoData, PlayerFieldData } from '@/components/game'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { cn } from '@/lib/utils'
import type { CardInstance } from '@/types/cards'
import { type PlayerColor, PLAYER_COLORS } from '@/types/player-color'
import { calculateStonePoolValue } from '@/types/game'
import { StoneType } from '@/types/cards'

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
  currentPlayerId: string
  /** Toggle card selection (can be cancelled before confirmation) */
  onToggleCard: (cardId: string) => void
  /** Confirm the current selection (locks it in) */
  onConfirmSelection: () => void
  /** Map of cardInstanceId -> { color, playerName, isConfirmed } */
  cardSelectionMap: Map<string, { color: PlayerColor; playerName: string; isConfirmed: boolean }>
  /** Card ID currently selected by the current player (not yet confirmed) */
  mySelectedCardId: string | null
  /** Whether the current player has a card selected (ready to confirm) */
  hasSelectedCard: boolean
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
    WAITING: '等待中',
    HUNTING: '選卡階段',
    ACTION: '行動階段',
    RESOLUTION: '結算中',
    ENDED: '遊戲結束',
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
                房間代碼: <span className="text-amber-400 font-mono font-bold">{roomCode}</span>
              </span>
              {phase !== 'WAITING' && (
                <span className="text-slate-400">
                  回合: <span className="text-slate-200 font-medium">{round}</span>
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
              {isYourTurn ? '輪到你了！' : `${currentPlayerName} 的回合`}
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
          離開遊戲
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
      <h3 className="text-lg font-semibold text-slate-200 mb-4">玩家列表</h3>
      <div className="space-y-3">
        {players.map((player) => {
          const isCurrentTurn = player.playerId === currentTurnPlayerId
          const isYou = player.playerId === currentPlayerId
          const stones = player.stones || { ONE: 0, THREE: 0, SIX: 0 }
          const totalStoneValue = (
            (stones.ONE || 0) * 1 +
            (stones.THREE || 0) * 3 +
            (stones.SIX || 0) * 6
          )
          const playerColor = player.color || 'green'

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
                <div className="flex items-center gap-2">
                  {/* Player color marker */}
                  <PlayerMarker
                    color={playerColor}
                    size="sm"
                    showGlow={isCurrentTurn && phase !== 'WAITING'}
                    playerName={player.name}
                  />
                  <span className={cn('font-medium', isYou ? 'text-vale-400' : 'text-slate-200')}>
                    {player.name}
                    {isYou && ' (你)'}
                  </span>
                </div>
                {player.hasPassed && (
                  <span className="text-xs text-slate-500 px-2 py-0.5 rounded bg-slate-700">
                    已跳過
                  </span>
                )}
              </div>
              <div className="flex items-center gap-3 text-xs text-slate-400">
                <span>手牌: {player.hand?.length ?? 0}</span>
                <span>場上: {player.field?.length ?? 0}</span>
                <span>石頭: {totalStoneValue}</span>
              </div>
              {player.isReady && phase === 'WAITING' && (
                <div className="mt-2 text-xs text-emerald-400">準備完成</div>
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
          <h2 className="text-2xl font-bold text-white mb-2">遊戲房間</h2>
          <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-600">
            <span className="text-sm text-slate-400">房間代碼</span>
            <div className="text-4xl font-mono font-bold text-amber-400 tracking-wider">
              {roomCode}
            </div>
            <span className="text-xs text-slate-500">
              分享此代碼給朋友加入遊戲
            </span>
          </div>
        </div>

        {/* Player List */}
        <div className="mb-8">
          <h3 className="text-lg font-semibold text-slate-200 mb-4">
            玩家 ({players.length}/{maxPlayers})
          </h3>
          <div className="space-y-2">
            {players.map((player, index) => {
              const playerColor = player.color || 'green'
              const colorConfig = PLAYER_COLORS[playerColor]

              return (
                <div
                  key={player.playerId}
                  className="flex items-center gap-3 p-3 rounded-lg bg-slate-800/50 border border-slate-700"
                  data-testid={`waiting-player-${index}`}
                >
                  {/* Player color marker */}
                  <PlayerMarker
                    color={playerColor}
                    size="md"
                    showGlow={false}
                    playerName={player.name}
                  />
                  <span className="flex-1 text-slate-200">{player.name}</span>
                  <span
                    className="text-xs px-2 py-1 rounded"
                    style={{
                      backgroundColor: `${colorConfig.hex}30`,
                      color: colorConfig.hex,
                    }}
                  >
                    {colorConfig.nameTw}
                  </span>
                  {index === 0 && (
                    <span className="text-xs text-amber-400 px-2 py-1 rounded bg-amber-900/30">
                      房主
                    </span>
                  )}
                </div>
              )
            })}

            {/* Empty Slots */}
            {Array.from({ length: maxPlayers - players.length }).map((_, i) => (
              <div
                key={`empty-${i}`}
                className="flex items-center gap-3 p-3 rounded-lg bg-slate-800/20 border border-dashed border-slate-700"
              >
                <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center text-slate-500">
                  {players.length + i + 1}
                </div>
                <span className="text-slate-500">等待玩家加入...</span>
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
            離開
          </Button>
          {isHost && (
            <Button
              variant="primary"
              onClick={onStartGame}
              disabled={!canStart}
              className="flex-1"
              data-testid="start-game-btn"
            >
              {canStart ? '開始遊戲' : `還需要 ${2 - players.length} 位玩家`}
            </Button>
          )}
        </div>

        {!isHost && (
          <p className="text-center text-sm text-slate-400 mt-4">
            等待房主開始遊戲...
          </p>
        )}
      </div>
    </div>
  )
}

/**
 * Hunting Phase UI
 * Supports toggle selection (can cancel) and confirm selection (locks in)
 */
function HuntingPhaseUI({
  marketCards,
  isYourTurn,
  currentPlayerName,
  currentPlayerId: _currentPlayerId, // Used for future features like showing player's selection status
  onToggleCard,
  onConfirmSelection,
  cardSelectionMap,
  mySelectedCardId,
  hasSelectedCard,
}: HuntingPhaseProps) {
  void _currentPlayerId // Suppress unused warning
  return (
    <div
      className="bg-slate-800/50 rounded-xl border border-blue-700/50 p-6 mb-6"
      data-testid="hunting-phase"
    >
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-blue-400 mb-2">選卡階段</h2>
        <p className="text-slate-400">
          {isYourTurn
            ? hasSelectedCard
              ? '點擊「確認選擇」鎖定卡片，或點擊卡片取消/切換選擇'
              : '點擊一張卡片進行選擇'
            : `等待 ${currentPlayerName} 選擇卡片...`}
        </p>
        <p className="text-xs text-slate-500 mt-1">
          已確認的卡片會顯示鎖定圖示，無法再更改
        </p>
      </div>

      {/* Card Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 justify-items-center mb-6">
        {marketCards.map((card, index) => {
          const selectionInfo = cardSelectionMap.get(card.instanceId)
          const isConfirmed = selectionInfo?.isConfirmed ?? false
          const isMySelection = mySelectedCardId === card.instanceId
          // Can only click if: it's your turn AND card is not confirmed by anyone
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
                onClick={() => canClick && onToggleCard(card.instanceId)}
                selectedByColor={selectionInfo?.color}
                selectedByName={selectionInfo?.playerName}
                isConfirmed={isConfirmed}
                isSelected={isMySelection}
                className={cn(
                  // My current selection (not confirmed) - blue pulsing border
                  isMySelection && !isConfirmed && 'ring-4 ring-blue-400 ring-opacity-75',
                  // Clickable hover effect
                  canClick && 'hover:border-blue-400 hover:shadow-blue-500/50',
                  // Confirmed cards - darker overlay
                  isConfirmed && 'border-slate-500'
                )}
              />
              {/* Dark overlay for confirmed cards */}
              {isConfirmed && (
                <div className="absolute inset-0 bg-black/30 rounded-lg pointer-events-none" />
              )}
            </div>
          )
        })}
      </div>

      {/* Confirm Button - only shown when it's your turn */}
      {isYourTurn && (
        <div className="flex justify-center">
          <Button
            variant="primary"
            size="lg"
            onClick={onConfirmSelection}
            disabled={!hasSelectedCard}
            data-testid="confirm-selection-btn"
            className={cn(
              'min-w-48 transition-all',
              hasSelectedCard
                ? 'bg-emerald-600 hover:bg-emerald-500 animate-pulse'
                : 'bg-slate-600 cursor-not-allowed'
            )}
          >
            {hasSelectedCard ? '確認選擇' : '請先選擇一張卡片'}
          </Button>
        </div>
      )}
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
        const cardsData = snapshot.val()
        if (cardsData && typeof cardsData === 'object') {
          setCards(cardsData)
        } else {
          console.warn('[MultiplayerGame] Invalid cards data:', cardsData)
          setCards({})
        }
      } else {
        setCards({})
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
      if (!cards || typeof cards !== 'object') {
        console.warn('[MultiplayerGame] cards is not available:', cards)
        return null
      }

      const cardData = cards[instanceId]
      if (!cardData) {
        console.warn('[MultiplayerGame] Card not found:', instanceId)
        return null
      }

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
    if (!gameRoom?.marketIds) return []
    return gameRoom.marketIds
      .map(convertToCardInstance)
      .filter((c): c is CardInstance => c !== null)
  }, [gameRoom, convertToCardInstance])

  const handCards = useMemo(() => {
    if (!currentPlayer?.hand) return []
    return currentPlayer.hand
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

  // Stone pool for current player (for canTameCard check)
  const totalStoneValue = useMemo(() => {
    if (!currentPlayer?.stones) return 0
    const stones = currentPlayer.stones
    return (
      (stones.ONE || 0) * 1 +
      (stones.THREE || 0) * 3 +
      (stones.SIX || 0) * 6 +
      (stones.WATER || 0) * 1 +
      (stones.FIRE || 0) * 1 +
      (stones.EARTH || 0) * 1 +
      (stones.WIND || 0) * 1
    )
  }, [currentPlayer?.stones])

  // Build card selection map for hunting phase
  // Maps cardInstanceId -> { color, playerName, isConfirmed }
  const cardSelectionMap = useMemo(() => {
    const map = new Map<string, { color: PlayerColor; playerName: string; isConfirmed: boolean }>()

    if (!cards || typeof cards !== 'object') return map

    // Look through all cards for ones with selectedBy or confirmedBy set
    Object.values(cards).forEach((cardData) => {
      const selectingPlayerId = cardData.confirmedBy || cardData.selectedBy
      if (selectingPlayerId) {
        // Find the player who selected/confirmed this card
        const selectingPlayer = players.find((p) => p.playerId === selectingPlayerId)
        if (selectingPlayer) {
          map.set(cardData.instanceId, {
            color: selectingPlayer.color || 'green',
            playerName: selectingPlayer.name,
            isConfirmed: !!cardData.confirmedBy,
          })
        }
      }
    })

    return map
  }, [cards, players])

  // Get the card ID currently selected by the current player (not confirmed yet)
  const mySelectedCardId = useMemo(() => {
    if (!cards || typeof cards !== 'object' || !playerId) return null

    const selectedCard = Object.values(cards).find(
      (card) => card.selectedBy === playerId && !card.confirmedBy
    )
    return selectedCard?.instanceId ?? null
  }, [cards, playerId])

  // Check if current player has a card selected (ready to confirm)
  const hasSelectedCard = useMemo(() => {
    return mySelectedCardId !== null
  }, [mySelectedCardId])

  // Player score data for score track
  const playerScores = useMemo((): PlayerScoreInfo[] => {
    return players.map(player => ({
      playerId: player.playerId,
      playerName: player.name,
      color: player.color || 'green',
      score: player.score,
      isFlipped: player.isFlipped ?? false,
    }))
  }, [players])

  // Player info data for PlayersInfoArea
  const playersInfoData = useMemo((): PlayerInfoData[] => {
    return players.map(player => ({
      playerId: player.playerId,
      name: player.name,
      color: player.color || 'green',
      stones: player.stones || { ONE: 0, THREE: 0, SIX: 0, WATER: 0, FIRE: 0, EARTH: 0, WIND: 0 },
      handCount: player.hand?.length ?? 0,
      fieldCount: player.field?.length ?? 0,
      hasPassed: player.hasPassed ?? false,
    }))
  }, [players])

  // Player field data for PlayersFieldArea
  const playersFieldData = useMemo((): PlayerFieldData[] => {
    return players.map(player => {
      // Convert field card IDs to CardInstance objects
      const fieldCardInstances = (player.field || [])
        .map(convertToCardInstance)
        .filter((c): c is CardInstance => c !== null)

      return {
        playerId: player.playerId,
        name: player.name,
        color: player.color || 'green',
        fieldCards: fieldCardInstances,
        isCurrentTurn: player.playerId === currentTurnPlayerId,
        hasPassed: player.hasPassed ?? false,
      }
    })
  }, [players, currentTurnPlayerId, convertToCardInstance])

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

  // Toggle card selection (can be cancelled before confirmation)
  const handleToggleCardSelection = useCallback(
    async (cardInstanceId: string) => {
      if (!gameId || !playerId) return

      try {
        await multiplayerGameService.toggleCardSelection(gameId, playerId, cardInstanceId)
      } catch (err: any) {
        setError(err.message || 'Failed to toggle card selection')
      }
    },
    [gameId, playerId]
  )

  // Confirm card selection (locks it in and advances to next player)
  const handleConfirmCardSelection = useCallback(async () => {
    if (!gameId || !playerId) return

    try {
      await multiplayerGameService.confirmCardSelection(gameId, playerId)
    } catch (err: any) {
      setError(err.message || 'Failed to confirm selection')
    }
  }, [gameId, playerId])

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

  const handleScoreAdjust = useCallback(
    async (targetPlayerId: string, newScore: number) => {
      if (!gameId) return

      try {
        await multiplayerGameService.adjustPlayerScore(gameId, targetPlayerId, newScore)
      } catch (err: any) {
        setError(err.message || 'Failed to adjust score')
      }
    },
    [gameId]
  )

  const handleFlipToggle = useCallback(
    async (targetPlayerId: string) => {
      if (!gameId) return

      try {
        await multiplayerGameService.togglePlayerFlip(gameId, targetPlayerId)
      } catch (err: any) {
        setError(err.message || 'Failed to toggle flip state')
      }
    },
    [gameId]
  )

  const handleTakeCoinFromBank = useCallback(
    async (coinType: StoneType) => {
      if (!gameId || !playerId) return

      try {
        await multiplayerGameService.takeCoinFromBank(gameId, playerId, coinType)
      } catch (err: any) {
        setError(err.message || 'Failed to take coin from bank')
      }
    },
    [gameId, playerId]
  )

  const canTameCard = useCallback(
    (cardInstanceId: string): boolean => {
      const card = cards[cardInstanceId]
      if (!card || !currentPlayer) return false
      return totalStoneValue >= card.cost
    },
    [cards, currentPlayer, totalStoneValue]
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
          <div className="text-slate-400 text-lg mb-4">連接遊戲中...</div>
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
          <div className="text-red-400 text-lg mb-4">{error || '找不到遊戲'}</div>
          <Button onClick={() => navigate('/multiplayer')}>返回大廳</Button>
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
              currentPlayerId={playerId ?? ''}
              onToggleCard={handleToggleCardSelection}
              onConfirmSelection={handleConfirmCardSelection}
              cardSelectionMap={cardSelectionMap}
              mySelectedCardId={mySelectedCardId}
              hasSelectedCard={hasSelectedCard}
            />
          )}

          {/* Action Phase UI */}
          {gameRoom.status === 'ACTION' && (
            <>
              {/* 1. Score Track - 分數進度條 */}
              <ScoreTrack
                players={playerScores}
                maxScore={60}
                currentPlayerId={playerId ?? ''}
                onScoreAdjust={handleScoreAdjust}
                allowAdjustment={isYourTurn}
                onFlipToggle={handleFlipToggle}
              />

              {/* 2. Bank Area - 銀行錢幣池 */}
              <BankArea
                bankCoins={gameRoom.bankCoins}
                allowInteraction={isYourTurn}
                onTakeCoin={handleTakeCoinFromBank}
              />

              {/* 3. Players Info Area - 所有玩家的資訊(錢幣+手牌數量) */}
              <PlayersInfoArea
                players={playersInfoData}
                currentPlayerId={playerId ?? ''}
                currentTurnPlayerId={currentTurnPlayerId}
              />

              {/* 4. Players Field Area - 所有玩家的場上卡片 */}
              <PlayersFieldArea
                players={playersFieldData}
                currentPlayerId={playerId ?? ''}
              />

              {/* 5. Player Hand - 自己的手牌 */}
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
        </main>
      </div>

      {/* Leave Confirmation Modal */}
      <Modal
        isOpen={showLeaveModal}
        onClose={() => setShowLeaveModal(false)}
        title="離開遊戲？"
        size="sm"
      >
        <div className="text-center">
          <p className="text-slate-400 mb-6">
            確定要離開遊戲嗎？離開後將無法重新加入。
          </p>
          <div className="flex gap-4 justify-center">
            <Button variant="secondary" onClick={() => setShowLeaveModal(false)}>
              取消
            </Button>
            <Button variant="primary" onClick={confirmLeaveGame} data-testid="confirm-leave-btn">
              離開遊戲
            </Button>
          </div>
        </div>
      </Modal>

      {/* Game Over Modal */}
      <Modal
        isOpen={showGameOverModal}
        onClose={() => {}}
        title="遊戲結束"
        size="md"
        showCloseButton={false}
      >
        <div className="text-center py-4">
          <h3 className="text-2xl font-bold text-vale-400 mb-6">最終分數</h3>
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
            返回大廳
          </Button>
        </div>
      </Modal>
    </div>
  )
}

export default MultiplayerGame
