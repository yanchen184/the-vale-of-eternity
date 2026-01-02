/**
 * FlyingCoinContainer Component
 * Renders flying coins during animation
 * @version 1.0.0
 */
console.log('[components/game/FlyingCoinContainer.tsx] v1.0.0 loaded')

import { memo } from 'react'
import type { FlyingCoin } from '@/hooks/useCoinFlyAnimation'

// ============================================
// TYPES
// ============================================

export interface FlyingCoinContainerProps {
  /** Array of currently flying coins */
  flyingCoins: FlyingCoin[]
}

// ============================================
// CONSTANTS
// ============================================

const COIN_SIZE = 48

// ============================================
// COMPONENT
// ============================================

export const FlyingCoinContainer = memo(function FlyingCoinContainer({
  flyingCoins,
}: FlyingCoinContainerProps) {
  if (flyingCoins.length === 0) {
    return null
  }

  return (
    <div
      className="fixed inset-0 pointer-events-none z-50"
      aria-hidden="true"
    >
      {flyingCoins.map((coin) => (
        <div
          key={coin.id}
          id={`flying-coin-${coin.id}`}
          className="absolute"
          style={{
            width: COIN_SIZE,
            height: COIN_SIZE,
            left: coin.startPosition.x - COIN_SIZE / 2,
            top: coin.startPosition.y - COIN_SIZE / 2,
          }}
        >
          <img
            src={coin.imageUrl}
            alt="Flying coin"
            className="w-full h-full object-contain drop-shadow-lg"
            style={{
              filter: 'drop-shadow(0 0 8px rgba(245, 158, 11, 0.6))',
            }}
          />
          {/* Glow trail effect */}
          <div
            className="absolute inset-0 rounded-full animate-ping"
            style={{
              background: 'radial-gradient(circle, rgba(245, 158, 11, 0.3) 0%, transparent 70%)',
              animationDuration: '0.3s',
            }}
          />
        </div>
      ))}
    </div>
  )
})

export default FlyingCoinContainer
