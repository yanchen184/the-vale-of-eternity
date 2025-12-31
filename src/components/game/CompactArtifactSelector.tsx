/**
 * CompactArtifactSelector Component
 * Compact version of artifact selector for inline display with card selection
 * @version 1.0.0
 */
console.log('[components/game/CompactArtifactSelector.tsx] v1.0.0 loaded')

import { memo, useState } from 'react'
import { cn } from '@/lib/utils'
import { GlassCard } from '@/components/ui/GlassCard'
import { Artifact, ArtifactType } from '@/types/artifacts'
import { ARTIFACTS_BY_ID } from '@/data/artifacts'

// ============================================
// TYPES
// ============================================

export interface CompactArtifactSelectorProps {
  /** Available artifact IDs for this game */
  availableArtifacts: string[]
  /** Artifacts already used by this player in previous rounds */
  usedArtifacts: string[]
  /** Current round number */
  round: number
  /** Player name for display */
  playerName: string
  /** Callback when artifact is selected */
  onSelectArtifact: (artifactId: string) => void
  /** Whether selection is currently active */
  isActive: boolean
  /** Additional CSS classes */
  className?: string
}

// ============================================
// ARTIFACT TYPE BADGE
// ============================================

interface ArtifactTypeBadgeProps {
  type: ArtifactType
}

const ArtifactTypeBadge = memo(function ArtifactTypeBadge({ type }: ArtifactTypeBadgeProps) {
  const config = {
    [ArtifactType.INSTANT]: {
      symbol: '⚡',
      label: '立即',
      color: 'text-yellow-400 bg-yellow-900/30 border-yellow-500/50',
    },
    [ArtifactType.ACTION]: {
      symbol: '✕',
      label: '行動',
      color: 'text-blue-400 bg-blue-900/30 border-blue-500/50',
    },
    [ArtifactType.PERMANENT]: {
      symbol: '∞',
      label: '永久',
      color: 'text-purple-400 bg-purple-900/30 border-purple-500/50',
    },
  }

  const { symbol, label, color } = config[type]

  return (
    <div
      className={cn(
        'inline-flex items-center gap-1 px-1.5 py-0.5 rounded border text-xs font-bold',
        color
      )}
    >
      <span className="text-sm">{symbol}</span>
      <span>{label}</span>
    </div>
  )
})

// ============================================
// COMPACT ARTIFACT CARD
// ============================================

interface CompactArtifactCardProps {
  artifact: Artifact
  isUsed: boolean
  isSelected: boolean
  onSelect: () => void
  disabled: boolean
}

const CompactArtifactCard = memo(function CompactArtifactCard({
  artifact,
  isUsed,
  isSelected,
  onSelect,
  disabled,
}: CompactArtifactCardProps) {
  const [isHovered, setIsHovered] = useState(false)
  const canSelect = !isUsed && !disabled && artifact.implemented

  return (
    <button
      type="button"
      onClick={canSelect ? onSelect : undefined}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      disabled={!canSelect}
      className={cn(
        'relative w-full transition-all duration-200',
        canSelect && 'cursor-pointer hover:scale-102',
        !canSelect && 'opacity-40 cursor-not-allowed grayscale'
      )}
    >
      <GlassCard
        variant={isSelected ? 'gold' : 'default'}
        glow={isSelected ? 'gold' : isHovered && canSelect ? 'blue' : 'none'}
        padding="sm"
        className={cn(
          'h-full',
          isSelected && 'ring-2 ring-amber-500 shadow-lg shadow-amber-500/50'
        )}
      >
        <div className="flex items-center gap-2 p-2">
          {/* Artifact Image */}
          <div className="flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden bg-gradient-to-br from-purple-900 to-pink-900 border border-purple-500/30">
            <img
              src={artifact.image}
              alt={artifact.nameTw}
              className="w-full h-full object-cover"
              onError={(e) => {
                // Fallback to emoji if image fails to load
                const target = e.target as HTMLImageElement
                target.style.display = 'none'
                const parent = target.parentElement
                if (parent) {
                  parent.innerHTML = `<div class="w-full h-full flex items-center justify-center text-2xl">${
                    artifact.type === ArtifactType.INSTANT ? '⚡' : artifact.type === ArtifactType.ACTION ? '✕' : '∞'
                  }</div>`
                }
              }}
            />
          </div>

          {/* Artifact Info */}
          <div className="flex-1 min-w-0 text-left">
            <div className="flex items-center gap-2 mb-1">
              <h4 className="text-sm font-bold text-amber-300 truncate">{artifact.nameTw}</h4>
              <ArtifactTypeBadge type={artifact.type} />
            </div>
            <p className="text-xs text-slate-300 line-clamp-2">{artifact.descriptionTw}</p>
          </div>

          {/* Status Indicators */}
          {isUsed && (
            <div className="absolute top-1 right-1 bg-red-600 text-white px-2 py-0.5 rounded text-xs font-bold">
              已使用
            </div>
          )}
          {!artifact.implemented && (
            <div className="absolute top-1 right-1 bg-orange-600 text-white px-2 py-0.5 rounded text-xs font-bold">
              未實作
            </div>
          )}
          {isSelected && (
            <div className="absolute top-1 left-1">
              <div className="w-6 h-6 rounded-full bg-amber-500 flex items-center justify-center shadow-lg">
                <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
            </div>
          )}
        </div>
      </GlassCard>
    </button>
  )
})

// ============================================
// MAIN COMPONENT
// ============================================

export const CompactArtifactSelector = memo(function CompactArtifactSelector({
  availableArtifacts,
  usedArtifacts,
  round,
  playerName,
  onSelectArtifact,
  isActive,
  className,
}: CompactArtifactSelectorProps) {
  const [selectedArtifactId, setSelectedArtifactId] = useState<string | null>(null)

  // Get artifact objects
  const artifacts = availableArtifacts
    .map((id) => ARTIFACTS_BY_ID[id])
    .filter((a): a is Artifact => !!a)

  const handleSelectArtifact = (artifactId: string) => {
    if (!isActive) return
    setSelectedArtifactId(artifactId)
  }

  const handleConfirm = () => {
    if (!selectedArtifactId || !isActive) return
    onSelectArtifact(selectedArtifactId)
  }

  return (
    <div className={cn('w-full flex flex-col gap-3', className)} data-testid="compact-artifact-selector">
      {/* Compact Header */}
      <div className="bg-gradient-to-r from-purple-900/40 to-pink-900/40 backdrop-blur-sm border border-purple-500/30 rounded-xl p-3">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400">
              選擇神器
            </h3>
            <p className="text-xs text-slate-400">
              {playerName} - 第 {round} 回合
            </p>
          </div>
          {selectedArtifactId && isActive && (
            <button
              type="button"
              onClick={handleConfirm}
              className={cn(
                'px-4 py-2 rounded-lg font-bold text-sm',
                'bg-gradient-to-r from-purple-600 to-pink-600',
                'hover:from-purple-500 hover:to-pink-500',
                'active:from-purple-700 active:to-pink-700',
                'text-white shadow-lg shadow-purple-900/50',
                'transition-all duration-200',
                'hover:scale-105 active:scale-95'
              )}
            >
              確認選擇
            </button>
          )}
        </div>
      </div>

      {/* Compact Artifact List */}
      <div className="flex flex-col gap-2 max-h-96 overflow-y-auto custom-scrollbar pr-2">
        {artifacts.map((artifact) => {
          const isUsed = usedArtifacts.includes(artifact.id)
          const isSelected = selectedArtifactId === artifact.id

          return (
            <CompactArtifactCard
              key={artifact.id}
              artifact={artifact}
              isUsed={isUsed}
              isSelected={isSelected}
              onSelect={() => handleSelectArtifact(artifact.id)}
              disabled={!isActive}
            />
          )
        })}
      </div>
    </div>
  )
})

export default CompactArtifactSelector
