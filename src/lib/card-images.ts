/**
 * Card Image Path Mapping
 * Maps card IDs to their corresponding image files
 * @version 2.4.0 - Fixed Dragon DLC card mappings (Pyro, Deepdive, Horus, Loki)
 */
console.log('[lib/card-images.ts] v2.4.0 loaded')

// ============================================
// IMAGE PATH CONFIGURATION
// ============================================

/**
 * Base path for card images
 * In production, images are served from the public folder
 * Vite's base path is included via import.meta.env.BASE_URL
 */
const BASE_PATH = `${import.meta.env.BASE_URL}cards/base`.replace(/\/+/g, '/')
const DLC_BASE_PATH = `${import.meta.env.BASE_URL}assets/dlc`.replace(/\/+/g, '/')

/**
 * Placeholder image for missing cards
 */
const PLACEHOLDER_IMAGE = `${BASE_PATH}/placeholder.webp`

// ============================================
// CARD ID TO IMAGE FILENAME MAPPING
// ============================================

/**
 * Maps card IDs to their image filenames
 * Filename format: 200px-{CardName}.webp
 */
const CARD_IMAGE_MAP: Record<string, string> = {
  // Fire Family (15 cards)
  F001: '200px-Hestia.webp',
  F002: '200px-Imp.webp',
  F003: '200px-Succubus.webp',
  F004: '200px-Firefox.webp',
  F005: '200px-Salamander.webp',
  F006: '200px-Hornedsalamander.webp',
  F007: '200px-Ifrit.webp',
  F008: '200px-Incubus.webp',
  F009: '200px-Burningskull.webp',
  F010: '200px-Lavagiant.webp',
  F011: '200px-Phoenix.webp',
  F012: '200px-Agni.webp',
  F013: '200px-Asmodeus.webp',
  F014: '200px-Balog.webp',
  F015: '200px-Surtr.webp',

  // Water Family (15 cards)
  W001: '200px-Yukionna.webp',
  W002: '200px-Kappa.webp',
  W003: '200px-Seaspirit.webp',
  W004: '200px-Undine.webp',
  W005: '200px-Nessie.webp',
  W006: '200px-Hae-tae.webp',
  W007: '200px-Snailmaiden.webp',
  W008: '200px-Undinequeen.webp',
  W009: '200px-Yukionnaexalted.webp',
  W010: '200px-Hydra.webp',
  W011: '200px-Leviathan.webp',
  W012: '200px-Triton.webp',
  W013: '200px-Watergiant.webp',
  W014: '200px-Charybdis.webp',
  W015: '200px-Poseidon.webp',

  // Earth Family (15 cards)
  E001: '200px-Youngforestspirit.webp',
  E003: '200px-Goblin.webp',
  E004: '200px-Mudslime.webp',
  E005: '200px-Forestspirit.webp',
  E006: '200px-Gargoyle.webp',
  E007: '200px-Basilisk.webp',
  E008: '200px-Troll.webp',
  E009: '200px-Goblinsoldier.webp',
  E010: '200px-Medusa.webp',
  E011: '200px-Cerberus.webp',
  E012: '200px-Mimic.webp',
  E013: '200px-Rockgolem.webp',
  E014: '200px-Stonegolem.webp',
  E015: '200px-Behemoth.webp',
  E016: '200px-Sandgiant.webp',

  // Wind Family (15 cards)
  A001: '200px-Harpy.webp',
  A002: '200px-Pegasus.webp',
  A003: '200px-Tengu.webp',
  A004: '200px-Boreas.webp',
  A005: '200px-Genie.webp',
  A006: '200px-Hippogriff.webp',
  A007: '200px-Sylph.webp',
  A008: '200px-Genieexalted.webp',
  A009: '200px-Valkyrie.webp',
  A010: '200px-Griffon.webp',
  A011: '200px-Odin.webp',
  A012: '200px-Freyja.webp',
  A013: '200px-Rudra.webp',
  A014: '200px-Gi-rin.webp',
  A015: '200px-Dandelionspirit.webp',

  // Dragon Family (10 cards)
  D001: '200px-Dragonegg.webp',
  D002: '200px-Tidal.webp',
  D003: '200px-Ember.webp',
  D004: '200px-Marina.webp',
  D005: '200px-Boulder.webp',
  D006: '200px-Gust.webp',
  D007: '200px-Aeris.webp',
  D008: '200px-Scorch.webp',
  D009: '200px-Willow.webp',
  D010: '200px-Eternity.webp',
}

/**
 * Maps DLC card IDs to their image filenames
 * DLC cards use .jpg format and are located in assets/dlc/
 */
const DLC_CARD_IMAGE_MAP: Record<string, string> = {
  // Fire DLC (6 cards)
  DLC_F001: 'Ash.jpg',
  DLC_F002: 'Firerat.jpg',
  DLC_F003: 'Bul-gae.jpg',
  DLC_F004: 'Fireblast.jpg',
  DLC_F005: 'Hephaestus.jpg',
  DLC_F006: 'Belphegor.jpg',

  // Water DLC (6 cards)
  DLC_W001: 'Akhlut.jpg',
  DLC_W002: 'Melusine.jpg',
  DLC_W003: 'Thalassa.jpg',
  DLC_W004: 'Siren.jpg',
  DLC_W005: 'Kraken.jpg',
  DLC_W006: 'Taweret.jpg',

  // Earth DLC (6 cards)
  DLC_E001: 'Anubis.jpg',
  DLC_E002: 'Duduri.jpg',
  DLC_E003: 'Mandrake.jpg',
  DLC_E004: 'Totempole.jpg',
  DLC_E005: 'Wendigo.jpg',
  DLC_E006: 'Duduriking.jpg',

  // Wind DLC (4 cards)
  DLC_Wi001: 'Anzu.jpg',
  DLC_Wi002: 'Nurikabe.jpg',
  DLC_Wi003: 'Rukh.jpg',
  DLC_Wi004: 'Banshee.jpg',

  // Dragon DLC (6 cards)
  DLC_D001: 'Horus.jpg',
  DLC_D002: 'Loki.jpg',
  DLC_D003: 'Rockscale.jpg',
  DLC_D004: 'Whisper.jpg',
  DLC_D005: 'Pyro.jpg',
  DLC_D006: 'Deepdive.jpg',
}

// ============================================
// PUBLIC API
// ============================================

/**
 * Get the image path for a card by its ID
 * @param cardId Card ID (e.g., 'F001', 'W002', 'DLC_F001')
 * @returns Full image path or placeholder
 */
export function getCardImagePath(cardId: string): string {
  // Check if it's a DLC card
  if (cardId.startsWith('DLC_')) {
    const dlcFilename = DLC_CARD_IMAGE_MAP[cardId]
    if (!dlcFilename) {
      console.warn(`[card-images] No DLC image found for card ID: ${cardId}`)
      return PLACEHOLDER_IMAGE
    }
    return `${DLC_BASE_PATH}/${dlcFilename}`
  }

  // Base game card
  const filename = CARD_IMAGE_MAP[cardId]
  if (!filename) {
    console.warn(`[card-images] No image found for card ID: ${cardId}`)
    return PLACEHOLDER_IMAGE
  }
  return `${BASE_PATH}/${filename}`
}

/**
 * Get the image path for a card by its name
 * @param cardName Card name (e.g., 'Hestia', 'Dragon Egg')
 * @returns Full image path or placeholder
 */
export function getCardImageByName(cardName: string): string {
  // Convert name to filename format
  const normalizedName = cardName
    .replace(/\s+/g, '')
    .replace(/-/g, '-')
    .toLowerCase()

  // Search through the map
  for (const [_, filename] of Object.entries(CARD_IMAGE_MAP)) {
    const fileNameWithoutPrefix = filename
      .replace('200px-', '')
      .replace('.webp', '')
      .toLowerCase()
    if (fileNameWithoutPrefix === normalizedName) {
      return `${BASE_PATH}/${filename}`
    }
  }

  console.warn(`[card-images] No image found for card name: ${cardName}`)
  return PLACEHOLDER_IMAGE
}

/**
 * Check if an image exists for a card ID
 * @param cardId Card ID
 * @returns true if image exists in mapping
 */
export function hasCardImage(cardId: string): boolean {
  if (cardId.startsWith('DLC_')) {
    return cardId in DLC_CARD_IMAGE_MAP
  }
  return cardId in CARD_IMAGE_MAP
}

/**
 * Get all card image mappings
 * @returns Copy of the image map
 */
export function getAllCardImages(): Record<string, string> {
  return { ...CARD_IMAGE_MAP }
}

/**
 * Get the total number of card images
 * @returns Number of mapped images (base + DLC)
 */
export function getCardImageCount(): number {
  return Object.keys(CARD_IMAGE_MAP).length + Object.keys(DLC_CARD_IMAGE_MAP).length
}

/**
 * Preload all card images for better performance
 * @returns Promise that resolves when all images are loaded
 */
export function preloadCardImages(): Promise<void[]> {
  const imagePromises = Object.values(CARD_IMAGE_MAP).map(filename => {
    return new Promise<void>((resolve) => {
      const img = new Image()
      img.onload = () => resolve()
      img.onerror = () => {
        console.warn(`[card-images] Failed to preload: ${filename}`)
        resolve() // Don't fail the whole batch
      }
      img.src = `${BASE_PATH}/${filename}`
    })
  })

  return Promise.all(imagePromises)
}

/**
 * Get card back image path
 * @returns Path to card back image
 */
export function getCardBackImage(): string {
  return `${BASE_PATH}/card-back.webp`
}

// ============================================
// EXPORTS
// ============================================

export {
  BASE_PATH,
  DLC_BASE_PATH,
  PLACEHOLDER_IMAGE,
  CARD_IMAGE_MAP,
  DLC_CARD_IMAGE_MAP,
}
