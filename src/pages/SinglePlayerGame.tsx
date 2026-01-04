/**
 * Single Player Game Page v9.15.0
 * Main gameplay interface for single-player mode - With artifact action UI
 * @version 9.15.0 - Added DevTestPanel integration for card testing
 */
console.log('[pages/SinglePlayerGame.tsx] v9.15.0 loaded - DevTestPanel integration')


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
  usePendingResolutionCards,
  useProcessedResolutionCards,
  SinglePlayerPhase,
  type ArtifactEffectOption,
} from '@/stores/useGameStore'
import { calculateStonePoolValue, createEmptyStonePool } from '@/types/game'
import type { PlayerColor } from '@/types/player-color'
import type { CardInstance } from '@/types/cards'
import { StoneType } from '@/types/cards'
import { ArtifactType } from '@/types/artifacts'
import { ARTIFACTS_BY_ID } from '@/data/artifacts'
import { getBaseCardById, createCardInstance } from '@/data/cards'
import {
  Card,
  GameLayout,
  GameHeader,
  LeftSidebar,
  RightSidebar,
  PlayersFieldArea,
  ScoreTrack,
  HuntingPhaseUI,
  ActionPhaseUI,
  MultiplayerCoinSystem,
  ArtifactActionPanel,
  ArtifactEffectModal,
  StoneUpgradeModal,
  StonePaymentModal,
} from '@/components/game'
import type { StonePaymentOption } from '@/lib/single-player-engine'
import type { PlayerCoinInfo } from '@/components/game/MultiplayerCoinSystem'
import type { EffectInputType } from '@/components/game/ArtifactEffectModal'
import type { StoneUpgrade } from '@/components/game/StoneUpgradeModal'
import { FixedHandPanel } from '@/components/game/FixedHandPanel'
import { ResolutionConfirmModal } from '@/components/game/ResolutionConfirmModal'
import { LightningEffect } from '@/components/game/LightningEffect'
import { ScoreHistory } from '@/components/game/ScoreHistory'
import { DevTestPanel, useDevTestPanel } from '@/components/dev/DevTestPanel'
import { Modal } from '@/components/ui/Modal'
import { cn } from '@/lib/utils'
import type { PlayerSidebarData } from '@/components/game/LeftSidebar'
import type { PlayerFieldData } from '@/components/game/PlayersFieldArea'
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
  const pendingResolutionCards = usePendingResolutionCards()
  const processedResolutionCards = useProcessedResolutionCards()

  // Store state - use individual selectors to prevent infinite loops
  // IMPORTANT: Do NOT destructure the entire store with useGameStore().
  // Each property must be selected individually to avoid creating new references.
  const gameState = useGameStore(state => state.gameState)
  const error = useGameStore(state => state.error)

  // Stable function references using useCallback + getState pattern
  // These functions are stable because they use getState() internally
  const startGame = useCallback((name: string, expansion: boolean) => {
    useGameStore.getState().startGame(name, expansion)
  }, [])

  const drawCard = useCallback(() => {
    useGameStore.getState().drawCard()
  }, [])

  const drawCardInActionPhase = useCallback(() => {
    useGameStore.getState().drawCardInActionPhase()
  }, [])

  const takeCardsFromMarket = useCallback((cardIds: string[]) => {
    useGameStore.getState().takeCardsFromMarket(cardIds)
  }, [])

  const tameCreature = useCallback((cardId: string, from: 'HAND' | 'MARKET') => {
    useGameStore.getState().tameCreature(cardId, from)
  }, [])

  const moveCurrentCardToHand = useCallback((cardId: string) => {
    useGameStore.getState().moveCurrentCardToHand(cardId)
  }, [])

  const sellCurrentCard = useCallback((cardId: string) => {
    useGameStore.getState().sellCurrentCard(cardId)
  }, [])

  const pass = useCallback(() => {
    useGameStore.getState().pass()
  }, [])

  const completeSettlement = useCallback(() => {
    useGameStore.getState().completeSettlement()
  }, [])

  const returnCardToHand = useCallback((cardId: string) => {
    useGameStore.getState().returnCardToHand(cardId)
  }, [])

  const discardCard = useCallback((cardId: string) => {
    useGameStore.getState().discardCard(cardId)
  }, [])

  const moveToSanctuary = useCallback((cardId: string) => {
    useGameStore.getState().moveToSanctuary(cardId)
  }, [])

  const takeCardFromDiscard = useCallback((cardId: string) => {
    useGameStore.getState().takeCardFromDiscard(cardId)
  }, [])

  const takeCardFromSanctuary = useCallback((cardId: string) => {
    useGameStore.getState().takeCardFromSanctuary(cardId)
  }, [])

  const resetGame = useCallback(() => {
    useGameStore.getState().resetGame()
  }, [])

  const canTameCard = useCallback((cardId: string) => {
    return useGameStore.getState().canTameCard(cardId)
  }, [])

  const selectArtifact = useCallback((artifactId: string) => {
    useGameStore.getState().selectArtifact(artifactId)
  }, [])

  const confirmArtifact = useCallback(() => {
    useGameStore.getState().confirmArtifact()
  }, [])

  const addStones = useCallback((type: StoneType, amount: number) => {
    useGameStore.getState().addStones(type, amount)
  }, [])

  const removeStones = useCallback((type: StoneType, amount: number) => {
    useGameStore.getState().removeStones(type, amount)
  }, [])

  const toggleAreaBonus = useCallback(() => {
    useGameStore.getState().toggleAreaBonus()
  }, [])

  const executeArtifactEffect = useCallback((
    optionId?: string,
    selectedCards?: string[],
    selectedStones?: Partial<Record<StoneType, number>>
  ) => {
    return useGameStore.getState().executeArtifactEffect(optionId, selectedCards, selectedStones)
  }, [])

  const processResolutionCard = useCallback((cardId: string, activate: boolean) => {
    useGameStore.getState().processResolutionCard(cardId, activate)
  }, [])

  const hasPendingResolutionEffect = useCallback((cardId: string) => {
    return useGameStore.getState().hasPendingResolutionEffect(cardId)
  }, [])

  const allResolutionCardsProcessed = useCallback(() => {
    return useGameStore.getState().allResolutionCardsProcessed()
  }, [])

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
  const [manualScore, setManualScore] = useState<number | null>(null) // Manual score override
  const [handViewMode, setHandViewMode] = useState<'minimized' | 'standard' | 'expanded'>('standard')

  // Card selection state for DRAW phase (after artifact selection)
  const [selectedMarketCards, setSelectedMarketCards] = useState<Set<string>>(new Set())

  // Artifact action UI state (v9.4.0)
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
  const [pendingPayment, setPendingPayment] = useState<Partial<typeof stones> | null>(null)
  const [stonePaymentOptions, setStonePaymentOptions] = useState<StonePaymentOption[]>([])
  const [stonePaymentAmount, setStonePaymentAmount] = useState(0)
  const [artifactResultMessage, setArtifactResultMessage] = useState<string | null>(null)

  // Resolution phase state (v9.7.0)
  const [showResolutionModal, setShowResolutionModal] = useState(false)
  const [resolutionCard, setResolutionCard] = useState<CardInstance | null>(null)

  // Dev Test Panel state (v9.15.0) - only in DEV mode
  const { isOpen: isDevTestPanelOpen, setIsOpen: setDevTestPanelOpen } = useDevTestPanel()

  // Handle summon card from DevTestPanel (v9.15.0)
  const handleSummonCard = useCallback((cardId: string) => {
    if (!import.meta.env.DEV) return

    const cardTemplate = getBaseCardById(cardId)
    if (!cardTemplate) {
      console.error('[SinglePlayerGame] Card not found:', cardId)
      return
    }

    // Create a new card instance with unique ID
    const uniqueInstanceIndex = Date.now()
    const newCard = createCardInstance(cardTemplate, uniqueInstanceIndex)

    // Update card location to HAND
    newCard.location = 'HAND' as any // CardLocation.HAND
    newCard.ownerId = 'single-player'

    console.log('[SinglePlayerGame] Summoning card to hand:', newCard)

    // Add to player's hand via engine
    // We need to directly update the game state since there's no API for this
    const currentHand = hand || []
    useGameStore.setState(state => ({
      ...state,
      gameState: state.gameState ? {
        ...state.gameState,
        player: {
          ...state.gameState.player,
          hand: [...currentHand, newCard]
        }
      } : null
    }))

    console.log('[SinglePlayerGame] Card added to hand:', cardId)
  }, [hand])

  // Compute stone value
  const totalStoneValue = useMemo(() => {
    return stones ? calculateStonePoolValue(stones) : 0
  }, [stones])

  // Get current score from field cards + instant bonus
  const currentScore = useMemo(() => {
    const baseFieldScore = (field || []).reduce((sum, card) => sum + card.baseScore, 0)
    const instantBonus = gameState?.player.instantBonusScore || 0
    return baseFieldScore + instantBonus
  }, [field, gameState?.player.instantBonusScore])

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

  // Monitor Ifrit effect trigger - now using LightningEffect component
  const ifritEffectTriggered = useGameStore(state => state.ifritEffectTriggered)
  const [showLightningEffect, setShowLightningEffect] = useState(false)
  const [scoreModalTab, setScoreModalTab] = useState<'track' | 'history'>('track')

  // Start lightning effect when Ifrit is triggered
  useEffect(() => {
    if (ifritEffectTriggered) {
      console.log('[SinglePlayerGame] Ifrit effect triggered, starting lightning effect')
      setShowLightningEffect(true)
    }
  }, [ifritEffectTriggered])

  // Lightning effect callbacks
  const handleLightningComplete = useCallback(() => {
    console.log('[SinglePlayerGame] Lightning animation complete')
  }, [])

  const handleLightningOpenModal = useCallback(() => {
    // Only open score modal if the effect requires it (e.g., Ifrit gives score, Imp gives stones)
    if (ifritEffectTriggered?.showScoreModal) {
      console.log('[SinglePlayerGame] Opening score modal from lightning effect')
      setShowScoreModal(true)
    } else {
      console.log('[SinglePlayerGame] Skipping score modal (stone effect only)')
    }
  }, [ifritEffectTriggered])

  const handleLightningEffectComplete = useCallback(() => {
    console.log('[SinglePlayerGame] Lightning effect complete, closing modal')
    if (ifritEffectTriggered?.showScoreModal) {
      setShowScoreModal(false)
    }
    setShowLightningEffect(false)
    useGameStore.setState({ ifritEffectTriggered: null })
  }, [ifritEffectTriggered])

  // Convert SinglePlayerPhase to multiplayer phase format
  const multiplayerPhase = useMemo(() => {
    if (!phase) return 'WAITING' as const
    if (gameOver.isOver) return 'ENDED' as const
    if (phase === SinglePlayerPhase.DRAW) return 'HUNTING' as const
    if (phase === SinglePlayerPhase.SCORE) return 'RESOLUTION' as const
    // ACTION phase uses 'ACTION' UI
    return 'ACTION' as const
  }, [phase, gameOver.isOver])

  // Calculate unprocessed resolution cards count
  const unprocessedResolutionCardsCount = useMemo(() => {
    if (!pendingResolutionCards || pendingResolutionCards.length === 0) return 0
    const processedSet = new Set(processedResolutionCards || [])
    return pendingResolutionCards.filter(cardId => !processedSet.has(cardId)).length
  }, [pendingResolutionCards, processedResolutionCards])

  // Player score data for score track
  const playerScores: PlayerScoreInfo[] = useMemo(() => [{
    playerId: 'single-player',
    playerName: playerName || 'Player',
    color: 'green' as const,
    score: manualScore !== null ? manualScore : currentScore, // Use manual score if set
    isFlipped: isFlipped,
  }], [playerName, currentScore, isFlipped, manualScore])

  // Discard pile (single player doesn't have discard pile yet)
  const discardPile = useMemo(() => {
    return gameState?.discardPile || []
  }, [gameState?.discardPile])

  const sanctuary = useMemo(() => {
    return gameState?.sanctuary || []
  }, [gameState?.sanctuary])

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
    zoneBonus: (gameState?.player.areaBonus ?? 0) as 0 | 1 | 2,
  }), [playerName, stones, hand, field, totalStoneValue, gameState?.player.areaBonus])

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

  // Handle pass action (ACTION → SCORE)
  const handlePass = useCallback(() => {
    if (phase !== SinglePlayerPhase.ACTION) return
    pass()
  }, [phase, pass])

  // Handle complete settlement (SCORE → next DRAW)
  const handleCompleteSettlement = useCallback(() => {
    if (phase !== SinglePlayerPhase.SCORE) return
    // Check if all resolution cards have been processed
    if (!allResolutionCardsProcessed()) {
      console.log('[SinglePlayerGame] Cannot complete settlement: unprocessed resolution cards')
      return
    }
    completeSettlement()
  }, [phase, completeSettlement, allResolutionCardsProcessed])

  // Handle field card click during resolution phase (v9.7.0)
  const handleFieldCardClickInResolution = useCallback((cardId: string) => {
    if (phase !== SinglePlayerPhase.SCORE) return

    // Check if this card has pending resolution effect
    if (!hasPendingResolutionEffect(cardId)) {
      console.log('[SinglePlayerGame] Card does not have pending resolution effect:', cardId)
      return
    }

    // Find the card
    const card = field?.find(c => c.instanceId === cardId)
    if (!card) {
      console.log('[SinglePlayerGame] Card not found on field:', cardId)
      return
    }

    console.log('[SinglePlayerGame] Opening resolution modal for card:', card.nameTw)
    setResolutionCard(card)
    setShowResolutionModal(true)
  }, [phase, field, hasPendingResolutionEffect])

  // Handle resolution confirm (return card to hand)
  const handleResolutionConfirm = useCallback(() => {
    if (!resolutionCard) return
    console.log('[SinglePlayerGame] Resolution confirmed - returning card to hand:', resolutionCard.instanceId)
    processResolutionCard(resolutionCard.instanceId, true)
    setShowResolutionModal(false)
    setResolutionCard(null)
  }, [resolutionCard, processResolutionCard])

  // Handle resolution skip (keep card on field)
  const handleResolutionSkip = useCallback(() => {
    if (!resolutionCard) return
    console.log('[SinglePlayerGame] Resolution skipped - card stays on field:', resolutionCard.instanceId)
    processResolutionCard(resolutionCard.instanceId, false)
    setShowResolutionModal(false)
    setResolutionCard(null)
  }, [resolutionCard, processResolutionCard])

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
    console.log('[SinglePlayerGame] handleScoreAdjust - setting manual score to:', newScore)
    setManualScore(newScore)
  }, [])

  // Handle flip toggle (+60/-60)
  const handleFlipToggle = useCallback((_playerId: string) => {
    console.log('[SinglePlayerGame] handleFlipToggle - current isFlipped:', isFlipped)
    const newFlipState = !isFlipped
    const scoreAdjustment = newFlipState ? 60 : -60

    // Adjust manual score
    setManualScore(prev => {
      const baseScore = prev !== null ? prev : currentScore
      return baseScore + scoreAdjustment
    })

    setIsFlipped(newFlipState)
    console.log('[SinglePlayerGame] Flip toggled:', { newFlipState, scoreAdjustment })
  }, [isFlipped, currentScore])

  // Handle zone bonus toggle (0→1→2→0)
  const handleToggleZoneBonus = useCallback(() => {
    toggleAreaBonus()
  }, [toggleAreaBonus])

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

  // ============================================
  // ARTIFACT ACTION HANDLERS (v9.4.0)
  // ============================================

  // Get confirmed artifact ID for this round
  const confirmedArtifactId = useMemo(() => {
    return artifactSelectionPhase?.confirmedArtifactId || null
  }, [artifactSelectionPhase])

  // Get artifact state and check if can use
  // NOTE: Access getArtifactState via useGameStore.getState() to avoid infinite loops
  const artifactState = useMemo(() => {
    if (!gameState) return null
    return useGameStore.getState().getArtifactState()
  }, [gameState, phase, confirmedArtifactId])

  // NOTE: Access canUseArtifact via useGameStore.getState() to avoid infinite loops
  const canUseCurrentArtifact = useMemo(() => {
    if (!artifactState) return false
    return useGameStore.getState().canUseArtifact()
  }, [artifactState, phase])

  const isArtifactUsed = useMemo(() => {
    if (!artifactState) return false
    const artifact = confirmedArtifactId ? ARTIFACTS_BY_ID[confirmedArtifactId] : null
    if (!artifact) return false

    if (artifact.type === ArtifactType.ACTION) {
      return artifactState.actionUsed
    }
    if (artifact.type === ArtifactType.INSTANT) {
      return artifactState.instantExecuted
    }
    return false
  }, [artifactState, confirmedArtifactId])

  // Auto-trigger INSTANT artifact effect when confirmed
  // This mimics multiplayer behavior where INSTANT artifacts immediately show their options
  useEffect(() => {
    // Only trigger when:
    // 1. An artifact is confirmed
    // 2. It's an INSTANT type artifact
    // 3. The instant effect has not been executed yet
    // 4. The artifact effect modal is not already showing
    if (!confirmedArtifactId) return
    if (!artifactState) return
    if (artifactState.instantExecuted) return
    if (showArtifactEffectModal) return

    const artifact = ARTIFACTS_BY_ID[confirmedArtifactId]
    if (!artifact) return
    if (artifact.type !== ArtifactType.INSTANT) return

    console.log('[SinglePlayerGame] Auto-triggering INSTANT artifact effect:', confirmedArtifactId)

    // Get effect options from engine
    const options = useGameStore.getState().getArtifactEffectOptions()
    console.log('[SinglePlayerGame] INSTANT artifact options:', options)

    // Special handling for Seven-League Boots: directly execute and show card selection
    if (confirmedArtifactId === 'seven_league_boots') {
      console.log('[SinglePlayerGame] Seven-League Boots: Executing flip card effect')
      const result = executeArtifactEffect()

      if (result.requiresInput && result.inputType === 'SELECT_CARDS') {
        // Show card selection modal for sheltering
        setArtifactEffectInputType('SELECT_CARDS')
        setArtifactSelectableCards(market || [])
        setArtifactCardSelectionLabel('選擇市場中的1張卡放入棲息地')
        setArtifactMinCardSelection(1)
        setArtifactMaxCardSelection(1)
        setShowArtifactEffectModal(true)

        if (result.message) {
          setArtifactResultMessage(result.message)
          setTimeout(() => setArtifactResultMessage(null), 3000)
        }
      }
      return
    }

    if (options.length > 0) {
      // Show options modal for artifacts that require a choice
      setArtifactEffectOptions(options)
      setArtifactEffectInputType('CHOOSE_OPTION')
      setShowArtifactEffectModal(true)
    } else {
      // Handle special cases that need card selection
      if (confirmedArtifactId === 'monkey_king_staff') {
        setArtifactEffectInputType('SELECT_CARDS')
        setArtifactSelectableCards(hand || [])
        setArtifactCardSelectionLabel('選擇2張手牌棄置')
        setArtifactMinCardSelection(2)
        setArtifactMaxCardSelection(2)
        setShowArtifactEffectModal(true)
      } else if (confirmedArtifactId === 'imperial_seal') {
        setArtifactEffectInputType('SELECT_CARDS')
        setArtifactSelectableCards(field || [])
        setArtifactCardSelectionLabel('選擇1張場上卡牌棄置')
        setArtifactMinCardSelection(1)
        setArtifactMaxCardSelection(1)
        setShowArtifactEffectModal(true)
      } else if (confirmedArtifactId === 'gem_of_kukulkan') {
        setArtifactEffectInputType('SELECT_CARDS')
        setArtifactSelectableCards(market || [])
        setArtifactCardSelectionLabel('選擇1張買入區卡牌啟動其立即效果')
        setArtifactMinCardSelection(1)
        setArtifactMaxCardSelection(1)
        setShowArtifactEffectModal(true)
      }
      // Other INSTANT artifacts without options will be handled elsewhere
    }
  }, [confirmedArtifactId, artifactState, showArtifactEffectModal, hand, field, market])

  // Handle use artifact button click
  // NOTE: Access getArtifactEffectOptions via useGameStore.getState() to avoid infinite loops
  const handleUseArtifact = useCallback(() => {
    if (!confirmedArtifactId) return

    const artifact = ARTIFACTS_BY_ID[confirmedArtifactId]
    if (!artifact) return

    console.log('[SinglePlayerGame] handleUseArtifact:', confirmedArtifactId)

    // Check if this is Book of Thoth (stone upgrade)
    if (confirmedArtifactId === 'book_of_thoth') {
      setShowStoneUpgradeModal(true)
      return
    }

    // Get effect options from engine via getState() to avoid dependency issues
    const options = useGameStore.getState().getArtifactEffectOptions()
    console.log('[SinglePlayerGame] Artifact effect options:', options)

    // If no options, try direct execution
    if (options.length === 0) {
      // Some artifacts need card selection directly
      if (confirmedArtifactId === 'monkey_king_staff') {
        setArtifactEffectInputType('SELECT_CARDS')
        setArtifactSelectableCards(hand || [])
        setArtifactCardSelectionLabel('選擇2張手牌棄置')
        setArtifactMinCardSelection(2)
        setArtifactMaxCardSelection(2)
        setShowArtifactEffectModal(true)
        return
      }

      if (confirmedArtifactId === 'imperial_seal') {
        setArtifactEffectInputType('SELECT_CARDS')
        setArtifactSelectableCards(field || [])
        setArtifactCardSelectionLabel('選擇1張場上卡牌棄置')
        setArtifactMinCardSelection(1)
        setArtifactMaxCardSelection(1)
        setShowArtifactEffectModal(true)
        return
      }

      if (confirmedArtifactId === 'gem_of_kukulkan') {
        setArtifactEffectInputType('SELECT_CARDS')
        setArtifactSelectableCards(market || [])
        setArtifactCardSelectionLabel('選擇1張買入區卡牌啟動其立即效果')
        setArtifactMinCardSelection(1)
        setArtifactMaxCardSelection(1)
        setShowArtifactEffectModal(true)
        return
      }

      // Try direct execution
      const result = executeArtifactEffect()
      if (result.success) {
        setArtifactResultMessage(result.message)
        setTimeout(() => setArtifactResultMessage(null), 3000)
      }
      return
    }

    // Show options modal
    setArtifactEffectOptions(options)
    setArtifactEffectInputType('CHOOSE_OPTION')
    setShowArtifactEffectModal(true)
  }, [confirmedArtifactId, executeArtifactEffect, hand, field, market])

  // Handle artifact effect option confirmation
  const handleConfirmArtifactOption = useCallback((optionId: string) => {
    console.log('[SinglePlayerGame] handleConfirmArtifactOption:', optionId)

    if (optionId === 'buy_card') {
      // For Incense Burner buy_card option, first get payment options
      const result = executeArtifactEffect(optionId)

      // Check if it requires payment selection
      if (result.requiresInput && result.inputType === 'SELECT_PAYMENT' && result.stonePaymentOptions) {
        console.log('[SinglePlayerGame] Showing payment selection modal')
        setPendingArtifactOptionId(optionId)
        setStonePaymentOptions(result.stonePaymentOptions)
        setStonePaymentAmount(result.paymentAmount || 3)
        setShowArtifactEffectModal(false)
        setShowStonePaymentModal(true)
        return
      }

      // Fallback to old behavior (shouldn't happen with new code)
      setPendingArtifactOptionId(optionId)
      setArtifactEffectInputType('SELECT_CARDS')
      setArtifactSelectableCards(market || [])
      setArtifactCardSelectionLabel('選擇1張買入區卡牌購買')
      setArtifactMinCardSelection(1)
      setArtifactMaxCardSelection(1)
      return
    }

    if (optionId === 'shelter_hand') {
      setPendingArtifactOptionId(optionId)
      setArtifactEffectInputType('SELECT_CARDS')
      setArtifactSelectableCards(hand || [])
      setArtifactCardSelectionLabel('選擇1張手牌棲息地')
      setArtifactMinCardSelection(1)
      setArtifactMaxCardSelection(1)
      return
    }

    const result = executeArtifactEffect(optionId)
    setShowArtifactEffectModal(false)

    if (result.success) {
      setArtifactResultMessage(result.message)
      setTimeout(() => setArtifactResultMessage(null), 3000)
    }
  }, [executeArtifactEffect, market, hand])

  // Handle artifact card selection confirmation
  const handleConfirmArtifactCards = useCallback((cardIds: string[]) => {
    console.log('[SinglePlayerGame] handleConfirmArtifactCards:', cardIds, 'pendingPayment:', pendingPayment)

    // If we have a pending payment (from Incense Burner), pass it along
    const result = executeArtifactEffect(
      pendingArtifactOptionId || undefined,
      cardIds,
      pendingPayment || undefined
    )
    setShowArtifactEffectModal(false)
    setPendingArtifactOptionId(null)
    setPendingPayment(null)
    setArtifactSelectableCards([])

    if (result.success) {
      setArtifactResultMessage(result.message)
      setTimeout(() => setArtifactResultMessage(null), 3000)
    }
  }, [executeArtifactEffect, pendingArtifactOptionId, pendingPayment])

  // Handle stone payment confirmation (for Incense Burner)
  const handleConfirmStonePayment = useCallback((payment: Partial<typeof stones>) => {
    console.log('[SinglePlayerGame] handleConfirmStonePayment:', payment)

    // Store the payment and show card selection
    setPendingPayment(payment)
    setShowStonePaymentModal(false)

    // Now show card selection for purchasing
    setArtifactEffectInputType('SELECT_CARDS')
    setArtifactSelectableCards(market || [])
    setArtifactCardSelectionLabel('選擇1張買入區卡牌購買')
    setArtifactMinCardSelection(1)
    setArtifactMaxCardSelection(1)
    setShowArtifactEffectModal(true)
  }, [market])

  // Handle closing stone payment modal
  const handleCloseStonePaymentModal = useCallback(() => {
    setShowStonePaymentModal(false)
    setPendingArtifactOptionId(null)
    setStonePaymentOptions([])
    setStonePaymentAmount(0)
  }, [])

  // Handle artifact option with card selection
  const handleConfirmArtifactOptionWithCards = useCallback((optionId: string, cardIds: string[]) => {
    console.log('[SinglePlayerGame] handleConfirmArtifactOptionWithCards:', optionId, cardIds)

    const result = executeArtifactEffect(optionId, cardIds)
    setShowArtifactEffectModal(false)
    setPendingArtifactOptionId(null)
    setArtifactSelectableCards([])

    if (result.success) {
      setArtifactResultMessage(result.message)
      setTimeout(() => setArtifactResultMessage(null), 3000)
    }
  }, [executeArtifactEffect])

  // Handle stone upgrade confirmation (Book of Thoth)
  const handleConfirmStoneUpgrades = useCallback((upgrades: StoneUpgrade[]) => {
    console.log('[SinglePlayerGame] handleConfirmStoneUpgrades:', upgrades)

    const stoneChanges: Partial<Record<StoneType, number>> = {}
    upgrades.forEach(upgrade => {
      stoneChanges[upgrade.from] = (stoneChanges[upgrade.from] || 0) - 1
      stoneChanges[upgrade.to] = (stoneChanges[upgrade.to] || 0) + 1
    })

    const result = executeArtifactEffect(undefined, undefined, stoneChanges)
    setShowStoneUpgradeModal(false)

    if (result.success) {
      setArtifactResultMessage(result.message)
      setTimeout(() => setArtifactResultMessage(null), 3000)
    }
  }, [executeArtifactEffect])

  // Close artifact effect modal
  const handleCloseArtifactModal = useCallback(() => {
    setShowArtifactEffectModal(false)
    setPendingArtifactOptionId(null)
    setArtifactSelectableCards([])
    setArtifactEffectOptions([])
  }, [])

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
            onPassTurn={
              phase === SinglePlayerPhase.ACTION
                ? handlePass
                : phase === SinglePlayerPhase.SCORE
                  ? handleCompleteSettlement
                  : undefined
            }
            showPassTurn={phase === SinglePlayerPhase.ACTION || phase === SinglePlayerPhase.SCORE}
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
            unprocessedResolutionCards={unprocessedResolutionCardsCount}
          />
        }
        leftSidebar={
          <LeftSidebar
            players={[playerData]}
            currentPlayerId="single-player"
            currentTurnPlayerId="single-player"
            phase={multiplayerPhase}
            deckCount={deckSize}
            onDrawCard={
              phase === SinglePlayerPhase.DRAW
                ? handleDraw
                : phase === SinglePlayerPhase.ACTION
                  ? drawCardInActionPhase
                  : undefined
            }
            onToggleZoneBonus={handleToggleZoneBonus}
            currentRound={round}
            mySelectedArtifacts={artifactSelectionPhase?.confirmedArtifactId ? [artifactSelectionPhase.confirmedArtifactId] : []}
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
        scoreBar={null}
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
                onCardReturn={(_playerId, cardId) => {
                  console.log('[SinglePlayerGame] 場上卡片回手:', cardId)
                  returnCardToHand(cardId)
                }}
                onCardDiscard={(_playerId, cardId) => {
                  console.log('[SinglePlayerGame] 場上卡片棄置:', cardId)
                  discardCard(cardId)
                }}
                onScoreAdjust={handleScoreAdjust}
                onFlipToggle={handleFlipToggle}
                onCurrentCardMoveToHand={handleMoveCurrentCardToHand}
                onCurrentCardSell={handleSellCurrentCard}
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
                canTameCard={canTameCard}
                pendingResolutionCards={pendingResolutionCards}
                onResolutionCardClick={(_playerId, cardId) => handleFieldCardClickInResolution(cardId)}
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
                    onCardReturn={(_playerId, cardId) => {
                      console.log('[SinglePlayerGame] 回手按鈕被點擊:', cardId)
                      returnCardToHand(cardId)
                    }}
                    onCardDiscard={(_playerId, cardId) => {
                      console.log('[SinglePlayerGame] 棄置按鈕被點擊:', cardId)
                      discardCard(cardId)
                    }}
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
        externalViewMode={handViewMode}
        onViewModeChange={setHandViewMode}
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
            <>
              <p className="text-sm text-slate-400 mb-6">
                共 {discardPile.length} 張卡片已棄置（點擊拿取按鈕拿回到手上）
              </p>
              <div className="flex flex-wrap gap-6 max-h-[70vh] overflow-y-auto justify-start px-4">
                {discardPile.map((card, index) => (
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
                      <Card card={card} index={index} compact={false} currentRound={round} />
                    </div>
                    {/* Take button - always available */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        takeCardFromDiscard(card.instanceId)
                        setShowDiscardModal(false)
                      }}
                      className={cn(
                        'absolute bottom-0 left-0 right-0 z-50 text-white text-xs font-bold py-2 px-3 rounded-lg transition-all shadow-lg hover:scale-105',
                        'bg-blue-600 hover:bg-blue-500 hover:shadow-blue-500/50'
                      )}
                      type="button"
                      title="拿到手上"
                    >
                      拿到手上
                    </button>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </Modal>

      {/* Score Modal with Tabs */}
      <Modal
        isOpen={showScoreModal}
        onClose={() => setShowScoreModal(false)}
        size="wide"
      >
        <div className="flex flex-col h-full max-h-[80vh]">
          {/* Effect Reason Display - Fixed at top (only when triggered by lightning effect) */}
          {ifritEffectTriggered && (
            <div className="flex-shrink-0 p-4 bg-gradient-to-r from-orange-900/50 to-red-900/50 border-b-2 border-orange-500/50">
              <div className="flex items-center gap-3">
                <span className="text-3xl">⚡</span>
                <div>
                  <div className="text-lg font-bold text-orange-300">
                    {ifritEffectTriggered.cardNameTw} ({ifritEffectTriggered.cardName}) 的閃電效果
                  </div>
                  <div className="text-md text-orange-200 mt-1 whitespace-pre-line">
                    {ifritEffectTriggered.reason}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Tabs */}
          <div className="flex-shrink-0 flex border-b border-slate-700">
            <button
              className={cn(
                'flex-1 px-4 py-3 text-sm font-medium transition-colors',
                scoreModalTab === 'track'
                  ? 'bg-slate-700 text-vale-400 border-b-2 border-vale-400'
                  : 'text-slate-400 hover:text-slate-300 hover:bg-slate-800/50'
              )}
              onClick={() => setScoreModalTab('track')}
            >
              分數進度條
            </button>
            <button
              className={cn(
                'flex-1 px-4 py-3 text-sm font-medium transition-colors',
                scoreModalTab === 'history'
                  ? 'bg-slate-700 text-vale-400 border-b-2 border-vale-400'
                  : 'text-slate-400 hover:text-slate-300 hover:bg-slate-800/50'
              )}
              onClick={() => setScoreModalTab('history')}
            >
              分數變化記錄
            </button>
          </div>

          {/* Tab Content */}
          <div className="flex-1 overflow-y-auto p-6">
            {scoreModalTab === 'track' ? (
              <ScoreTrack
                players={playerScores}
                maxScore={60}
                currentPlayerId="single-player"
                onScoreAdjust={handleScoreAdjust}
                allowAdjustment={true}
                onFlipToggle={handleFlipToggle}
              />
            ) : (
              <ScoreHistory history={gameState?.scoreHistory || []} />
            )}
          </div>
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
        title={`棲息地 (${sanctuary.length} 張)`}
      >
        <div className="p-4">
          {sanctuary.length === 0 ? (
            <div className="text-center text-slate-500">棲息地中沒有卡片</div>
          ) : (
            <>
              <div className="flex flex-wrap gap-6 max-h-[70vh] overflow-y-auto justify-start px-4">
                {sanctuary.map((card, index) => (
                  <div
                    key={card.instanceId}
                    className="animate-fade-in relative group"
                    style={{
                      animationDelay: `${index * 30}ms`,
                      width: '9rem',
                      height: '13.5rem'
                    }}
                  >
                    <div className="transform scale-[0.4] origin-top-left">
                      <Card card={card} index={index} compact={false} currentRound={round} />
                    </div>
                    {/* Return to Hand Button */}
                    {phase === SinglePlayerPhase.ACTION && (
                      <button
                        type="button"
                        onClick={() => {
                          takeCardFromSanctuary(card.instanceId)
                          if (sanctuary.length === 1) {
                            setShowSanctuaryModal(false)
                          }
                        }}
                        className="absolute bottom-0 left-0 right-0 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold py-1 px-2 rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 shadow-lg"
                        style={{ transform: 'scale(2.5)', transformOrigin: 'bottom left' }}
                      >
                        回手
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </>
          )}
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

      {/* Artifact Result Message Toast */}
      {artifactResultMessage && (
        <div
          className="fixed top-32 left-1/2 -translate-x-1/2 z-50 bg-purple-600 text-white px-6 py-3 rounded-lg shadow-lg animate-slide-up"
          data-testid="artifact-result-toast"
        >
          {artifactResultMessage}
        </div>
      )}

      {/* Artifact Action Panel - Shows in ACTION phase when artifact is available */}
      {phase === SinglePlayerPhase.ACTION && confirmedArtifactId && (
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

      {/* Artifact Effect Modal */}
      <ArtifactEffectModal
        isOpen={showArtifactEffectModal}
        onClose={handleCloseArtifactModal}
        artifactId={confirmedArtifactId}
        inputType={artifactEffectInputType}
        options={artifactEffectOptions}
        selectableCards={artifactSelectableCards}
        minCardSelection={artifactMinCardSelection}
        maxCardSelection={artifactMaxCardSelection}
        currentRound={round}
        cardSelectionLabel={artifactCardSelectionLabel}
        onConfirmOption={handleConfirmArtifactOption}
        onConfirmCards={handleConfirmArtifactCards}
        onConfirmOptionWithCards={handleConfirmArtifactOptionWithCards}
      />

      {/* Stone Upgrade Modal (Book of Thoth) */}
      <StoneUpgradeModal
        isOpen={showStoneUpgradeModal}
        onClose={() => setShowStoneUpgradeModal(false)}
        playerStones={stones || EMPTY_STONE_POOL}
        maxUpgrades={2}
        onConfirmUpgrades={handleConfirmStoneUpgrades}
      />

      {/* Stone Payment Modal (Incense Burner) v9.14.0 */}
      <StonePaymentModal
        isOpen={showStonePaymentModal}
        onClose={handleCloseStonePaymentModal}
        playerStones={stones || EMPTY_STONE_POOL}
        paymentOptions={stonePaymentOptions}
        paymentAmount={stonePaymentAmount}
        onConfirmPayment={handleConfirmStonePayment}
        title="香爐 - 選擇支付方式"
      />

      {/* Resolution Confirm Modal - For Imp RECOVER_CARD effect (v9.7.0) */}
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

      {/* Ifrit Lightning Effect (v9.12.0) */}
      <LightningEffect
        isActive={showLightningEffect}
        cardName={ifritEffectTriggered?.cardName || ''}
        cardNameTw={ifritEffectTriggered?.cardNameTw || ''}
        scoreChange={ifritEffectTriggered?.scoreChange || 0}
        reason={ifritEffectTriggered?.reason || ''}
        showScoreModal={ifritEffectTriggered?.showScoreModal || false}
        onLightningComplete={handleLightningComplete}
        onOpenModal={handleLightningOpenModal}
        onEffectComplete={handleLightningEffectComplete}
      />

      {/* Dev Test Panel (v9.15.0) - Only in DEV mode */}
      {import.meta.env.DEV && isDevTestPanelOpen && (
        <DevTestPanel
          onClose={() => setDevTestPanelOpen(false)}
          onSummonCard={handleSummonCard}
          onResetGame={resetGame}
          onClearField={() => {
            // Clear player's field by updating state directly
            useGameStore.setState(state => ({
              ...state,
              gameState: state.gameState ? {
                ...state.gameState,
                player: {
                  ...state.gameState.player,
                  field: []
                }
              } : null
            }))
          }}
        />
      )}
    </>
  )
}
