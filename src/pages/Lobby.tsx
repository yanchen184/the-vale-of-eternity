/**
 * Lobby page component for MVP 1.0
 * Start a local multiplayer game
 * @version 1.0.0
 */
console.log('[pages/Lobby.tsx] v1.0.0 loaded')

import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Play, Users, Info } from 'lucide-react'
import { Button } from '@/components/ui'
import { useGameStore } from '@/stores'

export function Lobby() {
  const navigate = useNavigate()
  const initGame = useGameStore(state => state.initGame)
  const [player1Name, setPlayer1Name] = useState('Player 1')
  const [player2Name, setPlayer2Name] = useState('Player 2')
  const [isLoading, setIsLoading] = useState(false)

  const handleStartGame = async () => {
    setIsLoading(true)
    try {
      initGame(player1Name || 'Player 1', player2Name || 'Player 2')
      navigate('/game/local')
    } catch (error) {
      console.error('Failed to start game:', error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div
      className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 p-4"
      data-testid="lobby-page"
    >
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <header className="text-center py-8">
          <h1 className="text-4xl font-bold text-slate-100">The Vale of Eternity</h1>
          <p className="mt-2 text-slate-400">Local Multiplayer - MVP 1.0</p>
        </header>

        {/* Game Setup */}
        <section className="mt-8 bg-slate-800/50 rounded-xl p-6 border border-slate-700">
          <div className="flex items-center gap-2 mb-6">
            <Users className="h-5 w-5 text-slate-400" />
            <h2 className="text-lg font-semibold text-slate-200">Player Setup</h2>
          </div>

          <div className="space-y-4">
            {/* Player 1 */}
            <div>
              <label htmlFor="player1" className="block text-sm text-slate-400 mb-2">
                Player 1 Name
              </label>
              <input
                id="player1"
                type="text"
                value={player1Name}
                onChange={e => setPlayer1Name(e.target.value)}
                placeholder="Enter name..."
                className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-slate-100 placeholder-slate-500 focus:outline-none focus:border-vale-500"
                data-testid="player1-input"
              />
            </div>

            {/* Player 2 */}
            <div>
              <label htmlFor="player2" className="block text-sm text-slate-400 mb-2">
                Player 2 Name
              </label>
              <input
                id="player2"
                type="text"
                value={player2Name}
                onChange={e => setPlayer2Name(e.target.value)}
                placeholder="Enter name..."
                className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-slate-100 placeholder-slate-500 focus:outline-none focus:border-vale-500"
                data-testid="player2-input"
              />
            </div>
          </div>
        </section>

        {/* Game Info */}
        <section className="mt-6 bg-slate-800/30 rounded-xl p-6 border border-slate-700">
          <div className="flex items-center gap-2 mb-4">
            <Info className="h-5 w-5 text-slate-400" />
            <h3 className="text-sm font-medium text-slate-400">Game Rules</h3>
          </div>
          <ul className="text-sm text-slate-500 space-y-2">
            <li>- 2 players take turns on the same device (hot-seat)</li>
            <li>- Each round has 3 phases: Hunting, Action, Resolution</li>
            <li>- Win by reaching 60 points or having the highest score after 10 rounds</li>
            <li>- Collect creatures, build synergies, and manage your stones wisely!</li>
          </ul>
        </section>

        {/* Start Button */}
        <div className="mt-8">
          <Button
            className="w-full py-4 text-lg"
            leftIcon={<Play className="h-6 w-6" />}
            onClick={handleStartGame}
            isLoading={isLoading}
            data-testid="start-game-btn"
          >
            Start Game
          </Button>
        </div>

        {/* Version Info */}
        <div className="mt-8 text-center text-slate-600 text-sm">
          MVP 1.0.0 | 20 Cards | Local Multiplayer
        </div>
      </div>
    </div>
  )
}

export default Lobby
