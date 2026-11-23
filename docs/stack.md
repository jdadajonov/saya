# Stack — pinned versions

Verified: 2026-11-23. Re-verified after `expo install --fix`. Re-run before each new stage.

## Runtime

| Tool | Version | Notes |
|---|---|---|
| Node.js | 20 LTS | engines field in root package.json |
| pnpm | 9.15.0 | packageManager in root package.json |
| Python | 3.12 | ai-gateway only (Stage 2) |

## Mobile

| Package | Version | Why |
|---|---|---|
| expo | ~58.0.0 | Current stable SDK (released 2026-11-18) |
| react-native | 0.88.1 | Bundled with Expo 58 |
| react | 19.3.0 | Bundled with Expo 58 |
| expo-router | ~58.0.0 | File-based navigation |
| react-native-reanimated | ~4.7.1 | Animations, requires New Architecture |
| react-native-gesture-handler | ~3.3.0 | Touch handling |
| react-native-safe-area-context | 5.11.1 | Safe area insets |
| react-native-screens | ~4.30.1 | Native screen containers |
| react-native-mmkv | ^4.3.2 | Fast key-value storage (New Arch only) |
| expo-sqlite | ~15.0.0 | Offline storage |
| expo-secure-store | ~14.0.0 | Keychain (child device tokens) |
| expo-speech | ~13.0.0 | TTS for children 7–9 |
| expo-notifications | ~0.30.0 | Push (parent) + local (child) |
| expo-image-picker | ~16.0.0 | Photo evidence (parent only) |
| expo-haptics | ~14.0.0 | Tactile feedback for rewards |

## State & data

| Package | Version | Why |
|---|---|---|
| @tanstack/react-query | ^5.108.2 | Server state, caching |
| zustand | ^5.1.0 | Local UI state |
| @supabase/supabase-js | ^2.119.2 | Typed Supabase client |
| zod | ^4.6.7 | Schema validation |

## i18n

| Package | Version |
|---|---|
| i18next | ^27.0.0 |
| react-i18next | ^18.0.2 |

## Tooling

| Package | Version |
|---|---|
| typescript | ~6.0.3 |
| turbo | ^2.11.13 |
| eslint | ^9.0.0 |
| @typescript-eslint | ^8.0.0 |
| prettier | ^3.0.0 |
| jest | ^29.0.0 |
| jest-expo | ~58.0.0 |
| ts-jest | ^29.0.0 |

## Backend

| Tool | Version | Notes |
|---|---|---|
| Supabase CLI | latest | `brew install supabase/tap/supabase` |
| Postgres | 15 | Via local Supabase |
| EAS CLI | latest | `npm i -g eas-cli` |

## Minimum iOS version

Determined by Expo SDK 58 requirements. Run `npx expo-doctor` after install to verify.

## Update policy

Run `npx expo install --fix` before each new stage to sync Expo-bundled packages.
Non-Expo packages: update with `pnpm update --interactive --latest` and check changelogs for breaking changes.
