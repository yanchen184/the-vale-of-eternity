/**
 * Card Gallery Page - Display all cards and artifacts
 * Supports Base Game (70 cards), DLC (28 cards), and Artifacts (11)
 * @version 4.0.1 - Increased card grid gap from 3 to 6 to prevent overlap
 */
console.log('[pages/CardGallery.tsx] v4.0.1 loaded')

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
  Gem,
  Star,
  ZoomIn,
  Zap,
  XCircle,
  Infinity,
  Package,
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
import {
  ALL_DLC_CARDS,
  DLC_FIRE_CARDS,
  DLC_WATER_CARDS,
  DLC_EARTH_CARDS,
  DLC_WIND_CARDS,
  DLC_DRAGON_CARDS,
} from '@/data/dlc-cards'
import {
  ALL_ARTIFACTS,
  CORE_ARTIFACTS,
  RANDOM_ARTIFACTS,
  SEVEN_LEAGUE_BOOTS,
  GOLDEN_FLEECE,
} from '@/data/artifacts'
import { Element, ELEMENT_ICONS, ELEMENT_NAMES_TW } from '@/types/cards'
import type { CardTemplate } from '@/types/cards'
import type { Artifact } from '@/types/artifacts'
import { ArtifactType, ArtifactCategory } from '@/types/artifacts'
import { getCardImagePath } from '@/lib/card-images'
import { cn } from '@/lib/utils'

// ============================================
// TYPES
// ============================================

type ViewMode = 'grid' | 'list'
type FilterElement = 'all' | Element
type GalleryTab = 'base' | 'dlc' | 'artifacts'
type ArtifactFilter = 'all' | 'core' | 'random' | 'player_based'

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

const ARTIFACT_TYPE_CONFIG: Record<
  ArtifactType,
  { icon: typeof Zap; label: string; color: string; bgColor: string }
> = {
  [ArtifactType.INSTANT]: {
    icon: Zap,
    label: '立即',
    color: 'text-yellow-400',
    bgColor: 'bg-yellow-500/20',
  },
  [ArtifactType.ACTION]: {
    icon: XCircle,
    label: '行動',
    color: 'text-blue-400',
    bgColor: 'bg-blue-500/20',
  },
  [ArtifactType.PERMANENT]: {
    icon: Infinity,
    label: '永久',
    color: 'text-purple-400',
    bgColor: 'bg-purple-500/20',
  },
}

const ARTIFACT_CATEGORY_LABELS: Record<ArtifactCategory, string> = {
  [ArtifactCategory.CORE]: '核心',
  [ArtifactCategory.THREE_PLAYER]: '3人',
  [ArtifactCategory.FOUR_PLAYER]: '4人',
  [ArtifactCategory.RANDOM]: '隨機',
}

// ============================================
// HELPER FUNCTIONS
// ============================================

function getCardsByFilter(filter: FilterElement, isDlc: boolean): readonly CardTemplate[] {
  if (isDlc) {
    if (filter === 'all') return ALL_DLC_CARDS
    switch (filter) {
      case Element.FIRE:
        return DLC_FIRE_CARDS
      case Element.WATER:
        return DLC_WATER_CARDS
      case Element.EARTH:
        return DLC_EARTH_CARDS
      case Element.WIND:
        return DLC_WIND_CARDS
      case Element.DRAGON:
        return DLC_DRAGON_CARDS
      default:
        return ALL_DLC_CARDS
    }
  }

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

function getArtifactsByFilter(filter: ArtifactFilter): Artifact[] {
  switch (filter) {
    case 'core':
      return CORE_ARTIFACTS
    case 'random':
      return RANDOM_ARTIFACTS
    case 'player_based':
      return [SEVEN_LEAGUE_BOOTS, GOLDEN_FLEECE]
    default:
      return ALL_ARTIFACTS
  }
}

// ============================================
// SUB COMPONENTS
// ============================================

interface TabButtonProps {
  isActive: boolean
  onClick: () => void
  color: string
  children: React.ReactNode
  count: number
  testId: string
}

function TabButton({ isActive, onClick, color, children, count, testId }: TabButtonProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'flex items-center gap-2 px-4 py-2.5 rounded-xl',
        'transition-all duration-300 transform',
        'border-2 font-medium',
        isActive
          ? `${color} border-current scale-105 shadow-lg`
          : 'bg-slate-800/50 border-slate-700/50 text-slate-400 hover:border-slate-600 hover:bg-slate-800',
        'focus:outline-none focus:ring-2 focus:ring-vale-400'
      )}
      data-testid={testId}
    >
      {children}
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

interface ArtifactFilterBadgeProps {
  filter: ArtifactFilter
  label: string
  count: number
  isActive: boolean
  onClick: () => void
}

function ArtifactFilterBadge({ filter, label, count, isActive, onClick }: ArtifactFilterBadgeProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'flex items-center gap-2 px-4 py-2.5 rounded-xl',
        'transition-all duration-300 transform',
        'border-2',
        isActive
          ? 'bg-gradient-to-br from-purple-900/50 to-purple-950/70 border-purple-500/50 scale-105 shadow-lg'
          : 'bg-slate-800/50 border-slate-700/50 hover:border-slate-600 hover:bg-slate-800',
        'focus:outline-none focus:ring-2 focus:ring-purple-400'
      )}
      data-testid={`filter-artifact-${filter}`}
    >
      <span className={cn('font-medium', isActive ? 'text-slate-100' : 'text-slate-400')}>
        {label}
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
  activeTab: GalleryTab
}

function CardStats({ validation, activeTab }: CardStatsProps) {
  return (
    <div className="space-y-4">
      {/* Summary Stats */}
      <div className="grid grid-cols-3 gap-3">
        <div
          className={cn(
            'flex flex-col items-center p-3 rounded-xl border',
            'bg-gradient-to-br from-blue-900/30 to-blue-950/50 border-blue-500/30',
            activeTab === 'base' && 'ring-2 ring-blue-500/50'
          )}
        >
          <Shield className="w-6 h-6 mb-1 text-blue-400" />
          <span className="text-xs text-slate-400">基礎版</span>
          <span className="text-lg font-bold text-slate-100">70</span>
        </div>
        <div
          className={cn(
            'flex flex-col items-center p-3 rounded-xl border',
            'bg-gradient-to-br from-amber-900/30 to-amber-950/50 border-amber-500/30',
            activeTab === 'dlc' && 'ring-2 ring-amber-500/50'
          )}
        >
          <Package className="w-6 h-6 mb-1 text-amber-400" />
          <span className="text-xs text-slate-400">擴充版</span>
          <span className="text-lg font-bold text-slate-100">28</span>
        </div>
        <div
          className={cn(
            'flex flex-col items-center p-3 rounded-xl border',
            'bg-gradient-to-br from-purple-900/30 to-purple-950/50 border-purple-500/30',
            activeTab === 'artifacts' && 'ring-2 ring-purple-500/50'
          )}
        >
          <Sparkles className="w-6 h-6 mb-1 text-purple-400" />
          <span className="text-xs text-slate-400">神器</span>
          <span className="text-lg font-bold text-slate-100">11</span>
        </div>
      </div>

      {/* Element Distribution (only for cards) */}
      {activeTab !== 'artifacts' && (
        <div className="grid grid-cols-5 gap-3">
          {Object.entries(validation.elementCounts).map(([element, count]) => {
            const config = ELEMENT_CONFIG[element as Element]
            const Icon = config.icon
            // For DLC, calculate manually
            const dlcCount =
              activeTab === 'dlc'
                ? getCardsByFilter(element as Element, true).length
                : count
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
                <span className="text-xs text-slate-400">
                  {ELEMENT_NAMES_TW[element as Element]}
                </span>
                <span className="text-lg font-bold text-slate-100">
                  {activeTab === 'dlc' ? dlcCount : count}
                </span>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

interface CardDetailPanelProps {
  card: CardTemplate
  onImageClick: () => void
  isDlc?: boolean
}

function CardDetailPanel({ card, onImageClick, isDlc = false }: CardDetailPanelProps) {
  const config = ELEMENT_CONFIG[card.element]
  const Icon = config.icon
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
      {/* Header with Element Icon */}
      <div className="flex items-start gap-4 mb-5">
        <div className="flex-shrink-0 p-3 rounded-xl bg-slate-900/60 border border-slate-600/30">
          <Icon className={cn('w-10 h-10', config.color)} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="text-2xl font-bold text-slate-100 font-game truncate">{card.nameTw}</h3>
            {isDlc && (
              <span className="px-2 py-0.5 text-xs font-bold rounded bg-amber-500 text-slate-900">
                DLC
              </span>
            )}
          </div>
          <p className="text-slate-400 text-sm">{card.name}</p>
          <p className="text-xs text-slate-500 font-mono mt-1">{card.id}</p>
        </div>
      </div>

      {/* Card Preview with Click to Enlarge */}
      <div className="flex justify-center mb-5">
        <div
          className="cursor-pointer transform transition-all duration-300 hover:scale-105 hover:shadow-2xl relative group"
          onClick={onImageClick}
          data-testid="card-preview-clickable"
        >
          {/* Normal size card display with compact mode */}
          <Card card={cardInstance} index={0} compact />
          <div className="absolute inset-0 flex items-center justify-center bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg">
            <div className="flex items-center gap-2 text-white text-sm bg-slate-900/90 px-4 py-2 rounded-full border border-slate-600/50 shadow-lg">
              <ZoomIn className="w-5 h-5" />
              <span className="font-medium">點擊放大查看</span>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Grid - More Prominent */}
      <div className="grid grid-cols-2 gap-4 mb-5">
        <div className="bg-slate-900/60 p-4 rounded-xl text-center border border-amber-500/20">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Gem className="w-5 h-5 text-amber-400" />
            <span className="text-sm font-medium text-amber-300">成本</span>
          </div>
          <div className="text-4xl font-bold text-amber-400">{card.cost}</div>
        </div>
        <div className="bg-slate-900/60 p-4 rounded-xl text-center border border-emerald-500/20">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Star className="w-5 h-5 text-emerald-400" />
            <span className="text-sm font-medium text-emerald-300">分數</span>
          </div>
          <div className="text-4xl font-bold text-emerald-400">{card.baseScore}</div>
        </div>
      </div>

      {/* Element Badge */}
      <div className="flex justify-center mb-5">
        <div
          className={cn(
            'flex items-center gap-3 px-5 py-2.5 rounded-full',
            'bg-slate-900/60 border',
            config.borderColor
          )}
        >
          <Icon className={cn('w-6 h-6', config.color)} />
          <span className={cn('text-lg font-semibold', config.color)}>
            {ELEMENT_NAMES_TW[card.element]}元素
          </span>
        </div>
      </div>

      {/* Effect */}
      {card.effectDescriptionTw && (
        <div className="bg-slate-900/60 p-4 rounded-xl mb-4 border border-slate-600/30">
          <div className="flex items-center gap-2 mb-3">
            <Sparkles className="w-5 h-5 text-vale-400" />
            <span className="text-sm font-semibold text-slate-300 uppercase tracking-wider">
              卡片效果
            </span>
          </div>
          <p className="text-slate-200 leading-relaxed text-base">{card.effectDescriptionTw}</p>
          <p className="text-sm text-slate-500 mt-3 italic">{card.effectDescription}</p>
        </div>
      )}

      {/* Flavor Text */}
      {card.flavorTextTw && (
        <div className="border-l-4 border-slate-500/40 pl-4 py-2 bg-slate-900/30 rounded-r-lg">
          <p className="text-sm italic text-slate-400 leading-relaxed">{card.flavorTextTw}</p>
        </div>
      )}
    </div>
  )
}

interface ArtifactDetailPanelProps {
  artifact: Artifact
  onImageClick: () => void
}

function ArtifactDetailPanel({ artifact, onImageClick }: ArtifactDetailPanelProps) {
  const typeConfig = ARTIFACT_TYPE_CONFIG[artifact.type]
  const TypeIcon = typeConfig.icon

  return (
    <div
      className={cn(
        'p-6 rounded-2xl border-2',
        'bg-gradient-to-br from-purple-900/30 to-purple-950/50',
        'border-purple-500/50'
      )}
    >
      {/* Header with Type Icon */}
      <div className="flex items-start gap-4 mb-5">
        <div
          className={cn(
            'flex-shrink-0 p-3 rounded-xl border border-slate-600/30',
            typeConfig.bgColor
          )}
        >
          <TypeIcon className={cn('w-10 h-10', typeConfig.color)} />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-2xl font-bold text-slate-100 font-game truncate">{artifact.nameTw}</h3>
          <p className="text-slate-400 text-sm">{artifact.name}</p>
          <p className="text-xs text-slate-500 font-mono mt-1">{artifact.id}</p>
        </div>
      </div>

      {/* Artifact Image Preview */}
      <div className="flex justify-center mb-5">
        <div
          className="cursor-pointer transform transition-all duration-300 hover:scale-105 hover:shadow-2xl relative group"
          onClick={onImageClick}
          data-testid="artifact-preview-clickable"
        >
          <div className="relative w-48 h-48 rounded-xl overflow-hidden border-4 border-purple-500/30 bg-slate-900/50">
            <img
              src={artifact.image}
              alt={artifact.nameTw}
              className="w-full h-full object-cover"
              onError={(e) => {
                const target = e.target as HTMLImageElement
                target.style.display = 'none'
              }}
            />
          </div>
          <div className="absolute inset-0 flex items-center justify-center bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity rounded-xl">
            <div className="flex items-center gap-2 text-white text-sm bg-slate-900/90 px-4 py-2 rounded-full border border-slate-600/50 shadow-lg">
              <ZoomIn className="w-5 h-5" />
              <span className="font-medium">點擊放大查看</span>
            </div>
          </div>
        </div>
      </div>

      {/* Type and Category Badges */}
      <div className="flex flex-wrap justify-center gap-3 mb-5">
        {/* Type Badge */}
        <div
          className={cn(
            'flex items-center gap-2 px-4 py-2 rounded-full',
            'bg-slate-900/60 border border-slate-600/30',
            typeConfig.bgColor
          )}
        >
          <TypeIcon className={cn('w-5 h-5', typeConfig.color)} />
          <span className={cn('font-semibold', typeConfig.color)}>{typeConfig.label}</span>
        </div>

        {/* Category Badge */}
        <div
          className={cn(
            'flex items-center gap-2 px-4 py-2 rounded-full',
            'bg-slate-900/60 border border-slate-600/30'
          )}
        >
          <span className="text-slate-300 font-medium">
            {ARTIFACT_CATEGORY_LABELS[artifact.category]}神器
          </span>
        </div>

        {/* Implementation Status */}
        {!artifact.implemented && (
          <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-orange-600 text-white font-medium">
            尚未實作
          </div>
        )}
      </div>

      {/* Effect Description */}
      <div className="bg-slate-900/60 p-4 rounded-xl mb-4 border border-slate-600/30">
        <div className="flex items-center gap-2 mb-3">
          <Sparkles className="w-5 h-5 text-purple-400" />
          <span className="text-sm font-semibold text-slate-300 uppercase tracking-wider">
            神器效果
          </span>
        </div>
        <p className="text-slate-200 leading-relaxed text-base">{artifact.descriptionTw}</p>
        <p className="text-sm text-slate-500 mt-3 italic">{artifact.description}</p>
      </div>

      {/* Implementation Notes */}
      {artifact.effectDetails?.implementationNotes && (
        <div className="border-l-4 border-purple-500/40 pl-4 py-2 bg-slate-900/30 rounded-r-lg">
          <p className="text-xs text-slate-500 font-mono">
            {artifact.effectDetails.implementationNotes}
          </p>
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
  const [activeTab, setActiveTab] = useState<GalleryTab>('base')
  const [viewMode, setViewMode] = useState<ViewMode>('grid')
  const [elementFilter, setElementFilter] = useState<FilterElement>('all')
  const [artifactFilter, setArtifactFilter] = useState<ArtifactFilter>('all')
  const [selectedCard, setSelectedCard] = useState<CardTemplate | null>(null)
  const [selectedArtifact, setSelectedArtifact] = useState<Artifact | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [showImagePreview, setShowImagePreview] = useState(false)

  // Validate card data on mount
  const validation = useMemo(() => validateCardData(), [])

  // Get filtered cards based on active tab
  const filteredCards = useMemo(() => {
    if (activeTab === 'artifacts') return []

    const isDlc = activeTab === 'dlc'
    let cards = getCardsByFilter(elementFilter, isDlc)

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
  }, [activeTab, elementFilter, searchQuery])

  // Get filtered artifacts
  const filteredArtifacts = useMemo(() => {
    if (activeTab !== 'artifacts') return []

    let artifacts = getArtifactsByFilter(artifactFilter)

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      artifacts = artifacts.filter(
        (artifact) =>
          artifact.name.toLowerCase().includes(query) ||
          artifact.nameTw.includes(query) ||
          artifact.id.toLowerCase().includes(query)
      )
    }

    return artifacts
  }, [activeTab, artifactFilter, searchQuery])

  // Convert templates to instances for Card component
  const cardInstances = useMemo(() => {
    return filteredCards.map((template) => createCardInstance(template, 0))
  }, [filteredCards])

  // Handle image click for preview
  const handleImagePreview = () => {
    if (selectedCard || selectedArtifact) {
      setShowImagePreview(true)
    }
  }

  // Handle tab change
  const handleTabChange = (tab: GalleryTab) => {
    setActiveTab(tab)
    setSelectedCard(null)
    setSelectedArtifact(null)
    setSearchQuery('')
    setElementFilter('all')
    setArtifactFilter('all')
  }

  // Get current cards based on active tab for element filter counts
  const getCurrentCards = (element: Element) => {
    return getCardsByFilter(element, activeTab === 'dlc')
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
                  卡片與神器圖鑑
                </h1>
                <p className="text-xs text-slate-500">
                  {BASE_CARDS.length + ALL_DLC_CARDS.length} 張卡片 | {ALL_ARTIFACTS.length} 個神器
                </p>
              </div>
            </div>

            {/* Center: Search */}
            <div className="flex-1 max-w-md">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                  type="text"
                  placeholder={
                    activeTab === 'artifacts' ? '搜尋神器...' : '搜尋卡片...'
                  }
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
        {/* Tab Navigation */}
        <div className="mb-6 flex flex-wrap gap-3 justify-center">
          <TabButton
            isActive={activeTab === 'base'}
            onClick={() => handleTabChange('base')}
            color="bg-blue-600 text-white"
            count={BASE_CARDS.length}
            testId="tab-base"
          >
            <Shield className="w-5 h-5" />
            <span>卡片 (基礎版)</span>
          </TabButton>
          <TabButton
            isActive={activeTab === 'dlc'}
            onClick={() => handleTabChange('dlc')}
            color="bg-amber-600 text-white"
            count={ALL_DLC_CARDS.length}
            testId="tab-dlc"
          >
            <Package className="w-5 h-5" />
            <span>卡片 (擴充版)</span>
          </TabButton>
          <TabButton
            isActive={activeTab === 'artifacts'}
            onClick={() => handleTabChange('artifacts')}
            color="bg-purple-600 text-white"
            count={ALL_ARTIFACTS.length}
            testId="tab-artifacts"
          >
            <Sparkles className="w-5 h-5" />
            <span>神器</span>
          </TabButton>
        </div>

        {/* Filters - Element for cards, Category for artifacts */}
        {activeTab !== 'artifacts' ? (
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
                {activeTab === 'dlc' ? ALL_DLC_CARDS.length : BASE_CARDS.length}
              </span>
            </button>
            {Object.values(Element).map((element) => (
              <ElementBadge
                key={element}
                element={element}
                count={getCurrentCards(element).length}
                isActive={elementFilter === element}
                onClick={() => setElementFilter(element)}
              />
            ))}
          </div>
        ) : (
          <div className="mb-6 flex flex-wrap gap-2 justify-center">
            <ArtifactFilterBadge
              filter="all"
              label="全部"
              count={ALL_ARTIFACTS.length}
              isActive={artifactFilter === 'all'}
              onClick={() => setArtifactFilter('all')}
            />
            <ArtifactFilterBadge
              filter="core"
              label="核心神器"
              count={CORE_ARTIFACTS.length}
              isActive={artifactFilter === 'core'}
              onClick={() => setArtifactFilter('core')}
            />
            <ArtifactFilterBadge
              filter="random"
              label="隨機神器"
              count={RANDOM_ARTIFACTS.length}
              isActive={artifactFilter === 'random'}
              onClick={() => setArtifactFilter('random')}
            />
            <ArtifactFilterBadge
              filter="player_based"
              label="3/4人神器"
              count={2}
              isActive={artifactFilter === 'player_based'}
              onClick={() => setArtifactFilter('player_based')}
            />
          </div>
        )}

        {/* Stats Overview (Collapsible on mobile) */}
        <details className="mb-6 group">
          <summary className="flex items-center gap-2 cursor-pointer text-slate-400 hover:text-slate-200 transition-colors">
            <span className="text-sm font-medium">
              {activeTab === 'artifacts' ? '神器統計' : '卡片分布'}
            </span>
            <span className="text-xs group-open:rotate-90 transition-transform">&#9654;</span>
          </summary>
          <div className="mt-4">
            <CardStats validation={validation} activeTab={activeTab} />
          </div>
        </details>

        {/* Main Content Area - Two Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Card/Artifact Grid/List */}
          <div className="lg:col-span-2">
            {activeTab === 'artifacts' ? (
              // Artifacts Display
              filteredArtifacts.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-slate-500">
                  <Search className="w-12 h-12 mb-4 opacity-50" />
                  <p>找不到神器</p>
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
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                  {filteredArtifacts.map((artifact, index) => {
                    const typeConfig = ARTIFACT_TYPE_CONFIG[artifact.type]
                    return (
                      <div
                        key={artifact.id}
                        className={cn(
                          'flex flex-col items-center cursor-pointer p-3 rounded-xl',
                          'bg-slate-800/30 border border-slate-700/50',
                          'transform transition-all duration-200',
                          'hover:scale-105 hover:bg-slate-800/50',
                          selectedArtifact?.id === artifact.id && 'ring-2 ring-purple-400 bg-slate-800/50'
                        )}
                        onClick={() => {
                          setSelectedArtifact(artifact)
                          setSelectedCard(null)
                        }}
                        data-testid={`artifact-grid-item-${index}`}
                      >
                        <div className="relative w-full aspect-square rounded-lg overflow-hidden mb-2 bg-slate-900/50">
                          <img
                            src={artifact.image}
                            alt={artifact.nameTw}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              const target = e.target as HTMLImageElement
                              target.style.display = 'none'
                            }}
                          />
                          {/* Type Badge */}
                          <div
                            className={cn(
                              'absolute top-1 right-1 p-1 rounded',
                              typeConfig.bgColor
                            )}
                          >
                            <typeConfig.icon className={cn('w-4 h-4', typeConfig.color)} />
                          </div>
                          {/* Not Implemented Badge */}
                          {!artifact.implemented && (
                            <div className="absolute bottom-1 left-1 px-1.5 py-0.5 text-xs font-bold rounded bg-orange-600 text-white">
                              尚未實作
                            </div>
                          )}
                        </div>
                        <span className="text-sm text-slate-200 text-center truncate max-w-full">
                          {artifact.nameTw}
                        </span>
                        <span className="text-xs text-slate-500 mt-0.5">
                          {ARTIFACT_CATEGORY_LABELS[artifact.category]}
                        </span>
                      </div>
                    )
                  })}
                </div>
              ) : (
                <div className="space-y-2">
                  {filteredArtifacts.map((artifact, index) => {
                    const typeConfig = ARTIFACT_TYPE_CONFIG[artifact.type]
                    const TypeIcon = typeConfig.icon
                    return (
                      <div
                        key={artifact.id}
                        onClick={() => {
                          setSelectedArtifact(artifact)
                          setSelectedCard(null)
                        }}
                        className={cn(
                          'flex items-center gap-4 p-3 rounded-xl cursor-pointer',
                          'bg-slate-800/50 border border-slate-700/50',
                          'hover:border-slate-600 hover:bg-slate-800',
                          'transition-all duration-200',
                          selectedArtifact?.id === artifact.id && 'border-purple-500 bg-slate-800'
                        )}
                        data-testid={`artifact-list-item-${index}`}
                      >
                        <div className={cn('p-2 rounded-lg', typeConfig.bgColor)}>
                          <TypeIcon className={cn('w-5 h-5', typeConfig.color)} />
                        </div>
                        <span className="flex-1 text-slate-200 font-medium">{artifact.nameTw}</span>
                        <span className="hidden sm:block flex-1 text-slate-500 text-sm">
                          {artifact.name}
                        </span>
                        <span className="text-xs text-slate-400 px-2 py-1 bg-slate-700/50 rounded">
                          {ARTIFACT_CATEGORY_LABELS[artifact.category]}
                        </span>
                        {!artifact.implemented && (
                          <span className="text-xs font-bold px-2 py-1 bg-orange-600 text-white rounded">
                            尚未實作
                          </span>
                        )}
                      </div>
                    )
                  })}
                </div>
              )
            ) : (
              // Cards Display
              filteredCards.length === 0 ? (
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
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-6">
                  {cardInstances.map((card, index) => (
                    <div
                      key={card.instanceId}
                      className={cn(
                        'flex flex-col items-center cursor-pointer relative',
                        'transform transition-all duration-200',
                        'hover:scale-105',
                        selectedCard?.id === card.cardId && 'ring-2 ring-vale-400 rounded-lg'
                      )}
                      onClick={() => {
                        const template = filteredCards.find((t) => t.id === card.cardId)
                        setSelectedCard(template || null)
                        setSelectedArtifact(null)
                      }}
                      data-testid={`card-grid-item-${index}`}
                    >
                      {/* DLC Badge */}
                      {activeTab === 'dlc' && (
                        <div className="absolute top-1 right-1 z-10 px-1.5 py-0.5 text-xs font-bold rounded bg-amber-500 text-slate-900">
                          DLC
                        </div>
                      )}
                      <Card card={card} index={index} compact isSelected={selectedCard?.id === card.cardId} />
                      <span className="mt-1 text-xs text-slate-500 truncate max-w-full text-center px-1">
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
                        onClick={() => {
                          setSelectedCard(template)
                          setSelectedArtifact(null)
                        }}
                        className={cn(
                          'flex items-center gap-4 p-3 rounded-xl cursor-pointer',
                          'bg-slate-800/50 border border-slate-700/50',
                          'hover:border-slate-600 hover:bg-slate-800',
                          'transition-all duration-200',
                          selectedCard?.id === template.id && 'border-vale-500 bg-slate-800'
                        )}
                        data-testid={`card-list-item-${index}`}
                      >
                        {activeTab === 'dlc' && (
                          <span className="px-1.5 py-0.5 text-xs font-bold rounded bg-amber-500 text-slate-900">
                            DLC
                          </span>
                        )}
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
              )
            )}
          </div>

          {/* Detail Panel */}
          <div className="lg:col-span-1">
            {selectedCard ? (
              <div className="sticky top-24">
                <CardDetailPanel
                  card={selectedCard}
                  onImageClick={handleImagePreview}
                  isDlc={activeTab === 'dlc'}
                />
              </div>
            ) : selectedArtifact ? (
              <div className="sticky top-24">
                <ArtifactDetailPanel artifact={selectedArtifact} onImageClick={handleImagePreview} />
              </div>
            ) : (
              <div className="sticky top-24 p-8 rounded-2xl bg-slate-800/30 border border-slate-700/50 text-center">
                <div className="text-6xl mb-4 opacity-30">
                  {activeTab === 'artifacts' ? '🏺' : '🃏'}
                </div>
                <p className="text-slate-500">
                  {activeTab === 'artifacts' ? '選擇神器以查看詳情' : '選擇卡片以查看詳情'}
                </p>
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

      {selectedArtifact && (
        <ImagePreviewModal
          src={selectedArtifact.image}
          alt={selectedArtifact.nameTw}
          title={selectedArtifact.nameTw}
          subtitle={selectedArtifact.name}
          isOpen={showImagePreview}
          onClose={() => setShowImagePreview(false)}
        >
          <div className="flex items-center justify-center gap-6 text-slate-300">
            <div className="flex items-center gap-2">
              {(() => {
                const typeConfig = ARTIFACT_TYPE_CONFIG[selectedArtifact.type]
                const TypeIcon = typeConfig.icon
                return (
                  <>
                    <TypeIcon className={cn('w-5 h-5', typeConfig.color)} />
                    <span className={typeConfig.color}>{typeConfig.label}</span>
                  </>
                )
              })()}
            </div>
            <div className="flex items-center gap-2">
              <span className="text-slate-400">
                {ARTIFACT_CATEGORY_LABELS[selectedArtifact.category]}神器
              </span>
            </div>
            {!selectedArtifact.implemented && (
              <span className="px-2 py-1 text-sm font-bold bg-orange-600 text-white rounded">
                尚未實作
              </span>
            )}
          </div>
        </ImagePreviewModal>
      )}
    </div>
  )
}

export default CardGallery
