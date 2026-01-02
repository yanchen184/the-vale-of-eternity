/**
 * RightSidebar Component
 * Right sidebar for multiplayer game - displays bank coins and player coins
 * @version 5.5.0 - Removed action buttons (moved to GameLayout Header)
 */
console.log('[components/game/RightSidebar.tsx] v5.5.0 loaded')

import { memo, useRef, useCallback, useEffect } from 'react' // eslint-disable-line
import { cn } from '@/lib/utils'
import type { StonePool } from '@/types/game'
import { createEmptyStonePool } from '@/types/game'
import { StoneType } from '@/types/cards'
import { BankArea } from './BankArea'
import { PlayerCoinAreaCompact } from './PlayerCoinAreaCompact'
import type { PlayerCoinAreaCompactRef } from './PlayerCoinAreaCompact'
import { useCoinAnimation } from '@/hooks/useCoinAnimation'

// ============================================
// TYPES
// ============================================

import type { PlayerColor } from '@/types/player-color'

export interface PlayerCoinInfo {
  playerId: string
  playerName: string
  playerColor: PlayerColor
  playerCoins: StonePool
}

export interface RightSidebarProps {
  /** Bank's coin pool (optional - bank is infinite) */
  bankCoins?: StonePool
  /** Current player's coin pool */
  playerCoins: StonePool
  /** Current player's name */
  playerName: string
  /** Whether it's the current player's turn */
  isYourTurn: boolean
  /** Current game phase */
  phase?: 'WAITING' | 'HUNTING' | 'ACTION' | 'RESOLUTION' | 'ENDED'
  /** Callback when taking a coin from bank */
  onTakeCoin?: (coinType: StoneType) => void
  /** Callback when returning a coin to bank */
  onReturnCoin?: (coinType: StoneType) => void
  /** Callback when confirming card selection (hunting phase) */
  onConfirmSelection?: () => void
  /** Callback when ending turn (action phase) */
  onEndTurn?: () => void
  /** Additional CSS classes */
  className?: string
  // Seven-League Boots props (v1.6.0)
  /** Whether the player is in Seven-League Boots selection mode */
  isInSevenLeagueBootsSelection?: boolean
  /** Whether a card has been selected for shelter */
  hasSelectedShelterCard?: boolean
  // Artifact selection props (v1.7.0)
  /** Whether it's the current player's artifact selection turn */
  isYourArtifactTurn?: boolean
  /** Whether artifact selection is currently active */
  isArtifactSelectionActive?: boolean
  // Multiplayer coins (v2.0.0)
  /** All players' coin information for multiplayer display */
  allPlayers?: PlayerCoinInfo[]
  /** Current player ID */
  currentPlayerId?: string
  // Stone limit (v3.1.0)
  /** Current player's stone limit (default: 4, with Hestia: 6) */
  currentPlayerStoneLimit?: number
  // Action phase cards (v5.4.0)
  /** Number of current turn cards that haven't been processed (must be 0 to end turn) */
  unprocessedActionCards?: number
}

// ============================================
// MAIN COMPONENT
// ============================================

export const RightSidebar = memo(function RightSidebar({
  bankCoins: _bankCoins,
  playerCoins,
  playerName: _playerName,
  isYourTurn,
  phase: _phase,
  onTakeCoin,
  onReturnCoin,
  onConfirmSelection: _onConfirmSelection,
  onEndTurn: _onEndTurn,
  className,
  // Seven-League Boots props (v1.6.0)
  isInSevenLeagueBootsSelection: _isInSevenLeagueBootsSelection,
  hasSelectedShelterCard: _hasSelectedShelterCard,
  // Artifact selection props (v1.7.0)
  isYourArtifactTurn: _isYourArtifactTurn,
  isArtifactSelectionActive: _isArtifactSelectionActive,
  // Multiplayer coins (v2.0.0)
  allPlayers,
  currentPlayerId,
  // Stone limit (v3.1.0)
  currentPlayerStoneLimit = 4,
  // Action phase cards (v5.4.0)
  unprocessedActionCards: _unprocessedActionCards = 0,
}: RightSidebarProps) {
  void _playerName // Reserved for future use
  void _bankCoins // Bank is infinite, no need to track
  void playerCoins // Now using allPlayers instead
  void _phase // Not currently used in UI
  void _onConfirmSelection // Reserved for future use
  void _onEndTurn // Reserved for future use
  void _isInSevenLeagueBootsSelection // Reserved for future use
  void _hasSelectedShelterCard // Reserved for future use
  void _isYourArtifactTurn // Reserved for future use
  void _isArtifactSelectionActive // Reserved for future use
  void _unprocessedActionCards // Reserved for future use

  // 金幣飛行動畫系統 (v5.0.0 - 多人同步)
  const { animateCoin } = useCoinAnimation()
  const bankAreaRef = useRef<HTMLDivElement>(null)
  const playerCoinRefs = useRef<Map<string, PlayerCoinAreaCompactRef>>(new Map())

  // 儲存上一次的金幣狀態，用於偵測變化
  const previousCoinsRef = useRef<Map<string, StonePool>>(new Map()) // Used in useEffect

  // 監聽所有玩家的金幣變化並觸發動畫 (v5.0.0)
  useEffect(() => {
    if (!allPlayers || allPlayers.length === 0) return

    allPlayers.forEach((player) => {
      const previousCoins = previousCoinsRef.current.get(player.playerId)
      const currentCoins = player.playerCoins

      // 第一次初始化，不觸發動畫
      if (!previousCoins) {
        previousCoinsRef.current.set(player.playerId, { ...currentCoins })
        return
      }

      // 檢查每種金幣類型的變化
      const coinTypes: StoneType[] = [StoneType.ONE, StoneType.THREE, StoneType.SIX]

      coinTypes.forEach((coinType) => {
        const prevCount = previousCoins[coinType] || 0
        const currCount = currentCoins[coinType] || 0
        const diff = currCount - prevCount

        if (diff !== 0) {
          console.log(
            `[RightSidebar] Player ${player.playerName} coin changed:`,
            { coinType, prevCount, currCount, diff }
          )

          const playerRef = playerCoinRefs.current.get(player.playerId)
          const targetElement = playerRef?.getContainerElement()

          if (diff > 0 && bankAreaRef.current && targetElement) {
            // 金幣增加 = 從銀行拿取
            console.log('[RightSidebar] Animating: Bank → Player')
            void animateCoin(coinType, bankAreaRef.current, targetElement)
          } else if (diff < 0 && targetElement && bankAreaRef.current) {
            // 金幣減少 = 歸還銀行
            console.log('[RightSidebar] Animating: Player → Bank')
            void animateCoin(coinType, targetElement, bankAreaRef.current)
          }
        }
      })

      // 更新儲存的狀態
      previousCoinsRef.current.set(player.playerId, { ...currentCoins })
    })
  }, [allPlayers, animateCoin])

  // Calculate current player's total coins (v3.1.0 - updated to use dynamic limit)
  const currentPlayerCoins = allPlayers?.find((p) => p.playerId === currentPlayerId)?.playerCoins
  const currentPlayerTotalCoins = currentPlayerCoins
    ? (currentPlayerCoins[StoneType.ONE] || 0) +
      (currentPlayerCoins[StoneType.THREE] || 0) +
      (currentPlayerCoins[StoneType.SIX] || 0)
    : 0
  const canTakeMoreCoins = currentPlayerTotalCoins < currentPlayerStoneLimit

  // 處理從銀行拿取金幣 - 直接執行邏輯，動畫由 useEffect 自動觸發
  const handleTakeCoinFromBank = useCallback(
    (coinType: StoneType, _bankCoinElement: HTMLElement | null) => {
      if (!currentPlayerId || !onTakeCoin) return

      // 檢查金幣上限
      if (currentPlayerTotalCoins >= currentPlayerStoneLimit) {
        console.warn(
          `[RightSidebar] Cannot take coin: player has ${currentPlayerTotalCoins}/${currentPlayerStoneLimit} coins already`
        )
        return
      }

      console.log('[RightSidebar] Taking coin from bank:', coinType)
      // 直接執行遊戲邏輯，動畫會由 useEffect 監聽金幣變化後自動觸發
      onTakeCoin(coinType)
    },
    [currentPlayerId, currentPlayerTotalCoins, currentPlayerStoneLimit, onTakeCoin]
  )

  // 處理歸還金幣到銀行 - 直接執行邏輯，動畫由 useEffect 自動觸發
  const handleReturnCoinToBank = useCallback(
    (coinType: StoneType, _playerCoinElement: HTMLElement) => {
      if (!onReturnCoin) return

      console.log('[RightSidebar] Returning coin to bank:', coinType)
      // 直接執行遊戲邏輯，動畫會由 useEffect 監聽金幣變化後自動觸發
      onReturnCoin(coinType)
    },
    [onReturnCoin]
  )

  // Show confirm selection button only during HUNTING phase and player's turn
  // v1.7.0: During artifact selection, use isYourArtifactTurn instead of isYourTurn
  // Also show during Seven-League Boots selection when player is active
  // v5.27.1: Fix issue where confirm button stays visible after artifact selection completes
  // These variables are defined for documentation but not currently used in the UI
  // const showConfirmSelection = (isArtifactSelectionActive && isYourArtifactTurn && phase === 'HUNTING' && onConfirmSelection) || (!isArtifactSelectionActive && isYourTurn && phase === 'HUNTING' && onConfirmSelection) || (isInSevenLeagueBootsSelection && onConfirmSelection)
  // const showEndTurn = isYourTurn && (phase === 'ACTION' || phase === 'RESOLUTION') && onEndTurn
  // const canEndTurn = unprocessedActionCards === 0
  return (
    <aside
      className={cn(
        // Fixed width sidebar - increased from w-72 to w-80
        'w-80 flex-shrink-0',
        // Background with gradient
        'bg-gradient-to-b from-amber-900/10 via-slate-900/40 to-slate-900/20',
        // Glass effect
        'backdrop-blur-sm',
        // Border
        'border-l border-amber-500/20',
        // Layout
        'flex flex-col overflow-hidden',
        className
      )}
      data-testid="right-sidebar"
    >
      {/* Header */}
      <div className="px-4 py-3 border-b border-amber-500/20 flex-shrink-0">
        <h3 className="text-lg font-bold text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-yellow-400">
          <span>銀行 & 資源</span>
        </h3>
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto p-3 space-y-4 custom-scrollbar">
        {/* Bank - 6 Slot System */}
        <BankArea
          ref={bankAreaRef}
          bankCoins={_bankCoins || createEmptyStonePool()}
          allowInteraction={isYourTurn && canTakeMoreCoins}
          onTakeCoin={handleTakeCoinFromBank}
        />

        {/* Divider */}
        <div className="flex items-center gap-2 px-1">
          <div className="flex-1 h-px bg-gradient-to-r from-transparent via-slate-600/50 to-transparent" />
        </div>

        {/* All Players' Coins - 6 Slot System for each player */}
        {allPlayers && allPlayers.length > 0 ? (
          <div className="space-y-3">
            {allPlayers.map((player) => (
              <PlayerCoinAreaCompact
                key={player.playerId}
                ref={(ref) => {
                  if (ref) {
                    playerCoinRefs.current.set(player.playerId, ref)
                  }
                }}
                playerId={player.playerId}
                playerName={player.playerName}
                playerColor={player.playerColor}
                playerCoins={player.playerCoins}
                isCurrentPlayer={player.playerId === currentPlayerId}
                isPlayerTurn={player.playerId === currentPlayerId && isYourTurn}
                onReturnCoin={
                  player.playerId === currentPlayerId && onReturnCoin
                    ? handleReturnCoinToBank
                    : undefined
                }
              />
            ))}
          </div>
        ) : null}

      </div>

    </aside>
  )
})

export default RightSidebar
