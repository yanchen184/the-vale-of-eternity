/**
 * Game components exports
 * Core UI components for The Vale of Eternity game
 * @version 3.0.0
 */
console.log('[components/game/index.ts] v3.0.0 loaded')

// Card components
export { Card, CardBack } from './Card'
export type { CardProps, CardBackProps } from './Card'

// Player hand component
export { PlayerHand } from './PlayerHand'
export type { PlayerHandProps } from './PlayerHand'

// Play field component
export { PlayField } from './PlayField'
export type { PlayFieldProps } from './PlayField'

// Market area component
export { MarketArea } from './MarketArea'
export type { MarketAreaProps } from './MarketArea'

// Stone pool component
export { StonePool } from './StonePool'
export type { StonePoolProps } from './StonePool'
