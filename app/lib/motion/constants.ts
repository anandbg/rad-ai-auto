// Motion timing and easing constants
// Used throughout the application for consistent micro-interactions

export const DURATION = {
  instant: 0.1,
  fast: 0.15,
  normal: 0.2,
  slow: 0.3,
  page: 0.4
} as const;

export const EASE = {
  out: [0.16, 1, 0.3, 1] as const,      // Quick start, slow end (entrances)
  in: [0.4, 0, 1, 1] as const,          // Slow start, quick end (exits)
  inOut: [0.4, 0, 0.2, 1] as const      // Symmetric (state changes)
} as const;

// Type exports for TypeScript consumers
export type Duration = typeof DURATION;
export type Ease = typeof EASE;
