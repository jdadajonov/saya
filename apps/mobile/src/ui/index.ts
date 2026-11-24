export * from './tokens/colors';
export * from './tokens/spacing';
export * from './tokens/typography';
export { theme79 } from './themes/theme-7-9';
export { theme1013 } from './themes/theme-10-13';
export { themeParent } from './themes/theme-parent';
export { solidShadow } from './themes/types';
export type { Theme, ThemeName, SolidShadow } from './themes/types';
export { ThemeProvider, useTheme, themes } from './theme-provider';
export { contrastRatio, relativeLuminance, AA_NORMAL, AA_LARGE } from './contrast';
export { Mascot, Logo } from './brand';
export type { MascotMood, LogoVariant } from './brand';

import { theme79 as _theme79 } from './themes/theme-7-9';
import { theme1013 as _theme1013 } from './themes/theme-10-13';

export function themeForAgeBand(ageBand: '7-9' | '10-13') {
  return ageBand === '7-9' ? _theme79 : _theme1013;
}
