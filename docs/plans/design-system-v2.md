# Design System v2: cartoon style for child mode

## Goal

Turn the approved child-mode mockups (Design canvas "Saya — экраны детского режима", 8 screens) into code: design tokens, a theme that components actually read, and a small set of UI primitives. After this, every child screen built from primitives matches the mockups without per-file styling, and the 7–9 / 10–13 looks come from the same components.

This is a cross-cutting design pass, not a feature stage. It touches only `apps/mobile` (no DB, no `packages/core` logic).

## Current state (findings)

- `src/ui/tokens/*` and `src/ui/themes/theme-7-9.ts`, `theme-10-13.ts` exist, but **no screen or component imports them**. `themeForAgeBand()` is unused.
- There is **no ThemeProvider** in `app/_layout.tsx` (it was listed in the Stage 0 plan).
- Every component hardcodes colors in `StyleSheet.create` — mostly `#4F46E5` (indigo from the 10–13 theme) and Tailwind greys — so child mode currently looks like the 10–13 theme, not like 7–9.
- `src/ui` has no components: buttons, cards, progress bars are re-implemented per feature.
- Emoji used as UI: mood picker (😄🙂😐😕😩), reward icon (🎁), study card (📚). They render differently per iOS version and can't follow theme colors.
- Contrast: white text on `primary #FF6B6B` is ~2.8:1 and fails WCAG AA. The mockups put dark ink text on all bright fills.

Conclusion: changing token values alone changes nothing visible. The plan needs (A) tokens, (B) a provider, (C) primitives, (D) migration of child screens.

## Visual language (from the mockups)

| Element | Value |
|---|---|
| Ink (outlines, text) | `#2B2140` |
| Secondary text | `#5A4A80` |
| Outline | 3 px ink on every card, button, chip, progress bar |
| Shadow | solid ink, no blur: offset Y 5 (cards), 6 (big buttons), 3 (chips); `shadowRadius: 0`, `shadowOpacity: 1` |
| Press | button moves down by its shadow offset, shadow shrinks to 2 (Reanimated) |
| Radii | card 24, big button 22, small button 14–16, chip 999 |
| Font | Nunito 700 / 800 / 900 (Cyrillic + Latin, covers ru/uz/en) |
| Text on colored fills | always ink, never white |

### Palette (7–9)

| Token | Hex | Tint (card background) |
|---|---|---|
| background (cream) | `#FFF8E1` | — |
| surface | `#FFFFFF` | — |
| coral (primary) | `#FF6B6B` | `#FFE3E3` |
| teal (secondary, mascot) | `#4ECDC4` | `#D6F5F2` |
| sun (accent, active tab) | `#FFE66D` | `#FFF3C4` |
| mint (success / correct) | `#2EC27E` | `#C8F7DC` |
| orange (XP) | `#FF9F1C` | `#FFE3C2` |
| gold (coins) | `#FFD43B` | — |
| violet (activities, mastery) | `#8B5CF6` | `#E4DDF5` |
| sky (info, pending) | `#5BC0EB` | `#B9E6FF` |
| night (evening / day-done) | `#2E2A6B` | `#4A4597` |

`semantic.error` is not used as a background in child mode: wrong answers use the orange tint `#FFD6A5` (soft, not "red = bad").

## Files

### A. Tokens and theme

**Update**
- `src/ui/tokens/colors.ts` — add `ink`, `palette` (brand colors + tints above), keep `neutral` and `semantic`.
- `src/ui/tokens/typography.ts` — add `fontFamilies` (`regular: 'Nunito_700Bold'`, `heavy: 'Nunito_800ExtraBold'`, `black: 'Nunito_900Black'`), `textStyles` (`display 36/900`, `title 28/900`, `heading 20/900`, `body 18/700`, `caption 14/800`).
- `src/ui/tokens/spacing.ts` — no changes.
- `src/ui/themes/theme-7-9.ts` — extend `Theme` interface:
  - `colors`: add `ink`, `onFill` (= ink), `tints`, `night`; `border` becomes ink.
  - `borderWidth: { thin: 2, regular: 3, thick: 4 }`
  - `shadows`: replace the soft `card` shadow with `card`, `button`, `chip`, `pressed` — solid ink, radius 0.
  - `fonts`: families from typography tokens.
  - `borderRadius`: `sm 14, md 20, lg 28, button 22, card 24, full 999`.
- `src/ui/themes/theme-10-13.ts` — same structure, toned down: outline 2, shadow offset 3, current indigo palette kept with ink outlines. The final 10–13 look gets a separate design pass (see Open questions).
- `src/ui/themes/theme-dark.ts` — dark variant for child mode (Definition of Done requires light and dark): background `night`, cards keep bright fills with ink text, outlines and shadows `#120F2B`.
- `src/ui/contrast.ts` — pure `contrastRatio(fg, bg)` (WCAG formula), used in tests.

**New**
- `src/ui/theme-provider.tsx` — `ThemeProvider` + `useTheme()`. Picks the theme from the active child's `age_band` (auth store) and the system color scheme. Parent mode gets the current neutral look (out of scope for restyling).
- `app/_layout.tsx` — load Nunito via `useFonts` before hiding the splash screen; wrap the tree in `ThemeProvider`.

### B. Primitives (`src/ui/components/`)

Each component reads only `useTheme()`; no hex literals.

- `app-text.tsx` — text variants from `textStyles`; Dynamic Type on, `maxFontSizeMultiplier` 1.6 for titles.
- `card.tsx` — outline + solid shadow; `tone` prop (`surface | coral | teal | sun | mint | violet | sky | tint-*`).
- `chunky-button.tsx` — primary/secondary/ghost, press-down animation (Reanimated), min height = `touchTarget` (56 for 7–9), `accessibilityRole="button"`, disabled state.
- `icon-button.tsx` — round/square icon button, required `accessibilityLabel`.
- `progress-bar.tsx` — outlined bar; `segments` mode for "3 / 10" in missions.
- `chip.tsx` — pill with icon + label (balance, statuses).
- `screen.tsx` — background, safe area, optional decorative blobs layer.
- `child-tab-bar.tsx` — custom tab bar for `(child)/(tabs)` (active tab = sun pill with outline).
- `icons.tsx` — stroke icon set used in the mockups: home, flag, gift, play, pause, speaker, lock, check, star, coin, hint, back, erase.
- `mood-face.tsx` — 5 drawn faces matching `MoodValue` (`great | good | ok | bad | awful`), replaces emoji.
- `mascot.tsx` — the teal mascot with moods `idle | happy | thinking | sleepy`.
- `index.ts` — exports.

**Dev-only**
- `app/(dev)/ui-gallery.tsx` — all primitives in both themes and dark mode, behind `__DEV__`. Used to check the system on iPhone SE and Pro Max before migrating screens.

### C. Migration of child mode (visual only, logic untouched)

Screens:
- `app/(child)/(tabs)/_layout.tsx` → `ChildTabBar`
- `app/(child)/(tabs)/index.tsx` (Сегодня)
- `app/(child)/(tabs)/goals/index.tsx`, `goals/[id].tsx`, `goals/propose.tsx`
- `app/(child)/(tabs)/rewards/index.tsx`
- `app/(child)/learn/index.tsx`, `learn/[subject]/index.tsx`, `learn/[subject]/mission.tsx`

Components used in child mode:
- learning: `exercise-card`, `listen-match-card`, `word-match-card`, `spell-it-card`, `mission-complete`, `mission-map`, `mission-progress`, `combo-badge`
- activities: `mood-picker` (emoji → `MoodFace`), `weekly-strip`
- rewards: `balance-display`, `reward-card` (🎁 → icon)
- goals: `goal-card`, `milestone-list`
- family: `parental-gate-modal`

Rule: keep every `testID` and `accessibilityLabel` so Maestro flows keep passing.

Out of scope: parent screens, new screens from the mockups that have no route yet (the "day done" soft-finish screen belongs to Stage 7 limits).

## New dependencies

| Package | Why | Alternative considered |
|---|---|---|
| `@expo-google-fonts/nunito` | The rounded font is the core of the look; Cyrillic + Latin for ru/uz/en. `expo-font` is already installed. | System font: loses most of the style. |
| `react-native-svg` | Mascot, icon set and mood faces as vectors: sharp on all iPhones, colorable from the theme. Expo-supported, no ADR needed. | PNG assets: no theme colors, many files per scale. |

Install with `npx expo install` (SDK 58 compatible versions) and pin in `docs/stack.md`.

Not added now: `lottie-react-native` (reward animations are Stage 6/8 scope; CLAUDE.md lists Lottie, but it is not installed yet — flagged in Open questions).

## Tests

- `src/ui/__tests__/contrast.test.ts` — every text/background pair the theme declares (ink on each fill and tint, secondary text on background, text on night) is ≥ 4.5:1; large text ≥ 3:1. Runs for 7–9, 10–13 and dark.
- `src/ui/__tests__/themes.test.ts` — all themes satisfy `Theme` (typecheck) and `touchTarget` ≥ 56 for 7–9, ≥ 44 for 10–13.
- RNTL tests for primitives: `ChunkyButton` (role, disabled, press), `IconButton` (requires label), `ProgressBar` (accessibility value), `MoodPicker` (radio state with `MoodFace`).
- Maestro: existing flows (`e2e/stage-*.yaml`) pass unchanged.
- A grep check in CI is optional: no `#[0-9A-Fa-f]{6}` literals in `app/(child)` and child-mode components after migration.

## Order of work

1. A — tokens, themes, provider, fonts (`ui-gallery` shows the tokens). Commit.
2. B — primitives + tests + gallery. Commit.
3. C — migrate Today, tabs, learning flow; then goals, rewards, gate. One commit per screen group.
4. Dark theme check on device; `CHANGELOG.md`.

## Open questions

1. **10–13 look**: toned-down cartoon (thinner outlines, calmer palette) as proposed, or a separate design first?
2. **Parent mode**: keep the current neutral style, or bring ink outlines and Nunito there too?
3. **Mood picker**: code has 5 moods, the mockup shows 4. Proposal: keep 5 in code and update the mockup.
4. **Dark theme in child mode**: build it now (DoD requires it) or force light mode for children until Stage 8?
5. **Mascot**: give it a name for VoiceOver and copy? Animate it later with Lottie?

## Definition of Done

- [ ] TypeScript strict and lint clean, CI green, iOS EAS build passes
- [ ] Child screens use only `useTheme()` and `src/ui` primitives; no hex literals in child-mode files
- [ ] No emoji used as UI in child mode
- [ ] Contrast tests pass for all themes
- [ ] Nunito loads before splash hides; Dynamic Type works up to the largest size without clipping on iPhone SE
- [ ] VoiceOver labels on all icon-only buttons
- [ ] Light and dark themes checked on device
- [ ] Existing Maestro flows pass
- [ ] `docs/stack.md` and `CHANGELOG.md` updated
