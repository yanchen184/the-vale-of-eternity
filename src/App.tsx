/**
 * Main App component
 * @version 2.0.0
 */
console.log('[App.tsx] v2.0.0 loaded')

import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Home, Lobby, Game, Tutorial, CardGallery } from '@/pages'
import { ToastContainer } from '@/components/ui'
import { useToastStore } from '@/stores'
import { APP_VERSION } from '@/data/constants'

// Log version on app start
console.log(`[The Vale of Eternity] v${APP_VERSION}`)

function App() {
  const { toasts, removeToast } = useToastStore()

  return (
    <BrowserRouter basename="/the-vale-of-eternity">
      <div className="min-h-screen bg-slate-900" data-testid="app">
        <Routes>
          <Route path="/" element={<Home />} />
          {/* MVP Local multiplayer routes */}
          <Route path="/local" element={<Lobby />} />
          <Route path="/game/local" element={<Game />} />
          {/* Online multiplayer routes (Firebase) - reuse same components for now */}
          <Route path="/lobby/:gameId" element={<Lobby />} />
          <Route path="/game/:gameId" element={<Game />} />
          <Route path="/tutorial" element={<Tutorial />} />
          {/* Card Gallery for viewing all 70 cards */}
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
