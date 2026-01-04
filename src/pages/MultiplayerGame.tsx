/**
 * MultiplayerGame Page
 * Main multiplayer game interface with Firebase real-time synchronization
 * @version 6.20.0 - Added score display (X分 → Y分) to Ifrit lightning effect
 */
console.log('[pages/MultiplayerGame.tsx] v6.20.0 loaded')

import { useEffect, useState, useCallback, useRef, useMemo } from 'react'
import { useParams, useLocation, useNavigate } from 'react-router-dom'
import { ref, onValue, off, get, update } from 'firebase/database'
import { database } from '@/lib/firebase'
import {
  multiplayerGameService,
  type GameRoom,
  type PlayerState,
  type CardInstanceData,
  getElementSellValue,
} from '@/services/multiplayer-game'
import { getCardById } from '@/data/cards/base-cards'
import { ARTIFACTS_BY_ID } from '@/data/artifacts'
import { DevTestPanel, useDevTestPanel } from '@/components/dev/DevTestPanel'
import { hasLightningEffect, getLightningEffectDescription } from '@/data/lightning-effect-cards'
import {
  Card,
  PlayerMarker,
  ScoreTrack,
  PlayersFieldArea,
  GameLayout,
  GameHeader,
  LeftSidebar,
  RightSidebar,
  HuntingPhaseUI,
  ActionPhaseUI,
  LightningEffect,
  ArtifactEffectModal,
  ArtifactActionPanel,
  StoneUpgradeModal,
  StonePaymentModal,
} from '@/components/game'
import { ScoreHistory } from '@/components/game/ScoreHistory'
import type { EffectInputType, ArtifactEffectOption } from '@/components/game/ArtifactEffectModal'
import type { StoneUpgrade } from '@/components/game/StoneUpgradeModal'
import type { StonePaymentOption } from '@/lib/single-player-engine'
import { ArtifactType } from '@/types/artifacts'
import { ActionLog } from '@/components/game/ActionLog'
import { useSound, SoundType } from '@/hooks/useSound'
import { FixedHandPanel } from '@/components/game/FixedHandPanel'
import { ResolutionConfirmModal } from '@/components/game/ResolutionConfirmModal'
import type { PlayerScoreInfo, PlayerFieldData, PlayerSidebarData } from '@/components/game'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { cn } from '@/lib/utils'
import type { CardInstance } from '@/types/cards'
import { type PlayerColor, PLAYER_COLORS } from '@/types/player-color'
import { createEmptyStonePool, type StonePool } from '@/types/game'
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
  onButtonClick?: () => void
}


// ============================================
// WAITING ROOM COMPONENT
// ============================================

function WaitingRoom({ roomCode, players, isHost, maxPlayers, onStartGame, onLeave, onButtonClick }: WaitingRoomProps) {
  const canStart = players.length >= 2

  const handleStartClick = () => {
    onButtonClick?.()
    onStartGame()
  }

  const handleLeaveClick = () => {
    onButtonClick?.()
    onLeave()
  }

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
            onClick={handleLeaveClick}
            className="flex-1"
            data-testid="leave-waiting-btn"
          >
            離開
          </Button>
          {isHost && (
            <Button
              variant="primary"
              onClick={handleStartClick}
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
// MAIN COMPONENT
// ============================================

export function MultiplayerGame() {
  const { gameId } = useParams<{ gameId: string }>()
  const location = useLocation()
  const navigate = useNavigate()
  const state = location.state as LocationState | null

  // Sound system
  const { play } = useSound()

  // Refs for cleanup
  const unsubscribeRef = useRef<(() => void) | null>(null)

  // Ref for tracking previous game state (for other players' sound effects)
  const prevPlayersRef = useRef<PlayerState[] | null>(null)
  const isInitialLoadRef = useRef(true)

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
  const [handViewMode, setHandViewMode] = useState<'minimized' | 'standard' | 'expanded'>('standard')
  // Resolution phase modal state (v6.13.0)
  const [showResolutionModal, setShowResolutionModal] = useState(false)
  const [resolutionCard, setResolutionCard] = useState<CardInstance | null>(null)

  // Artifact action UI state (v6.15.0)
  const [showArtifactEffectModal, setShowArtifactEffectModal] = useState(false)
  const [showStoneUpgradeModal, setShowStoneUpgradeModal] = useState(false)
  const [showStonePaymentModal, setShowStonePaymentModal] = useState(false)
  const [artifactEffectInputType, setArtifactEffectInputType] = useState<EffectInputType>('CHOOSE_OPTION')
  const [artifactEffectOptions, setArtifactEffectOptions] = useState<ArtifactEffectOption[]>([])
  const [artifactSelectableCards, setArtifactSelectableCards] = useState<CardInstance[]>([])
  const [artifactCardSelectionLabel, setArtifactCardSelectionLabel] = useState<string>('')
  const [artifactMinCardSelection, setArtifactMinCardSelection] = useState(1)
  const [artifactMaxCardSelection, setArtifactMaxCardSelection] = useState(1)
  const [pendingArtifactOptionId, setPendingArtifactOptionId] = useState<string | null>(null)
  const [pendingPayment, setPendingPayment] = useState<Partial<StonePool> | null>(null)
  const [stonePaymentOptions, setStonePaymentOptions] = useState<StonePaymentOption[]>([])
  const [stonePaymentAmount, setStonePaymentAmount] = useState(0)
  const [artifactResultMessage, setArtifactResultMessage] = useState<string | null>(null)

  // Dev Test Panel state (v6.18.0) - only in DEV mode
  const { isOpen: isDevTestPanelOpen, setIsOpen: setDevTestPanelOpen } = useDevTestPanel()

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

  // ============================================
  // OTHER PLAYERS' SOUND EFFECTS SYNC (v6.4.0)
  // ============================================
  // Listen to state changes and play sounds for other players' actions
  useEffect(() => {
    // Skip if no players data or still initial loading
    if (!players.length || !playerId) return

    // Skip initial load to avoid playing sounds when first joining
    if (isInitialLoadRef.current) {
      isInitialLoadRef.current = false
      prevPlayersRef.current = players
      return
    }

    const prevPlayers = prevPlayersRef.current
    if (!prevPlayers) {
      prevPlayersRef.current = players
      return
    }

    // Compare each player's state changes (except current player)
    players.forEach(currentPlayerState => {
      // Skip current player - they already hear their own sounds
      if (currentPlayerState.playerId === playerId) return

      const prevPlayerState = prevPlayers.find(p => p.playerId === currentPlayerState.playerId)
      if (!prevPlayerState) return

      const prevHandCount = prevPlayerState.hand?.length ?? 0
      const currHandCount = currentPlayerState.hand?.length ?? 0
      const prevFieldCount = prevPlayerState.field?.length ?? 0
      const currFieldCount = currentPlayerState.field?.length ?? 0
      const prevSanctuaryCount = prevPlayerState.sanctuary?.length ?? 0
      const currSanctuaryCount = currentPlayerState.sanctuary?.length ?? 0

      // Calculate stone counts
      const prevStoneCount = prevPlayerState.stones
        ? Object.values(prevPlayerState.stones).reduce((sum, count) => sum + count, 0)
        : 0
      const currStoneCount = currentPlayerState.stones
        ? Object.values(currentPlayerState.stones).reduce((sum, count) => sum + count, 0)
        : 0

      // Detect actions based on state changes
      // Priority order matters - check most specific conditions first

      // 1. Card Buy/Tame: hand decreases AND field increases
      if (currHandCount < prevHandCount && currFieldCount > prevFieldCount) {
        play(SoundType.CARD_BUY)
        return // Only one sound per state change
      }

      // 2. Card Sell: hand decreases AND stones increase (but field doesn't increase)
      if (currHandCount < prevHandCount && currStoneCount > prevStoneCount && currFieldCount <= prevFieldCount) {
        play(SoundType.CARD_SELL)
        return
      }

      // 3. Move to Sanctuary: hand decreases AND sanctuary increases
      if (currHandCount < prevHandCount && currSanctuaryCount > prevSanctuaryCount) {
        play(SoundType.CARD_SHELTER)
        return
      }

      // 4. Recall from Sanctuary: sanctuary decreases AND hand increases
      if (currSanctuaryCount < prevSanctuaryCount && currHandCount > prevHandCount) {
        play(SoundType.CARD_RECALL)
        return
      }

      // 5. Card Draw: hand increases (without sanctuary decrease)
      if (currHandCount > prevHandCount && currSanctuaryCount >= prevSanctuaryCount) {
        play(SoundType.CARD_DRAW)
        return
      }

      // 6. Coin Gain: stones increase (without hand decrease - not from selling)
      if (currStoneCount > prevStoneCount && currHandCount >= prevHandCount) {
        play(SoundType.COIN_GAIN)
        return
      }

      // 7. Coin Return: stones decrease (without field increase - not from buying)
      if (currStoneCount < prevStoneCount && currFieldCount <= prevFieldCount) {
        play(SoundType.COIN_RETURN)
        return
      }

      // 8. Card Discard from hand: hand decreases but field and sanctuary don't increase
      // and stones don't increase (not a sell)
      if (currHandCount < prevHandCount && currFieldCount <= prevFieldCount &&
          currSanctuaryCount <= prevSanctuaryCount && currStoneCount <= prevStoneCount) {
        play(SoundType.CARD_FLIP)
        return
      }
    })

    // Update previous state reference
    prevPlayersRef.current = players
  }, [players, playerId, play])

  // Track previous phase for sound effects
  const prevPhaseRef = useRef<string | null>(null)

  // Play phase transition sounds
  useEffect(() => {
    if (!gameRoom) return

    const currentPhase = gameRoom.status
    const prevPhase = prevPhaseRef.current

    // Only play sounds when phase actually changes
    if (prevPhase !== null && prevPhase !== currentPhase) {
      if (currentPhase === 'HUNTING') {
        play(SoundType.PHASE_HUNTING)
      } else if (currentPhase === 'ACTION') {
        play(SoundType.PHASE_ACTION)
      }
    }

    prevPhaseRef.current = currentPhase
  }, [gameRoom?.status, play])

  // Handle game end
  const handleGameEnd = useCallback(async () => {
    if (!gameId) return

    try {
      play(SoundType.GAME_END)
      const finalScores = await multiplayerGameService.calculateFinalScores(gameId)
      const scoreList = finalScores.map((s) => ({
        playerId: s.playerId,
        name: players.find((p) => p.playerId === s.playerId)?.name ?? 'Unknown',
        score: s.totalScore,
      }))
      scoreList.sort((a, b) => b.score - a.score)
      setScores(scoreList)
      setShowGameOverModal(true)
      // Play victory sound if current player is the winner
      if (scoreList[0]?.playerId === playerId) {
        setTimeout(() => play(SoundType.VICTORY), 500)
      }
    } catch (err) {
      console.error('[MultiplayerGame] Error calculating scores:', err)
    }
  }, [gameId, players, play, playerId])

  // Convert card data to CardInstance format
  const convertToCardInstance = useCallback(
    (instanceId: string): CardInstance | null => {
      if (!cards || typeof cards !== 'object') return null

      const cardData = cards[instanceId]
      if (!cardData) return null

      // Get full card template to restore effects information
      const cardTemplate = getCardById(cardData.cardId)
      const effects = cardTemplate?.effects || []

      return {
        instanceId: cardData.instanceId,
        cardId: cardData.cardId,
        name: cardData.name,
        nameTw: cardData.nameTw,
        element: cardData.element,
        cost: cardData.cost,
        baseScore: cardData.baseScore,
        effects,
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

  // Get round starting player (who starts this round)
  const roundStartingPlayer = useMemo(() => {
    if (!gameRoom || !players.length) return null

    // Get starting player index from hunting phase
    const startingPlayerIndex = gameRoom.huntingPhase?.startingPlayerIndex
    if (startingPlayerIndex === undefined || startingPlayerIndex === null) return null

    // Find player by index
    return players.find((p) => p.index === startingPlayerIndex)
  }, [gameRoom, players])

  const isYourTurn = playerId === currentTurnPlayerId

  // Track previous turn player for sound effects
  const prevTurnPlayerIdRef = useRef<string | null>(null)

  // Play turn start sound when it becomes your turn
  useEffect(() => {
    if (!gameRoom || !playerId) return

    const currentTurnId = currentTurnPlayerId
    const prevTurnId = prevTurnPlayerIdRef.current

    // Only play sound when turn changes to you
    if (prevTurnId !== null && prevTurnId !== currentTurnId && currentTurnId === playerId) {
      play(SoundType.TURN_START)
    }

    prevTurnPlayerIdRef.current = currentTurnId
  }, [currentTurnPlayerId, playerId, play, gameRoom])

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

  // Player field data for PlayersFieldArea
  const playersFieldData = useMemo((): PlayerFieldData[] => {
    return players.map(player => {
      const fieldCardInstances = (player.field || [])
        .map(convertToCardInstance)
        .filter((c): c is CardInstance => c !== null)

      const sanctuaryCardInstances = (player.sanctuary || [])
        .map(convertToCardInstance)
        .filter((c): c is CardInstance => c !== null)

      const currentTurnCardInstances = (player.currentDrawnCards || [])
        .map(convertToCardInstance)
        .filter((c): c is CardInstance => c !== null)

      // Calculate max field slots: current round + player's zone bonus
      // Example: Round 3 + zoneBonus 1 = 4 slots
      const currentRound = gameRoom?.currentRound ?? 1
      const maxFieldSlots = currentRound + (player.zoneBonus || 0)

      return {
        playerId: player.playerId,
        name: player.name,
        color: player.color || 'green',
        handCount: player.hand?.length ?? 0,
        fieldCards: fieldCardInstances,
        sanctuaryCards: sanctuaryCardInstances,
        currentTurnCards: currentTurnCardInstances,
        isCurrentTurn: player.playerId === currentTurnPlayerId,
        hasPassed: player.hasPassed ?? false,
        maxFieldSlots: maxFieldSlots,
      }
    })
  }, [players, currentTurnPlayerId, convertToCardInstance, gameRoom?.currentRound])

  // Prepare player colors map for ActionLog
  const playerColors = useMemo(() => {
    const colorsMap: Record<string, PlayerColor> = {}
    players.forEach(player => {
      colorsMap[player.playerId] = player.color || 'green'
    })
    return colorsMap
  }, [players])

  // Lightning effect from Firebase (v6.15.0) - Synchronized across all players
  const lightningEffect = useMemo(() => {
    if (!gameRoom?.lightningEffect) {
      return {
        isActive: false,
        cardName: '',
        cardNameTw: '',
        scoreChange: 0,
        reason: '',
        showScoreModal: false,
      }
    }
    return gameRoom.lightningEffect
  }, [gameRoom?.lightningEffect])

  // Calculate pending resolution cards for current player (v6.13.0)
  const pendingResolutionCards = useMemo(() => {
    if (!gameRoom || gameRoom.status !== 'RESOLUTION' || !playerId) return []
    return gameRoom.resolutionState?.pendingCards[playerId] || []
  }, [gameRoom, playerId])

  const processedResolutionCards = useMemo(() => {
    if (!gameRoom || !playerId) return []
    return gameRoom.resolutionState?.processedCards[playerId] || []
  }, [gameRoom, playerId])

  const unprocessedResolutionCardsCount = useMemo(() => {
    const processedSet = new Set(processedResolutionCards)
    return pendingResolutionCards.filter(cardId => !processedSet.has(cardId)).length
  }, [pendingResolutionCards, processedResolutionCards])

  // Handlers
  const handleStartGame = useCallback(async () => {
    if (!gameId || !playerId) return

    try {
      play(SoundType.GAME_START)
      await multiplayerGameService.startGame(gameId, playerId)
    } catch (err: any) {
      setError(err.message || 'Failed to start game')
    }
  }, [gameId, playerId, play])

  const handleLeaveGame = useCallback(() => {
    setShowLeaveModal(true)
  }, [])

  const confirmLeaveGame = useCallback(() => {
    play(SoundType.BUTTON_CONFIRM)
    navigate('/multiplayer')
  }, [navigate, play])

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
        // Check if this card is already selected by us
        const isCurrentlySelected = mySelectedCardId === cardInstanceId
        // Play appropriate sound
        if (isCurrentlySelected) {
          play(SoundType.CARD_DESELECT)
        } else {
          play(SoundType.CARD_SELECT)
        }
        await multiplayerGameService.toggleCardSelection(gameId, playerId, cardInstanceId)
      } catch (err: any) {
        setError(err.message || 'Failed to toggle card selection')
      }
    },
    [gameId, playerId, mySelectedCardId, play]
  )

  const handleTameCard = useCallback(
    async (cardInstanceId: string) => {
      if (!gameId || !playerId || !playerName) return

      try {
        const card = cards[cardInstanceId]
        play(SoundType.CARD_BUY)
        await multiplayerGameService.tameCard(gameId, playerId, cardInstanceId)

        // Record action log
        if (card) {
          const cardTemplate = getCardById(card.cardId)
          const cardName = cardTemplate?.nameTw || cardTemplate?.name || '未知卡片'
          await multiplayerGameService.addActionLog(
            gameId,
            playerId,
            playerName,
            'tame',
            cardName,
            `召喚到場上`
          )

          // v6.15.0: Check for lightning effect cards (synchronized across all players)
          if (hasLightningEffect(card.cardId)) {
            // Important: Need to fetch updated player state from Firebase to get the NEW field count
            const playerRef = ref(database, `games/${gameId}/players/${playerId}`)
            const playerSnapshot = await get(playerRef)

            if (playerSnapshot.exists()) {
              const updatedPlayerState = playerSnapshot.val()
              const fieldCardCount = updatedPlayerState.field?.length || 0
              const effectValue = card.cardId === 'F007' ? fieldCardCount : 2 // Ifrit vs Imp
              const currentScore = updatedPlayerState.score || 0
              const description = getLightningEffectDescription(
                card.cardId,
                cardTemplate?.name || '',
                cardTemplate?.nameTw || '',
                effectValue,
                currentScore // Pass current score for score display
              )

              // Trigger lightning effect via Firebase (all players will see it)
              await multiplayerGameService.triggerLightningEffect(
                gameId,
                description.cardName,
                description.cardNameTw,
                effectValue,
                description.reason,
                card.cardId === 'F007' // Only Ifrit shows score modal
              )
            }
          }
          // Note: Ifrit (F007) effect is handled by effect-processor.ts
          // Score updates and history will be automatically processed by effect processor
        }
      } catch (err: any) {
        setError(err.message || 'Failed to tame card')
      }
    },
    [gameId, playerId, playerName, cards, play, currentPlayer]
  )

  const handleSellCard = useCallback(
    async (cardInstanceId: string) => {
      if (!gameId || !playerId || !playerName) return

      try {
        const card = cards[cardInstanceId]
        play(SoundType.CARD_SELL)
        await multiplayerGameService.sellCard(gameId, playerId, cardInstanceId)

        // Record action log
        if (card) {
          const cardTemplate = getCardById(card.cardId)
          const cardName = cardTemplate?.nameTw || cardTemplate?.name || '未知卡片'
          const sellValue = cardTemplate?.element ? getElementSellValue(cardTemplate.element) : 0
          await multiplayerGameService.addActionLog(
            gameId,
            playerId,
            playerName,
            'sell',
            cardName,
            `獲得 ${sellValue} 元`
          )
        }
      } catch (err: any) {
        setError(err.message || 'Failed to sell card')
      }
    },
    [gameId, playerId, playerName, cards, play]
  )

  const handleDiscardCard = useCallback(
    async (cardInstanceId: string) => {
      if (!gameId || !playerId || !playerName) return

      try {
        const card = cards[cardInstanceId]
        play(SoundType.CARD_FLIP)
        await multiplayerGameService.discardHandCard(gameId, playerId, cardInstanceId)

        // Record action log
        if (card) {
          const cardTemplate = getCardById(card.cardId)
          const cardName = cardTemplate?.nameTw || cardTemplate?.name || '未知卡片'
          await multiplayerGameService.addActionLog(
            gameId,
            playerId,
            playerName,
            'discard',
            cardName,
            '從手牌棄置'
          )
        }
      } catch (err: any) {
        setError(err.message || 'Failed to discard card')
      }
    },
    [gameId, playerId, playerName, cards, play]
  )

  const handleReturnCard = useCallback(
    async (_playerId: string, cardInstanceId: string) => {
      if (!gameId || !playerId || !playerName) return

      try {
        const card = cards[cardInstanceId]
        play(SoundType.CARD_RECALL)
        await multiplayerGameService.returnCardToHand(gameId, playerId, cardInstanceId)

        // Record action log
        if (card) {
          const cardTemplate = getCardById(card.cardId)
          const cardName = cardTemplate?.nameTw || cardTemplate?.name || '未知卡片'
          await multiplayerGameService.addActionLog(
            gameId,
            playerId,
            playerName,
            'return',
            cardName,
            '從場上回到手牌'
          )
        }
      } catch (err: any) {
        setError(err.message || 'Failed to return card')
      }
    },
    [gameId, playerId, playerName, cards, play]
  )

  const handleToggleZoneBonus = useCallback(
    async () => {
      if (!gameId || !playerId || !playerName) return

      try {
        // Get current player state to know the new zone bonus value
        const player = players.find(p => p.playerId === playerId)
        const currentZoneBonus = player?.zoneBonus || 0
        const newZoneBonus = currentZoneBonus > 0 ? 0 : 1

        await multiplayerGameService.toggleZoneBonus(gameId, playerId)

        // Record action log
        await multiplayerGameService.addActionLog(
          gameId,
          playerId,
          playerName,
          'toggle_zone',
          undefined,
          newZoneBonus > 0 ? '開啟區域加成 (+1格)' : '關閉區域加成 (-1格)'
        )
      } catch (err: any) {
        setError(err.message || 'Failed to toggle zone bonus')
      }
    },
    [gameId, playerId, playerName, players]
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
      if (!gameId || !playerId || !playerName) return

      try {
        const card = cards[cardInstanceId]
        play(SoundType.CARD_SHELTER)
        await multiplayerGameService.moveCardToSanctuary(gameId, playerId, cardInstanceId)

        // Record action log
        if (card) {
          const cardTemplate = getCardById(card.cardId)
          const cardName = cardTemplate?.nameTw || cardTemplate?.name || '未知卡片'
          await multiplayerGameService.addActionLog(
            gameId,
            playerId,
            playerName,
            'move_to_sanctuary',
            cardName,
            '移至棲息地'
          )
        }
      } catch (err: any) {
        setError(err.message || 'Failed to move card to sanctuary')
      }
    },
    [gameId, playerId, playerName, cards, play]
  )

  // Handle moving card from sanctuary back to hand (expansion mode)
  const handleMoveFromSanctuary = useCallback(
    async (cardInstanceId: string) => {
      if (!gameId || !playerId || !playerName) return

      try {
        const card = cards[cardInstanceId]
        play(SoundType.CARD_RECALL)
        await multiplayerGameService.moveCardFromSanctuary(gameId, playerId, cardInstanceId)

        // Record action log
        if (card) {
          const cardTemplate = getCardById(card.cardId)
          const cardName = cardTemplate?.nameTw || cardTemplate?.name || '未知卡片'
          await multiplayerGameService.addActionLog(
            gameId,
            playerId,
            playerName,
            'move_from_sanctuary',
            cardName,
            '從棲息地回到手牌'
          )
        }
      } catch (err: any) {
        setError(err.message || 'Failed to move card from sanctuary')
      }
    },
    [gameId, playerId, playerName, cards, play]
  )

  const handlePassTurn = useCallback(async () => {
    if (!gameId || !playerId || !playerName) return

    try {
      play(SoundType.TURN_END)
      await multiplayerGameService.passTurn(gameId, playerId)

      // Record action log
      await multiplayerGameService.addActionLog(
        gameId,
        playerId,
        playerName,
        'pass',
        undefined,
        '結束回合'
      )
    } catch (err: any) {
      setError(err.message || 'Failed to pass turn')
    }
  }, [gameId, playerId, playerName, play])

  const handleDrawCard = useCallback(async () => {
    if (!gameId || !playerId || !playerName) return

    try {
      play(SoundType.CARD_DRAW)
      await multiplayerGameService.drawCardFromDeck(gameId, playerId)

      // Record action log
      await multiplayerGameService.addActionLog(
        gameId,
        playerId,
        playerName,
        'draw',
        undefined,
        '從牌堆抽取1張卡片'
      )
    } catch (err: any) {
      setError(err.message || 'Failed to draw card from deck')
    }
  }, [gameId, playerId, playerName, play])

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
        play(SoundType.COIN_GAIN)
        await multiplayerGameService.takeCoinFromBank(gameId, playerId, coinType)
      } catch (err: any) {
        setError(err.message || 'Failed to take coin from bank')
      }
    },
    [gameId, playerId, play]
  )

  const handleReturnCoinToBank = useCallback(
    async (coinType: StoneType) => {
      if (!gameId || !playerId) return

      try {
        play(SoundType.COIN_RETURN)
        await multiplayerGameService.returnCoinToBank(gameId, playerId, coinType)
      } catch (err: any) {
        setError(err.message || 'Failed to return coin to bank')
      }
    },
    [gameId, playerId, play]
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

  // Current turn card handlers (move to hand / sell)
  const handleMoveCurrentDrawnCardToHand = useCallback(
    async (_playerId: string, cardInstanceId: string) => {
      console.log('[MultiplayerGame] handleMoveCurrentDrawnCardToHand called:', { _playerId, cardInstanceId, gameId, playerId })
      if (!gameId || !playerId || !playerName) return

      try {
        play(SoundType.CARD_DRAW)
        await multiplayerGameService.moveCurrentDrawnCardToHand(gameId, playerId, cardInstanceId, playerName)
      } catch (err: any) {
        setError(err.message || 'Failed to move card to hand')
      }
    },
    [gameId, playerId, playerName, play]
  )

  const handleSellCurrentDrawnCard = useCallback(
    async (_playerId: string, cardInstanceId: string) => {
      console.log('[MultiplayerGame] handleSellCurrentDrawnCard called:', { _playerId, cardInstanceId, gameId, playerId })
      if (!gameId || !playerId || !playerName) return

      try {
        play(SoundType.CARD_SELL)
        await multiplayerGameService.sellCurrentDrawnCard(gameId, playerId, cardInstanceId, playerName)
      } catch (err: any) {
        setError(err.message || 'Failed to sell current drawn card')
      }
    },
    [gameId, playerId, playerName, play]
  )

  // Resolution phase handlers (v6.13.0)
  const handleFieldCardClickInResolution = useCallback(
    (cardInstanceId: string) => {
      if (!gameRoom || gameRoom.status !== 'RESOLUTION') return
      if (!currentPlayer) return

      // Check if this is a pending resolution card for current player
      const pendingCards = gameRoom.resolutionState?.pendingCards[playerId ?? ''] || []
      const processedCards = gameRoom.resolutionState?.processedCards[playerId ?? ''] || []

      if (!pendingCards.includes(cardInstanceId)) return
      if (processedCards.includes(cardInstanceId)) return

      // Find the card instance
      const cardInstance = convertToCardInstance(cardInstanceId)
      if (!cardInstance) return

      console.log('[MultiplayerGame] Opening resolution modal for card:', cardInstanceId)
      setResolutionCard(cardInstance)
      setShowResolutionModal(true)
    },
    [gameRoom, currentPlayer, playerId, cards]
  )

  const handleResolutionConfirm = useCallback(
    async () => {
      if (!resolutionCard || !gameId || !playerId) return

      console.log('[MultiplayerGame] Resolution confirmed - returning card to hand:', resolutionCard.instanceId)

      try {
        await multiplayerGameService.processResolutionCard(gameId, playerId, resolutionCard.instanceId, true)
        setShowResolutionModal(false)
        setResolutionCard(null)
      } catch (err: any) {
        setError(err.message || 'Failed to process resolution effect')
      }
    },
    [resolutionCard, gameId, playerId]
  )

  const handleResolutionSkip = useCallback(
    async () => {
      if (!resolutionCard || !gameId || !playerId) return

      console.log('[MultiplayerGame] Resolution skipped - card stays on field:', resolutionCard.instanceId)

      try {
        await multiplayerGameService.processResolutionCard(gameId, playerId, resolutionCard.instanceId, false)
        setShowResolutionModal(false)
        setResolutionCard(null)
      } catch (err: any) {
        setError(err.message || 'Failed to skip resolution effect')
      }
    },
    [resolutionCard, gameId, playerId]
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

      if (!gameId || !playerId || !gameRoom || !playerName) {
        console.warn('[MultiplayerGame] handleArtifactSelect: Missing required data', {
          hasGameId: !!gameId,
          hasPlayerId: !!playerId,
          hasGameRoom: !!gameRoom,
          hasPlayerName: !!playerName,
        })
        return
      }

      try {
        play(SoundType.ARTIFACT_SELECT)
        console.log('[MultiplayerGame] Calling selectArtifact service...')
        await multiplayerGameService.selectArtifact(
          gameId,
          playerId,
          artifactId,
          gameRoom.currentRound
        )
        console.log('[MultiplayerGame] selectArtifact service completed successfully')

        // Record action log
        const artifact = ARTIFACTS_BY_ID[artifactId]
        const artifactName = artifact?.nameTw || artifact?.name || '未知神器'
        await multiplayerGameService.addActionLog(
          gameId,
          playerId,
          playerName,
          'select_artifact',
          artifactName,
          `選擇神器`
        )
      } catch (err: any) {
        console.error('[MultiplayerGame] selectArtifact error:', err)
        setError(err.message || 'Failed to select artifact')
      }
    },
    [gameId, playerId, playerName, gameRoom, play]
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
        play(SoundType.ARTIFACT_ACTIVATE)
        if (choice === 'draw') {
          play(SoundType.CARD_DRAW)
        } else {
          play(SoundType.CARD_RECALL)
        }
        await multiplayerGameService.executePiedPiperPipe(gameId, playerId, choice)
      } catch (err: any) {
        setError(err.message || 'Failed to execute Pied Piper\'s Pipe')
      }
    },
    [gameId, playerId, play]
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
        play(SoundType.ARTIFACT_ACTIVATE)
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
    [gameId, playerId, philosopherStoneRecallCard, philosopherStoneDiscardCard, play]
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

  // Get confirmed artifact ID for this round (v6.15.0)
  const confirmedArtifactId = useMemo(() => {
    if (!gameRoom?.artifactSelections || !playerId) return null
    const playerSelections = gameRoom.artifactSelections[playerId] || {}
    return playerSelections[gameRoom.currentRound] || null
  }, [gameRoom?.artifactSelections, gameRoom?.currentRound, playerId])

  // Get confirmed artifact card data for display
  const selectedArtifactCard = useMemo(() => {
    if (!confirmedArtifactId) return null
    return ARTIFACTS_BY_ID[confirmedArtifactId] || null
  }, [confirmedArtifactId])

  // Check if artifact can be used (v6.15.0)
  const canUseCurrentArtifact = useMemo(() => {
    if (!confirmedArtifactId || !selectedArtifactCard) return false
    if (gameRoom?.status !== 'ACTION') return false
    if (!isYourTurn) return false
    // Check if already used this round
    if (currentPlayer?.artifactUsedThisRound) return false
    // Only ACTION type artifacts can be manually used in ACTION phase
    if (selectedArtifactCard.type !== ArtifactType.ACTION) return false
    return true
  }, [confirmedArtifactId, selectedArtifactCard, gameRoom?.status, isYourTurn, currentPlayer?.artifactUsedThisRound])

  // Check if artifact is already used this round
  const isArtifactUsed = useMemo(() => {
    return currentPlayer?.artifactUsedThisRound ?? false
  }, [currentPlayer?.artifactUsedThisRound])

  // Confirm card or artifact or Seven-League Boots selection
  const handleConfirmCardSelection = useCallback(async () => {
    if (!gameId || !playerId) return

    try {
      play(SoundType.BUTTON_CONFIRM)
      // If in Seven-League Boots selection phase, confirm shelter selection
      if (sevenLeagueBootsState && isInSevenLeagueBootsSelection) {
        play(SoundType.CARD_SHELTER)
        await multiplayerGameService.confirmSevenLeagueBootsSelection(gameId, playerId)
      }
      // If in artifact selection phase, confirm artifact selection instead
      else if (isArtifactSelectionActive && isYourArtifactTurn) {
        play(SoundType.ARTIFACT_ACTIVATE)
        await multiplayerGameService.confirmArtifactSelection(gameId, playerId, gameRoom!.currentRound)
      } else {
        // Normal card selection confirmation
        await multiplayerGameService.confirmCardSelection(gameId, playerId)
      }
    } catch (err: any) {
      setError(err.message || 'Failed to confirm selection')
    }
  }, [gameId, playerId, sevenLeagueBootsState, isInSevenLeagueBootsSelection, isArtifactSelectionActive, isYourArtifactTurn, gameRoom, play])

  // ============================================
  // ARTIFACT ACTION HANDLERS (v6.15.0)
  // ============================================

  // Handle use artifact button click
  const handleUseArtifact = useCallback(async () => {
    if (!confirmedArtifactId || !gameId || !playerId) return

    const artifact = ARTIFACTS_BY_ID[confirmedArtifactId]
    if (!artifact) return

    console.log('[MultiplayerGame] handleUseArtifact:', confirmedArtifactId)

    // Check if this is Book of Thoth (stone upgrade)
    if (confirmedArtifactId === 'book_of_thoth') {
      setShowStoneUpgradeModal(true)
      return
    }

    // Call the useArtifact service to get options
    try {
      play(SoundType.ARTIFACT_ACTIVATE)
      const result = await multiplayerGameService.useArtifact(
        gameId,
        playerId,
        confirmedArtifactId
      )

      console.log('[MultiplayerGame] useArtifact result:', result)

      if (result.requiresInput) {
        if (result.inputType === 'CHOOSE_OPTION' && result.options) {
          setArtifactEffectOptions(result.options as ArtifactEffectOption[])
          setArtifactEffectInputType('CHOOSE_OPTION')
          setShowArtifactEffectModal(true)
        } else if (result.inputType === 'SELECT_PAYMENT' && result.stonePaymentOptions) {
          setStonePaymentOptions(result.stonePaymentOptions as StonePaymentOption[])
          setStonePaymentAmount(result.paymentAmount || 3)
          setShowStonePaymentModal(true)
        } else if (result.inputType === 'SELECT_CARDS') {
          // Determine which cards to show based on artifact
          if (confirmedArtifactId === 'monkey_king_staff') {
            setArtifactSelectableCards(handCards)
            setArtifactCardSelectionLabel('選擇2張手牌棄置')
            setArtifactMinCardSelection(2)
            setArtifactMaxCardSelection(2)
          } else if (confirmedArtifactId === 'imperial_seal') {
            const fieldCardInstances = (currentPlayer?.field || [])
              .map(convertToCardInstance)
              .filter((c): c is CardInstance => c !== null)
            setArtifactSelectableCards(fieldCardInstances)
            setArtifactCardSelectionLabel('選擇1張場上卡牌棄置')
            setArtifactMinCardSelection(1)
            setArtifactMaxCardSelection(1)
          }
          setArtifactEffectInputType('SELECT_CARDS')
          setShowArtifactEffectModal(true)
        }
      } else if (result.success) {
        setArtifactResultMessage(result.message)
        setTimeout(() => setArtifactResultMessage(null), 3000)
      } else {
        setError(result.message)
      }
    } catch (err: any) {
      setError(err.message || 'Failed to use artifact')
    }
  }, [confirmedArtifactId, gameId, playerId, handCards, currentPlayer, convertToCardInstance, play])

  // Handle artifact effect option confirmation
  const handleConfirmArtifactOption = useCallback(async (optionId: string) => {
    if (!gameId || !playerId || !confirmedArtifactId) return

    console.log('[MultiplayerGame] handleConfirmArtifactOption:', optionId)

    try {
      if (optionId === 'buy_card') {
        // For Incense Burner buy_card option, first get payment options
        const result = await multiplayerGameService.useArtifact(
          gameId,
          playerId,
          confirmedArtifactId,
          optionId
        )

        if (result.requiresInput && result.inputType === 'SELECT_PAYMENT' && result.stonePaymentOptions) {
          setPendingArtifactOptionId(optionId)
          setStonePaymentOptions(result.stonePaymentOptions as StonePaymentOption[])
          setStonePaymentAmount(result.paymentAmount || 3)
          setShowArtifactEffectModal(false)
          setShowStonePaymentModal(true)
          return
        }
      }

      if (optionId === 'shelter_hand') {
        setPendingArtifactOptionId(optionId)
        setArtifactEffectInputType('SELECT_CARDS')
        setArtifactSelectableCards(handCards)
        setArtifactCardSelectionLabel('選擇1張手牌放入棲息地')
        setArtifactMinCardSelection(1)
        setArtifactMaxCardSelection(1)
        return
      }

      // Execute directly for options that don't need more input
      const result = await multiplayerGameService.useArtifact(
        gameId,
        playerId,
        confirmedArtifactId,
        optionId
      )
      setShowArtifactEffectModal(false)

      if (result.success) {
        setArtifactResultMessage(result.message)
        setTimeout(() => setArtifactResultMessage(null), 3000)
      } else {
        setError(result.message)
      }
    } catch (err: any) {
      setError(err.message || 'Failed to execute artifact effect')
    }
  }, [gameId, playerId, confirmedArtifactId, handCards])

  // Handle artifact card selection confirmation
  const handleConfirmArtifactCards = useCallback(async (cardIds: string[]) => {
    if (!gameId || !playerId || !confirmedArtifactId) return

    console.log('[MultiplayerGame] handleConfirmArtifactCards:', cardIds, 'pendingPayment:', pendingPayment)

    try {
      const result = await multiplayerGameService.useArtifact(
        gameId,
        playerId,
        confirmedArtifactId,
        pendingArtifactOptionId || undefined,
        pendingPayment || undefined,
        cardIds
      )
      setShowArtifactEffectModal(false)
      setPendingArtifactOptionId(null)
      setPendingPayment(null)
      setArtifactSelectableCards([])

      if (result.success) {
        setArtifactResultMessage(result.message)
        setTimeout(() => setArtifactResultMessage(null), 3000)
      } else {
        setError(result.message)
      }
    } catch (err: any) {
      setError(err.message || 'Failed to execute artifact effect')
    }
  }, [gameId, playerId, confirmedArtifactId, pendingArtifactOptionId, pendingPayment])

  // Handle stone payment confirmation (for Incense Burner)
  const handleConfirmStonePayment = useCallback((payment: Partial<StonePool>) => {
    console.log('[MultiplayerGame] handleConfirmStonePayment:', payment)

    // Store the payment and show card selection
    setPendingPayment(payment)
    setShowStonePaymentModal(false)

    // Now show card selection for purchasing
    setArtifactEffectInputType('SELECT_CARDS')
    setArtifactSelectableCards(marketCards)
    setArtifactCardSelectionLabel('選擇1張買入區卡牌購買')
    setArtifactMinCardSelection(1)
    setArtifactMaxCardSelection(1)
    setShowArtifactEffectModal(true)
  }, [marketCards])

  // Handle closing stone payment modal
  const handleCloseStonePaymentModal = useCallback(() => {
    setShowStonePaymentModal(false)
    setPendingArtifactOptionId(null)
    setStonePaymentOptions([])
    setStonePaymentAmount(0)
  }, [])

  // Handle artifact option with card selection
  const handleConfirmArtifactOptionWithCards = useCallback(async (optionId: string, cardIds: string[]) => {
    if (!gameId || !playerId || !confirmedArtifactId) return

    console.log('[MultiplayerGame] handleConfirmArtifactOptionWithCards:', optionId, cardIds)

    try {
      const result = await multiplayerGameService.useArtifact(
        gameId,
        playerId,
        confirmedArtifactId,
        optionId,
        undefined,
        cardIds
      )
      setShowArtifactEffectModal(false)
      setPendingArtifactOptionId(null)
      setArtifactSelectableCards([])

      if (result.success) {
        setArtifactResultMessage(result.message)
        setTimeout(() => setArtifactResultMessage(null), 3000)
      } else {
        setError(result.message)
      }
    } catch (err: any) {
      setError(err.message || 'Failed to execute artifact effect')
    }
  }, [gameId, playerId, confirmedArtifactId])

  // Handle stone upgrade confirmation (Book of Thoth)
  const handleConfirmStoneUpgrades = useCallback(async (upgrades: StoneUpgrade[]) => {
    if (!gameId || !playerId || !confirmedArtifactId) return

    console.log('[MultiplayerGame] handleConfirmStoneUpgrades:', upgrades)

    const stoneChanges: Partial<Record<StoneType, number>> = {}
    upgrades.forEach(upgrade => {
      stoneChanges[upgrade.from] = (stoneChanges[upgrade.from] || 0) - 1
      stoneChanges[upgrade.to] = (stoneChanges[upgrade.to] || 0) + 1
    })

    try {
      const result = await multiplayerGameService.useArtifact(
        gameId,
        playerId,
        confirmedArtifactId,
        undefined,
        undefined,
        undefined,
        stoneChanges
      )
      setShowStoneUpgradeModal(false)

      if (result.success) {
        setArtifactResultMessage(result.message)
        setTimeout(() => setArtifactResultMessage(null), 3000)
      } else {
        setError(result.message)
      }
    } catch (err: any) {
      setError(err.message || 'Failed to upgrade stones')
    }
  }, [gameId, playerId, confirmedArtifactId])

  // Close artifact effect modal
  const handleCloseArtifactModal = useCallback(() => {
    setShowArtifactEffectModal(false)
    setPendingArtifactOptionId(null)
    setArtifactSelectableCards([])
    setArtifactEffectOptions([])
  }, [])

  // Handle summon card from DevTestPanel (v6.18.0) - only in DEV mode
  const handleSummonCard = useCallback(async (cardId: string) => {
    if (!import.meta.env.DEV) return
    if (!gameId || !playerId) return

    const cardTemplate = getCardById(cardId)
    if (!cardTemplate) {
      console.error('[MultiplayerGame] Card not found:', cardId)
      return
    }

    try {
      // Create a unique instance ID
      const uniqueInstanceId = `${cardId}_test_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

      // Create card data for Firebase (using type assertion for location)
      const cardData = {
        instanceId: uniqueInstanceId,
        cardId: cardTemplate.id,
        name: cardTemplate.name,
        nameTw: cardTemplate.nameTw,
        element: cardTemplate.element,
        cost: cardTemplate.cost,
        baseScore: cardTemplate.baseScore,
        ownerId: playerId,
        location: 'HAND' as const,
        isRevealed: true,
        scoreModifier: 0,
        hasUsedAbility: false,
      } as CardInstanceData

      console.log('[MultiplayerGame] Summoning card to hand via Firebase:', cardData)

      // Get current player's hand
      const playerRef = ref(database, `games/${gameId}/players/${playerId}`)
      const playerSnapshot = await get(playerRef)

      if (!playerSnapshot.exists()) {
        console.error('[MultiplayerGame] Player not found')
        return
      }

      const playerData = playerSnapshot.val()
      const currentHand = playerData.hand || []

      // Update Firebase: add card to cards collection and player's hand
      const updates: Record<string, any> = {}
      updates[`games/${gameId}/cards/${uniqueInstanceId}`] = cardData
      updates[`games/${gameId}/players/${playerId}/hand`] = [...currentHand, uniqueInstanceId]

      await update(ref(database), updates)

      console.log('[MultiplayerGame] Card added to hand:', cardId)
    } catch (err) {
      console.error('[MultiplayerGame] Failed to summon card:', err)
    }
  }, [gameId, playerId])

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
        onButtonClick={() => play(SoundType.BUTTON_CLICK)}
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
            roundStartingPlayerName={roundStartingPlayer?.name}
            isYourTurn={isYourTurn}
            onLeave={handleLeaveGame}
            onViewScore={() => handleToggleScoreModal(true)}
            onViewAllFields={() => setShowAllFieldsModal(true)}
            onViewSanctuary={() => setShowSanctuaryModal(true)}
            onPassTurn={handlePassTurn}
            showPassTurn={gameRoom.status === 'ACTION' || gameRoom.status === 'RESOLUTION'}
            onConfirmSelection={handleConfirmCardSelection}
            showConfirmSelection={
              (isArtifactSelectionActive && isYourArtifactTurn && gameRoom.status === 'HUNTING') ||
              (!isArtifactSelectionActive && isYourTurn && gameRoom.status === 'HUNTING') ||
              !!isInSevenLeagueBootsSelection
            }
            confirmSelectionDisabled={
              isInSevenLeagueBootsSelection ? !sevenLeagueBootsState?.selectedCardId : false
            }
            unprocessedActionCards={currentPlayer?.currentDrawnCards?.length || 0}
            unprocessedResolutionCards={unprocessedResolutionCardsCount}
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
            allPlayers={players.map(p => ({
              playerId: p.playerId,
              playerName: p.name,
              playerColor: p.color,
              playerCoins: p.stones || createEmptyStonePool(),
            }))}
            currentPlayerId={playerId ?? ''}
            currentPlayerStoneLimit={
              // Simple check: base limit is 4
              // Check if field contains Hestia (F001) to add +2
              4 + ((currentPlayer?.field?.some(id => id.startsWith('F001-')) ? 2 : 0))
            }
            unprocessedActionCards={currentPlayer?.currentDrawnCards?.length || 0}
          />
        }
        scoreBar={null}
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
                onCurrentCardMoveToHand={handleMoveCurrentDrawnCardToHand}
                onCurrentCardSell={handleSellCurrentDrawnCard}
                onCurrentTurnCardClick={(_playerId, _cardId) => {
                  // When clicking current turn cards, expand hand panel if minimized
                  if (handViewMode === 'minimized') {
                    setHandViewMode('standard')
                  }
                }}
                onHandPreviewClick={(_playerId) => {
                  // Toggle hand panel between minimized and standard
                  setHandViewMode(prev => prev === 'minimized' ? 'standard' : 'minimized')
                }}
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
                onCurrentCardMoveToHand={handleMoveCurrentDrawnCardToHand}
                onCurrentCardSell={handleSellCurrentDrawnCard}
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
                onCurrentTurnCardClick={(_playerId, _cardId) => {
                  // When clicking current turn cards, expand hand panel if minimized
                  if (handViewMode === 'minimized') {
                    setHandViewMode('standard')
                  }
                }}
                onHandPreviewClick={(_playerId) => {
                  // Toggle hand panel between minimized and standard
                  setHandViewMode(prev => prev === 'minimized' ? 'standard' : 'minimized')
                }}
              />
            )}
          </div>
        }
      />

      {/* Artifact Action Panel - Shows in ACTION phase when artifact is available (v6.15.0) */}
      {gameRoom.status === 'ACTION' && confirmedArtifactId && selectedArtifactCard?.type === ArtifactType.ACTION && (
        <div className="fixed right-4 top-20 z-40" data-testid="artifact-panel-container">
          <ArtifactActionPanel
            artifactId={confirmedArtifactId}
            canUse={canUseCurrentArtifact}
            isUsed={isArtifactUsed}
            isVisible={true}
            onUseArtifact={handleUseArtifact}
          />
        </div>
      )}

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
        <div className="p-6 space-y-4">
          <ScoreTrack
            players={playerScores}
            maxScore={60}
            currentPlayerId={playerId ?? ''}
            onScoreAdjust={handleScoreAdjust}
            allowAdjustment={isYourTurn}
            onFlipToggle={handleFlipToggle}
          />
          {/* Score History - Show current player's score changes */}
          {currentPlayer && (
            <ScoreHistory history={currentPlayer.scoreHistory || []} />
          )}
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
          {(() => {
            console.log('[MultiplayerGame] Rendering PlayersFieldArea in Modal with callbacks:', {
              hasHandleMoveCurrentDrawnCardToHand: !!handleMoveCurrentDrawnCardToHand,
              hasHandleSellCurrentDrawnCard: !!handleSellCurrentDrawnCard,
            })
            return (
              <PlayersFieldArea
                players={playersFieldData}
                currentPlayerId={playerId ?? ''}
                phase={gameRoom.status}
                currentRound={gameRoom.currentRound}
                onCardReturn={handleReturnCard}
                onCardDiscard={handleDiscardFieldCard}
                onCurrentCardMoveToHand={handleMoveCurrentDrawnCardToHand}
                onCurrentCardSell={handleSellCurrentDrawnCard}
                pendingResolutionCards={pendingResolutionCards}
                onResolutionCardClick={(_playerId, cardId) => handleFieldCardClickInResolution(cardId)}
              />
            )
          })()}
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

      {/* Resolution Confirm Modal - For resolution phase effects (v6.13.0) */}
      <ResolutionConfirmModal
        isOpen={showResolutionModal}
        onClose={() => {
          setShowResolutionModal(false)
          setResolutionCard(null)
        }}
        card={resolutionCard}
        onConfirm={handleResolutionConfirm}
        onSkip={handleResolutionSkip}
      />

      {/* Artifact Effect Modal (v6.15.0) */}
      <ArtifactEffectModal
        isOpen={showArtifactEffectModal}
        onClose={handleCloseArtifactModal}
        artifactId={confirmedArtifactId}
        inputType={artifactEffectInputType}
        options={artifactEffectOptions}
        selectableCards={artifactSelectableCards}
        minCardSelection={artifactMinCardSelection}
        maxCardSelection={artifactMaxCardSelection}
        currentRound={gameRoom?.currentRound || 1}
        cardSelectionLabel={artifactCardSelectionLabel}
        onConfirmOption={handleConfirmArtifactOption}
        onConfirmCards={handleConfirmArtifactCards}
        onConfirmOptionWithCards={handleConfirmArtifactOptionWithCards}
      />

      {/* Stone Upgrade Modal (Book of Thoth) v6.15.0 */}
      <StoneUpgradeModal
        isOpen={showStoneUpgradeModal}
        onClose={() => setShowStoneUpgradeModal(false)}
        playerStones={currentPlayer?.stones || createEmptyStonePool()}
        maxUpgrades={2}
        onConfirmUpgrades={handleConfirmStoneUpgrades}
      />

      {/* Stone Payment Modal (Incense Burner) v6.15.0 */}
      <StonePaymentModal
        isOpen={showStonePaymentModal}
        onClose={handleCloseStonePaymentModal}
        playerStones={currentPlayer?.stones || createEmptyStonePool()}
        paymentOptions={stonePaymentOptions}
        paymentAmount={stonePaymentAmount}
        onConfirmPayment={handleConfirmStonePayment}
        title="香爐 - 選擇支付方式"
      />

      {/* Artifact Result Message Toast (v6.15.0) */}
      {artifactResultMessage && (
        <div
          className="fixed top-32 left-1/2 -translate-x-1/2 z-50 bg-purple-600 text-white px-6 py-3 rounded-lg shadow-lg animate-slide-up"
          data-testid="artifact-result-toast"
        >
          {artifactResultMessage}
        </div>
      )}

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
        externalViewMode={handViewMode}
        onViewModeChange={setHandViewMode}
      />

      {/* Action Log - Fixed position in bottom-left */}
      <div className="fixed bottom-4 left-4 z-50 w-96">
        <ActionLog
          logs={gameRoom.actionLog || []}
          playerColors={playerColors}
          maxLogs={50}
        />
      </div>

      {/* Lightning Effect - v6.14.0 */}
      <LightningEffect
        isActive={lightningEffect.isActive}
        cardName={lightningEffect.cardName}
        cardNameTw={lightningEffect.cardNameTw}
        scoreChange={lightningEffect.scoreChange}
        reason={lightningEffect.reason}
        showScoreModal={lightningEffect.showScoreModal}
        onEffectComplete={async () => {
          // Clear lightning effect from Firebase (all players will see it cleared)
          if (gameId) {
            await multiplayerGameService.clearLightningEffect(gameId)
          }
        }}
      />

      {/* Dev Test Panel (v6.18.0) - Only in DEV mode */}
      {import.meta.env.DEV && isDevTestPanelOpen && (
        <DevTestPanel
          onClose={() => setDevTestPanelOpen(false)}
          onSummonCard={handleSummonCard}
          onResetGame={() => {
            // Navigate back to multiplayer lobby
            navigate('/multiplayer')
          }}
          onClearField={async () => {
            // Clear current player's field via Firebase
            if (!gameId || !playerId) return
            try {
              const updates: Record<string, any> = {}
              updates[`games/${gameId}/players/${playerId}/field`] = []
              await update(ref(database), updates)
              console.log('[MultiplayerGame] Field cleared')
            } catch (err) {
              console.error('[MultiplayerGame] Failed to clear field:', err)
            }
          }}
        />
      )}
    </>
  )
}

export default MultiplayerGame
