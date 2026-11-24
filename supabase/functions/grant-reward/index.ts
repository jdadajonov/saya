import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/cors.ts';
import { evaluate } from 'https://esm.sh/@saya/core@0.0.0/rewards/evaluate.js';
import { DEFAULT_REWARD_CONFIG } from 'https://esm.sh/@saya/core@0.0.0/config/rewards.js';
import type { DomainEvent } from 'https://esm.sh/@saya/core@0.0.0/events/types.js';
import type { LedgerHistory } from 'https://esm.sh/@saya/core@0.0.0/rewards/types.js';

function getWeekStart(date: Date): string {
  const d = new Date(date);
  const day = d.getDay();
  const diff = day === 0 ? 6 : day - 1;
  d.setDate(d.getDate() - diff);
  return d.toISOString().split('T')[0];
}

function formatDate(date: Date): string {
  return date.toISOString().split('T')[0];
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Missing authorization' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const event = await req.json() as DomainEvent;
    if (!event?.type || !event?.childId || !event?.familyId || !event?.occurredAt) {
      return new Response(JSON.stringify({ error: 'Invalid event payload' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const admin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );

    const eventDate = new Date(event.occurredAt);
    const todayStr = formatDate(eventDate);

    // Load today's coins earned from study for this child
    const { data: todayLedger } = await admin
      .from('ledger_entries')
      .select('amount')
      .eq('child_id', event.childId)
      .eq('entry_type', 'coins')
      .eq('reason', 'mission_completed')
      .gte('created_at', todayStr)
      .lt('created_at', todayStr + 'T23:59:59.999Z');

    const coinsTodayFromStudy = (todayLedger ?? []).reduce(
      (sum: number, row: { amount: number }) => sum + row.amount,
      0,
    );

    const history: LedgerHistory = { coinsTodayFromStudy };
    const entries = evaluate(event, history, DEFAULT_REWARD_CONFIG);

    // Update activity_days based on event type
    if (event.type === 'MissionCompleted') {
      await admin.from('activity_days').upsert(
        { child_id: event.childId, date: todayStr, has_learning: true },
        { onConflict: 'child_id,date' }
      );
    } else if (event.type === 'SessionConfirmed') {
      await admin.from('activity_days').upsert(
        { child_id: event.childId, date: todayStr, has_activity: true },
        { onConflict: 'child_id,date' }
      );
    }

    // Check for streak bonus (4 of 7 days)
    if (event.type === 'MissionCompleted' || event.type === 'SessionConfirmed') {
      const weekStart = getWeekStart(eventDate);

      // Check if bonus already granted this week
      const { data: existingBonus } = await admin
        .from('streak_bonuses')
        .select('id')
        .eq('child_id', event.childId)
        .eq('week_start', weekStart)
        .single();

      if (!existingBonus) {
        // Count active days this week
        const weekEnd = new Date(eventDate);
        weekEnd.setDate(weekEnd.getDate() + (7 - weekEnd.getDay()));

        const { data: activityDays } = await admin
          .from('activity_days')
          .select('date, has_learning, has_activity')
          .eq('child_id', event.childId)
          .gte('date', weekStart)
          .lte('date', todayStr);

        const activeDaysCount = (activityDays ?? []).filter(
          (d: { has_learning: boolean; has_activity: boolean }) =>
            d.has_learning || d.has_activity
        ).length;

        if (activeDaysCount >= DEFAULT_REWARD_CONFIG.streak.requiredDaysPerWeek) {
          // Grant streak bonus
          const streakEvent: DomainEvent = {
            type: 'WeekStreakAchieved',
            childId: event.childId,
            familyId: event.familyId,
            occurredAt: event.occurredAt,
            payload: { weekStart, daysActive: activeDaysCount },
          };
          const streakEntries = evaluate(streakEvent, history, DEFAULT_REWARD_CONFIG);
          entries.push(...streakEntries);

          // Record that bonus was granted
          await admin.from('streak_bonuses').insert({
            child_id: event.childId,
            week_start: weekStart,
          });
        }
      }
    }

    if (entries.length === 0) {
      return new Response(JSON.stringify({ entries: [] }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Insert idempotently — UNIQUE on source_event_id silently skips duplicates
    const rows = entries.map((e) => ({
      child_id: event.childId,
      entry_type: e.currency,
      amount: e.amount,
      reason: e.reason,
      source_event_id: e.sourceEventId,
    }));

    const { error } = await admin
      .from('ledger_entries')
      .upsert(rows, { onConflict: 'source_event_id', ignoreDuplicates: true });

    if (error) throw error;

    // Write domain event record
    await admin.from('events').insert({
      family_id: event.familyId,
      child_id: event.childId,
      type: event.type,
      payload: event.payload,
    });

    return new Response(JSON.stringify({ entries }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
