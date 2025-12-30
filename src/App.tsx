/**
 * Main App component
 * Single Player Mode v3.1.0
 * @version 3.1.0
 */
console.log('[App.tsx] v3.1.0 loaded')

import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Home, Lobby, SinglePlayerGame, Tutorial, CardGallery, GameBoard } from '@/pages'
import { MultiplayerLobby } from '@/pages/MultiplayerLobby'
import { ToastContainer } from '@/components/ui'
import { useToastStore } from '@/stores'
import { APP_VERSION } from '@/data/constants'

// Log version on app start
console.log(`[The Vale of Eternity] v${APP_VERSION} - Single Player Mode`)

function App() {
  const { toasts, removeToast } = useToastStore()

  return (
    <BrowserRouter basename="/the-vale-of-eternity">
      <div className="min-h-screen bg-slate-900" data-testid="app">
        <Routes>
          <Route path="/" element={<Home />} />
          {/* Multiplayer Mode */}
          <Route path="/multiplayer" element={<MultiplayerLobby />} />
          {/* TODO: Add MultiplayerGameRoom route */}
          {/* <Route path="/multiplayer/:gameId" element={<MultiplayerGameRoom />} /> */}
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
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>

        {/* Toast notifications */}
        <ToastContainer toasts={toasts} onClose={removeToast} />
      </div>
    </BrowserRouter>
  )
}

export default App
