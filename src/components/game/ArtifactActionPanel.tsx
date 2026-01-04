/**
 * ArtifactActionPanel Component v1.0.0
 * Displays selected artifact information and provides use button for ACTION phase
 * @version 1.0.0
 */
console.log('[components/game/ArtifactActionPanel.tsx] v1.0.0 loaded')

import { memo, useMemo } from 'react'
import { cn } from '@/lib/utils'
import { GlassCard } from '@/components/ui/GlassCard'
import { Button } from '@/components/ui/Button'
import { ARTIFACTS_BY_ID } from '@/data/artifacts'
import { ArtifactType, type Artifact } from '@/types/artifacts'

// ============================================
// TYPES
// ============================================

export interface ArtifactActionPanelProps {
  /** Currently selected artifact ID */
  artifactId: string | null
  /** Whether the artifact can be used now */
  canUse: boolean
  /** Whether the artifact has been used this round */
  isUsed: boolean
  /** Whether to show the panel (only in ACTION phase) */
  isVisible: boolean
  /** Callback when use artifact button is clicked */
  onUseArtifact: () => void
  /** Additional CSS classes */
  className?: string
}

// ============================================
// ARTIFACT TYPE CONFIG
// ============================================

const ARTIFACT_TYPE_CONFIG = {
  [ArtifactType.INSTANT]: {
    symbol: '⚡',
    label: '立即',
    color: 'text-yellow-400',
    bgColor: 'bg-yellow-900/30',
    borderColor: 'border-yellow-500/50',
    buttonGradient: 'from-yellow-600 to-amber-600',
    buttonHover: 'hover:from-yellow-500 hover:to-amber-500',
  },
  [ArtifactType.ACTION]: {
    symbol: '✕',
    label: '行動',
    color: 'text-blue-400',
    bgColor: 'bg-blue-900/30',
    borderColor: 'border-blue-500/50',
    buttonGradient: 'from-blue-600 to-cyan-600',
    buttonHover: 'hover:from-blue-500 hover:to-cyan-500',
  },
  [ArtifactType.PERMANENT]: {
    symbol: '∞',
    label: '永久',
    color: 'text-purple-400',
    bgColor: 'bg-purple-900/30',
    borderColor: 'border-purple-500/50',
    buttonGradient: 'from-purple-600 to-pink-600',
    buttonHover: 'hover:from-purple-500 hover:to-pink-500',
  },
}

// ============================================
// TYPE BADGE COMPONENT
// ============================================

interface TypeBadgeProps {
  type: ArtifactType
}

const TypeBadge = memo(function TypeBadge({ type }: TypeBadgeProps) {
  const config = ARTIFACT_TYPE_CONFIG[type]

  return (
    <div
      className={cn(
        'inline-flex items-center gap-1 px-2 py-0.5 rounded-md border text-xs font-bold',
        config.color,
        config.bgColor,
        config.borderColor
      )}
    >
      <span className="text-sm">{config.symbol}</span>
      <span>{config.label}</span>
    </div>
  )
})

// ============================================
// MAIN COMPONENT
// ============================================

export const ArtifactActionPanel = memo(function ArtifactActionPanel({
  artifactId,
  canUse,
  isUsed,
  isVisible,
  onUseArtifact,
  className,
}: ArtifactActionPanelProps) {
  // Get artifact data
  const artifact = useMemo<Artifact | null>(() => {
    if (!artifactId) return null
    return ARTIFACTS_BY_ID[artifactId] || null
  }, [artifactId])

  // Don't render if not visible or no artifact
  if (!isVisible || !artifact) return null

  const typeConfig = ARTIFACT_TYPE_CONFIG[artifact.type]

  // Determine button state and text
  const getButtonState = () => {
    if (isUsed) {
      return {
        disabled: true,
        text: '已使用',
        className: 'bg-slate-700 cursor-not-allowed opacity-50',
      }
    }
    if (!canUse) {
      return {
        disabled: true,
        text: artifact.type === ArtifactType.PERMANENT ? '永久效果' : '無法使用',
        className: 'bg-slate-700 cursor-not-allowed opacity-50',
      }
    }
    return {
      disabled: false,
      text: '使用神器',
      className: cn(
        'bg-gradient-to-r',
        typeConfig.buttonGradient,
        typeConfig.buttonHover,
        'hover:scale-105 active:scale-95'
      ),
    }
  }

  const buttonState = getButtonState()

  return (
    <div
      className={cn('w-full', className)}
      data-testid="artifact-action-panel"
    >
      <GlassCard
        variant="default"
        glow={canUse && !isUsed ? 'purple' : 'none'}
        padding="sm"
        className={cn(
          'border-purple-500/30',
          canUse && !isUsed && 'ring-1 ring-purple-500/50'
        )}
      >
        <div className="flex items-start gap-3">
          {/* Artifact Image */}
          <div className="flex-shrink-0 w-16 h-20 rounded-lg overflow-hidden bg-slate-800 relative">
            <img
              src={artifact.image}
              alt={artifact.nameTw}
              className={cn(
                'w-full h-full object-cover',
                isUsed && 'grayscale opacity-50'
              )}
              loading="lazy"
            />
            {isUsed && (
              <div className="absolute inset-0 flex items-center justify-center bg-slate-900/60">
                <span className="text-xs font-bold text-slate-400">已用</span>
              </div>
            )}
          </div>

          {/* Artifact Info */}
          <div className="flex-1 min-w-0 space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h4 className="text-sm font-bold text-amber-300 truncate">
                {artifact.nameTw}
              </h4>
              <TypeBadge type={artifact.type} />
            </div>

            <p className="text-xs text-slate-400 line-clamp-2">
              {artifact.descriptionTw}
            </p>

            {/* Use Button */}
            {artifact.type !== ArtifactType.PERMANENT && (
              <Button
                size="sm"
                onClick={onUseArtifact}
                disabled={buttonState.disabled}
                className={cn(
                  'w-full mt-2 text-sm font-bold transition-all duration-200',
                  buttonState.className
                )}
                data-testid="use-artifact-btn"
              >
                {buttonState.text}
              </Button>
            )}

            {/* Permanent effect indicator */}
            {artifact.type === ArtifactType.PERMANENT && (
              <div className="mt-2 text-xs text-purple-400 italic">
                此效果在滿足條件時自動觸發
              </div>
            )}
          </div>
        </div>
      </GlassCard>
    </div>
  )
})

export default ArtifactActionPanel
