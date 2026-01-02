/**
 * Single Player Game Page v8.6.0
 * Main gameplay interface for single-player mode - With artifact selection and coin display
 * @version 8.6.0 - Added currentTurnCards and selectedArtifact to fieldData
 */
console.log('[pages/SinglePlayerGame.tsx] v8.6.0 loaded - Added currentTurnCards and selectedArtifact to fieldData')

import { useEffect, useCallback, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  useGameStore,
  useGamePhase,
  useHand,
  useField,
  useMarket,
  useStones,
  useDeckSize,
  useGameOver,
  usePlayerName,
  useRound,
  useAvailableArtifacts,
  useSelectedArtifact,
  useIsExpansionMode,
  useArtifactSelectionPhase,
  useCurrentTurnCards,
  useSelectedArtifactCard,
  SinglePlayerPhase,
} from '@/stores/useGameStore'
import { calculateStonePoolValue, createEmptyStonePool } from '@/types/game'
import type { PlayerColor } from '@/types/player-color'
import type { CardInstance } from '@/types/cards'
import { StoneType } from '@/types/cards'
import {
  Card,
  GameLayout,
  GameHeader,
  LeftSidebar,
  RightSidebar,
  PlayersFieldArea,
  ScoreBar,
  ScoreTrack,
  HuntingPhaseUI,
  ActionPhaseUI,
  MultiplayerCoinSystem,
} from '@/components/game'
import type { PlayerCoinInfo } from '@/components/game/MultiplayerCoinSystem'
import { FixedHandPanel } from '@/components/game/FixedHandPanel'
import { Modal } from '@/components/ui/Modal'
import { cn } from '@/lib/utils'
import type { PlayerSidebarData } from '@/components/game/LeftSidebar'
import type { PlayerFieldData } from '@/components/game/PlayersFieldArea'
import type { ScoreBarPlayerData } from '@/components/game/ScoreBar'
import type { PlayerScoreInfo } from '@/components/game/ScoreTrack'

// ============================================
// CONSTANTS
// ============================================

// Cache empty stone pool to prevent infinite re-renders
const EMPTY_STONE_POOL = createEmptyStonePool()

// ============================================
// MAIN COMPONENT
// ============================================

export default function SinglePlayerGame() {
  const navigate = useNavigate()

  // Game state from store
  const phase = useGamePhase()
  const hand = useHand()
  const field = useField()
  const market = useMarket()
  const stones = useStones()
  const deckSize = useDeckSize()
  const gameOver = useGameOver()
  const playerName = usePlayerName()
  const round = useRound()
  const availableArtifacts = useAvailableArtifacts()
  const selectedArtifact = useSelectedArtifact()
  const isExpansionMode = useIsExpansionMode()
  const artifactSelectionPhase = useArtifactSelectionPhase()
  const currentTurnCards = useCurrentTurnCards()
  const selectedArtifactCard = useSelectedArtifactCard()

  // Store actions
  const {
    gameState,
    startGame,
    drawCard,
    takeCardsFromMarket,
    tameCreature,
    moveCurrentCardToHand,
    sellCurrentCard,
    pass,
    discardCard,
    moveToSanctuary,
    resetGame,
    canTameCard,
    selectArtifact,
    confirmArtifact,
    addStones,
    removeStones,
    getCurrentScore,
    adjustScore,
    error,
  } = useGameStore()

  console.log('[SinglePlayerGame] artifactSelectionPhase:', artifactSelectionPhase)
  console.log('[SinglePlayerGame] selectedArtifact:', selectedArtifact)
  console.log('[SinglePlayerGame] Confirm button conditions:', {
    hasArtifactPhase: !!artifactSelectionPhase,
    isNotComplete: artifactSelectionPhase ? !artifactSelectionPhase.isComplete : false,
    hasSelectedArtifact: !!selectedArtifact,
    shouldShowConfirm: !!(artifactSelectionPhase && !artifactSelectionPhase.isComplete && selectedArtifact)
  })

  // UI State - matching multiplayer
  const [selectedHandCardId, setSelectedHandCardId] = useState<string | null>(null)
  const [showDiscardModal, setShowDiscardModal] = useState(false)
  const [showSanctuaryModal, setShowSanctuaryModal] = useState(false)
  const [showAllFieldsModal, setShowAllFieldsModal] = useState(false)
  const [showScoreModal, setShowScoreModal] = useState(false)
  const [isFlipped, setIsFlipped] = useState(false)
  const [zoneBonus, setZoneBonus] = useState(0) // 0, 1, or 2

  // Card selection state for DRAW phase (after artifact selection)
  const [selectedMarketCards, setSelectedMarketCards] = useState<Set<string>>(new Set())

  // Compute stone value
  const totalStoneValue = useMemo(() => {
    return stones ? calculateStonePoolValue(stones) : 0
  }, [stones])

  // Get current score from field cards
  const currentScore = useMemo(() => {
    return getCurrentScore()
  }, [getCurrentScore, field])

  // Initialize game if not started - directly to DRAW phase with expansion mode
  useEffect(() => {
    console.log('[SinglePlayerGame] useEffect - phase:', phase)
    if (!phase) {
      console.log('[SinglePlayerGame] Starting game...')
      const savedName = localStorage.getItem('playerName') || 'Player'
      startGame(savedName, true) // true = enable expansion mode with artifacts
      console.log('[SinglePlayerGame] startGame called')
    }
  }, [phase, startGame])

  // Convert SinglePlayerPhase to multiplayer phase format
  const multiplayerPhase = useMemo(() => {
    if (!phase) return 'WAITING' as const
    if (gameOver.isOver) return 'ENDED' as const
    if (phase === SinglePlayerPhase.DRAW) return 'HUNTING' as const
    // Both ACTION and SCORE phases use 'ACTION' UI (SCORE is just settlement)
    return 'ACTION' as const
  }, [phase, gameOver.isOver])

  // ScoreBar data
  const scoreBarData: ScoreBarPlayerData[] = useMemo(() => [{
    playerId: 'single-player',
    name: playerName || 'Player',
    color: 'green' as const,
    score: totalStoneValue,
  }], [playerName, totalStoneValue])

  // Player score data for score track
  const playerScores: PlayerScoreInfo[] = useMemo(() => [{
    playerId: 'single-player',
    playerName: playerName || 'Player',
    color: 'green' as const,
    score: currentScore,
    isFlipped: isFlipped,
  }], [playerName, currentScore, isFlipped])

  // Discard pile (single player doesn't have discard pile yet)
  const discardPile = useMemo(() => {
    return gameState?.discardPile || []
  }, [gameState?.discardPile])

  // Artifact selection map for HuntingPhaseUI
  const artifactSelectionMap = useMemo(() => {
    const map = new Map<string, { color: PlayerColor; playerName: string; isConfirmed: boolean }>()
    if (selectedArtifact) {
      map.set(selectedArtifact, {
        color: 'green' as PlayerColor,
        playerName: playerName || 'Player',
        isConfirmed: false,
      })
    }
    return map
  }, [selectedArtifact, playerName])

  // Card selection map for HuntingPhaseUI (after artifact selection)
  const cardSelectionMap = useMemo(() => {
    const map = new Map<string, { color: PlayerColor; playerName: string; isConfirmed: boolean }>()
    selectedMarketCards.forEach(cardId => {
      map.set(cardId, {
        color: 'green' as PlayerColor,
        playerName: playerName || 'Player',
        isConfirmed: false,
      })
    })
    return map
  }, [selectedMarketCards, playerName])

  // Player coin info for MultiplayerCoinSystem
  const playerCoinInfo: PlayerCoinInfo[] = useMemo(() => [{
    playerId: 'single-player',
    playerName: playerName || 'Player',
    playerColor: 'green' as PlayerColor,
    playerCoins: stones || EMPTY_STONE_POOL,
    index: 0,
  }], [playerName, stones])

  // Prepare player data for LeftSidebar
  const playerData: PlayerSidebarData = useMemo(() => ({
    playerId: 'single-player',
    name: playerName || 'Player',
    color: 'green' as const,
    index: 0,
    stones: stones || {
      [StoneType.ONE]: 0,
      [StoneType.THREE]: 0,
      [StoneType.SIX]: 0,
      [StoneType.WATER]: 0,
      [StoneType.FIRE]: 0,
      [StoneType.EARTH]: 0,
      [StoneType.WIND]: 0,
    },
    handCount: hand?.length || 0,
    fieldCount: field?.length || 0,
    score: totalStoneValue,
    hasPassed: false,
    zoneBonus: zoneBonus as 0 | 1 | 2,
  }), [playerName, stones, hand, field, totalStoneValue, zoneBonus])

  // Prepare field data for PlayersFieldArea
  const fieldData: PlayerFieldData = useMemo(() => {
    // Calculate max field slots: min(round + areaBonus, 12)
    const areaBonus = gameState?.player.areaBonus ?? 0
    const currentRound = gameState?.round ?? 1
    const maxFieldSlots = Math.min(currentRound + areaBonus, 12)

    return {
      playerId: 'single-player',
      name: playerName || 'Player',
      color: 'green' as const,
      handCount: hand?.length ?? 0,
      fieldCards: field || [],
      sanctuaryCards: gameState?.sanctuary || [],
      currentTurnCards: currentTurnCards || [],
      selectedArtifact: selectedArtifactCard || undefined,
      isCurrentTurn: true,
      hasPassed: false,
      maxFieldSlots,  // Dynamic field size based on round and area bonus
    }
  }, [playerName, hand, field, currentTurnCards, selectedArtifactCard, gameState, round])

  // Handle card click from hand
  const handleHandCardClick = useCallback((card: CardInstance) => {
    if (phase !== SinglePlayerPhase.ACTION) return
    if (!canTameCard(card.instanceId)) return
    tameCreature(card.instanceId, 'HAND')
  }, [phase, canTameCard, tameCreature])

  // Handle card click from market
  const handleMarketCardClick = useCallback((card: CardInstance) => {
    if (phase !== SinglePlayerPhase.ACTION) return
    if (!canTameCard(card.instanceId)) return
    tameCreature(card.instanceId, 'MARKET')
  }, [phase, canTameCard, tameCreature])

  // Handle draw action - 允許在 DRAW、ACTION 階段抽牌
  const handleDraw = useCallback(() => {
    if (phase !== SinglePlayerPhase.DRAW &&
        phase !== SinglePlayerPhase.ACTION) return
    drawCard()
  }, [phase, drawCard])

  // Handle pass action
  const handlePass = useCallback(() => {
    if (phase !== SinglePlayerPhase.ACTION) return
    pass()
  }, [phase, pass])

  // Handle move current card to hand
  const handleMoveCurrentCardToHand = useCallback((_playerId: string, cardId: string) => {
    console.log('[SinglePlayerGame] handleMoveCurrentCardToHand:', cardId)
    moveCurrentCardToHand(cardId)
  }, [moveCurrentCardToHand])

  // Handle sell current card
  const handleSellCurrentCard = useCallback((_playerId: string, cardId: string) => {
    console.log('[SinglePlayerGame] handleSellCurrentCard:', cardId)
    sellCurrentCard(cardId)
  }, [sellCurrentCard])

  // Handle taking coin from bank
  const handleTakeCoin = useCallback((coinType: StoneType) => {
    console.log('[SinglePlayerGame] Taking coin from bank:', coinType)
    addStones(coinType, 1)
  }, [addStones])

  // Handle returning coin to bank
  const handleReturnCoin = useCallback((coinType: StoneType) => {
    console.log('[SinglePlayerGame] Returning coin to bank:', coinType)
    removeStones(coinType, 1)
  }, [removeStones])

  // Handle score adjustment (click on score track)
  const handleScoreAdjust = useCallback((_playerId: string, newScore: number) => {
    const currentScoreValue = getCurrentScore()
    const scoreDiff = newScore - currentScoreValue
    adjustScore(scoreDiff, `手動調整分數到 ${newScore}`)
  }, [getCurrentScore, adjustScore])

  // Handle flip toggle (+60/-60)
  const handleFlipToggle = useCallback((_playerId: string) => {
    setIsFlipped(prev => !prev)
  }, [])

  // Handle zone bonus toggle (0→1→2→0)
  const handleToggleZoneBonus = useCallback(() => {
    setZoneBonus(prev => (prev + 1) % 3) // 0→1→2→0
  }, [])

  // Reserved for ActionPhaseUI
  void handleScoreAdjust
  void handleFlipToggle

  // Handle card selection toggle in DRAW phase (after artifact selection)
  const handleToggleCard = useCallback((cardId: string) => {
    // Only allow card selection after artifact selection is complete
    if (!artifactSelectionPhase?.isComplete) return

    setSelectedMarketCards(prev => {
      const newSet = new Set(prev)
      if (newSet.has(cardId)) {
        newSet.delete(cardId)
      } else {
        // Single player selects 2 cards (like 2-player game)
        if (newSet.size < 2) {
          newSet.add(cardId)
        }
      }
      return newSet
    })
  }, [artifactSelectionPhase])

  // Handle card selection confirmation in DRAW phase
  const handleConfirmCardSelection = useCallback(() => {
    // Validate selection count
    if (selectedMarketCards.size !== 2) {
      console.error('[SinglePlayerGame] Must select exactly 2 cards')
      return
    }

    // Take cards from market to hand (free - no payment required)
    // This will automatically transition from DRAW → ACTION phase
    const cardIds = Array.from(selectedMarketCards)
    takeCardsFromMarket(cardIds)

    // Clear selection
    setSelectedMarketCards(new Set())
    console.log('[SinglePlayerGame] Cards confirmed, transitioning to ACTION phase')
  }, [selectedMarketCards, takeCardsFromMarket])

  // Handle back to menu
  const handleBackToMenu = useCallback(() => {
    resetGame()
    navigate('/')
  }, [resetGame, navigate])

  // Handle play again
  const handlePlayAgain = useCallback(() => {
    resetGame()
    const savedName = localStorage.getItem('playerName') || 'Player'
    startGame(savedName, false)
  }, [resetGame, startGame])

  // Show loading state if game not initialized or stones not ready
  if (!phase || !stones) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
        <div className="text-white text-2xl">載入中...</div>
      </div>
    )
  }

  // Game Over Modal
  if (gameOver.isOver) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
        <div className="bg-slate-800/90 backdrop-blur-lg rounded-2xl p-8 border-2 border-vale-500 shadow-2xl max-w-md w-full mx-4">
          <h2 className="text-3xl font-bold text-vale-400 mb-4 text-center">遊戲結束</h2>
          <div className="space-y-4 mb-6">
            <div className="bg-slate-900/50 rounded-lg p-4 text-center">
              <div className="text-sm text-slate-400 mb-1">最終分數</div>
              <div className="text-4xl font-bold text-amber-400">{totalStoneValue}</div>
            </div>
            <div className="bg-slate-900/50 rounded-lg p-4 text-center">
              <div className="text-sm text-slate-400 mb-1">回合數</div>
              <div className="text-2xl font-bold text-cyan-400">{round}</div>
            </div>
          </div>
          <div className="flex gap-3">
            <button
              onClick={handlePlayAgain}
              className="flex-1 bg-vale-500 hover:bg-vale-600 text-white font-bold py-3 px-6 rounded-lg transition-all duration-200 hover:scale-105 active:scale-95"
            >
              再玩一次
            </button>
            <button
              onClick={handleBackToMenu}
              className="flex-1 bg-slate-700 hover:bg-slate-600 text-white font-bold py-3 px-6 rounded-lg transition-all duration-200 hover:scale-105 active:scale-95"
            >
              返回選單
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <>
      <GameLayout
        testId="single-player-game"
        header={
          <GameHeader
            roomCode="單人遊戲"
            phase={multiplayerPhase}
            round={round}
            currentPlayerName={playerName || 'Player'}
            isYourTurn={true}
            onLeave={handleBackToMenu}
            onViewScore={() => setShowScoreModal(true)}
            onViewAllFields={() => setShowAllFieldsModal(true)}
            onViewSanctuary={() => setShowSanctuaryModal(true)}
            onPassTurn={phase === SinglePlayerPhase.ACTION ? handlePass : undefined}
            showPassTurn={phase === SinglePlayerPhase.ACTION}
            onConfirmSelection={
              // Like multiplayer: handle both artifact and card confirmation
              // 1. If artifact selection active and has selected artifact → confirm artifact
              // 2. If artifact done and has selected cards → confirm card selection
              (artifactSelectionPhase && !artifactSelectionPhase.isComplete && selectedArtifact)
                ? confirmArtifact
                : (artifactSelectionPhase?.isComplete && selectedMarketCards.size === 2)
                  ? handleConfirmCardSelection
                  : undefined
            }
            showConfirmSelection={
              // Show confirm button when:
              // 1. Artifact selection active and has selected artifact, OR
              // 2. Artifact done and has selected exactly 2 cards
              !!(
                (artifactSelectionPhase && !artifactSelectionPhase.isComplete && selectedArtifact) ||
                (artifactSelectionPhase?.isComplete && selectedMarketCards.size === 2)
              )
            }
            confirmSelectionDisabled={false}
          />
        }
        leftSidebar={
          <LeftSidebar
            players={[playerData]}
            currentPlayerId="single-player"
            currentTurnPlayerId="single-player"
            phase={multiplayerPhase}
            deckCount={deckSize}
            onDrawCard={(phase === SinglePlayerPhase.DRAW ||
                         phase === SinglePlayerPhase.ACTION) ? handleDraw : undefined}
            onToggleZoneBonus={handleToggleZoneBonus}
            currentRound={round}
            mySelectedArtifacts={selectedArtifactCard ? [selectedArtifactCard.cardId] : []}
            allArtifactSelections={{}}
          />
        }
        rightSidebar={
          <RightSidebar
            bankCoins={createEmptyStonePool()}
            playerCoins={stones || EMPTY_STONE_POOL}
            playerName={playerName || 'Player'}
            isYourTurn={true}
            phase={multiplayerPhase}
            onTakeCoin={handleTakeCoin}
            onReturnCoin={handleReturnCoin}
            onConfirmSelection={
              // Like multiplayer: handle both artifact and card confirmation
              // 1. If artifact selection active and has selected artifact → confirm artifact
              // 2. If artifact done and has selected cards → confirm card selection
              (artifactSelectionPhase && !artifactSelectionPhase.isComplete && selectedArtifact)
                ? confirmArtifact
                : (artifactSelectionPhase?.isComplete && selectedMarketCards.size === 2)
                  ? handleConfirmCardSelection
                  : undefined
            }
            onEndTurn={() => {}}
            isYourArtifactTurn={
              // Like multiplayer: artifact selection is active and not complete
              !!(artifactSelectionPhase && !artifactSelectionPhase.isComplete)
            }
            isArtifactSelectionActive={
              // Like multiplayer: isExpansionMode && status=HUNTING && !artifactSelectionPhase.isComplete
              !!(isExpansionMode && phase === SinglePlayerPhase.DRAW && artifactSelectionPhase && !artifactSelectionPhase.isComplete)
            }
            allPlayers={[{
              playerId: 'single-player',
              playerName: playerName || 'Player',
              playerColor: 'green' as PlayerColor,
              playerCoins: stones || EMPTY_STONE_POOL,
            }]}
            currentPlayerId="single-player"
            currentPlayerStoneLimit={
              // Check if Hestia (F001) is in field to add +2 stone limit
              4 + (field?.some(card => card.cardId.startsWith('F001')) ? 2 : 0)
            }
            unprocessedActionCards={currentTurnCards?.length || 0}
          />
        }
        scoreBar={
          <ScoreBar
            players={scoreBarData}
            currentPlayerId="single-player"
            maxScore={60}
            discardCount={discardPile.length}
            onDiscardClick={() => setShowDiscardModal(true)}
          />
        }
        mainContent={
          <div className="w-full h-full overflow-auto custom-scrollbar">
            {/* DRAW Phase - Using shared HuntingPhaseUI for artifact + card selection */}
            {phase === SinglePlayerPhase.DRAW ? (
              <HuntingPhaseUI
                marketCards={market || []}
                isYourTurn={true}  // Single player is always your turn
                currentPlayerName={playerName || 'Player'}
                currentPlayerId="single-player"
                currentRound={round}
                onToggleCard={handleToggleCard}  // Card selection handler (active after artifact selection)
                onConfirmSelection={handleConfirmCardSelection}  // Card confirmation handler
                cardSelectionMap={cardSelectionMap}  // Show selected cards
                mySelectedCardId={selectedMarketCards.size > 0 ? Array.from(selectedMarketCards)[0] : null}
                hasSelectedCard={selectedMarketCards.size > 0}
                isExpansionMode={isExpansionMode || false}  // Enable expansion mode for artifact selection
                availableArtifacts={availableArtifacts || []}  // Available artifacts from store
                usedArtifacts={[]}
                disabledArtifacts={[]}
                artifactSelectionMap={artifactSelectionMap}  // Artifact selection state
                onSelectArtifact={selectArtifact}  // Artifact selection handler
                playerName={playerName || 'Player'}
                artifactSelectorPlayerName={playerName || 'Player'}
                isYourArtifactTurn={
                  // Like multiplayer: artifact selection is active and not complete
                  !!(artifactSelectionPhase && !artifactSelectionPhase.isComplete)
                }
                isArtifactSelectionActive={
                  // Like multiplayer: isExpansionMode && status=HUNTING && !artifactSelectionPhase.isComplete
                  !!(isExpansionMode && phase === SinglePlayerPhase.DRAW && artifactSelectionPhase && !artifactSelectionPhase.isComplete)
                }
                sevenLeagueBootsState={null}
                isInSevenLeagueBootsSelection={false}
                onSelectSevenLeagueBootsCard={() => {}}
                onConfirmSevenLeagueBootsSelection={() => {}}
              />
            ) : (phase === SinglePlayerPhase.ACTION || phase === SinglePlayerPhase.SCORE) ? (
              // ACTION & SCORE Phase - Using ActionPhaseUI like multiplayer
              // SCORE phase is settlement phase where player processes currentTurnCards
              <ActionPhaseUI
                playersFieldData={[fieldData]}
                handCards={hand || []}
                playerScores={playerScores}
                currentPlayerId="single-player"
                currentRound={round}
                gameStatus={multiplayerPhase}
                isYourTurn={true}
                onCardPlay={(cardId: string) => {
                  console.log('[SinglePlayerGame] onCardPlay:', cardId)
                  void tameCreature // TODO: adapt tameCreature to work with ActionPhaseUI
                  console.warn('[SinglePlayerGame] tameCreature needs adaptation for ActionPhaseUI')
                }}
                onCardSell={(_cardId) => {
                  console.log('[SinglePlayerGame] onCardSell: not implemented in single player')
                }}
                onHandCardDiscard={(_cardId) => {
                  console.log('[SinglePlayerGame] onHandCardDiscard: not implemented in single player')
                }}
                onCardReturn={(_playerId, _cardId) => {
                  console.log('[SinglePlayerGame] onCardReturn: not implemented in single player')
                }}
                onCardDiscard={(_playerId, _cardId) => {
                  console.log('[SinglePlayerGame] onCardDiscard: not implemented in single player')
                }}
                onScoreAdjust={handleScoreAdjust}
                onFlipToggle={handleFlipToggle}
                onCurrentCardMoveToHand={handleMoveCurrentCardToHand}
                onCurrentCardSell={handleSellCurrentCard}
                canTameCard={canTameCard}
              />
            ) : (
              <div className="flex flex-col gap-4 h-full p-4">
                {/* Market Area with full Card components */}
                <div className="flex-shrink-0">
                  <div className="text-center mb-4">
                    <h2 className="text-xl font-bold text-blue-400 mb-1">市場區</h2>
                    <p className="text-sm text-slate-400">選擇卡片進行馴服</p>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 justify-items-center">
                    {market && market.length > 0 ? (
                      market.map((card, index) => {
                        const canTame = canTameCard(card.instanceId)
                        return (
                          <div
                            key={card.instanceId}
                            className={cn(
                              'transition-all',
                              canTame
                                ? 'hover:scale-105 cursor-pointer'
                                : 'opacity-60 cursor-not-allowed'
                            )}
                            data-testid={`market-card-${index}`}
                          >
                            <Card
                              card={card}
                              index={index}
                              compact={false}
                              currentRound={round}
                              onClick={() => canTame && handleMarketCardClick(card)}
                              className={cn(
                                canTame && 'hover:border-blue-400 hover:shadow-blue-500/50 ring-2 ring-vale-500'
                              )}
                            />
                          </div>
                        )
                      })
                    ) : (
                      <div className="col-span-full text-slate-500 text-center py-8">市場為空</div>
                    )}
                  </div>
                </div>

                {/* Player Field Area */}
                <div className="flex-1 min-h-0 mt-4">
                  <PlayersFieldArea
                    players={[fieldData]}
                    currentPlayerId="single-player"
                    phase={multiplayerPhase}
                    currentRound={round}
                    onCardClick={(_playerId, cardId) => {
                      const card = hand?.find(c => c.instanceId === cardId)
                      if (card) handleHandCardClick(card)
                    }}
                    onCardDiscard={(_playerId, cardId) => discardCard(cardId)}
                    onCardMoveToSanctuary={(_playerId, cardId) => moveToSanctuary(cardId)}
                    onCurrentCardMoveToHand={handleMoveCurrentCardToHand}
                    onCurrentCardSell={handleSellCurrentCard}
                  />
                </div>

                {/* Coin System - 6-slot coin display */}
                <div className="mt-8">
                  <MultiplayerCoinSystem
                    players={playerCoinInfo}
                    currentPlayerId="single-player"
                    currentTurnPlayerId="single-player"
                    bankCoins={EMPTY_STONE_POOL}  // Single player has no bank
                    isYourTurn={true}
                    onTakeCoin={handleTakeCoin}
                    onReturnCoin={handleReturnCoin}
                    enableAnimations={false}
                  />
                </div>

                {/* Error Display */}
                {error && (
                  <div className="flex-shrink-0 bg-red-500/20 border border-red-500/50 rounded-lg p-3">
                    <div className="text-red-400 text-sm font-semibold">{error}</div>
                  </div>
                )}

                {/* Phase Instructions */}
                <div className="flex-shrink-0 bg-cyan-500/10 border border-cyan-500/30 rounded-lg p-3">
                  <div className="text-cyan-300 text-sm text-center">
                    選擇手牌或市場的卡片進行馴服，或點擊跳過
                  </div>
                </div>
              </div>
            )}
          </div>
        }
      />

      {/* Fixed Hand Panel - Bottom of screen */}
      <FixedHandPanel
        cards={hand || []}
        selectedCardId={selectedHandCardId}
        onCardClick={(card) => {
          setSelectedHandCardId(prev => prev === card.instanceId ? null : card.instanceId)
        }}
        onTameCard={(cardId) => {
          const card = hand?.find(c => c.instanceId === cardId)
          if (card) {
            handleHandCardClick(card)
          }
          setSelectedHandCardId(null)
        }}
        onSellCard={(cardId) => {
          // Single player doesn't have sell, but keep for consistency
          void cardId
          setSelectedHandCardId(null)
        }}
        onDiscardCard={(cardId) => {
          discardCard(cardId)
          setSelectedHandCardId(null)
        }}
        onMoveToSanctuary={(cardId) => {
          moveToSanctuary(cardId)
          setSelectedHandCardId(null)
        }}
        showCardActions={phase === SinglePlayerPhase.ACTION}
        canTameCard={(cardId) => {
          if (phase !== SinglePlayerPhase.ACTION) return false
          return canTameCard(cardId)
        }}
        currentRound={round}
      />

      {/* Discard Pile Modal */}
      <Modal
        isOpen={showDiscardModal}
        onClose={() => setShowDiscardModal(false)}
        title="棄置牌堆"
        size="xl"
      >
        <div className="p-6">
          {discardPile.length === 0 ? (
            <div className="text-center text-slate-500 py-8">尚無棄置的卡片</div>
          ) : (
            <div className="flex flex-wrap gap-6">
              {discardPile.map((card, index) => (
                <Card key={card.instanceId} card={card} index={index} />
              ))}
            </div>
          )}
        </div>
      </Modal>

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
            currentPlayerId="single-player"
            onScoreAdjust={handleScoreAdjust}
            allowAdjustment={true}
            onFlipToggle={handleFlipToggle}
          />
        </div>
      </Modal>

      {/* All Fields Modal */}
      <Modal
        isOpen={showAllFieldsModal}
        onClose={() => setShowAllFieldsModal(false)}
        size="wide"
        title="怪獸區"
      >
        <div className="p-6 max-h-[70vh] overflow-y-auto custom-scrollbar">
          <PlayersFieldArea
            players={[fieldData]}
            currentPlayerId="single-player"
            phase={multiplayerPhase}
            currentRound={round}
          />
        </div>
      </Modal>

      {/* Sanctuary Modal */}
      <Modal
        isOpen={showSanctuaryModal}
        onClose={() => setShowSanctuaryModal(false)}
        size="wide"
        title="棲息地"
      >
        <div className="p-4">
          <div className="text-center text-slate-500">單人遊戲尚未支援棲息地功能</div>
        </div>
      </Modal>

      {/* Error Toast */}
      {error && (
        <div
          className="fixed top-20 left-1/2 -translate-x-1/2 z-50 bg-red-600 text-white px-6 py-3 rounded-lg shadow-lg animate-slide-up"
          data-testid="error-toast"
        >
          {error}
        </div>
      )}
    </>
  )
}
