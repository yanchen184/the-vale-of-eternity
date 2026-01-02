/**
 * Game Log Service
 * Handles Firebase synchronization for game action logs
 * @version 1.0.0
 */
console.log('[services/game-log-service.ts] v1.0.0 loaded')

import { ref, push, query, orderByChild, limitToLast, onValue, off } from 'firebase/database'
import { database } from '@/lib/firebase'
import type {
  GameActionLog,
  GameActionLogData,
  GameActionType,
  CoinChange,
} from '@/types/game-log'
import type { PlayerColor } from '@/types/player-color'

// ============================================
// CONSTANTS
// ============================================

/** Maximum number of logs to fetch from Firebase */
const MAX_LOGS_TO_FETCH = 100

// ============================================
// SERVICE CLASS
// ============================================

class GameLogService {
  /**
   * Add a game action log to Firebase
   */
  async addLog(
    gameId: string,
    type: GameActionType,
    playerId: string,
    playerName: string,
    playerColor: PlayerColor,
    round: number,
    phase: 'WAITING' | 'HUNTING' | 'ACTION' | 'RESOLUTION' | 'ENDED',
    description: string,
    options?: {
      cardIds?: string[]
      cardNames?: string[]
      artifactId?: string
      artifactName?: string
      coinsChange?: CoinChange
    }
  ): Promise<void> {
    try {
      const logData: GameActionLogData = {
        type,
        playerId,
        playerName,
        playerColor,
        round,
        phase,
        timestamp: Date.now(),
        description,
        ...options,
      }

      const logsRef = ref(database, `games/${gameId}/actionLogs`)
      await push(logsRef, logData)
    } catch (error) {
      console.error('[GameLogService] Failed to add log:', error)
      // Don't throw - log failures shouldn't block game progress
    }
  }

  /**
   * Subscribe to game action logs
   * @param gameId Game ID
   * @param callback Callback function called with logs array when data changes
   * @param limit Maximum number of logs to fetch (default: 100)
   * @returns Unsubscribe function
   */
  subscribeLogs(
    gameId: string,
    callback: (logs: GameActionLog[]) => void,
    limit: number = MAX_LOGS_TO_FETCH
  ): () => void {
    const logsRef = ref(database, `games/${gameId}/actionLogs`)
    const logsQuery = query(logsRef, orderByChild('timestamp'), limitToLast(limit))

    const unsubscribe = onValue(
      logsQuery,
      (snapshot) => {
        const logs: GameActionLog[] = []

        snapshot.forEach((childSnapshot) => {
          const log = childSnapshot.val() as GameActionLogData
          logs.push({
            id: childSnapshot.key!,
            ...log,
          })
        })

        // Sort by timestamp descending (newest first)
        logs.sort((a, b) => b.timestamp - a.timestamp)

        callback(logs)
      },
      (error) => {
        console.error('[GameLogService] Failed to subscribe to logs:', error)
      }
    )

    // Return unsubscribe function
    return unsubscribe
  }

  /**
   * Unsubscribe from game action logs
   */
  unsubscribeLogs(gameId: string): void {
    const logsRef = ref(database, `games/${gameId}/actionLogs`)
    off(logsRef)
  }
}

// ============================================
// SINGLETON INSTANCE
// ============================================

export const gameLogService = new GameLogService()

// ============================================
// CONVENIENCE FUNCTIONS
// ============================================

/**
 * Log game start
 */
export async function logGameStart(
  gameId: string,
  playerId: string,
  playerName: string,
  playerColor: PlayerColor
): Promise<void> {
  await gameLogService.addLog(
    gameId,
    'GAME_START' as GameActionType,
    playerId,
    playerName,
    playerColor,
    0,
    'WAITING',
    '遊戲開始'
  )
}

/**
 * Log round start
 */
export async function logRoundStart(
  gameId: string,
  round: number,
  playerId: string,
  playerName: string,
  playerColor: PlayerColor
): Promise<void> {
  await gameLogService.addLog(
    gameId,
    'ROUND_START' as GameActionType,
    playerId,
    playerName,
    playerColor,
    round,
    'HUNTING',
    `第 ${round} 回合開始`
  )
}

/**
 * Log artifact selection
 */
export async function logArtifactSelected(
  gameId: string,
  playerId: string,
  playerName: string,
  playerColor: PlayerColor,
  round: number,
  artifactId: string,
  artifactName: string
): Promise<void> {
  await gameLogService.addLog(
    gameId,
    'ARTIFACT_SELECTED' as GameActionType,
    playerId,
    playerName,
    playerColor,
    round,
    'HUNTING',
    `${playerName} 選擇了神器「${artifactName}」`,
    {
      artifactId,
      artifactName,
    }
  )
}

/**
 * Log card selection (during hunting phase)
 */
export async function logCardSelected(
  gameId: string,
  playerId: string,
  playerName: string,
  playerColor: PlayerColor,
  round: number,
  cardInstanceId: string,
  cardName: string
): Promise<void> {
  await gameLogService.addLog(
    gameId,
    'CARD_SELECTED' as GameActionType,
    playerId,
    playerName,
    playerColor,
    round,
    'HUNTING',
    `${playerName} 選擇了「${cardName}」`,
    {
      cardIds: [cardInstanceId],
      cardNames: [cardName],
    }
  )
}

/**
 * Log selection confirmation
 */
export async function logSelectionConfirmed(
  gameId: string,
  playerId: string,
  playerName: string,
  playerColor: PlayerColor,
  round: number,
  cardInstanceIds: string[],
  cardNames: string[]
): Promise<void> {
  const cardsText = cardNames.join('、')
  await gameLogService.addLog(
    gameId,
    'SELECTION_CONFIRMED' as GameActionType,
    playerId,
    playerName,
    playerColor,
    round,
    'HUNTING',
    `${playerName} 確認選擇：${cardsText}`,
    {
      cardIds: cardInstanceIds,
      cardNames,
    }
  )
}

/**
 * Log card draw
 */
export async function logDrawCard(
  gameId: string,
  playerId: string,
  playerName: string,
  playerColor: PlayerColor,
  round: number
): Promise<void> {
  await gameLogService.addLog(
    gameId,
    'DRAW_CARD' as GameActionType,
    playerId,
    playerName,
    playerColor,
    round,
    'ACTION',
    `${playerName} 從牌庫抽取 1 張卡`
  )
}

/**
 * Log tame card
 */
export async function logTameCard(
  gameId: string,
  playerId: string,
  playerName: string,
  playerColor: PlayerColor,
  round: number,
  cardInstanceId: string,
  cardName: string,
  cost: number
): Promise<void> {
  await gameLogService.addLog(
    gameId,
    'TAME_CARD' as GameActionType,
    playerId,
    playerName,
    playerColor,
    round,
    'ACTION',
    `${playerName} 馴服了「${cardName}」（花費 ${cost} 元）`,
    {
      cardIds: [cardInstanceId],
      cardNames: [cardName],
    }
  )
}

/**
 * Log sell card
 */
export async function logSellCard(
  gameId: string,
  playerId: string,
  playerName: string,
  playerColor: PlayerColor,
  round: number,
  cardInstanceId: string,
  cardName: string,
  coins: CoinChange
): Promise<void> {
  const totalValue = (coins.six || 0) * 6 + (coins.three || 0) * 3 + (coins.one || 0) * 1
  await gameLogService.addLog(
    gameId,
    'SELL_CARD' as GameActionType,
    playerId,
    playerName,
    playerColor,
    round,
    'ACTION',
    `${playerName} 賣掉了「${cardName}」（獲得 ${totalValue} 元）`,
    {
      cardIds: [cardInstanceId],
      cardNames: [cardName],
      coinsChange: coins,
    }
  )
}

/**
 * Log player passed
 */
export async function logPlayerPassed(
  gameId: string,
  playerId: string,
  playerName: string,
  playerColor: PlayerColor,
  round: number
): Promise<void> {
  await gameLogService.addLog(
    gameId,
    'PLAYER_PASSED' as GameActionType,
    playerId,
    playerName,
    playerColor,
    round,
    'ACTION',
    `${playerName} 跳過本輪`
  )
}

/**
 * Log round end
 */
export async function logRoundEnd(
  gameId: string,
  round: number,
  playerId: string,
  playerName: string,
  playerColor: PlayerColor
): Promise<void> {
  await gameLogService.addLog(
    gameId,
    'ROUND_END' as GameActionType,
    playerId,
    playerName,
    playerColor,
    round,
    'RESOLUTION',
    `第 ${round} 回合結束`
  )
}

/**
 * Log game end
 */
export async function logGameEnd(
  gameId: string,
  playerId: string,
  playerName: string,
  playerColor: PlayerColor,
  round: number
): Promise<void> {
  await gameLogService.addLog(
    gameId,
    'GAME_END' as GameActionType,
    playerId,
    playerName,
    playerColor,
    round,
    'ENDED',
    '遊戲結束'
  )
}
