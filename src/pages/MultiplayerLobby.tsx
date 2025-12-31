/**
 * Multiplayer Lobby Page for The Vale of Eternity
 * Allows creating/joining game rooms
 * @version 4.2.0 - Updated game rules with zone bonus system and detailed mechanics
 */
console.log('[pages/MultiplayerLobby.tsx] v4.2.0 loaded')

import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { multiplayerGameService } from '@/services/multiplayer-game'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { Input } from '@/components/ui/Input'

export const MultiplayerLobby: React.FC = () => {
  const navigate = useNavigate()
  const [playerName, setPlayerName] = useState('')
  const [roomCode, setRoomCode] = useState('')
  const [maxPlayers, setMaxPlayers] = useState<2 | 3 | 4>(2)
  const [isExpansionMode, setIsExpansionMode] = useState(true) // Default to expansion mode (includes DLC)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showJoinModal, setShowJoinModal] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  // Generate random player ID on mount
  const [playerId] = useState(() => `player_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`)

  const handleCreateRoom = async () => {
    if (!playerName.trim()) {
      setError('請輸入玩家名稱')
      return
    }

    setIsLoading(true)
    setError('')

    try {
      const { gameId, roomCode: newRoomCode } = await multiplayerGameService.createRoom(
        playerId,
        playerName,
        maxPlayers,
        isExpansionMode
      )

      console.log(`[MultiplayerLobby] Room created: ${newRoomCode}`)

      // Navigate to game room
      navigate(`/multiplayer/${gameId}`, {
        state: { playerId, playerName, roomCode: newRoomCode, isHost: true },
      })
    } catch (err: any) {
      setError(err.message || '建立房間失敗')
    } finally {
      setIsLoading(false)
    }
  }

  const handleJoinRoom = async () => {
    if (!playerName.trim()) {
      setError('請輸入玩家名稱')
      return
    }

    if (!roomCode.trim()) {
      setError('請輸入房間代碼')
      return
    }

    setIsLoading(true)
    setError('')

    try {
      const gameId = await multiplayerGameService.joinRoom(roomCode, playerId, playerName)

      console.log(`[MultiplayerLobby] Joined room: ${roomCode}`)

      // Navigate to game room
      navigate(`/multiplayer/${gameId}`, {
        state: { playerId, playerName, roomCode, isHost: false },
      })
    } catch (err: any) {
      setError(err.message || '加入房間失敗')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-indigo-900 to-blue-900 p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold text-white mb-4">永恆之谷</h1>
          <h2 className="text-3xl font-semibold text-purple-300 mb-2">The Vale of Eternity</h2>
          <p className="text-lg text-purple-200">多人線上模式</p>
        </div>

        {/* Main Menu */}
        <div className="bg-white/10 backdrop-blur-md rounded-2xl p-8 shadow-2xl">
          <div className="space-y-6">
            {/* Create Room Button */}
            <Button
              variant="primary"
              size="lg"
              onClick={() => setShowCreateModal(true)}
              className="w-full text-xl py-6"
            >
              建立遊戲房間
            </Button>

            {/* Join Room Button */}
            <Button
              variant="secondary"
              size="lg"
              onClick={() => setShowJoinModal(true)}
              className="w-full text-xl py-6"
            >
              加入遊戲房間
            </Button>

            {/* Back to Home */}
            <Button
              variant="outline"
              size="lg"
              onClick={() => navigate('/')}
              className="w-full text-xl py-6"
            >
              返回首頁
            </Button>
          </div>
        </div>

        {/* Game Info */}
        <div className="mt-8 bg-white/5 backdrop-blur-sm rounded-xl p-6">
          <h3 className="text-xl font-semibold text-white mb-4">遊戲規則</h3>
          <div className="space-y-4 text-purple-200">
            {/* Basic Info */}
            <div>
              <h4 className="text-lg font-semibold text-purple-300 mb-2">🎮 基本資訊</h4>
              <ul className="space-y-1.5 ml-4">
                <li>• 支援 2-4 人線上對戰</li>
                <li>• 回合制卡牌對戰，每回合包含選牌和行動兩個階段</li>
                <li>• 遊戲由房主決定何時結束並計分</li>
              </ul>
            </div>

            {/* Hunting Phase */}
            <div>
              <h4 className="text-lg font-semibold text-amber-300 mb-2">🎯 選牌階段 (Hunting Phase)</h4>
              <ul className="space-y-1.5 ml-4">
                <li>• Snake Draft 蛇形選牌：6 張市場卡輪流挑選</li>
                <li>• 第一輪：正序選牌（玩家 1→2→3→4）</li>
                <li>• 第二輪：逆序選牌（玩家 4→3→2→1）</li>
                <li>• 最後一位玩家兩輪都選 2 張（其他玩家各選 1 張）</li>
              </ul>
            </div>

            {/* Action Phase */}
            <div>
              <h4 className="text-lg font-semibold text-emerald-300 mb-2">⚔️ 行動階段 (Action Phase)</h4>
              <ul className="space-y-1.5 ml-4">
                <li>• <span className="text-cyan-300 font-semibold">馴服生物</span>：從手牌打出怪獸到場上（消耗石頭）</li>
                <li>• <span className="text-amber-300 font-semibold">販賣卡片</span>：賣掉手牌換取石頭（依元素不同獲得不同石頭）</li>
                <li>• <span className="text-slate-300 font-semibold">Pass</span>：跳過行動，等待其他玩家</li>
                <li>• <span className="text-purple-300 font-semibold">區域指示物</span>：在自己回合可切換 +0/+1/+2（增加場地上限）</li>
              </ul>
            </div>

            {/* Field Limit */}
            <div>
              <h4 className="text-lg font-semibold text-cyan-300 mb-2">🏟️ 場地上限機制</h4>
              <ul className="space-y-1.5 ml-4">
                <li>• 場上最多怪獸數 = <span className="text-amber-300 font-bold">當前回合數</span> + <span className="text-cyan-300 font-bold">區域加成</span></li>
                <li>• 例如：回合 2 + 區域 +1 = 最多可有 3 隻怪獸</li>
                <li>• 區域指示物可在行動階段切換（0→1→2→0 循環）</li>
              </ul>
            </div>

            {/* Economy */}
            <div>
              <h4 className="text-lg font-semibold text-yellow-300 mb-2">💰 石頭經濟系統</h4>
              <ul className="space-y-1.5 ml-4">
                <li>• <span className="text-amber-300 font-semibold">通用石頭</span>：1️⃣ 1分、3️⃣ 3分、6️⃣ 6分（用來支付費用）</li>
                <li>• <span className="text-cyan-300 font-semibold">元素石頭</span>：💧 水、🔥 火、🌳 土、🌸 風（計分時每個 1 分）</li>
                <li>• <span className="text-rose-300 font-semibold">賣牌獲得石頭</span>：
                  <ul className="mt-1 ml-4 space-y-0.5 text-sm">
                    <li>- 🔥 火元素 → 3 個 1️⃣ (3分)</li>
                    <li>- 💧 水元素 → 1 個 3️⃣ (3分)</li>
                    <li>- 🐉 龍元素 → 1 個 6️⃣ (6分)</li>
                    <li>- 🌸 風元素 → 1 個 3️⃣ + 1 個 1️⃣ (4分)</li>
                    <li>- 🌳 土元素 → 4 個 1️⃣ (4分)</li>
                  </ul>
                </li>
              </ul>
            </div>

            {/* Scoring */}
            <div>
              <h4 className="text-lg font-semibold text-rose-300 mb-2">🏆 計分與結算</h4>
              <ul className="space-y-1.5 ml-4">
                <li>• <span className="text-amber-300 font-semibold">結算時機</span>：全部玩家 Pass 後進入 RESOLUTION 階段，房主決定是否結束遊戲</li>
                <li>• <span className="text-cyan-300 font-semibold">計分項目</span>：
                  <ul className="mt-1 ml-4 space-y-0.5 text-sm">
                    <li>① 場上怪獸的基礎分數</li>
                    <li>② 怪獸的 ON_SCORE 效果加成</li>
                    <li>③ 持有的石頭分數（元素石頭各 1 分，通用石頭按面值）</li>
                  </ul>
                </li>
                <li>• <span className="text-purple-300 font-semibold">勝利條件</span>：遊戲結束時，總分最高的玩家獲勝</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Create Room Modal */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => {
          setShowCreateModal(false)
          setError('')
        }}
        title="建立遊戲房間"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">玩家名稱</label>
            <Input
              value={playerName}
              onChange={e => setPlayerName(e.target.value)}
              placeholder="請輸入您的名字"
              disabled={isLoading}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">最大玩家數</label>
            <div className="flex gap-2">
              {[2, 3, 4].map(num => (
                <button
                  key={num}
                  onClick={() => setMaxPlayers(num as 2 | 3 | 4)}
                  disabled={isLoading}
                  className={`flex-1 py-3 rounded-lg font-semibold transition-colors ${
                    maxPlayers === num
                      ? 'bg-purple-600 text-white'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  } ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  {num} 人
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">遊戲模式</label>
            <div className="flex gap-2">
              <button
                onClick={() => setIsExpansionMode(false)}
                disabled={isLoading}
                className={`flex-1 py-3 rounded-lg font-semibold transition-colors ${
                  !isExpansionMode
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                } ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                基礎版
              </button>
              <button
                onClick={() => setIsExpansionMode(true)}
                disabled={isLoading}
                className={`flex-1 py-3 rounded-lg font-semibold transition-colors ${
                  isExpansionMode
                    ? 'bg-amber-600 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                } ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                擴充版 🏺
              </button>
            </div>
            {isExpansionMode && (
              <p className="mt-2 text-xs text-amber-700 bg-amber-50 p-2 rounded">
                ✨ 擴充版包含：28張DLC卡片 + 11個神器（每回合選擇）
              </p>
            )}
          </div>

          {error && <div className="text-sm text-red-600 bg-red-50 p-3 rounded">{error}</div>}

          <div className="flex gap-3">
            <Button
              variant="secondary"
              onClick={() => {
                setShowCreateModal(false)
                setError('')
              }}
              disabled={isLoading}
              className="flex-1"
            >
              取消
            </Button>
            <Button
              variant="primary"
              onClick={handleCreateRoom}
              disabled={isLoading || !playerName.trim()}
              className="flex-1"
            >
              {isLoading ? '建立中...' : '建立房間'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Join Room Modal */}
      <Modal
        isOpen={showJoinModal}
        onClose={() => {
          setShowJoinModal(false)
          setError('')
        }}
        title="加入遊戲房間"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">玩家名稱</label>
            <Input
              value={playerName}
              onChange={e => setPlayerName(e.target.value)}
              placeholder="請輸入您的名字"
              disabled={isLoading}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">房間代碼</label>
            <Input
              value={roomCode}
              onChange={e => setRoomCode(e.target.value)}
              placeholder="請輸入 6 位數房間代碼"
              maxLength={6}
              disabled={isLoading}
            />
          </div>

          {error && <div className="text-sm text-red-600 bg-red-50 p-3 rounded">{error}</div>}

          <div className="flex gap-3">
            <Button
              variant="secondary"
              onClick={() => {
                setShowJoinModal(false)
                setError('')
              }}
              disabled={isLoading}
              className="flex-1"
            >
              取消
            </Button>
            <Button
              variant="primary"
              onClick={handleJoinRoom}
              disabled={isLoading || !playerName.trim() || !roomCode.trim()}
              className="flex-1"
            >
              {isLoading ? '加入中...' : '加入房間'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
