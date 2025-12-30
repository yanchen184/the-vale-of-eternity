/**
 * Application entry point
 * @version 1.0.0
 */
console.log('[main.tsx] v1.0.0 loaded')

import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
)
