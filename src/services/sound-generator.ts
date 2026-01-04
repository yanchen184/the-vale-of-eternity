/**
 * Sound Generator using Web Audio API
 * Generates game sounds programmatically without audio files
 * @version 1.0.0
 */
console.log('[services/sound-generator.ts] v1.0.0 loaded')

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
  TURN_START = 'turn_start',
  TURN_END = 'turn_end',

  // Artifacts
  ARTIFACT_SELECT = 'artifact_select',
  ARTIFACT_ACTIVATE = 'artifact_activate',

  // Special effects
  LIGHTNING = 'lightning',

  // UI interactions
  BUTTON_CLICK = 'button_click',
  BUTTON_CONFIRM = 'button_confirm',
  BUTTON_CANCEL = 'button_cancel',

  // Game events
  GAME_START = 'game_start',
  GAME_END = 'game_end',
  VICTORY = 'victory',
}

interface SoundSettings {
  masterVolume: number
  sfxVolume: number
  enabled: boolean
}

// ============================================
// SOUND GENERATOR
// ============================================

class SoundGenerator {
  private audioContext: AudioContext | null = null
  private settings: SoundSettings = {
    masterVolume: 0.7,
    sfxVolume: 0.8,
    enabled: true,
  }

  constructor() {
    this.loadSettings()
    this.initAudioContext()
  }

  /**
   * Initialize Audio Context (lazy)
   */
  private initAudioContext(): void {
    if (!this.audioContext) {
      try {
        this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
      } catch (error) {
        console.error('[SoundGenerator] Failed to create AudioContext:', error)
      }
    }
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
        console.error('[SoundGenerator] Failed to load settings:', error)
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
   * Get effective volume
   */
  private getVolume(): number {
    if (!this.settings.enabled) return 0
    return this.settings.masterVolume * this.settings.sfxVolume
  }

  /**
   * Play a sound effect
   */
  play(type: SoundType): void {
    if (!this.settings.enabled || !this.audioContext) return

    // Resume context if suspended (browser autoplay policy)
    if (this.audioContext.state === 'suspended') {
      this.audioContext.resume()
    }

    const volume = this.getVolume()
    const ctx = this.audioContext
    const now = ctx.currentTime

    switch (type) {
      case SoundType.CARD_DRAW:
        this.playCardDraw(now, volume)
        break
      case SoundType.CARD_SELECT:
        this.playCardSelect(now, volume)
        break
      case SoundType.CARD_DESELECT:
        this.playCardDeselect(now, volume)
        break
      case SoundType.CARD_BUY:
        this.playCardBuy(now, volume)
        break
      case SoundType.CARD_SELL:
        this.playCardSell(now, volume)
        break
      case SoundType.CARD_SHELTER:
        this.playCardShelter(now, volume)
        break
      case SoundType.CARD_RECALL:
        this.playCardRecall(now, volume)
        break
      case SoundType.CARD_FLIP:
        this.playCardFlip(now, volume)
        break
      case SoundType.COIN_GAIN:
        this.playCoinGain(now, volume)
        break
      case SoundType.COIN_SPEND:
        this.playCoinSpend(now, volume)
        break
      case SoundType.COIN_RETURN:
        this.playCoinReturn(now, volume)
        break
      case SoundType.PHASE_HUNTING:
        this.playPhaseHunting(now, volume)
        break
      case SoundType.PHASE_ACTION:
        this.playPhaseAction(now, volume)
        break
      case SoundType.TURN_START:
        this.playTurnStart(now, volume)
        break
      case SoundType.TURN_END:
        this.playTurnEnd(now, volume)
        break
      case SoundType.ARTIFACT_SELECT:
        this.playArtifactSelect(now, volume)
        break
      case SoundType.ARTIFACT_ACTIVATE:
        this.playArtifactActivate(now, volume)
        break
      case SoundType.LIGHTNING:
        this.playLightning(now, volume)
        break
      case SoundType.BUTTON_CLICK:
        this.playButtonClick(now, volume)
        break
      case SoundType.BUTTON_CONFIRM:
        this.playButtonConfirm(now, volume)
        break
      case SoundType.BUTTON_CANCEL:
        this.playButtonCancel(now, volume)
        break
      case SoundType.GAME_START:
        this.playGameStart(now, volume)
        break
      case SoundType.GAME_END:
        this.playGameEnd(now, volume)
        break
      case SoundType.VICTORY:
        this.playVictory(now, volume)
        break
    }
  }

  // ============================================
  // SOUND IMPLEMENTATIONS
  // ============================================

  /**
   * Card Draw - Epic card swoosh with shimmer
   */
  private playCardDraw(startTime: number, volume: number): void {
    const ctx = this.audioContext!

    // Main swoosh sound (longer and more dramatic)
    const swoosh = ctx.createOscillator()
    const swooshGain = ctx.createGain()
    swoosh.connect(swooshGain)
    swooshGain.connect(ctx.destination)

    swoosh.type = 'sawtooth'
    swoosh.frequency.setValueAtTime(400, startTime)
    swoosh.frequency.exponentialRampToValueAtTime(150, startTime + 0.3)
    swoosh.frequency.exponentialRampToValueAtTime(100, startTime + 0.5)

    swooshGain.gain.setValueAtTime(volume * 0.35, startTime)
    swooshGain.gain.setValueAtTime(volume * 0.3, startTime + 0.1)
    swooshGain.gain.exponentialRampToValueAtTime(0.01, startTime + 0.5)

    swoosh.start(startTime)
    swoosh.stop(startTime + 0.5)

    // Shimmer/sparkle effect (three ascending tones)
    const sparkles = [
      { freq: 800, delay: 0.15 },
      { freq: 1000, delay: 0.22 },
      { freq: 1200, delay: 0.29 },
    ]

    sparkles.forEach(({ freq, delay }) => {
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()

      osc.connect(gain)
      gain.connect(ctx.destination)

      osc.type = 'sine'
      osc.frequency.setValueAtTime(freq, startTime + delay)

      gain.gain.setValueAtTime(volume * 0.15, startTime + delay)
      gain.gain.exponentialRampToValueAtTime(0.01, startTime + delay + 0.25)

      osc.start(startTime + delay)
      osc.stop(startTime + delay + 0.25)
    })

    // Deep bass thump for satisfaction
    const bass = ctx.createOscillator()
    const bassGain = ctx.createGain()
    bass.connect(bassGain)
    bassGain.connect(ctx.destination)

    bass.type = 'sine'
    bass.frequency.setValueAtTime(80, startTime)
    bass.frequency.exponentialRampToValueAtTime(40, startTime + 0.2)

    bassGain.gain.setValueAtTime(volume * 0.4, startTime)
    bassGain.gain.exponentialRampToValueAtTime(0.01, startTime + 0.2)

    bass.start(startTime)
    bass.stop(startTime + 0.2)

    // High-end crisp finish
    const crisp = ctx.createOscillator()
    const crispGain = ctx.createGain()
    crisp.connect(crispGain)
    crispGain.connect(ctx.destination)

    crisp.type = 'triangle'
    crisp.frequency.setValueAtTime(2000, startTime + 0.35)
    crisp.frequency.exponentialRampToValueAtTime(1500, startTime + 0.5)

    crispGain.gain.setValueAtTime(volume * 0.12, startTime + 0.35)
    crispGain.gain.exponentialRampToValueAtTime(0.01, startTime + 0.5)

    crisp.start(startTime + 0.35)
    crisp.stop(startTime + 0.5)
  }

  /**
   * Card Select - Ascending tone
   */
  private playCardSelect(startTime: number, volume: number): void {
    const ctx = this.audioContext!

    // Main ascending tone
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.connect(gain)
    gain.connect(ctx.destination)
    osc.type = 'triangle'
    osc.frequency.setValueAtTime(440, startTime)
    osc.frequency.exponentialRampToValueAtTime(880, startTime + 0.15)
    gain.gain.setValueAtTime(volume * 0.3, startTime)
    gain.gain.exponentialRampToValueAtTime(0.01, startTime + 0.15)
    osc.start(startTime)
    osc.stop(startTime + 0.15)

    // Bright ping
    const ping = ctx.createOscillator()
    const pingGain = ctx.createGain()
    ping.connect(pingGain)
    pingGain.connect(ctx.destination)
    ping.type = 'sine'
    ping.frequency.setValueAtTime(1200, startTime + 0.08)
    pingGain.gain.setValueAtTime(volume * 0.2, startTime + 0.08)
    pingGain.gain.exponentialRampToValueAtTime(0.01, startTime + 0.2)
    ping.start(startTime + 0.08)
    ping.stop(startTime + 0.2)
  }

  /**
   * Card Deselect - Descending tone
   */
  private playCardDeselect(startTime: number, volume: number): void {
    const ctx = this.audioContext!

    // Main descending tone
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.connect(gain)
    gain.connect(ctx.destination)
    osc.type = 'triangle'
    osc.frequency.setValueAtTime(880, startTime)
    osc.frequency.exponentialRampToValueAtTime(440, startTime + 0.15)
    gain.gain.setValueAtTime(volume * 0.3, startTime)
    gain.gain.exponentialRampToValueAtTime(0.01, startTime + 0.15)
    osc.start(startTime)
    osc.stop(startTime + 0.15)

    // Soft thud
    const thud = ctx.createOscillator()
    const thudGain = ctx.createGain()
    thud.connect(thudGain)
    thudGain.connect(ctx.destination)
    thud.type = 'sine'
    thud.frequency.setValueAtTime(200, startTime + 0.08)
    thudGain.gain.setValueAtTime(volume * 0.15, startTime + 0.08)
    thudGain.gain.exponentialRampToValueAtTime(0.01, startTime + 0.2)
    thud.start(startTime + 0.08)
    thud.stop(startTime + 0.2)
  }

  /**
   * Card Buy - Epic success chime with celebration
   */
  private playCardBuy(startTime: number, volume: number): void {
    const ctx = this.audioContext!

    // Ascending chord (C5, E5, G5, C6) - fuller sound
    const chord = [523.25, 659.25, 783.99, 1046.5]

    chord.forEach((freq, i) => {
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()

      osc.connect(gain)
      gain.connect(ctx.destination)

      osc.type = 'sine'
      osc.frequency.setValueAtTime(freq, startTime + i * 0.06)

      gain.gain.setValueAtTime(volume * 0.2, startTime + i * 0.06)
      gain.gain.exponentialRampToValueAtTime(0.01, startTime + i * 0.06 + 0.4)

      osc.start(startTime + i * 0.06)
      osc.stop(startTime + i * 0.06 + 0.4)
    })

    // Victory shimmer
    const shimmer = [1200, 1400, 1600, 1800]
    shimmer.forEach((freq, i) => {
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()

      osc.connect(gain)
      gain.connect(ctx.destination)

      osc.type = 'triangle'
      osc.frequency.setValueAtTime(freq, startTime + 0.15 + i * 0.04)

      gain.gain.setValueAtTime(volume * 0.1, startTime + 0.15 + i * 0.04)
      gain.gain.exponentialRampToValueAtTime(0.01, startTime + 0.15 + i * 0.04 + 0.2)

      osc.start(startTime + 0.15 + i * 0.04)
      osc.stop(startTime + 0.15 + i * 0.04 + 0.2)
    })

    // Bass punch for impact
    const bass = ctx.createOscillator()
    const bassGain = ctx.createGain()
    bass.connect(bassGain)
    bassGain.connect(ctx.destination)

    bass.type = 'sine'
    bass.frequency.setValueAtTime(100, startTime)

    bassGain.gain.setValueAtTime(volume * 0.35, startTime)
    bassGain.gain.exponentialRampToValueAtTime(0.01, startTime + 0.15)

    bass.start(startTime)
    bass.stop(startTime + 0.15)
  }

  /**
   * Card Sell - Cash register ding
   */
  private playCardSell(startTime: number, volume: number): void {
    const ctx = this.audioContext!

    // Ding sound - high frequency with quick decay
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()

    osc.connect(gain)
    gain.connect(ctx.destination)

    osc.type = 'sine'
    osc.frequency.setValueAtTime(1200, startTime)
    osc.frequency.exponentialRampToValueAtTime(800, startTime + 0.05)

    gain.gain.setValueAtTime(volume * 0.4, startTime)
    gain.gain.exponentialRampToValueAtTime(0.01, startTime + 0.2)

    osc.start(startTime)
    osc.stop(startTime + 0.2)
  }

  /**
   * Card Shelter - Soft magical whoosh
   */
  private playCardShelter(startTime: number, volume: number): void {
    const ctx = this.audioContext!
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()

    osc.connect(gain)
    gain.connect(ctx.destination)

    osc.type = 'sine'
    osc.frequency.setValueAtTime(600, startTime)
    osc.frequency.exponentialRampToValueAtTime(300, startTime + 0.3)

    gain.gain.setValueAtTime(volume * 0.2, startTime)
    gain.gain.exponentialRampToValueAtTime(0.01, startTime + 0.3)

    osc.start(startTime)
    osc.stop(startTime + 0.3)
  }

  /**
   * Card Recall - Reverse whoosh
   */
  private playCardRecall(startTime: number, volume: number): void {
    const ctx = this.audioContext!
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()

    osc.connect(gain)
    gain.connect(ctx.destination)

    osc.type = 'sine'
    osc.frequency.setValueAtTime(300, startTime)
    osc.frequency.exponentialRampToValueAtTime(600, startTime + 0.2)

    gain.gain.setValueAtTime(volume * 0.2, startTime)
    gain.gain.exponentialRampToValueAtTime(0.01, startTime + 0.2)

    osc.start(startTime)
    osc.stop(startTime + 0.2)
  }

  /**
   * Card Flip - Quick tick
   */
  private playCardFlip(startTime: number, volume: number): void {
    const ctx = this.audioContext!
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()

    osc.connect(gain)
    gain.connect(ctx.destination)

    osc.type = 'square'
    osc.frequency.setValueAtTime(200, startTime)

    gain.gain.setValueAtTime(volume * 0.1, startTime)
    gain.gain.exponentialRampToValueAtTime(0.01, startTime + 0.05)

    osc.start(startTime)
    osc.stop(startTime + 0.05)
  }

  /**
   * Coin Gain - Jingling coins
   */
  private playCoinGain(startTime: number, volume: number): void {
    const ctx = this.audioContext!

    // Multiple coin jingles
    for (let i = 0; i < 3; i++) {
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()

      osc.connect(gain)
      gain.connect(ctx.destination)

      osc.type = 'triangle'
      const freq = 800 + Math.random() * 400
      osc.frequency.setValueAtTime(freq, startTime + i * 0.04)

      gain.gain.setValueAtTime(volume * 0.2, startTime + i * 0.04)
      gain.gain.exponentialRampToValueAtTime(0.01, startTime + i * 0.04 + 0.15)

      osc.start(startTime + i * 0.04)
      osc.stop(startTime + i * 0.04 + 0.15)
    }
  }

  /**
   * Coin Spend - Lower coin sound
   */
  private playCoinSpend(startTime: number, volume: number): void {
    const ctx = this.audioContext!
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()

    osc.connect(gain)
    gain.connect(ctx.destination)

    osc.type = 'triangle'
    osc.frequency.setValueAtTime(700, startTime)
    osc.frequency.exponentialRampToValueAtTime(400, startTime + 0.1)

    gain.gain.setValueAtTime(volume * 0.25, startTime)
    gain.gain.exponentialRampToValueAtTime(0.01, startTime + 0.1)

    osc.start(startTime)
    osc.stop(startTime + 0.1)
  }

  /**
   * Coin Return - Bouncing coin
   */
  private playCoinReturn(startTime: number, volume: number): void {
    const ctx = this.audioContext!

    // Bouncing effect
    const bounces = [0, 0.08, 0.14, 0.18]
    bounces.forEach((delay, i) => {
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()

      osc.connect(gain)
      gain.connect(ctx.destination)

      osc.type = 'triangle'
      osc.frequency.setValueAtTime(900 - i * 100, startTime + delay)

      const vol = volume * 0.2 * (1 - i * 0.2)
      gain.gain.setValueAtTime(vol, startTime + delay)
      gain.gain.exponentialRampToValueAtTime(0.01, startTime + delay + 0.05)

      osc.start(startTime + delay)
      osc.stop(startTime + delay + 0.05)
    })
  }

  /**
   * Phase Hunting - Epic horn
   */
  private playPhaseHunting(startTime: number, volume: number): void {
    const ctx = this.audioContext!
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()

    osc.connect(gain)
    gain.connect(ctx.destination)

    osc.type = 'sawtooth'
    osc.frequency.setValueAtTime(220, startTime)
    osc.frequency.setValueAtTime(330, startTime + 0.1)

    gain.gain.setValueAtTime(volume * 0.3, startTime)
    gain.gain.exponentialRampToValueAtTime(0.01, startTime + 0.4)

    osc.start(startTime)
    osc.stop(startTime + 0.4)
  }

  /**
   * Phase Action - Quick alert
   */
  private playPhaseAction(startTime: number, volume: number): void {
    const ctx = this.audioContext!
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()

    osc.connect(gain)
    gain.connect(ctx.destination)

    osc.type = 'square'
    osc.frequency.setValueAtTime(440, startTime)
    osc.frequency.setValueAtTime(554, startTime + 0.05)

    gain.gain.setValueAtTime(volume * 0.2, startTime)
    gain.gain.exponentialRampToValueAtTime(0.01, startTime + 0.15)

    osc.start(startTime)
    osc.stop(startTime + 0.15)
  }

  /**
   * Turn Start - Bright chime
   */
  private playTurnStart(startTime: number, volume: number): void {
    const ctx = this.audioContext!
    const frequencies = [523.25, 659.25] // C5, E5

    frequencies.forEach((freq, i) => {
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()

      osc.connect(gain)
      gain.connect(ctx.destination)

      osc.type = 'sine'
      osc.frequency.setValueAtTime(freq, startTime + i * 0.06)

      gain.gain.setValueAtTime(volume * 0.25, startTime + i * 0.06)
      gain.gain.exponentialRampToValueAtTime(0.01, startTime + i * 0.06 + 0.4)

      osc.start(startTime + i * 0.06)
      osc.stop(startTime + i * 0.06 + 0.4)
    })
  }

  /**
   * Turn End - Descending tone
   */
  private playTurnEnd(startTime: number, volume: number): void {
    const ctx = this.audioContext!
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()

    osc.connect(gain)
    gain.connect(ctx.destination)

    osc.type = 'sine'
    osc.frequency.setValueAtTime(440, startTime)
    osc.frequency.exponentialRampToValueAtTime(220, startTime + 0.3)

    gain.gain.setValueAtTime(volume * 0.2, startTime)
    gain.gain.exponentialRampToValueAtTime(0.01, startTime + 0.3)

    osc.start(startTime)
    osc.stop(startTime + 0.3)
  }

  /**
   * Artifact Select - Magical sparkle
   */
  private playArtifactSelect(startTime: number, volume: number): void {
    const ctx = this.audioContext!

    // Sparkle effect with multiple tones
    const frequencies = [880, 1046.5, 1318.5] // A5, C6, E6
    frequencies.forEach((freq, i) => {
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()

      osc.connect(gain)
      gain.connect(ctx.destination)

      osc.type = 'sine'
      osc.frequency.setValueAtTime(freq, startTime + i * 0.05)

      gain.gain.setValueAtTime(volume * 0.15, startTime + i * 0.05)
      gain.gain.exponentialRampToValueAtTime(0.01, startTime + i * 0.05 + 0.3)

      osc.start(startTime + i * 0.05)
      osc.stop(startTime + i * 0.05 + 0.3)
    })
  }

  /**
   * Artifact Activate - Power-up sound
   */
  private playArtifactActivate(startTime: number, volume: number): void {
    const ctx = this.audioContext!
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()

    osc.connect(gain)
    gain.connect(ctx.destination)

    osc.type = 'sawtooth'
    osc.frequency.setValueAtTime(100, startTime)
    osc.frequency.exponentialRampToValueAtTime(600, startTime + 0.4)

    gain.gain.setValueAtTime(volume * 0.3, startTime)
    gain.gain.exponentialRampToValueAtTime(0.01, startTime + 0.4)

    osc.start(startTime)
    osc.stop(startTime + 0.4)
  }

  /**
   * Lightning - Dramatic thunder crack with rumble
   * Simulates the crack of lightning strike followed by rumbling thunder
   */
  private playLightning(startTime: number, volume: number): void {
    const ctx = this.audioContext!

    // Initial crack - very sharp and bright
    const crack = ctx.createOscillator()
    const crackGain = ctx.createGain()
    const crackFilter = ctx.createBiquadFilter()

    crack.connect(crackFilter)
    crackFilter.connect(crackGain)
    crackGain.connect(ctx.destination)

    crack.type = 'sawtooth'
    crack.frequency.setValueAtTime(2000, startTime)
    crack.frequency.exponentialRampToValueAtTime(50, startTime + 0.1)

    crackFilter.type = 'highpass'
    crackFilter.frequency.setValueAtTime(1000, startTime)
    crackFilter.frequency.exponentialRampToValueAtTime(100, startTime + 0.1)

    crackGain.gain.setValueAtTime(volume * 0.6, startTime)
    crackGain.gain.exponentialRampToValueAtTime(0.01, startTime + 0.1)

    crack.start(startTime)
    crack.stop(startTime + 0.1)

    // Thunder rumble - deep and sustained
    const rumble = ctx.createOscillator()
    const rumbleGain = ctx.createGain()
    const rumbleFilter = ctx.createBiquadFilter()

    rumble.connect(rumbleFilter)
    rumbleFilter.connect(rumbleGain)
    rumbleGain.connect(ctx.destination)

    rumble.type = 'sawtooth'
    rumble.frequency.setValueAtTime(80, startTime + 0.05)
    rumble.frequency.exponentialRampToValueAtTime(30, startTime + 0.8)

    rumbleFilter.type = 'lowpass'
    rumbleFilter.frequency.setValueAtTime(200, startTime + 0.05)
    rumbleFilter.Q.setValueAtTime(2, startTime + 0.05)

    rumbleGain.gain.setValueAtTime(volume * 0.4, startTime + 0.05)
    rumbleGain.gain.setValueAtTime(volume * 0.3, startTime + 0.2)
    rumbleGain.gain.exponentialRampToValueAtTime(0.01, startTime + 0.8)

    rumble.start(startTime + 0.05)
    rumble.stop(startTime + 0.8)

    // Electric crackle effect
    const crackle = ctx.createOscillator()
    const crackleGain = ctx.createGain()

    crackle.connect(crackleGain)
    crackleGain.connect(ctx.destination)

    crackle.type = 'square'
    crackle.frequency.setValueAtTime(1500, startTime + 0.02)
    crackle.frequency.exponentialRampToValueAtTime(800, startTime + 0.12)

    crackleGain.gain.setValueAtTime(volume * 0.25, startTime + 0.02)
    crackleGain.gain.exponentialRampToValueAtTime(0.01, startTime + 0.12)

    crackle.start(startTime + 0.02)
    crackle.stop(startTime + 0.12)

    // Impact thud for extra punch
    const impact = ctx.createOscillator()
    const impactGain = ctx.createGain()

    impact.connect(impactGain)
    impactGain.connect(ctx.destination)

    impact.type = 'sine'
    impact.frequency.setValueAtTime(60, startTime)
    impact.frequency.exponentialRampToValueAtTime(30, startTime + 0.15)

    impactGain.gain.setValueAtTime(volume * 0.5, startTime)
    impactGain.gain.exponentialRampToValueAtTime(0.01, startTime + 0.15)

    impact.start(startTime)
    impact.stop(startTime + 0.15)
  }

  /**
   * Button Click - Soft click
   */
  private playButtonClick(startTime: number, volume: number): void {
    const ctx = this.audioContext!
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()

    osc.connect(gain)
    gain.connect(ctx.destination)

    osc.type = 'sine'
    osc.frequency.setValueAtTime(800, startTime)

    gain.gain.setValueAtTime(volume * 0.15, startTime)
    gain.gain.exponentialRampToValueAtTime(0.01, startTime + 0.05)

    osc.start(startTime)
    osc.stop(startTime + 0.05)
  }

  /**
   * Button Confirm - Positive beep
   */
  private playButtonConfirm(startTime: number, volume: number): void {
    const ctx = this.audioContext!
    const frequencies = [659.25, 783.99] // E5, G5

    frequencies.forEach((freq, i) => {
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()

      osc.connect(gain)
      gain.connect(ctx.destination)

      osc.type = 'sine'
      osc.frequency.setValueAtTime(freq, startTime + i * 0.05)

      gain.gain.setValueAtTime(volume * 0.2, startTime + i * 0.05)
      gain.gain.exponentialRampToValueAtTime(0.01, startTime + i * 0.05 + 0.15)

      osc.start(startTime + i * 0.05)
      osc.stop(startTime + i * 0.05 + 0.15)
    })
  }

  /**
   * Button Cancel - Negative beep
   */
  private playButtonCancel(startTime: number, volume: number): void {
    const ctx = this.audioContext!
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()

    osc.connect(gain)
    gain.connect(ctx.destination)

    osc.type = 'square'
    osc.frequency.setValueAtTime(300, startTime)
    osc.frequency.setValueAtTime(200, startTime + 0.08)

    gain.gain.setValueAtTime(volume * 0.2, startTime)
    gain.gain.exponentialRampToValueAtTime(0.01, startTime + 0.15)

    osc.start(startTime)
    osc.stop(startTime + 0.15)
  }

  /**
   * Game Start - Fanfare
   */
  private playGameStart(startTime: number, volume: number): void {
    const ctx = this.audioContext!
    const melody = [
      { freq: 523.25, time: 0 },      // C5
      { freq: 659.25, time: 0.15 },   // E5
      { freq: 783.99, time: 0.3 },    // G5
      { freq: 1046.5, time: 0.45 },   // C6
    ]

    melody.forEach(({ freq, time }) => {
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()

      osc.connect(gain)
      gain.connect(ctx.destination)

      osc.type = 'sine'
      osc.frequency.setValueAtTime(freq, startTime + time)

      gain.gain.setValueAtTime(volume * 0.3, startTime + time)
      gain.gain.exponentialRampToValueAtTime(0.01, startTime + time + 0.4)

      osc.start(startTime + time)
      osc.stop(startTime + time + 0.4)
    })
  }

  /**
   * Game End - Closing tone
   */
  private playGameEnd(startTime: number, volume: number): void {
    const ctx = this.audioContext!
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()

    osc.connect(gain)
    gain.connect(ctx.destination)

    osc.type = 'sine'
    osc.frequency.setValueAtTime(523.25, startTime)
    osc.frequency.exponentialRampToValueAtTime(261.63, startTime + 0.5)

    gain.gain.setValueAtTime(volume * 0.3, startTime)
    gain.gain.exponentialRampToValueAtTime(0.01, startTime + 0.5)

    osc.start(startTime)
    osc.stop(startTime + 0.5)
  }

  /**
   * Victory - Triumphant melody
   */
  private playVictory(startTime: number, volume: number): void {
    const ctx = this.audioContext!
    const melody = [
      { freq: 523.25, time: 0 },      // C5
      { freq: 659.25, time: 0.12 },   // E5
      { freq: 783.99, time: 0.24 },   // G5
      { freq: 1046.5, time: 0.36 },   // C6
      { freq: 783.99, time: 0.48 },   // G5
      { freq: 1046.5, time: 0.6 },    // C6
    ]

    melody.forEach(({ freq, time }) => {
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()

      osc.connect(gain)
      gain.connect(ctx.destination)

      osc.type = 'sine'
      osc.frequency.setValueAtTime(freq, startTime + time)

      gain.gain.setValueAtTime(volume * 0.25, startTime + time)
      gain.gain.exponentialRampToValueAtTime(0.01, startTime + time + 0.3)

      osc.start(startTime + time)
      osc.stop(startTime + time + 0.3)
    })
  }

  // ============================================
  // SETTINGS
  // ============================================

  setMasterVolume(volume: number): void {
    this.settings.masterVolume = Math.max(0, Math.min(1, volume))
    this.saveSettings()
  }

  setSFXVolume(volume: number): void {
    this.settings.sfxVolume = Math.max(0, Math.min(1, volume))
    this.saveSettings()
  }

  setEnabled(enabled: boolean): void {
    this.settings.enabled = enabled
    this.saveSettings()
  }

  getSettings(): SoundSettings {
    return { ...this.settings }
  }
}

// Export singleton
export const soundService = new SoundGenerator()
export default soundService
