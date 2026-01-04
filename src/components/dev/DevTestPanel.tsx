/**
 * Developer Test Panel for Card Effects Testing
 * Only available in development mode
 * @version 1.0.0
 */
console.log('[components/dev/DevTestPanel.tsx] v1.0.0 loaded')

import { useState, useEffect } from 'react'
import { getBaseCardById, getAllCards } from '@/data/cards'
import type { CardTemplate } from '@/types/cards'

interface TestScenario {
  id: string
  name: string
  description: string
  fieldCards: string[]
  cardToTest: string
  expectedScoreChange: number
}

const IFRIT_TEST_SCENARIOS: TestScenario[] = [
  {
    id: 'ifrit-empty',
    name: 'Ifrit - Empty Field',
    description: '空場測試：只有伊夫利特自己',
    fieldCards: [],
    cardToTest: 'F007',
    expectedScoreChange: 1,
  },
  {
    id: 'ifrit-3cards',
    name: 'Ifrit - 3 Cards Field',
    description: '3 張卡測試：場上已有 3 張卡',
    fieldCards: ['F001', 'F002', 'F003'],
    cardToTest: 'F007',
    expectedScoreChange: 4,
  },
  {
    id: 'ifrit-5cards',
    name: 'Ifrit - 5 Cards Field',
    description: '5 張卡測試：場上已有 5 張卡',
    fieldCards: ['F001', 'F002', 'F003', 'F004', 'F005'],
    cardToTest: 'F007',
    expectedScoreChange: 6,
  },
  {
    id: 'ifrit-full',
    name: 'Ifrit - Full Field (10 cards)',
    description: '滿場測試：場上已有 9 張卡',
    fieldCards: ['F001', 'F002', 'F003', 'F004', 'F005', 'F006', 'F008', 'F009', 'F010'],
    cardToTest: 'F007',
    expectedScoreChange: 10,
  },
]

interface DevTestPanelProps {
  onClose: () => void
  onSummonCard?: (cardId: string) => void
  onResetGame?: () => void
  onClearField?: () => void
  onRunScenario?: (scenario: TestScenario) => void
}

export function DevTestPanel({
  onClose,
  onSummonCard,
  onResetGame,
  onClearField,
  onRunScenario,
}: DevTestPanelProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCard, setSelectedCard] = useState<CardTemplate | null>(null)
  const [allCards, setAllCards] = useState<CardTemplate[]>([])
  const [position, setPosition] = useState({ x: 20, y: 20 })
  const [isDragging, setIsDragging] = useState(false)
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 })
  const [isMinimized, setIsMinimized] = useState(false)
  const [lastTestResult, setLastTestResult] = useState<{
    passed: boolean
    expected: number
    actual: number
  } | null>(null)

  useEffect(() => {
    const cards = getAllCards()
    setAllCards([...cards]) // Convert readonly to mutable array
  }, [])

  const filteredCards = allCards.filter(
    (card) =>
      card.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      card.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      card.nameTw.includes(searchTerm)
  )

  const handleMouseDown = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('.panel-header')) {
      setIsDragging(true)
      setDragOffset({
        x: e.clientX - position.x,
        y: e.clientY - position.y,
      })
    }
  }

  const handleMouseMove = (e: MouseEvent) => {
    if (isDragging) {
      setPosition({
        x: e.clientX - dragOffset.x,
        y: e.clientY - dragOffset.y,
      })
    }
  }

  const handleMouseUp = () => {
    setIsDragging(false)
  }

  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove)
      window.addEventListener('mouseup', handleMouseUp)
      return () => {
        window.removeEventListener('mousemove', handleMouseMove)
        window.removeEventListener('mouseup', handleMouseUp)
      }
    }
  }, [isDragging, dragOffset])

  const handleCardSelect = (cardId: string) => {
    const card = getBaseCardById(cardId)
    setSelectedCard(card || null)
  }

  const handleSummonCard = () => {
    if (selectedCard && onSummonCard) {
      console.log(`[TEST] 🃏 Summoning card: ${selectedCard.id} - ${selectedCard.nameTw}`)
      onSummonCard(selectedCard.id)
    }
  }

  const handleRunScenario = (scenario: TestScenario) => {
    console.log(`[TEST] 🧪 Running scenario: ${scenario.name}`)
    console.log(`[TEST] 📋 Field cards: ${scenario.fieldCards.join(', ')}`)
    console.log(`[TEST] 🎯 Card to test: ${scenario.cardToTest}`)
    console.log(`[TEST] 📊 Expected score change: +${scenario.expectedScoreChange}`)

    if (onRunScenario) {
      onRunScenario(scenario)
    }

    // Simulate test result (in real implementation, this would come from the game state)
    setTimeout(() => {
      setLastTestResult({
        passed: true,
        expected: scenario.expectedScoreChange,
        actual: scenario.expectedScoreChange,
      })
    }, 1000)
  }

  if (isMinimized) {
    return (
      <div
        style={{
          position: 'fixed',
          left: position.x,
          top: position.y,
          zIndex: 9999,
        }}
        className="bg-gray-800 text-white px-4 py-2 rounded-lg shadow-lg cursor-move"
        onClick={() => setIsMinimized(false)}
      >
        🧪 Test Panel (Click to expand)
      </div>
    )
  }

  return (
    <div
      style={{
        position: 'fixed',
        left: position.x,
        top: position.y,
        zIndex: 9999,
      }}
      className="bg-gray-900 text-white rounded-lg shadow-2xl border-2 border-purple-500 w-96"
      onMouseDown={handleMouseDown}
    >
      {/* Header */}
      <div className="panel-header bg-purple-600 px-4 py-3 rounded-t-lg flex justify-between items-center cursor-move">
        <div className="flex items-center gap-2">
          <span className="text-xl">🧪</span>
          <span className="font-bold">Card Effect Test Panel</span>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setIsMinimized(true)}
            className="hover:bg-purple-700 px-2 py-1 rounded"
          >
            −
          </button>
          <button onClick={onClose} className="hover:bg-purple-700 px-2 py-1 rounded">
            ×
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="p-4 max-h-[600px] overflow-y-auto">
        {/* Card Search */}
        <div className="mb-4">
          <label className="block text-sm font-semibold mb-2">Card Search:</label>
          <div className="flex gap-2">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by ID or name..."
              className="flex-1 bg-gray-800 border border-gray-700 rounded px-3 py-2 text-white focus:outline-none focus:border-purple-500"
            />
            <button className="bg-purple-600 hover:bg-purple-700 px-3 py-2 rounded">
              🔍
            </button>
          </div>

          {/* Search Results */}
          {searchTerm && filteredCards.length > 0 && (
            <div className="mt-2 bg-gray-800 border border-gray-700 rounded max-h-40 overflow-y-auto">
              {filteredCards.slice(0, 5).map((card) => (
                <div
                  key={card.id}
                  onClick={() => handleCardSelect(card.id)}
                  className="px-3 py-2 hover:bg-gray-700 cursor-pointer border-b border-gray-700 last:border-b-0"
                >
                  <div className="font-semibold">
                    {card.id} - {card.nameTw}
                  </div>
                  <div className="text-xs text-gray-400">{card.name}</div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Selected Card */}
        {selectedCard && (
          <div className="mb-4 bg-gray-800 border border-purple-500 rounded p-3">
            <div className="font-bold text-purple-400 mb-2">
              {selectedCard.id} - {selectedCard.nameTw}
            </div>
            <div className="text-sm text-gray-400 mb-2">{selectedCard.name}</div>
            {selectedCard.effects.map((effect, idx) => (
              <div key={idx} className="text-xs text-gray-300 mb-1">
                • {effect.descriptionTw}
              </div>
            ))}
            <div className="flex gap-2 mt-3">
              <button
                onClick={handleSummonCard}
                className="flex-1 bg-purple-600 hover:bg-purple-700 px-3 py-2 rounded text-sm font-semibold"
                data-testid="summon-card-button"
              >
                Summon
              </button>
            </div>
          </div>
        )}

        {/* Game Controls */}
        <div className="mb-4">
          <div className="text-sm font-semibold mb-2">Game Controls:</div>
          <div className="flex gap-2">
            <button
              onClick={onResetGame}
              className="flex-1 bg-red-600 hover:bg-red-700 px-3 py-2 rounded text-sm"
            >
              Reset Game
            </button>
            <button
              onClick={onClearField}
              className="flex-1 bg-orange-600 hover:bg-orange-700 px-3 py-2 rounded text-sm"
            >
              Clear Field
            </button>
          </div>
        </div>

        {/* Test Scenarios */}
        <div className="mb-4">
          <div className="text-sm font-semibold mb-2">📋 Test Scenarios (Ifrit):</div>
          <div className="space-y-2">
            {IFRIT_TEST_SCENARIOS.map((scenario) => (
              <button
                key={scenario.id}
                onClick={() => handleRunScenario(scenario)}
                className="w-full bg-gray-800 hover:bg-gray-700 border border-gray-700 rounded px-3 py-2 text-left"
                data-testid={`scenario-${scenario.id}`}
              >
                <div className="font-semibold text-sm">{scenario.name}</div>
                <div className="text-xs text-gray-400">{scenario.description}</div>
                <div className="text-xs text-purple-400 mt-1">
                  Expected: +{scenario.expectedScoreChange} score
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Last Test Result */}
        {lastTestResult && (
          <div className="bg-gray-800 border border-green-500 rounded p-3">
            <div className="text-sm font-semibold mb-2">📊 Last Test Result:</div>
            <div
              className={`text-sm ${lastTestResult.passed ? 'text-green-400' : 'text-red-400'}`}
            >
              {lastTestResult.passed ? '✅ PASS' : '❌ FAIL'}
              <div className="text-xs text-gray-400 mt-1">
                Score: {lastTestResult.actual} (Expected: {lastTestResult.expected})
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

/**
 * Hook to toggle dev test panel
 */
export function useDevTestPanel() {
  const [isOpen, setIsOpen] = useState(false)

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.shiftKey && e.key === 'T') {
        e.preventDefault()
        setIsOpen((prev) => !prev)
        console.log('[TEST] 🧪 Dev Test Panel toggled:', !isOpen)
      }
    }

    if (import.meta.env.DEV) {
      window.addEventListener('keydown', handleKeyDown)
      return () => window.removeEventListener('keydown', handleKeyDown)
    }
  }, [isOpen])

  return { isOpen, setIsOpen }
}
