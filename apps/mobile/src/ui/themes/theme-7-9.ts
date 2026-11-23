import { neutral, semantic } from '../tokens/colors';
import { spacing } from '../tokens/spacing';
import { fontSizes } from '../tokens/typography';

export interface Theme {
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
    xp: string;
    coins: string;
    success: string;
    error: string;
    warning: string;
    info: string;
    masteryBadge: string;
  };
  spacing: Record<keyof typeof spacing, number> & { touchTarget: number };
  typography: { baseSize: number; headingSize: number; captionSize: number };
  borderRadius: { sm: number; md: number; lg: number; button: number; card: number; full: number };
  shadows: {
    card: {
      shadowColor: string;
      shadowOffset: { width: number; height: number };
      shadowOpacity: number;
      shadowRadius: number;
      elevation: number;
    };
  };
}

export const theme79: Theme = {
  colors: {
    primary: '#FF6B6B',
    primaryDark: '#E05555',
    secondary: '#4ECDC4',
    accent: '#FFE66D',
    background: '#FFFEF0',
    surface: '#FFFFFF',
    textPrimary: neutral[800],
    textSecondary: neutral[500],
    border: neutral[200],
    ...semantic,
  },
  spacing: { ...spacing, touchTarget: 56 },
  typography: {
    baseSize: fontSizes.lg,
    headingSize: fontSizes['2xl'],
    captionSize: fontSizes.sm,
  },
  borderRadius: { sm: 12, md: 20, lg: 28, button: 24, card: 20, full: 999 },
  shadows: {
    card: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.08,
      shadowRadius: 12,
      elevation: 4,
    },
  },
};
