/**
 * GameLayout Component
 * Symmetric layout container for multiplayer game
 * Fixed height, no scroll, left-right balanced design
 * @version 1.0.0
 */
console.log('[components/game/GameLayout.tsx] v1.0.0 loaded')

import { memo, type ReactNode } from 'react'
import { cn } from '@/lib/utils'

// ============================================
// TYPES
// ============================================

export interface GameLayoutProps {
  /** Header content (fixed height) */
  header?: ReactNode
  /** Left sidebar content (fixed width) */
  leftSidebar?: ReactNode
  /** Main game area content (flexible) */
  mainContent?: ReactNode
  /** Right sidebar content (fixed width) */
  rightSidebar?: ReactNode
  /** Whether to show sidebars */
  showSidebars?: boolean
  /** Additional CSS classes for the container */
  className?: string
  /** Data test ID */
  testId?: string
}

// ============================================
// HEADER WRAPPER
// ============================================

interface HeaderWrapperProps {
  children: ReactNode
}

const HeaderWrapper = memo(function HeaderWrapper({ children }: HeaderWrapperProps) {
  return (
    <header
      className="h-14 flex-shrink-0 z-30"
      data-testid="game-layout-header"
    >
      {children}
    </header>
  )
})

// ============================================
// MAIN COMPONENT
// ============================================

export const GameLayout = memo(function GameLayout({
  header,
  leftSidebar,
  mainContent,
  rightSidebar,
  showSidebars = true,
  className,
  testId = 'game-layout',
}: GameLayoutProps) {
  return (
    <div
      className={cn(
        // Full viewport height, no overflow
        'h-screen w-screen overflow-hidden',
        // Flex column layout
        'flex flex-col',
        // Background
        'bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900',
        className
      )}
      data-testid={testId}
    >
      {/* Header - Fixed Height */}
      {header && <HeaderWrapper>{header}</HeaderWrapper>}

      {/* Main Body - Fills Remaining Space */}
      <div className="flex-1 flex overflow-hidden min-h-0">
        {/* Left Sidebar - Fixed Width */}
        {showSidebars && leftSidebar && (
          <div
            className="flex-shrink-0 overflow-hidden"
            data-testid="game-layout-left-sidebar"
          >
            {leftSidebar}
          </div>
        )}

        {/* Central Game Area - Flexible Width */}
        <div
          className="flex-1 overflow-hidden min-w-0"
          data-testid="game-layout-main"
        >
          {mainContent}
        </div>

        {/* Right Sidebar - Fixed Width */}
        {showSidebars && rightSidebar && (
          <div
            className="flex-shrink-0 overflow-hidden"
            data-testid="game-layout-right-sidebar"
          >
            {rightSidebar}
          </div>
        )}
      </div>
    </div>
  )
})

// ============================================
// GAME HEADER COMPONENT
// ============================================

export interface GameHeaderProps {
  /** Room code */
  roomCode: string
  /** Current phase */
  phase: 'WAITING' | 'HUNTING' | 'ACTION' | 'RESOLUTION' | 'ENDED'
  /** Current round number */
  round: number
  /** Current turn player's name */
  currentPlayerName: string
  /** Whether it's the viewer's turn */
  isYourTurn: boolean
  /** Leave game callback */
  onLeave: () => void
  /** Pass turn callback */
  onPassTurn?: () => void
  /** Whether to show pass button */
  showPassTurn?: boolean
}

const PHASE_LABELS: Record<GameHeaderProps['phase'], string> = {
  WAITING: '等待中',
  HUNTING: '選卡階段',
  ACTION: '行動階段',
  RESOLUTION: '結算中',
  ENDED: '遊戲結束',
}

const PHASE_COLORS: Record<GameHeaderProps['phase'], string> = {
  WAITING: 'bg-slate-600/80 text-slate-200',
  HUNTING: 'bg-blue-600/80 text-blue-100',
  ACTION: 'bg-emerald-600/80 text-emerald-100',
  RESOLUTION: 'bg-amber-600/80 text-amber-100',
  ENDED: 'bg-purple-600/80 text-purple-100',
}

export const GameHeader = memo(function GameHeader({
  roomCode,
  phase,
  round,
  currentPlayerName,
  isYourTurn,
  onLeave,
  onPassTurn,
  showPassTurn = false,
}: GameHeaderProps) {
  return (
    <div
      className="h-full bg-slate-800/90 backdrop-blur-sm border-b border-slate-700 px-4 flex items-center justify-between"
      data-testid="game-header"
    >
      {/* Left: Game Info */}
      <div className="flex items-center gap-4">
        {/* Title & Room Code */}
        <div className="flex items-center gap-3">
          <h1 className="text-lg font-bold text-slate-100 font-game hidden sm:block">
            永恆之谷
          </h1>
          <div className="flex items-center gap-1 text-xs">
            <span className="text-slate-500">房間:</span>
            <span className="text-amber-400 font-mono font-bold tracking-wider">
              {roomCode}
            </span>
          </div>
          {phase !== 'WAITING' && (
            <div className="flex items-center gap-1 text-xs">
              <span className="text-slate-500">回合:</span>
              <span className="text-slate-200 font-medium">{round}</span>
            </div>
          )}
        </div>

        {/* Phase Badge */}
        <div className={cn(
          'px-3 py-1 rounded-full text-xs font-medium',
          PHASE_COLORS[phase]
        )}>
          {PHASE_LABELS[phase]}
        </div>
      </div>

      {/* Center: Turn Indicator */}
      {phase !== 'WAITING' && phase !== 'ENDED' && (
        <div className="flex items-center gap-3">
          <div
            className={cn(
              'px-4 py-1.5 rounded-lg text-sm font-medium border-2 transition-all',
              isYourTurn
                ? 'bg-vale-600/20 border-vale-500 text-vale-300 animate-pulse'
                : 'bg-slate-700/50 border-slate-600 text-slate-400'
            )}
          >
            {isYourTurn ? '輪到你了！' : `${currentPlayerName} 的回合`}
          </div>

          {/* Pass Turn Button */}
          {showPassTurn && isYourTurn && onPassTurn && (
            <button
              onClick={onPassTurn}
              className="px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-700 hover:bg-slate-600 text-slate-300 transition-colors"
              data-testid="pass-turn-btn"
            >
              結束回合
            </button>
          )}
        </div>
      )}

      {/* Right: Leave Button */}
      <button
        onClick={onLeave}
        className="px-3 py-1.5 rounded-lg text-xs font-medium text-slate-400 hover:text-slate-200 hover:bg-slate-700/50 transition-colors"
        data-testid="leave-game-btn"
      >
        離開遊戲
      </button>
    </div>
  )
})

export default GameLayout
