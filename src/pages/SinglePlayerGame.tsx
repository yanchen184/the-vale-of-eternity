/**
 * Single Player Game Page v8.0.0
 * Main gameplay interface for single-player mode - With artifact selection and coin display
 * @version 8.0.0 - Added artifact selection and coin display
 */
console.log('[pages/SinglePlayerGame.tsx] v8.0.0 loaded - With artifact selection and coin display')

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

  // Store actions
  const {
    startGame,
    drawCard,
    tameCreature,
    pass,
    resetGame,
    canTameCard,
    selectArtifact,
    confirmArtifact,
    error,
  } = useGameStore()

  // UI State - matching multiplayer
  const [selectedHandCardId, setSelectedHandCardId] = useState<string | null>(null)
  const [showDiscardModal, setShowDiscardModal] = useState(false)
  const [showSanctuaryModal, setShowSanctuaryModal] = useState(false)
  const [showAllFieldsModal, setShowAllFieldsModal] = useState(false)
  const [showScoreModal, setShowScoreModal] = useState(false)

  // Compute stone value
  const totalStoneValue = useMemo(() => {
    return stones ? calculateStonePoolValue(stones) : 0
  }, [stones])

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
    score: totalStoneValue,
    isFlipped: false,
  }], [playerName, totalStoneValue])

  // Discard pile (single player doesn't have discard pile yet)
  const discardPile = useMemo(() => {
    return [] as CardInstance[]
  }, [])

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
    zoneBonus: 0,
  }), [playerName, stones, hand, field, totalStoneValue])

  // Prepare field data for PlayersFieldArea
  const fieldData: PlayerFieldData = useMemo(() => ({
    playerId: 'single-player',
    name: playerName || 'Player',
    color: 'green' as const,
    handCount: hand?.length ?? 0,
    fieldCards: field || [],
    sanctuaryCards: [],
    isCurrentTurn: true,
    hasPassed: false,
  }), [playerName, hand, field])

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

  // Handle draw action
  const handleDraw = useCallback(() => {
    if (phase !== SinglePlayerPhase.DRAW) return
    drawCard()
  }, [phase, drawCard])

  // Handle pass action
  const handlePass = useCallback(() => {
    if (phase !== SinglePlayerPhase.ACTION) return
    pass()
  }, [phase, pass])

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
          />
        }
        leftSidebar={
          <LeftSidebar
            players={[playerData]}
            currentPlayerId="single-player"
            currentTurnPlayerId="single-player"
            phase={multiplayerPhase}
            deckCount={deckSize}
            onDrawCard={phase === SinglePlayerPhase.DRAW ? handleDraw : undefined}
            currentRound={round}
            mySelectedArtifacts={[]}
            allArtifactSelections={{}}
          />
        }
        rightSidebar={
          <RightSidebar
            playerCoins={stones || EMPTY_STONE_POOL}
            playerName={playerName || 'Player'}
            isYourTurn={true}
            phase={multiplayerPhase}
            onTakeCoin={() => {}} // Single player doesn't use coin taking
            onReturnCoin={() => {}}
            onConfirmSelection={selectedArtifact && phase === SinglePlayerPhase.DRAW ? confirmArtifact : undefined}  // Confirm artifact if selected
            onEndTurn={() => {}}
            isYourArtifactTurn={!selectedArtifact && (availableArtifacts?.length || 0) > 0}
            isArtifactSelectionActive={!selectedArtifact && (availableArtifacts?.length || 0) > 0}
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
            {/* Market Area - Using shared HuntingPhaseUI during DRAW phase */}
            {phase === SinglePlayerPhase.DRAW ? (
              <HuntingPhaseUI
                marketCards={market || []}
                isYourTurn={true}  // Single player is always your turn
                currentPlayerName={playerName || 'Player'}
                currentPlayerId="single-player"
                currentRound={round}
                onToggleCard={() => {}}  // DRAW phase: card selection disabled
                onConfirmSelection={() => {}}  // Single player doesn't need confirmation
                cardSelectionMap={new Map()}  // No multiplayer selection
                mySelectedCardId={null}
                hasSelectedCard={false}
                isExpansionMode={isExpansionMode || false}  // Enable expansion mode for artifact selection
                availableArtifacts={availableArtifacts || []}  // Available artifacts from store
                usedArtifacts={[]}
                disabledArtifacts={[]}
                artifactSelectionMap={artifactSelectionMap}  // Artifact selection state
                onSelectArtifact={selectArtifact}  // Artifact selection handler
                playerName={playerName || 'Player'}
                artifactSelectorPlayerName={playerName || 'Player'}
                isYourArtifactTurn={!selectedArtifact}  // Can select artifact if not already selected
                isArtifactSelectionActive={!selectedArtifact && (availableArtifacts?.length || 0) > 0}  // Show selector if artifacts available and not yet selected
                sevenLeagueBootsState={null}
                isInSevenLeagueBootsSelection={false}
                onSelectSevenLeagueBootsCard={() => {}}
                onConfirmSevenLeagueBootsSelection={() => {}}
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
                    onTakeCoin={() => {}}
                    onReturnCoin={() => {}}
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
          // Implement discard if needed
          void cardId
          setSelectedHandCardId(null)
        }}
        onMoveToSanctuary={(cardId) => {
          // Implement sanctuary if needed
          void cardId
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
