/**
 * Main App component
 * Single Player Mode v3.4.0 - Added Coin Animation Demo
 * @version 3.4.0
 */
console.log('[App.tsx] v3.4.0 loaded')

import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Home, Lobby, SinglePlayerGame, Tutorial, CardGallery, GameBoard, MultiplayerGame } from '@/pages'
import { MultiplayerLobby } from '@/pages/MultiplayerLobby'
import { MahjongLayoutDemo } from '@/pages/MahjongLayoutDemo'
import CoinAnimationDemo from '@/pages/CoinAnimationDemo'
import { SoundTest } from '@/pages/SoundTest'
import { ToastContainer } from '@/components/ui'
import { useToastStore } from '@/stores'
import { APP_VERSION } from '@/data/constants'

// Log version on app start
console.log(`[The Vale of Eternity] v${APP_VERSION} - Multiplayer Mode Enabled`)

function App() {
  const { toasts, removeToast } = useToastStore()

  return (
    <BrowserRouter basename="/the-vale-of-eternity">
      <div className="min-h-screen bg-slate-900" data-testid="app">
        <Routes>
          <Route path="/" element={<Home />} />
          {/* Multiplayer Mode */}
          <Route path="/multiplayer" element={<MultiplayerLobby />} />
          <Route path="/multiplayer/:gameId" element={<MultiplayerGame />} />
          {/* Single Player Mode */}
          <Route path="/play" element={<Lobby />} />
          <Route path="/game" element={<SinglePlayerGame />} />
          {/* New GameBoard with core UI components */}
          <Route path="/gameboard" element={<GameBoard />} />
          {/* Legacy routes - redirect to new paths */}
          <Route path="/local" element={<Navigate to="/play" replace />} />
          <Route path="/game/local" element={<Navigate to="/game" replace />} />
          {/* Tutorial and Card Gallery */}
          <Route path="/tutorial" element={<Tutorial />} />
          <Route path="/cards" element={<CardGallery />} />
          {/* Mahjong Layout Demo */}
          <Route path="/mahjong-demo" element={<MahjongLayoutDemo />} />
          {/* Coin Animation Demo */}
          <Route path="/coin-demo" element={<CoinAnimationDemo />} />
          {/* Sound Test */}
          <Route path="/sound-test" element={<SoundTest />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>

        {/* Toast notifications */}
        <ToastContainer toasts={toasts} onClose={removeToast} />
      </div>
    </BrowserRouter>
  )
}

export default App
