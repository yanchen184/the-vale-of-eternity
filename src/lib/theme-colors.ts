/**
 * Vale of Eternity Theme Colors
 * Fantasy-themed color palette for the game UI
 * @version 1.0.0
 */
console.log('[lib/theme-colors.ts] v1.0.0 loaded')

// ============================================
// MAIN THEME COLORS
// ============================================

export const VALE_THEME = {
  // Primary colors - Mystical purple
  primary: {
    light: '#a78bfa',
    DEFAULT: '#7c3aed',
    dark: '#5b21b6',
    glow: 'rgba(124, 58, 237, 0.5)',
  },

  // Secondary colors - Ethereal gold
  secondary: {
    light: '#fcd34d',
    DEFAULT: '#f59e0b',
    dark: '#d97706',
    glow: 'rgba(245, 158, 11, 0.5)',
  },

  // Accent colors
  accent: {
    blue: '#3b82f6',
    emerald: '#10b981',
    rose: '#f43f5e',
    cyan: '#06b6d4',
    teal: '#14b8a6',
  },

  // Element colors
  elements: {
    water: '#06b6d4',
    fire: '#ef4444',
    earth: '#84cc16',
    wind: '#8b5cf6',
    dragon: '#f59e0b',
  },

  // Phase colors
  phases: {
    waiting: {
      bg: 'from-slate-600 to-slate-700',
      border: 'border-slate-500',
      text: 'text-slate-200',
      glow: 'rgba(100, 116, 139, 0.5)',
    },
    hunting: {
      bg: 'from-blue-600 to-indigo-700',
      border: 'border-blue-400',
      text: 'text-blue-100',
      glow: 'rgba(59, 130, 246, 0.5)',
    },
    action: {
      bg: 'from-emerald-600 to-teal-700',
      border: 'border-emerald-400',
      text: 'text-emerald-100',
      glow: 'rgba(16, 185, 129, 0.5)',
    },
    resolution: {
      bg: 'from-amber-600 to-orange-700',
      border: 'border-amber-400',
      text: 'text-amber-100',
      glow: 'rgba(245, 158, 11, 0.5)',
    },
    ended: {
      bg: 'from-purple-600 to-violet-700',
      border: 'border-purple-400',
      text: 'text-purple-100',
      glow: 'rgba(139, 92, 246, 0.5)',
    },
  },

  // Glass effect variations
  glass: {
    light: 'rgba(255, 255, 255, 0.1)',
    medium: 'rgba(255, 255, 255, 0.05)',
    dark: 'rgba(0, 0, 0, 0.2)',
    border: 'rgba(255, 255, 255, 0.1)',
  },

  // Background gradients
  backgrounds: {
    main: 'from-purple-950 via-indigo-950 to-slate-950',
    waiting: 'from-purple-900 via-indigo-900 to-slate-900',
    game: 'from-slate-950 via-purple-950/30 to-slate-950',
    modal: 'from-slate-900 via-purple-900/20 to-slate-900',
  },
} as const

// ============================================
// CSS VARIABLE GENERATOR
// ============================================

export function generateCSSVariables(): string {
  return `
    :root {
      --vale-primary-light: ${VALE_THEME.primary.light};
      --vale-primary: ${VALE_THEME.primary.DEFAULT};
      --vale-primary-dark: ${VALE_THEME.primary.dark};
      --vale-primary-glow: ${VALE_THEME.primary.glow};

      --vale-secondary-light: ${VALE_THEME.secondary.light};
      --vale-secondary: ${VALE_THEME.secondary.DEFAULT};
      --vale-secondary-dark: ${VALE_THEME.secondary.dark};
      --vale-secondary-glow: ${VALE_THEME.secondary.glow};

      --vale-accent-blue: ${VALE_THEME.accent.blue};
      --vale-accent-emerald: ${VALE_THEME.accent.emerald};
      --vale-accent-rose: ${VALE_THEME.accent.rose};
      --vale-accent-cyan: ${VALE_THEME.accent.cyan};

      --vale-element-water: ${VALE_THEME.elements.water};
      --vale-element-fire: ${VALE_THEME.elements.fire};
      --vale-element-earth: ${VALE_THEME.elements.earth};
      --vale-element-wind: ${VALE_THEME.elements.wind};
      --vale-element-dragon: ${VALE_THEME.elements.dragon};

      --vale-glass-light: ${VALE_THEME.glass.light};
      --vale-glass-medium: ${VALE_THEME.glass.medium};
      --vale-glass-dark: ${VALE_THEME.glass.dark};
      --vale-glass-border: ${VALE_THEME.glass.border};
    }
  `
}

// ============================================
// UTILITY FUNCTIONS
// ============================================

/**
 * Get element-specific styles
 */
export function getElementStyles(element: string) {
  const elementColors: Record<string, { bg: string; border: string; glow: string }> = {
    water: {
      bg: 'bg-cyan-900/30',
      border: 'border-cyan-500',
      glow: 'shadow-cyan-500/50',
    },
    fire: {
      bg: 'bg-red-900/30',
      border: 'border-red-500',
      glow: 'shadow-red-500/50',
    },
    earth: {
      bg: 'bg-lime-900/30',
      border: 'border-lime-500',
      glow: 'shadow-lime-500/50',
    },
    wind: {
      bg: 'bg-purple-900/30',
      border: 'border-purple-500',
      glow: 'shadow-purple-500/50',
    },
    dragon: {
      bg: 'bg-amber-900/30',
      border: 'border-amber-500',
      glow: 'shadow-amber-500/50',
    },
  }

  return elementColors[element.toLowerCase()] || elementColors.water
}

export default VALE_THEME
