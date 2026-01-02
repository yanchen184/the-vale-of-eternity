/**
 * usePlayerCoinChanges Hook
 * Tracks coin changes across all players for triggering animations
 * @version 1.0.0
 */
console.log('[hooks/usePlayerCoinChanges.ts] v1.0.0 loaded')

import { useRef, useCallback, useEffect } from 'react'
import type { StonePool } from '@/types/game'
import { StoneType } from '@/types/cards'

// ============================================
// TYPES
// ============================================

export interface PlayerCoinsSnapshot {
  playerId: string
  coins: StonePool
}

export interface CoinChangeEvent {
  playerId: string
  coinType: StoneType
  direction: 'take' | 'return'
  amount: number
  timestamp: number
}

export interface UsePlayerCoinChangesReturn {
  /** Check for coin changes and return events */
  detectChanges: (newSnapshots: PlayerCoinsSnapshot[]) => CoinChangeEvent[]
  /** Update the stored snapshot without triggering change detection */
  updateSnapshot: (snapshots: PlayerCoinsSnapshot[]) => void
  /** Get the last detected change events */
  lastChanges: CoinChangeEvent[]
}

// ============================================
// HELPER FUNCTIONS
// ============================================

function compareCoins(
  oldCoins: StonePool | undefined,
  newCoins: StonePool | undefined
): { coinType: StoneType; diff: number }[] {
  const changes: { coinType: StoneType; diff: number }[] = []

  if (!oldCoins || !newCoins) return changes

  const coinTypes: StoneType[] = [StoneType.ONE, StoneType.THREE, StoneType.SIX]

  for (const coinType of coinTypes) {
    const oldCount = oldCoins[coinType] || 0
    const newCount = newCoins[coinType] || 0
    const diff = newCount - oldCount

    if (diff !== 0) {
      changes.push({ coinType, diff })
    }
  }

  return changes
}

// ============================================
// HOOK
// ============================================

export function usePlayerCoinChanges(): UsePlayerCoinChangesReturn {
  const previousSnapshotsRef = useRef<Map<string, StonePool>>(new Map())
  const lastChangesRef = useRef<CoinChangeEvent[]>([])

  const detectChanges = useCallback(
    (newSnapshots: PlayerCoinsSnapshot[]): CoinChangeEvent[] => {
      const events: CoinChangeEvent[] = []
      const timestamp = Date.now()

      for (const snapshot of newSnapshots) {
        const oldCoins = previousSnapshotsRef.current.get(snapshot.playerId)
        const newCoins = snapshot.coins

        const changes = compareCoins(oldCoins, newCoins)

        for (const change of changes) {
          // Positive diff = took coin (bank -> player)
          // Negative diff = returned coin (player -> bank)
          const absDiff = Math.abs(change.diff)
          const direction = change.diff > 0 ? 'take' : 'return'

          // Create one event per coin (for individual animations)
          for (let i = 0; i < absDiff; i++) {
            events.push({
              playerId: snapshot.playerId,
              coinType: change.coinType,
              direction,
              amount: 1,
              timestamp: timestamp + i, // Slight offset for sequential animations
            })
          }
        }
      }

      // Update stored snapshots
      for (const snapshot of newSnapshots) {
        previousSnapshotsRef.current.set(snapshot.playerId, { ...snapshot.coins })
      }

      lastChangesRef.current = events
      return events
    },
    []
  )

  const updateSnapshot = useCallback((snapshots: PlayerCoinsSnapshot[]) => {
    for (const snapshot of snapshots) {
      previousSnapshotsRef.current.set(snapshot.playerId, { ...snapshot.coins })
    }
  }, [])

  return {
    detectChanges,
    updateSnapshot,
    lastChanges: lastChangesRef.current,
  }
}

/**
 * Hook to automatically detect and trigger animations on coin changes
 */
export function useAutoCoinAnimations(
  playerSnapshots: PlayerCoinsSnapshot[],
  onCoinChange?: (events: CoinChangeEvent[]) => void
) {
  const { detectChanges, updateSnapshot } = usePlayerCoinChanges()
  const isInitializedRef = useRef(false)

  useEffect(() => {
    // Skip initial render to avoid spurious animations
    if (!isInitializedRef.current) {
      updateSnapshot(playerSnapshots)
      isInitializedRef.current = true
      return
    }

    const events = detectChanges(playerSnapshots)

    if (events.length > 0 && onCoinChange) {
      onCoinChange(events)
    }
  }, [playerSnapshots, detectChanges, updateSnapshot, onCoinChange])
}

export default usePlayerCoinChanges
