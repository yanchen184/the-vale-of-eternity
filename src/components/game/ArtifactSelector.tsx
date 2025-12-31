/**
 * ArtifactSelector Component
 * Allows players to select an artifact at the start of each round
 * @version 1.0.0
 */
console.log('[components/game/ArtifactSelector.tsx] v1.0.0 loaded')

import { memo, useState } from 'react'
import { cn } from '@/lib/utils'
import { GlassCard } from '@/components/ui/GlassCard'
import { Artifact, ArtifactType } from '@/types/artifacts'
import { ARTIFACTS_BY_ID } from '@/data/artifacts'

// ============================================
// TYPES
// ============================================

export interface ArtifactSelectorProps {
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
        'inline-flex items-center gap-1 px-2 py-1 rounded-md border text-xs font-bold',
        color
      )}
    >
      <span className="text-sm">{symbol}</span>
      <span>{label}</span>
    </div>
  )
})

// ============================================
// ARTIFACT CARD
// ============================================

interface ArtifactCardProps {
  artifact: Artifact
  isUsed: boolean
  isSelected: boolean
  onSelect: () => void
  disabled: boolean
}

const ArtifactCard = memo(function ArtifactCard({
  artifact,
  isUsed,
  isSelected,
  onSelect,
  disabled,
}: ArtifactCardProps) {
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
        'relative w-full transition-all duration-300',
        canSelect && 'cursor-pointer hover:scale-105',
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
        <div className="flex flex-col gap-3">
          {/* Artifact Image */}
          <div className="relative w-full aspect-[3/4] rounded-lg overflow-hidden bg-slate-800">
            <img
              src={artifact.image}
              alt={artifact.nameTw}
              className="w-full h-full object-cover"
              loading="lazy"
            />

            {/* Type Badge Overlay */}
            <div className="absolute top-2 right-2">
              <ArtifactTypeBadge type={artifact.type} />
            </div>

            {/* Used Badge */}
            {isUsed && (
              <div className="absolute inset-0 bg-slate-900/80 flex items-center justify-center">
                <div className="bg-red-600 text-white px-3 py-1 rounded-lg font-bold text-sm">
                  已使用
                </div>
              </div>
            )}

            {/* Not Implemented Badge */}
            {!artifact.implemented && (
              <div className="absolute inset-0 bg-slate-900/80 flex items-center justify-center">
                <div className="bg-orange-600 text-white px-3 py-1 rounded-lg font-bold text-sm">
                  尚未實作
                </div>
              </div>
            )}

            {/* Selected Indicator */}
            {isSelected && (
              <div className="absolute top-2 left-2">
                <div className="w-8 h-8 rounded-full bg-amber-500 flex items-center justify-center shadow-lg">
                  <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
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

          {/* Artifact Info */}
          <div className="space-y-2">
            {/* Name */}
            <h4 className="text-base font-bold text-center text-amber-300">
              {artifact.nameTw}
            </h4>

            {/* Description */}
            <p className="text-xs text-slate-300 line-clamp-3">{artifact.descriptionTw}</p>
          </div>
        </div>
      </GlassCard>
    </button>
  )
})

// ============================================
// MAIN COMPONENT
// ============================================

export const ArtifactSelector = memo(function ArtifactSelector({
  availableArtifacts,
  usedArtifacts,
  round,
  playerName,
  onSelectArtifact,
  isActive,
  className,
}: ArtifactSelectorProps) {
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
    <div className={cn('w-full h-full flex flex-col', className)} data-testid="artifact-selector">
      {/* Header */}
      <div className="flex-shrink-0 bg-gradient-to-b from-purple-900/40 to-slate-900/40 backdrop-blur-sm border-b border-purple-500/30 p-6">
        <div className="text-center space-y-2">
          <h2 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400">
            選擇神器
          </h2>
          <p className="text-slate-300">
            {playerName} - 第 {round} 回合
          </p>
          <p className="text-sm text-amber-400/80">
            選擇一個神器使用（已使用過的神器無法再選）
          </p>
        </div>
      </div>

      {/* Artifact Grid */}
      <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {artifacts.map((artifact) => {
            const isUsed = usedArtifacts.includes(artifact.id)
            const isSelected = selectedArtifactId === artifact.id

            return (
              <ArtifactCard
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

      {/* Footer - Confirm Button */}
      {isActive && selectedArtifactId && (
        <div className="flex-shrink-0 p-6 bg-gradient-to-t from-slate-900/80 to-transparent border-t border-purple-500/20">
          <button
            type="button"
            onClick={handleConfirm}
            className={cn(
              'w-full py-4 rounded-xl font-bold text-xl',
              'bg-gradient-to-r from-purple-600 to-pink-600',
              'hover:from-purple-500 hover:to-pink-500',
              'active:from-purple-700 active:to-pink-700',
              'text-white shadow-lg shadow-purple-900/50',
              'transition-all duration-200',
              'hover:scale-[1.02] active:scale-95'
            )}
          >
            確認選擇 -{' '}
            {ARTIFACTS_BY_ID[selectedArtifactId]?.nameTw || '未知神器'}
          </button>
        </div>
      )}
    </div>
  )
})

export default ArtifactSelector
