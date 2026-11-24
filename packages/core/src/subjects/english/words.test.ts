import {
  buildEnglishExercises,
  wordMatchPlugin, spellItPlugin, listenMatchPlugin,
  ENGLISH_WORD_MATCH_ID, ENGLISH_SPELL_IT_ID, ENGLISH_LISTEN_MATCH_ID,
} from './words';
import type { WordMatchPayload, SpellItPayload, ListenMatchPayload } from './words';
import { buildMission, calculateMissionXp } from '../../learning/mission';
import type { MissionCard } from '../../learning/mission';

const TOPICS = [
  {
    skillCode: 'en.a1.animals',
    words: [
      { en: 'cat', ru: 'кошка', uz: 'mushuk' },
      { en: 'dog', ru: 'собака', uz: 'it' },
      { en: 'bird', ru: 'птица', uz: 'qush' },
      { en: 'fish', ru: 'рыба', uz: 'baliq' },
      { en: 'horse', ru: 'лошадь', uz: 'ot' },
    ],
  },
  {
    skillCode: 'en.a1.food',
    words: [
      { en: 'apple', ru: 'яблоко', uz: 'olma' },
      { en: 'bread', ru: 'хлеб', uz: 'non' },
      { en: 'milk', ru: 'молоко', uz: 'sut' },
      { en: 'egg', ru: 'яйцо', uz: 'tuxum' },
    ],
  },
];

describe('buildEnglishExercises', () => {
  it('generates 3 exercises per word', () => {
    const totalWords = TOPICS.reduce((s, t) => s + t.words.length, 0);
    const exercises = buildEnglishExercises(TOPICS, 'ru');
    expect(exercises.length).toBe(totalWords * 3);
  });

  it('produces all 3 typeIds for each word', () => {
    const exercises = buildEnglishExercises(TOPICS, 'ru');
    const types = new Set(exercises.map((e) => e.typeId));
    expect(types.has(ENGLISH_WORD_MATCH_ID)).toBe(true);
    expect(types.has(ENGLISH_SPELL_IT_ID)).toBe(true);
    expect(types.has(ENGLISH_LISTEN_MATCH_ID)).toBe(true);
  });

  it('word_match payload has 3 distractors different from correct translation', () => {
    const exercises = buildEnglishExercises(TOPICS, 'ru');
    const matches = exercises.filter((e) => e.typeId === ENGLISH_WORD_MATCH_ID);
    for (const ex of matches) {
      const p = ex.payload as WordMatchPayload;
      expect(p.distractors).toHaveLength(3);
      expect(p.distractors).not.toContain(p.correctTranslation);
    }
  });

  it('listen_match payload has 3 distractors different from correct word', () => {
    const exercises = buildEnglishExercises(TOPICS, 'ru');
    const listens = exercises.filter((e) => e.typeId === ENGLISH_LISTEN_MATCH_ID);
    for (const ex of listens) {
      const p = ex.payload as ListenMatchPayload;
      expect(p.distractors).toHaveLength(3);
      expect(p.distractors).not.toContain(p.word);
    }
  });

  it('uses uz translations when locale is uz', () => {
    const exercises = buildEnglishExercises(TOPICS, 'uz');
    const spell = exercises.find((e) => e.typeId === ENGLISH_SPELL_IT_ID);
    const p = spell!.payload as SpellItPayload;
    expect(p.translation).not.toMatch(/[а-яА-Я]/);
  });

  it('assigns correct skillCode from topic', () => {
    const exercises = buildEnglishExercises(TOPICS, 'ru');
    exercises.forEach((ex) => {
      expect(['en.a1.animals', 'en.a1.food']).toContain(ex.skillCode);
    });
  });
});

describe('wordMatchPlugin', () => {
  const payload: WordMatchPayload = {
    word: 'cat', correctTranslation: 'кошка',
    distractors: ['собака', 'птица', 'рыба'],
    skillCode: 'en.a1.animals', locale: 'ru',
  };

  it('returns correct for matching translation', () => {
    expect(wordMatchPlugin.checkAnswer(payload, 'кошка').correct).toBe(true);
  });

  it('returns false for wrong choice', () => {
    expect(wordMatchPlugin.checkAnswer(payload, 'собака').correct).toBe(false);
  });

  it('returns false for undefined', () => {
    expect(wordMatchPlugin.checkAnswer(payload, undefined).correct).toBe(false);
  });
});

describe('spellItPlugin', () => {
  const payload: SpellItPayload = {
    translation: 'кошка', word: 'cat',
    skillCode: 'en.a1.animals', locale: 'ru',
  };

  it('accepts exact match', () => {
    expect(spellItPlugin.checkAnswer(payload, 'cat').correct).toBe(true);
  });

  it('is case-insensitive', () => {
    expect(spellItPlugin.checkAnswer(payload, 'CAT').correct).toBe(true);
    expect(spellItPlugin.checkAnswer(payload, 'Cat').correct).toBe(true);
  });

  it('trims whitespace', () => {
    expect(spellItPlugin.checkAnswer(payload, '  cat  ').correct).toBe(true);
  });

  it('rejects wrong spelling', () => {
    expect(spellItPlugin.checkAnswer(payload, 'kat').correct).toBe(false);
  });

  it('rejects empty string', () => {
    expect(spellItPlugin.checkAnswer(payload, '').correct).toBe(false);
  });
});

describe('listenMatchPlugin', () => {
  const payload: ListenMatchPayload = {
    word: 'cat',
    distractors: ['dog', 'bird', 'fish'],
    skillCode: 'en.a1.animals', locale: 'ru',
  };

  it('returns correct for exact word match', () => {
    expect(listenMatchPlugin.checkAnswer(payload, 'cat').correct).toBe(true);
  });

  it('returns false for a distractor', () => {
    expect(listenMatchPlugin.checkAnswer(payload, 'dog').correct).toBe(false);
  });
});

describe('Architecture check: buildMission + calculateMissionXp with English cards', () => {
  it('buildMission works with English exercise cards', () => {
    const exercises = buildEnglishExercises(TOPICS, 'ru');
    const cards: MissionCard[] = exercises.map((ex) => ({
      skillCode: ex.skillCode,
      exerciseTypeId: ex.typeId,
      difficulty: ex.difficulty,
      payload: ex.payload,
      state: { mastery: 0.1, stability: 1, dueAt: new Date(Date.now() - 1000) },
    }));

    const plan = buildMission(cards);
    expect(plan.cards.length).toBeGreaterThan(0);
    expect(plan.cards.length).toBeLessThanOrEqual(10);
  });

  it('calculateMissionXp works with English attempt data', () => {
    const result = calculateMissionXp([
      { correct: true, difficulty: 1, responseMs: 2000 },
      { correct: true, difficulty: 1, responseMs: 2000 },
      { correct: false, difficulty: 2, responseMs: 5000 },
      { correct: true, difficulty: 1, responseMs: 1500 },
    ]);
    expect(result.xpEarned).toBeGreaterThan(0);
    expect(result.stars).toBeGreaterThanOrEqual(1);
  });
});

describe('plugin generateVariants (passthrough)', () => {
  it('wordMatch returns the original payload', () => {
    const p = { word: 'cat', correctTranslation: 'кошка', distractors: [], skillCode: 'x', locale: 'ru' };
    expect(wordMatchPlugin.generateVariants(p, 3)).toEqual([p]);
  });

  it('spellIt returns the original payload', () => {
    const p = { translation: 'кошка', word: 'cat', skillCode: 'x', locale: 'ru' };
    expect(spellItPlugin.generateVariants(p, 3)).toEqual([p]);
  });

  it('listenMatch returns the original payload', () => {
    const p = { word: 'cat', distractors: [], skillCode: 'x', locale: 'ru' };
    expect(listenMatchPlugin.generateVariants(p, 3)).toEqual([p]);
  });
});
