import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../../../platform/supabase';
import { useAuthStore } from '../../family/stores/auth-store';
import {
  buildMission,
  calculateMissionXp,
  registerMultiplicationPlugin,
  registerEnglishPlugins,
  registerChessPlugins,
  identifyPiecePlugin,
  pieceMovementPlugin,
  captureExercisePlugin,
  mateInOnePlugin,
  puzzlePlugin,
} from '@saya/core';
import type { MissionCard, CardState } from '@saya/core';
import { useLearningStore } from '../stores/learning-store';

registerMultiplicationPlugin();
registerEnglishPlugins();
registerChessPlugins();

function generateChessCards(skillCode: string): MissionCard[] {
  const cards: MissionCard[] = [];
  const defaultState = { mastery: 0, stability: 1, dueAt: new Date(0) };

  if (skillCode === 'chess.identify') {
    // Generate 10 identify piece exercises
    const seedPayload = { piece: 'k' as const, color: 'w' as const, options: ['k', 'q', 'r', 'b'] as const };
    const payloads = identifyPiecePlugin.generateVariants(seedPayload, 10);
    for (const payload of payloads) {
      cards.push({
        skillCode,
        exerciseTypeId: 'chess.identify',
        difficulty: 1,
        payload,
        state: defaultState,
      });
    }
  } else if (['chess.rook', 'chess.bishop', 'chess.queen', 'chess.knight', 'chess.pawn', 'chess.king'].includes(skillCode)) {
    // Map skill to piece
    const pieceMap: Record<string, 'r' | 'b' | 'q' | 'n' | 'p' | 'k'> = {
      'chess.rook': 'r',
      'chess.bishop': 'b',
      'chess.queen': 'q',
      'chess.knight': 'n',
      'chess.pawn': 'p',
      'chess.king': 'k',
    };
    const piece = pieceMap[skillCode]!;

    // Generate movement exercises for specific piece
    const seedPayload = {
      fen: '8/8/8/8/8/8/8/8 w - - 0 1',
      pieceSquare: 'e4' as const,
      piece,
      validSquares: [] as string[],
    };
    const payloads = pieceMovementPlugin.generateVariants(seedPayload, 8);
    for (const payload of payloads) {
      cards.push({
        skillCode,
        exerciseTypeId: 'chess.movement',
        difficulty: 1,
        payload,
        state: defaultState,
      });
    }
  } else if (skillCode === 'chess.mate1') {
    // Generate mate in one exercises
    const seedPayload = {
      fen: '8/8/8/8/8/8/8/8 w - - 0 1',
      solution: 'e1e8',
    };
    const payloads = mateInOnePlugin.generateVariants(seedPayload, 6);
    for (const payload of payloads) {
      cards.push({
        skillCode,
        exerciseTypeId: 'chess.mate1',
        difficulty: 2,
        payload,
        state: defaultState,
      });
    }
  } else if (skillCode === 'chess.tactics') {
    // Generate puzzle exercises
    const seedPayload = {
      fen: '8/8/8/8/8/8/8/8 w - - 0 1',
      moves: ['e2e4'],
      themes: ['fork'],
      rating: 1000,
    };
    const payloads = puzzlePlugin.generateVariants(seedPayload, 6);
    for (const payload of payloads) {
      cards.push({
        skillCode,
        exerciseTypeId: 'chess.puzzle',
        difficulty: 2,
        payload,
        state: defaultState,
      });
    }
  }

  return cards;
}

type GameMode = 'basic' | 'timed' | 'cumulative';

interface SkillStateRow {
  skill_id: string;
  mastery: number;
  stability: number;
  due_at: string;
  skills: { code: string };
}

interface ExerciseRow {
  id: string;
  skill_id: string;
  type: string;
  payload: Record<string, unknown>;
  difficulty: number;
  skills: { code: string };
}

export function useMissionQuery(subjectCode: string, mode: GameMode = 'basic', number?: number) {
  const childId = useAuthStore((s) => s.activeChildId);
  const startMission = useLearningStore((s) => s.startMission);

  return useQuery({
    queryKey: ['mission', childId, subjectCode, mode, number],
    enabled: !!childId,
    queryFn: async () => {
      console.log('useMissionQuery: starting', { childId, subjectCode, mode, number });

      // Load skill states (may be empty for new/test users)
      const { data: states } = await supabase
        .from('skill_states')
        .select('skill_id, mastery, stability, due_at, skills(code)')
        .eq('child_id', childId!);

      // Load all exercises
      const { data: exercises, error: exError } = await supabase
        .from('exercises')
        .select('id, skill_id, type, payload, difficulty, skills!exercises_skill_id_fkey(code)');
      if (exError) throw exError;

      // Build state map
      const stateMap = new Map<string, CardState>();
      (states as unknown as SkillStateRow[] ?? []).forEach((s) => {
        stateMap.set(s.skill_id, {
          mastery: s.mastery,
          stability: s.stability,
          dueAt: new Date(s.due_at),
        });
      });

      // Filter exercises based on mode
      let filteredExercises: ExerciseRow[] = [];

      if (mode === 'cumulative' && number) {
        // Cumulative: include all exercises for numbers 1 to N
        filteredExercises = (exercises ?? []).filter((ex: unknown) => {
          const e = ex as ExerciseRow;
          const code = e.skills?.code;
          if (!code) return false;
          const match = code.match(/^math\.mul\.(\d+)$/);
          if (!match) return false;
          const level = parseInt(match[1]!, 10);
          return level >= 1 && level <= number;
        }) as ExerciseRow[];
      } else {
        // Basic or Timed: filter by exact skill code
        // Strip any mode suffixes first
        const baseCode = subjectCode
          .replace('.timed', '')
          .replace('.cumulative', '')
          .replace(/\.cumulative\.\d+$/, '');

        filteredExercises = (exercises ?? []).filter((ex: unknown) => {
          const e = ex as ExerciseRow;
          const code = e.skills?.code;
          if (!code) return false;
          // Exact match
          if (code === baseCode) return true;
          // Child of subject (e.g. subjectCode=math.mul, code=math.mul.3)
          if (code.startsWith(`${baseCode}.`)) return true;
          return false;
        }) as ExerciseRow[];
      }

      console.log('useMissionQuery: filtered exercises', filteredExercises.length);

      // Build cards
      let allCards: MissionCard[] = [];

      // Handle chess skills specially - generate exercises client-side
      if (subjectCode.startsWith('chess.')) {
        const chessCards = generateChessCards(subjectCode);
        allCards = chessCards;
      } else {
        allCards = filteredExercises.map((ex) => ({
          skillCode: ex.skills.code,
          exerciseTypeId: ex.type,
          difficulty: ex.difficulty,
          payload: ex.payload,
          state: stateMap.get(ex.skill_id) ?? {
            mastery: 0,
            stability: 1,
            dueAt: new Date(0),
          },
        }));
      }

      // For testing: skip progression filter, use all cards
      const cards = allCards.sort(() => Math.random() - 0.5);

      console.log('useMissionQuery: building mission with', cards.length, 'cards');
      const plan = buildMission(cards);
      console.log('useMissionQuery: mission built, cards:', plan.cards.length);
      startMission(plan.cards);
      return plan;
    },
    staleTime: 0,
  });
}

export function useSkillStarsQuery(subjectCode: string) {
  const childId = useAuthStore((s) => s.activeChildId);

  return useQuery({
    queryKey: ['skill-stars', childId, subjectCode],
    enabled: !!childId,
    queryFn: async () => {
      const { data } = await supabase
        .from('skill_states')
        .select('mastery, skills(code)')
        .eq('child_id', childId!);

      const stars = new Map<string, 1 | 2 | 3>();
      (data as unknown as Array<{ mastery: number; skills: { code: string } }> ?? []).forEach((row) => {
        const m = row.mastery;
        const s: 1 | 2 | 3 = m >= 0.9 ? 3 : m >= 0.7 ? 2 : 1;
        stars.set(row.skills.code, s);

        // Also set stars for timed and cumulative modes based on base skill
        const code = row.skills.code;
        if (code.match(/^math\.mul\.\d+$/)) {
          // If base skill has stars, copy to mode variants
          stars.set(`${code}.timed`, s);
          stars.set(`${code}.cumulative`, s);
        }
      });
      return stars;
    },
  });
}

export function useSubmitAttempts() {
  const queryClient = useQueryClient();
  const childId = useAuthStore((s) => s.activeChildId);
  const familyId = useAuthStore((s) => s.family?.id);

  return useMutation({
    mutationFn: async (attempts: ActiveAttemptSubmit[]) => {
      console.log('useSubmitAttempts: starting with', attempts.length, 'attempts');
      if (!childId) throw new Error('No active child');

      const skillResults = new Map<string, { correct: number; total: number }>();
      for (const a of attempts) {
        // Use base skill code (strip mode suffixes)
        const baseCode = a.skillCode.replace('.timed', '').replace('.cumulative', '');
        const prev = skillResults.get(baseCode) ?? { correct: 0, total: 0 };
        skillResults.set(baseCode, {
          correct: prev.correct + (a.correct ? 1 : 0),
          total: prev.total + 1,
        });
      }

      for (const [skillCode, results] of skillResults) {
        const { data: skill } = await supabase
          .from('skills')
          .select('id')
          .eq('code', skillCode)
          .single();

        if (skill) {
          const mastery = results.correct / results.total;

          const { error: stateError } = await supabase.rpc('upsert_skill_state', {
            p_child_id: childId,
            p_skill_id: skill.id,
            p_mastery: mastery,
            p_stability: 1,
            p_due_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
          });

          if (stateError) {
            console.error('useSubmitAttempts: skill_state error', stateError);
          }
        }
      }

      const result = calculateMissionXp(
        attempts.map((a) => ({
          correct: a.correct,
          difficulty: a.difficulty,
          responseMs: a.responseMs,
          selfCorrected: a.selfCorrected,
        })),
      );

      const { data: { session } } = await supabase.auth.getSession();
      await fetch(
        `${process.env['EXPO_PUBLIC_SUPABASE_URL']}/functions/v1/grant-reward`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${session?.access_token}`,
          },
          body: JSON.stringify({
            type: 'MissionCompleted',
            childId,
            familyId,
            occurredAt: new Date().toISOString(),
            payload: {
              subjectCode: 'math.multiplication',
              correctCount: result.correctCount,
              totalCount: result.totalQuestions,
            },
          }),
        },
      );

      return result;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['skill-stars'] });
      void queryClient.invalidateQueries({ queryKey: ['balance'] });
    },
  });
}

interface ActiveAttemptSubmit {
  clientId: string;
  skillCode: string;
  correct: boolean;
  difficulty: number;
  responseMs: number;
  hintsUsed: number;
  selfCorrected: boolean;
}
