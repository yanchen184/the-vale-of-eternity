/**
 * Lobby page component for Single Player Mode v4.0.0
 * Start a unified Firebase single-player game
 * @version 4.0.0
 */
console.log('[pages/Lobby.tsx] v4.0.0 loaded - Unified Firebase')

import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Play, User, Info, Library } from 'lucide-react'
import { Button } from '@/components/ui'

export function Lobby() {
  const navigate = useNavigate()
  const [playerName, setPlayerName] = useState(
    localStorage.getItem('playerName') || 'Player'
  )
  const [expansionMode, setExpansionMode] = useState(
    localStorage.getItem('expansionMode') === 'true'
  )
  const [isLoading, setIsLoading] = useState(false)

  const handleStartGame = async () => {
    setIsLoading(true)
    try {
      // Save player name and expansion mode
      localStorage.setItem('playerName', playerName || 'Player')
      localStorage.setItem('expansionMode', expansionMode.toString())

      // Navigate to unified game page (which creates Firebase game and redirects)
      navigate('/game')
    } catch (error) {
      console.error('Failed to start game:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleViewCards = () => {
    navigate('/cards')
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
          <p className="mt-2 text-slate-400">Single Player Mode - v3.0.0</p>
        </header>

        {/* Game Setup */}
        <section className="mt-8 bg-slate-800/50 rounded-xl p-6 border border-slate-700">
          <div className="flex items-center gap-2 mb-6">
            <User className="h-5 w-5 text-slate-400" />
            <h2 className="text-lg font-semibold text-slate-200">Player Setup</h2>
          </div>

          <div className="space-y-4">
            {/* Player Name */}
            <div>
              <label htmlFor="playerName" className="block text-sm text-slate-400 mb-2">
                Your Name
              </label>
              <input
                id="playerName"
                type="text"
                value={playerName}
                onChange={e => setPlayerName(e.target.value)}
                placeholder="Enter your name..."
                className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-slate-100 placeholder-slate-500 focus:outline-none focus:border-vale-500"
                data-testid="player-name-input"
              />
            </div>

            {/* Expansion Mode Toggle */}
            <div className="flex items-center justify-between p-3 bg-slate-700/50 rounded-lg">
              <div>
                <label htmlFor="expansionMode" className="text-sm text-slate-300 cursor-pointer">
                  Expansion Mode
                </label>
                <p className="text-xs text-slate-500 mt-1">Include artifacts and advanced mechanics</p>
              </div>
              <input
                id="expansionMode"
                type="checkbox"
                checked={expansionMode}
                onChange={e => setExpansionMode(e.target.checked)}
                className="w-5 h-5 rounded bg-slate-600 border-slate-500 text-vale-500 focus:ring-vale-500 cursor-pointer"
                data-testid="expansion-mode-toggle"
              />
            </div>
          </div>
        </section>

        {/* Game Info */}
        <section className="mt-6 bg-slate-800/30 rounded-xl p-6 border border-slate-700">
          <div className="flex items-center gap-2 mb-4">
            <Info className="h-5 w-5 text-slate-400" />
            <h3 className="text-sm font-medium text-slate-400">How to Play</h3>
          </div>
          <ul className="text-sm text-slate-500 space-y-2">
            <li>1. Draw Phase: Draw 1 card from the deck</li>
            <li>2. Action Phase: Tame creatures from hand or market by paying stone costs</li>
            <li>3. Build your collection to maximize your score</li>
            <li>4. Game ends when deck is empty or you choose to end</li>
            <li>5. Final score = Card points + Effect bonuses + Stone value</li>
          </ul>
        </section>

        {/* Stone Economy Info */}
        <section className="mt-6 bg-slate-800/30 rounded-xl p-6 border border-slate-700">
          <div className="flex items-center gap-2 mb-4">
            <span className="text-lg">&#128142;</span>
            <h3 className="text-sm font-medium text-slate-400">Stone Economy</h3>
          </div>
          <ul className="text-sm text-slate-500 space-y-2">
            <li>- 7 types of stones: 1-point, 3-point, 6-point, and 4 element types</li>
            <li>- Pay stone costs to tame creatures</li>
            <li>- Element stones can be used for matching element cards</li>
            <li>- Earn stones through card effects</li>
          </ul>
        </section>

        {/* Action Buttons */}
        <div className="mt-8 space-y-4">
          <Button
            className="w-full py-4 text-lg"
            leftIcon={<Play className="h-6 w-6" />}
            onClick={handleStartGame}
            isLoading={isLoading}
            data-testid="start-game-btn"
          >
            Start Game
          </Button>

          <Button
            variant="secondary"
            className="w-full py-3"
            leftIcon={<Library className="h-5 w-5" />}
            onClick={handleViewCards}
            data-testid="view-cards-btn"
          >
            View Card Gallery
          </Button>
        </div>

        {/* Version Info */}
        <div className="mt-8 text-center text-slate-600 text-sm">
          v3.0.0 | 70 Cards | Stone Economy System | Single Player
        </div>
      </div>
    </div>
  )
}

export default Lobby
