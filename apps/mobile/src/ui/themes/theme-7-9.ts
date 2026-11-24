import { ink, palette, semantic, tints } from '../tokens/colors';
import { spacing } from '../tokens/spacing';
import { fontFamilies } from '../tokens/typography';
import { solidShadow, type Theme } from './types';

export type { Theme } from './types';

/** Children 7–9: the full cartoon look — thick ink outlines, solid shadows, big targets. */
export const theme79: Theme = {
  name: '7-9',
  colors: {
    primary: palette.coral,
    primaryDark: palette.coralDark,
    secondary: palette.teal,
    accent: palette.sun,
    background: palette.cream,
    surface: palette.white,
    textPrimary: ink,
    textSecondary: palette.inkSoft,
    border: ink,
    ink,
    onFill: ink,
    disabled: palette.disabled,
    night: palette.night,
    nightSoft: palette.nightSoft,
    xp: palette.orange,
    coins: palette.gold,
    success: palette.mint,
    error: semantic.error,
    warning: palette.orange,
    info: palette.sky,
    masteryBadge: palette.violet,
  },
  tints,
  spacing: { ...spacing, touchTarget: 56 },
  typography: { baseSize: 18, headingSize: 28, captionSize: 14 },
  textStyles: {
    display: { fontSize: 36, lineHeight: 40, family: 'black' },
    title: { fontSize: 28, lineHeight: 32, family: 'black' },
    heading: { fontSize: 20, lineHeight: 26, family: 'black' },
    body: { fontSize: 18, lineHeight: 25, family: 'regular' },
    caption: { fontSize: 14, lineHeight: 19, family: 'heavy' },
  },
  fonts: fontFamilies,
  borderWidth: { thin: 2, regular: 3, thick: 4 },
  borderRadius: { sm: 14, md: 20, lg: 28, button: 22, card: 24, full: 999 },
  shadows: {
    card: solidShadow(5, ink),
    button: solidShadow(6, ink),
    chip: solidShadow(3, ink),
    pressed: solidShadow(2, ink),
  },
  pressDepth: 4,
};
