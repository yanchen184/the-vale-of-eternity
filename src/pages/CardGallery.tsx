/**
 * Card Gallery Page - Display all 70 cards
 * Redesigned with improved UX and image preview
 * @version 3.1.0 - 完整中文化
 */
console.log('[pages/CardGallery.tsx] v3.1.0 loaded')

import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  ArrowLeft,
  Grid,
  List,
  Search,
  X,
  Sparkles,
  Shield,
  Flame,
  Droplets,
  TreePine,
  Wind,
  Crown,
} from 'lucide-react'
import { Button, ImagePreviewModal } from '@/components/ui'
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
import { getCardImagePath } from '@/lib/card-images'
import { cn } from '@/lib/utils'

// ============================================
// TYPES
// ============================================

type ViewMode = 'grid' | 'list'
type FilterElement = 'all' | Element

// ============================================
// CONSTANTS
// ============================================

const ELEMENT_CONFIG: Record<
  Element,
  { icon: typeof Flame; color: string; bgGradient: string; borderColor: string }
> = {
  [Element.FIRE]: {
    icon: Flame,
    color: 'text-red-400',
    bgGradient: 'from-red-900/30 to-red-950/50',
    borderColor: 'border-red-500/50',
  },
  [Element.WATER]: {
    icon: Droplets,
    color: 'text-blue-400',
    bgGradient: 'from-blue-900/30 to-blue-950/50',
    borderColor: 'border-blue-500/50',
  },
  [Element.EARTH]: {
    icon: TreePine,
    color: 'text-green-400',
    bgGradient: 'from-green-900/30 to-green-950/50',
    borderColor: 'border-green-500/50',
  },
  [Element.WIND]: {
    icon: Wind,
    color: 'text-purple-400',
    bgGradient: 'from-purple-900/30 to-purple-950/50',
    borderColor: 'border-purple-500/50',
  },
  [Element.DRAGON]: {
    icon: Crown,
    color: 'text-amber-400',
    bgGradient: 'from-amber-900/30 to-amber-950/50',
    borderColor: 'border-amber-500/50',
  },
}

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
// SUB COMPONENTS
// ============================================

interface ElementBadgeProps {
  element: Element
  count: number
  isActive: boolean
  onClick: () => void
}

function ElementBadge({ element, count, isActive, onClick }: ElementBadgeProps) {
  const config = ELEMENT_CONFIG[element]
  const Icon = config.icon

  return (
    <button
      onClick={onClick}
      className={cn(
        'relative flex items-center gap-2 px-4 py-2.5 rounded-xl',
        'transition-all duration-300 transform',
        'border-2',
        isActive
          ? `bg-gradient-to-br ${config.bgGradient} ${config.borderColor} scale-105 shadow-lg`
          : 'bg-slate-800/50 border-slate-700/50 hover:border-slate-600 hover:bg-slate-800',
        'focus:outline-none focus:ring-2 focus:ring-vale-400 focus:ring-offset-2 focus:ring-offset-slate-900'
      )}
      data-testid={`filter-${element.toLowerCase()}`}
    >
      <Icon className={cn('w-5 h-5', isActive ? config.color : 'text-slate-400')} />
      <span className={cn('font-medium', isActive ? 'text-slate-100' : 'text-slate-400')}>
        {ELEMENT_NAMES_TW[element]}
      </span>
      <span
        className={cn(
          'ml-1 px-2 py-0.5 text-xs rounded-full',
          isActive ? 'bg-slate-900/50 text-slate-200' : 'bg-slate-700/50 text-slate-500'
        )}
      >
        {count}
      </span>
    </button>
  )
}

interface CardStatsProps {
  validation: ReturnType<typeof validateCardData>
}

function CardStats({ validation }: CardStatsProps) {
  return (
    <div className="grid grid-cols-5 gap-3">
      {Object.entries(validation.elementCounts).map(([element, count]) => {
        const config = ELEMENT_CONFIG[element as Element]
        const Icon = config.icon
        return (
          <div
            key={element}
            className={cn(
              'flex flex-col items-center p-3 rounded-xl',
              'bg-gradient-to-br',
              config.bgGradient,
              'border',
              config.borderColor
            )}
          >
            <Icon className={cn('w-6 h-6 mb-1', config.color)} />
            <span className="text-xs text-slate-400">{ELEMENT_NAMES_TW[element as Element]}</span>
            <span className="text-lg font-bold text-slate-100">{count}</span>
          </div>
        )
      })}
    </div>
  )
}

interface CardDetailPanelProps {
  card: CardTemplate
  onImageClick: () => void
}

function CardDetailPanel({ card, onImageClick }: CardDetailPanelProps) {
  const config = ELEMENT_CONFIG[card.element]
  const cardInstance = createCardInstance(card, 0)

  return (
    <div
      className={cn(
        'p-6 rounded-2xl border-2',
        'bg-gradient-to-br',
        config.bgGradient,
        config.borderColor
      )}
    >
      {/* Header */}
      <div className="flex items-start gap-4 mb-4">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-2xl">{ELEMENT_ICONS[card.element]}</span>
            <h3 className="text-2xl font-bold text-slate-100 font-game">{card.nameTw}</h3>
          </div>
          <p className="text-slate-400">{card.name}</p>
          <p className="text-xs text-slate-500 font-mono mt-1">{card.id}</p>
        </div>
      </div>

      {/* Card Preview with Click to Enlarge */}
      <div className="flex justify-center mb-4">
        <div
          className="cursor-pointer transform transition-transform duration-300 hover:scale-105 relative group"
          onClick={onImageClick}
          data-testid="card-preview-clickable"
        >
          <Card card={cardInstance} index={0} />
          <div className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg">
            <div className="flex items-center gap-2 text-white text-sm bg-slate-900/80 px-3 py-1.5 rounded-full">
              <Search className="w-4 h-4" />
              <span>點擊放大</span>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="bg-slate-900/50 p-3 rounded-xl text-center">
          <div className="text-xs text-slate-500 mb-1">成本</div>
          <div className="text-3xl font-bold text-amber-400">{card.cost}</div>
        </div>
        <div className="bg-slate-900/50 p-3 rounded-xl text-center">
          <div className="text-xs text-slate-500 mb-1">分數</div>
          <div className="text-3xl font-bold text-emerald-400">{card.baseScore}</div>
        </div>
      </div>

      {/* Effect */}
      {card.effectDescriptionTw && (
        <div className="bg-slate-900/50 p-4 rounded-xl mb-4">
          <div className="flex items-center gap-2 mb-2">
            <Sparkles className="w-4 h-4 text-vale-400" />
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              效果
            </span>
          </div>
          <p className="text-slate-200 leading-relaxed">{card.effectDescriptionTw}</p>
          <p className="text-sm text-slate-500 mt-2">{card.effectDescription}</p>
        </div>
      )}

      {/* Flavor Text */}
      {card.flavorTextTw && (
        <div className="border-l-4 border-slate-600/50 pl-4">
          <p className="text-sm italic text-slate-400">{card.flavorTextTw}</p>
        </div>
      )}
    </div>
  )
}

// ============================================
// MAIN COMPONENT
// ============================================

export function CardGallery() {
  const navigate = useNavigate()
  const [viewMode, setViewMode] = useState<ViewMode>('grid')
  const [elementFilter, setElementFilter] = useState<FilterElement>('all')
  const [selectedCard, setSelectedCard] = useState<CardTemplate | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [showImagePreview, setShowImagePreview] = useState(false)

  // Validate card data on mount
  const validation = useMemo(() => validateCardData(), [])

  // Get filtered cards
  const filteredCards = useMemo(() => {
    let cards = getCardsByFilter(elementFilter)

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      cards = cards.filter(
        (card) =>
          card.name.toLowerCase().includes(query) ||
          card.nameTw.includes(query) ||
          card.id.toLowerCase().includes(query)
      )
    }

    return cards
  }, [elementFilter, searchQuery])

  // Convert templates to instances for Card component
  const cardInstances = useMemo(() => {
    return filteredCards.map((template) => createCardInstance(template, 0))
  }, [filteredCards])

  // Handle image click for preview
  const handleImagePreview = () => {
    if (selectedCard) {
      setShowImagePreview(true)
    }
  }

  return (
    <div
      className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-850 to-slate-900"
      data-testid="card-gallery-page"
    >
      {/* Decorative background elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-vale-500/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-purple-500/5 rounded-full blur-3xl" />
      </div>

      {/* Header */}
      <header className="sticky top-0 z-20 bg-slate-900/90 backdrop-blur-md border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between gap-4">
            {/* Left: Back button and title */}
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate('/')}
                leftIcon={<ArrowLeft className="h-4 w-4" />}
                data-testid="back-btn"
              >
                返回
              </Button>
              <div className="hidden sm:block">
                <h1 className="text-xl font-bold text-slate-100 font-game flex items-center gap-2">
                  <Shield className="w-5 h-5 text-vale-400" />
                  卡片圖鑑
                </h1>
                <p className="text-xs text-slate-500">
                  {validation.totalCards} 張卡片 |{' '}
                  {validation.isValid ? (
                    <span className="text-emerald-400">有效</span>
                  ) : (
                    <span className="text-red-400">無效</span>
                  )}
                </p>
              </div>
            </div>

            {/* Center: Search */}
            <div className="flex-1 max-w-md">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                  type="text"
                  placeholder="搜尋卡片..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className={cn(
                    'w-full pl-10 pr-10 py-2 rounded-xl',
                    'bg-slate-800/50 border border-slate-700',
                    'text-slate-200 placeholder-slate-500',
                    'focus:outline-none focus:border-vale-500 focus:ring-2 focus:ring-vale-500/20',
                    'transition-all duration-200'
                  )}
                  data-testid="search-input"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
                    data-testid="clear-search-btn"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>

            {/* Right: View toggle */}
            <div className="flex items-center gap-2">
              <div className="flex bg-slate-800 rounded-lg p-1">
                <button
                  onClick={() => setViewMode('grid')}
                  className={cn(
                    'p-2 rounded-md transition-colors',
                    viewMode === 'grid' ? 'bg-vale-600 text-white' : 'text-slate-400 hover:text-slate-200'
                  )}
                  data-testid="view-grid-btn"
                >
                  <Grid className="h-4 w-4" />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={cn(
                    'p-2 rounded-md transition-colors',
                    viewMode === 'list' ? 'bg-vale-600 text-white' : 'text-slate-400 hover:text-slate-200'
                  )}
                  data-testid="view-list-btn"
                >
                  <List className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="relative z-10 max-w-7xl mx-auto px-4 py-6">
        {/* Element Filters */}
        <div className="mb-6 flex flex-wrap gap-2 justify-center">
          <button
            onClick={() => setElementFilter('all')}
            className={cn(
              'flex items-center gap-2 px-4 py-2.5 rounded-xl',
              'transition-all duration-300 transform',
              'border-2',
              elementFilter === 'all'
                ? 'bg-gradient-to-br from-vale-900/50 to-vale-950/70 border-vale-500/50 scale-105 shadow-lg'
                : 'bg-slate-800/50 border-slate-700/50 hover:border-slate-600 hover:bg-slate-800',
              'focus:outline-none focus:ring-2 focus:ring-vale-400'
            )}
            data-testid="filter-all"
          >
            <Sparkles
              className={cn('w-5 h-5', elementFilter === 'all' ? 'text-vale-400' : 'text-slate-400')}
            />
            <span
              className={cn('font-medium', elementFilter === 'all' ? 'text-slate-100' : 'text-slate-400')}
            >
              全部
            </span>
            <span
              className={cn(
                'ml-1 px-2 py-0.5 text-xs rounded-full',
                elementFilter === 'all' ? 'bg-slate-900/50 text-slate-200' : 'bg-slate-700/50 text-slate-500'
              )}
            >
              {BASE_CARDS.length}
            </span>
          </button>
          {Object.values(Element).map((element) => (
            <ElementBadge
              key={element}
              element={element}
              count={getCardsByFilter(element).length}
              isActive={elementFilter === element}
              onClick={() => setElementFilter(element)}
            />
          ))}
        </div>

        {/* Stats Overview (Collapsible on mobile) */}
        <details className="mb-6 group">
          <summary className="flex items-center gap-2 cursor-pointer text-slate-400 hover:text-slate-200 transition-colors">
            <span className="text-sm font-medium">卡片分布</span>
            <span className="text-xs group-open:rotate-90 transition-transform">&#9654;</span>
          </summary>
          <div className="mt-4">
            <CardStats validation={validation} />
          </div>
        </details>

        {/* Main Content Area - Two Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Card Grid/List */}
          <div className="lg:col-span-2">
            {filteredCards.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-slate-500">
                <Search className="w-12 h-12 mb-4 opacity-50" />
                <p>找不到卡片</p>
                {searchQuery && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSearchQuery('')}
                    className="mt-2"
                  >
                    清除搜尋
                  </Button>
                )}
              </div>
            ) : viewMode === 'grid' ? (
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
                {cardInstances.map((card, index) => (
                  <div
                    key={card.instanceId}
                    className={cn(
                      'flex flex-col items-center cursor-pointer',
                      'transform transition-all duration-200',
                      'hover:scale-105',
                      selectedCard?.id === card.cardId && 'ring-2 ring-vale-400 rounded-lg'
                    )}
                    onClick={() => {
                      const template = filteredCards.find((t) => t.id === card.cardId)
                      setSelectedCard(template || null)
                    }}
                    data-testid={`card-grid-item-${index}`}
                  >
                    <Card card={card} index={index} isSelected={selectedCard?.id === card.cardId} />
                    <span className="mt-1 text-xs text-slate-500 truncate max-w-full">
                      {card.nameTw}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="space-y-2">
                {filteredCards.map((template, index) => {
                  const config = ELEMENT_CONFIG[template.element]
                  const Icon = config.icon
                  return (
                    <div
                      key={template.id}
                      onClick={() => setSelectedCard(template)}
                      className={cn(
                        'flex items-center gap-4 p-3 rounded-xl cursor-pointer',
                        'bg-slate-800/50 border border-slate-700/50',
                        'hover:border-slate-600 hover:bg-slate-800',
                        'transition-all duration-200',
                        selectedCard?.id === template.id && 'border-vale-500 bg-slate-800'
                      )}
                      data-testid={`card-list-item-${index}`}
                    >
                      <span className="w-12 text-center text-xs text-slate-500 font-mono">
                        {template.id}
                      </span>
                      <Icon className={cn('w-5 h-5', config.color)} />
                      <span className="w-12 text-center font-bold text-amber-400">{template.cost}</span>
                      <span className="flex-1 text-slate-200 font-medium">{template.nameTw}</span>
                      <span className="hidden sm:block flex-1 text-slate-500 text-sm">{template.name}</span>
                      <span className="w-12 text-center text-lg font-bold text-emerald-400">
                        {template.baseScore}
                      </span>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {/* Card Detail Panel */}
          <div className="lg:col-span-1">
            {selectedCard ? (
              <div className="sticky top-24">
                <CardDetailPanel card={selectedCard} onImageClick={handleImagePreview} />
              </div>
            ) : (
              <div className="sticky top-24 p-8 rounded-2xl bg-slate-800/30 border border-slate-700/50 text-center">
                <div className="text-6xl mb-4 opacity-30">🃏</div>
                <p className="text-slate-500">選擇卡片以查看詳情</p>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Image Preview Modal */}
      {selectedCard && (
        <ImagePreviewModal
          src={getCardImagePath(selectedCard.id)}
          alt={selectedCard.nameTw}
          title={selectedCard.nameTw}
          subtitle={selectedCard.name}
          isOpen={showImagePreview}
          onClose={() => setShowImagePreview(false)}
        >
          <div className="flex items-center justify-center gap-6 text-slate-300">
            <div className="flex items-center gap-2">
              <span className="text-sm text-slate-500">成本：</span>
              <span className="text-xl font-bold text-amber-400">{selectedCard.cost}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-slate-500">分數：</span>
              <span className="text-xl font-bold text-emerald-400">{selectedCard.baseScore}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-2xl">{ELEMENT_ICONS[selectedCard.element]}</span>
              <span className="text-slate-300">{ELEMENT_NAMES_TW[selectedCard.element]}</span>
            </div>
          </div>
        </ImagePreviewModal>
      )}
    </div>
  )
}

export default CardGallery
