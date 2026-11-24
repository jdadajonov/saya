import { createContext, useContext, useMemo, type ReactNode } from 'react';
import { theme79 } from './themes/theme-7-9';
import { theme1013 } from './themes/theme-10-13';
import { themeParent } from './themes/theme-parent';
import type { Theme, ThemeName } from './themes/types';

export const themes: Record<ThemeName, Theme> = {
  '7-9': theme79,
  '10-13': theme1013,
  parent: themeParent,
};

const ThemeContext = createContext<Theme>(themeParent);

interface ThemeProviderProps {
  /** Which theme to use. The app root picks it: child age band in child mode, `parent` otherwise. */
  variant: ThemeName;
  children: ReactNode;
}

/**
 * Light only for now (decision 2026-11-24, see docs/plans/design-system-v2.md);
 * a dark variant is added in Stage 8 without changing this API.
 */
export function ThemeProvider({ variant, children }: ThemeProviderProps) {
  const theme = useMemo(() => themes[variant], [variant]);
  return <ThemeContext.Provider value={theme}>{children}</ThemeContext.Provider>;
}

export function useTheme(): Theme {
  return useContext(ThemeContext);
}
