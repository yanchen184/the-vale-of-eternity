/**
 * LeftSidebar Component
 * Left sidebar for multiplayer game - displays player list and my info
 * @version 1.5.0 - Added zone bonus indicator (field limit = round + bonus)
 */
console.log('[components/game/LeftSidebar.tsx] v1.5.0 loaded')

import { memo, useMemo } from 'react'
import { cn } from '@/lib/utils'
import { GlassCard } from '@/components/ui/GlassCard'
import { PlayerMarker } from './PlayerMarker'
import { Card } from './Card'
import { type PlayerColor, PLAYER_COLORS } from '@/types/player-color'
import type { StonePool } from '@/types/game'
import { calculateStonePoolValue } from '@/types/game'
import { StoneType } from '@/types/cards'
import type { CardInstance } from '@/types/cards'

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
  zoneBonus?: 0 | 1 | 2  // Zone bonus indicator (+0/+1/+2 extra field slots)
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
  /** Number of cards remaining in deck */
  deckCount: number
  /** Callback when drawing a card from deck */
  onDrawCard?: () => void
  /** Number of cards in market discard pile */
  marketDiscardCount?: number
  /** Latest discarded card to display (optional) */
  latestDiscardedCard?: CardInstance | null
  /** Callback when clicking discard pile */
  onDiscardClick?: () => void
  /** Callback when toggling zone bonus */
  onToggleZoneBonus?: () => void
  /** Current game round (for zone bonus display) */
  currentRound?: number
  /** Additional CSS classes */
  className?: string
}

// ============================================
// MY INFO CARD COMPONENT
// ============================================

interface MyInfoCardProps {
  player: PlayerSidebarData
  isCurrentTurn: boolean
  deckCount: number
  onDrawCard?: () => void
  canDrawCard: boolean
  onToggleZoneBonus?: () => void
  currentRound?: number
  phase?: 'WAITING' | 'HUNTING' | 'ACTION' | 'RESOLUTION' | 'ENDED'
}

const MyInfoCard = memo(function MyInfoCard({
  player,
  isCurrentTurn,
  deckCount,
  onDrawCard,
  canDrawCard,
  onToggleZoneBonus,
  currentRound = 1,
  phase,
}: MyInfoCardProps) {
  const totalStoneValue = calculateStonePoolValue(player.stones)
  const colorConfig = PLAYER_COLORS[player.color]
  const zoneBonus = player.zoneBonus || 0
  const maxFieldSize = currentRound + zoneBonus
  const canToggleZone = isCurrentTurn && phase === 'ACTION' && onToggleZoneBonus

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
        <div className="grid grid-cols-2 gap-2">
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
        </div>

        {/* Zone Bonus Indicator */}
        <div
          className={cn(
            'bg-slate-900/50 rounded-lg p-2 border-2 transition-all duration-200',
            canToggleZone
              ? 'border-cyan-500/50 cursor-pointer hover:bg-slate-800/70 hover:border-cyan-400 active:scale-95'
              : 'border-slate-700/50 cursor-not-allowed opacity-60'
          )}
          onClick={canToggleZone ? onToggleZoneBonus : undefined}
          title={canToggleZone ? '點擊切換區域指示物 (0→1→2→0)' : '只能在自己回合切換'}
        >
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <div className="text-xs text-slate-400 mb-1">場地上限</div>
              <div className="flex items-center gap-2">
                <span className="text-sm text-cyan-300">
                  回合 {currentRound}
                </span>
                <span className="text-slate-500">+</span>
                <div className={cn(
                  'px-2 py-0.5 rounded text-sm font-bold transition-colors',
                  zoneBonus === 0 && 'bg-slate-700 text-slate-300',
                  zoneBonus === 1 && 'bg-blue-600 text-white',
                  zoneBonus === 2 && 'bg-purple-600 text-white'
                )}>
                  區域 +{zoneBonus}
                </div>
              </div>
            </div>
            <div className="text-right">
              <div className="text-xs text-slate-400 mb-1">最多</div>
              <div className="text-2xl font-bold text-emerald-400">
                {maxFieldSize}
              </div>
            </div>
          </div>
          {canToggleZone && (
            <div className="text-xs text-cyan-400 mt-1 text-center animate-pulse">
              點擊切換
            </div>
          )}
        </div>

        {/* Coins Breakdown */}
        <div className="bg-slate-900/50 rounded-lg p-2">
          <div className="text-xs text-slate-400 mb-2 text-center">錢幣</div>
          <div className="flex items-center justify-around">
            <div className="flex items-center gap-1">
              <img
                src={`${import.meta.env.BASE_URL}assets/stones/stone-1.png`}
                alt="1元"
                className="w-5 h-5"
              />
              <span className="text-sm font-bold text-amber-400">
                x{player.stones[StoneType.ONE] || 0}
              </span>
            </div>
            <div className="flex items-center gap-1">
              <img
                src={`${import.meta.env.BASE_URL}assets/stones/stone-3.png`}
                alt="3元"
                className="w-5 h-5"
              />
              <span className="text-sm font-bold text-amber-400">
                x{player.stones[StoneType.THREE] || 0}
              </span>
            </div>
            <div className="flex items-center gap-1">
              <img
                src={`${import.meta.env.BASE_URL}assets/stones/stone-6.png`}
                alt="6元"
                className="w-5 h-5"
              />
              <span className="text-sm font-bold text-amber-400">
                x{player.stones[StoneType.SIX] || 0}
              </span>
            </div>
          </div>
          <div className="text-center mt-2 text-xs text-cyan-400">
            總計: {totalStoneValue}
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

        {/* Deck - Draw Card Button - Same size as discard pile */}
        <GlassCard
          variant={canDrawCard && deckCount > 0 ? 'blue' : 'default'}
          glow={canDrawCard && deckCount > 0 ? 'blue' : 'none'}
          padding="sm"
          className={cn(
            'transition-all duration-200',
            canDrawCard && deckCount > 0
              ? 'cursor-pointer hover:scale-105 active:scale-95'
              : 'cursor-not-allowed opacity-50'
          )}
          onClick={canDrawCard && deckCount > 0 ? onDrawCard : undefined}
          hoverable={canDrawCard && deckCount > 0}
        >
          <div className="space-y-2">
            {/* Deck Card Display */}
            <div className="relative">
              <div className="w-full aspect-[2/3] bg-gradient-to-br from-slate-700 via-slate-800 to-slate-900 rounded-lg border-2 border-slate-600 flex flex-col items-center justify-center shadow-lg relative overflow-hidden">
                {/* Glow effect when active */}
                {canDrawCard && deckCount > 0 && (
                  <div className="absolute inset-0 bg-gradient-to-br from-blue-500/20 via-transparent to-blue-500/20 animate-pulse" />
                )}

                <span className="relative text-slate-300 text-5xl font-bold mb-2">?</span>

                {canDrawCard && deckCount > 0 && (
                  <span className="relative text-blue-400 text-sm font-bold animate-pulse">
                    點擊抽牌
                  </span>
                )}
              </div>

              {/* Count badge */}
              {deckCount > 0 && (
                <div className="absolute -top-2 -right-2 w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-600 border-2 border-slate-900 rounded-full flex items-center justify-center shadow-lg ring-2 ring-blue-300/50">
                  <span className="text-white text-sm font-bold">{deckCount}</span>
                </div>
              )}
            </div>

            {/* Label */}
            <div className="text-center">
              <div className={cn(
                'text-sm font-semibold',
                canDrawCard && deckCount > 0 ? 'text-blue-400' : 'text-slate-500'
              )}>
                {deckCount === 0 ? '牌組已空' : '牌組'}
              </div>
            </div>
          </div>
        </GlassCard>

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
          {player.score > 0 && (
            <span className="flex items-center gap-1 ml-auto text-amber-300">
              {player.score} 分
            </span>
          )}
        </div>

        {/* Coins Breakdown */}
        <div className="flex items-center gap-2 text-xs">
          <span className="text-slate-400">幣:</span>
          <div className="flex items-center gap-1">
            <img
              src={`${import.meta.env.BASE_URL}assets/stones/stone-1.png`}
              alt="1"
              className="w-3 h-3"
            />
            <span className="text-amber-400">{player.stones[StoneType.ONE] || 0}</span>
          </div>
          <div className="flex items-center gap-1">
            <img
              src={`${import.meta.env.BASE_URL}assets/stones/stone-3.png`}
              alt="3"
              className="w-3 h-3"
            />
            <span className="text-amber-400">{player.stones[StoneType.THREE] || 0}</span>
          </div>
          <div className="flex items-center gap-1">
            <img
              src={`${import.meta.env.BASE_URL}assets/stones/stone-6.png`}
              alt="6"
              className="w-3 h-3"
            />
            <span className="text-amber-400">{player.stones[StoneType.SIX] || 0}</span>
          </div>
          <span className="text-cyan-400 ml-auto">={totalStoneValue}</span>
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
  deckCount,
  onDrawCard,
  marketDiscardCount = 0,
  latestDiscardedCard,
  onDiscardClick,
  onToggleZoneBonus,
  currentRound = 1,
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

  // Can draw card if it's my turn and in ACTION or RESOLUTION phase
  const canDrawCard = isMyTurn && (phase === 'ACTION' || phase === 'RESOLUTION')

  return (
    <aside
      className={cn(
        // Fixed width sidebar - increased from w-72 to w-80
        'w-80 flex-shrink-0',
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
            deckCount={deckCount}
            onDrawCard={onDrawCard}
            canDrawCard={canDrawCard}
            onToggleZoneBonus={onToggleZoneBonus}
            currentRound={currentRound}
            phase={phase}
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

        {/* Discard Pile - At bottom */}
        {onDiscardClick && (
          <GlassCard
            variant="default"
            padding="sm"
            className="cursor-pointer hover:bg-white/10 transition-colors"
            onClick={onDiscardClick}
            hoverable
          >
            <div className="space-y-2">
              {latestDiscardedCard ? (
                <div className="relative">
                  <Card card={latestDiscardedCard} index={0} compact />
                  {/* Count badge */}
                  {marketDiscardCount > 1 && (
                    <div className="absolute -top-2 -right-2 w-6 h-6 bg-purple-500 border-2 border-slate-900 rounded-full flex items-center justify-center shadow-lg">
                      <span className="text-white text-xs font-bold">{marketDiscardCount}</span>
                    </div>
                  )}
                </div>
              ) : (
                <div className="w-full aspect-[2/3] bg-gradient-to-br from-slate-700 to-slate-800 rounded border-2 border-slate-600 flex items-center justify-center shadow-lg relative">
                  <span className="text-slate-500 text-xs">無棄牌</span>
                </div>
              )}
              <div className="text-[10px] text-slate-400 text-center">棄牌堆</div>
            </div>
          </GlassCard>
        )}
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
