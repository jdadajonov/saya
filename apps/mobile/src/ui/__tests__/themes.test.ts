import { describe, expect, it } from '@jest/globals';
import { themes } from '../theme-provider';
import { theme79 } from '../themes/theme-7-9';
import { theme1013 } from '../themes/theme-10-13';
import { themeParent } from '../themes/theme-parent';
import { solidShadow } from '../themes/types';

describe('themes', () => {
  it('registers every theme under its own name', () => {
    for (const [name, theme] of Object.entries(themes)) {
      expect(theme.name).toBe(name);
    }
  });

  it('meets minimum touch targets: 56 pt for 7–9, 44 pt otherwise', () => {
    expect(theme79.spacing.touchTarget).toBeGreaterThanOrEqual(56);
    expect(theme1013.spacing.touchTarget).toBeGreaterThanOrEqual(44);
    expect(themeParent.spacing.touchTarget).toBeGreaterThanOrEqual(44);
  });

  it('keeps 7–9 the boldest: thicker outlines and deeper shadows than 10–13 and parent', () => {
    for (const other of [theme1013, themeParent]) {
      expect(theme79.borderWidth.regular).toBeGreaterThan(other.borderWidth.regular);
      expect(theme79.shadows.card.shadowOffset.height).toBeGreaterThan(other.shadows.card.shadowOffset.height);
    }
  });

  it('uses solid shadows only (no blur)', () => {
    for (const theme of Object.values(themes)) {
      for (const s of Object.values(theme.shadows)) {
        expect(s.shadowRadius).toBe(0);
      }
    }
  });

  it('press depth never exceeds the button shadow, so a pressed button does not sink below its shadow', () => {
    for (const theme of Object.values(themes)) {
      expect(theme.pressDepth).toBeLessThanOrEqual(theme.shadows.button.shadowOffset.height);
    }
  });

  it('solidShadow with offset 0 is invisible', () => {
    expect(solidShadow(0, '#000000').shadowOpacity).toBe(0);
  });
});
