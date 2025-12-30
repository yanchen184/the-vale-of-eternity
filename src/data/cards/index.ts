/**
 * Card data exports
 * @version 3.0.0
 */
console.log('[data/cards/index.ts] v3.0.0 loaded')

// Export all base game cards (70 cards) with prefixed names
export {
  BASE_CARDS,
  FIRE_CARDS as BASE_FIRE_CARDS,
  WATER_CARDS as BASE_WATER_CARDS,
  EARTH_CARDS as BASE_EARTH_CARDS,
  WIND_CARDS as BASE_WIND_CARDS,
  DRAGON_CARDS as BASE_DRAGON_CARDS,
  getAllCards as getAllBaseCards,
  getCardById as getBaseCardById,
  getCardByName,
  getCardsByElement as getBaseCardsByElement,
  getCardsByCost,
  getCardsByEffectType as getBaseCardsByEffectType,
  getCardsByEffectTrigger as getBaseCardsByEffectTrigger,
  createCardInstance,
  buildFullDeck,
  buildShuffledDeck as buildFullShuffledDeck,
  shuffleArray,
  getCardCountByElement,
  validateCardData,
} from './base-cards'

// Export MVP cards as default for backwards compatibility
export {
  MVP_CARDS,
  FIRE_CARDS,
  WATER_CARDS,
  EARTH_CARDS,
  WIND_CARDS,
  DRAGON_CARDS,
  getAllCards,
  getCardById,
  getCardsByElement,
  getCardsByEffectType,
  buildDeck,
  buildShuffledDeck,
} from './mvp-cards'

// Re-export card image utilities
export {
  getCardImagePath,
  getCardImageByName,
  hasCardImage,
  getAllCardImages,
  getCardImageCount,
  preloadCardImages,
  getCardBackImage,
} from '@/lib/card-images'
