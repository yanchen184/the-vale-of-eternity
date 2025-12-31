/**
 * Game Mode Toggle Component
 * Allows switching between automatic and manual game modes
 * @version 1.0.0
 */
console.log('[components/game/GameModeToggle.tsx] v1.0.0 loaded')

import { GameMode } from '@/types/manual'
import { cn } from '@/lib/utils'

// ============================================
// TYPES
// ============================================

export interface GameModeToggleProps {
  /** Current game mode */
  currentMode: GameMode
  /** Mode change callback */
  onModeChange: (mode: GameMode) => void
  /** Optional className */
  className?: string
  /** Disabled state */
  disabled?: boolean
}

// ============================================
// COMPONENT
// ============================================

export function GameModeToggle({
  currentMode,
  onModeChange,
  className,
  disabled = false,
}: GameModeToggleProps) {
  return (
    <div
      className={cn('flex gap-2 bg-slate-800/80 p-2 rounded-lg border border-slate-700', className)}
      data-testid="game-mode-toggle"
    >
      {/* Automatic Mode Button */}
      <button
        type="button"
        disabled={disabled}
        className={cn(
          'px-4 py-2 rounded transition-all font-medium text-sm',
          'disabled:opacity-50 disabled:cursor-not-allowed',
          currentMode === GameMode.AUTOMATIC
            ? 'bg-vale-500 text-white shadow-lg'
            : 'text-slate-400 hover:bg-slate-700 hover:text-slate-200'
        )}
        onClick={() => onModeChange(GameMode.AUTOMATIC)}
        data-testid="automatic-mode-btn"
        aria-pressed={currentMode === GameMode.AUTOMATIC}
      >
        <span className="flex items-center gap-2">
          <span>🤖</span>
          <span>自動模式</span>
        </span>
      </button>

      {/* Manual Mode Button */}
      <button
        type="button"
        disabled={disabled}
        className={cn(
          'px-4 py-2 rounded transition-all font-medium text-sm',
          'disabled:opacity-50 disabled:cursor-not-allowed',
          currentMode === GameMode.MANUAL
            ? 'bg-amber-500 text-white shadow-lg'
            : 'text-slate-400 hover:bg-slate-700 hover:text-slate-200'
        )}
        onClick={() => onModeChange(GameMode.MANUAL)}
        data-testid="manual-mode-btn"
        aria-pressed={currentMode === GameMode.MANUAL}
      >
        <span className="flex items-center gap-2">
          <span>🎮</span>
          <span>手動模式</span>
        </span>
      </button>
    </div>
  )
}

export default GameModeToggle
