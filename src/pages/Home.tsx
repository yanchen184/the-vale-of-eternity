/**
 * Home page component
 * Enhanced with fantasy/medieval visual design
 * @version 2.0.0
 */
console.log('[pages/Home.tsx] v2.0.0 loaded')

import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Swords,
  Users,
  BookOpen,
  Monitor,
  Library,
  Sparkles,
  Shield,
  Crown,
  Gamepad2,
} from 'lucide-react'
import { Button, Input, Modal } from '@/components/ui'
import { useLobbyStore, useToastStore } from '@/stores'
import { signInAnon, getStoredPlayerName, setStoredPlayerName } from '@/services/auth'
import { createGame, joinGame } from '@/services/game'
import { APP_VERSION } from '@/data/constants'
import { cn } from '@/lib/utils'

// ============================================
// SUB COMPONENTS
// ============================================

interface MenuButtonProps {
  icon: React.ReactNode
  title: string
  subtitle?: string
  onClick: () => void
  variant?: 'primary' | 'secondary' | 'accent' | 'outline'
  testId?: string
}

function MenuButton({
  icon,
  title,
  subtitle,
  onClick,
  variant = 'secondary',
  testId,
}: MenuButtonProps) {
  const variantStyles = {
    primary: cn(
      'bg-gradient-to-r from-vale-600 via-vale-500 to-purple-600',
      'hover:from-vale-500 hover:via-vale-400 hover:to-purple-500',
      'shadow-lg shadow-vale-500/30 hover:shadow-vale-500/50',
      'border-vale-400/50'
    ),
    secondary: cn(
      'bg-gradient-to-r from-slate-700 via-slate-600 to-slate-700',
      'hover:from-slate-600 hover:via-slate-500 hover:to-slate-600',
      'shadow-lg shadow-slate-900/50',
      'border-slate-500/50'
    ),
    accent: cn(
      'bg-gradient-to-r from-amber-700 via-amber-600 to-amber-700',
      'hover:from-amber-600 hover:via-amber-500 hover:to-amber-600',
      'shadow-lg shadow-amber-900/50',
      'border-amber-400/50'
    ),
    outline: cn(
      'bg-slate-800/50',
      'hover:bg-slate-700/50',
      'border-slate-600/50 hover:border-slate-500/50'
    ),
  }

  return (
    <button
      onClick={onClick}
      className={cn(
        'relative w-full p-4 rounded-xl',
        'border-2 transition-all duration-300',
        'flex items-center gap-4',
        'group overflow-hidden',
        'focus:outline-none focus:ring-2 focus:ring-vale-400 focus:ring-offset-2 focus:ring-offset-slate-900',
        variantStyles[variant]
      )}
      data-testid={testId}
    >
      {/* Shine effect on hover */}
      <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-700 bg-gradient-to-r from-transparent via-white/10 to-transparent" />

      {/* Icon container */}
      <div
        className={cn(
          'relative flex items-center justify-center w-12 h-12 rounded-lg',
          'bg-slate-900/50 group-hover:bg-slate-900/70',
          'transition-all duration-300',
          'group-hover:scale-110'
        )}
      >
        {icon}
      </div>

      {/* Text content */}
      <div className="relative flex-1 text-left">
        <div className="text-lg font-bold text-slate-100 group-hover:text-white transition-colors">
          {title}
        </div>
        {subtitle && (
          <div className="text-sm text-slate-400 group-hover:text-slate-300 transition-colors">
            {subtitle}
          </div>
        )}
      </div>

      {/* Arrow indicator */}
      <div className="relative text-slate-500 group-hover:text-slate-300 group-hover:translate-x-1 transition-all">
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </div>
    </button>
  )
}

// ============================================
// MAIN COMPONENT
// ============================================

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
      toast.error('Please enter player name')
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

      toast.success(`Room created! Code: ${game.roomCode}`)
      navigate(`/lobby/${game.id}`)
    } catch (error) {
      toast.error('Failed to create room')
      console.error(error)
    } finally {
      setLoading(false)
      setShowCreateModal(false)
    }
  }

  const handleJoinGame = async () => {
    if (!tempName.trim()) {
      toast.error('Please enter player name')
      return
    }
    if (!roomCode.trim()) {
      toast.error('Please enter room code')
      return
    }

    setLoading(true)
    try {
      const user = await signInAnon()
      setPlayerName(tempName)
      setStoredPlayerName(tempName)

      const game = await joinGame(roomCode.toUpperCase(), user.uid, tempName)
      if (!game) {
        toast.error('Room not found')
        return
      }

      toast.success('Joined room successfully!')
      navigate(`/lobby/${game.id}`)
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to join room'
      toast.error(message)
      console.error(error)
    } finally {
      setLoading(false)
      setShowJoinModal(false)
    }
  }

  return (
    <div
      className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 flex flex-col relative overflow-hidden"
      data-testid="home-page"
    >
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* Gradient orbs */}
        <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-vale-500/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-0 right-1/4 w-[600px] h-[600px] bg-purple-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-amber-500/5 rounded-full blur-3xl" />

        {/* Decorative patterns */}
        <div className="absolute inset-0 opacity-5">
          <div
            className="absolute inset-0"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
            }}
          />
        </div>
      </div>

      {/* Header */}
      <header className="relative py-8 md:py-12 px-4 text-center">
        {/* Crown decoration */}
        <div className="flex justify-center mb-4">
          <div className="relative">
            <Crown className="w-12 h-12 text-amber-400 animate-pulse" />
            <Sparkles className="absolute -top-2 -right-2 w-5 h-5 text-amber-300" />
          </div>
        </div>

        {/* Title */}
        <h1 className="text-5xl md:text-7xl font-bold font-game mb-2">
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-vale-300 via-vale-400 to-purple-400 drop-shadow-lg">
            The Vale of Eternity
          </span>
        </h1>
        <p className="text-xl md:text-2xl text-slate-400 font-game tracking-wider">
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-amber-600">
            Become the Master of Elements
          </span>
        </p>

        {/* Version badge */}
        <div className="mt-4 inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-800/50 border border-slate-700/50">
          <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-xs text-slate-500">v{APP_VERSION}</span>
        </div>
      </header>

      {/* Main content */}
      <main className="relative flex-1 flex flex-col items-center justify-center gap-4 p-4 pb-8">
        <div className="w-full max-w-lg space-y-3">
          {/* Primary Action: Single Player Game */}
          <MenuButton
            icon={<Gamepad2 className="w-6 h-6 text-vale-400" />}
            title="Single Player"
            subtitle="Play with enhanced UI components"
            onClick={() => navigate('/gameboard')}
            variant="primary"
            testId="gameboard-btn"
          />

          {/* Multiplayer Online Mode (New) */}
          <MenuButton
            icon={<Users className="w-6 h-6 text-purple-400" />}
            title="Multiplayer Online"
            subtitle="Play with 2-4 players online (New!)"
            onClick={() => navigate('/multiplayer')}
            variant="accent"
            testId="multiplayer-online-btn"
          />

          {/* Local Battle (Legacy) */}
          <MenuButton
            icon={<Monitor className="w-6 h-6 text-slate-400" />}
            title="Local Battle (Classic)"
            subtitle="Play locally on this device"
            onClick={() => navigate('/local')}
            variant="secondary"
            testId="local-game-btn"
          />

          {/* Divider */}
          <div className="flex items-center gap-4 py-2">
            <div className="flex-1 h-px bg-gradient-to-r from-transparent via-slate-700 to-transparent" />
            <span className="text-xs text-slate-600 uppercase tracking-wider">Multiplayer</span>
            <div className="flex-1 h-px bg-gradient-to-r from-transparent via-slate-700 to-transparent" />
          </div>

          {/* Create Game */}
          <MenuButton
            icon={<Swords className="w-6 h-6 text-emerald-400" />}
            title="Create Game"
            subtitle="Host a new multiplayer room"
            onClick={() => {
              setTempName(playerName)
              setShowCreateModal(true)
            }}
            variant="secondary"
            testId="create-game-btn"
          />

          {/* Join Game */}
          <MenuButton
            icon={<Users className="w-6 h-6 text-blue-400" />}
            title="Join Game"
            subtitle="Enter a room code to join"
            onClick={() => {
              setTempName(playerName)
              setRoomCode('')
              setShowJoinModal(true)
            }}
            variant="secondary"
            testId="join-game-btn"
          />

          {/* Divider */}
          <div className="flex items-center gap-4 py-2">
            <div className="flex-1 h-px bg-gradient-to-r from-transparent via-slate-700 to-transparent" />
            <span className="text-xs text-slate-600 uppercase tracking-wider">Explore</span>
            <div className="flex-1 h-px bg-gradient-to-r from-transparent via-slate-700 to-transparent" />
          </div>

          {/* Card Gallery */}
          <MenuButton
            icon={<Library className="w-6 h-6 text-amber-400" />}
            title="Card Gallery"
            subtitle="Browse all 70 unique cards"
            onClick={() => navigate('/cards')}
            variant="accent"
            testId="card-gallery-btn"
          />

          {/* Tutorial */}
          <MenuButton
            icon={<BookOpen className="w-6 h-6 text-purple-400" />}
            title="Tutorial"
            subtitle="Learn the game rules"
            onClick={() => navigate('/tutorial')}
            variant="outline"
            testId="tutorial-btn"
          />
        </div>
      </main>

      {/* Footer */}
      <footer className="relative py-6 text-center">
        <div className="flex items-center justify-center gap-2 text-slate-600 text-sm">
          <Shield className="w-4 h-4" />
          <span>Built with React + Firebase</span>
        </div>
      </footer>

      {/* Create Game Modal */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="Create Game"
        size="md"
        footer={
          <>
            <Button variant="ghost" onClick={() => setShowCreateModal(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateGame} isLoading={isLoading}>
              Create
            </Button>
          </>
        }
      >
        <div className="space-y-5">
          <Input
            label="Player Name"
            placeholder="Enter your name"
            value={tempName}
            onChange={(e) => setTempName(e.target.value)}
            maxLength={20}
            data-testid="player-name-input"
          />

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-3">
              Max Players
            </label>
            <div className="flex gap-2">
              {([2, 3, 4] as const).map((num) => (
                <button
                  key={num}
                  onClick={() => setMaxPlayers(num)}
                  className={cn(
                    'flex-1 py-3 rounded-xl font-semibold transition-all duration-200',
                    'border-2',
                    maxPlayers === num
                      ? 'bg-vale-600 border-vale-400 text-white shadow-lg shadow-vale-500/30'
                      : 'bg-slate-800 border-slate-700 text-slate-400 hover:border-slate-600'
                  )}
                  data-testid={`max-players-${num}`}
                >
                  {num} Players
                </button>
              ))}
            </div>
          </div>

          <label className="flex items-center gap-3 p-4 rounded-xl bg-slate-800/50 border border-slate-700 cursor-pointer hover:border-slate-600 transition-colors">
            <input
              type="checkbox"
              checked={useExpansion}
              onChange={(e) => setUseExpansion(e.target.checked)}
              className="w-5 h-5 rounded border-slate-600 bg-slate-700 text-vale-500 focus:ring-vale-400 focus:ring-offset-slate-800"
              data-testid="use-expansion"
            />
            <div>
              <span className="text-slate-200 font-medium">Use Expansion Pack</span>
              <p className="text-sm text-slate-500">Adds 28 additional cards</p>
            </div>
          </label>
        </div>
      </Modal>

      {/* Join Game Modal */}
      <Modal
        isOpen={showJoinModal}
        onClose={() => setShowJoinModal(false)}
        title="Join Game"
        size="md"
        footer={
          <>
            <Button variant="ghost" onClick={() => setShowJoinModal(false)}>
              Cancel
            </Button>
            <Button onClick={handleJoinGame} isLoading={isLoading}>
              Join
            </Button>
          </>
        }
      >
        <div className="space-y-5">
          <Input
            label="Player Name"
            placeholder="Enter your name"
            value={tempName}
            onChange={(e) => setTempName(e.target.value)}
            maxLength={20}
            data-testid="player-name-input"
          />
          <Input
            label="Room Code"
            placeholder="Enter 6-digit code"
            value={roomCode}
            onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
            maxLength={6}
            className="uppercase tracking-[0.5em] text-center text-2xl font-mono"
            data-testid="room-code-input"
          />
        </div>
      </Modal>
    </div>
  )
}

export default Home
