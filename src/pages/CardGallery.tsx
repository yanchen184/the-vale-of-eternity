/**
 * Card Gallery Page - Display all 70 cards
 * For testing and verification
 * @version 2.1.0 - Added larger card preview modal
 */
console.log('[pages/CardGallery.tsx] v2.1.0 loaded')

import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Grid, List } from 'lucide-react'
import { Button } from '@/components/ui'
import { Card } from '@/components/game'
import {
  BASE_CARDS,
  BASE_FIRE_CARDS,
  BASE_WATER_CARDS,
  BASE_EARTH_CARDS,
  BASE_WIND_CARDS,
  BASE_DRAGON_CARDS,
  validateCardData,
  createCardInstance,
} from '@/data/cards'
import { Element, ELEMENT_ICONS, ELEMENT_NAMES_TW } from '@/types/cards'
import type { CardTemplate } from '@/types/cards'

// ============================================
// TYPES
// ============================================

type ViewMode = 'grid' | 'list'
type FilterElement = 'all' | Element

// ============================================
// HELPER FUNCTIONS
// ============================================

function getCardsByFilter(filter: FilterElement): readonly CardTemplate[] {
  if (filter === 'all') return BASE_CARDS
  switch (filter) {
    case Element.FIRE:
      return BASE_FIRE_CARDS
    case Element.WATER:
      return BASE_WATER_CARDS
    case Element.EARTH:
      return BASE_EARTH_CARDS
    case Element.WIND:
      return BASE_WIND_CARDS
    case Element.DRAGON:
      return BASE_DRAGON_CARDS
    default:
      return BASE_CARDS
  }
}

// ============================================
// MAIN COMPONENT
// ============================================

export function CardGallery() {
  const navigate = useNavigate()
  const [viewMode, setViewMode] = useState<ViewMode>('grid')
  const [elementFilter, setElementFilter] = useState<FilterElement>('all')
  const [selectedCard, setSelectedCard] = useState<CardTemplate | null>(null)

  // Validate card data on mount
  const validation = useMemo(() => validateCardData(), [])

  // Get filtered cards
  const filteredCards = useMemo(() => {
    return getCardsByFilter(elementFilter)
  }, [elementFilter])

  // Convert templates to instances for Card component
  const cardInstances = useMemo(() => {
    return filteredCards.map(template => createCardInstance(template, 0))
  }, [filteredCards])

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900">
      {/* Header */}
      <header className="bg-slate-800/50 border-b border-slate-700 p-4 sticky top-0 z-10 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/')}
              leftIcon={<ArrowLeft className="h-4 w-4" />}
            >
              Back
            </Button>
            <div>
              <h1 className="text-xl font-bold text-slate-100">Card Gallery</h1>
              <p className="text-sm text-slate-400">
                {validation.totalCards} cards | {validation.isValid ? 'Data Valid' : 'Data Invalid'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {/* View Mode Toggle */}
            <div className="flex bg-slate-700 rounded-lg p-1">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 rounded ${viewMode === 'grid' ? 'bg-slate-600' : ''}`}
              >
                <Grid className="h-4 w-4" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 rounded ${viewMode === 'list' ? 'bg-slate-600' : ''}`}
              >
                <List className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-4">
        {/* Element Filter */}
        <div className="mb-6 flex flex-wrap gap-2">
          <button
            onClick={() => setElementFilter('all')}
            className={`px-4 py-2 rounded-lg transition-colors ${
              elementFilter === 'all'
                ? 'bg-slate-600 text-white'
                : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
            }`}
          >
            All ({BASE_CARDS.length})
          </button>
          {Object.values(Element).map(element => (
            <button
              key={element}
              onClick={() => setElementFilter(element)}
              className={`px-4 py-2 rounded-lg transition-colors flex items-center gap-2 ${
                elementFilter === element
                  ? 'bg-slate-600 text-white'
                  : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
              }`}
            >
              <span>{ELEMENT_ICONS[element]}</span>
              <span>{ELEMENT_NAMES_TW[element]}</span>
              <span className="text-xs">
                ({getCardsByFilter(element).length})
              </span>
            </button>
          ))}
        </div>

        {/* Validation Info */}
        <div className="mb-6 p-4 bg-slate-800/50 rounded-lg border border-slate-700">
          <h3 className="text-sm font-semibold text-slate-300 mb-2">Card Distribution</h3>
          <div className="grid grid-cols-5 gap-4 text-center text-sm">
            {Object.entries(validation.elementCounts).map(([element, count]) => (
              <div key={element} className="bg-slate-700/50 p-2 rounded">
                <div className="text-lg">{ELEMENT_ICONS[element as Element]}</div>
                <div className="text-slate-400">{ELEMENT_NAMES_TW[element as Element]}</div>
                <div className="text-white font-bold">{count}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Card Grid */}
        {viewMode === 'grid' ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
            {cardInstances.map((card, index) => (
              <div
                key={card.instanceId}
                className="flex flex-col items-center"
              >
                <Card
                  card={card}
                  index={index}
                  isSelected={selectedCard?.id === card.cardId}
                  onClick={() => {
                    const template = filteredCards.find(t => t.id === card.cardId)
                    setSelectedCard(template || null)
                  }}
                />
                <span className="mt-1 text-xs text-slate-500">{card.cardId}</span>
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-2">
            {filteredCards.map((template) => (
              <div
                key={template.id}
                className="flex items-center gap-4 p-3 bg-slate-800/50 rounded-lg border border-slate-700 hover:border-slate-600 transition-colors"
              >
                <span className="w-12 text-center text-sm text-slate-500">{template.id}</span>
                <span className="text-lg">{ELEMENT_ICONS[template.element]}</span>
                <span className="w-20 text-center font-bold text-slate-300">{template.cost}</span>
                <span className="flex-1 text-slate-200">{template.nameTw}</span>
                <span className="flex-1 text-slate-400 text-sm">{template.name}</span>
                <span className="w-16 text-center text-lg font-bold text-white">{template.baseScore}</span>
                <span className="flex-1 text-xs text-slate-500 truncate">
                  {template.effectDescriptionTw || '-'}
                </span>
              </div>
            ))}
          </div>
        )}

        {/* Selected Card Detail - Enlarged Preview */}
        {selectedCard && (
          <div
            className="fixed inset-0 bg-black/90 flex items-center justify-center z-50 p-4"
            onClick={() => setSelectedCard(null)}
          >
            <div
              className="bg-slate-800 rounded-xl p-6 max-w-3xl w-full relative max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={() => setSelectedCard(null)}
                className="absolute top-4 right-4 text-slate-400 hover:text-white text-xl font-bold z-10 bg-slate-900/80 hover:bg-slate-900 rounded-full w-8 h-8 flex items-center justify-center"
              >
                ✕
              </button>

              <div className="flex gap-6 items-start">
                {/* Large Card Image - 放大1.5倍 */}
                <div className="flex-shrink-0">
                  <div className="transform scale-[1.5] origin-top-left ml-16 mt-10">
                    <Card
                      card={createCardInstance(selectedCard, 0)}
                      index={0}
                    />
                  </div>
                </div>

                {/* Card Details */}
                <div className="flex-1 ml-24">
                  <div className="flex items-center gap-3 mb-3">
                    <span className="text-3xl">{ELEMENT_ICONS[selectedCard.element]}</span>
                    <h3 className="text-2xl font-bold text-white">{selectedCard.nameTw}</h3>
                  </div>
                  <p className="text-lg text-slate-400 mb-4">{selectedCard.name}</p>

                  <div className="grid grid-cols-2 gap-3 mb-4">
                    <div className="bg-slate-700/50 p-3 rounded-lg">
                      <span className="text-slate-400 text-xs">消耗</span>
                      <div className="text-2xl font-bold text-white">{selectedCard.cost}</div>
                    </div>
                    <div className="bg-slate-700/50 p-3 rounded-lg">
                      <span className="text-slate-400 text-xs">分數</span>
                      <div className="text-2xl font-bold text-white">{selectedCard.baseScore}</div>
                    </div>
                  </div>

                  <div className="mb-3">
                    <span className="text-slate-500 text-xs">卡片編號</span>
                    <div className="text-base text-white font-mono">{selectedCard.id}</div>
                  </div>

                  {selectedCard.effectDescriptionTw && (
                    <div className="bg-slate-700/50 p-3 rounded-lg mb-3">
                      <div className="text-xs text-slate-400 mb-1">效果</div>
                      <p className="text-base text-slate-200 mb-1">{selectedCard.effectDescriptionTw}</p>
                      <p className="text-xs text-slate-500">{selectedCard.effectDescription}</p>
                    </div>
                  )}

                  {selectedCard.flavorTextTw && (
                    <div className="border-l-4 border-slate-600 pl-3">
                      <p className="text-xs italic text-slate-400">
                        {selectedCard.flavorTextTw}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}

export default CardGallery
