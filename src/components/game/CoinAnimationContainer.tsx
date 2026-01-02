/**
 * CoinAnimationContainer Component
 * 渲染飛行中的金幣動畫
 * @version 2.0.0 - 使用 CSS class 動畫
 */
console.log('[components/game/CoinAnimationContainer.tsx] v2.0.0 loaded')

import { memo, useEffect, useRef } from 'react'
import type { StoneType } from '@/types/cards'

// ============================================
// TYPES
// ============================================

export interface FlyingCoinData {
  id: string
  coinType: StoneType
  startX: number
  startY: number
  endX: number
  endY: number
  imageUrl: string
  startTime: number
}

export interface CoinAnimationContainerProps {
  flyingCoins: FlyingCoinData[]
}

// ============================================
// COMPONENT
// ============================================

export const CoinAnimationContainer = memo(function CoinAnimationContainer({
  flyingCoins,
}: CoinAnimationContainerProps) {
  console.log('[CoinAnimationContainer] Rendering with coins:', flyingCoins.length)

  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (flyingCoins.length === 0) return

    flyingCoins.forEach((coin) => {
      console.log('[CoinAnimationContainer] Animating coin:', coin.id)

      const coinElement = document.getElementById(`flying-coin-${coin.id}`)
      if (!coinElement) {
        console.warn('[CoinAnimationContainer] Coin element not found:', coin.id)
        return
      }

      // 使用 Web Animations API
      const midX = (coin.startX + coin.endX) / 2
      const midY = Math.min(coin.startY, coin.endY) - 80

      coinElement.animate(
        [
          {
            left: `${coin.startX}px`,
            top: `${coin.startY}px`,
            transform: 'translate(-50%, -50%) scale(1) rotate(0deg)',
            opacity: 1,
          },
          {
            left: `${midX}px`,
            top: `${midY}px`,
            transform: 'translate(-50%, -50%) scale(1.5) rotate(180deg)',
            opacity: 1,
            offset: 0.5,
          },
          {
            left: `${coin.endX}px`,
            top: `${coin.endY}px`,
            transform: 'translate(-50%, -50%) scale(0.8) rotate(360deg)',
            opacity: 0,
          },
        ],
        {
          duration: 600,
          easing: 'cubic-bezier(0.4, 0.0, 0.2, 1)',
          fill: 'forwards',
        }
      )
    })
  }, [flyingCoins])

  if (flyingCoins.length === 0) {
    return null
  }

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 pointer-events-none"
      style={{ zIndex: 99999 }}
      aria-hidden="true"
    >
      {flyingCoins.map((coin) => (
        <div
          key={coin.id}
          id={`flying-coin-${coin.id}`}
          className="absolute"
          style={{
            left: `${coin.startX}px`,
            top: `${coin.startY}px`,
            transform: 'translate(-50%, -50%)',
          }}
        >
          <img
            src={coin.imageUrl}
            alt="Flying coin"
            className="w-12 h-12 drop-shadow-2xl"
            style={{
              filter:
                'drop-shadow(0 0 12px rgba(245, 158, 11, 0.8)) drop-shadow(0 0 24px rgba(245, 158, 11, 0.4))',
            }}
          />
        </div>
      ))}
    </div>
  )
})

export default CoinAnimationContainer
