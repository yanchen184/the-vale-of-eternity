/**
 * CoinAnimationDemo Page
 * Demonstrates the flying coin animation between player area and bank
 * @version 1.0.0
 */
console.log('[pages/CoinAnimationDemo.tsx] v1.0.0 loaded')

import { useState, useRef, useCallback } from 'react'
import { PlayerCoinArea, BankArea, FlyingCoinContainer } from '@/components/game'
import { useCoinFlyAnimation } from '../hooks/useCoinFlyAnimation'
import type { StonePool } from '@/types/game'
import { StoneType } from '@/types/cards'

// ============================================
// INITIAL STATE
// ============================================

const INITIAL_PLAYER_COINS: StonePool = {
  ONE: 2,
  THREE: 1,
  SIX: 0,
  WATER: 0,
  FIRE: 0,
  EARTH: 0,
  WIND: 0,
}

const INITIAL_BANK_COINS: StonePool = {
  ONE: 99,
  THREE: 99,
  SIX: 99,
  WATER: 0,
  FIRE: 0,
  EARTH: 0,
  WIND: 0,
}

// ============================================
// COMPONENT
// ============================================

export default function CoinAnimationDemo() {
  const [playerCoins, setPlayerCoins] = useState<StonePool>(INITIAL_PLAYER_COINS)
  const [bankCoins, setBankCoins] = useState<StonePool>(INITIAL_BANK_COINS)

  const bankAreaRef = useRef<HTMLDivElement>(null)
  const playerAreaRef = useRef<HTMLDivElement>(null)

  const { flyingCoins, triggerFly, isAnimating } = useCoinFlyAnimation()

  // Handle taking coin from bank
  const handleTakeCoin = useCallback(
    async (coinType: StoneType, coinElement: HTMLElement | null) => {
      // Calculate total coins in player area
      const totalCoins = playerCoins.ONE + playerCoins.THREE + playerCoins.SIX
      if (totalCoins >= 6) {
        alert('錢幣已達上限 6 個！請先歸還錢幣再拿取新的')
        return
      }

      // Trigger fly animation from bank to player area
      await triggerFly(coinType, coinElement, playerAreaRef.current, {
        duration: 0.6,
        rotate: true,
        scale: true,
        onComplete: () => {
          // Update state after animation
          setPlayerCoins((prev) => ({
            ...prev,
            [coinType]: prev[coinType] + 1,
          }))
        },
      })
    },
    [playerCoins, triggerFly]
  )

  // Handle returning coin to bank
  const handleReturnCoin = useCallback(
    async (coinType: StoneType, slotElement: HTMLElement | null) => {
      // Trigger fly animation from player area to bank
      await triggerFly(coinType, slotElement, bankAreaRef.current, {
        duration: 0.6,
        rotate: true,
        scale: true,
        onComplete: () => {
          // Update state after animation
          setPlayerCoins((prev) => ({
            ...prev,
            [coinType]: Math.max(0, prev[coinType] - 1),
          }))
        },
      })
    },
    [triggerFly]
  )

  // Reset to initial state
  const handleReset = () => {
    setPlayerCoins(INITIAL_PLAYER_COINS)
    setBankCoins(INITIAL_BANK_COINS)
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 p-8">
      {/* Header */}
      <div className="max-w-4xl mx-auto mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">
          錢幣飛行動畫展示
        </h1>
        <p className="text-slate-400">
          點擊銀行的錢幣來拿取，點擊玩家區的錢幣來歸還
        </p>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Bank Area */}
        <div ref={bankAreaRef}>
          <BankArea
            bankCoins={bankCoins}
            allowInteraction={!isAnimating}
            onTakeCoin={handleTakeCoin}
          />
        </div>

        {/* Arrow Indicator */}
        <div className="flex justify-center">
          <div className="flex flex-col items-center text-slate-500">
            <svg
              className="w-8 h-8 animate-bounce"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4"
              />
            </svg>
            <span className="text-xs mt-1">點擊錢幣交換</span>
          </div>
        </div>

        {/* Player Coin Area */}
        <div ref={playerAreaRef}>
          <PlayerCoinArea
            playerCoins={playerCoins}
            playerName="測試玩家"
            allowInteraction={!isAnimating}
            onReturnCoin={handleReturnCoin}
          />
        </div>

        {/* Controls */}
        <div className="flex justify-center gap-4">
          <button
            type="button"
            onClick={handleReset}
            className="px-6 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors"
          >
            重置
          </button>

          <div className="flex items-center gap-2 px-4 py-2 bg-slate-800 rounded-lg">
            <span className="text-slate-400 text-sm">動畫狀態：</span>
            <span
              className={`text-sm font-medium ${isAnimating ? 'text-amber-400' : 'text-green-400'}`}
            >
              {isAnimating ? '播放中...' : '就緒'}
            </span>
          </div>
        </div>

        {/* Info */}
        <div className="bg-slate-800/50 rounded-xl border border-slate-700 p-6">
          <h3 className="text-lg font-semibold text-white mb-4">功能說明</h3>
          <ul className="space-y-2 text-slate-300 text-sm">
            <li className="flex items-start gap-2">
              <span className="text-amber-400">1.</span>
              <span>玩家區改為 6 格子系統，每格顯示一個石頭圖片</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-amber-400">2.</span>
              <span>點擊銀行區的石頭，會觸發飛行動畫將石頭飛到玩家區</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-amber-400">3.</span>
              <span>點擊玩家區的石頭格子，會觸發飛行動畫將石頭歸還銀行</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-amber-400">4.</span>
              <span>動畫使用 GSAP 實現，包含拋物線軌跡、旋轉和縮放效果</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-amber-400">5.</span>
              <span>玩家區上限 6 個石頭，達到上限會顯示警告</span>
            </li>
          </ul>
        </div>
      </div>

      {/* Flying Coin Container (Portal) */}
      <FlyingCoinContainer flyingCoins={flyingCoins} />
    </div>
  )
}
