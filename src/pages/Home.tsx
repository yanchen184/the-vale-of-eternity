/**
 * Home page component
 * @version 1.1.0
 */
console.log('[pages/Home.tsx] v1.1.0 loaded')

import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Swords, Users, BookOpen, Monitor, Library } from 'lucide-react'
import { Button, Input, Modal } from '@/components/ui'
import { useLobbyStore, useToastStore } from '@/stores'
import { signInAnon, getStoredPlayerName, setStoredPlayerName } from '@/services/auth'
import { createGame, joinGame } from '@/services/game'
import { APP_VERSION } from '@/data/constants'

export function Home() {
  const navigate = useNavigate()
  const { playerName, setPlayerName, setLoading, isLoading } = useLobbyStore()
  const toast = useToastStore()

  const [showJoinModal, setShowJoinModal] = useState(false)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [roomCode, setRoomCode] = useState('')
  const [tempName, setTempName] = useState('')
  const [maxPlayers, setMaxPlayers] = useState<2 | 3 | 4>(4)
  const [useExpansion, setUseExpansion] = useState(false)

  // Load stored player name on mount
  useEffect(() => {
    const stored = getStoredPlayerName()
    if (stored) {
      setPlayerName(stored)
      setTempName(stored)
    }
  }, [setPlayerName])

  const handleCreateGame = async () => {
    if (!tempName.trim()) {
      toast.error('請輸入玩家名稱')
      return
    }

    setLoading(true)
    try {
      const user = await signInAnon()
      setPlayerName(tempName)
      setStoredPlayerName(tempName)

      const game = await createGame(user.uid, tempName, {
        maxPlayers,
        useExpansion,
      })

      toast.success(`房間已建立！房號：${game.roomCode}`)
      navigate(`/lobby/${game.id}`)
    } catch (error) {
      toast.error('建立房間失敗，請稍後再試')
      console.error(error)
    } finally {
      setLoading(false)
      setShowCreateModal(false)
    }
  }

  const handleJoinGame = async () => {
    if (!tempName.trim()) {
      toast.error('請輸入玩家名稱')
      return
    }
    if (!roomCode.trim()) {
      toast.error('請輸入房間代碼')
      return
    }

    setLoading(true)
    try {
      const user = await signInAnon()
      setPlayerName(tempName)
      setStoredPlayerName(tempName)

      const game = await joinGame(roomCode.toUpperCase(), user.uid, tempName)
      if (!game) {
        toast.error('找不到該房間')
        return
      }

      toast.success('成功加入房間！')
      navigate(`/lobby/${game.id}`)
    } catch (error) {
      const message = error instanceof Error ? error.message : '加入房間失敗'
      toast.error(message)
      console.error(error)
    } finally {
      setLoading(false)
      setShowJoinModal(false)
    }
  }

  return (
    <div
      className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 flex flex-col"
      data-testid="home-page"
    >
      {/* Header */}
      <header className="py-6 px-4 text-center">
        <h1 className="text-4xl md:text-6xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-vale-400 to-purple-400 font-game">
          永恆之谷
        </h1>
        <p className="text-lg md:text-xl text-slate-400 mt-2">The Vale of Eternity</p>
        <p className="text-xs text-slate-600 mt-1">v{APP_VERSION}</p>
      </header>

      {/* Main content */}
      <main className="flex-1 flex flex-col items-center justify-center gap-6 p-4">
        <div className="w-full max-w-md space-y-4">
          {/* Local Game Button (MVP) */}
          <Button
            size="lg"
            className="w-full py-6 text-lg bg-gradient-to-r from-vale-600 to-purple-600 hover:from-vale-500 hover:to-purple-500"
            leftIcon={<Monitor className="h-6 w-6" />}
            onClick={() => navigate('/local')}
            data-testid="local-game-btn"
          >
            本地對戰 (MVP)
          </Button>

          {/* Create Game Button */}
          <Button
            size="lg"
            className="w-full py-6 text-lg"
            leftIcon={<Swords className="h-6 w-6" />}
            onClick={() => {
              setTempName(playerName)
              setShowCreateModal(true)
            }}
            data-testid="create-game-btn"
          >
            建立遊戲
          </Button>

          {/* Join Game Button */}
          <Button
            size="lg"
            variant="secondary"
            className="w-full py-6 text-lg"
            leftIcon={<Users className="h-6 w-6" />}
            onClick={() => {
              setTempName(playerName)
              setRoomCode('')
              setShowJoinModal(true)
            }}
            data-testid="join-game-btn"
          >
            加入遊戲
          </Button>

          {/* Card Gallery Button */}
          <Button
            size="lg"
            variant="outline"
            className="w-full py-6 text-lg border-amber-600 text-amber-400 hover:bg-amber-900/20"
            leftIcon={<Library className="h-6 w-6" />}
            onClick={() => navigate('/cards')}
            data-testid="card-gallery-btn"
          >
            查看卡片圖鑑
          </Button>

          {/* Tutorial Button */}
          <Button
            size="lg"
            variant="outline"
            className="w-full py-6 text-lg"
            leftIcon={<BookOpen className="h-6 w-6" />}
            onClick={() => navigate('/tutorial')}
            data-testid="tutorial-btn"
          >
            遊戲教學
          </Button>
        </div>
      </main>

      {/* Footer */}
      <footer className="py-4 text-center text-slate-600 text-sm">
        <p>Made with React + Firebase</p>
      </footer>

      {/* Create Game Modal */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="建立遊戲"
        footer={
          <>
            <Button variant="ghost" onClick={() => setShowCreateModal(false)}>
              取消
            </Button>
            <Button onClick={handleCreateGame} isLoading={isLoading}>
              建立
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <Input
            label="玩家名稱"
            placeholder="輸入你的名稱"
            value={tempName}
            onChange={e => setTempName(e.target.value)}
            maxLength={20}
            data-testid="player-name-input"
          />

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              最大玩家數
            </label>
            <div className="flex gap-2">
              {([2, 3, 4] as const).map(num => (
                <Button
                  key={num}
                  variant={maxPlayers === num ? 'primary' : 'outline'}
                  size="sm"
                  onClick={() => setMaxPlayers(num)}
                  data-testid={`max-players-${num}`}
                >
                  {num} 人
                </Button>
              ))}
            </div>
          </div>

          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={useExpansion}
              onChange={e => setUseExpansion(e.target.checked)}
              className="w-5 h-5 rounded border-slate-600 bg-slate-700 text-vale-500 focus:ring-vale-400"
              data-testid="use-expansion"
            />
            <span className="text-slate-300">使用擴充卡包 (28張)</span>
          </label>
        </div>
      </Modal>

      {/* Join Game Modal */}
      <Modal
        isOpen={showJoinModal}
        onClose={() => setShowJoinModal(false)}
        title="加入遊戲"
        footer={
          <>
            <Button variant="ghost" onClick={() => setShowJoinModal(false)}>
              取消
            </Button>
            <Button onClick={handleJoinGame} isLoading={isLoading}>
              加入
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <Input
            label="玩家名稱"
            placeholder="輸入你的名稱"
            value={tempName}
            onChange={e => setTempName(e.target.value)}
            maxLength={20}
            data-testid="player-name-input"
          />
          <Input
            label="房間代碼"
            placeholder="輸入 6 位房間代碼"
            value={roomCode}
            onChange={e => setRoomCode(e.target.value.toUpperCase())}
            maxLength={6}
            className="uppercase tracking-widest text-center text-xl"
            data-testid="room-code-input"
          />
        </div>
      </Modal>
    </div>
  )
}

export default Home
