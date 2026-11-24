# Stage 3: English Words

## Goal
A child can study A1 English vocabulary through 3 game-format exercise types with TTS pronunciation.
Architecture check: SRS, `buildMission`, `calculateMissionXp`, `OfflineQueue` — unchanged.
Only new plugins registered; mission screen dispatches to the right card by `exerciseTypeId`.

## Exercise types
| typeId | Mechanic | Payload |
|---|---|---|
| `english.word_match` | See English word → tap correct Russian translation (4 choices) | `{ word, correctTranslation, distractors[3], skillCode, locale }` |
| `english.spell_it` | See Russian translation → type English word (case-insensitive) | `{ translation, word, skillCode, locale }` |
| `english.listen_match` | Hear TTS pronunciation → tap correct written word (4 choices) | `{ word, distractors[3], skillCode, locale }` |

## Content (packages/content)
- `src/exercises/english-a1.json` — word bank: 6 topics × 10 words = 60 entries, each with `en` + `ru` + `uz`
- `src/validator.ts` — Zod: validates word bank (required fields, no duplicate codes, distractors ≠ answer)

## Files

### packages/core
- `src/subjects/english/words.ts` — `buildEnglishExercises(wordBank) → ExerciseSpec[]`; generates all 3 types per word; distractors sampled from same topic
- `src/subjects/english/index.ts` — registers all 3 plugins

### supabase
- `migrations/00000000000003_english_seed.sql` — English skills (en.a1.*) + exercises

### apps/mobile
- `src/platform/tts.ts` — `speak(text, locale)` wrapper over expo-speech; `stop()`
- `src/features/learning/components/word-match-card.tsx` — 4-choice tap card with animated highlight
- `src/features/learning/components/spell-it-card.tsx` — text input, case-insensitive
- `src/features/learning/components/listen-match-card.tsx` — play button (TTS) + 4-choice tap
- Update `app/(child)/learn/[subject]/mission.tsx` — dispatch card by `exerciseTypeId`
- Update `app/(child)/learn/index.tsx` — add English subject card
- `app/(child)/learn/[subject]/index.tsx` — show topic map for English (animals, school, family…)
- i18n additions: `learning.listenAndChoose`, `learning.writeInEnglish`, `learning.tapTranslation`, `learning.playSound`

## Tests (packages/core)
- `english/words.test.ts` — `buildEnglishExercises` generates 3 types per word, distractors valid, checkAnswer for each type
- Architecture check test: same `buildMission` + `calculateMissionXp` work with English exercise cards

## Open questions
1. TTS locale: `en-US` for English words (expo-speech `language` param). System voice — no recorded audio this stage.
2. `listen_match` on simulator: works via system TTS, real device may have better voice.
3. Uz translations for A1 words included in word bank but TTS only for `en-US` and `ru-RU`.

## Definition of Done
- [ ] TypeScript + lint clean, core coverage ≥ 90%
- [ ] `buildEnglishExercises` tested; same mission/SRS functions work with English cards
- [ ] 3 exercise types playable end-to-end on simulator
- [ ] TTS fires on `listen_match` card
- [ ] English appears on subject list screen
- [ ] All i18n ru/uz/en
