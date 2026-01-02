/**
 * useCoinFlyAnimation Hook
 * Handles flying animation for coins between areas
 * @version 2.0.0 - Added multi-player support with target player ID
 */
console.log('[hooks/useCoinFlyAnimation.ts] v2.0.0 loaded')

import { useState, useCallback, useRef } from 'react'
import gsap from 'gsap'
import { StoneType } from '@/types/cards'

// ============================================
// TYPES
// ============================================

export interface FlyingCoin {
  /** Unique ID for this animation */
  id: string
  /** Stone type being animated */
  stoneType: StoneType
  /** Starting position (absolute coordinates) */
  startPosition: { x: number; y: number }
  /** Ending position (absolute coordinates) */
  endPosition: { x: number; y: number }
  /** Image URL for the stone */
  imageUrl: string
  /** Optional: Target player ID for this animation */
  targetPlayerId?: string
}

export interface CoinFlyAnimationOptions {
  /** Duration of the animation in seconds */
  duration?: number
  /** Whether to add rotation effect */
  rotate?: boolean
  /** Whether to add scale effect */
  scale?: boolean
  /** Callback when animation completes */
  onComplete?: () => void
  /** Target player ID (for multi-player animations) */
  targetPlayerId?: string
  /** Source player ID (for return animations) */
  sourcePlayerId?: string
  /** Animation direction: 'take' (bank -> player) or 'return' (player -> bank) */
  direction?: 'take' | 'return'
}

export interface UseCoinFlyAnimationReturn {
  /** Currently flying coins */
  flyingCoins: FlyingCoin[]
  /** Trigger a coin fly animation */
  triggerFly: (
    stoneType: StoneType,
    fromElement: HTMLElement | null,
    toElement: HTMLElement | null,
    options?: CoinFlyAnimationOptions
  ) => Promise<void>
  /** Trigger animation with element lookup by player ID */
  triggerFlyToPlayer: (
    stoneType: StoneType,
    targetPlayerId: string,
    bankElement: HTMLElement | null,
    playerCoinElement: HTMLElement | null,
    options?: Omit<CoinFlyAnimationOptions, 'targetPlayerId'>
  ) => Promise<void>
  /** Trigger animation from player back to bank */
  triggerFlyFromPlayer: (
    stoneType: StoneType,
    sourcePlayerId: string,
    playerCoinElement: HTMLElement | null,
    bankElement: HTMLElement | null,
    options?: Omit<CoinFlyAnimationOptions, 'sourcePlayerId'>
  ) => Promise<void>
  /** Check if any animation is in progress */
  isAnimating: boolean
  /** Ref to attach to the animation container */
  containerRef: React.RefObject<HTMLDivElement>
  /** Get animation for specific player (for filtering) */
  getAnimationsForPlayer: (playerId: string) => FlyingCoin[]
}

// ============================================
// CONSTANTS
// ============================================

const COIN_IMAGES: Record<string, string> = {
  [StoneType.ONE]: '/the-vale-of-eternity/assets/stones/stone-1.png',
  [StoneType.THREE]: '/the-vale-of-eternity/assets/stones/stone-3.png',
  [StoneType.SIX]: '/the-vale-of-eternity/assets/stones/stone-6.png',
}

const DEFAULT_DURATION = 0.6
const COIN_SIZE = 48

// ============================================
// HELPER FUNCTIONS
// ============================================

function getElementCenter(element: HTMLElement | null): { x: number; y: number } | null {
  if (!element) return null

  const rect = element.getBoundingClientRect()
  return {
    x: rect.left + rect.width / 2,
    y: rect.top + rect.height / 2,
  }
}

function generateCoinId(): string {
  return `coin-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
}

// ============================================
// HOOK
// ============================================

export function useCoinFlyAnimation(): UseCoinFlyAnimationReturn {
  const [flyingCoins, setFlyingCoins] = useState<FlyingCoin[]>([])
  const [isAnimating, setIsAnimating] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const animationCountRef = useRef(0)

  const triggerFly = useCallback(
    async (
      stoneType: StoneType,
      fromElement: HTMLElement | null,
      toElement: HTMLElement | null,
      options: CoinFlyAnimationOptions = {}
    ): Promise<void> => {
      const {
        duration = DEFAULT_DURATION,
        rotate = true,
        scale = true,
        onComplete,
        targetPlayerId,
      } = options

      const startPos = getElementCenter(fromElement)
      const endPos = getElementCenter(toElement)

      if (!startPos || !endPos) {
        console.warn('[useCoinFlyAnimation] Could not get element positions')
        onComplete?.()
        return
      }

      const imageUrl = COIN_IMAGES[stoneType]
      if (!imageUrl) {
        console.warn('[useCoinFlyAnimation] Unknown stone type:', stoneType)
        onComplete?.()
        return
      }

      const coinId = generateCoinId()
      const flyingCoin: FlyingCoin = {
        id: coinId,
        stoneType,
        startPosition: startPos,
        endPosition: endPos,
        imageUrl,
        targetPlayerId,
      }

      animationCountRef.current++
      setIsAnimating(true)
      setFlyingCoins((prev) => [...prev, flyingCoin])

      return new Promise((resolve) => {
        requestAnimationFrame(() => {
          const coinElement = document.getElementById(`flying-coin-${coinId}`)

          if (!coinElement) {
            console.warn('[useCoinFlyAnimation] Flying coin element not found')
            setFlyingCoins((prev) => prev.filter((c) => c.id !== coinId))
            animationCountRef.current--
            if (animationCountRef.current === 0) setIsAnimating(false)
            onComplete?.()
            resolve()
            return
          }

          // Calculate arc path (higher arc for longer distances)
          const distance = Math.sqrt(
            Math.pow(endPos.x - startPos.x, 2) + Math.pow(endPos.y - startPos.y, 2)
          )
          const arcHeight = Math.min(distance * 0.3, 120)

          const midX = (startPos.x + endPos.x) / 2
          const midY = Math.min(startPos.y, endPos.y) - arcHeight

          gsap.set(coinElement, {
            left: startPos.x - COIN_SIZE / 2,
            top: startPos.y - COIN_SIZE / 2,
            opacity: 1,
            scale: 1,
          })

          gsap.to(coinElement, {
            duration: duration * 0.5,
            left: midX - COIN_SIZE / 2,
            top: midY - COIN_SIZE / 2,
            scale: scale ? 1.3 : 1,
            rotation: rotate ? 180 : 0,
            ease: 'power2.out',
            onComplete: () => {
              gsap.to(coinElement, {
                duration: duration * 0.5,
                left: endPos.x - COIN_SIZE / 2,
                top: endPos.y - COIN_SIZE / 2,
                scale: scale ? 1 : 1,
                rotation: rotate ? 360 : 0,
                ease: 'power2.in',
                onComplete: () => {
                  gsap.to(coinElement, {
                    duration: 0.15,
                    opacity: 0,
                    scale: 0.5,
                    ease: 'power2.in',
                    onComplete: () => {
                      setFlyingCoins((prev) => prev.filter((c) => c.id !== coinId))
                      animationCountRef.current--
                      if (animationCountRef.current === 0) setIsAnimating(false)
                      onComplete?.()
                      resolve()
                    },
                  })
                },
              })
            },
          })
        })
      })
    },
    []
  )

  /**
   * Trigger animation from bank to player's coin area
   */
  const triggerFlyToPlayer = useCallback(
    async (
      stoneType: StoneType,
      targetPlayerId: string,
      bankElement: HTMLElement | null,
      playerCoinElement: HTMLElement | null,
      options: Omit<CoinFlyAnimationOptions, 'targetPlayerId'> = {}
    ): Promise<void> => {
      return triggerFly(stoneType, bankElement, playerCoinElement, {
        ...options,
        targetPlayerId,
        direction: 'take',
      })
    },
    [triggerFly]
  )

  /**
   * Trigger animation from player's coin area back to bank
   */
  const triggerFlyFromPlayer = useCallback(
    async (
      stoneType: StoneType,
      sourcePlayerId: string,
      playerCoinElement: HTMLElement | null,
      bankElement: HTMLElement | null,
      options: Omit<CoinFlyAnimationOptions, 'sourcePlayerId'> = {}
    ): Promise<void> => {
      return triggerFly(stoneType, playerCoinElement, bankElement, {
        ...options,
        sourcePlayerId,
        direction: 'return',
      })
    },
    [triggerFly]
  )

  /**
   * Get all animations targeting a specific player
   */
  const getAnimationsForPlayer = useCallback(
    (playerId: string): FlyingCoin[] => {
      return flyingCoins.filter((coin) => coin.targetPlayerId === playerId)
    },
    [flyingCoins]
  )

  return {
    flyingCoins,
    triggerFly,
    triggerFlyToPlayer,
    triggerFlyFromPlayer,
    isAnimating,
    containerRef,
    getAnimationsForPlayer,
  }
}

export default useCoinFlyAnimation
