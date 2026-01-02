/**
 * CardActionPanel Component
 * Context action panel that appears next to selected card
 * Replaces the bottom button bar on cards
 * @version 1.2.0 - Removed card info header for cleaner interface
 */
console.log('[components/game/CardActionPanel.tsx] v1.2.0 loaded')

import { memo } from 'react'
import { Wand2, Coins, Trash2, Shield } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { CardInstance } from '@/types/cards'
import { getElementSellCoins } from '@/services/multiplayer-game'

// ============================================
// TYPES
// ============================================

export interface CardActionPanelProps {
  card: CardInstance
  onTame?: () => void
  onSell?: () => void
  onDiscard?: () => void
  onSanctuary?: () => void
  canTame: boolean
  canSell: boolean
  position?: 'right' | 'top'
}

type ActionVariant = 'success' | 'warning' | 'danger' | 'info'

interface ActionButtonProps {
  icon: React.ReactNode
  label: string
  description: string
  disabled?: boolean
  variant: ActionVariant
  onClick: () => void
}

// ============================================
// ACTION BUTTON
// ============================================

const ActionButton = memo(function ActionButton({
  icon,
  label,
  description,
  disabled,
  variant,
  onClick,
}: ActionButtonProps) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={cn(
        'action-button',
        `action-button--${variant}`
      )}
      data-testid={`action-${label.toLowerCase()}`}
    >
      <span className="flex-shrink-0 w-5 h-5">{icon}</span>
      <div className="flex-1 min-w-0">
        <div className="font-medium text-sm">{label}</div>
        <div className="text-xs opacity-70 truncate">{description}</div>
      </div>
    </button>
  )
})

// ============================================
// MAIN COMPONENT
// ============================================

export const CardActionPanel = memo(function CardActionPanel({
  card,
  onTame,
  onSell,
  onDiscard,
  onSanctuary,
  canTame,
  canSell,
  position = 'right',
}: CardActionPanelProps) {
  const sellCoins = getElementSellCoins(card.element)

  // Build detailed coin description
  const coinParts: string[] = []
  if (sellCoins.six > 0) coinParts.push(`${sellCoins.six}個6分`)
  if (sellCoins.three > 0) coinParts.push(`${sellCoins.three}個3分`)
  if (sellCoins.one > 0) coinParts.push(`${sellCoins.one}個1分`)

  // Format sell description
  const sellDescription = canSell
    ? `獲得${coinParts.join('和')}石頭`
    : '僅限本回合獲得的卡片'

  return (
    <div
      className={cn(
        position === 'right' ? 'flex flex-col gap-2' : 'action-panel',
        position === 'top' && 'absolute bottom-full left-0 mb-2'
      )}
      data-testid="card-action-panel"
    >
      {/* Action Buttons */}
      {onTame && (
        <ActionButton
          icon={<Wand2 className="w-5 h-5" />}
          label="召喚"
          description={canTame ? '將此卡片召喚至場上' : '魔力不足'}
          disabled={!canTame}
          variant="success"
          onClick={onTame}
        />
      )}

      {onSell && (
        <ActionButton
          icon={<Coins className="w-5 h-5" />}
          label="賣出"
          description={sellDescription}
          disabled={!canSell}
          variant="warning"
          onClick={onSell}
        />
      )}

      {onDiscard && (
        <ActionButton
          icon={<Trash2 className="w-5 h-5" />}
          label="棄置"
          description="將此卡片丟入棄牌堆"
          disabled={false}
          variant="danger"
          onClick={onDiscard}
        />
      )}

      {onSanctuary && (
        <ActionButton
          icon={<Shield className="w-5 h-5" />}
          label="棲息地"
          description="移至棲息地保護"
          disabled={false}
          variant="info"
          onClick={onSanctuary}
        />
      )}
    </div>
  )
})

export default CardActionPanel
