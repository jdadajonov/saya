# Brand: Saya

Source of truth for the logo, the mascot and how they are used in the app. Written for whoever implements UI (people and Claude Code). Visual reference: the Design canvas "Saya — экраны детского режима", artboards «Логотип Saya» and «Экран загрузки».

## Name

- **Saya** — the app and its logo (Latin, in every locale).
- **Сая** — the mascot. Same name, so in copy it is written in the UI language: «Сая» in ru, «Saya» in uz and en. i18n key: `mascot.name`. VoiceOver label for the mascot image = `mascot.name`.

## Files

All vector sources are in `apps/mobile/assets/brand/`. Text in the wordmark is converted to outlines, so the SVGs do not depend on any installed font.

| File | Use |
|---|---|
| `logo-horizontal.svg` | Main logo: mascot + wordmark side by side. Login screen, onboarding, About. Light backgrounds. |
| `logo-vertical.svg` | Stacked logo on light backgrounds (cream, white). |
| `logo-vertical-on-sun.svg` | Stacked logo on yellow `#FFE66D`: the yellow «y» becomes white. Splash and loading screen. |
| `logo-vertical-white.svg` | Stacked logo with white letters, on teal `#4ECDC4` or coral. |
| `logo-mono.svg`, `logo-mono-white.svg` | One color (ink / white). Small sizes, print, places where a colored logo is too loud. |
| `wordmark.svg` | Letters only, color: S coral, a teal, y sun, a violet. |
| `wordmark-on-sun.svg`, `wordmark-white.svg` | Letters only for yellow / colored backgrounds. |
| `wordmark-mono.svg`, `wordmark-mono-white.svg` | Letters only, flat, no outline. |
| `mascot-happy.svg` | Default mascot: celebrations, splash, empty states with good news. |
| `mascot-idle.svg` | Calm smile: headers, greetings («Привет, …»). |
| `mascot-thinking.svg` | Hints, «послушай и выбери», loading content. |
| `mascot-sleepy.svg` | Daily limit reached / quiet hours / «На сегодня всё». |
| `mascot-mono.svg`, `mascot-mono-white.svg` | Flat mascot for tab icons, notifications, tiny sizes. |
| `app-icon.svg` | Source of the app icon. |
| `source/make.py` + `source/glyphs.json` | Generator for all of the above (Python, no deps). Edit colors or moods there and re-run, do not hand-edit generated SVGs. `make.py` is added by hand (it could not be written by the design tool); until then treat the SVGs as the source. |

Raster files used by Expo config (`apps/mobile/assets/images/`):

| File | Spec |
|---|---|
| `icon.png` | 1024 × 1024, opaque RGB, square corners (iOS rounds them). Mascot face on `#FFE66D`. |
| `splash-icon.png` | 1024 × 1102, transparent; = `logo-vertical-on-sun.svg`. Shown on `#FFE66D`. |

## How to use in code

1. **Static splash (`app.json`)**: `expo-splash-screen` with `image: ./assets/images/splash-icon.png`, `backgroundColor: "#FFE66D"`, `imageWidth: 220`. iOS splash is a single static image — no animation there.
2. **Animated loading screen**: a React component shown right after the native splash while fonts and the first query load. Same layout as the native splash (so the hand-off is seamless): `logo-vertical-on-sun` centered on `#FFE66D`, then the mascot does a gentle hop (Reanimated, ~1.6 s loop, 10 px) and three bouncing dots appear near the bottom. Respect Reduce Motion (`AccessibilityInfo.isReduceMotionEnabled`) — no hop, no bouncing. Hide it as soon as loading is done; do not hold the user for the animation.
3. **SVG in React Native**: render with `react-native-svg`. Preferred: import the files through `react-native-svg-transformer` (needs an ADR and the Metro config change), or convert each file into a small TSX component under `src/ui/brand/` (`<Mascot mood="happy" />`, `<Logo variant="horizontal" />`). Either way, components get `accessibilityRole="image"` and a label from i18n.
4. **The mascot is not the logo.** Inside the app, use the mascot alone (in the moods above); use the full logo only on splash, auth/onboarding and About.

## Rules

- Do not recolor letters outside the variants above, do not stretch, do not add effects (glow, gradient).
- Keep clear space around the logo at least the height of the «a».
- Minimum size: horizontal logo 120 pt wide; below that use `logo-mono` or the mascot alone.
- On yellow backgrounds always use the `-on-sun` variants (the yellow «y» vanishes otherwise).
- Ink `#2B2140` is the outline and text color everywhere; text on any colored fill is ink, not white (see `src/ui/tokens/colors.ts`).
- Font of the wordmark: Nunito Black (900). In UI text, Nunito 700/800/900 via `@expo-google-fonts/nunito`.

## Colors

| Name | Hex | Role in the logo |
|---|---|---|
| Ink | `#2B2140` | Outline, shadow, mono version |
| Coral | `#FF6B6B` | «S», antenna tips |
| Teal | `#4ECDC4` | «a», mascot body |
| Sun | `#FFE66D` | «y», icon and splash background |
| Violet | `#A07AFF` | last «a» |
| Teal light | `#A7EDE7` | mascot belly |
| Blush | `#FF8FA3` | mascot cheeks |

## Open items

- `app.json` references `./assets/images/notification-icon.png`, which does not exist. On iOS the notification uses the app icon and this option is ignored (it is Android-only), so it is harmless now; add the file when Android is built.
