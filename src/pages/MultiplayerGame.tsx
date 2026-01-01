/**
 * MultiplayerGame Page
 * Main multiplayer game interface with Firebase real-time synchronization
 * @version 6.0.0 - New fixed hand panel system with grid/strip layouts
 */
console.log('[pages/MultiplayerGame.tsx] v6.0.0 loaded')

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
import { FixedHandPanel } from '@/components/game/FixedHandPanel'
// ArtifactSelector imported but not used - kept for potential future use
// import { ArtifactSelector } from '@/components/game/ArtifactSelector'
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

/** Seven-League Boots state from Firebase */
interface SevenLeagueBootsState {
  activePlayerId: string
  extraCardId: string
  selectedCardId?: string
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
  disabledArtifacts?: string[]  // v5.27.0 - Artifacts disabled due to requirements not met
  artifactSelectionMap?: Map<string, { color: PlayerColor; playerName: string; isConfirmed: boolean }>
  onSelectArtifact?: (artifactId: string) => void
  playerName?: string
  artifactSelectorPlayerName?: string  // v5.23.0 - Name of player whose turn it is to select artifact
  isYourArtifactTurn?: boolean
  isArtifactSelectionActive?: boolean  // v5.20.0
  // Seven-League Boots props (v5.21.0)
  sevenLeagueBootsState?: SevenLeagueBootsState | null
  isInSevenLeagueBootsSelection?: boolean
  onSelectSevenLeagueBootsCard?: (cardId: string) => void
  onConfirmSevenLeagueBootsSelection?: () => void
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
  disabledArtifacts,
  artifactSelectionMap,
  onSelectArtifact,
  playerName,
  artifactSelectorPlayerName,
  isYourArtifactTurn,
  isArtifactSelectionActive,
  // Seven-League Boots props (v5.22.0)
  sevenLeagueBootsState,
  isInSevenLeagueBootsSelection,
  onSelectSevenLeagueBootsCard,
  onConfirmSevenLeagueBootsSelection: _onConfirmSevenLeagueBootsSelection,
}: HuntingPhaseProps) {
  void _currentPlayerId
  void _onConfirmSelection // Reserved for future use
  void _onConfirmSevenLeagueBootsSelection // Confirm button is in RightSidebar

  // Determine which phase to show
  const showSevenLeagueBootsSelection = !!sevenLeagueBootsState
  const showArtifactSelection = isExpansionMode && isArtifactSelectionActive && !showSevenLeagueBootsSelection

  // Get header info based on current state
  const getHeaderInfo = () => {
    if (showSevenLeagueBootsSelection) {
      return {
        title: '七里靴效果',
        description: isInSevenLeagueBootsSelection
          ? sevenLeagueBootsState?.selectedCardId
            ? '已選擇卡片，點擊「確認庇護」將卡片加入棲息地'
            : '選擇一張卡片加入棲息地'
          : `等待 ${currentPlayerName} 選擇庇護卡片...`,
        headerColor: 'text-purple-400',
      }
    }
    if (showArtifactSelection) {
      return {
        title: '神器選擇階段',
        description: isYourArtifactTurn
          ? '選擇一個神器，然後點擊「確認選擇」'
          : `等待 ${currentPlayerName} 選擇神器...`,
        headerColor: 'text-blue-400',
      }
    }
    return {
      title: '選卡階段',
      description: isYourTurn
        ? hasSelectedCard
          ? '點擊「確認選擇」鎖定卡片，或點擊卡片取消/切換選擇'
          : '點擊一張卡片進行選擇'
        : `等待 ${currentPlayerName} 選擇卡片...`,
      headerColor: 'text-blue-400',
    }
  }

  const headerInfo = getHeaderInfo()

  return (
    <div className="flex-1 flex flex-col p-4 overflow-hidden" data-testid="hunting-phase">
      {/* Header */}
      <div className="text-center mb-4 flex-shrink-0">
        <h2 className={cn('text-xl font-bold mb-1', headerInfo.headerColor)}>
          {headerInfo.title}
        </h2>
        <p className="text-sm text-slate-400">
          {headerInfo.description}
        </p>
      </div>

      {/* Seven-League Boots Instruction Banner (v5.22.0) */}
      {showSevenLeagueBootsSelection && (
        <div className="mb-4 p-3 bg-purple-900/30 border border-purple-500/50 rounded-lg flex-shrink-0">
          <p className="text-sm text-purple-300 text-center">
            {isInSevenLeagueBootsSelection
              ? '點擊市場上的一張卡片，將其加入你的棲息地（不需支付費用）'
              : '等待其他玩家完成七里靴選擇...'}
          </p>
        </div>
      )}

      {/* Card Grid - Always show market cards */}
      <div className="flex-1 overflow-y-auto custom-scrollbar">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 justify-items-center pb-4">
          {marketCards.map((card, index) => {
            const selectionInfo = cardSelectionMap.get(card.instanceId)
            const isConfirmed = selectionInfo?.isConfirmed ?? false
            const isMySelection = mySelectedCardId === card.instanceId

            // Seven-League Boots selection mode
            if (showSevenLeagueBootsSelection) {
              const isSelectedForShelter = sevenLeagueBootsState?.selectedCardId === card.instanceId
              const canClickForShelter = isInSevenLeagueBootsSelection

              return (
                <div
                  key={card.instanceId}
                  className={cn(
                    'transition-all relative',
                    canClickForShelter
                      ? 'hover:scale-105 cursor-pointer'
                      : 'opacity-60 cursor-not-allowed'
                  )}
                  data-testid={`seven-league-boots-card-${index}`}
                >
                  <Card
                    card={card}
                    index={index}
                    compact={false}
                    currentRound={currentRound}
                    onClick={() => canClickForShelter && onSelectSevenLeagueBootsCard?.(card.instanceId)}
                    isSelected={isSelectedForShelter}
                    className={cn(
                      isSelectedForShelter && 'ring-4 ring-purple-400 ring-opacity-75 shadow-purple-500/50',
                      canClickForShelter && !isSelectedForShelter && 'hover:border-purple-400 hover:shadow-purple-500/50'
                    )}
                  />
                  {/* Selected for shelter indicator */}
                  {isSelectedForShelter && (
                    <div className="absolute -top-2 -right-2 bg-purple-500 text-white text-xs font-bold px-2 py-1 rounded-full shadow-lg z-10">
                      庇護
                    </div>
                  )}
                </div>
              )
            }

            // Normal card selection mode
            // Disable card selection during artifact selection phase
            const canClick = isYourTurn && !isConfirmed && !showArtifactSelection

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

        {/* Artifact Selection at Bottom - Show only during artifact selection phase */}
        {showArtifactSelection && availableArtifacts && onSelectArtifact && (
          <div className="flex-shrink-0 mt-4 border-t border-purple-500/30 pt-4">
            <CompactArtifactSelector
              availableArtifacts={availableArtifacts}
              usedArtifacts={usedArtifacts || []}
              artifactSelections={artifactSelectionMap}
              round={currentRound || 1}
              playerName={artifactSelectorPlayerName || playerName || '玩家'}
              onSelectArtifact={onSelectArtifact}
              isActive={isYourArtifactTurn ?? false}
              disabledArtifacts={disabledArtifacts}
            />
          </div>
        )}
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
  gameStatus: 'WAITING' | 'HUNTING' | 'ACTION' | 'RESOLUTION' | 'ENDED'
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
  gameStatus,
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
    <div className="flex-1 flex flex-col" data-testid={resolutionMode ? "resolution-phase" : "action-phase"}>
      {/* Top Section - Field Area & Hand */}
      <div className="flex-1 overflow-y-auto overflow-x-visible p-2 space-y-1 custom-scrollbar min-h-0">
        {/* Self Player's Field Area */}
        {selfPlayer && (
          <PlayersFieldArea
            players={[selfPlayer]}
            currentPlayerId={currentPlayerId}
            phase={gameStatus}
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
            phase={gameStatus}
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
  // cardScale removed - now using FixedHandPanel with自適應 sizing

  // Extract state from location or redirect
  const originalPlayerId = state?.playerId
  const originalPlayerName = state?.playerName
  const roomCode = state?.roomCode
  const isHost = state?.isHost ?? false

  // Dev mode: Allow switching player perspective (v6.1.0)
  const [devModePlayerId] = useState<string | null>(null)
  const playerId = devModePlayerId || originalPlayerId
  const playerName = devModePlayerId
    ? players.find(p => p.playerId === devModePlayerId)?.name || originalPlayerName
    : originalPlayerName

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
        console.log('[MultiplayerGame] Game update:', {
          status: data.status,
          currentPlayerIndex: data.currentPlayerIndex,
          isComplete: data.artifactSelectionPhase?.isComplete,
        })
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

  // Sync showScoreModal from Firebase (controlled by current turn player)
  useEffect(() => {
    if (!gameRoom) return

    // Update local state to match Firebase state
    setShowScoreModal(gameRoom.showScoreModal ?? false)
  }, [gameRoom?.showScoreModal])

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

  // Get current turn player
  const currentTurnPlayerId = useMemo(() => {
    if (!gameRoom || !players.length) return ''

    if (gameRoom.status === 'HUNTING') {
      // During artifact selection phase, use global currentPlayerIndex
      if (gameRoom.artifactSelectionPhase && !gameRoom.artifactSelectionPhase.isComplete) {
        const playerIndex = gameRoom.currentPlayerIndex
        return gameRoom.playerIds[playerIndex] ?? ''
      }
      // During hunting phase (card selection), use huntingPhase.currentPlayerIndex
      if (gameRoom.huntingPhase) {
        const playerIndex = gameRoom.huntingPhase.currentPlayerIndex
        return gameRoom.playerIds[playerIndex] ?? ''
      }
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
      zoneBonus: player.zoneBonus || 0,
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

  // Handle Score Modal (synchronized for current turn player)
  const handleToggleScoreModal = useCallback(async (show: boolean) => {
    if (!gameId || !playerId) return

    // If it's your turn, sync to Firebase so everyone sees it
    if (isYourTurn) {
      try {
        await multiplayerGameService.updateGameRoom(gameId, {
          showScoreModal: show
        })
      } catch (err: any) {
        console.error('Failed to sync score modal state:', err)
      }
    } else {
      // If not your turn, just update local state (shouldn't normally happen)
      setShowScoreModal(show)
    }
  }, [gameId, playerId, isYourTurn])

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

  const handleToggleZoneBonus = useCallback(
    async () => {
      if (!gameId || !playerId) return

      try {
        await multiplayerGameService.toggleZoneBonus(gameId, playerId)
      } catch (err: any) {
        setError(err.message || 'Failed to toggle zone bonus')
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

  // Handle moving card from hand to sanctuary (expansion mode)
  const handleMoveToSanctuary = useCallback(
    async (cardInstanceId: string) => {
      if (!gameId || !playerId) return

      try {
        await multiplayerGameService.moveCardToSanctuary(gameId, playerId, cardInstanceId)
      } catch (err: any) {
        setError(err.message || 'Failed to move card to sanctuary')
      }
    },
    [gameId, playerId]
  )

  // Handle moving card from sanctuary back to hand (expansion mode)
  const handleMoveFromSanctuary = useCallback(
    async (cardInstanceId: string) => {
      if (!gameId || !playerId) return

      try {
        await multiplayerGameService.moveCardFromSanctuary(gameId, playerId, cardInstanceId)
      } catch (err: any) {
        setError(err.message || 'Failed to move card from sanctuary')
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

  // Seven-League Boots handlers (v5.22.0)
  const handleSelectSevenLeagueBootsCard = useCallback(
    async (cardId: string) => {
      if (!gameId || !playerId) return
      try {
        await multiplayerGameService.selectSevenLeagueBootsCard(gameId, playerId, cardId)
      } catch (err: any) {
        setError(err.message || 'Failed to select card for Seven-League Boots')
      }
    },
    [gameId, playerId]
  )

  const handleConfirmSevenLeagueBootsSelection = useCallback(
    async () => {
      if (!gameId || !playerId) return
      try {
        await multiplayerGameService.confirmSevenLeagueBootsSelection(gameId, playerId)
      } catch (err: any) {
        setError(err.message || 'Failed to confirm Seven-League Boots selection')
      }
    },
    [gameId, playerId]
  )

  // Pied Piper's Pipe handlers
  const handlePiedPiperPipeChoice = useCallback(
    async (choice: 'draw' | 'recall') => {
      if (!gameId || !playerId) return
      try {
        await multiplayerGameService.executePiedPiperPipe(gameId, playerId, choice)
      } catch (err: any) {
        setError(err.message || 'Failed to execute Pied Piper\'s Pipe')
      }
    },
    [gameId, playerId]
  )

  // Philosopher's Stone handlers
  const [philosopherStoneRecallCard, setPhilosopherStoneRecallCard] = useState<string | null>(null)
  const [philosopherStoneDiscardCard, setPhilosopherStoneDiscardCard] = useState<string | null>(null)
  const [selectedHandCardId, setSelectedHandCardId] = useState<string | null>(null)

  const handlePhilosopherStoneConfirm = useCallback(
    async () => {
      if (!gameId || !playerId) return
      if (!philosopherStoneRecallCard && !philosopherStoneDiscardCard) {
        setError('請至少選擇一個動作')
        return
      }
      try {
        await multiplayerGameService.executePhilosopherStone(
          gameId,
          playerId,
          philosopherStoneRecallCard || undefined,
          philosopherStoneDiscardCard || undefined
        )
        setPhilosopherStoneRecallCard(null)
        setPhilosopherStoneDiscardCard(null)
      } catch (err: any) {
        setError(err.message || 'Failed to execute Philosopher\'s Stone')
      }
    },
    [gameId, playerId, philosopherStoneRecallCard, philosopherStoneDiscardCard]
  )

  // Calculate used artifacts for current player (only previous round)
  const usedArtifacts = useMemo(() => {
    if (!gameRoom?.artifactSelections || !playerId) return []
    const playerSelections = gameRoom.artifactSelections[playerId] || {}
    const used: string[] = []
    for (const [roundStr, artifactId] of Object.entries(playerSelections)) {
      const selectionRound = parseInt(roundStr, 10)
      // Only include artifacts from the previous round (上一回合)
      // Artifacts from earlier rounds (下下回合之前) can be used again
      if (selectionRound === gameRoom.currentRound - 1) {
        used.push(artifactId)
      }
    }
    console.log('[MultiplayerGame] usedArtifacts calculation:', {
      currentRound: gameRoom.currentRound,
      allSelections: playerSelections,
      usedFromPreviousRound: used,
    })
    return used
  }, [gameRoom?.artifactSelections, gameRoom?.currentRound, playerId])

  // Calculate disabled artifacts based on requirements
  const disabledArtifacts = useMemo(() => {
    const disabled: string[] = []

    // Philosopher's Stone requires at least 1 card in sanctuary
    // (can recall from sanctuary OR discard from sanctuary)
    const hasSanctuaryCards = (currentPlayer?.sanctuary?.length ?? 0) > 0
    if (!hasSanctuaryCards) {
      disabled.push('philosopher_stone')
    }

    console.log('[MultiplayerGame] disabledArtifacts calculation:', {
      sanctuaryCount: currentPlayer?.sanctuary?.length ?? 0,
      hasSanctuaryCards,
      disabled,
    })

    return disabled
  }, [currentPlayer?.sanctuary])

  // Calculate ALL selected artifacts for current player (including current round) - v5.26.0
  const mySelectedArtifacts = useMemo(() => {
    if (!gameRoom?.artifactSelections || !playerId) return []
    const playerSelections = gameRoom.artifactSelections[playerId] || {}
    return Object.values(playerSelections).filter((id): id is string => !!id)
  }, [gameRoom?.artifactSelections, playerId])

  // Determine if artifact selection is needed
  const isArtifactSelectionActive = useMemo(() => {
    if (!gameRoom?.isExpansionMode) return false
    if (gameRoom.status !== 'HUNTING') return false
    if (!gameRoom.artifactSelectionPhase) return false
    return !gameRoom.artifactSelectionPhase.isComplete
  }, [gameRoom?.isExpansionMode, gameRoom?.status, gameRoom?.artifactSelectionPhase?.isComplete])

  // Get current artifact selector player
  const artifactSelectorPlayerId = useMemo(() => {
    if (!isArtifactSelectionActive || !gameRoom?.artifactSelectionPhase) return ''
    const playerIndex = gameRoom.currentPlayerIndex
    const playerId = gameRoom.playerIds[playerIndex] ?? ''
    console.log('[MultiplayerGame] artifactSelectorPlayerId recalculated:', {
      currentPlayerIndex: playerIndex,
      artifactSelectorPlayerId: playerId,
      allPlayerIds: gameRoom.playerIds,
    })
    return playerId
  }, [isArtifactSelectionActive, gameRoom?.currentPlayerIndex, gameRoom?.playerIds])

  // Get artifact selector player for display
  const artifactSelectorPlayer = useMemo(() => {
    const player = players.find((p) => p.playerId === artifactSelectorPlayerId)
    console.log('[MultiplayerGame] artifactSelectorPlayer lookup:', {
      artifactSelectorPlayerId,
      playersCount: players.length,
      playerIds: players.map((p) => p.playerId),
      foundPlayer: player,
      playerName: player?.name,
    })
    return player
  }, [players, artifactSelectorPlayerId])

  const isYourArtifactTurn = playerId === artifactSelectorPlayerId

  // Debug log for artifact turn changes
  useEffect(() => {
    if (isArtifactSelectionActive) {
      console.log('[MultiplayerGame] Artifact turn check:', {
        myPlayerId: playerId,
        artifactSelectorPlayerId,
        isYourArtifactTurn,
      })
    }
  }, [isArtifactSelectionActive, playerId, artifactSelectorPlayerId, isYourArtifactTurn])

  // Seven-League Boots state (v5.22.0)
  const sevenLeagueBootsState = useMemo(() => {
    return gameRoom?.artifactSelectionPhase?.sevenLeagueBoots ?? null
  }, [gameRoom?.artifactSelectionPhase?.sevenLeagueBoots])

  const isInSevenLeagueBootsSelection = useMemo(() => {
    return sevenLeagueBootsState?.activePlayerId === playerId
  }, [sevenLeagueBootsState, playerId])

  // Pied Piper's Pipe state
  const piedPiperPipeState = useMemo(() => {
    return gameRoom?.artifactSelectionPhase?.piedPiperPipe ?? null
  }, [gameRoom?.artifactSelectionPhase?.piedPiperPipe])

  const isInPiedPiperPipeSelection = useMemo(() => {
    return piedPiperPipeState?.activePlayerId === playerId
  }, [piedPiperPipeState, playerId])

  // Philosopher's Stone state
  const philosopherStoneState = useMemo(() => {
    return gameRoom?.artifactSelectionPhase?.philosopherStone ?? null
  }, [gameRoom?.artifactSelectionPhase?.philosopherStone])

  const isInPhilosopherStoneSelection = useMemo(() => {
    return philosopherStoneState?.activePlayerId === playerId
  }, [philosopherStoneState, playerId])

  // Confirm card or artifact or Seven-League Boots selection
  const handleConfirmCardSelection = useCallback(async () => {
    if (!gameId || !playerId) return

    try {
      // If in Seven-League Boots selection phase, confirm shelter selection
      if (sevenLeagueBootsState && isInSevenLeagueBootsSelection) {
        await multiplayerGameService.confirmSevenLeagueBootsSelection(gameId, playerId)
      }
      // If in artifact selection phase, confirm artifact selection instead
      else if (isArtifactSelectionActive && isYourArtifactTurn) {
        await multiplayerGameService.confirmArtifactSelection(gameId, playerId, gameRoom!.currentRound)
      } else {
        // Normal card selection confirmation
        await multiplayerGameService.confirmCardSelection(gameId, playerId)
      }
    } catch (err: any) {
      setError(err.message || 'Failed to confirm selection')
    }
  }, [gameId, playerId, sevenLeagueBootsState, isInSevenLeagueBootsSelection, isArtifactSelectionActive, isYourArtifactTurn, gameRoom])

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
  void handleMoveToSanctuary
  void handleMoveFromSanctuary

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
            onViewScore={() => handleToggleScoreModal(true)}
            onViewAllFields={() => setShowAllFieldsModal(true)}
            onViewSanctuary={() => setShowSanctuaryModal(true)}
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
            deckCount={gameRoom.deckIds?.length ?? 0}
            onDrawCard={handleDrawCard}
            onToggleZoneBonus={handleToggleZoneBonus}
            currentRound={gameRoom.currentRound}
            mySelectedArtifacts={mySelectedArtifacts}
            allArtifactSelections={gameRoom.artifactSelections || {}}
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
            isInSevenLeagueBootsSelection={isInSevenLeagueBootsSelection}
            hasSelectedShelterCard={!!sevenLeagueBootsState?.selectedCardId}
            isYourArtifactTurn={isYourArtifactTurn}
            isArtifactSelectionActive={isArtifactSelectionActive}
          />
        }
        scoreBar={
          <ScoreBar
            players={scoreBarData}
            currentPlayerId={playerId ?? ''}
            maxScore={60}
            discardCount={gameRoom.discardIds?.length ?? 0}
            onDiscardClick={() => setShowMarketDiscardModal(true)}
          />
        }
        mainContent={
          <div className="w-full h-full overflow-auto custom-scrollbar">
            {/* Hunting Phase - Card Selection with Artifact Selection at Bottom (v5.11.0) */}
            {/* Seven-League Boots integration added in v5.22.0 */}
            {gameRoom.status === 'HUNTING' && (
              <HuntingPhaseUI
                marketCards={marketCards}
                isYourTurn={isYourTurn}
                currentPlayerName={
                  isArtifactSelectionActive
                    ? artifactSelectorPlayer?.name ?? 'Unknown'
                    : currentTurnPlayer?.name ?? 'Unknown'
                }
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
                disabledArtifacts={disabledArtifacts}
                artifactSelectionMap={artifactSelectionMap}
                onSelectArtifact={handleArtifactSelect}
                playerName={currentPlayer?.name ?? playerName ?? 'Unknown'}
                artifactSelectorPlayerName={artifactSelectorPlayer?.name}
                isYourArtifactTurn={isYourArtifactTurn}
                isArtifactSelectionActive={isArtifactSelectionActive}
                sevenLeagueBootsState={sevenLeagueBootsState}
                isInSevenLeagueBootsSelection={isInSevenLeagueBootsSelection}
                onSelectSevenLeagueBootsCard={handleSelectSevenLeagueBootsCard}
                onConfirmSevenLeagueBootsSelection={handleConfirmSevenLeagueBootsSelection}
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
                gameStatus={gameRoom.status}
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
                gameStatus={gameRoom.status}
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
        onClose={() => handleToggleScoreModal(false)}
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
          <PlayersFieldArea
            players={playersFieldData}
            currentPlayerId={playerId ?? ''}
            phase={gameRoom.status}
            currentRound={gameRoom.currentRound}
          />
        </div>
      </Modal>

      {/* Sanctuary Modal */}
      <Modal
        isOpen={showSanctuaryModal}
        onClose={() => setShowSanctuaryModal(false)}
        size="wide"
        title="所有玩家的棲息地"
      >
        <div className="p-4 max-h-[75vh] overflow-y-auto custom-scrollbar">
          <div className="space-y-4">
            {players.map(player => {
              const sanctuaryCards = (player.sanctuary || [])
                .map(cardId => cards[cardId])
                .filter((card): card is CardInstance => card !== undefined)

              return (
                <div
                  key={player.playerId}
                  className="bg-slate-800/40 rounded-xl border-2 border-slate-700/30 p-3"
                >
                  {/* Player Header */}
                  <div className="flex items-center gap-2 mb-3">
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

                  {/* Sanctuary Cards - Compact Grid Layout */}
                  {sanctuaryCards.length === 0 ? (
                    <div className="flex items-center justify-center h-20 text-slate-600 text-sm">
                      <span>棲息地為空</span>
                    </div>
                  ) : (
                    <div
                      className="grid gap-2"
                      style={{
                        gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))',
                      }}
                    >
                      {sanctuaryCards.map((card, index) => {
                        const isOwnSanctuary = player.playerId === playerId
                        const canMoveBack = isOwnSanctuary && isYourTurn

                        return (
                          <div
                            key={card.instanceId}
                            className="relative flex flex-col items-center"
                          >
                            <Card
                              card={card}
                              index={index}
                              compact={true}
                              className="shadow-lg hover:scale-105 transition-transform"
                            />
                            {/* Move to Hand Button - Only for own sanctuary during own turn */}
                            {canMoveBack && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation()
                                  console.log('[Sanctuary] Moving card from sanctuary:', card.instanceId)
                                  console.log('[Sanctuary] isYourTurn:', isYourTurn, 'playerId:', playerId, 'player.playerId:', player.playerId)
                                  handleMoveFromSanctuary(card.instanceId)
                                }}
                                className="mt-1 px-3 py-1 text-xs font-bold bg-blue-600 hover:bg-blue-500 text-white rounded-full shadow-lg transition-colors"
                                title="將此卡片移回手牌"
                              >
                                回到手牌
                              </button>
                            )}
                          </div>
                        )
                      })}
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

      {/* Pied Piper's Pipe Modal */}
      <Modal
        isOpen={!!piedPiperPipeState}
        onClose={() => {}} // Cannot close until choice is made
        size="md"
        title="吹笛人之笛效果"
      >
        <div className="p-6">
          <p className="text-slate-300 mb-6 text-center">
            選擇一個效果：
          </p>

          <div className="space-y-4">
            <button
              onClick={() => handlePiedPiperPipeChoice('draw')}
              disabled={!isInPiedPiperPipeSelection}
              className={cn(
                'w-full p-4 rounded-lg border-2 transition-all',
                isInPiedPiperPipeSelection
                  ? 'border-blue-500 bg-blue-900/20 hover:bg-blue-900/40 cursor-pointer'
                  : 'border-slate-600 bg-slate-800/40 cursor-not-allowed opacity-50'
              )}
            >
              <div className="text-left">
                <div className="text-lg font-bold text-blue-400 mb-1">從牌庫抽 1 張卡</div>
                <div className="text-sm text-slate-400">將牌庫頂的卡片加入你的手牌</div>
              </div>
            </button>

            <button
              onClick={() => handlePiedPiperPipeChoice('recall')}
              disabled={!isInPiedPiperPipeSelection}
              className={cn(
                'w-full p-4 rounded-lg border-2 transition-all',
                isInPiedPiperPipeSelection
                  ? 'border-purple-500 bg-purple-900/20 hover:bg-purple-900/40 cursor-pointer'
                  : 'border-slate-600 bg-slate-800/40 cursor-not-allowed opacity-50'
              )}
            >
              <div className="text-left">
                <div className="text-lg font-bold text-purple-400 mb-1">召回棲息地所有卡</div>
                <div className="text-sm text-slate-400">將棲息地的所有卡片返回手牌</div>
              </div>
            </button>
          </div>

          {!isInPiedPiperPipeSelection && (
            <p className="text-amber-400 text-sm mt-4 text-center">
              等待其他玩家選擇...
            </p>
          )}
        </div>
      </Modal>

      {/* Philosopher's Stone Modal */}
      <Modal
        isOpen={!!philosopherStoneState}
        onClose={() => {}} // Cannot close until action is done
        size="lg"
        title="賢者之石效果"
      >
        <div className="p-6">
          <p className="text-slate-300 mb-4 text-center">
            從棲息地選擇卡片（可選擇一個或兩個動作）：
          </p>

          {isInPhilosopherStoneSelection && (
            <div className="space-y-6">
              {/* Recall Action - Select from sanctuary */}
              <div className="bg-purple-900/20 border border-purple-500/50 rounded-lg p-4">
                <h3 className="text-purple-400 font-bold mb-3 flex items-center gap-2">
                  <span>📥</span>
                  <span>拿回 1 張卡到手牌</span>
                </h3>
                <div className="grid grid-cols-4 gap-2">
                  {(currentPlayer?.sanctuary || []).map((cardId) => {
                    const card = cards[cardId]
                    if (!card) return null
                    const isSelected = philosopherStoneRecallCard === cardId
                    return (
                      <button
                        key={cardId}
                        onClick={() => setPhilosopherStoneRecallCard(isSelected ? null : cardId)}
                        className={cn(
                          'p-2 rounded border-2 transition-all',
                          isSelected
                            ? 'border-purple-400 bg-purple-900/40'
                            : 'border-slate-600 hover:border-purple-500'
                        )}
                      >
                        <div className="text-xs font-bold text-amber-300">{card.nameTw}</div>
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Discard Action - Select from sanctuary */}
              <div className="bg-amber-900/20 border border-amber-500/50 rounded-lg p-4">
                <h3 className="text-amber-400 font-bold mb-3 flex items-center gap-2">
                  <span>💎</span>
                  <span>從棲息地棄掉 1 張卡獲得 1 顆紫石（6分）</span>
                </h3>
                <div className="grid grid-cols-4 gap-2">
                  {(currentPlayer?.sanctuary || []).map((cardId) => {
                    const card = cards[cardId]
                    if (!card) return null
                    const isSelected = philosopherStoneDiscardCard === cardId
                    return (
                      <button
                        key={cardId}
                        onClick={() => setPhilosopherStoneDiscardCard(isSelected ? null : cardId)}
                        className={cn(
                          'p-2 rounded border-2 transition-all',
                          isSelected
                            ? 'border-amber-400 bg-amber-900/40'
                            : 'border-slate-600 hover:border-amber-500'
                        )}
                      >
                        <div className="text-xs font-bold text-amber-300">{card.nameTw}</div>
                      </button>
                    )
                  })}
                </div>
              </div>

              <button
                onClick={handlePhilosopherStoneConfirm}
                disabled={!philosopherStoneRecallCard && !philosopherStoneDiscardCard}
                className={cn(
                  'w-full py-3 rounded-lg font-bold transition-all',
                  philosopherStoneRecallCard || philosopherStoneDiscardCard
                    ? 'bg-green-600 hover:bg-green-500 text-white cursor-pointer'
                    : 'bg-slate-700 text-slate-500 cursor-not-allowed'
                )}
              >
                確認執行
              </button>
            </div>
          )}

          {!isInPhilosopherStoneSelection && (
            <p className="text-amber-400 text-center">
              等待其他玩家執行...
            </p>
          )}
        </div>
      </Modal>

      {/* Fixed Hand Panel - Bottom of screen */}
      <FixedHandPanel
        cards={handCards}
        selectedCardId={selectedHandCardId}
        onCardClick={(card) => {
          // Toggle selection: if already selected, deselect; otherwise select
          setSelectedHandCardId(prev => prev === card.instanceId ? null : card.instanceId)
        }}
        onTameCard={(cid) => {
          handleTameCard(cid)
          setSelectedHandCardId(null) // Clear selection after action
        }}
        onSellCard={(cardId) => {
          handleSellCard(cardId)
          setSelectedHandCardId(null) // Clear selection after action
        }}
        onDiscardCard={(cardId) => {
          handleDiscardCard(cardId)
          setSelectedHandCardId(null) // Clear selection after action
        }}
        onMoveToSanctuary={(cardId) => {
          handleMoveToSanctuary(cardId)
          setSelectedHandCardId(null) // Clear selection after action
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
