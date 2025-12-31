/**
 * LeftSidebar Component
 * Left sidebar for multiplayer game - displays player list and my info
 * @version 1.0.0
 */
console.log('[components/game/LeftSidebar.tsx] v1.0.0 loaded')

import { memo, useMemo } from 'react'
import { cn } from '@/lib/utils'
import { GlassCard } from '@/components/ui/GlassCard'
import { PlayerMarker } from './PlayerMarker'
import { type PlayerColor, PLAYER_COLORS } from '@/types/player-color'
import type { StonePool } from '@/types/game'
import { calculateStonePoolValue } from '@/types/game'

// ============================================
// TYPES
// ============================================

export interface PlayerSidebarData {
  playerId: string
  name: string
  color: PlayerColor
  index: number
  stones: StonePool
  handCount: number
  fieldCount: number
  score: number
  hasPassed: boolean
  isReady?: boolean
}

export interface LeftSidebarProps {
  /** All players in the game */
  players: PlayerSidebarData[]
  /** Current player's ID (self) */
  currentPlayerId: string
  /** Player whose turn it is */
  currentTurnPlayerId: string
  /** Current game phase */
  phase: 'WAITING' | 'HUNTING' | 'ACTION' | 'RESOLUTION' | 'ENDED'
  /** Additional CSS classes */
  className?: string
}

// ============================================
// MY INFO CARD COMPONENT
// ============================================

interface MyInfoCardProps {
  player: PlayerSidebarData
  isCurrentTurn: boolean
}

const MyInfoCard = memo(function MyInfoCard({
  player,
  isCurrentTurn,
}: MyInfoCardProps) {
  const totalStoneValue = calculateStonePoolValue(player.stones)
  const colorConfig = PLAYER_COLORS[player.color]

  return (
    <GlassCard
      variant="purple"
      glow={isCurrentTurn ? 'purple' : 'none'}
      pulse={isCurrentTurn}
      padding="md"
      className="sticky top-0 z-10"
      data-testid="my-info-card"
    >
      <div className="space-y-3">
        {/* Avatar and Name */}
        <div className="flex items-center gap-3">
          <div
            className="w-12 h-12 rounded-full p-0.5"
            style={{
              background: `linear-gradient(135deg, ${colorConfig.hex}, ${colorConfig.hex}80)`,
            }}
          >
            <div className="w-full h-full rounded-full bg-slate-900 flex items-center justify-center">
              <PlayerMarker
                color={player.color}
                size="md"
                showGlow={isCurrentTurn}
              />
            </div>
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="font-bold text-white flex items-center gap-2 truncate">
              <span className="truncate">{player.name}</span>
              <span className="flex-shrink-0 text-xs px-2 py-0.5 rounded-full bg-purple-500/30 text-purple-300">
                你
              </span>
            </h4>
            <span className="text-xs text-slate-400">
              玩家 #{player.index + 1}
            </span>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-3 gap-2">
          <div className="bg-slate-900/50 rounded-lg p-2 text-center">
            <div className="text-lg leading-none mb-1">手</div>
            <div className="text-xs text-slate-400">手牌</div>
            <div className="text-lg font-bold text-amber-400">
              {player.handCount}
            </div>
          </div>
          <div className="bg-slate-900/50 rounded-lg p-2 text-center">
            <div className="text-lg leading-none mb-1">場</div>
            <div className="text-xs text-slate-400">場上</div>
            <div className="text-lg font-bold text-emerald-400">
              {player.fieldCount}
            </div>
          </div>
          <div className="bg-slate-900/50 rounded-lg p-2 text-center">
            <div className="text-lg leading-none mb-1">幣</div>
            <div className="text-xs text-slate-400">錢幣</div>
            <div className="text-lg font-bold text-cyan-400">
              {totalStoneValue}
            </div>
          </div>
        </div>

        {/* Score (if > 0) */}
        {player.score > 0 && (
          <div className="bg-gradient-to-r from-amber-900/30 to-yellow-900/30 rounded-lg p-2 text-center border border-amber-500/30">
            <div className="text-xs text-amber-400">當前分數</div>
            <div className="text-2xl font-bold text-amber-300">
              {player.score}
            </div>
          </div>
        )}

        {/* Turn Indicator */}
        {isCurrentTurn && (
          <div className="text-center text-sm text-purple-300 animate-pulse">
            輪到你行動了！
          </div>
        )}
      </div>
    </GlassCard>
  )
})

// ============================================
// OTHER PLAYER CARD COMPONENT
// ============================================

interface OtherPlayerCardProps {
  player: PlayerSidebarData
  isCurrentTurn: boolean
  phase: LeftSidebarProps['phase']
}

const OtherPlayerCard = memo(function OtherPlayerCard({
  player,
  isCurrentTurn,
  phase,
}: OtherPlayerCardProps) {
  const totalStoneValue = calculateStonePoolValue(player.stones)

  return (
    <GlassCard
      variant={isCurrentTurn ? 'gold' : 'default'}
      glow={isCurrentTurn ? 'gold' : 'none'}
      pulse={isCurrentTurn}
      padding="sm"
      data-testid={`other-player-${player.playerId}`}
    >
      <div className="space-y-2">
        {/* Header Row */}
        <div className="flex items-center gap-2">
          <PlayerMarker
            color={player.color}
            size="sm"
            showGlow={isCurrentTurn}
          />
          <span className="font-medium text-slate-200 flex-1 truncate">
            {player.name}
          </span>
          {isCurrentTurn && (
            <span className="text-amber-400 animate-pulse text-xs">
              行動中
            </span>
          )}
        </div>

        {/* Stats Row */}
        <div className="flex items-center gap-3 text-xs text-slate-400">
          <span className="flex items-center gap-1">
            <span className="text-amber-400">手</span> {player.handCount}
          </span>
          <span className="flex items-center gap-1">
            <span className="text-emerald-400">場</span> {player.fieldCount}
          </span>
          <span className="flex items-center gap-1">
            <span className="text-cyan-400">幣</span> {totalStoneValue}
          </span>
          {player.score > 0 && (
            <span className="flex items-center gap-1 ml-auto text-amber-300">
              {player.score} 分
            </span>
          )}
        </div>

        {/* Status Badges */}
        <div className="flex items-center gap-2">
          {player.hasPassed && (
            <span className="text-xs text-slate-500 px-2 py-0.5 rounded bg-slate-700/50">
              已跳過
            </span>
          )}
          {player.isReady && phase === 'WAITING' && (
            <span className="text-xs text-emerald-400 px-2 py-0.5 rounded bg-emerald-500/20">
              準備完成
            </span>
          )}
        </div>
      </div>
    </GlassCard>
  )
})

// ============================================
// MAIN COMPONENT
// ============================================

export const LeftSidebar = memo(function LeftSidebar({
  players,
  currentPlayerId,
  currentTurnPlayerId,
  phase,
  className,
}: LeftSidebarProps) {
  // Separate my player from others
  const myPlayer = useMemo(
    () => players.find((p) => p.playerId === currentPlayerId),
    [players, currentPlayerId]
  )

  const otherPlayers = useMemo(
    () => players.filter((p) => p.playerId !== currentPlayerId),
    [players, currentPlayerId]
  )

  const isMyTurn = currentPlayerId === currentTurnPlayerId

  return (
    <aside
      className={cn(
        // Fixed width sidebar
        'w-72 flex-shrink-0',
        // Background with gradient
        'bg-gradient-to-b from-purple-900/20 via-slate-900/40 to-slate-900/20',
        // Glass effect
        'backdrop-blur-sm',
        // Border
        'border-r border-purple-500/20',
        // Layout
        'flex flex-col overflow-hidden',
        className
      )}
      data-testid="left-sidebar"
    >
      {/* Header */}
      <div className="px-4 py-3 border-b border-purple-500/20 flex-shrink-0">
        <h3 className="text-lg font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-violet-400 flex items-center gap-2">
          <span>玩家資訊</span>
          <span className="text-xs text-slate-500 font-normal">
            ({players.length} 人)
          </span>
        </h3>
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3 custom-scrollbar">
        {/* My Info Card - Always on top */}
        {myPlayer && (
          <MyInfoCard
            player={myPlayer}
            isCurrentTurn={isMyTurn}
          />
        )}

        {/* Divider */}
        {otherPlayers.length > 0 && (
          <div className="flex items-center gap-2 px-1">
            <div className="flex-1 h-px bg-gradient-to-r from-transparent via-slate-600/50 to-transparent" />
            <span className="text-[10px] text-slate-500 uppercase tracking-wider">
              其他玩家
            </span>
            <div className="flex-1 h-px bg-gradient-to-r from-transparent via-slate-600/50 to-transparent" />
          </div>
        )}

        {/* Other Players */}
        <div className="space-y-2">
          {otherPlayers.map((player) => (
            <OtherPlayerCard
              key={player.playerId}
              player={player}
              isCurrentTurn={player.playerId === currentTurnPlayerId}
              phase={phase}
            />
          ))}
        </div>
      </div>

      {/* Footer - Phase Status */}
      <div className="px-4 py-2 border-t border-purple-500/20 flex-shrink-0 bg-slate-900/50">
        <div className="text-center">
          <span className={cn(
            'text-xs px-3 py-1 rounded-full',
            phase === 'HUNTING' && 'bg-blue-500/20 text-blue-300',
            phase === 'ACTION' && 'bg-emerald-500/20 text-emerald-300',
            phase === 'WAITING' && 'bg-slate-500/20 text-slate-400',
            phase === 'RESOLUTION' && 'bg-amber-500/20 text-amber-300',
            phase === 'ENDED' && 'bg-purple-500/20 text-purple-300',
          )}>
            {phase === 'HUNTING' && '選卡階段'}
            {phase === 'ACTION' && '行動階段'}
            {phase === 'WAITING' && '等待開始'}
            {phase === 'RESOLUTION' && '結算中'}
            {phase === 'ENDED' && '遊戲結束'}
          </span>
        </div>
      </div>
    </aside>
  )
})

export default LeftSidebar
