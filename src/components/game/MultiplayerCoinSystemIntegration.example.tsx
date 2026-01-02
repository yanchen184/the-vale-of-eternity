/**
 * MultiplayerCoinSystem Integration Example
 * This file demonstrates how to integrate the multi-player coin system
 * into MultiplayerGame.tsx
 *
 * @version 1.0.0
 * @see MultiplayerCoinSystem.tsx - The main component
 * @see AllPlayersCoinArea.tsx - Displays all players' coin areas
 * @see useCoinFlyAnimation.ts - Animation hook
 * @see usePlayerCoinChanges.ts - Change detection hook
 */

/**
 * USAGE GUIDE:
 *
 * The multi-player coin system provides:
 * 1. Visual display of all players' coins (2-4 players)
 * 2. Flying animations when ANY player takes/returns coins
 * 3. Real-time sync with Firebase updates
 *
 * INTEGRATION STEPS:
 *
 * Step 1: Import the components
 * ---------------------------------
 */

// In MultiplayerGame.tsx, add these imports:
/*
import { MultiplayerCoinSystem } from '@/components/game'
import type { PlayerCoinInfo } from '@/components/game'
*/

/**
 * Step 2: Prepare player data
 * ---------------------------------
 */

// Convert your players state to PlayerCoinInfo format:
/*
const playerCoinInfos: PlayerCoinInfo[] = useMemo(() => {
  return players.map(player => ({
    playerId: player.playerId,
    playerName: player.name,
    playerColor: player.color || 'green',
    playerCoins: player.stones || createEmptyStonePool(),
    index: player.index,
  }))
}, [players])
*/

/**
 * Step 3: Place the component in your layout
 * ---------------------------------
 */

// Option A: Add as a floating panel
/*
<div className="fixed bottom-20 left-4 z-30 w-80">
  <MultiplayerCoinSystem
    players={playerCoinInfos}
    currentPlayerId={playerId ?? ''}
    currentTurnPlayerId={currentTurnPlayerId}
    bankCoins={gameRoom.bankCoins || createEmptyStonePool()}
    isYourTurn={isYourTurn}
    onTakeCoin={handleTakeCoinFromBank}
    onReturnCoin={handleReturnCoinToBank}
    enableAnimations={true}
  />
</div>
*/

// Option B: Replace the existing RightSidebar coin section
// In RightSidebar.tsx, use AllPlayersCoinArea instead of MyCoinsSection

// Option C: Add to a Modal for on-demand viewing
/*
<Modal isOpen={showCoinModal} onClose={() => setShowCoinModal(false)} title="所有玩家錢幣">
  <MultiplayerCoinSystem
    players={playerCoinInfos}
    currentPlayerId={playerId ?? ''}
    currentTurnPlayerId={currentTurnPlayerId}
    bankCoins={gameRoom.bankCoins || createEmptyStonePool()}
    isYourTurn={isYourTurn}
    onTakeCoin={handleTakeCoinFromBank}
    onReturnCoin={handleReturnCoinToBank}
  />
</Modal>
*/

/**
 * Step 4: Animation will trigger automatically
 * ---------------------------------
 *
 * The system uses usePlayerCoinChanges hook to detect coin changes
 * from Firebase real-time updates. When any player's coins change,
 * the animation will automatically trigger.
 *
 * Local player actions (take/return) will trigger immediate animations
 * without waiting for Firebase round-trip.
 */

/**
 * ALTERNATIVE: Using Components Separately
 * ---------------------------------
 *
 * If you want more control, use the components individually:
 */

// Example of using AllPlayersCoinArea with custom animation handling:
/*
import { useRef, useEffect } from 'react'
import { AllPlayersCoinArea, type AllPlayersCoinAreaRef } from '@/components/game'
import { FlyingCoinContainer } from '@/components/game'
import { useCoinFlyAnimation } from '@/hooks/useCoinFlyAnimation'
import { useAutoCoinAnimations } from '@/hooks/usePlayerCoinChanges'

function MyCustomCoinSystem() {
  const coinAreaRef = useRef<AllPlayersCoinAreaRef>(null)
  const { flyingCoins, triggerFly } = useCoinFlyAnimation()

  // Automatically trigger animations on coin changes
  useAutoCoinAnimations(
    players.map(p => ({ playerId: p.playerId, coins: p.coins })),
    (events) => {
      events.forEach(event => {
        const bankEl = coinAreaRef.current?.getBankElement()
        const playerEl = coinAreaRef.current?.getPlayerCoinElement(
          event.playerId,
          event.coinType
        )

        if (event.direction === 'take') {
          triggerFly(event.coinType, bankEl, playerEl)
        } else {
          triggerFly(event.coinType, playerEl, bankEl)
        }
      })
    }
  )

  return (
    <>
      <AllPlayersCoinArea
        ref={coinAreaRef}
        players={playerCoinData}
        currentPlayerId={currentPlayerId}
        currentTurnPlayerId={currentTurnPlayerId}
      />
      <FlyingCoinContainer flyingCoins={flyingCoins} />
    </>
  )
}
*/

/**
 * LAYOUT RECOMMENDATIONS
 * ---------------------------------
 *
 * For 2 players:
 * - Side by side layout works well
 * - Bank in the center or top
 *
 * For 3-4 players:
 * - Grid layout (2x2 for 4 players)
 * - Current player highlighted with border/glow
 * - Bank in center
 *
 * Mobile considerations:
 * - Use scrollable container
 * - Smaller coin sizes
 * - Consider collapsible panel
 */

/**
 * PERFORMANCE TIPS
 * ---------------------------------
 *
 * 1. Use enableAnimations={false} to disable animations during
 *    performance-critical moments (e.g., rapid state changes)
 *
 * 2. The animation system automatically staggers multiple coin
 *    animations to prevent visual overload
 *
 * 3. Animation duration can be customized via triggerFly options
 *
 * 4. Components are memoized - avoid recreating player data arrays
 *    on every render by using useMemo
 */

export {}
