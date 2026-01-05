/**
 * Score Gain Effect Component v1.0.0
 * Beautiful score increase animation for ON_SCORE card effects
 * Features:
 * - Rising golden particles animation
 * - Smooth score number animation
 * - Card image display with golden glow
 * - Full-screen overlay with blur backdrop
 * - Click to dismiss (or auto-dismiss after 4s)
 * @version 1.0.0 - Initial implementation
 */
console.log('[components/game/ScoreGainEffect.tsx] v1.0.0 loaded')

import { useState, useEffect, useCallback } from 'react'
import { useSound } from '@/hooks/useSound'
import { SoundType } from '@/services/sound-generator'
import './ScoreGainEffect.css'

// ============================================
// TYPES
// ============================================

export interface ScoreGainEffectProps {
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
  /** Card image URL */
  imageUrl?: string
  /** Callback when entire effect completes */
  onEffectComplete?: () => void
}

// ============================================
// COMPONENT
// ============================================

export function ScoreGainEffect({
  isActive,
  cardName,
  cardNameTw,
  scoreChange,
  reason,
  imageUrl,
  onEffectComplete,
}: ScoreGainEffectProps) {
  // Sound system
  const { play } = useSound()

  // Animation states
  const [showOverlay, setShowOverlay] = useState(false)
  const [animatedScore, setAnimatedScore] = useState(0)

  // Handle click to dismiss
  const handleDismiss = useCallback(() => {
    setShowOverlay(false)
    onEffectComplete?.()
  }, [onEffectComplete])

  // Reset when isActive changes
  useEffect(() => {
    if (isActive) {
      setShowOverlay(true)
      setAnimatedScore(0)

      // Play score gain sound (use coin gain sound)
      play(SoundType.COIN_GAIN)

      // Animate score from 0 to scoreChange
      const duration = 1000 // 1 second
      const steps = 30
      const increment = scoreChange / steps
      const stepDuration = duration / steps

      let currentStep = 0
      const timer = setInterval(() => {
        currentStep++
        if (currentStep >= steps) {
          setAnimatedScore(scoreChange)
          clearInterval(timer)
        } else {
          setAnimatedScore(Math.floor(increment * currentStep))
        }
      }, stepDuration)

      // Auto-dismiss after 4s
      const dismissTimer = setTimeout(() => {
        setShowOverlay(false)
        onEffectComplete?.()
      }, 4000)

      return () => {
        clearInterval(timer)
        clearTimeout(dismissTimer)
      }
    } else {
      setShowOverlay(false)
      setAnimatedScore(0)
    }
  }, [isActive, scoreChange, play, onEffectComplete])

  // Don't render if not active
  if (!isActive && !showOverlay) {
    return null
  }

  return (
    <>
      {/* Full-screen overlay with blur backdrop */}
      {showOverlay && (
        <div className="score-gain-overlay" onClick={handleDismiss}>
          <div className="score-gain-container">
            {/* Floating particles background */}
            <div className="score-gain-particles">
              {Array.from({ length: 20 }).map((_, i) => (
                <div
                  key={i}
                  className="score-gain-particle"
                  style={{
                    left: `${Math.random() * 100}%`,
                    animationDelay: `${Math.random() * 2}s`,
                    animationDuration: `${2 + Math.random() * 2}s`,
                  }}
                />
              ))}
            </div>

            {/* Card Image with golden glow */}
            {imageUrl && (
              <div className="score-gain-card-wrapper">
                <img
                  src={`${import.meta.env.BASE_URL}cards/base/${imageUrl}`}
                  alt={cardNameTw}
                  className="score-gain-card-image"
                />
              </div>
            )}

            {/* Score increase icon (star) */}
            <div className="score-gain-icon">
              <span className="score-gain-icon-star">⭐</span>
            </div>

            {/* Card name */}
            <h2 className="score-gain-title">
              <span className="score-gain-title-tw">{cardNameTw}</span>
              <span className="score-gain-title-en">({cardName})</span>
            </h2>

            {/* Reason text */}
            <p className="score-gain-reason">{reason}</p>

            {/* Animated score badge */}
            <div className="score-gain-score-badge">
              <span className="score-gain-score-plus">+{animatedScore}</span>
              <span className="score-gain-score-label">分</span>
            </div>

            {/* Click to dismiss hint */}
            <div className="score-gain-dismiss-hint">
              <p className="text-sm text-amber-200/80">
                點擊畫面關閉
              </p>
              <p className="text-xs text-amber-300/60 mt-1">
                或等待自動消失
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

export default ScoreGainEffect
