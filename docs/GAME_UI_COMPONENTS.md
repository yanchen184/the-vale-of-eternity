# The Vale of Eternity - Core Game UI Components

## Overview

This document describes the 4 core game UI components implemented for "The Vale of Eternity" card game. These components provide a modern, responsive, and interactive game interface.

**Version:** 1.0.0

## Components

### 1. PlayerHand (`src/components/game/PlayerHand.tsx`)

Displays the player's hand cards with a fan layout and drag-drop support.

**Features:**
- Fan layout with rotation and offset for each card
- Hover effects (cards lift up and show actions)
- Drag-drop support for playing cards to field
- Card selection with visual feedback
- Displays hand count with max limit indicator
- Responsive design

**Props:**
```typescript
interface PlayerHandProps {
  cards: CardInstance[]           // Cards in hand
  maxHandSize?: number            // Max hand size (default: 7)
  selectedCardId?: string | null  // Currently selected card
  showActions?: boolean           // Show tame/sell buttons on hover
  enableDrag?: boolean            // Enable drag to field
  onCardSelect?: (cardId: string) => void
  onCardPlay?: (cardId: string) => void
  onCardSell?: (cardId: string) => void
  canTameCard?: (cardId: string) => boolean
  className?: string
}
```

**Test IDs:**
- `player-hand` - Main container
- `hand-cards-container` - Cards container
- `hand-card-{index}` - Individual card slots

---

### 2. PlayField (`src/components/game/PlayField.tsx`)

Displays the battlefield with player and opponent areas.

**Features:**
- Separate sections for player and opponent fields
- Drag-drop target for playing cards from hand
- Card selection and effect activation buttons
- Attack animation states (for future multiplayer)
- Turn indicator
- Field capacity display
- Support for hiding opponent cards

**Props:**
```typescript
interface PlayFieldProps {
  playerCards: CardInstance[]         // Player's field cards
  opponentCards?: CardInstance[]      // Opponent's field cards
  maxFieldSize?: number               // Max cards per field (default: 5)
  selectedCardId?: string | null
  isPlayerTurn?: boolean
  hideOpponentCards?: boolean
  acceptDrop?: boolean
  onCardSelect?: (cardId: string) => void
  onCardAttack?: (attackerId: string, targetId: string) => void
  onCardDrop?: (cardId: string) => void
  onActivateEffect?: (cardId: string) => void
  className?: string
}
```

**Test IDs:**
- `play-field` - Main container
- `player-field` - Player's area
- `opponent-field` - Opponent's area
- `field-card-{index}` - Field cards
- `field-slot-empty-{index}` - Empty drop slots
- `field-card-{index}-effect-btn` - Effect activation button

---

### 3. MarketArea (`src/components/game/MarketArea.tsx`)

Displays purchasable cards with pricing and purchase functionality.

**Features:**
- Grid layout for market cards (6 slots)
- Cost badges with affordability indicator
- Deck count display with visual stack effect
- Take (free) and Tame (pay cost) actions
- Stone value display
- Empty slot indicators
- Low deck warning

**Props:**
```typescript
interface MarketAreaProps {
  cards: CardInstance[]           // Available cards
  deckCount?: number              // Remaining deck size
  maxMarketSize?: number          // Max slots (default: 6)
  currentStones?: number          // Player's stone value
  selectedCardId?: string | null
  onTakeCard?: (cardId: string) => void
  onTameCard?: (cardId: string) => void
  onCardSelect?: (cardId: string) => void
  canTameCard?: (cardId: string) => boolean
  getCardCost?: (cardId: string) => number
  allowTake?: boolean
  allowTame?: boolean
  className?: string
}
```

**Test IDs:**
- `market-area` - Main container
- `deck-indicator` - Deck display
- `market-card-{index}` - Market cards
- `market-card-{index}-take-btn` - Take button
- `market-card-{index}-tame-btn` - Tame button
- `market-slot-empty-{index}` - Empty slots

---

### 4. StonePool (`src/components/game/StonePool.tsx`)

Displays the player's stone resources with element colors.

**Features:**
- Displays all 7 stone types (1-point, 3-point, 6-point, Fire, Water, Earth, Wind)
- Element-colored stones with glow effects
- Total value calculation and display
- Stone limit indicator with warnings
- Compact mode for inline display
- Stone exchange modal (for element stones)
- Responsive grid layout

**Props:**
```typescript
interface StonePoolProps {
  stones: StonePool | null        // Stone pool data
  stoneLimit?: number             // Maximum stone limit
  showExchange?: boolean          // Enable exchange modal
  onExchange?: (fromType: StoneType, toType: StoneType, amount: number) => void
  compact?: boolean               // Compact display mode
  className?: string
}
```

**Test IDs:**
- `stone-pool` - Full mode container
- `stone-pool-compact` - Compact mode container
- `stone-{TYPE}` - Individual stone displays (ONE, THREE, SIX, FIRE, WATER, EARTH, WIND)
- `stone-{TYPE}-compact` - Compact stone displays
- `stone-total` - Total value display

---

## GameBoard Page (`src/pages/GameBoard.tsx`)

Integrates all 4 components into a complete game interface.

**Features:**
- Complete single-player game flow
- Phase-based UI (Draw, Action, Score)
- Game header with round, phase, and deck info
- Action buttons for each phase
- Help and pause modals
- Game over modal with score display
- Error toast notifications
- Responsive layout

**Route:** `/gameboard`

---

## Usage Example

```tsx
import {
  PlayerHand,
  PlayField,
  MarketArea,
  StonePool
} from '@/components/game'

function MyGame() {
  return (
    <div>
      <StonePool stones={playerStones} />
      <PlayField
        playerCards={fieldCards}
        onCardDrop={handleTame}
      />
      <MarketArea
        cards={marketCards}
        onTameCard={handleTameFromMarket}
      />
      <PlayerHand
        cards={handCards}
        onCardPlay={handleTameFromHand}
      />
    </div>
  )
}
```

---

## Styling

All components use:
- **Tailwind CSS** with the project's custom `vale` color palette
- **Element colors:** Fire (red), Water (blue), Earth (green), Wind (purple), Dragon (amber)
- **Fantasy/medieval theme** with gradients, glows, and shadows
- **Responsive design** for desktop and mobile
- **Smooth animations** for interactions

---

## Testing

All components include `data-testid` attributes for E2E testing with Playwright.

Example test:
```typescript
import { test, expect } from '@playwright/test'

test('can play card from hand', async ({ page }) => {
  await page.goto('/gameboard')

  // Find a hand card
  const handCard = page.getByTestId('hand-card-0')
  await expect(handCard).toBeVisible()

  // Drag to field
  const fieldSlot = page.getByTestId('field-slot-empty-0')
  await handCard.dragTo(fieldSlot)
})
```

---

## Dependencies

- React 18+
- TypeScript
- Tailwind CSS
- Lucide React (icons)
- Zustand (state management)

---

## File Structure

```
src/
  components/
    game/
      Card.tsx           # Base card component
      PlayerHand.tsx     # Hand display
      PlayField.tsx      # Battlefield
      MarketArea.tsx     # Market display
      StonePool.tsx      # Resource display
      index.ts           # Barrel exports
  pages/
    GameBoard.tsx        # Main game page
  stores/
    useGameStore.ts      # Game state management
```
