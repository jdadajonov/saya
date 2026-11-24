import type { spacing } from '../tokens/spacing';
import type { fontFamilies, TextStyles } from '../tokens/typography';
import type { tints } from '../tokens/colors';

export type ThemeName = '7-9' | '10-13' | 'parent';

export interface SolidShadow {
  shadowColor: string;
  shadowOffset: { width: number; height: number };
  shadowOpacity: number;
  shadowRadius: number;
  elevation: number;
}

export interface Theme {
  name: ThemeName;
  colors: {
    primary: string;
    primaryDark: string;
    secondary: string;
    accent: string;
    background: string;
    surface: string;
    textPrimary: string;
    textSecondary: string;
    border: string;
    /** Outline and main text color. */
    ink: string;
    /** Text and icon color on any colored fill. */
    onFill: string;
    disabled: string;
    night: string;
    nightSoft: string;
    xp: string;
    coins: string;
    success: string;
    error: string;
    warning: string;
    info: string;
    masteryBadge: string;
  };
  tints: typeof tints;
  spacing: Record<keyof typeof spacing, number> & { touchTarget: number };
  typography: { baseSize: number; headingSize: number; captionSize: number };
  textStyles: TextStyles;
  fonts: typeof fontFamilies;
  borderWidth: { thin: number; regular: number; thick: number };
  borderRadius: { sm: number; md: number; lg: number; button: number; card: number; full: number };
  /** Solid "sticker" shadows: no blur, offset straight down. */
  shadows: { card: SolidShadow; button: SolidShadow; chip: SolidShadow; pressed: SolidShadow };
  /** How far a pressable moves down when pressed (px). */
  pressDepth: number;
}

/** A solid offset shadow (iOS). `elevation` is kept for the shared type; Android is not built yet. */
export function solidShadow(offsetY: number, color: string): SolidShadow {
  return {
    shadowColor: color,
    shadowOffset: { width: 0, height: offsetY },
    shadowOpacity: offsetY === 0 ? 0 : 1,
    shadowRadius: 0,
    elevation: offsetY,
  };
}
