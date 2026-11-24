# Chess Module Implementation Plan

## Overview

Add chess learning to the app: from piece movement to playing against a bot. Target: children 7-13 years old.

## What Already Exists (DO NOT MODIFY)

| Component | Location | Status |
|-----------|----------|--------|
| Translations (ru/en/uz) | `packages/i18n/src/locales/*.json` | Complete (chessPieces, chessHint, chessLevel) |
| Exercise registry | `packages/core/src/learning/exercise-registry.ts` | Working |
| Mission system | `packages/core/src/learning/mission.ts` | Working |
| SRS algorithm | `packages/core/src/learning/srs.ts` | Working |
| Exercise card UI | `apps/mobile/src/features/learning/components/exercise-card.tsx` | Working |
| Subject routing | `apps/mobile/app/(child)/learn/[subject]/` | Working |
| Offline queue | `packages/core/src/learning/offline-queue.ts` | Working |

## Dependencies to Install

```bash
pnpm --filter @saya/core add chess.js
pnpm --filter mobile add react-native-stockfish
```

## Implementation Phases

### Phase 1: Core Chess Logic (packages/core)

**Files to create:**
```
packages/core/src/chess/
├── index.ts                 # exports
├── types.ts                 # ChessExercise, ChessPuzzle, etc.
├── board.ts                 # board utilities (FEN parsing, square helpers)
├── exercises/
│   ├── identify-piece.ts    # recognize piece by image
│   ├── piece-movement.ts    # select valid squares for a piece
│   ├── capture-exercise.ts  # capture all pawns with given piece
│   └── mate-in-one.ts       # find checkmate in 1 move
├── bot/
│   ├── difficulty.ts        # map age/level to Stockfish skill
│   └── engine-wrapper.ts    # interface for Stockfish
└── chess.test.ts            # tests for all exercises
```

**Exercise plugins to register:**
- `chess.identify` — show piece, pick name (4 options)
- `chess.movement` — show piece on board, tap valid squares
- `chess.capture` — eat all pawns with one piece
- `chess.mate1` — find mate in 1 (from puzzle DB)
- `chess.puzzle` — general puzzle (from Lichess DB)

### Phase 2: Content (packages/content)

**Files to create:**
```
packages/content/src/skills/chess.json         # skill tree
packages/content/src/exercises/chess/
├── lessons.json                               # lesson progression
├── puzzles-easy.json                          # rating 400-800, ~5000 puzzles
└── puzzles-medium.json                        # rating 800-1200, ~5000 puzzles
```

**Skill tree structure:**
```json
{
  "id": "chess",
  "children": [
    { "code": "chess.identify", "label": "Узнай фигуры" },
    { "code": "chess.rook", "label": "Ладья", "prereq": "chess.identify" },
    { "code": "chess.bishop", "label": "Слон", "prereq": "chess.rook" },
    { "code": "chess.queen", "label": "Ферзь", "prereq": "chess.bishop" },
    { "code": "chess.knight", "label": "Конь", "prereq": "chess.queen" },
    { "code": "chess.pawn", "label": "Пешка", "prereq": "chess.knight" },
    { "code": "chess.king", "label": "Король", "prereq": "chess.pawn" },
    { "code": "chess.special", "label": "Рокировка и взятие на проходе", "prereq": "chess.king" },
    { "code": "chess.mate", "label": "Мат в 1 ход", "prereq": "chess.special" },
    { "code": "chess.tactics", "label": "Тактика", "prereq": "chess.mate" },
    { "code": "chess.play", "label": "Игра с ботом", "prereq": "chess.tactics" }
  ]
}
```

### Phase 3: UI Components (apps/mobile)

**Files to create:**
```
apps/mobile/src/features/learning/components/chess/
├── chessboard.tsx           # interactive board (Reanimated gestures)
├── piece.tsx                # piece SVG/image component
├── square-highlight.tsx     # valid move indicators
├── identify-card.tsx        # exercise: identify piece
├── movement-card.tsx        # exercise: tap valid squares
├── puzzle-card.tsx          # exercise: solve puzzle
└── bot-game-screen.tsx      # full game vs Stockfish
```

**Modify existing (CAREFUL):**
- `apps/mobile/app/(child)/learn/[subject]/index.tsx` — add chess map rendering
- `apps/mobile/app/(child)/learn/[subject]/mission.tsx` — add chess exercise rendering

### Phase 4: Bot Integration

**Native module:**
- Use `react-native-stockfish` for iOS
- Wrap in `packages/core/src/chess/bot/engine-wrapper.ts`
- Difficulty levels: 1-5 for ages 7-9, 3-10 for ages 10-13

**Game flow:**
1. Child makes move on board
2. Send position (FEN) to Stockfish
3. Get best move with limited depth/skill
4. Animate opponent move
5. Check for game end (checkmate, stalemate, draw)

### Phase 5: Puzzles from Lichess

**Data pipeline:**
1. Download Lichess puzzle CSV (CC0 license)
2. Filter by rating (400-1200) and theme (fork, pin, mate)
3. Convert to our JSON format
4. Store in `packages/content/src/exercises/chess/`
5. Load subset into SQLite for offline

**Puzzle format:**
```json
{
  "id": "abc123",
  "fen": "r1bqkb1r/pppp1ppp/2n2n2/4p2Q/2B1P3/8/PPPP1PPP/RNB1K1NR w KQkq - 4 4",
  "moves": ["h5f7"],
  "rating": 600,
  "themes": ["mate", "short"]
}
```

## Safety Checklist (DO NOT BREAK)

- [ ] Run `pnpm test` after each phase — all existing tests must pass
- [ ] Do NOT modify `exercise-registry.ts` interface — only add plugins
- [ ] Do NOT modify mission.ts core logic — extend via new exercise types
- [ ] Do NOT change i18n structure — only add new keys under `learning.chess*`
- [ ] Do NOT modify existing exercise cards (word-match, spell-it, etc.)
- [ ] Keep offline-first: all chess content must work without network

## Database Changes

**New tables (migration):**
```sql
-- Chess game history (for review)
CREATE TABLE chess_games (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  child_id UUID NOT NULL REFERENCES children(id) ON DELETE CASCADE,
  fen_start TEXT NOT NULL DEFAULT 'startpos',
  pgn TEXT NOT NULL,
  result TEXT CHECK (result IN ('win', 'loss', 'draw')),
  bot_level INT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- RLS: child can only see own games
ALTER TABLE chess_games ENABLE ROW LEVEL SECURITY;
```

## Test Coverage Requirements

| Component | Min Coverage |
|-----------|--------------|
| `packages/core/src/chess/*` | 90% |
| Exercise plugins | 100% (all correct/incorrect cases) |
| Bot difficulty mapping | 100% |

## Timeline Estimate

| Phase | Days | Blocking? |
|-------|------|-----------|
| Phase 1: Core logic | 3 | Yes |
| Phase 2: Content | 2 | Yes |
| Phase 3: UI | 4 | No (can parallelize) |
| Phase 4: Bot | 3 | No |
| Phase 5: Puzzles | 2 | No |
| **Total** | **~14 days** | |

## Open Questions

1. **Piece graphics**: Use emoji (🔵♟️) or SVG assets? SVG is cleaner but requires assets.
2. **Board orientation**: Always white at bottom, or flip for child preference?
3. **Sound effects**: Add move sounds? (need to check kids category compliance)
4. **Stockfish binary size**: ~5MB acceptable?

## Definition of Done

- [ ] All 5 exercise types working in missions
- [ ] Skill progression unlocks correctly
- [ ] Bot plays at appropriate difficulty per age band
- [ ] 1000+ puzzles available offline
- [ ] All existing tests still pass
- [ ] Maestro E2E test: complete one chess lesson
- [ ] VoiceOver labels on all chess UI elements
