/**
 * Hooks exports
 * Custom React hooks for The Vale of Eternity
 * @version 1.0.0
 */

// Animation hooks
export {
  useCardAnimation,
  useButtonAnimation,
  useHoverAnimation,
  useEntranceAnimation,
  useStoneGlow,
  usePulseAnimation,
  useStaggerAnimation,
  useDragAnimation,
  useNumberTransition,
} from './useAnimation'
export { useStoneParticles } from './useStoneParticles'

// Coin animation hooks (v1.0.0)
export { useCoinFlyAnimation } from './useCoinFlyAnimation'
export type {
  FlyingCoin,
  CoinFlyAnimationOptions,
  UseCoinFlyAnimationReturn,
} from './useCoinFlyAnimation'

// Multi-player coin change detection (v1.0.0)
export {
  usePlayerCoinChanges,
  useAutoCoinAnimations,
} from './usePlayerCoinChanges'
export type {
  PlayerCoinsSnapshot,
  CoinChangeEvent,
  UsePlayerCoinChangesReturn,
} from './usePlayerCoinChanges'
