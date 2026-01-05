/**
 * Developer Test Panel for Card Effects Testing
 * Only available in development mode
 * @version 1.3.0 - Add "直接召喚" button to trigger ON_TAME effects
 */
console.log('[components/dev/DevTestPanel.tsx] v1.3.0 loaded')

import { useState, useEffect } from 'react'
import { getBaseCardById, getAllBaseCards } from '@/data/cards'
import type { CardTemplate } from '@/types/cards'

interface DevTestPanelProps {
  onClose: () => void
  onSummonCard?: (cardId: string) => void
  onTameCard?: (cardId: string) => void  // NEW: Directly tame card to field (triggers ON_TAME)
  onResetGame?: () => void
  onClearField?: () => void
  onAddStones?: (stoneType: 'ONE' | 'THREE' | 'SIX', amount: number) => void
}

export function DevTestPanel({
  onClose,
  onSummonCard,
  onTameCard,
  onResetGame,
  onClearField,
  onAddStones,
}: DevTestPanelProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCard, setSelectedCard] = useState<CardTemplate | null>(null)
  const [allCards, setAllCards] = useState<CardTemplate[]>([])
  const [position, setPosition] = useState({ x: 20, y: 20 })
  const [isDragging, setIsDragging] = useState(false)
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 })
  const [isMinimized, setIsMinimized] = useState(false)

  useEffect(() => {
    const cards = getAllBaseCards()
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
      console.log(`[TEST] 🃏 Summoning card to hand: ${selectedCard.id} - ${selectedCard.nameTw}`)
      onSummonCard(selectedCard.id)
    }
  }

  const handleTameCard = () => {
    if (selectedCard && onTameCard) {
      console.log(`[TEST] ⚡ Taming card directly (triggers ON_TAME): ${selectedCard.id} - ${selectedCard.nameTw}`)
      onTameCard(selectedCard.id)
    }
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
          <label className="block text-sm font-semibold mb-2">🔍 搜尋卡片:</label>
          <div className="flex gap-2">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="輸入卡片 ID 或名稱..."
              className="flex-1 bg-gray-800 border border-gray-700 rounded px-3 py-2 text-white focus:outline-none focus:border-purple-500"
            />
            <button className="bg-purple-600 hover:bg-purple-700 px-3 py-2 rounded">
              🔍
            </button>
          </div>

          {/* Search Results */}
          {searchTerm && filteredCards.length > 0 && (
            <div className="mt-2 bg-gray-800 border border-gray-700 rounded max-h-60 overflow-y-auto">
              {filteredCards.slice(0, 10).map((card) => {
                const hasImplementedEffects = card.effects.some(e => e.isImplemented === true)
                const allEffectsImplemented = card.effects.every(e => e.isImplemented === true)

                return (
                  <div
                    key={card.id}
                    onClick={() => handleCardSelect(card.id)}
                    className="px-3 py-2 hover:bg-gray-700 cursor-pointer border-b border-gray-700 last:border-b-0"
                  >
                    <div className="flex items-center justify-between">
                      <div className="font-semibold">
                        {card.id} - {card.nameTw}
                      </div>
                      <div className="text-xs">
                        {allEffectsImplemented ? (
                          <span className="text-green-400">✅ 已實現</span>
                        ) : hasImplementedEffects ? (
                          <span className="text-yellow-400">⚠️ 部分實現</span>
                        ) : (
                          <span className="text-red-400">❌ 未實現</span>
                        )}
                      </div>
                    </div>
                    <div className="text-xs text-gray-400">{card.name}</div>
                  </div>
                )
              })}
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
                🃏 加入手牌
              </button>
              <button
                onClick={handleTameCard}
                className="flex-1 bg-green-600 hover:bg-green-700 px-3 py-2 rounded text-sm font-semibold"
                data-testid="tame-card-button"
                title="Directly tame card to field and trigger ON_TAME effects"
              >
                ⚡ 直接召喚
              </button>
            </div>
          </div>
        )}

        {/* Stone Controls */}
        {onAddStones && (
          <div className="mb-4">
            <div className="text-sm font-semibold mb-2">💎 Add Stones:</div>
            <div className="grid grid-cols-3 gap-2">
              <button
                onClick={() => onAddStones('ONE', 5)}
                className="bg-blue-600 hover:bg-blue-700 px-3 py-2 rounded text-sm"
                data-testid="add-stone-one"
              >
                +5 ×1
              </button>
              <button
                onClick={() => onAddStones('THREE', 3)}
                className="bg-green-600 hover:bg-green-700 px-3 py-2 rounded text-sm"
                data-testid="add-stone-three"
              >
                +3 ×3
              </button>
              <button
                onClick={() => onAddStones('SIX', 2)}
                className="bg-purple-600 hover:bg-purple-700 px-3 py-2 rounded text-sm"
                data-testid="add-stone-six"
              >
                +2 ×6
              </button>
            </div>
          </div>
        )}

        {/* Game Controls */}
        <div>
          <div className="text-sm font-semibold mb-2">🎮 Game Controls:</div>
          <div className="flex gap-2">
            <button
              onClick={onResetGame}
              className="flex-1 bg-red-600 hover:bg-red-700 px-3 py-2 rounded text-sm"
            >
              🔄 Reset Game
            </button>
            <button
              onClick={onClearField}
              className="flex-1 bg-orange-600 hover:bg-orange-700 px-3 py-2 rounded text-sm"
            >
              🗑️ Clear Field
            </button>
          </div>
        </div>
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
      // Ctrl + Shift + D (D for Debug/Dev)
      // Check both e.key and e.code for better compatibility across browsers
      const isDKey = e.key === 'D' || e.key === 'd' || e.code === 'KeyD'
      if (e.ctrlKey && e.shiftKey && isDKey) {
        e.preventDefault()
        const newState = !isOpen
        setIsOpen(newState)
        console.log('[TEST] 🧪 Dev Test Panel toggled:', newState)
      }
    }

    if (import.meta.env.DEV) {
      window.addEventListener('keydown', handleKeyDown)
      return () => window.removeEventListener('keydown', handleKeyDown)
    }
  }, [isOpen])

  return { isOpen, setIsOpen }
}
