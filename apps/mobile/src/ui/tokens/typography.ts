export const fontSizes = {
  xs: 12,
  sm: 14,
  md: 16,
  lg: 18,
  xl: 22,
  '2xl': 28,
  '3xl': 36,
  '4xl': 48,
} as const;

export const fontWeights = {
  regular: '400' as const,
  medium: '500' as const,
  semibold: '600' as const,
  bold: '700' as const,
};

export const lineHeights = {
  tight: 1.2,
  normal: 1.5,
  relaxed: 1.75,
} as const;

/**
 * Nunito font families, as registered by `@expo-google-fonts/nunito` in `useFonts`.
 * Nunito covers Cyrillic and Latin, so ru / uz / en render with one font.
 */
export const fontFamilies = {
  regular: 'Nunito_700Bold',
  heavy: 'Nunito_800ExtraBold',
  black: 'Nunito_900Black',
} as const;

export type FontFamilyKey = keyof typeof fontFamilies;

export type TextVariant = 'display' | 'title' | 'heading' | 'body' | 'caption';

export interface TextStyleToken {
  fontSize: number;
  lineHeight: number;
  family: FontFamilyKey;
}

export type TextStyles = Record<TextVariant, TextStyleToken>;
