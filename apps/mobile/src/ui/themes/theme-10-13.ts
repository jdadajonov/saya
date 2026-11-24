import { ink, palette, semantic, tints } from '../tokens/colors';
import { spacing } from '../tokens/spacing';
import { fontFamilies } from '../tokens/typography';
import { solidShadow, type Theme } from './types';

/** Children 10–13: the same cartoon language, toned down — thinner outlines, lower shadows, denser text. */
export const theme1013: Theme = {
  name: '10-13',
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
  spacing: { ...spacing, touchTarget: 44 },
  typography: { baseSize: 16, headingSize: 26, captionSize: 13 },
  textStyles: {
    display: { fontSize: 32, lineHeight: 36, family: 'black' },
    title: { fontSize: 26, lineHeight: 30, family: 'black' },
    heading: { fontSize: 18, lineHeight: 24, family: 'black' },
    body: { fontSize: 16, lineHeight: 22, family: 'regular' },
    caption: { fontSize: 13, lineHeight: 18, family: 'heavy' },
  },
  fonts: fontFamilies,
  borderWidth: { thin: 1.5, regular: 2, thick: 3 },
  borderRadius: { sm: 10, md: 16, lg: 22, button: 16, card: 18, full: 999 },
  shadows: {
    card: solidShadow(3, ink),
    button: solidShadow(4, ink),
    chip: solidShadow(2, ink),
    pressed: solidShadow(1, ink),
  },
  pressDepth: 3,
};
