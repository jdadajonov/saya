import type { ExercisePlugin, ExercisePayload, CheckResult } from '../../learning/exercise-registry';

export const MULTIPLICATION_TYPE_ID = 'multiplication.fill_blank';

export interface MultiplicationPayload extends Record<string, unknown> {
  a: number;
  b: number;
  answer: number;
}

function difficultyForFactors(a: number, b: number): 1 | 2 | 3 {
  const max = Math.max(a, b);
  if (max <= 3) return 1;
  if (max <= 6) return 2;
  return 3;
}

function shuffled<T>(arr: T[]): T[] {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j]!, copy[i]!];
  }
  return copy;
}

export const multiplicationPlugin: ExercisePlugin = {
  typeId: MULTIPLICATION_TYPE_ID,

  checkAnswer(rawPayload: ExercisePayload, answer: unknown): CheckResult {
    const payload = rawPayload as unknown as MultiplicationPayload;
    const parsed = typeof answer === 'string' ? parseInt(answer.trim(), 10) : Number(answer);
    const correct = !isNaN(parsed) && parsed === payload.answer;
    return { correct, hintsUsed: 0 };
  },

  generateVariants(rawPayload: ExercisePayload, count: number): ExercisePayload[] {
    const payload = rawPayload as unknown as MultiplicationPayload;
    // Generate variants by keeping the same row (a) but varying b (1–9)
    const { a } = payload;
    const allFactors = [1, 2, 3, 4, 5, 6, 7, 8, 9].filter((x) => x !== payload.b);
    const selected = shuffled(allFactors).slice(0, Math.min(count - 1, allFactors.length));
    const variants: MultiplicationPayload[] = selected.map((b) => ({ a, b, answer: a * b }));
    // Always include the original
    return shuffled([payload, ...variants]).slice(0, count);
  },
};

export function allMultiplicationExercises(): Array<{
  skillCode: string;
  typeId: string;
  payload: MultiplicationPayload;
  difficulty: 1 | 2 | 3;
  locale: string;
}> {
  const result = [];
  for (let a = 1; a <= 9; a++) {
    for (let b = 1; b <= 9; b++) {
      result.push({
        skillCode: `math.mul.${a}`,
        typeId: MULTIPLICATION_TYPE_ID,
        payload: { a, b, answer: a * b },
        difficulty: difficultyForFactors(a, b),
        locale: 'any',
      });
    }
  }
  return result;
}
