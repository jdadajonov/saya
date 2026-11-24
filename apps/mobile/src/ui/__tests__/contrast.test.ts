import { describe, expect, it } from '@jest/globals';
import { contrastRatio, parseHex, AA_NORMAL, AA_LARGE } from '../contrast';
import { theme79 } from '../themes/theme-7-9';
import { theme1013 } from '../themes/theme-10-13';
import { themeParent } from '../themes/theme-parent';
import type { Theme } from '../themes/types';

describe('contrastRatio', () => {
  it('is 21 for black on white and 1 for equal colors', () => {
    expect(contrastRatio('#000000', '#FFFFFF')).toBeCloseTo(21, 1);
    expect(contrastRatio('#FF6B6B', '#FF6B6B')).toBeCloseTo(1, 5);
  });

  it('is symmetric', () => {
    expect(contrastRatio('#2B2140', '#FFE66D')).toBeCloseTo(contrastRatio('#FFE66D', '#2B2140'), 10);
  });

  it('rejects colors that are not #RRGGBB', () => {
    expect(() => parseHex('red')).toThrow();
  });

  it('confirms white text on coral fails AA (why text on fills is ink)', () => {
    expect(contrastRatio('#FFFFFF', '#FF6B6B')).toBeLessThan(AA_NORMAL);
  });
});

function fills(theme: Theme): Record<string, string> {
  const { colors } = theme;
  return {
    background: colors.background,
    surface: colors.surface,
    primary: colors.primary,
    primaryDark: colors.primaryDark,
    secondary: colors.secondary,
    accent: colors.accent,
    disabled: colors.disabled,
    xp: colors.xp,
    coins: colors.coins,
    success: colors.success,
    warning: colors.warning,
    info: colors.info,
    masteryBadge: colors.masteryBadge,
    ...Object.fromEntries(Object.entries(theme.tints).map(([k, v]) => [`tint.${k}`, v])),
  };
}

describe.each([theme79, theme1013, themeParent])('theme $name', (theme) => {
  it.each(Object.entries(fills(theme)))('onFill text on %s passes AA', (_name, bg) => {
    expect(contrastRatio(theme.colors.onFill, bg)).toBeGreaterThanOrEqual(AA_NORMAL);
  });

  it('secondary text passes AA on background, surface and every tint', () => {
    const bgs = [theme.colors.background, theme.colors.surface, ...Object.values(theme.tints)];
    for (const bg of bgs) {
      expect(contrastRatio(theme.colors.textSecondary, bg)).toBeGreaterThanOrEqual(AA_NORMAL);
    }
  });

  it('white text passes AA on night backgrounds', () => {
    expect(contrastRatio('#FFFFFF', theme.colors.night)).toBeGreaterThanOrEqual(AA_NORMAL);
    expect(contrastRatio('#FFFFFF', theme.colors.nightSoft)).toBeGreaterThanOrEqual(AA_NORMAL);
  });

  it('outlines are visible against the background (non-text 3:1)', () => {
    expect(contrastRatio(theme.colors.border, theme.colors.background)).toBeGreaterThanOrEqual(AA_LARGE);
  });
});
