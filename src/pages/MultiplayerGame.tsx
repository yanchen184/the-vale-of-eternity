/**
 * MultiplayerGame Page
 * Main multiplayer game interface with Firebase real-time synchronization
 * @version 5.13.0 - Enhanced card scale controls (50%-150%, 10% step) applied to main game area
 */
console.log('[pages/MultiplayerGame.tsx] v5.13.0 loaded')

import { useEffect, useState, useCallback, useRef, useMemo } from 'react'
import { useParams, useLocation, useNavigate } from 'react-router-dom'
import { ref, onValue, off } from 'firebase/database'
import { Maximize2, Minimize2 } from 'lucide-react'
import { database } from '@/lib/firebase'
import {
  multiplayerGameService,
  type GameRoom,
  type PlayerState,
  type CardInstanceData,
} from '@/services/multiplayer-game'
import {
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
import { DraggableHandWindow } from '@/components/game/DraggableHandWindow'
import { ArtifactSelector } from '@/components/game/ArtifactSelector'
import { CompactArtifactSelector } from '@/components/game/CompactArtifactSelector'
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
  currentRound?: number
  onToggleCard: (cardId: string) => void
  onConfirmSelection: () => void
  cardSelectionMap: Map<string, { color: PlayerColor; playerName: string; isConfirmed: boolean }>
  mySelectedCardId: string | null
  hasSelectedCard: boolean
  // Artifact selection props (v5.11.0 - Expansion mode)
  isExpansionMode?: boolean
  availableArtifacts?: string[]
  usedArtifacts?: string[]
  artifactSelectionMap?: Map<string, { color: PlayerColor; playerName: string; isConfirmed: boolean }>
  onSelectArtifact?: (artifactId: string) => void
  playerName?: string
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
  currentRound,
  onToggleCard,
  onConfirmSelection: _onConfirmSelection,
  cardSelectionMap,
  mySelectedCardId,
  hasSelectedCard,
  isExpansionMode,
  availableArtifacts,
  usedArtifacts,
  artifactSelectionMap,
  onSelectArtifact,
  playerName,
}: HuntingPhaseProps) {
  void _currentPlayerId
  void _onConfirmSelection // Reserved for future use

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
                  currentRound={currentRound}
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

      {/* Artifact Selection at Bottom (Expansion Mode Only) */}
      {isExpansionMode && availableArtifacts && onSelectArtifact && (
        <div className="flex-shrink-0 mt-4 border-t border-purple-500/30 pt-4">
          <CompactArtifactSelector
            availableArtifacts={availableArtifacts}
            usedArtifacts={usedArtifacts || []}
            artifactSelections={artifactSelectionMap}
            round={currentRound || 1}
            playerName={playerName || '玩家'}
            onSelectArtifact={onSelectArtifact}
            isActive={true}
          />
        </div>
      )}
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
  handCards: _handCards,
  playerScores: _playerScores,
  currentPlayerId,
  currentRound,
  isYourTurn: _isYourTurn,
  onCardPlay: _onCardPlay,
  onCardSell: _onCardSell,
  onHandCardDiscard: _onHandCardDiscard,
  onCardReturn,
  onCardDiscard,
  onScoreAdjust: _onScoreAdjust,
  onFlipToggle: _onFlipToggle,
  canTameCard: _canTameCard,
  resolutionMode = false,
  onFinishResolution,
}: ActionPhaseUIProps) {
  // Reserved for future use
  void _handCards
  void _playerScores
  void _isYourTurn
  void _onCardPlay
  void _onCardSell
  void _onHandCardDiscard
  void _onScoreAdjust
  void _onFlipToggle
  void _canTameCard
  // Split players: self first, others after
  const selfPlayer = playersFieldData.find(p => p.playerId === currentPlayerId)
  const otherPlayers = playersFieldData.filter(p => p.playerId !== currentPlayerId)

  return (
    <div className="flex-1 flex flex-col overflow-hidden" data-testid={resolutionMode ? "resolution-phase" : "action-phase"}>
      {/* Top Section - Field Area & Hand */}
      <div className="flex-1 overflow-y-auto p-2 space-y-1 custom-scrollbar min-h-0">
        {/* Self Player's Field Area */}
        {selfPlayer && (
          <PlayersFieldArea
            players={[selfPlayer]}
            currentPlayerId={currentPlayerId}
            currentRound={currentRound}
            onCardReturn={onCardReturn}
            onCardDiscard={onCardDiscard}
          />
        )}

        {/* Player Hand - Now in floating window */}

        {/* Other Players' Field Area */}
        {otherPlayers.length > 0 && (
          <PlayersFieldArea
            players={otherPlayers}
            currentPlayerId={currentPlayerId}
            currentRound={currentRound}
            onCardReturn={onCardReturn}
            onCardDiscard={onCardDiscard}
          />
        )}
      </div>

      {/* Resolution Mode - Finish Button */}
      {resolutionMode && _isYourTurn && onFinishResolution && (
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
      {resolutionMode && !_isYourTurn && (
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
  const [showScoreModal, setShowScoreModal] = useState(false)
  const [showAllFieldsModal, setShowAllFieldsModal] = useState(false)
  const [showSanctuaryModal, setShowSanctuaryModal] = useState(false)
  const [scores, setScores] = useState<{ playerId: string; name: string; score: number }[]>([])
  const [cardScale, setCardScale] = useState(100) // Card size: 50% to 150% (step 10%)

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

  // Artifact Selection Map (similar to cardSelectionMap)
  const artifactSelectionMap = useMemo(() => {
    const map = new Map<string, { color: PlayerColor; playerName: string; isConfirmed: boolean }>()

    if (!gameRoom?.artifactSelectionPhase?.selections) return map

    // artifactSelectionPhase.selections: { [playerId: string]: artifactId }
    Object.entries(gameRoom.artifactSelectionPhase.selections).forEach(([selectingPlayerId, artifactId]) => {
      const selectingPlayer = players.find((p) => p.playerId === selectingPlayerId)
      if (selectingPlayer && artifactId) {
        map.set(artifactId, {
          color: selectingPlayer.color || 'green',
          playerName: selectingPlayer.name,
          isConfirmed: gameRoom.artifactSelectionPhase?.isComplete ?? false,
        })
      }
    })

    return map
  }, [gameRoom?.artifactSelectionPhase, players])

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

      const sanctuaryCardInstances = (player.sanctuary || [])
        .map(convertToCardInstance)
        .filter((c): c is CardInstance => c !== null)

      return {
        playerId: player.playerId,
        name: player.name,
        color: player.color || 'green',
        fieldCards: fieldCardInstances,
        sanctuaryCards: sanctuaryCardInstances,
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

  const handleDrawCard = useCallback(async () => {
    if (!gameId || !playerId) return

    try {
      await multiplayerGameService.drawCardFromDeck(gameId, playerId)
    } catch (err: any) {
      setError(err.message || 'Failed to draw card from deck')
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

  // Artifact selection handler (Expansion Mode)
  const handleArtifactSelect = useCallback(
    async (artifactId: string) => {
      console.log('[MultiplayerGame] handleArtifactSelect called:', {
        artifactId,
        gameId,
        playerId,
        hasGameRoom: !!gameRoom,
        currentRound: gameRoom?.currentRound,
      })

      if (!gameId || !playerId || !gameRoom) {
        console.warn('[MultiplayerGame] handleArtifactSelect: Missing required data', {
          hasGameId: !!gameId,
          hasPlayerId: !!playerId,
          hasGameRoom: !!gameRoom,
        })
        return
      }

      try {
        console.log('[MultiplayerGame] Calling selectArtifact service...')
        await multiplayerGameService.selectArtifact(
          gameId,
          playerId,
          artifactId,
          gameRoom.currentRound
        )
        console.log('[MultiplayerGame] selectArtifact service completed successfully')
      } catch (err: any) {
        console.error('[MultiplayerGame] selectArtifact error:', err)
        setError(err.message || 'Failed to select artifact')
      }
    },
    [gameId, playerId, gameRoom]
  )

  // Calculate used artifacts for current player (previous rounds only)
  const usedArtifacts = useMemo(() => {
    if (!gameRoom?.artifactSelections || !playerId) return []
    const playerSelections = gameRoom.artifactSelections[playerId] || {}
    const used: string[] = []
    for (const [roundStr, artifactId] of Object.entries(playerSelections)) {
      const selectionRound = parseInt(roundStr, 10)
      // Include all previous round selections (current round's selection is already used)
      if (selectionRound < gameRoom.currentRound) {
        used.push(artifactId)
      }
    }
    return used
  }, [gameRoom?.artifactSelections, gameRoom?.currentRound, playerId])

  // Determine if artifact selection is needed
  const isArtifactSelectionActive = useMemo(() => {
    if (!gameRoom?.isExpansionMode) return false
    if (gameRoom.status !== 'HUNTING') return false
    if (!gameRoom.artifactSelectionPhase) return false
    return !gameRoom.artifactSelectionPhase.isComplete
  }, [gameRoom?.isExpansionMode, gameRoom?.status, gameRoom?.artifactSelectionPhase])

  // Get current artifact selector player
  const artifactSelectorPlayerId = useMemo(() => {
    if (!isArtifactSelectionActive || !gameRoom?.artifactSelectionPhase) return ''
    const playerIndex = gameRoom.artifactSelectionPhase.currentPlayerIndex
    return gameRoom.playerIds[playerIndex] ?? ''
  }, [isArtifactSelectionActive, gameRoom?.artifactSelectionPhase, gameRoom?.playerIds])

  const artifactSelectorPlayer = useMemo(() => {
    return players.find((p) => p.playerId === artifactSelectorPlayerId)
  }, [players, artifactSelectorPlayerId])

  const isYourArtifactTurn = playerId === artifactSelectorPlayerId

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

  // Mark reserved but currently unused handlers to suppress TypeScript warnings
  // These handlers are kept for future card effect implementations
  void handleReturnFieldCardToHand
  void handleReturnCardFromDiscard

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
            onViewScore={() => setShowScoreModal(true)}
            onViewAllFields={() => setShowAllFieldsModal(true)}
            onViewSanctuary={() => setShowSanctuaryModal(true)}
            onPassTurn={handlePassTurn}
            showPassTurn={gameRoom.status === 'ACTION'}
            cardScaleControls={
              <div className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-slate-700/50 border border-slate-600/50">
                <button
                  onClick={() => setCardScale(Math.max(50, cardScale - 10))}
                  className="p-1 rounded hover:bg-slate-600/50 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                  disabled={cardScale <= 50}
                  title="縮小 (10%)"
                >
                  <Minimize2 className="w-3.5 h-3.5 text-slate-300" />
                </button>
                <span className="text-xs font-medium text-slate-300 min-w-[2.5rem] text-center">
                  {cardScale}%
                </span>
                <button
                  onClick={() => setCardScale(Math.min(150, cardScale + 10))}
                  className="p-1 rounded hover:bg-slate-600/50 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                  disabled={cardScale >= 150}
                  title="放大 (10%)"
                >
                  <Maximize2 className="w-3.5 h-3.5 text-slate-300" />
                </button>
              </div>
            }
          />
        }
        leftSidebar={
          <LeftSidebar
            players={playersSidebarData}
            currentPlayerId={playerId ?? ''}
            currentTurnPlayerId={currentTurnPlayerId}
            phase={gameRoom.status}
            deckCount={gameRoom.deckIds?.length ?? 0}
            onDrawCard={handleDrawCard}
            marketDiscardCount={gameRoom.discardIds?.length ?? 0}
            latestDiscardedCard={latestDiscardedCard}
            onDiscardClick={() => setShowMarketDiscardModal(true)}
          />
        }
        rightSidebar={
          <RightSidebar
            bankCoins={gameRoom.bankCoins || createEmptyStonePool()}
            playerCoins={currentPlayer?.stones || createEmptyStonePool()}
            playerName={currentPlayer?.name ?? ''}
            isYourTurn={isYourTurn}
            phase={gameRoom.status}
            onTakeCoin={handleTakeCoinFromBank}
            onReturnCoin={handleReturnCoinToBank}
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
          <div
            className="w-full h-full overflow-auto custom-scrollbar"
            style={{
              transform: `scale(${cardScale / 100})`,
              transformOrigin: 'top center',
              minWidth: `${100 / (cardScale / 100)}%`,
              minHeight: `${100 / (cardScale / 100)}%`,
            }}
          >
            {/* Hunting Phase - Card Selection with Artifact Selection at Bottom (v5.11.0) */}
            {gameRoom.status === 'HUNTING' && (
              <HuntingPhaseUI
                marketCards={marketCards}
                isYourTurn={isYourTurn}
                currentPlayerName={currentTurnPlayer?.name ?? 'Unknown'}
                currentPlayerId={playerId ?? ''}
                currentRound={gameRoom.currentRound}
                onToggleCard={handleToggleCardSelection}
                onConfirmSelection={handleConfirmCardSelection}
                cardSelectionMap={cardSelectionMap}
                mySelectedCardId={mySelectedCardId}
                hasSelectedCard={hasSelectedCard}
                isExpansionMode={gameRoom.isExpansionMode}
                availableArtifacts={gameRoom.availableArtifacts}
                usedArtifacts={usedArtifacts}
                artifactSelectionMap={artifactSelectionMap}
                onSelectArtifact={handleArtifactSelect}
                playerName={currentPlayer?.name ?? playerName ?? 'Unknown'}
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
          </div>
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

      {/* Score Modal */}
      <Modal
        isOpen={showScoreModal}
        onClose={() => setShowScoreModal(false)}
        size="wide"
      >
        <div className="p-6">
          <ScoreTrack
            players={playerScores}
            maxScore={60}
            currentPlayerId={playerId ?? ''}
            onScoreAdjust={handleScoreAdjust}
            allowAdjustment={isYourTurn}
            onFlipToggle={handleFlipToggle}
          />
        </div>
      </Modal>

      {/* All Fields Modal */}
      <Modal
        isOpen={showAllFieldsModal}
        onClose={() => setShowAllFieldsModal(false)}
        size="wide"
        title="所有玩家的怪獸區"
      >
        <div className="p-6 max-h-[70vh] overflow-y-auto custom-scrollbar">
          <div style={{ transform: `scale(${cardScale / 100})`, transformOrigin: 'top center' }}>
            <PlayersFieldArea
              players={playersFieldData}
              currentPlayerId={playerId ?? ''}
              currentRound={gameRoom.currentRound}
            />
          </div>
        </div>
      </Modal>

      {/* Sanctuary Modal */}
      <Modal
        isOpen={showSanctuaryModal}
        onClose={() => setShowSanctuaryModal(false)}
        size="wide"
        title="所有玩家的庇護區"
      >
        <div className="p-6 max-h-[70vh] overflow-y-auto custom-scrollbar">
          <div className="space-y-4" style={{ transform: `scale(${cardScale / 100})`, transformOrigin: 'top center' }}>
            {players.map(player => {
              const sanctuaryCards = (player.sanctuary || [])
                .map(cardId => cards[cardId])
                .filter((card): card is CardInstance => card !== undefined)

              return (
                <div
                  key={player.playerId}
                  className="bg-slate-800/40 rounded-xl border-2 border-slate-700/30 p-4"
                >
                  {/* Player Header */}
                  <div className="flex items-center gap-3 mb-3">
                    <PlayerMarker
                      color={player.color}
                      size="sm"
                      showGlow={false}
                      playerName={player.name}
                    />
                    <span className="text-sm font-semibold text-slate-300">
                      {player.name}
                      {player.playerId === playerId && ' (你)'}
                    </span>
                    <span className="text-xs text-slate-500">
                      ({sanctuaryCards.length} 張)
                    </span>
                  </div>

                  {/* Sanctuary Cards - Staggered Stack Display */}
                  {sanctuaryCards.length === 0 ? (
                    <div className="flex items-center justify-center h-24 text-slate-600 text-sm">
                      <span>庇護區為空</span>
                    </div>
                  ) : (
                    <div className="relative" style={{ minHeight: '180px' }}>
                      {sanctuaryCards.map((card, index) => (
                        <div
                          key={card.instanceId}
                          className="absolute transition-all duration-200 hover:z-10 hover:scale-105"
                          style={{
                            left: `${index * 20}px`,
                            top: `${index * 8}px`,
                            zIndex: index,
                          }}
                        >
                          <Card
                            card={card}
                            index={index}
                            compact={true}
                            className="shadow-lg"
                          />
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      </Modal>

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
                共 {discardedCards.length} 張卡片已棄置
                {isYourTurn ? '（點擊拿取按鈕拿回到手上）' : '（點擊拿取按鈕放到場上）'}
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
                        <Card card={card} index={index} compact={false} currentRound={gameRoom?.currentRound} />
                      </div>
                      {/* Take button - always available */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          console.log('[MarketDiscardModal] Take button clicked for card:', card.instanceId, 'isYourTurn:', isYourTurn)
                          handleTakeCardFromMarketDiscard(card.instanceId)
                        }}
                        className={cn(
                          'absolute bottom-0 left-0 right-0 z-50 text-white text-xs font-bold py-2 px-3 rounded-lg transition-all shadow-lg hover:scale-105',
                          isYourTurn
                            ? 'bg-blue-600 hover:bg-blue-500 hover:shadow-blue-500/50'
                            : 'bg-green-600 hover:bg-green-500 hover:shadow-green-500/50'
                        )}
                        type="button"
                        title={isYourTurn ? '拿到手上' : '放到場上'}
                      >
                        {isYourTurn ? '拿到手上' : '放到場上'}
                      </button>
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

      {/* Draggable Hand Window - Floating */}
      <DraggableHandWindow
        cards={handCards}
        onCardClick={(card) => {
          // Handle card selection if needed
          console.log('Hand card clicked:', card)
        }}
        onTameCard={(cid) => {
          handleTameCard(cid)
        }}
        onSellCard={(cardId) => {
          handleSellCard(cardId)
        }}
        onDiscardCard={(cardId) => {
          handleDiscardCard(cardId)
        }}
        showCardActions={isYourTurn}
        canTameCard={(_cardId) => {
          // 只要是你的回合就能召喚
          if (!isYourTurn) return false
          if (gameRoom?.status !== 'ACTION') return false
          return true
        }}
        currentRound={gameRoom?.currentRound}
      />
    </>
  )
}

export default MultiplayerGame
