import { registerEnglishPlugins } from './index';
import { exerciseRegistry } from '../../learning/exercise-registry';
import {
  ENGLISH_WORD_MATCH_ID,
  ENGLISH_SPELL_IT_ID,
  ENGLISH_LISTEN_MATCH_ID,
} from './words';

describe('registerEnglishPlugins', () => {
  it('registers all 3 English plugins', () => {
    registerEnglishPlugins();
    expect(exerciseRegistry.has(ENGLISH_WORD_MATCH_ID)).toBe(true);
    expect(exerciseRegistry.has(ENGLISH_SPELL_IT_ID)).toBe(true);
    expect(exerciseRegistry.has(ENGLISH_LISTEN_MATCH_ID)).toBe(true);
  });

  it('is idempotent: calling twice does not throw', () => {
    expect(() => {
      registerEnglishPlugins();
      registerEnglishPlugins();
    }).not.toThrow();
  });

  it('word_match plugin accessible via registry', () => {
    registerEnglishPlugins();
    const plugin = exerciseRegistry.get(ENGLISH_WORD_MATCH_ID);
    expect(
      plugin.checkAnswer(
        { word: 'cat', correctTranslation: 'кошка', distractors: [], skillCode: 'x', locale: 'ru' },
        'кошка',
      ).correct,
    ).toBe(true);
  });
});
