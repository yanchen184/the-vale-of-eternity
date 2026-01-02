/**
 * useCoinAnimation Hook
 * 處理金幣飛行動畫效果
 * @version 3.0.0 - 直接使用 GSAP，不依賴 React state
 */
console.log('[hooks/useCoinAnimation.ts] v3.0.0 loaded')

import { useCallback, useRef } from 'react'
import { StoneType } from '@/types/cards'
import gsap from 'gsap'

// ============================================
// TYPES
// ============================================

export interface UseCoinAnimationReturn {
  animateCoin: (
    coinType: StoneType,
    fromElement: HTMLElement,
    toElement: HTMLElement
  ) => Promise<void>
}

// ============================================
// CONSTANTS
// ============================================

const COIN_IMAGES: Partial<Record<StoneType, string>> = {
  [StoneType.ONE]: '/the-vale-of-eternity/assets/stones/stone-1.png',
  [StoneType.THREE]: '/the-vale-of-eternity/assets/stones/stone-3.png',
  [StoneType.SIX]: '/the-vale-of-eternity/assets/stones/stone-6.png',
}

const ANIMATION_DURATION = 0.6 // seconds

// ============================================
// HELPER FUNCTIONS
// ============================================

function getElementCenter(element: HTMLElement): { x: number; y: number } {
  const rect = element.getBoundingClientRect()
  return {
    x: rect.left + rect.width / 2,
    y: rect.top + rect.height / 2,
  }
}

// ============================================
// HOOK
// ============================================

export function useCoinAnimation(): UseCoinAnimationReturn {
  const animationIdRef = useRef(0)

  const animateCoin = useCallback(
    (
      coinType: StoneType,
      fromElement: HTMLElement,
      toElement: HTMLElement
    ): Promise<void> => {
      return new Promise((resolve) => {
        console.log('[useCoinAnimation] Starting GSAP animation:', { coinType })

        const imageUrl = COIN_IMAGES[coinType]

        if (!imageUrl) {
          console.warn('[useCoinAnimation] No image found for coin type:', coinType)
          resolve()
          return
        }

        const start = getElementCenter(fromElement)
        const end = getElementCenter(toElement)

        console.log('[useCoinAnimation] Positions:', { start, end })

        // 創建飛行金幣元素
        const coinId = `flying-coin-${Date.now()}-${animationIdRef.current++}`
        const coinDiv = document.createElement('div')
        coinDiv.id = coinId
        coinDiv.style.cssText = `
          position: fixed;
          left: ${start.x}px;
          top: ${start.y}px;
          transform: translate(-50%, -50%);
          z-index: 99999;
          pointer-events: none;
        `

        const coinImg = document.createElement('img')
        coinImg.src = imageUrl
        coinImg.alt = 'Flying coin'
        coinImg.style.cssText = `
          width: 48px;
          height: 48px;
          filter: drop-shadow(0 0 12px rgba(245, 158, 11, 0.8)) drop-shadow(0 0 24px rgba(245, 158, 11, 0.4));
        `

        coinDiv.appendChild(coinImg)
        document.body.appendChild(coinDiv)

        console.log('[useCoinAnimation] Coin element created:', coinId)

        // 計算中間點（拋物線頂點）
        const midX = (start.x + end.x) / 2
        const midY = Math.min(start.y, end.y) - 80

        // GSAP 動畫
        const timeline = gsap.timeline({
          onComplete: () => {
            console.log('[useCoinAnimation] Animation completed, removing element')
            coinDiv.remove()
            resolve()
          },
        })

        // 第一階段：飛到中間點
        timeline.to(coinDiv, {
          duration: ANIMATION_DURATION / 2,
          left: midX,
          top: midY,
          rotation: 180,
          scale: 1.5,
          ease: 'power2.out',
        })

        // 第二階段：飛到目標點
        timeline.to(coinDiv, {
          duration: ANIMATION_DURATION / 2,
          left: end.x,
          top: end.y,
          rotation: 360,
          scale: 0.8,
          opacity: 0,
          ease: 'power2.in',
        })

        console.log('[useCoinAnimation] GSAP timeline started')
      })
    },
    []
  )

  return {
    animateCoin,
  }
}

export default useCoinAnimation
