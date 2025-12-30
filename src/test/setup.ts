/**
 * Test setup file for Vitest
 * Configures testing environment and mocks
 * @version 1.0.0
 */
import '@testing-library/jest-dom'
import { vi, beforeEach, afterEach } from 'vitest'

// ============================================
// GLOBAL MOCKS
// ============================================

// Mock console.log for cleaner test output (optional)
const originalConsoleLog = console.log
beforeEach(() => {
  // Suppress console.log from module loading messages
  console.log = vi.fn((...args) => {
    const message = args[0]
    if (typeof message === 'string' && message.startsWith('[')) {
      // Suppress module loading messages like [lib/game-engine.ts]
      return
    }
    originalConsoleLog.apply(console, args)
  })
})

afterEach(() => {
  console.log = originalConsoleLog
})

// ============================================
// MOCK RANDOM FOR DETERMINISTIC TESTS
// ============================================

/**
 * Helper to mock Math.random for deterministic tests
 * @param values Array of values to return in sequence
 */
export function mockRandom(values: number[]): void {
  let index = 0
  vi.spyOn(Math, 'random').mockImplementation(() => {
    const value = values[index % values.length]
    index++
    return value
  })
}

/**
 * Restore Math.random to original implementation
 */
export function restoreRandom(): void {
  vi.restoreAllMocks()
}

// ============================================
// MOCK DATE FOR DETERMINISTIC TIMESTAMPS
// ============================================

let mockTime = Date.now()

/**
 * Set a fixed timestamp for Date.now()
 */
export function setMockTime(time: number): void {
  mockTime = time
  vi.spyOn(Date, 'now').mockImplementation(() => mockTime)
}

/**
 * Advance mock time by specified milliseconds
 */
export function advanceMockTime(ms: number): void {
  mockTime += ms
}

// ============================================
// GLOBAL TEST UTILITIES
// ============================================

// Extend Vitest's expect with custom matchers if needed
declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Vi {
    interface JestAssertion<T = unknown> {
      toBeValidCard(): T
    }
  }
}

// ============================================
// CLEANUP
// ============================================

afterEach(() => {
  vi.clearAllMocks()
  vi.useRealTimers()
})
