/**
 * Sound Test Page
 * Test all game sounds with visual controls
 * @version 1.0.0
 */
console.log('[pages/SoundTest.tsx] v1.0.0 loaded')

import { useState } from 'react'
import { useSound, SoundType } from '@/hooks/useSound'
import { Button } from '@/components/ui/Button'
import { GlassCard } from '@/components/ui/GlassCard'

export function SoundTest() {
  const { play, setMasterVolume, setSFXVolume, setEnabled, getSettings } = useSound()
  const [settings, setSettings] = useState(getSettings())

  const handleMasterVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const volume = parseFloat(e.target.value)
    setMasterVolume(volume)
    setSettings(getSettings())
  }

  const handleSFXVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const volume = parseFloat(e.target.value)
    setSFXVolume(volume)
    setSettings(getSettings())
  }

  const handleToggleSound = () => {
    setEnabled(!settings.enabled)
    setSettings(getSettings())
  }

  const soundCategories = {
    '卡牌操作': [
      { type: SoundType.CARD_DRAW, label: '抽牌' },
      { type: SoundType.CARD_SELECT, label: '選擇卡牌' },
      { type: SoundType.CARD_DESELECT, label: '取消選擇' },
      { type: SoundType.CARD_BUY, label: '購買卡牌' },
      { type: SoundType.CARD_SELL, label: '出售卡牌' },
      { type: SoundType.CARD_SHELTER, label: '棲息地' },
      { type: SoundType.CARD_RECALL, label: '召回卡牌' },
      { type: SoundType.CARD_FLIP, label: '翻牌' },
    ],
    '金錢操作': [
      { type: SoundType.COIN_GAIN, label: '獲得金幣' },
      { type: SoundType.COIN_SPEND, label: '支付金幣' },
      { type: SoundType.COIN_RETURN, label: '歸還金幣' },
    ],
    '遊戲階段': [
      { type: SoundType.PHASE_HUNTING, label: '狩獵階段' },
      { type: SoundType.PHASE_ACTION, label: '行動階段' },
      { type: SoundType.TURN_START, label: '回合開始' },
      { type: SoundType.TURN_END, label: '回合結束' },
    ],
    '神器': [
      { type: SoundType.ARTIFACT_SELECT, label: '選擇神器' },
      { type: SoundType.ARTIFACT_ACTIVATE, label: '啟動神器' },
    ],
    'UI 互動': [
      { type: SoundType.BUTTON_CLICK, label: '按鈕點擊' },
      { type: SoundType.BUTTON_CONFIRM, label: '確認' },
      { type: SoundType.BUTTON_CANCEL, label: '取消' },
    ],
    '遊戲事件': [
      { type: SoundType.GAME_START, label: '遊戲開始' },
      { type: SoundType.GAME_END, label: '遊戲結束' },
      { type: SoundType.VICTORY, label: '勝利' },
    ],
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400 mb-4">
            音效測試
          </h1>
          <p className="text-slate-300">測試所有遊戲音效</p>
        </div>

        {/* Controls */}
        <GlassCard className="mb-8 p-6">
          <div className="space-y-6">
            {/* Enable/Disable */}
            <div className="flex items-center justify-between">
              <span className="text-lg font-semibold text-white">音效開關</span>
              <button
                onClick={handleToggleSound}
                className={`px-6 py-2 rounded-lg font-medium transition-colors ${
                  settings.enabled
                    ? 'bg-emerald-600 hover:bg-emerald-500 text-white'
                    : 'bg-slate-600 hover:bg-slate-500 text-slate-300'
                }`}
              >
                {settings.enabled ? '已開啟' : '已關閉'}
              </button>
            </div>

            {/* Master Volume */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-medium text-slate-300">
                  主音量
                </label>
                <span className="text-sm text-purple-400">
                  {Math.round(settings.masterVolume * 100)}%
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={settings.masterVolume}
                onChange={handleMasterVolumeChange}
                className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-purple-500"
              />
            </div>

            {/* SFX Volume */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-medium text-slate-300">
                  音效音量
                </label>
                <span className="text-sm text-purple-400">
                  {Math.round(settings.sfxVolume * 100)}%
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={settings.sfxVolume}
                onChange={handleSFXVolumeChange}
                className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-purple-500"
              />
            </div>
          </div>
        </GlassCard>

        {/* Sound Categories */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Object.entries(soundCategories).map(([category, sounds]) => (
            <GlassCard key={category} className="p-6">
              <h2 className="text-xl font-bold text-purple-300 mb-4">
                {category}
              </h2>
              <div className="space-y-2">
                {sounds.map(({ type, label }) => (
                  <button
                    key={type}
                    onClick={() => play(type)}
                    className="w-full px-4 py-3 bg-slate-700/50 hover:bg-slate-600/50 rounded-lg text-left text-slate-200 transition-colors border border-slate-600/50 hover:border-purple-500/50"
                  >
                    {label}
                  </button>
                ))}
              </div>
            </GlassCard>
          ))}
        </div>

        {/* Back Button */}
        <div className="mt-8 text-center">
          <Button
            variant="secondary"
            onClick={() => window.history.back()}
            className="px-8"
          >
            返回
          </Button>
        </div>
      </div>
    </div>
  )
}

export default SoundTest
