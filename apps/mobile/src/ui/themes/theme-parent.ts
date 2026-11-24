import { ink, palette, semantic, tints } from '../tokens/colors';
import { spacing } from '../tokens/spacing';
import { fontFamilies } from '../tokens/typography';
import { solidShadow, type Theme } from './types';

/** Parents and auth screens: calm variant of the same style — teal primary, calmer cream, thin outlines. */
export const themeParent: Theme = {
  name: 'parent',
  colors: {
    primary: palette.teal,
    primaryDark: palette.tealDark,
    secondary: palette.coral,
    accent: palette.sun,
    background: palette.creamCalm,
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
  spacing: { ...spacing, touchTarget: 44 },
  typography: { baseSize: 16, headingSize: 24, captionSize: 13 },
  textStyles: {
    display: { fontSize: 30, lineHeight: 34, family: 'black' },
    title: { fontSize: 24, lineHeight: 29, family: 'black' },
    heading: { fontSize: 18, lineHeight: 24, family: 'heavy' },
    body: { fontSize: 16, lineHeight: 22, family: 'regular' },
    caption: { fontSize: 13, lineHeight: 18, family: 'heavy' },
  },
  fonts: fontFamilies,
  borderWidth: { thin: 1.5, regular: 2, thick: 2.5 },
  borderRadius: { sm: 10, md: 14, lg: 20, button: 14, card: 16, full: 999 },
  shadows: {
    card: solidShadow(3, ink),
    button: solidShadow(3, ink),
    chip: solidShadow(2, ink),
    pressed: solidShadow(1, ink),
  },
  pressDepth: 2,
};
