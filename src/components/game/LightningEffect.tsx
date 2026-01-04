/**
 * Lightning Effect Component v1.2.0
 * Dramatic lightning animation for Ifrit card effect
 * Features:
 * - SVG lightning bolt animation from top to bottom
 * - Full-screen blocking overlay
 * - Screen shake effect
 * - Animated text display with glow effects
 * - Card image display with amber glow
 * - Lightning sound effect
 * @version 1.2.0 - Added card image display
 */
console.log('[components/game/LightningEffect.tsx] v1.2.0 loaded')

import { useState, useEffect, useCallback } from 'react'
import { useSound } from '@/hooks/useSound'
import { SoundType } from '@/services/sound-generator'
import './LightningEffect.css'

// ============================================
// TYPES
// ============================================

export interface LightningEffectProps {
  /** Whether the effect is active */
  isActive: boolean
  /** Card name (English) */
  cardName: string
  /** Card name (Chinese) */
  cardNameTw: string
  /** Score change amount */
  scoreChange: number
  /** Reason text for the effect */
  reason: string
  /** Whether to show score modal (true for score effects, false for stone effects) */
  showScoreModal?: boolean
  /** Card image URL */
  imageUrl?: string
  /** Callback when effect completes (before modal opens) */
  onLightningComplete?: () => void
  /** Callback when modal should open (after 2s) */
  onOpenModal?: () => void
  /** Callback when entire effect completes (after 7s) */
  onEffectComplete?: () => void
}

// ============================================
// LIGHTNING BOLT SVG PATH GENERATOR
// ============================================

function generateLightningPath(): string {
  // Generate a jagged lightning bolt path from top to bottom
  const segments = 8
  const segmentHeight = 100 / segments
  let path = 'M 50 0' // Start at top center

  let x = 50
  for (let i = 1; i <= segments; i++) {
    const y = segmentHeight * i
    // Alternate left and right with random-ish variation
    const offsetX = (i % 2 === 0 ? 1 : -1) * (15 + Math.random() * 10)
    x = 50 + offsetX

    // Add a sharp angle point
    path += ` L ${x} ${y}`

    // Add a small branch occasionally
    if (i === 3 || i === 5) {
      const branchX = x + (i % 2 === 0 ? 20 : -20)
      const branchY = y + 8
      path += ` M ${x} ${y} L ${branchX} ${branchY} M ${x} ${y}`
    }
  }

  return path
}

// ============================================
// COMPONENT
// ============================================

export function LightningEffect({
  isActive,
  cardName,
  cardNameTw,
  scoreChange,
  reason,
  showScoreModal = false,
  imageUrl,
  onLightningComplete,
  onOpenModal,
  onEffectComplete,
}: LightningEffectProps) {
  // Sound system
  const { play } = useSound()

  // Animation phase states
  const [phase, setPhase] = useState<'idle' | 'lightning' | 'blocking' | 'text' | 'complete'>('idle')
  const [showLightning, setShowLightning] = useState(false)
  const [showOverlay, setShowOverlay] = useState(false)
  const [showText, setShowText] = useState(false)
  const [isShaking, setIsShaking] = useState(false)
  const [lightningPath] = useState(generateLightningPath())

  // Parse reason text for animation
  const reasonLines = reason.split('\n')

  // Reset when isActive changes
  useEffect(() => {
    if (isActive) {
      setPhase('lightning')
      startLightningSequence()
    } else {
      setPhase('idle')
      setShowLightning(false)
      setShowOverlay(false)
      setShowText(false)
      setIsShaking(false)
    }
  }, [isActive])

  const startLightningSequence = useCallback(() => {
    // Phase 1: Lightning strike (0-1s)
    setShowLightning(true)
    setIsShaking(true)

    // Play lightning sound effect
    play(SoundType.LIGHTNING)

    // End lightning and start overlay at 1s
    const lightningEndTimer = setTimeout(() => {
      setShowLightning(false)
      setIsShaking(false)
      setShowOverlay(true)
      setPhase('blocking')
      onLightningComplete?.()
    }, 1000)

    // Phase 2: Open modal at 2s
    const openModalTimer = setTimeout(() => {
      setShowText(true)
      setPhase('text')
      onOpenModal?.()
    }, 2000)

    // Phase 3: Complete at 7s
    const completeTimer = setTimeout(() => {
      setShowOverlay(false)
      setShowText(false)
      setPhase('complete')
      onEffectComplete?.()
    }, 7000)

    return () => {
      clearTimeout(lightningEndTimer)
      clearTimeout(openModalTimer)
      clearTimeout(completeTimer)
    }
  }, [play, onLightningComplete, onOpenModal, onEffectComplete])

  // Don't render if not active and not in any phase
  if (!isActive && phase === 'idle') {
    return null
  }

  return (
    <>
      {/* Screen shake wrapper - applies to entire page via CSS */}
      {isShaking && <div className="lightning-shake-trigger" />}

      {/* Lightning Strike Animation */}
      {showLightning && (
        <div className="lightning-container">
          {/* Flash overlay */}
          <div className="lightning-flash" />

          {/* Main lightning bolt */}
          <svg
            className="lightning-bolt"
            viewBox="0 0 100 100"
            preserveAspectRatio="none"
          >
            {/* Glow filter */}
            <defs>
              <filter id="lightning-glow" x="-50%" y="-50%" width="200%" height="200%">
                <feGaussianBlur stdDeviation="3" result="blur" />
                <feMerge>
                  <feMergeNode in="blur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
              <linearGradient id="lightning-gradient" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#fff7ed" />
                <stop offset="30%" stopColor="#fdba74" />
                <stop offset="60%" stopColor="#f97316" />
                <stop offset="100%" stopColor="#dc2626" />
              </linearGradient>
            </defs>

            {/* Lightning core (bright) */}
            <path
              d={lightningPath}
              className="lightning-path lightning-path--core"
              stroke="url(#lightning-gradient)"
              strokeWidth="3"
              fill="none"
              filter="url(#lightning-glow)"
            />

            {/* Lightning outer glow */}
            <path
              d={lightningPath}
              className="lightning-path lightning-path--glow"
              stroke="#fbbf24"
              strokeWidth="8"
              fill="none"
              opacity="0.5"
              filter="url(#lightning-glow)"
            />
          </svg>

          {/* Secondary lightning bolts */}
          <svg
            className="lightning-bolt lightning-bolt--secondary"
            viewBox="0 0 100 100"
            preserveAspectRatio="none"
            style={{ left: '30%' }}
          >
            <path
              d="M 60 0 L 45 25 L 55 30 L 35 60 L 50 55 L 30 100"
              className="lightning-path"
              stroke="#fdba74"
              strokeWidth="2"
              fill="none"
              filter="url(#lightning-glow)"
            />
          </svg>

          <svg
            className="lightning-bolt lightning-bolt--secondary"
            viewBox="0 0 100 100"
            preserveAspectRatio="none"
            style={{ left: '65%' }}
          >
            <path
              d="M 40 0 L 55 20 L 45 25 L 65 50 L 50 55 L 70 100"
              className="lightning-path"
              stroke="#fdba74"
              strokeWidth="2"
              fill="none"
              filter="url(#lightning-glow)"
            />
          </svg>

          {/* Impact effect at bottom */}
          <div className="lightning-impact" />
        </div>
      )}

      {/* Full-screen blocking overlay */}
      {showOverlay && (
        <div className="lightning-overlay">
          {/* Animated text display */}
          {showText && (
            <div className="lightning-text-container">
              {/* Card Image */}
              {imageUrl && (
                <div className="mb-6 animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
                  <img
                    src={`${import.meta.env.BASE_URL}cards/${imageUrl}`}
                    alt={cardNameTw}
                    className="w-48 h-auto mx-auto rounded-lg shadow-2xl border-4 border-amber-400/50"
                    style={{
                      filter: 'drop-shadow(0 0 20px rgba(251, 191, 36, 0.5))',
                    }}
                  />
                </div>
              )}

              {/* Lightning emoji with spin */}
              <div className="lightning-emoji">
                <span className="lightning-emoji-icon">&#9889;</span>
              </div>

              {/* Card name with glow */}
              <h2 className="lightning-title">
                <span className="lightning-title-tw">{cardNameTw}</span>
                <span className="lightning-title-en">({cardName})</span>
                <span className="lightning-title-suffix">&#12288;的閃電效果</span>
              </h2>

              {/* Reason text with typewriter effect */}
              <div className="lightning-reason">
                {reasonLines.map((line, index) => (
                  <p
                    key={index}
                    className="lightning-reason-line"
                    style={{ animationDelay: `${0.3 + index * 0.5}s` }}
                  >
                    {line.includes('→') ? (
                      <>
                        <span className="lightning-score-change">
                          {line.split('→')[0]}
                        </span>
                        <span className="lightning-arrow">&#8594;</span>
                        <span className="lightning-score-new">
                          {line.split('→')[1]}
                        </span>
                      </>
                    ) : (
                      line
                    )}
                  </p>
                ))}
              </div>

              {/* Score change badge - Only show for score effects (not stone effects) */}
              {showScoreModal && (
                <div className="lightning-score-badge">
                  <span className="lightning-score-plus">+{scoreChange}</span>
                  <span className="lightning-score-label">分</span>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </>
  )
}

export default LightningEffect
