export * from './tokens/colors';
export * from './tokens/spacing';
export * from './tokens/typography';
export { theme79 } from './themes/theme-7-9';
export type { Theme } from './themes/theme-7-9';
export { theme1013 } from './themes/theme-10-13';

import { theme79 as _theme79 } from './themes/theme-7-9';
import { theme1013 as _theme1013 } from './themes/theme-10-13';

export function themeForAgeBand(ageBand: '7-9' | '10-13') {
  return ageBand === '7-9' ? _theme79 : _theme1013;
}
