/**
 * MultiplayerCoinSystem Component
 * Complete coin system with all players' coin areas and flying animations
 * Integrates with Firebase real-time updates to trigger animations
 * @version 1.0.0
 */
console.log('[components/game/MultiplayerCoinSystem.tsx] v1.0.0 loaded')

import { memo, useRef, useCallback, useEffect, useState } from 'react'
import { cn } from '@/lib/utils'
import type { StonePool } from '@/types/game'
import { StoneType } from '@/types/cards'
import type { PlayerColor } from '@/types/player-color'
import {
  AllPlayersCoinArea,
  type AllPlayersCoinAreaRef,
  type PlayerCoinData,
} from './AllPlayersCoinArea'
import { FlyingCoinContainer } from './FlyingCoinContainer'
import { useCoinFlyAnimation } from '@/hooks/useCoinFlyAnimation'
import {
  usePlayerCoinChanges,
  type PlayerCoinsSnapshot,
  type CoinChangeEvent,
} from '@/hooks/usePlayerCoinChanges'

// ============================================
// TYPES
// ============================================

export interface PlayerCoinInfo {
  playerId: string
  playerName: string
  playerColor: PlayerColor
  playerCoins: StonePool
  index: number
}

export interface MultiplayerCoinSystemProps {
  /** All players' data */
  players: PlayerCoinInfo[]
  /** Current logged-in player's ID */
  currentPlayerId: string
  /** ID of player whose turn it is */
  currentTurnPlayerId: string
  /** Bank coins (for display, bank is actually infinite) */
  bankCoins: StonePool
  /** Whether the current player can interact */
  isYourTurn: boolean
  /** Callback when current player takes a coin from bank */
  onTakeCoin?: (coinType: StoneType) => void
  /** Callback when current player returns a coin to bank */
  onReturnCoin?: (coinType: StoneType) => void
  /** Additional CSS classes */
  className?: string
  /** Enable/disable animations (default: true) */
  enableAnimations?: boolean
}

// ============================================
// CONSTANTS
// ============================================

const ANIMATION_STAGGER_DELAY = 100 // ms between sequential animations

// ============================================
// MAIN COMPONENT
// ============================================

export const MultiplayerCoinSystem = memo(function MultiplayerCoinSystem({
  players,
  currentPlayerId,
  currentTurnPlayerId,
  bankCoins: _bankCoins,
  isYourTurn,
  onTakeCoin,
  onReturnCoin,
  className = '',
  enableAnimations = true,
}: MultiplayerCoinSystemProps) {
  void _bankCoins // Bank is infinite, just for reference

  const allPlayersCoinAreaRef = useRef<AllPlayersCoinAreaRef>(null)
  const { flyingCoins, triggerFly, isAnimating } = useCoinFlyAnimation()
  const { detectChanges, updateSnapshot } = usePlayerCoinChanges()
  const isInitializedRef = useRef(false)
  const [pendingAnimations, setPendingAnimations] = useState<CoinChangeEvent[]>([])

  // Convert players to PlayerCoinData format
  const playerCoinData: PlayerCoinData[] = players.map((p) => ({
    playerId: p.playerId,
    playerName: p.playerName,
    playerColor: p.playerColor,
    playerCoins: p.playerCoins,
    index: p.index,
  }))

  // Convert to snapshots for change detection
  const snapshots: PlayerCoinsSnapshot[] = players.map((p) => ({
    playerId: p.playerId,
    coins: p.playerCoins,
  }))

  // Detect coin changes and queue animations
  useEffect(() => {
    if (!enableAnimations) return

    // Skip initial render
    if (!isInitializedRef.current) {
      updateSnapshot(snapshots)
      isInitializedRef.current = true
      return
    }

    const events = detectChanges(snapshots)

    if (events.length > 0) {
      console.log('[MultiplayerCoinSystem] Detected coin changes:', events)
      setPendingAnimations((prev) => [...prev, ...events])
    }
  }, [snapshots, detectChanges, updateSnapshot, enableAnimations])

  // Process pending animations
  useEffect(() => {
    if (pendingAnimations.length === 0) return
    if (!allPlayersCoinAreaRef.current) return

    const processNextAnimation = async () => {
      const [nextEvent, ...remaining] = pendingAnimations
      setPendingAnimations(remaining)

      if (!nextEvent) return

      const bankElement = allPlayersCoinAreaRef.current?.getBankElement()
      const playerCoinElement = allPlayersCoinAreaRef.current?.getPlayerCoinElement(
        nextEvent.playerId,
        nextEvent.coinType
      )

      if (!bankElement || !playerCoinElement) {
        console.warn('[MultiplayerCoinSystem] Could not find elements for animation')
        return
      }

      if (nextEvent.direction === 'take') {
        // Bank -> Player
        await triggerFly(nextEvent.coinType, bankElement, playerCoinElement, {
          targetPlayerId: nextEvent.playerId,
        })
      } else {
        // Player -> Bank
        await triggerFly(nextEvent.coinType, playerCoinElement, bankElement, {
          targetPlayerId: nextEvent.playerId,
        })
      }
    }

    // Add stagger delay between animations
    const timeoutId = setTimeout(processNextAnimation, ANIMATION_STAGGER_DELAY)

    return () => clearTimeout(timeoutId)
  }, [pendingAnimations, triggerFly])

  // Handle local player taking coin (with immediate animation)
  const handleTakeCoin = useCallback(
    async (coinType: StoneType) => {
      if (!onTakeCoin) return

      // Trigger animation immediately for local player
      if (enableAnimations && allPlayersCoinAreaRef.current) {
        const bankElement = allPlayersCoinAreaRef.current.getBankElement()
        const playerCoinElement = allPlayersCoinAreaRef.current.getPlayerCoinElement(
          currentPlayerId,
          coinType
        )

        if (bankElement && playerCoinElement) {
          // Trigger animation
          triggerFly(coinType, bankElement, playerCoinElement, {
            targetPlayerId: currentPlayerId,
          })
        }
      }

      // Call the actual handler (will update Firebase)
      onTakeCoin(coinType)
    },
    [onTakeCoin, currentPlayerId, enableAnimations, triggerFly]
  )

  // Handle local player returning coin (with immediate animation)
  const handleReturnCoin = useCallback(
    async (coinType: StoneType) => {
      if (!onReturnCoin) return

      // Trigger animation immediately for local player
      if (enableAnimations && allPlayersCoinAreaRef.current) {
        const bankElement = allPlayersCoinAreaRef.current.getBankElement()
        const playerCoinElement = allPlayersCoinAreaRef.current.getPlayerCoinElement(
          currentPlayerId,
          coinType
        )

        if (bankElement && playerCoinElement) {
          // Trigger animation (player -> bank)
          triggerFly(coinType, playerCoinElement, bankElement, {
            targetPlayerId: currentPlayerId,
          })
        }
      }

      // Call the actual handler (will update Firebase)
      onReturnCoin(coinType)
    },
    [onReturnCoin, currentPlayerId, enableAnimations, triggerFly]
  )

  return (
    <div
      className={cn('relative', className)}
      data-testid="multiplayer-coin-system"
    >
      {/* All Players Coin Areas */}
      <AllPlayersCoinArea
        ref={allPlayersCoinAreaRef}
        players={playerCoinData}
        currentPlayerId={currentPlayerId}
        currentTurnPlayerId={currentTurnPlayerId}
        onCoinClick={onReturnCoin}
      />

      {/* Flying Coin Animations */}
      <FlyingCoinContainer flyingCoins={flyingCoins} />

      {/* Interaction Overlay for Current Player */}
      {isYourTurn && (
        <div className="mt-3 p-2 bg-slate-800/60 rounded-lg border border-slate-700">
          <p className="text-xs text-slate-400 mb-2 text-center">
            你的回合 - 點擊操作錢幣
          </p>
          <div className="flex justify-center gap-2">
            <CoinActionButton
              coinType={StoneType.ONE}
              value={1}
              onTake={() => handleTakeCoin(StoneType.ONE)}
              onReturn={() => handleReturnCoin(StoneType.ONE)}
              canTake={true}
              canReturn={(players.find(p => p.playerId === currentPlayerId)?.playerCoins.ONE || 0) > 0}
            />
            <CoinActionButton
              coinType={StoneType.THREE}
              value={3}
              onTake={() => handleTakeCoin(StoneType.THREE)}
              onReturn={() => handleReturnCoin(StoneType.THREE)}
              canTake={true}
              canReturn={(players.find(p => p.playerId === currentPlayerId)?.playerCoins.THREE || 0) > 0}
            />
            <CoinActionButton
              coinType={StoneType.SIX}
              value={6}
              onTake={() => handleTakeCoin(StoneType.SIX)}
              onReturn={() => handleReturnCoin(StoneType.SIX)}
              canTake={true}
              canReturn={(players.find(p => p.playerId === currentPlayerId)?.playerCoins.SIX || 0) > 0}
            />
          </div>
        </div>
      )}

      {/* Animation Status */}
      {isAnimating && (
        <div className="absolute top-2 right-2 px-2 py-1 bg-amber-900/80 rounded text-xs text-amber-300">
          動畫中...
        </div>
      )}
    </div>
  )
})

// ============================================
// SUBCOMPONENTS
// ============================================

interface CoinActionButtonProps {
  coinType: StoneType
  value: number
  onTake: () => void
  onReturn: () => void
  canTake: boolean
  canReturn: boolean
}

const CoinActionButton = memo(function CoinActionButton({
  coinType,
  value,
  onTake,
  onReturn,
  canTake,
  canReturn,
}: CoinActionButtonProps) {
  const imageMap: Record<StoneType, string> = {
    [StoneType.ONE]: '/the-vale-of-eternity/assets/stones/stone-1.png',
    [StoneType.THREE]: '/the-vale-of-eternity/assets/stones/stone-3.png',
    [StoneType.SIX]: '/the-vale-of-eternity/assets/stones/stone-6.png',
    [StoneType.WATER]: '',
    [StoneType.FIRE]: '',
    [StoneType.EARTH]: '',
    [StoneType.WIND]: '',
  }

  return (
    <div className="flex flex-col items-center gap-1">
      <img
        src={imageMap[coinType]}
        alt={`${value} coin`}
        className="w-8 h-8 object-contain"
      />
      <div className="flex gap-1">
        <button
          type="button"
          onClick={onTake}
          disabled={!canTake}
          className={cn(
            'px-2 py-0.5 text-[10px] font-medium rounded transition-all',
            canTake
              ? 'bg-green-600 hover:bg-green-500 text-white'
              : 'bg-slate-600 text-slate-400 cursor-not-allowed'
          )}
          title={`拿取 ${value} 元`}
        >
          +
        </button>
        <button
          type="button"
          onClick={onReturn}
          disabled={!canReturn}
          className={cn(
            'px-2 py-0.5 text-[10px] font-medium rounded transition-all',
            canReturn
              ? 'bg-red-600 hover:bg-red-500 text-white'
              : 'bg-slate-600 text-slate-400 cursor-not-allowed'
          )}
          title={`歸還 ${value} 元`}
        >
          -
        </button>
      </div>
    </div>
  )
})

export default MultiplayerCoinSystem
