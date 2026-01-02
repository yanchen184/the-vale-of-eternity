/**
 * useSound Hook
 * React hook for playing game sounds
 * @version 1.0.0
 */

import { useCallback, useEffect } from 'react'
import { soundService, SoundType } from '@/services/sound-generator'

export function useSound() {
  // Initialize audio context on user interaction
  useEffect(() => {
    const initAudio = () => {
      // Play silent sound to initialize audio context
      soundService.play(SoundType.BUTTON_CLICK)
      document.removeEventListener('click', initAudio)
      document.removeEventListener('keydown', initAudio)
    }

    document.addEventListener('click', initAudio, { once: true })
    document.addEventListener('keydown', initAudio, { once: true })

    return () => {
      document.removeEventListener('click', initAudio)
      document.removeEventListener('keydown', initAudio)
    }
  }, [])

  const play = useCallback((type: SoundType) => {
    soundService.play(type)
  }, [])

  const setMasterVolume = useCallback((volume: number) => {
    soundService.setMasterVolume(volume)
  }, [])

  const setSFXVolume = useCallback((volume: number) => {
    soundService.setSFXVolume(volume)
  }, [])

  const setEnabled = useCallback((enabled: boolean) => {
    soundService.setEnabled(enabled)
  }, [])

  const getSettings = useCallback(() => {
    return soundService.getSettings()
  }, [])

  return {
    play,
    setMasterVolume,
    setSFXVolume,
    setEnabled,
    getSettings,
  }
}

export { SoundType }
export default useSound
