-- Ledger entries: immutable record of all XP/coin transactions
create table if not exists ledger_entries (
  id uuid primary key default gen_random_uuid(),
  child_id uuid not null references children(id) on delete cascade,
  entry_type text not null check (entry_type in ('xp', 'coins')),
  amount integer not null,
  reason text not null,
  source_event_id text unique,
  created_at timestamptz not null default now()
);

create index idx_ledger_entries_child_id on ledger_entries(child_id);
create index idx_ledger_entries_created_at on ledger_entries(created_at);

-- Reward catalog: what can be redeemed
create table if not exists rewards (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null references families(id) on delete cascade,
  title text not null,
  description text,
  cost_coins integer not null check (cost_coins > 0),
  image_key text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_rewards_family_id on rewards(family_id);

-- Redemption requests from child
create table if not exists redemptions (
  id uuid primary key default gen_random_uuid(),
  child_id uuid not null references children(id) on delete cascade,
  reward_id uuid not null references rewards(id) on delete cascade,
  status text not null default 'pending' check (status in ('pending', 'approved', 'declined')),
  requested_at timestamptz not null default now(),
  resolved_at timestamptz,
  resolved_by uuid references members(id)
);

create index idx_redemptions_child_id on redemptions(child_id);
create index idx_redemptions_status on redemptions(status);

-- Activity days for streak tracking
create table if not exists activity_days (
  id uuid primary key default gen_random_uuid(),
  child_id uuid not null references children(id) on delete cascade,
  date date not null,
  has_learning boolean not null default false,
  has_activity boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(child_id, date)
);

create index idx_activity_days_child_date on activity_days(child_id, date);

-- Streak bonus tracking (to prevent duplicate weekly bonuses)
create table if not exists streak_bonuses (
  id uuid primary key default gen_random_uuid(),
  child_id uuid not null references children(id) on delete cascade,
  week_start date not null,
  granted_at timestamptz not null default now(),
  unique(child_id, week_start)
);

-- RLS Policies

-- ledger_entries: child reads own, only service role writes
alter table ledger_entries enable row level security;

create policy "Child reads own ledger entries"
  on ledger_entries for select
  using (
    child_id in (
      select id from children
      where family_id = (select family_id from members where user_id = auth.uid())
    )
    or
    child_id = (auth.jwt()->>'child_id')::uuid
  );

-- No insert/update/delete policies for regular users - only service role can write

-- rewards: family members read, parent writes
alter table rewards enable row level security;

create policy "Family members read rewards"
  on rewards for select
  using (
    family_id = (select family_id from members where user_id = auth.uid())
  );

create policy "Parent creates rewards"
  on rewards for insert
  with check (
    family_id = (select family_id from members where user_id = auth.uid() and role = 'parent')
  );

create policy "Parent updates rewards"
  on rewards for update
  using (
    family_id = (select family_id from members where user_id = auth.uid() and role = 'parent')
  );

create policy "Parent deletes rewards"
  on rewards for delete
  using (
    family_id = (select family_id from members where user_id = auth.uid() and role = 'parent')
  );

-- redemptions: child creates pending, parent approves/declines
alter table redemptions enable row level security;

create policy "Child and parent read redemptions"
  on redemptions for select
  using (
    child_id in (
      select id from children
      where family_id = (select family_id from members where user_id = auth.uid())
    )
    or
    child_id = (auth.jwt()->>'child_id')::uuid
  );

create policy "Child creates redemption request"
  on redemptions for insert
  with check (
    child_id = (auth.jwt()->>'child_id')::uuid
    and status = 'pending'
  );

create policy "Parent updates redemption"
  on redemptions for update
  using (
    child_id in (
      select id from children
      where family_id = (select family_id from members where user_id = auth.uid() and role = 'parent')
    )
  );

-- activity_days: child reads own, service role writes
alter table activity_days enable row level security;

create policy "Child reads own activity days"
  on activity_days for select
  using (
    child_id in (
      select id from children
      where family_id = (select family_id from members where user_id = auth.uid())
    )
    or
    child_id = (auth.jwt()->>'child_id')::uuid
  );

-- streak_bonuses: child reads own, service role writes
alter table streak_bonuses enable row level security;

create policy "Child reads own streak bonuses"
  on streak_bonuses for select
  using (
    child_id in (
      select id from children
      where family_id = (select family_id from members where user_id = auth.uid())
    )
    or
    child_id = (auth.jwt()->>'child_id')::uuid
  );

-- Function to compute child balance from ledger
create or replace function get_child_balance(p_child_id uuid)
returns table (total_xp bigint, total_coins bigint) as $$
begin
  return query
  select
    coalesce(sum(case when entry_type = 'xp' then amount else 0 end), 0)::bigint as total_xp,
    coalesce(sum(case when entry_type = 'coins' then amount else 0 end), 0)::bigint as total_coins
  from ledger_entries
  where child_id = p_child_id;
end;
$$ language plpgsql security definer;

-- Function to get coins earned today (for daily cap check)
create or replace function get_coins_today_from_study(p_child_id uuid)
returns integer as $$
declare
  coins_today integer;
begin
  select coalesce(sum(amount), 0) into coins_today
  from ledger_entries
  where child_id = p_child_id
    and entry_type = 'coins'
    and reason in ('mission_completed')
    and created_at >= current_date
    and created_at < current_date + interval '1 day';

  return coins_today;
end;
$$ language plpgsql security definer;
