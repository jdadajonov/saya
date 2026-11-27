import type { ExercisePlugin, ExercisePayload, CheckResult } from '../../learning/exercise-registry';

export const ENGLISH_WORD_MATCH_ID = 'english.word_match';
export const ENGLISH_SPELL_IT_ID = 'english.spell_it';
export const ENGLISH_LISTEN_MATCH_ID = 'english.listen_match';

export interface WordEntry {
  en: string;
  ru: string;
  uz: string;
  skillCode: string;
}

export interface WordMatchPayload extends Record<string, unknown> {
  word: string;
  correctTranslation: string;
  distractors: string[];
  skillCode: string;
  locale: string;
}

export interface SpellItPayload extends Record<string, unknown> {
  translation: string;
  word: string;
  skillCode: string;
  locale: string;
}

export interface ListenMatchPayload extends Record<string, unknown> {
  word: string;
  distractors: string[];
  skillCode: string;
  locale: string;
}

function pickDistractors(
  all: WordEntry[],
  exclude: string,
  count: number,
  field: 'en' | 'ru' | 'uz',
  preferSkillCode?: string,
): string[] {
  const pool = all.filter((w) => w[field] !== exclude);

  // Prefer distractors from the same topic/skill first
  if (preferSkillCode) {
    const sameTopicPool = pool.filter((w) => w.skillCode === preferSkillCode);
    const shuffledSameTopic = [...sameTopicPool].sort(() => Math.random() - 0.5);

    if (shuffledSameTopic.length >= count) {
      return shuffledSameTopic.slice(0, count).map((w) => w[field]);
    }

    // If not enough in same topic, fill with others
    const otherPool = pool.filter((w) => w.skillCode !== preferSkillCode);
    const shuffledOther = [...otherPool].sort(() => Math.random() - 0.5);
    const fromSameTopic = shuffledSameTopic.map((w) => w[field]);
    const fromOther = shuffledOther.slice(0, count - fromSameTopic.length).map((w) => w[field]);
    return [...fromSameTopic, ...fromOther];
  }

  const shuffled = [...pool].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count).map((w) => w[field]);
}

export function buildEnglishExercises(
  topics: Array<{ skillCode: string; words: Array<{ en: string; ru: string; uz: string }> }>,
  locale: 'ru' | 'uz' = 'ru',
): Array<{
  skillCode: string;
  typeId: string;
  payload: WordMatchPayload | SpellItPayload | ListenMatchPayload;
  difficulty: 1 | 2 | 3;
}> {
  const allWords: WordEntry[] = topics.flatMap((t) =>
    t.words.map((w) => ({ ...w, skillCode: t.skillCode })),
  );

  const exercises: ReturnType<typeof buildEnglishExercises> = [];

  for (const topic of topics) {
    for (const word of topic.words) {
      const translation = locale === 'uz' ? word.uz : word.ru;
      const otherTranslations = pickDistractors(allWords, translation, 3, locale === 'uz' ? 'uz' : 'ru', topic.skillCode);
      const otherWords = pickDistractors(allWords, word.en, 3, 'en', topic.skillCode);

      exercises.push({
        skillCode: topic.skillCode,
        typeId: ENGLISH_WORD_MATCH_ID,
        payload: {
          word: word.en,
          correctTranslation: translation,
          distractors: otherTranslations,
          skillCode: topic.skillCode,
          locale,
        } satisfies WordMatchPayload,
        difficulty: 1,
      });

      exercises.push({
        skillCode: topic.skillCode,
        typeId: ENGLISH_SPELL_IT_ID,
        payload: {
          translation,
          word: word.en,
          skillCode: topic.skillCode,
          locale,
        } satisfies SpellItPayload,
        difficulty: 2,
      });

      exercises.push({
        skillCode: topic.skillCode,
        typeId: ENGLISH_LISTEN_MATCH_ID,
        payload: {
          word: word.en,
          distractors: otherWords,
          skillCode: topic.skillCode,
          locale,
        } satisfies ListenMatchPayload,
        difficulty: 1,
      });
    }
  }

  return exercises;
}

// ── Plugins ──────────────────────────────────────────────────────────────────

export const wordMatchPlugin: ExercisePlugin = {
  typeId: ENGLISH_WORD_MATCH_ID,
  checkAnswer(rawPayload: ExercisePayload, answer: unknown): CheckResult {
    const p = rawPayload as unknown as WordMatchPayload;
    return { correct: answer === p.correctTranslation, hintsUsed: 0 };
  },
  generateVariants(rawPayload: ExercisePayload, _count: number): ExercisePayload[] {
    return [rawPayload];
  },
};

export const spellItPlugin: ExercisePlugin = {
  typeId: ENGLISH_SPELL_IT_ID,
  checkAnswer(rawPayload: ExercisePayload, answer: unknown): CheckResult {
    const p = rawPayload as unknown as SpellItPayload;
    const input = typeof answer === 'string' ? answer.trim().toLowerCase() : '';
    return { correct: input === p.word.toLowerCase(), hintsUsed: 0 };
  },
  generateVariants(rawPayload: ExercisePayload, _count: number): ExercisePayload[] {
    return [rawPayload];
  },
};

export const listenMatchPlugin: ExercisePlugin = {
  typeId: ENGLISH_LISTEN_MATCH_ID,
  checkAnswer(rawPayload: ExercisePayload, answer: unknown): CheckResult {
    const p = rawPayload as unknown as ListenMatchPayload;
    return { correct: answer === p.word, hintsUsed: 0 };
  },
  generateVariants(rawPayload: ExercisePayload, _count: number): ExercisePayload[] {
    return [rawPayload];
  },
};
