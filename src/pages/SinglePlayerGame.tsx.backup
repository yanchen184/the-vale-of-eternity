/**
 * Single Player Game Page v3.0.0
 * Main gameplay interface for single-player mode
 * @version 3.0.0
 */
console.log('[pages/SinglePlayerGame.tsx] v3.0.0 loaded')

import { useEffect, useCallback, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  useGameStore,
  useGamePhase,
  useHand,
  useField,
  useMarket,
  useStones,
  useDeckSize,
  useGameOver,
  usePlayerName,
  useRound,
  SinglePlayerPhase,
} from '@/stores/useGameStore'
import { calculateStonePoolValue } from '@/types/game'
import type { CardInstance } from '@/types/cards'
import type { StonePool } from '@/types/game'
import './SinglePlayerGame.css'

// ============================================
// STONE DISPLAY COMPONENT
// ============================================

interface StoneDisplayProps {
  stones: StonePool
  totalValue: number
}

function StoneDisplay({ stones, totalValue }: StoneDisplayProps) {
  return (
    <div className="stone-display">
      <h3 className="stone-display__title">Stone Pool</h3>
      <div className="stone-display__grid">
        <div className="stone-display__item stone-display__item--one">
          <span className="stone-display__icon">1</span>
          <span className="stone-display__count">{stones.ONE}</span>
        </div>
        <div className="stone-display__item stone-display__item--three">
          <span className="stone-display__icon">3</span>
          <span className="stone-display__count">{stones.THREE}</span>
        </div>
        <div className="stone-display__item stone-display__item--six">
          <span className="stone-display__icon">6</span>
          <span className="stone-display__count">{stones.SIX}</span>
        </div>
        <div className="stone-display__item stone-display__item--water">
          <span className="stone-display__icon">W</span>
          <span className="stone-display__count">{stones.WATER}</span>
        </div>
        <div className="stone-display__item stone-display__item--fire">
          <span className="stone-display__icon">F</span>
          <span className="stone-display__count">{stones.FIRE}</span>
        </div>
        <div className="stone-display__item stone-display__item--earth">
          <span className="stone-display__icon">E</span>
          <span className="stone-display__count">{stones.EARTH}</span>
        </div>
        <div className="stone-display__item stone-display__item--wind">
          <span className="stone-display__icon">Wi</span>
          <span className="stone-display__count">{stones.WIND}</span>
        </div>
      </div>
      <div className="stone-display__total">
        Total Value: <strong>{totalValue}</strong>
      </div>
    </div>
  )
}

// ============================================
// CARD COMPONENT
// ============================================

interface CardProps {
  card: CardInstance
  onClick?: () => void
  canTame?: boolean
  selected?: boolean
}

function Card({ card, onClick, canTame = false, selected = false }: CardProps) {
  const elementClass = `card--${card.element.toLowerCase()}`
  const tameableClass = canTame ? 'card--tameable' : ''
  const selectedClass = selected ? 'card--selected' : ''

  return (
    <div
      className={`card ${elementClass} ${tameableClass} ${selectedClass}`}
      onClick={onClick}
      data-testid={`card-${card.instanceId}`}
    >
      <div className="card__header">
        <span className="card__cost">{card.cost}</span>
        <span className="card__element">{card.element.charAt(0)}</span>
      </div>
      <div className="card__body">
        <h4 className="card__name">{card.nameTw}</h4>
        <p className="card__name-en">{card.name}</p>
      </div>
      <div className="card__footer">
        <span className="card__score">{card.baseScore}</span>
        {card.effects.length > 0 && (
          <span className="card__effect-indicator" title={card.effects[0]?.descriptionTw}>
            &#9733;
          </span>
        )}
      </div>
    </div>
  )
}

// ============================================
// GAME OVER OVERLAY
// ============================================

interface GameOverOverlayProps {
  score: number | null
  breakdown: {
    baseScores: Array<{ cardId: string; cardName: string; baseScore: number }>
    totalBaseScore: number
    effectBonuses: Array<{ cardId: string; bonus: number }>
    totalEffectBonus: number
    stoneValue: number
    grandTotal: number
  } | null
  onPlayAgain: () => void
  onBackToMenu: () => void
}

function GameOverOverlay({ score, breakdown, onPlayAgain, onBackToMenu }: GameOverOverlayProps) {
  return (
    <div className="game-over-overlay">
      <div className="game-over-overlay__content">
        <h2 className="game-over-overlay__title">Game Over</h2>
        <div className="game-over-overlay__score">
          <span className="game-over-overlay__label">Final Score</span>
          <span className="game-over-overlay__value">{score ?? 0}</span>
        </div>

        {breakdown && (
          <div className="game-over-overlay__breakdown">
            <h3>Score Breakdown</h3>
            <div className="game-over-overlay__breakdown-row">
              <span>Base Scores:</span>
              <span>{breakdown.totalBaseScore}</span>
            </div>
            <div className="game-over-overlay__breakdown-row">
              <span>Effect Bonuses:</span>
              <span>{breakdown.totalEffectBonus}</span>
            </div>
            <div className="game-over-overlay__breakdown-row">
              <span>Stone Value:</span>
              <span>{breakdown.stoneValue}</span>
            </div>
            <div className="game-over-overlay__breakdown-row game-over-overlay__breakdown-row--total">
              <span>Grand Total:</span>
              <span>{breakdown.grandTotal}</span>
            </div>
          </div>
        )}

        <div className="game-over-overlay__actions">
          <button className="game-over-overlay__button" onClick={onPlayAgain}>
            Play Again
          </button>
          <button className="game-over-overlay__button game-over-overlay__button--secondary" onClick={onBackToMenu}>
            Back to Menu
          </button>
        </div>
      </div>
    </div>
  )
}

// ============================================
// MAIN GAME COMPONENT
// ============================================

export default function SinglePlayerGame() {
  const navigate = useNavigate()

  // Store hooks
  const phase = useGamePhase()
  const hand = useHand()
  const field = useField()
  const market = useMarket()
  const stones = useStones()
  const deckSize = useDeckSize()
  const { isOver, score, breakdown } = useGameOver()
  const playerName = usePlayerName()
  const round = useRound()

  // Store actions
  const {
    startGame,
    drawCard,
    tameCreature,
    pass,
    endGame,
    resetGame,
    canTameCard,
    error,
  } = useGameStore()

  // Compute stone value with useMemo to prevent infinite loop
  const totalStoneValue = useMemo(() => {
    return stones ? calculateStonePoolValue(stones) : 0
  }, [stones])

  // Initialize game if not started
  useEffect(() => {
    if (!phase) {
      const savedName = localStorage.getItem('playerName') || 'Player'
      startGame(savedName)
    }
  }, [phase, startGame])

  // Handle card click from hand
  const handleHandCardClick = useCallback((card: CardInstance) => {
    if (phase !== SinglePlayerPhase.ACTION) return
    if (!canTameCard(card.instanceId)) return

    tameCreature(card.instanceId, 'HAND')
  }, [phase, canTameCard, tameCreature])

  // Handle card click from market
  const handleMarketCardClick = useCallback((card: CardInstance) => {
    if (phase !== SinglePlayerPhase.ACTION) return
    if (!canTameCard(card.instanceId)) return

    tameCreature(card.instanceId, 'MARKET')
  }, [phase, canTameCard, tameCreature])

  // Handle draw action
  const handleDraw = useCallback(() => {
    if (phase !== SinglePlayerPhase.DRAW) return
    drawCard()
  }, [phase, drawCard])

  // Handle pass action
  const handlePass = useCallback(() => {
    if (phase !== SinglePlayerPhase.ACTION) return
    pass()
  }, [phase, pass])

  // Handle end game action
  const handleEndGame = useCallback(() => {
    endGame()
  }, [endGame])

  // Handle play again
  const handlePlayAgain = useCallback(() => {
    resetGame()
    const savedName = localStorage.getItem('playerName') || 'Player'
    startGame(savedName)
  }, [resetGame, startGame])

  // Handle back to menu
  const handleBackToMenu = useCallback(() => {
    resetGame()
    navigate('/')
  }, [resetGame, navigate])

  // Show loading state if game not initialized
  if (!phase || !stones) {
    return (
      <div className="single-player-game single-player-game--loading">
        <div className="loading-spinner">Loading...</div>
      </div>
    )
  }

  return (
    <div className="single-player-game" data-testid="single-player-game">
      {/* Header */}
      <header className="single-player-game__header">
        <div className="single-player-game__info">
          <span className="single-player-game__player">{playerName}</span>
          <span className="single-player-game__round">Round {round}</span>
          <span className="single-player-game__phase">{phase}</span>
          <span className="single-player-game__deck">Deck: {deckSize}</span>
        </div>

        <div className="single-player-game__actions">
          {phase === SinglePlayerPhase.DRAW && (
            <button
              className="single-player-game__button single-player-game__button--primary"
              onClick={handleDraw}
            >
              Draw Card
            </button>
          )}

          {phase === SinglePlayerPhase.ACTION && (
            <>
              <button
                className="single-player-game__button"
                onClick={handlePass}
              >
                Pass
              </button>
              <button
                className="single-player-game__button single-player-game__button--danger"
                onClick={handleEndGame}
              >
                End Game
              </button>
            </>
          )}
        </div>
      </header>

      {/* Error display */}
      {error && (
        <div className="single-player-game__error">
          {error}
        </div>
      )}

      {/* Stone Display */}
      <aside className="single-player-game__sidebar">
        <StoneDisplay stones={stones} totalValue={totalStoneValue} />
      </aside>

      {/* Main game area */}
      <main className="single-player-game__main">
        {/* Market */}
        <section className="single-player-game__market">
          <h2 className="single-player-game__section-title">Market</h2>
          <div className="single-player-game__card-row">
            {market.map((card: CardInstance) => (
              <Card
                key={card.instanceId}
                card={card}
                onClick={() => handleMarketCardClick(card)}
                canTame={phase === SinglePlayerPhase.ACTION && canTameCard(card.instanceId)}
              />
            ))}
          </div>
        </section>

        {/* Field */}
        <section className="single-player-game__field">
          <h2 className="single-player-game__section-title">
            Field ({field.length}/12)
          </h2>
          <div className="single-player-game__card-grid">
            {field.map((card: CardInstance) => (
              <Card key={card.instanceId} card={card} />
            ))}
          </div>
        </section>

        {/* Hand */}
        <section className="single-player-game__hand">
          <h2 className="single-player-game__section-title">
            Hand ({hand.length})
          </h2>
          <div className="single-player-game__card-row">
            {hand.map((card: CardInstance) => (
              <Card
                key={card.instanceId}
                card={card}
                onClick={() => handleHandCardClick(card)}
                canTame={phase === SinglePlayerPhase.ACTION && canTameCard(card.instanceId)}
              />
            ))}
          </div>
        </section>
      </main>

      {/* Game Over Overlay */}
      {isOver && (
        <GameOverOverlay
          score={score}
          breakdown={breakdown}
          onPlayAgain={handlePlayAgain}
          onBackToMenu={handleBackToMenu}
        />
      )}
    </div>
  )
}
