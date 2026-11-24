export const neutral = {
  0: '#FFFFFF',
  50: '#F9FAFB',
  100: '#F3F4F6',
  200: '#E5E7EB',
  300: '#D1D5DB',
  400: '#9CA3AF',
  500: '#6B7280',
  600: '#4B5563',
  700: '#374151',
  800: '#1F2937',
  900: '#111827',
} as const;

export const semantic = {
  xp: '#F59E0B',
  coins: '#EAB308',
  success: '#10B981',
  error: '#EF4444',
  warning: '#F97316',
  info: '#3B82F6',
  masteryBadge: '#8B5CF6',
} as const;

/** Outline and text color of the cartoon style. Text on colored fills is always ink, never white. */
export const ink = '#2B2140';

/** Brand colors (fills) and their soft tints (card backgrounds). */
export const palette = {
  ink,
  inkSoft: '#5A4A80',
  cream: '#FFF8E1',
  creamCalm: '#FBF8F1',
  white: '#FFFFFF',
  coral: '#FF6B6B',
  /** Pressed coral. Darker shades fail AA with ink text (#E05555 = 4.0:1). */
  coralDark: '#EE5F5F',
  teal: '#4ECDC4',
  tealDark: '#2FA89F',
  sun: '#FFE66D',
  mint: '#2EC27E',
  orange: '#FF9F1C',
  gold: '#FFD43B',
  /** Lighter than Tailwind violet-500 (#8B5CF6 = 3.6:1 with ink) so ink text passes AA. */
  violet: '#A07AFF',
  sky: '#5BC0EB',
  night: '#2E2A6B',
  nightSoft: '#4A4597',
  disabled: '#EDE9F3',
} as const;

export const tints = {
  coral: '#FFE3E3',
  teal: '#D6F5F2',
  sun: '#FFF3C4',
  mint: '#C8F7DC',
  orange: '#FFE3C2',
  violet: '#E4DDF5',
  sky: '#B9E6FF',
  /** Soft feedback for a wrong answer: warm, not "red = bad". */
  wrong: '#FFD6A5',
} as const;

export type PaletteKey = keyof typeof palette;
export type TintKey = keyof typeof tints;
