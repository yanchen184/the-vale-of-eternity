/**
 * ActionPhaseUI Component
 * Shared action phase UI for both single-player and multiplayer games
 * Displays player field areas and resolution phase controls
 * @version 1.0.0
 */
console.log('[components/game/ActionPhaseUI.tsx] v1.0.0 loaded')

import { PlayersFieldArea } from './PlayersFieldArea'
import { Button } from '@/components/ui/Button'
import type { CardInstance } from '@/types/cards'
import type { PlayerFieldData } from './PlayersFieldArea'
import type { PlayerScoreInfo } from './ScoreTrack'

// ============================================
// TYPES
// ============================================

export interface ActionPhaseUIProps {
  playersFieldData: PlayerFieldData[]
  handCards: CardInstance[]
  playerScores: PlayerScoreInfo[]
  currentPlayerId: string
  currentRound: number
  gameStatus: 'WAITING' | 'HUNTING' | 'ACTION' | 'RESOLUTION' | 'ENDED'
  isYourTurn: boolean
  onCardPlay: (cardId: string) => void
  onCardSell: (cardId: string) => void
  onHandCardDiscard: (cardId: string) => void
  onCardReturn: (playerId: string, cardId: string) => void
  onCardDiscard: (playerId: string, cardId: string) => void
  onScoreAdjust: (playerId: string, score: number) => void
  onFlipToggle: (playerId: string) => void
  canTameCard: (cardId: string) => boolean
  resolutionMode?: boolean
  onFinishResolution?: () => void
}

// ============================================
// COMPONENT
// ============================================

export function ActionPhaseUI({
  playersFieldData,
  handCards: _handCards,
  playerScores: _playerScores,
  currentPlayerId,
  currentRound,
  gameStatus,
  isYourTurn: _isYourTurn,
  onCardPlay: _onCardPlay,
  onCardSell: _onCardSell,
  onHandCardDiscard: _onHandCardDiscard,
  onCardReturn,
  onCardDiscard,
  onScoreAdjust: _onScoreAdjust,
  onFlipToggle: _onFlipToggle,
  canTameCard: _canTameCard,
  resolutionMode = false,
  onFinishResolution,
}: ActionPhaseUIProps) {
  // Reserved for future use
  void _handCards
  void _playerScores
  void _isYourTurn
  void _onCardPlay
  void _onCardSell
  void _onHandCardDiscard
  void _onScoreAdjust
  void _onFlipToggle
  void _canTameCard

  // Split players: self first, others after
  const selfPlayer = playersFieldData.find(p => p.playerId === currentPlayerId)
  const otherPlayers = playersFieldData.filter(p => p.playerId !== currentPlayerId)

  return (
    <div className="flex-1 flex flex-col" data-testid={resolutionMode ? "resolution-phase" : "action-phase"}>
      {/* Top Section - Field Area & Hand */}
      <div className="flex-1 overflow-y-auto overflow-x-visible p-2 space-y-1 custom-scrollbar min-h-0">
        {/* Self Player's Field Area */}
        {selfPlayer && (
          <PlayersFieldArea
            players={[selfPlayer]}
            currentPlayerId={currentPlayerId}
            phase={gameStatus}
            currentRound={currentRound}
            onCardReturn={onCardReturn}
            onCardDiscard={onCardDiscard}
          />
        )}

        {/* Player Hand - Now in floating window */}

        {/* Other Players' Field Area */}
        {otherPlayers.length > 0 && (
          <PlayersFieldArea
            players={otherPlayers}
            currentPlayerId={currentPlayerId}
            phase={gameStatus}
            currentRound={currentRound}
            onCardReturn={onCardReturn}
            onCardDiscard={onCardDiscard}
          />
        )}
      </div>

      {/* Resolution Mode - Finish Button */}
      {resolutionMode && _isYourTurn && onFinishResolution && (
        <div className="flex-shrink-0 p-3 pt-2 border-t border-purple-900/30">
          <Button
            onClick={onFinishResolution}
            className="w-full bg-gradient-to-r from-purple-600 to-purple-500 hover:from-purple-500 hover:to-purple-400"
            data-testid="finish-resolution-btn"
          >
            完成結算（觸發回合結束效果）
          </Button>
        </div>
      )}

      {/* Resolution Mode - Waiting Message */}
      {resolutionMode && !_isYourTurn && (
        <div className="flex-shrink-0 p-3 pt-2 border-t border-purple-900/30">
          <p className="text-center text-slate-400 text-sm">
            等待其他玩家完成結算...
          </p>
        </div>
      )}
    </div>
  )
}

export default ActionPhaseUI
