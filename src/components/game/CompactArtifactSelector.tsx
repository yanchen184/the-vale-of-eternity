/**
 * CompactArtifactSelector Component
 * Compact version of artifact selector for inline display with card selection
 * @version 1.1.0 - Fixed useState import and removed internal confirm button
 */
console.log('[components/game/CompactArtifactSelector.tsx] v1.1.0 loaded')

import { memo, useState } from 'react'
import { cn } from '@/lib/utils'
import { GlassCard } from '@/components/ui/GlassCard'
import { Artifact, ArtifactType } from '@/types/artifacts'
import { ARTIFACTS_BY_ID } from '@/data/artifacts'
import { PlayerMarker } from './PlayerMarker'
import type { PlayerColor } from '@/types/player-color'

// ============================================
// TYPES
// ============================================

export interface CompactArtifactSelectorProps {
  /** Available artifact IDs for this game */
  availableArtifacts: string[]
  /** Artifacts already used by this player in previous rounds */
  usedArtifacts: string[]
  /** Map of artifact selections: artifactId -> { color, playerName, isConfirmed } */
  artifactSelections?: Map<string, { color: PlayerColor; playerName: string; isConfirmed: boolean }>
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
// COMPACT ARTIFACT CARD (Card-like with hover tooltip)
// ============================================

interface CompactArtifactCardProps {
  artifact: Artifact
  isUsed: boolean
  isSelected: boolean
  onSelect: () => void
  disabled: boolean
  /** Player color for selection marker */
  selectedByColor?: PlayerColor | null
  /** Player name for marker tooltip */
  selectedByName?: string
  /** Whether the selection is confirmed (locked) */
  isConfirmed?: boolean
}

const CompactArtifactCard = memo(function CompactArtifactCard({
  artifact,
  isUsed,
  isSelected,
  onSelect,
  disabled,
  selectedByColor,
  selectedByName,
  isConfirmed = false,
}: CompactArtifactCardProps) {
  const [isHovered, setIsHovered] = useState(false)
  const canSelect = !isUsed && !disabled && artifact.implemented

  return (
    <div className="relative group">
      {/* Artifact Card (like game cards) */}
      <button
        type="button"
        onClick={canSelect ? onSelect : undefined}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        disabled={!canSelect}
        className={cn(
          'relative w-64 h-80 rounded-lg overflow-hidden transition-all duration-200',
          'border-2',
          canSelect && 'cursor-pointer hover:scale-105 hover:z-10',
          !canSelect && 'opacity-40 cursor-not-allowed grayscale',
          isSelected
            ? 'border-amber-500 ring-2 ring-amber-500 shadow-lg shadow-amber-500/50'
            : 'border-purple-500/50 hover:border-purple-400'
        )}
      >
        {/* Artifact Image */}
        <div className="w-full h-full bg-gradient-to-br from-purple-900 to-pink-900">
          <img
            src={artifact.image}
            alt={artifact.nameTw}
            className="w-full h-full object-cover"
            onError={(e) => {
              const target = e.target as HTMLImageElement
              target.style.display = 'none'
              const parent = target.parentElement
              if (parent) {
                parent.innerHTML = `<div class="w-full h-full flex items-center justify-center text-5xl">${
                  artifact.type === ArtifactType.INSTANT ? '⚡' : artifact.type === ArtifactType.ACTION ? '✕' : '∞'
                }</div>`
              }
            }}
          />
        </div>

        {/* Type Badge (top-right corner) */}
        <div className="absolute top-1 right-1">
          <ArtifactTypeBadge type={artifact.type} />
        </div>

        {/* Status Overlays */}
        {isUsed && (
          <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
            <div className="bg-red-600 text-white px-3 py-1 rounded-full text-xs font-bold">
              已使用
            </div>
          </div>
        )}
        {!artifact.implemented && (
          <div className="absolute bottom-1 left-1 bg-orange-600 text-white px-2 py-0.5 rounded text-xs font-bold">
            未實作
          </div>
        )}

        {/* Selection Indicator */}
        {isSelected && (
          <div className="absolute top-1 left-1">
            <div className="w-7 h-7 rounded-full bg-amber-500 flex items-center justify-center shadow-lg">
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

        {/* Artifact Name (bottom overlay) */}
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 to-transparent p-2">
          <p className="text-xs font-bold text-amber-300 text-center truncate">
            {artifact.nameTw}
          </p>
        </div>
      </button>

      {/* Player Selection Marker - shown when artifact is selected */}
      {selectedByColor && (
        <div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-10"
          data-testid={`artifact-marker-${artifact.id}`}
        >
          <PlayerMarker
            color={selectedByColor}
            size="lg"
            showGlow={!isConfirmed}
            playerName={selectedByName}
            isConfirmed={isConfirmed}
          />
        </div>
      )}

      {/* Hover Tooltip */}
      {isHovered && canSelect && (
        <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 z-50 w-64 pointer-events-none">
          <GlassCard variant="default" glow="blue" padding="sm">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <h4 className="text-sm font-bold text-amber-300">{artifact.nameTw}</h4>
                <ArtifactTypeBadge type={artifact.type} />
              </div>
              <p className="text-xs text-slate-300">{artifact.descriptionTw}</p>
            </div>
          </GlassCard>
        </div>
      )}
    </div>
  )
})

// ============================================
// MAIN COMPONENT
// ============================================

export const CompactArtifactSelector = memo(function CompactArtifactSelector({
  availableArtifacts,
  usedArtifacts,
  artifactSelections,
  round,
  playerName,
  onSelectArtifact,
  isActive,
  className,
}: CompactArtifactSelectorProps) {
  // Get artifact objects
  const artifacts = availableArtifacts
    .map((id) => ARTIFACTS_BY_ID[id])
    .filter((a): a is Artifact => !!a)

  const handleSelectArtifact = (artifactId: string) => {
    if (!isActive) return
    // Directly call onSelectArtifact - no need for local state
    onSelectArtifact(artifactId)
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
              {playerName} - 第 {round} 回合 (點擊神器選擇，使用右側「確認選擇」按鈕)
            </p>
          </div>
        </div>
      </div>

      {/* Artifact Cards - Horizontal Row */}
      <div className="flex flex-row gap-4 overflow-x-auto custom-scrollbar pb-2">
        {artifacts.map((artifact) => {
          const isUsed = usedArtifacts.includes(artifact.id)
          const selectionInfo = artifactSelections?.get(artifact.id)
          // Card is selected if someone has chosen it (from artifactSelections)
          const isSelected = !!selectionInfo

          return (
            <CompactArtifactCard
              key={artifact.id}
              artifact={artifact}
              isUsed={isUsed}
              isSelected={isSelected}
              onSelect={() => handleSelectArtifact(artifact.id)}
              disabled={!isActive}
              selectedByColor={selectionInfo?.color}
              selectedByName={selectionInfo?.playerName}
              isConfirmed={selectionInfo?.isConfirmed}
            />
          )
        })}
      </div>
    </div>
  )
})

export default CompactArtifactSelector
