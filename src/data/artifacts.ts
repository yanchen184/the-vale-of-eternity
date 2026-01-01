/**
 * Artifact Data for Artifacts Expansion
 * Contains all 11 artifacts with their effects and metadata
 * @version 1.0.0
 */
console.log('[data/artifacts.ts] v1.0.0 loaded')

import {
  Artifact,
  ArtifactType,
  ArtifactCategory,
} from '@/types/artifacts'

// ============================================
// CORE ARTIFACTS (Always in game, 2+ players)
// ============================================

export const INCENSE_BURNER: Artifact = {
  id: 'incense_burner',
  name: 'Incense Burner',
  nameTw: '香爐',
  type: ArtifactType.ACTION,
  category: ArtifactCategory.CORE,
  description:
    'Action: Buy 1 card from the buy area for 3 stones of any color, OR shelter the top 2 cards from your deck.',
  descriptionTw: '行動：支付3顆任意顏色的石頭購買買入區的1張卡，或是將牌庫頂的2張卡庇護。',
  image: '/the-vale-of-eternity/assets/artifacts/2 Player Artifacts/Snipaste_2025-12-31_18-39-33.png',
  implemented: true,
  effectDetails: {
    affectsCardSelection: true,
    affectsStones: true,
    affectsSheltering: true,
    implementationNotes: 'Player choice: either buy from area for fixed 3 cost, OR shelter 2 from deck',
  },
}

export const MONKEY_KING_STAFF: Artifact = {
  id: 'monkey_king_staff',
  name: "Monkey King's Staff",
  nameTw: '齊天大聖金箍棒',
  type: ArtifactType.ACTION,
  category: ArtifactCategory.CORE,
  description: 'Action: Discard 2 cards from your hand to gain 1 red, 1 blue, and 1 green stone.',
  descriptionTw: '行動：棄掉手上的2張卡以獲得1顆紅石、1顆藍石和1顆綠石。',
  image: '/the-vale-of-eternity/assets/artifacts/2 Player Artifacts/Snipaste_2025-12-31_18-39-44.png',
  implemented: true,
  effectDetails: {
    affectsStones: true,
    affectsRecall: false,
    implementationNotes: 'Discard 2 hand cards -> gain 1R + 1B + 1G stones',
  },
}

export const PIED_PIPER_PIPE: Artifact = {
  id: 'pied_piper_pipe',
  name: "Pied Piper's Pipe",
  nameTw: '吹笛人之笛',
  type: ArtifactType.INSTANT,
  category: ArtifactCategory.CORE,
  description: 'Instant: Draw 1 card from your deck, OR recall all your cards (from play area and shelter).',
  descriptionTw: '立即：從牌庫抽1張卡，或是召回你所有的卡牌（場上和棲息地）。',
  image: '/the-vale-of-eternity/assets/artifacts/2 Player Artifacts/Snipaste_2025-12-31_18-39-55.png',
  implemented: true,
  effectDetails: {
    affectsCardSelection: true,
    affectsRecall: true,
    affectsSheltering: true,
    implementationNotes: 'Player choice: draw 1 OR recall all cards from play+shelter',
  },
}

// ============================================
// 3 PLAYER ARTIFACT
// ============================================

export const SEVEN_LEAGUE_BOOTS: Artifact = {
  id: 'seven_league_boots',
  name: 'Seven-League Boots',
  nameTw: '七里靴',
  type: ArtifactType.INSTANT,
  category: ArtifactCategory.THREE_PLAYER,
  description:
    'Instant: During hunting phase, flip 1 additional card from the deck and shelter 1 card from the display.',
  descriptionTw: '立即：在狩獵階段，從牌庫多翻開1張卡，並將展示區的1張卡庇護。',
  image: '/the-vale-of-eternity/assets/artifacts/3 Player Artifacts/Snipaste_2025-12-31_18-40-06.png',
  implemented: true,
  effectDetails: {
    affectsCardSelection: true,
    affectsSheltering: true,
    implementationNotes:
      'After selecting this artifact, flips 1 extra card from deck to market. Player must then select any card from market to shelter before proceeding.',
  },
}

// ============================================
// 4 PLAYER ARTIFACT
// ============================================

export const GOLDEN_FLEECE: Artifact = {
  id: 'golden_fleece',
  name: 'Golden Fleece',
  nameTw: '金羊毛',
  type: ArtifactType.ACTION,
  category: ArtifactCategory.FOUR_PLAYER,
  description:
    'Action: Gain 2 red stones and shelter 1 card from the top of your deck, OR recall 1 card from your play area.',
  descriptionTw: '行動：獲得2顆紅石並將牌庫頂的1張卡庇護，或是從場上召回1張卡。',
  image: '/the-vale-of-eternity/assets/artifacts/4 Player Artifacts/Snipaste_2025-12-31_18-40-18.png',
  implemented: true,
  effectDetails: {
    affectsStones: true,
    affectsSheltering: true,
    affectsRecall: true,
    implementationNotes: 'Player choice: (2R stones + shelter 1 from deck) OR recall 1 from play',
  },
}

// ============================================
// RANDOM ARTIFACTS (3 selected from these 6)
// ============================================

export const BOOK_OF_THOTH: Artifact = {
  id: 'book_of_thoth',
  name: 'Book of Thoth',
  nameTw: '透特之書',
  type: ArtifactType.ACTION,
  category: ArtifactCategory.RANDOM,
  description:
    'Action: Upgrade up to 2 of your stones by one level (Red → Blue → Green → Purple). You can upgrade the same stone twice.',
  descriptionTw:
    '行動：將你的石頭提升一級，最多2次（紅→藍→綠→紫）。你可以將同一顆石頭升級兩次。',
  image: '/the-vale-of-eternity/assets/artifacts/Random Artifacts/Snipaste_2025-12-31_18-40-27.png',
  implemented: true,
  effectDetails: {
    affectsStones: true,
    implementationNotes: 'Stone upgrade chain: R→B→G→P. Can apply twice to same stone or split.',
  },
}

export const CAP_OF_HADES: Artifact = {
  id: 'cap_of_hades',
  name: 'Cap of Hades',
  nameTw: '哈迪斯隱形帽',
  type: ArtifactType.ACTION,
  category: ArtifactCategory.RANDOM,
  description:
    'Action: Shelter 1 card from your hand and buy 1 card from the buy area for free, OR gain 1 blue stone.',
  descriptionTw: '行動：將手上的1張卡庇護並免費購買買入區的1張卡，或是獲得1顆藍石。',
  image: '/the-vale-of-eternity/assets/artifacts/Random Artifacts/Snipaste_2025-12-31_18-40-51.png',
  implemented: true,
  effectDetails: {
    affectsCardSelection: true,
    affectsStones: true,
    affectsSheltering: true,
    implementationNotes: 'Player choice: (shelter 1 from hand + free buy from area) OR gain 1B',
  },
}

export const GEM_OF_KUKULKAN: Artifact = {
  id: 'gem_of_kukulkan',
  name: 'Gem of Kukulkan',
  nameTw: '庫庫爾坎寶石',
  type: ArtifactType.PERMANENT,
  category: ArtifactCategory.RANDOM,
  description:
    'Permanent: When you sell/discard a creature card, you may pay 1 red stone to return that card to your hand instead.',
  descriptionTw: '永久：當你出售/棄掉一張生物卡時，你可以支付1顆紅石將該卡返回你的手牌。',
  image: '/the-vale-of-eternity/assets/artifacts/Random Artifacts/Snipaste_2025-12-31_18-40-57.png',
  implemented: true,
  effectDetails: {
    affectsStones: true,
    affectsRecall: true,
    implementationNotes: 'Passive effect: on card discard, offer option to pay 1R to return to hand',
  },
}

export const IMPERIAL_SEAL: Artifact = {
  id: 'imperial_seal',
  name: 'Imperial Seal',
  nameTw: '帝王印璽',
  type: ArtifactType.ACTION,
  category: ArtifactCategory.RANDOM,
  description:
    'Action: Discard 1 card from your play area. If it is a blue (water) card, gain 1 green stone.',
  descriptionTw: '行動：從場上棄掉1張卡。如果是藍色（水）卡，獲得1顆綠石。',
  image: '/the-vale-of-eternity/assets/artifacts/Random Artifacts/Snipaste_2025-12-31_18-40-35.png',
  implemented: true,
  effectDetails: {
    affectsStones: true,
    affectsRecall: false,
    implementationNotes: 'Discard 1 from play area. If water element, gain 1G stone.',
  },
}

export const PHILOSOPHER_STONE: Artifact = {
  id: 'philosopher_stone',
  name: "Philosopher's Stone",
  nameTw: '賢者之石',
  type: ArtifactType.INSTANT,
  category: ArtifactCategory.RANDOM,
  description:
    'Instant: Recall 1 card from your play area AND/OR discard 1 card from your shelter to gain 1 purple stone.',
  descriptionTw: '立即：從場上召回1張卡，以及/或是從棲息地棄掉1張卡以獲得1顆紫石。',
  image: '/the-vale-of-eternity/assets/artifacts/Random Artifacts/Snipaste_2025-12-31_18-40-45.png',
  implemented: true,
  effectDetails: {
    affectsStones: true,
    affectsRecall: true,
    affectsSheltering: true,
    implementationNotes: 'Can do both: recall 1 from play AND discard shelter for 1P (optional)',
  },
}

export const RING_OF_WISHES: Artifact = {
  id: 'ring_of_wishes',
  name: 'Ring of Wishes',
  nameTw: '許願戒指',
  type: ArtifactType.ACTION,
  category: ArtifactCategory.RANDOM,
  description:
    'Action: Activate the instant effect (⚡) of 1 card from the buy area without purchasing it.',
  descriptionTw: '行動：啟動買入區1張卡的立即效果（⚡），無需購買該卡。',
  image: '/the-vale-of-eternity/assets/artifacts/Random Artifacts/Snipaste_2025-12-31_18-41-06.png',
  implemented: true,
  effectDetails: {
    affectsCardSelection: true,
    implementationNotes: 'Trigger instant effect of any buy area card without cost/acquisition',
  },
}

// ============================================
// ARTIFACT COLLECTIONS
// ============================================

/**
 * All artifacts indexed by ID
 */
export const ARTIFACTS_BY_ID: Record<string, Artifact> = {
  [INCENSE_BURNER.id]: INCENSE_BURNER,
  [MONKEY_KING_STAFF.id]: MONKEY_KING_STAFF,
  [PIED_PIPER_PIPE.id]: PIED_PIPER_PIPE,
  [SEVEN_LEAGUE_BOOTS.id]: SEVEN_LEAGUE_BOOTS,
  [GOLDEN_FLEECE.id]: GOLDEN_FLEECE,
  [BOOK_OF_THOTH.id]: BOOK_OF_THOTH,
  [CAP_OF_HADES.id]: CAP_OF_HADES,
  [GEM_OF_KUKULKAN.id]: GEM_OF_KUKULKAN,
  [IMPERIAL_SEAL.id]: IMPERIAL_SEAL,
  [PHILOSOPHER_STONE.id]: PHILOSOPHER_STONE,
  [RING_OF_WISHES.id]: RING_OF_WISHES,
}

/**
 * All artifacts as an array
 */
export const ALL_ARTIFACTS: Artifact[] = Object.values(ARTIFACTS_BY_ID)

/**
 * Core artifacts (always in game)
 */
export const CORE_ARTIFACTS: Artifact[] = [INCENSE_BURNER, MONKEY_KING_STAFF, PIED_PIPER_PIPE]

/**
 * Random pool artifacts (3 selected)
 */
export const RANDOM_ARTIFACTS: Artifact[] = [
  BOOK_OF_THOTH,
  CAP_OF_HADES,
  GEM_OF_KUKULKAN,
  IMPERIAL_SEAL,
  PHILOSOPHER_STONE,
  RING_OF_WISHES,
]

/**
 * Get available artifacts for a game based on player count
 * @param playerCount Number of players (2-4)
 * @param randomSelection Optional pre-selected random artifacts (otherwise randomly picks 3)
 * @returns Array of artifact IDs available for this game
 */
export function getAvailableArtifacts(
  playerCount: number,
  randomSelection?: string[]
): string[] {
  const artifacts: string[] = []

  // Core artifacts (always included for 2+ players)
  artifacts.push(...CORE_ARTIFACTS.map((a) => a.id))

  // 3+ player artifact
  if (playerCount >= 3) {
    artifacts.push(SEVEN_LEAGUE_BOOTS.id)
  }

  // 4 player artifact
  if (playerCount >= 4) {
    artifacts.push(GOLDEN_FLEECE.id)
  }

  // Random artifacts (3 from pool of 6)
  if (randomSelection) {
    artifacts.push(...randomSelection)
  } else {
    // Randomly select 3 from random pool
    const shuffled = [...RANDOM_ARTIFACTS].sort(() => Math.random() - 0.5)
    artifacts.push(...shuffled.slice(0, 3).map((a) => a.id))
  }

  return artifacts
}

/**
 * Get artifacts that a player has already used in previous rounds
 * @param playerSelections Player's artifact selections from previous rounds
 * @returns Array of artifact IDs already used
 */
export function getUsedArtifacts(
  playerSelections: Array<{ artifactId: string; round: number }>
): string[] {
  return playerSelections.map((s) => s.artifactId)
}

/**
 * Check if an artifact can be selected by a player
 * @param artifactId Artifact to check
 * @param usedArtifacts Artifacts already used by this player
 * @returns True if artifact can be selected
 */
export function canSelectArtifact(artifactId: string, usedArtifacts: string[]): boolean {
  return !usedArtifacts.includes(artifactId)
}

export default {
  ARTIFACTS_BY_ID,
  ALL_ARTIFACTS,
  CORE_ARTIFACTS,
  RANDOM_ARTIFACTS,
  getAvailableArtifacts,
  getUsedArtifacts,
  canSelectArtifact,
}
