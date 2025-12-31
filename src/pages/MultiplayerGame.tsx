/**
 * MultiplayerGame Page
 * Main multiplayer game interface with Firebase real-time synchronization
 * @version 5.7.1 - Disabled card selling in RESOLUTION phase
 */
console.log('[pages/MultiplayerGame.tsx] v5.7.1 loaded')

import { useEffect, useState, useCallback, useRef, useMemo } from 'react'
import { useParams, useLocation, useNavigate } from 'react-router-dom'
import { ref, onValue, off } from 'firebase/database'
import { database } from '@/lib/firebase'
import {
  multiplayerGameService,
  type GameRoom,
  type PlayerState,
  type CardInstanceData,
} from '@/services/multiplayer-game'
import {
  PlayerHand,
  Card,
  PlayerMarker,
  ScoreTrack,
  PlayersFieldArea,
  GameLayout,
  GameHeader,
  LeftSidebar,
  RightSidebar,
  ScoreBar,
} from '@/components/game'
import type { PlayerScoreInfo, PlayerFieldData, PlayerSidebarData, ScoreBarPlayerData } from '@/components/game'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { cn } from '@/lib/utils'
import type { CardInstance } from '@/types/cards'
import { type PlayerColor, PLAYER_COLORS } from '@/types/player-color'
import { createEmptyStonePool } from '@/types/game'
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
  onToggleCard: (cardId: string) => void
  onConfirmSelection: () => void
  cardSelectionMap: Map<string, { color: PlayerColor; playerName: string; isConfirmed: boolean }>
  mySelectedCardId: string | null
  hasSelectedCard: boolean
}

// ============================================
// WAITING ROOM COMPONENT
// ============================================

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

// ============================================
// HUNTING PHASE UI
// ============================================

function HuntingPhaseUI({
  marketCards,
  isYourTurn,
  currentPlayerName,
  currentPlayerId: _currentPlayerId,
  onToggleCard,
  onConfirmSelection,
  cardSelectionMap,
  mySelectedCardId,
  hasSelectedCard,
}: HuntingPhaseProps) {
  void _currentPlayerId

  return (
    <div className="flex-1 flex flex-col p-4 overflow-hidden" data-testid="hunting-phase">
      {/* Header */}
      <div className="text-center mb-4 flex-shrink-0">
        <h2 className="text-xl font-bold text-blue-400 mb-1">選卡階段</h2>
        <p className="text-sm text-slate-400">
          {isYourTurn
            ? hasSelectedCard
              ? '點擊「確認選擇」鎖定卡片，或點擊卡片取消/切換選擇'
              : '點擊一張卡片進行選擇'
            : `等待 ${currentPlayerName} 選擇卡片...`}
        </p>
      </div>

      {/* Card Grid - Scrollable */}
      <div className="flex-1 overflow-y-auto custom-scrollbar">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 justify-items-center pb-4">
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
                  compact={false}
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
    </div>
  )
}

// ============================================
// ACTION PHASE UI
// ============================================

interface ActionPhaseUIProps {
  playersFieldData: PlayerFieldData[]
  handCards: CardInstance[]
  playerScores: PlayerScoreInfo[]
  currentPlayerId: string
  currentRound: number
  isYourTurn: boolean
  onCardPlay: (cardId: string) => void
  onCardSell: (cardId: string) => void
  onHandCardDiscard: (cardId: string) => void
  onCardReturn: (playerId: string, cardId: string) => void
  onCardDiscard: (playerId: string, cardId: string) => void
  onScoreAdjust: (playerId: string, score: number) => void
  onFlipToggle: (playerId: string) => void
  canTameCard: (cardId: string) => boolean
  resolutionMode?: boolean
  onFinishResolution?: () => void
}

function ActionPhaseUI({
  playersFieldData,
  handCards,
  playerScores,
  currentPlayerId,
  currentRound,
  isYourTurn,
  onCardPlay,
  onCardSell,
  onHandCardDiscard,
  onCardReturn,
  onCardDiscard,
  onScoreAdjust,
  onFlipToggle,
  canTameCard,
  resolutionMode = false,
  onFinishResolution,
}: ActionPhaseUIProps) {
  // Split players: self first, others after
  const selfPlayer = playersFieldData.find(p => p.playerId === currentPlayerId)
  const otherPlayers = playersFieldData.filter(p => p.playerId !== currentPlayerId)

  return (
    <div className="flex-1 flex flex-col overflow-hidden" data-testid={resolutionMode ? "resolution-phase" : "action-phase"}>
      {/* Top Section - Field Area & Hand */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3 custom-scrollbar min-h-0">
        {/* Self Player's Field Area */}
        {selfPlayer && (
          <PlayersFieldArea
            players={[selfPlayer]}
            currentPlayerId={currentPlayerId}
            onCardReturn={onCardReturn}
            onCardDiscard={onCardDiscard}
          />
        )}

        {/* Player Hand Section */}
        <div>
          <PlayerHand
            cards={handCards}
            maxHandSize={10}
            showActions={isYourTurn}
            enableDrag={isYourTurn && !resolutionMode}
            onCardPlay={onCardPlay}
            onCardSell={resolutionMode ? undefined : onCardSell}
            onCardDiscard={onHandCardDiscard}
            canTameCard={canTameCard}
            currentRound={currentRound}
            className="rounded-xl border border-purple-900/30"
          />
        </div>

        {/* Other Players' Field Area */}
        {otherPlayers.length > 0 && (
          <PlayersFieldArea
            players={otherPlayers}
            currentPlayerId={currentPlayerId}
            onCardReturn={onCardReturn}
            onCardDiscard={onCardDiscard}
          />
        )}
      </div>

      {/* Bottom Section - Score Track */}
      <div className="flex-shrink-0 border-t border-purple-900/30 bg-gradient-to-t from-slate-900/80 to-transparent p-3">
        <ScoreTrack
          players={playerScores}
          maxScore={60}
          currentPlayerId={currentPlayerId}
          onScoreAdjust={onScoreAdjust}
          allowAdjustment={isYourTurn}
          onFlipToggle={onFlipToggle}
        />
      </div>

      {/* Resolution Mode - Finish Button */}
      {resolutionMode && isYourTurn && onFinishResolution && (
        <div className="flex-shrink-0 p-3 pt-2 border-t border-purple-900/30">
          <Button
            onClick={onFinishResolution}
            className="w-full bg-gradient-to-r from-purple-600 to-purple-500 hover:from-purple-500 hover:to-purple-400"
            data-testid="finish-resolution-btn"
          >
            完成結算（觸發回合結束效果）
          </Button>
        </div>
      )}

      {/* Resolution Mode - Waiting Message */}
      {resolutionMode && !isYourTurn && (
        <div className="flex-shrink-0 p-3 pt-2 border-t border-purple-900/30">
          <p className="text-center text-slate-400 text-sm">
            等待其他玩家完成結算...
          </p>
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
  const [showMarketDiscardModal, setShowMarketDiscardModal] = useState(false)
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

    const gameRef = ref(database, `games/${gameId}`)
    const playersRef = ref(database, `games/${gameId}/players`)
    const cardsRef = ref(database, `games/${gameId}/cards`)

    const handleGameUpdate = (snapshot: any) => {
      if (snapshot.exists()) {
        const data = snapshot.val() as GameRoom
        console.log('[MultiplayerGame] Game update:', data.status)
        setGameRoom(data)

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
          setCards({})
        }
      } else {
        setCards({})
      }
    }

    onValue(gameRef, handleGameUpdate)
    onValue(playersRef, handlePlayersUpdate)
    onValue(cardsRef, handleCardsUpdate)

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
      if (!cards || typeof cards !== 'object') return null

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
        effects: [],
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

  const discardedCards = useMemo(() => {
    if (!gameRoom?.discardIds) return []
    return gameRoom.discardIds
      .map(convertToCardInstance)
      .filter((c): c is CardInstance => c !== null)
  }, [gameRoom, convertToCardInstance])

  // Get latest discarded card (last in array)
  const latestDiscardedCard = useMemo(() => {
    if (discardedCards.length === 0) return null
    return discardedCards[discardedCards.length - 1]
  }, [discardedCards])

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

    if (gameRoom.status === 'RESOLUTION') {
      const playerIndex = gameRoom.currentPlayerIndex
      return gameRoom.playerIds[playerIndex] ?? ''
    }

    return ''
  }, [gameRoom, players])

  const currentTurnPlayer = useMemo(() => {
    return players.find((p) => p.playerId === currentTurnPlayerId)
  }, [players, currentTurnPlayerId])

  const isYourTurn = playerId === currentTurnPlayerId

  // Build card selection map for hunting phase
  const cardSelectionMap = useMemo(() => {
    const map = new Map<string, { color: PlayerColor; playerName: string; isConfirmed: boolean }>()

    if (!cards || typeof cards !== 'object') return map

    Object.values(cards).forEach((cardData) => {
      const selectingPlayerId = cardData.confirmedBy || cardData.selectedBy
      if (selectingPlayerId) {
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

  const mySelectedCardId = useMemo(() => {
    if (!cards || typeof cards !== 'object' || !playerId) return null

    const selectedCard = Object.values(cards).find(
      (card) => card.selectedBy === playerId && !card.confirmedBy
    )
    return selectedCard?.instanceId ?? null
  }, [cards, playerId])

  const hasSelectedCard = useMemo(() => {
    return mySelectedCardId !== null
  }, [mySelectedCardId])

  // Player data for sidebar
  const playersSidebarData = useMemo((): PlayerSidebarData[] => {
    return players.map(player => ({
      playerId: player.playerId,
      name: player.name,
      color: player.color || 'green',
      index: player.index,
      stones: player.stones || createEmptyStonePool(),
      handCount: player.hand?.length ?? 0,
      fieldCount: player.field?.length ?? 0,
      score: player.score ?? 0,
      hasPassed: player.hasPassed ?? false,
      isReady: player.isReady,
    }))
  }, [players])

  // Player score data for score track
  const playerScores = useMemo((): PlayerScoreInfo[] => {
    return players.map(player => ({
      playerId: player.playerId,
      playerName: player.name,
      color: player.color || 'green',
      score: player.score ?? 0,
      isFlipped: player.isFlipped ?? false,
    }))
  }, [players])

  // Player data for score bar (bottom)
  const scoreBarData = useMemo((): ScoreBarPlayerData[] => {
    return players.map(player => ({
      playerId: player.playerId,
      name: player.name,
      color: player.color || 'green',
      score: player.score ?? 0,
    }))
  }, [players])

  // Player field data for PlayersFieldArea
  const playersFieldData = useMemo((): PlayerFieldData[] => {
    return players.map(player => {
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

  const handleDiscardCard = useCallback(
    async (cardInstanceId: string) => {
      if (!gameId || !playerId) return

      try {
        await multiplayerGameService.discardHandCard(gameId, playerId, cardInstanceId)
      } catch (err: any) {
        setError(err.message || 'Failed to discard card')
      }
    },
    [gameId, playerId]
  )

  const handleReturnCard = useCallback(
    async (_playerId: string, cardInstanceId: string) => {
      if (!gameId || !playerId) return

      try {
        await multiplayerGameService.returnCardToHand(gameId, playerId, cardInstanceId)
      } catch (err: any) {
        setError(err.message || 'Failed to return card')
      }
    },
    [gameId, playerId]
  )

  const handleReturnFieldCardToHand = useCallback(
    async (_playerId: string, cardInstanceId: string) => {
      if (!gameId || !playerId) return

      try {
        await multiplayerGameService.returnFieldCardToHand(gameId, playerId, cardInstanceId)
      } catch (err: any) {
        setError(err.message || 'Failed to return field card to hand')
      }
    },
    [gameId, playerId]
  )

  const handleDiscardFieldCard = useCallback(
    async (_playerId: string, cardInstanceId: string) => {
      if (!gameId || !playerId) return

      try {
        await multiplayerGameService.discardFieldCard(gameId, playerId, cardInstanceId)
      } catch (err: any) {
        setError(err.message || 'Failed to discard field card')
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

  const handleReturnCoinToBank = useCallback(
    async (coinType: StoneType) => {
      if (!gameId || !playerId) return

      try {
        await multiplayerGameService.returnCoinToBank(gameId, playerId, coinType)
      } catch (err: any) {
        setError(err.message || 'Failed to return coin to bank')
      }
    },
    [gameId, playerId]
  )

  const handleReturnCardFromDiscard = useCallback(
    async (cardInstanceId: string) => {
      if (!gameId || !playerId) return

      try {
        await multiplayerGameService.returnCardFromDiscard(gameId, playerId, cardInstanceId)
      } catch (err: any) {
        setError(err.message || 'Failed to return card from discard pile')
      }
    },
    [gameId, playerId]
  )

  const handleTakeCardFromMarketDiscard = useCallback(
    async (cardInstanceId: string) => {
      if (!gameId || !playerId) return

      try {
        await multiplayerGameService.takeCardFromMarketDiscard(gameId, playerId, cardInstanceId)
        setShowMarketDiscardModal(false)
      } catch (err: any) {
        setError(err.message || 'Failed to take card from market discard pile')
      }
    },
    [gameId, playerId]
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

  // Main Game UI with Symmetric Layout
  return (
    <>
      <GameLayout
        testId="multiplayer-game"
        header={
          <GameHeader
            roomCode={gameRoom.roomCode}
            phase={gameRoom.status}
            round={gameRoom.currentRound}
            currentPlayerName={currentTurnPlayer?.name ?? 'Unknown'}
            isYourTurn={isYourTurn}
            onLeave={handleLeaveGame}
            onPassTurn={handlePassTurn}
            showPassTurn={gameRoom.status === 'ACTION'}
          />
        }
        leftSidebar={
          <LeftSidebar
            players={playersSidebarData}
            currentPlayerId={playerId ?? ''}
            currentTurnPlayerId={currentTurnPlayerId}
            phase={gameRoom.status}
          />
        }
        rightSidebar={
          <RightSidebar
            bankCoins={gameRoom.bankCoins || createEmptyStonePool()}
            playerCoins={currentPlayer?.stones || createEmptyStonePool()}
            playerName={currentPlayer?.name ?? ''}
            discardCount={0}
            marketDiscardCount={gameRoom.discardIds?.length ?? 0}
            latestDiscardedCard={latestDiscardedCard}
            isYourTurn={isYourTurn}
            phase={gameRoom.status}
            onTakeCoin={handleTakeCoinFromBank}
            onReturnCoin={handleReturnCoinToBank}
            onDiscardClick={() => setShowMarketDiscardModal(true)}
            onMarketDiscardClick={() => setShowMarketDiscardModal(true)}
            onConfirmSelection={handleConfirmCardSelection}
            onEndTurn={handlePassTurn}
          />
        }
        scoreBar={
          <ScoreBar
            players={scoreBarData}
            currentPlayerId={playerId ?? ''}
            maxScore={60}
          />
        }
        mainContent={
          <>
            {/* Hunting Phase */}
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

            {/* Action Phase */}
            {gameRoom.status === 'ACTION' && (
              <ActionPhaseUI
                playersFieldData={playersFieldData}
                handCards={handCards}
                playerScores={playerScores}
                currentPlayerId={playerId ?? ''}
                currentRound={gameRoom.currentRound}
                isYourTurn={isYourTurn}
                onCardPlay={handleTameCard}
                onCardSell={handleSellCard}
                onHandCardDiscard={handleDiscardCard}
                onCardReturn={handleReturnCard}
                onCardDiscard={handleDiscardFieldCard}
                onScoreAdjust={handleScoreAdjust}
                onFlipToggle={handleFlipToggle}
                canTameCard={() => true}
              />
            )}

            {/* Resolution Phase */}
            {gameRoom.status === 'RESOLUTION' && (
              <ActionPhaseUI
                playersFieldData={playersFieldData}
                handCards={handCards}
                playerScores={playerScores}
                currentPlayerId={playerId ?? ''}
                currentRound={gameRoom.currentRound}
                isYourTurn={isYourTurn}
                onCardPlay={handleTameCard}
                onCardSell={() => {}} // Disabled in resolution phase
                onHandCardDiscard={handleDiscardCard}
                onCardReturn={handleReturnCard}
                onCardDiscard={handleDiscardFieldCard}
                onScoreAdjust={handleScoreAdjust}
                onFlipToggle={handleFlipToggle}
                canTameCard={() => false}  // Cannot tame during resolution
                resolutionMode={true}
                onFinishResolution={async () => {
                  if (!gameId || !playerId) return
                  try {
                    await multiplayerGameService.finishResolution(gameId, playerId)
                  } catch (err: any) {
                    setError(err.message || 'Failed to finish resolution')
                  }
                }}
              />
            )}
          </>
        }
      />

      {/* Error Toast */}
      {error && (
        <div
          className="fixed top-20 left-1/2 -translate-x-1/2 z-50 bg-red-600 text-white px-6 py-3 rounded-lg shadow-lg animate-slide-up"
          data-testid="error-toast"
        >
          {error}
        </div>
      )}

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

      {/* Market Discard Pile Modal */}
      <Modal
        isOpen={showMarketDiscardModal}
        onClose={() => setShowMarketDiscardModal(false)}
        title="市場棄置牌堆"
        size="xl"
      >
        <div className="p-6">
          {discardedCards.length === 0 ? (
            <div className="text-center text-slate-500 py-8">
              市場尚無棄置的卡片
            </div>
          ) : (
            <>
              <p className="text-sm text-slate-400 mb-6">
                共 {discardedCards.length} 張卡片已棄置{isYourTurn ? '（點擊拿取按鈕拿回到手上）' : ''}
              </p>
              <div className="flex flex-wrap gap-6 max-h-[70vh] overflow-y-auto justify-start px-4">
                {discardedCards.map((card, index) => {
                  console.log('[MarketDiscardModal] Rendering card:', index, 'isYourTurn:', isYourTurn)
                  return (
                    <div
                      key={card.instanceId}
                      className="animate-fade-in relative"
                      style={{
                        animationDelay: `${index * 30}ms`,
                        width: '9rem',  // 144px - about 40% of original 358px
                        height: '13.5rem'  // 216px - about 40% of original 538px
                      }}
                    >
                      {/* Card scaled down */}
                      <div className="transform scale-[0.4] origin-top-left">
                        <Card card={card} index={index} compact={false} />
                      </div>
                      {/* Take button - positioned at the bottom of the scaled container */}
                      {isYourTurn ? (
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            console.log('[MarketDiscardModal] Take button clicked for card:', card.instanceId)
                            handleTakeCardFromMarketDiscard(card.instanceId)
                          }}
                          className="absolute bottom-0 left-0 right-0 z-50 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold py-2 px-3 rounded-lg transition-all shadow-lg hover:shadow-blue-500/50 hover:scale-105"
                          type="button"
                          title="拿到手上"
                        >
                          拿取卡片
                        </button>
                      ) : (
                        <div className="absolute bottom-0 left-0 right-0 z-50 bg-slate-600 text-slate-300 text-xs font-bold py-2 px-3 rounded-lg text-center">
                          等待回合
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </>
          )}
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
                    {player.playerId === playerId && ' (你)'}
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
    </>
  )
}

export default MultiplayerGame
