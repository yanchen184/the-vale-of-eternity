/**
 * Sound Service for The Vale of Eternity
 * Manages game sound effects and background music
 * @version 1.0.0
 */
console.log('[services/sound-service.ts] v1.0.0 loaded')

// ============================================
// TYPES
// ============================================

export enum SoundType {
  // Card actions
  CARD_DRAW = 'card_draw',
  CARD_SELECT = 'card_select',
  CARD_DESELECT = 'card_deselect',
  CARD_BUY = 'card_buy',
  CARD_SELL = 'card_sell',
  CARD_SHELTER = 'card_shelter',
  CARD_RECALL = 'card_recall',
  CARD_FLIP = 'card_flip',

  // Money actions
  COIN_GAIN = 'coin_gain',
  COIN_SPEND = 'coin_spend',
  COIN_RETURN = 'coin_return',

  // Game phases
  PHASE_HUNTING = 'phase_hunting',
  PHASE_ACTION = 'phase_action',
  PHASE_RESOLUTION = 'phase_resolution',
  TURN_START = 'turn_start',
  TURN_END = 'turn_end',

  // Artifacts
  ARTIFACT_SELECT = 'artifact_select',
  ARTIFACT_ACTIVATE = 'artifact_activate',

  // UI interactions
  BUTTON_CLICK = 'button_click',
  BUTTON_CONFIRM = 'button_confirm',
  BUTTON_CANCEL = 'button_cancel',
  MODAL_OPEN = 'modal_open',
  MODAL_CLOSE = 'modal_close',

  // Game events
  GAME_START = 'game_start',
  GAME_END = 'game_end',
  VICTORY = 'victory',
  DEFEAT = 'defeat',

  // Background music
  BGM_MENU = 'bgm_menu',
  BGM_GAME = 'bgm_game',
}

interface SoundSettings {
  masterVolume: number  // 0.0 - 1.0
  sfxVolume: number     // 0.0 - 1.0
  musicVolume: number   // 0.0 - 1.0
  enabled: boolean
}

// ============================================
// SOUND SERVICE
// ============================================

class SoundService {
  private sounds: Map<SoundType, HTMLAudioElement> = new Map()
  private currentBGM: HTMLAudioElement | null = null
  private settings: SoundSettings = {
    masterVolume: 0.7,
    sfxVolume: 0.8,
    musicVolume: 0.5,
    enabled: true,
  }

  constructor() {
    this.loadSettings()
    this.preloadSounds()
  }

  /**
   * Load settings from localStorage
   */
  private loadSettings(): void {
    const saved = localStorage.getItem('sound_settings')
    if (saved) {
      try {
        this.settings = { ...this.settings, ...JSON.parse(saved) }
      } catch (error) {
        console.error('[SoundService] Failed to load settings:', error)
      }
    }
  }

  /**
   * Save settings to localStorage
   */
  private saveSettings(): void {
    localStorage.setItem('sound_settings', JSON.stringify(this.settings))
  }

  /**
   * Preload sound files
   */
  private preloadSounds(): void {
    // Map sound types to file paths
    const soundFiles: Partial<Record<SoundType, string>> = {
      // Card sounds - using free sound effects
      [SoundType.CARD_DRAW]: '/the-vale-of-eternity/assets/sounds/card_draw.mp3',
      [SoundType.CARD_SELECT]: '/the-vale-of-eternity/assets/sounds/card_select.mp3',
      [SoundType.CARD_DESELECT]: '/the-vale-of-eternity/assets/sounds/card_deselect.mp3',
      [SoundType.CARD_BUY]: '/the-vale-of-eternity/assets/sounds/card_buy.mp3',
      [SoundType.CARD_SELL]: '/the-vale-of-eternity/assets/sounds/card_sell.mp3',
      [SoundType.CARD_SHELTER]: '/the-vale-of-eternity/assets/sounds/card_shelter.mp3',
      [SoundType.CARD_RECALL]: '/the-vale-of-eternity/assets/sounds/card_recall.mp3',
      [SoundType.CARD_FLIP]: '/the-vale-of-eternity/assets/sounds/card_flip.mp3',

      // Coin sounds
      [SoundType.COIN_GAIN]: '/the-vale-of-eternity/assets/sounds/coin_gain.mp3',
      [SoundType.COIN_SPEND]: '/the-vale-of-eternity/assets/sounds/coin_spend.mp3',
      [SoundType.COIN_RETURN]: '/the-vale-of-eternity/assets/sounds/coin_return.mp3',

      // Phase sounds
      [SoundType.PHASE_HUNTING]: '/the-vale-of-eternity/assets/sounds/phase_hunting.mp3',
      [SoundType.PHASE_ACTION]: '/the-vale-of-eternity/assets/sounds/phase_action.mp3',
      [SoundType.TURN_START]: '/the-vale-of-eternity/assets/sounds/turn_start.mp3',
      [SoundType.TURN_END]: '/the-vale-of-eternity/assets/sounds/turn_end.mp3',

      // Artifact sounds
      [SoundType.ARTIFACT_SELECT]: '/the-vale-of-eternity/assets/sounds/artifact_select.mp3',
      [SoundType.ARTIFACT_ACTIVATE]: '/the-vale-of-eternity/assets/sounds/artifact_activate.mp3',

      // UI sounds
      [SoundType.BUTTON_CLICK]: '/the-vale-of-eternity/assets/sounds/button_click.mp3',
      [SoundType.BUTTON_CONFIRM]: '/the-vale-of-eternity/assets/sounds/button_confirm.mp3',
      [SoundType.BUTTON_CANCEL]: '/the-vale-of-eternity/assets/sounds/button_cancel.mp3',

      // Game events
      [SoundType.GAME_START]: '/the-vale-of-eternity/assets/sounds/game_start.mp3',
      [SoundType.GAME_END]: '/the-vale-of-eternity/assets/sounds/game_end.mp3',
      [SoundType.VICTORY]: '/the-vale-of-eternity/assets/sounds/victory.mp3',
    }

    // Preload each sound
    Object.entries(soundFiles).forEach(([type, path]) => {
      const audio = new Audio(path)
      audio.preload = 'auto'
      audio.volume = this.getEffectiveVolume()
      this.sounds.set(type as SoundType, audio)

      // Handle load errors silently
      audio.addEventListener('error', () => {
        console.warn(`[SoundService] Failed to load sound: ${type}`)
      })
    })
  }

  /**
   * Get effective volume (master * sfx)
   */
  private getEffectiveVolume(isBGM = false): number {
    if (!this.settings.enabled) return 0
    const volumeMultiplier = isBGM ? this.settings.musicVolume : this.settings.sfxVolume
    return this.settings.masterVolume * volumeMultiplier
  }

  /**
   * Play a sound effect
   */
  play(type: SoundType): void {
    if (!this.settings.enabled) return

    const sound = this.sounds.get(type)
    if (!sound) {
      console.warn(`[SoundService] Sound not found: ${type}`)
      return
    }

    try {
      // Clone the audio to allow overlapping plays
      const clone = sound.cloneNode() as HTMLAudioElement
      clone.volume = this.getEffectiveVolume()
      clone.play().catch((error) => {
        // Ignore autoplay policy errors
        if (error.name !== 'NotAllowedError') {
          console.error(`[SoundService] Error playing sound ${type}:`, error)
        }
      })
    } catch (error) {
      console.error(`[SoundService] Error playing sound ${type}:`, error)
    }
  }

  /**
   * Play background music
   */
  playBGM(type: SoundType): void {
    if (!this.settings.enabled) return

    // Stop current BGM if playing
    if (this.currentBGM) {
      this.currentBGM.pause()
      this.currentBGM.currentTime = 0
    }

    const bgm = this.sounds.get(type)
    if (!bgm) {
      console.warn(`[SoundService] BGM not found: ${type}`)
      return
    }

    try {
      bgm.volume = this.getEffectiveVolume(true)
      bgm.loop = true
      bgm.play().catch((error) => {
        if (error.name !== 'NotAllowedError') {
          console.error(`[SoundService] Error playing BGM ${type}:`, error)
        }
      })
      this.currentBGM = bgm
    } catch (error) {
      console.error(`[SoundService] Error playing BGM ${type}:`, error)
    }
  }

  /**
   * Stop background music
   */
  stopBGM(): void {
    if (this.currentBGM) {
      this.currentBGM.pause()
      this.currentBGM.currentTime = 0
      this.currentBGM = null
    }
  }

  /**
   * Update master volume
   */
  setMasterVolume(volume: number): void {
    this.settings.masterVolume = Math.max(0, Math.min(1, volume))
    this.updateAllVolumes()
    this.saveSettings()
  }

  /**
   * Update SFX volume
   */
  setSFXVolume(volume: number): void {
    this.settings.sfxVolume = Math.max(0, Math.min(1, volume))
    this.updateAllVolumes()
    this.saveSettings()
  }

  /**
   * Update music volume
   */
  setMusicVolume(volume: number): void {
    this.settings.musicVolume = Math.max(0, Math.min(1, volume))
    if (this.currentBGM) {
      this.currentBGM.volume = this.getEffectiveVolume(true)
    }
    this.saveSettings()
  }

  /**
   * Toggle sound on/off
   */
  setEnabled(enabled: boolean): void {
    this.settings.enabled = enabled
    if (!enabled && this.currentBGM) {
      this.currentBGM.pause()
    } else if (enabled && this.currentBGM) {
      this.currentBGM.play().catch(() => {})
    }
    this.saveSettings()
  }

  /**
   * Update all sound volumes
   */
  private updateAllVolumes(): void {
    const volume = this.getEffectiveVolume()
    this.sounds.forEach((sound) => {
      sound.volume = volume
    })
    if (this.currentBGM) {
      this.currentBGM.volume = this.getEffectiveVolume(true)
    }
  }

  /**
   * Get current settings
   */
  getSettings(): SoundSettings {
    return { ...this.settings }
  }
}

// Export singleton instance
export const soundService = new SoundService()

export default soundService
