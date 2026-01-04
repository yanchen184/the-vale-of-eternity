/**
 * ArtifactEffectModal Component v1.0.0
 * Modal for selecting artifact effect options and cards
 * Supports multiple selection modes: CHOOSE_OPTION, SELECT_CARDS, SELECT_STONES
 * @version 1.0.0
 */
console.log('[components/game/ArtifactEffectModal.tsx] v1.0.0 loaded')

import { memo, useState, useCallback, useMemo } from 'react'
import { cn } from '@/lib/utils'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { GlassCard } from '@/components/ui/GlassCard'
import { Card } from '@/components/game/Card'
import { ARTIFACTS_BY_ID } from '@/data/artifacts'
import type { Artifact } from '@/types/artifacts'
import type { CardInstance } from '@/types/cards'

// ============================================
// TYPES
// ============================================

export interface ArtifactEffectOption {
  id: string
  description: string
  descriptionTw: string
  available: boolean
  unavailableReason?: string
}

export type EffectInputType = 'CHOOSE_OPTION' | 'SELECT_CARDS' | 'SELECT_STONES'

export interface ArtifactEffectModalProps {
  /** Whether the modal is open */
  isOpen: boolean
  /** Callback to close the modal */
  onClose: () => void
  /** Current artifact ID */
  artifactId: string | null
  /** Current input type required */
  inputType: EffectInputType
  /** Available options for CHOOSE_OPTION mode */
  options: ArtifactEffectOption[]
  /** Cards available for selection (for SELECT_CARDS mode) */
  selectableCards: CardInstance[]
  /** Minimum number of cards to select */
  minCardSelection?: number
  /** Maximum number of cards to select */
  maxCardSelection?: number
  /** Current round (for card display) */
  currentRound: number
  /** Label for card selection area */
  cardSelectionLabel?: string
  /** Callback when option is confirmed */
  onConfirmOption: (optionId: string) => void
  /** Callback when cards are confirmed */
  onConfirmCards: (cardIds: string[]) => void
  /** Callback when both option and cards are confirmed */
  onConfirmOptionWithCards?: (optionId: string, cardIds: string[]) => void
  /** Additional CSS classes */
  className?: string
}

// ============================================
// OPTION CARD COMPONENT
// ============================================

interface OptionCardProps {
  option: ArtifactEffectOption
  isSelected: boolean
  onSelect: () => void
  index: number
}

const OptionCard = memo(function OptionCard({
  option,
  isSelected,
  onSelect,
  index,
}: OptionCardProps) {
  return (
    <button
      type="button"
      onClick={option.available ? onSelect : undefined}
      disabled={!option.available}
      className={cn(
        'w-full p-4 rounded-xl border-2 text-left transition-all duration-200',
        option.available
          ? 'cursor-pointer hover:scale-[1.02]'
          : 'cursor-not-allowed opacity-50',
        isSelected
          ? 'border-amber-500 bg-amber-900/30 ring-2 ring-amber-500/50 shadow-lg shadow-amber-500/20'
          : option.available
            ? 'border-slate-600 bg-slate-800/50 hover:border-purple-500/50 hover:bg-purple-900/20'
            : 'border-slate-700 bg-slate-900/50'
      )}
      data-testid={`option-${option.id}`}
    >
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          {/* Selection indicator */}
          <div
            className={cn(
              'w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0',
              isSelected
                ? 'border-amber-500 bg-amber-500'
                : option.available
                  ? 'border-slate-500'
                  : 'border-slate-600'
            )}
          >
            {isSelected && (
              <svg
                className="w-3 h-3 text-white"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                  clipRule="evenodd"
                />
              </svg>
            )}
          </div>

          <span
            className={cn(
              'font-bold',
              isSelected ? 'text-amber-300' : 'text-slate-200'
            )}
          >
            選項 {index === 0 ? 'A' : 'B'}
          </span>
        </div>

        <p
          className={cn(
            'text-sm pl-7',
            isSelected ? 'text-amber-100' : 'text-slate-300'
          )}
        >
          {option.descriptionTw}
        </p>

        {!option.available && option.unavailableReason && (
          <p className="text-xs text-red-400 pl-7">
            {option.unavailableReason}
          </p>
        )}
      </div>
    </button>
  )
})

// ============================================
// CARD SELECTION COMPONENT
// ============================================

interface CardSelectionGridProps {
  cards: CardInstance[]
  selectedCardIds: Set<string>
  onToggleCard: (cardId: string) => void
  currentRound: number
  label?: string
  minSelection?: number
  maxSelection?: number
}

const CardSelectionGrid = memo(function CardSelectionGrid({
  cards,
  selectedCardIds,
  onToggleCard,
  currentRound,
  label,
  minSelection = 1,
  maxSelection = 1,
}: CardSelectionGridProps) {
  const canSelectMore = selectedCardIds.size < maxSelection

  return (
    <div className="space-y-3">
      {label && (
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-bold text-slate-300">{label}</h4>
          <span className="text-xs text-slate-500">
            已選擇 {selectedCardIds.size} / {maxSelection}
            {minSelection > 0 && ` (最少 ${minSelection})`}
          </span>
        </div>
      )}

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 max-h-[50vh] overflow-y-auto custom-scrollbar p-1">
        {cards.map((card, index) => {
          const isSelected = selectedCardIds.has(card.instanceId)
          const canSelect = isSelected || canSelectMore

          return (
            <button
              key={card.instanceId}
              type="button"
              onClick={() => canSelect && onToggleCard(card.instanceId)}
              disabled={!canSelect}
              className={cn(
                'relative transition-all duration-200',
                canSelect ? 'cursor-pointer' : 'cursor-not-allowed opacity-50'
              )}
              data-testid={`select-card-${index}`}
            >
              <div
                className={cn(
                  'rounded-lg overflow-hidden border-2 transition-all',
                  isSelected
                    ? 'border-amber-500 ring-2 ring-amber-500/50 scale-105'
                    : canSelect
                      ? 'border-transparent hover:border-purple-500/50'
                      : 'border-transparent'
                )}
              >
                <Card
                  card={card}
                  index={index}
                  compact
                  currentRound={currentRound}
                />
              </div>

              {/* Selected indicator */}
              {isSelected && (
                <div className="absolute top-1 right-1 w-6 h-6 rounded-full bg-amber-500 flex items-center justify-center shadow-lg z-10">
                  <svg
                    className="w-4 h-4 text-white"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
              )}
            </button>
          )
        })}

        {cards.length === 0 && (
          <div className="col-span-full text-center py-8 text-slate-500">
            沒有可選擇的卡牌
          </div>
        )}
      </div>
    </div>
  )
})

// ============================================
// MAIN COMPONENT
// ============================================

export const ArtifactEffectModal = memo(function ArtifactEffectModal({
  isOpen,
  onClose,
  artifactId,
  inputType,
  options,
  selectableCards,
  minCardSelection = 1,
  maxCardSelection = 1,
  currentRound,
  cardSelectionLabel,
  onConfirmOption,
  onConfirmCards,
  onConfirmOptionWithCards,
  className,
}: ArtifactEffectModalProps) {
  // State
  const [selectedOptionId, setSelectedOptionId] = useState<string | null>(null)
  const [selectedCardIds, setSelectedCardIds] = useState<Set<string>>(new Set())

  // Get artifact data
  const artifact = useMemo<Artifact | null>(() => {
    if (!artifactId) return null
    return ARTIFACTS_BY_ID[artifactId] || null
  }, [artifactId])

  // Reset state when modal opens/closes
  const handleClose = useCallback(() => {
    setSelectedOptionId(null)
    setSelectedCardIds(new Set())
    onClose()
  }, [onClose])

  // Handle option selection
  const handleSelectOption = useCallback((optionId: string) => {
    setSelectedOptionId(optionId)
    // Reset card selection when option changes
    setSelectedCardIds(new Set())
  }, [])

  // Handle card toggle
  const handleToggleCard = useCallback((cardId: string) => {
    setSelectedCardIds(prev => {
      const newSet = new Set(prev)
      if (newSet.has(cardId)) {
        newSet.delete(cardId)
      } else if (newSet.size < maxCardSelection) {
        newSet.add(cardId)
      }
      return newSet
    })
  }, [maxCardSelection])

  // Handle confirm
  const handleConfirm = useCallback(() => {
    if (inputType === 'CHOOSE_OPTION') {
      if (selectedOptionId) {
        // Check if this option needs card selection
        const needsCards = selectedOptionId === 'buy_card' ||
                          selectedOptionId === 'shelter_hand' ||
                          selectedOptionId === 'option_a'

        if (needsCards && selectedCardIds.size >= minCardSelection && onConfirmOptionWithCards) {
          onConfirmOptionWithCards(selectedOptionId, Array.from(selectedCardIds))
        } else if (!needsCards || selectedCardIds.size >= minCardSelection) {
          onConfirmOption(selectedOptionId)
        }
      }
    } else if (inputType === 'SELECT_CARDS') {
      if (selectedCardIds.size >= minCardSelection) {
        onConfirmCards(Array.from(selectedCardIds))
      }
    }
    handleClose()
  }, [inputType, selectedOptionId, selectedCardIds, minCardSelection, onConfirmOption, onConfirmCards, onConfirmOptionWithCards, handleClose])

  // Determine if confirm is enabled
  const canConfirm = useMemo(() => {
    if (inputType === 'CHOOSE_OPTION') {
      if (!selectedOptionId) return false
      // Some options require card selection
      const selectedOption = options.find(o => o.id === selectedOptionId)
      if (!selectedOption?.available) return false

      // Check if this option needs cards
      const needsCards = selectedOptionId === 'buy_card' || selectedOptionId === 'shelter_hand'
      if (needsCards) {
        return selectedCardIds.size >= minCardSelection
      }
      return true
    }
    if (inputType === 'SELECT_CARDS') {
      return selectedCardIds.size >= minCardSelection
    }
    return false
  }, [inputType, selectedOptionId, selectedCardIds, options, minCardSelection])

  // Determine which cards to show based on selected option
  const displayCards = useMemo(() => {
    if (inputType === 'SELECT_CARDS') {
      return selectableCards
    }
    if (inputType === 'CHOOSE_OPTION' && selectedOptionId) {
      // Show cards only for options that need card selection
      if (selectedOptionId === 'buy_card') {
        return selectableCards.filter(c => c.location === 'MARKET')
      }
      if (selectedOptionId === 'shelter_hand') {
        return selectableCards.filter(c => c.location === 'HAND')
      }
    }
    return []
  }, [inputType, selectedOptionId, selectableCards])

  // Show card selection after option is selected
  const showCardSelection = useMemo(() => {
    if (inputType === 'SELECT_CARDS') return true
    if (inputType === 'CHOOSE_OPTION' && selectedOptionId) {
      return ['buy_card', 'shelter_hand', 'option_a'].includes(selectedOptionId)
    }
    return false
  }, [inputType, selectedOptionId])

  if (!artifact) return null

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={`${artifact.nameTw} - 選擇效果`}
      size="xl"
      showMinimizeButton={true}
      className={className}
    >
      <div className="p-4 space-y-4" data-testid="artifact-effect-modal">
        {/* Artifact Info */}
        <GlassCard variant="default" padding="sm" className="bg-purple-900/20">
          <div className="flex items-center gap-3">
            <img
              src={artifact.image}
              alt={artifact.nameTw}
              className="w-12 h-16 object-cover rounded-lg"
            />
            <div>
              <h3 className="font-bold text-amber-300">{artifact.nameTw}</h3>
              <p className="text-sm text-slate-400">{artifact.descriptionTw}</p>
            </div>
          </div>
        </GlassCard>

        {/* Option Selection */}
        {inputType === 'CHOOSE_OPTION' && options.length > 0 && (
          <div className="space-y-3">
            <h4 className="text-sm font-bold text-slate-300">選擇效果：</h4>
            <div className="space-y-2">
              {options.map((option, index) => (
                <OptionCard
                  key={option.id}
                  option={option}
                  isSelected={selectedOptionId === option.id}
                  onSelect={() => handleSelectOption(option.id)}
                  index={index}
                />
              ))}
            </div>
          </div>
        )}

        {/* Card Selection (shown after option or directly for SELECT_CARDS) */}
        {showCardSelection && displayCards.length > 0 && (
          <CardSelectionGrid
            cards={displayCards}
            selectedCardIds={selectedCardIds}
            onToggleCard={handleToggleCard}
            currentRound={currentRound}
            label={cardSelectionLabel || '選擇卡牌：'}
            minSelection={minCardSelection}
            maxSelection={maxCardSelection}
          />
        )}

        {/* Action Buttons */}
        <div className="flex gap-3 pt-4 border-t border-slate-700">
          <Button
            variant="outline"
            onClick={handleClose}
            className="flex-1"
          >
            取消
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={!canConfirm}
            className={cn(
              'flex-1',
              canConfirm
                ? 'bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500'
                : 'bg-slate-700 cursor-not-allowed'
            )}
            data-testid="confirm-effect-btn"
          >
            確認
          </Button>
        </div>
      </div>
    </Modal>
  )
})

export default ArtifactEffectModal
