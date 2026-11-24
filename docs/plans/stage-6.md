# Stage 6: Rewards

## Scope

Ledger-based reward system with XP, coins, levels, streak tracking, reward catalog, and child redemption requests.

## Architecture

### Core Principle
**Rewards are granted only by the server.** The client shows an optimistic preview using the same `evaluate()` function, but actual ledger entries are written by an Edge Function with service role. This prevents cheating and ensures idempotency.

### Data Flow
```
Event (MissionCompleted, SessionConfirmed, MilestoneAchieved)
  ↓
Client: optimistic preview via evaluate()
  ↓
Server: Edge Function receives event
  ↓
evaluate(event, history, config) → LedgerEntry[]
  ↓
Insert into ledger_entries (idempotent on source_event_id)
  ↓
Client: TanStack Query invalidates, reconciles with server state
```

## Files to Create/Modify

### 1. Core Logic (`packages/core`)

**New files:**
- `src/rewards/types.ts` — RewardEvent, LedgerEntry, RewardConfig, ChildBalance, Level, Streak
- `src/rewards/evaluate.ts` — `evaluate(event, history, config) → LedgerEntry[]`
- `src/rewards/levels.ts` — XP→Level curve, `getLevel(xp)`, `xpForLevel(level)`
- `src/rewards/streak.ts` — "4 of 7 days" soft streak logic
- `src/rewards/catalog.ts` — reward catalog types and defaults
- `src/__tests__/rewards/evaluate.test.ts`
- `src/__tests__/rewards/levels.test.ts`
- `src/__tests__/rewards/streak.test.ts`

**Update:**
- `src/index.ts` — export reward functions

### 2. Database (`supabase/migrations`)

**New migration: `00000000000005_rewards.sql`**

Tables:
```sql
-- Immutable ledger of all XP/coin transactions
ledger_entries (
  id uuid primary key,
  child_id uuid references children(id),
  entry_type text not null, -- 'xp' | 'coins'
  amount integer not null,
  reason text not null, -- 'mission_complete' | 'session_confirmed' | 'milestone' | 'streak_bonus' | 'redemption'
  source_event_id uuid unique, -- idempotency key
  created_at timestamptz default now()
)

-- Reward catalog (what can be redeemed)
rewards (
  id uuid primary key,
  family_id uuid references families(id),
  title text not null,
  description text,
  cost_coins integer not null,
  image_key text,
  is_active boolean default true,
  created_at timestamptz,
  updated_at timestamptz
)

-- Redemption requests from child
redemptions (
  id uuid primary key,
  child_id uuid references children(id),
  reward_id uuid references rewards(id),
  status text default 'pending', -- 'pending' | 'approved' | 'declined'
  requested_at timestamptz default now(),
  resolved_at timestamptz,
  resolved_by uuid references members(id)
)

-- Activity tracking for streak calculation
activity_days (
  id uuid primary key,
  child_id uuid references children(id),
  date date not null,
  has_learning boolean default false,
  has_activity boolean default false,
  unique(child_id, date)
)
```

**RLS policies:**
- `ledger_entries`: child reads own, only service role writes
- `rewards`: family members read, parent writes
- `redemptions`: child creates pending, parent approves/declines
- `activity_days`: child reads own, service role writes

### 3. Edge Function (`supabase/functions`)

**New: `grant-reward/index.ts`**

Triggered by database webhook or called directly after events:
- Receives event type + payload
- Loads child's history (recent ledger, activity_days)
- Calls `evaluate(event, history, config)`
- Inserts ledger entries with `ON CONFLICT (source_event_id) DO NOTHING`
- Updates `activity_days` if needed
- Returns new balance

### 4. Mobile Hooks (`apps/mobile/src/features/rewards`)

**New files:**
- `hooks/use-rewards.ts`:
  - `useBalanceQuery(childId)` — computed from ledger
  - `useLevelQuery(childId)` — XP→Level
  - `useStreakQuery(childId)` — current streak info
  - `useRewardCatalogQuery(familyId)`
  - `useRequestRedemption()`
  - `usePendingRedemptionsQuery(childId)`
  - `useApproveRedemption()`

- `hooks/use-reward-preview.ts`:
  - `useRewardPreview(event)` — optimistic preview using core evaluate()

### 5. Mobile Components (`apps/mobile/src/features/rewards/components`)

**New files:**
- `balance-display.tsx` — XP bar + coins + level badge
- `level-badge.tsx` — animated level indicator
- `streak-flame.tsx` — streak visualization (flame icon + count)
- `reward-card.tsx` — catalog item card
- `redemption-request-card.tsx` — pending request for parent
- `reward-received-modal.tsx` — celebration animation (Lottie)
- `coin-animation.tsx` — floating coins animation

### 6. Mobile Screens

**Parent screens:**
- `app/(parent)/rewards/index.tsx` — catalog management + pending requests
- `app/(parent)/rewards/create.tsx` — add reward to catalog
- `app/(parent)/rewards/[id].tsx` — edit/delete reward

**Child screens:**
- `app/(child)/rewards/index.tsx` — catalog browse + request
- Update `app/(child)/index.tsx` — show balance, streak, level

### 7. i18n

Add `rewards` section with:
- Level names or just numbers
- Streak messages ("4 days this week!")
- Redemption flow strings
- Celebration messages

## Reward Rules (from CLAUDE.md)

| Event | XP | Coins |
|-------|-----|-------|
| Exercise (by difficulty) | 1-3 | — |
| Self-corrected mistake | 1 | — |
| Mission complete | 10 | 2 |
| Session confirmed | 15 | — |
| Goal milestone | 50 | 20 |
| Week "4 of 7 days" | — | 10 |

**Constraints:**
- Daily coin cap from study: 10
- XP levels: smooth curve, never decreases
- Surprise: triggered by unknown-to-child events, never random

**Forbidden:**
- Loot boxes, random rewards
- In-app purchases in child mode
- XP/coin penalties
- Leaderboards with strangers
- "Streak will expire" pressure

## Level Curve

Smooth exponential curve, example:
```
Level 1: 0 XP
Level 2: 100 XP
Level 3: 250 XP
Level 4: 450 XP
Level 5: 700 XP
...
```

Formula: `xpForLevel(n) = floor(50 * n * (n - 1))`

## Streak Logic

"Soft" 4-of-7 days:
- Track `activity_days` for each child
- A day counts if `has_learning OR has_activity`
- Streak = count of active days in rolling 7-day window
- Bonus at 4+ days (once per week, on the 4th day)
- Pause days don't break streak (they're just not counted)

## Tests

### Core (`packages/core`)
- `evaluate.test.ts`:
  - Returns correct XP for mission by difficulty
  - Returns coins for mission (respects daily cap)
  - Returns milestone bonus
  - Returns streak bonus on 4th day
  - Idempotent: same event twice → same entries
  - No penalties ever

- `levels.test.ts`:
  - XP 0 → Level 1
  - Correct level boundaries
  - Level never decreases

- `streak.test.ts`:
  - 0 days → streak 0
  - 4 of 7 days → streak 4, bonus triggered
  - Gap doesn't reset, just not counted

### Database (`supabase/tests`)
- `rewards_rls.test.sql`:
  - Child cannot insert ledger_entries
  - Child can only read own ledger
  - Parent can manage rewards catalog
  - Child can create redemption request
  - Parent can approve/decline

## Open Questions

1. **Default catalog**: Ship with preset rewards or let parents create all?
   → Suggest: 3-5 preset templates (extra screen time, choose dinner, small toy) that parents can customize

2. **Coin expiration**: Do coins expire?
   → Suggest: No expiration, but parents can see balance history

3. **Partial redemption**: Can child request if not enough coins?
   → No, button disabled until sufficient balance

## Definition of Done

- [ ] `evaluate()` pure function with 100% test coverage
- [ ] Edge Function grants rewards idempotently
- [ ] Ledger RLS: child reads, only service writes
- [ ] Balance computed from ledger (no stored balance field)
- [ ] Level curve implemented and tested
- [ ] Streak "4 of 7" logic with bonus
- [ ] Catalog CRUD for parent
- [ ] Child can browse and request
- [ ] Parent approves/declines redemptions
- [ ] Balance display on child home
- [ ] Celebration animation on reward received
- [ ] i18n for ru/uz/en
- [ ] Maestro E2E: child completes mission → sees XP gain
