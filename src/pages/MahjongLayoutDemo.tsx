/**
 * MahjongLayoutDemo Page
 * Demo page for the mahjong-style 4-player game layout
 * @version 1.0.0
 */
console.log('[pages/MahjongLayoutDemo.tsx] v1.0.0 loaded')

import { useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { MahjongGameBoard, type PlayerData, type SeatPosition, type StoneBankData } from '@/components/game'
import { Button } from '@/components/ui/Button'
import type { CardInstance } from '@/types/cards'
import { Element, CardLocation } from '@/types/cards'
import type { StonePool as StonePoolType } from '@/types/game'

// ============================================
// MOCK DATA
// ============================================

const createMockStones = (overrides?: Partial<StonePoolType>): StonePoolType => ({
  ONE: 3,
  THREE: 2,
  SIX: 1,
  FIRE: 0,
  WATER: 0,
  EARTH: 0,
  WIND: 0,
  ...overrides,
})

const createMockCard = (
  id: string,
  name: string,
  element: Element,
  cost: number,
  score: number
): CardInstance => ({
  instanceId: id,
  cardId: id,
  name,
  nameTw: name,
  element,
  cost,
  baseScore: score,
  effects: [],
  ownerId: null,
  location: CardLocation.HAND,
  isRevealed: true,
  scoreModifier: 0,
  hasUsedAbility: false,
})

const MOCK_PLAYERS: Record<SeatPosition, PlayerData> = {
  SOUTH: {
    playerId: 'player-1',
    name: 'You',
    color: 'blue',
    position: 'SOUTH',
    stones: createMockStones({ ONE: 5, THREE: 2, SIX: 1, FIRE: 1, WATER: 2 }),
    hand: [
      createMockCard('card-1', 'Fire Dragon', Element.FIRE, 6, 8),
      createMockCard('card-2', 'Water Spirit', Element.WATER, 3, 4),
      createMockCard('card-3', 'Earth Golem', Element.EARTH, 4, 5),
    ],
    field: [
      createMockCard('card-4', 'Wind Fairy', Element.WIND, 2, 3),
      createMockCard('card-5', 'Ancient Dragon', Element.DRAGON, 8, 12),
    ],
    score: 35,
    isCurrentTurn: true,
    isYou: true,
  },
  NORTH: {
    playerId: 'player-2',
    name: 'Alice',
    color: 'red',
    position: 'NORTH',
    stones: createMockStones({ ONE: 2, THREE: 3, SIX: 0 }),
    hand: [
      createMockCard('card-6', 'Unknown', Element.FIRE, 0, 0),
      createMockCard('card-7', 'Unknown', Element.FIRE, 0, 0),
      createMockCard('card-8', 'Unknown', Element.FIRE, 0, 0),
      createMockCard('card-9', 'Unknown', Element.FIRE, 0, 0),
    ],
    field: [
      createMockCard('card-10', 'Fire Phoenix', Element.FIRE, 7, 9),
    ],
    score: 28,
    isCurrentTurn: false,
  },
  EAST: {
    playerId: 'player-3',
    name: 'Bob',
    color: 'green',
    position: 'EAST',
    stones: createMockStones({ ONE: 4, THREE: 1, SIX: 2 }),
    hand: [
      createMockCard('card-11', 'Unknown', Element.EARTH, 0, 0),
      createMockCard('card-12', 'Unknown', Element.EARTH, 0, 0),
    ],
    field: [
      createMockCard('card-13', 'Forest Guardian', Element.EARTH, 5, 6),
      createMockCard('card-14', 'Stone Giant', Element.EARTH, 6, 7),
      createMockCard('card-15', 'Moss Elemental', Element.EARTH, 3, 4),
    ],
    score: 42,
    isCurrentTurn: false,
  },
  WEST: {
    playerId: 'player-4',
    name: 'Carol',
    color: 'yellow',
    position: 'WEST',
    stones: createMockStones({ ONE: 1, THREE: 4, SIX: 1 }),
    hand: [
      createMockCard('card-16', 'Unknown', Element.WIND, 0, 0),
      createMockCard('card-17', 'Unknown', Element.WIND, 0, 0),
      createMockCard('card-18', 'Unknown', Element.WIND, 0, 0),
    ],
    field: [],
    score: 15,
    isCurrentTurn: false,
    hasPassed: true,
  },
}

const INITIAL_STONE_BANK: StoneBankData = {
  one: 15,
  three: 10,
  six: 5,
}

// ============================================
// MAIN COMPONENT
// ============================================

export function MahjongLayoutDemo() {
  const navigate = useNavigate()
  const [players, setPlayers] = useState(MOCK_PLAYERS)
  const [stoneBank, setStoneBank] = useState(INITIAL_STONE_BANK)
  const [phase, setPhase] = useState<'WAITING' | 'HUNTING' | 'ACTION' | 'RESOLUTION' | 'ENDED'>('ACTION')
  const [round, setRound] = useState(3)
  const [selectedCard, setSelectedCard] = useState<string | null>(null)

  // Handle taking stone from bank
  const handleTakeStone = useCallback((type: 'one' | 'three' | 'six') => {
    if (stoneBank[type] <= 0) return

    setStoneBank(prev => ({
      ...prev,
      [type]: prev[type] - 1,
    }))

    setPlayers(prev => {
      const southPlayer = prev.SOUTH
      if (!southPlayer) return prev
      return {
        ...prev,
        SOUTH: {
          ...southPlayer,
          stones: {
            ...southPlayer.stones,
            [type.toUpperCase() as keyof StonePoolType]:
              (southPlayer.stones[type.toUpperCase() as keyof StonePoolType] || 0) + 1,
          },
        },
      }
    })

    console.log(`Took 1 ${type}-point stone from bank`)
  }, [stoneBank])

  // Handle card selection
  const handleCardSelect = useCallback((cardId: string) => {
    setSelectedCard(prev => prev === cardId ? null : cardId)
    console.log(`Selected card: ${cardId}`)
  }, [])

  // Cycle through phases
  const handlePhaseChange = useCallback(() => {
    const phases: typeof phase[] = ['WAITING', 'HUNTING', 'ACTION', 'RESOLUTION', 'ENDED']
    setPhase(prev => {
      const currentIndex = phases.indexOf(prev)
      return phases[(currentIndex + 1) % phases.length]
    })
  }, [])

  // Cycle current player turn
  const handleTurnChange = useCallback(() => {
    const positions: SeatPosition[] = ['SOUTH', 'NORTH', 'EAST', 'WEST']
    const currentTurnPos = positions.find(pos => players[pos]?.isCurrentTurn)
    const currentIndex = currentTurnPos ? positions.indexOf(currentTurnPos) : 0
    const nextIndex = (currentIndex + 1) % positions.length

    setPlayers(prev => {
      const updated = { ...prev }
      positions.forEach((pos, idx) => {
        if (updated[pos]) {
          updated[pos] = {
            ...updated[pos]!,
            isCurrentTurn: idx === nextIndex,
          }
        }
      })
      return updated
    })
  }, [players])

  // Add score to player
  const handleAddScore = useCallback((position: SeatPosition, amount: number) => {
    setPlayers(prev => ({
      ...prev,
      [position]: prev[position] ? {
        ...prev[position]!,
        score: Math.max(0, prev[position]!.score + amount),
      } : null,
    }))
  }, [])

  // Toggle passed state
  const handleTogglePassed = useCallback((position: SeatPosition) => {
    setPlayers(prev => ({
      ...prev,
      [position]: prev[position] ? {
        ...prev[position]!,
        hasPassed: !prev[position]!.hasPassed,
      } : null,
    }))
  }, [])

  // Reset demo
  const handleReset = useCallback(() => {
    setPlayers(MOCK_PLAYERS)
    setStoneBank(INITIAL_STONE_BANK)
    setPhase('ACTION')
    setRound(3)
    setSelectedCard(null)
  }, [])

  return (
    <div className="relative">
      {/* Game Board */}
      <MahjongGameBoard
        players={players}
        stoneBank={stoneBank}
        phase={phase}
        round={round}
        onTakeStone={handleTakeStone}
        onCardSelect={handleCardSelect}
        showDetailedSouth={true}
        centerContent={
          <div className="text-center text-slate-400 text-sm">
            {selectedCard && (
              <div className="px-3 py-1 rounded bg-vale-900/50 border border-vale-600">
                Selected: {selectedCard}
              </div>
            )}
          </div>
        }
      />

      {/* Control Panel (Fixed - Bottom Right to not block EAST player) */}
      <div className="fixed bottom-4 right-4 z-50 bg-slate-800/95 backdrop-blur-sm rounded-xl border border-slate-700 p-3 space-y-3 max-w-[280px] max-h-[calc(100vh-200px)] overflow-y-auto">
        <h3 className="text-base font-bold text-slate-200 border-b border-slate-700 pb-2">
          Demo Controls
        </h3>

        {/* Navigation */}
        <Button
          variant="secondary"
          size="sm"
          onClick={() => navigate('/')}
          className="w-full"
        >
          Back to Home
        </Button>

        {/* Phase Control */}
        <div>
          <label className="text-xs text-slate-400 mb-1 block">Phase</label>
          <Button
            variant="secondary"
            size="sm"
            onClick={handlePhaseChange}
            className="w-full"
          >
            {phase} - Next
          </Button>
        </div>

        {/* Turn Control */}
        <div>
          <label className="text-xs text-slate-400 mb-1 block">Current Turn</label>
          <Button
            variant="secondary"
            size="sm"
            onClick={handleTurnChange}
            className="w-full"
          >
            Next Player's Turn
          </Button>
        </div>

        {/* Score Controls */}
        <div>
          <label className="text-xs text-slate-400 mb-1 block">Adjust Scores</label>
          <div className="grid grid-cols-2 gap-2">
            {(['SOUTH', 'NORTH', 'EAST', 'WEST'] as SeatPosition[]).map(pos => (
              <div key={pos} className="flex items-center gap-1">
                <span className="text-xs text-slate-500 w-10">{pos}</span>
                <button
                  onClick={() => handleAddScore(pos, -5)}
                  className="px-2 py-0.5 rounded bg-red-900/50 text-red-400 text-xs hover:bg-red-800/50"
                >
                  -5
                </button>
                <button
                  onClick={() => handleAddScore(pos, 5)}
                  className="px-2 py-0.5 rounded bg-emerald-900/50 text-emerald-400 text-xs hover:bg-emerald-800/50"
                >
                  +5
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Pass Controls */}
        <div>
          <label className="text-xs text-slate-400 mb-1 block">Toggle Passed</label>
          <div className="flex flex-wrap gap-1">
            {(['SOUTH', 'NORTH', 'EAST', 'WEST'] as SeatPosition[]).map(pos => (
              <button
                key={pos}
                onClick={() => handleTogglePassed(pos)}
                className={`px-2 py-0.5 rounded text-xs ${
                  players[pos]?.hasPassed
                    ? 'bg-amber-900/50 text-amber-400'
                    : 'bg-slate-700/50 text-slate-400'
                }`}
              >
                {pos}
              </button>
            ))}
          </div>
        </div>

        {/* Round Control */}
        <div>
          <label className="text-xs text-slate-400 mb-1 block">Round: {round}</label>
          <div className="flex gap-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setRound(r => Math.max(1, r - 1))}
              className="flex-1"
            >
              -
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setRound(r => r + 1)}
              className="flex-1"
            >
              +
            </Button>
          </div>
        </div>

        {/* Reset */}
        <Button
          variant="primary"
          size="sm"
          onClick={handleReset}
          className="w-full"
        >
          Reset Demo
        </Button>
      </div>
    </div>
  )
}

export default MahjongLayoutDemo
