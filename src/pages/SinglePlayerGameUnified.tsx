/**
 * Unified Single Player Game Page v1.0.0
 * Uses multiplayer-game.ts and MultiplayerGame.tsx for single player
 * Creates a Firebase game and redirects to multiplayer view
 * @version 1.0.0
 */
console.log('[pages/SinglePlayerGameUnified.tsx] v1.0.0 loaded')

import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { createSinglePlayerGame } from '@/services/single-player-adapter'

export default function SinglePlayerGameUnified() {
  const navigate = useNavigate()
  const [isCreating, setIsCreating] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    // Create single player game on mount
    async function initGame() {
      try {
        const playerName = localStorage.getItem('playerName') || 'Player'
        const expansionMode = localStorage.getItem('expansionMode') === 'true'

        console.log('[SinglePlayerGameUnified] Creating game:', { playerName, expansionMode })

        const result = await createSinglePlayerGame(playerName, expansionMode)

        console.log('[SinglePlayerGameUnified] Game created:', result)

        // Store player ID in localStorage for multiplayer page
        localStorage.setItem('currentPlayerId', result.playerId)
        localStorage.setItem('isSinglePlayerMode', 'true')

        // Redirect to multiplayer game page with state
        navigate(`/multiplayer/${result.gameId}`, {
          state: {
            playerId: result.playerId,
            playerName,
            roomCode: result.roomCode,
            isHost: true,
          },
        })
      } catch (err) {
        console.error('[SinglePlayerGameUnified] Error creating game:', err)
        setError(err instanceof Error ? err.message : 'Failed to create game')
        setIsCreating(false)
      }
    }

    initGame()
  }, [navigate])

  // Show loading state
  if (isCreating) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="text-2xl text-slate-200 mb-4">🎮 創建單人遊戲中...</div>
          <div className="text-sm text-slate-400 mb-2">Setting up your adventure</div>
          <div className="text-xs text-slate-500">Using unified Firebase engine</div>
          <div className="mt-6">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-blue-500 border-r-transparent"></div>
          </div>
        </div>
      </div>
    )
  }

  // Show error state
  if (error) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="text-2xl text-red-400 mb-4">❌ 創建失敗</div>
          <div className="text-sm text-slate-400 mb-6">{error}</div>
          <button
            onClick={() => navigate('/')}
            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
          >
            返回首頁
          </button>
        </div>
      </div>
    )
  }

  return null
}
