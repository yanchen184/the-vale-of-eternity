/**
 * GameLayout Component
 * Symmetric layout container for multiplayer game
 * Fixed height, no scroll, left-right balanced design
 * @version 1.6.0 - Added prominent action buttons (Confirm/End Turn) to header center
 */
console.log('[components/game/GameLayout.tsx] v1.6.0 loaded')

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
  /** Score bar content (fixed height, bottom of screen) */
  scoreBar?: ReactNode
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
  scoreBar,
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

      {/* Score Bar - Fixed Height at Bottom */}
      {scoreBar && (
        <footer
          className="h-12 flex-shrink-0 border-t border-purple-500/30 bg-slate-900/80 backdrop-blur-sm z-20"
          data-testid="game-layout-score-bar"
        >
          {scoreBar}
        </footer>
      )}
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
  /** Round starting player's name (who starts this round) */
  roundStartingPlayerName?: string
  /** Whether it's the viewer's turn */
  isYourTurn: boolean
  /** Leave game callback */
  onLeave: () => void
  /** View score callback */
  onViewScore?: () => void
  /** View all fields callback */
  onViewAllFields?: () => void
  /** View sanctuary callback (expansion mode) */
  onViewSanctuary?: () => void
  /** Pass turn callback */
  onPassTurn?: () => void
  /** Whether to show pass button */
  showPassTurn?: boolean
  /** Confirm selection callback (hunting phase) */
  onConfirmSelection?: () => void
  /** Whether to show confirm selection button */
  showConfirmSelection?: boolean
  /** Whether confirm selection is disabled */
  confirmSelectionDisabled?: boolean
  /** Number of unprocessed action cards */
  unprocessedActionCards?: number
  /** Optional card scale controls (React node) */
  cardScaleControls?: React.ReactNode
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
  roundStartingPlayerName,
  isYourTurn,
  onLeave,
  onViewScore,
  onViewAllFields,
  onViewSanctuary,
  onPassTurn,
  showPassTurn = false,
  onConfirmSelection,
  showConfirmSelection = false,
  confirmSelectionDisabled = false,
  unprocessedActionCards = 0,
  cardScaleControls,
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
              <span className="text-slate-500">第 {round} 回合</span>
              {roundStartingPlayerName && (
                <>
                  <span className="text-slate-600">|</span>
                  <span className="text-amber-400">{roundStartingPlayerName} 先手</span>
                </>
              )}
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

      {/* Center: Turn Indicator + Action Buttons */}
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

          {/* Confirm Selection Button - Hunting Phase */}
          {showConfirmSelection && isYourTurn && onConfirmSelection && (
            <button
              type="button"
              onClick={confirmSelectionDisabled ? undefined : onConfirmSelection}
              disabled={confirmSelectionDisabled}
              className={cn(
                'px-6 py-2.5 text-sm font-black rounded-lg border-2 shadow-lg transition-all duration-200',
                confirmSelectionDisabled
                  ? [
                      'bg-gradient-to-br from-slate-600 to-slate-700',
                      'text-slate-400',
                      'border-slate-500/50',
                      'shadow-slate-900/50',
                      'cursor-not-allowed',
                      'opacity-50',
                    ]
                  : [
                      'bg-gradient-to-br from-emerald-600 to-emerald-700',
                      'hover:from-emerald-500 hover:to-emerald-600',
                      'active:from-emerald-700 active:to-emerald-800',
                      'text-white',
                      'border-emerald-400/70',
                      'shadow-emerald-900/50',
                      'hover:scale-110 active:scale-95',
                      'animate-pulse',
                    ]
              )}
            >
              ✅ 確認選擇
            </button>
          )}

          {/* End Turn Button - Action/Resolution Phase */}
          {showPassTurn && isYourTurn && onPassTurn && (
            <button
              type="button"
              onClick={unprocessedActionCards === 0 ? onPassTurn : undefined}
              disabled={unprocessedActionCards > 0}
              title={
                unprocessedActionCards === 0
                  ? '結束你的回合'
                  : `還有 ${unprocessedActionCards} 張行動階段卡片未處理（需上手或賣出）`
              }
              className={cn(
                'px-6 py-2.5 text-sm font-black rounded-lg border-2 shadow-lg transition-all duration-200',
                unprocessedActionCards === 0
                  ? [
                      'bg-gradient-to-br from-red-600 to-red-700',
                      'hover:from-red-500 hover:to-red-600',
                      'active:from-red-700 active:to-red-800',
                      'text-white',
                      'border-red-400/70',
                      'shadow-red-900/50',
                      'hover:scale-110 active:scale-95',
                      'animate-pulse',
                      'cursor-pointer',
                    ]
                  : [
                      'bg-gradient-to-br from-slate-600 to-slate-700',
                      'text-slate-400',
                      'border-slate-500/50',
                      'shadow-slate-900/50',
                      'cursor-not-allowed',
                      'opacity-50',
                    ]
              )}
            >
              🔚 回合結束
            </button>
          )}
        </div>
      )}

      {/* Right: Action Buttons */}
      <div className="flex items-center gap-2">
        {/* Card Scale Controls */}
        {cardScaleControls}

        {/* View Score Button */}
        {phase !== 'WAITING' && onViewScore && (
          <button
            onClick={onViewScore}
            className="px-3 py-1.5 rounded-lg text-xs font-medium bg-purple-600/80 hover:bg-purple-500/80 text-purple-100 transition-colors"
            data-testid="view-score-btn"
          >
            查看分數
          </button>
        )}

        {/* View All Fields Button */}
        {phase !== 'WAITING' && onViewAllFields && (
          <button
            onClick={onViewAllFields}
            className="px-3 py-1.5 rounded-lg text-xs font-medium bg-emerald-600/80 hover:bg-emerald-500/80 text-emerald-100 transition-colors"
            data-testid="view-all-fields-btn"
          >
            查看怪獸區
          </button>
        )}

        {/* View Sanctuary Button (Expansion Mode) */}
        {phase !== 'WAITING' && onViewSanctuary && (
          <button
            onClick={onViewSanctuary}
            className="px-3 py-1.5 rounded-lg text-xs font-medium bg-amber-600/80 hover:bg-amber-500/80 text-amber-100 transition-colors"
            data-testid="view-sanctuary-btn"
          >
            查看棲息地
          </button>
        )}

        {/* Leave Button */}
        <button
          onClick={onLeave}
          className="px-3 py-1.5 rounded-lg text-xs font-medium text-slate-400 hover:text-slate-200 hover:bg-slate-700/50 transition-colors"
          data-testid="leave-game-btn"
        >
          離開遊戲
        </button>
      </div>
    </div>
  )
})

export default GameLayout
