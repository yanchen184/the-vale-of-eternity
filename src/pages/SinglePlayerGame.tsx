/**
 * Single Player Game Page v4.0.0
 * Main gameplay interface for single-player mode - Now using multiplayer UI components
 * @version 4.0.0
 */
console.log('[pages/SinglePlayerGame.tsx] v4.0.0 loaded - Using multiplayer UI')

import { useEffect, useCallback, useMemo } from 'react'
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
  SinglePlayerPhase,
} from '@/stores/useGameStore'
import { calculateStonePoolValue } from '@/types/game'
import type { CardInstance } from '@/types/cards'
import { StoneType } from '@/types/cards'
import {
  GameLayout,
  GameHeader,
  LeftSidebar,
  RightSidebar,
  PlayersFieldArea,
} from '@/components/game'
import type { PlayerSidebarData } from '@/components/game/LeftSidebar'
import type { PlayerFieldData } from '@/components/game/PlayersFieldArea'
// import { PlayerColor } from '@/types/player-color'

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

  // Store actions
  const {
    startGame,
    drawCard,
    tameCreature,
    // pass,
    // endGame,
    resetGame,
    canTameCard,
    error,
  } = useGameStore()

  // Compute stone value
  const totalStoneValue = useMemo(() => {
    return stones ? calculateStonePoolValue(stones) : 0
  }, [stones])

  // Initialize game if not started
  useEffect(() => {
    if (!phase) {
      const savedName = localStorage.getItem('playerName') || 'Player'
      startGame(savedName)
    }
  }, [phase, startGame])

  // Convert SinglePlayerPhase to multiplayer phase format
  const multiplayerPhase = useMemo(() => {
    if (!phase) return 'WAITING' as const
    if (gameOver) return 'ENDED' as const
    if (phase === SinglePlayerPhase.DRAW) return 'HUNTING' as const
    return 'ACTION' as const
  }, [phase, gameOver])

  // Prepare player data for LeftSidebar
  const playerData: PlayerSidebarData = useMemo(() => ({
    playerId: 'single-player',
    name: playerName || 'Player',
    color: 'blue' as any, // PlayerColor.BLUE
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
    zoneBonus: 0, // Single player doesn't use zone bonus
  }), [playerName, stones, hand, field, totalStoneValue])

  // Prepare field data for PlayersFieldArea
  const fieldData: PlayerFieldData = useMemo(() => ({
    playerId: 'single-player',
    name: playerName || 'Player',
    color: 'blue' as any, // PlayerColor.BLUE
    handCards: hand || [],
    fieldCards: field || [],
    sanctuaryCards: [],
    isCurrentPlayer: true,
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

  // Handle pass action (currently unused - keeping for future use)
  // const handlePass = useCallback(() => {
  //   if (phase !== SinglePlayerPhase.ACTION) return
  //   pass()
  // }, [phase, pass])

  // Handle back to menu
  const handleBackToMenu = useCallback(() => {
    resetGame()
    navigate('/')
  }, [resetGame, navigate])

  // Handle play again
  const handlePlayAgain = useCallback(() => {
    resetGame()
    const savedName = localStorage.getItem('playerName') || 'Player'
    startGame(savedName)
  }, [resetGame, startGame])

  // Show loading state if game not initialized
  if (!phase || !stones) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
        <div className="text-white text-2xl">載入中...</div>
      </div>
    )
  }

  // Game Over Modal
  if (gameOver) {
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
    <GameLayout
      header={
        <GameHeader
          roomCode="單人遊戲"
          phase={multiplayerPhase}
          round={round}
          currentPlayerName={playerName || 'Player'}
          isYourTurn={true}
          onLeave={handleBackToMenu}
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
          playerCoins={stones || {
            [StoneType.ONE]: 0,
            [StoneType.THREE]: 0,
            [StoneType.SIX]: 0,
            [StoneType.WATER]: 0,
            [StoneType.FIRE]: 0,
            [StoneType.EARTH]: 0,
            [StoneType.WIND]: 0,
          }}
          playerName={playerName || 'Player'}
          isYourTurn={true}
          phase={multiplayerPhase}
        />
      }
      mainContent={
        /* Main Game Area */
        <div className="flex flex-col gap-4 h-full">
        {/* Market Area */}
        <div className="flex-shrink-0">
          <div className="bg-slate-800/30 rounded-xl border border-slate-700/50 p-4">
            <h3 className="text-lg font-semibold text-slate-200 mb-3">市場區</h3>
            <div className="flex gap-3 overflow-x-auto pb-2">
              {market && market.length > 0 ? (
                market.map((card) => (
                  <div
                    key={card.instanceId}
                    onClick={() => handleMarketCardClick(card)}
                    className={`flex-shrink-0 cursor-pointer transition-transform hover:scale-105 ${
                      phase === SinglePlayerPhase.ACTION && canTameCard(card.instanceId)
                        ? 'ring-2 ring-vale-500'
                        : 'opacity-60'
                    }`}
                  >
                    <div className="w-32 h-48 bg-gradient-to-br from-slate-700 to-slate-800 rounded-lg border-2 border-slate-600 p-2 flex flex-col">
                      <div className="text-xs font-bold text-slate-200">{card.name}</div>
                      <div className="text-xs text-slate-400">{card.element}</div>
                      <div className="mt-auto text-lg font-bold text-amber-400">{card.cost}</div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-slate-500 text-sm">市場為空</div>
              )}
            </div>
          </div>
        </div>

        {/* Player Field Area */}
        <div className="flex-1 min-h-0">
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

        {/* Error Display */}
        {error && (
          <div className="flex-shrink-0 bg-red-500/20 border border-red-500/50 rounded-lg p-3">
            <div className="text-red-400 text-sm font-semibold">{error}</div>
          </div>
        )}

        {/* Phase Instructions */}
        <div className="flex-shrink-0 bg-cyan-500/10 border border-cyan-500/30 rounded-lg p-3">
          <div className="text-cyan-300 text-sm text-center">
            {phase === SinglePlayerPhase.DRAW && '點擊左側抽牌按鈕抽取卡片'}
            {phase === SinglePlayerPhase.ACTION && '選擇手牌或市場的卡片進行馴服，或點擊跳過'}
          </div>
        </div>
      </div>
      }
    />
  )
}
