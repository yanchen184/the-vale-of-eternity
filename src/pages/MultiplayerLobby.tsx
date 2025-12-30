/**
 * Multiplayer Lobby Page for The Vale of Eternity
 * Allows creating/joining game rooms
 * @version 3.1.0
 */
console.log('[pages/MultiplayerLobby.tsx] v3.1.0 loaded')

import React, { useState, useEffect } from 'react'
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
        maxPlayers
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
          <ul className="space-y-2 text-purple-200">
            <li>• 支援 2-4 人線上對戰</li>
            <li>• Hunting Phase：Snake Draft 選卡（6 張市場）</li>
            <li>• Action Phase：馴服生物、販賣卡片或 Pass</li>
            <li>• 石頭經濟系統：7 種石頭（1️⃣ 3️⃣ 6️⃣ 💧 🔥 🌳 🌸）</li>
            <li>• 全部玩家 Pass 後進入計分</li>
          </ul>
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
