import { neutral, semantic } from '../tokens/colors';
import { spacing } from '../tokens/spacing';
import { fontSizes } from '../tokens/typography';
import type { Theme } from './theme-7-9';

export const theme1013: Theme = {
  colors: {
    primary: '#4F46E5',
    primaryDark: '#3730A3',
    secondary: '#7C3AED',
    accent: '#06B6D4',
    background: '#F8FAFC',
    surface: '#FFFFFF',
    textPrimary: neutral[900],
    textSecondary: neutral[600],
    border: neutral[200],
    ...semantic,
  },
  spacing: {
    ...spacing,
    touchTarget: 44,
  },
  typography: {
    baseSize: fontSizes.md,
    headingSize: fontSizes.xl,
    captionSize: fontSizes.xs,
  },
  borderRadius: {
    sm: 6,
    md: 12,
    lg: 16,
    button: 10,
    card: 12,
    full: 999,
  },
  shadows: {
    card: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.06,
      shadowRadius: 8,
      elevation: 2,
    },
  },
};
