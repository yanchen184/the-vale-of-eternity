/**
 * Effect System Index
 * Central export point for all effect-related functionality
 * @version 1.0.0
 */

export { BaseEffect, type EffectContext, type EffectResult, type EffectFactory } from './BaseEffect'
export { effectRegistry, registerEffect, executeEffect, hasEffect } from './EffectRegistry'
