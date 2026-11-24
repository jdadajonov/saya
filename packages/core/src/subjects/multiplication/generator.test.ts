import { multiplicationPlugin, allMultiplicationExercises, MULTIPLICATION_TYPE_ID } from './generator';
import type { MultiplicationPayload } from './generator';

describe('multiplicationPlugin', () => {
  const payload: MultiplicationPayload = { a: 7, b: 8, answer: 56 };

  it('has correct typeId', () => {
    expect(multiplicationPlugin.typeId).toBe(MULTIPLICATION_TYPE_ID);
  });

  it('checkAnswer returns correct for right number string', () => {
    expect(multiplicationPlugin.checkAnswer(payload, '56').correct).toBe(true);
  });

  it('checkAnswer accepts number type', () => {
    expect(multiplicationPlugin.checkAnswer(payload, 56).correct).toBe(true);
  });

  it('checkAnswer trims whitespace', () => {
    expect(multiplicationPlugin.checkAnswer(payload, '  56  ').correct).toBe(true);
  });

  it('checkAnswer returns false for wrong answer', () => {
    expect(multiplicationPlugin.checkAnswer(payload, '57').correct).toBe(false);
  });

  it('checkAnswer returns false for non-numeric input', () => {
    expect(multiplicationPlugin.checkAnswer(payload, 'abc').correct).toBe(false);
  });

  it('checkAnswer returns false for empty string', () => {
    expect(multiplicationPlugin.checkAnswer(payload, '').correct).toBe(false);
  });

  it('hintsUsed is always 0', () => {
    expect(multiplicationPlugin.checkAnswer(payload, 56).hintsUsed).toBe(0);
  });

  describe('generateVariants', () => {
    it('returns exactly count variants', () => {
      const variants = multiplicationPlugin.generateVariants(payload, 4);
      expect(variants).toHaveLength(4);
    });

    it('includes the original payload', () => {
      const variants = multiplicationPlugin.generateVariants(payload, 5);
      const hasOriginal = variants.some((v) => v.a === 7 && v.b === 8);
      expect(hasOriginal).toBe(true);
    });

    it('all variants have correct answer field', () => {
      const variants = multiplicationPlugin.generateVariants(payload, 9);
      variants.forEach((v) => {
        expect(v.answer).toBe(v.a * v.b);
      });
    });

    it('keeps same multiplier (a) for all variants', () => {
      const variants = multiplicationPlugin.generateVariants(payload, 9);
      variants.forEach((v) => {
        expect(v.a).toBe(7);
      });
    });

    it('returns 1 variant when count=1', () => {
      expect(multiplicationPlugin.generateVariants(payload, 1)).toHaveLength(1);
    });
  });
});

describe('allMultiplicationExercises', () => {
  const all = allMultiplicationExercises();

  it('produces 81 exercises (9×9)', () => {
    expect(all).toHaveLength(81);
  });

  it('every exercise has correct answer', () => {
    all.forEach((ex) => {
      expect(ex.payload.answer).toBe(ex.payload.a * ex.payload.b);
    });
  });

  it('difficulty is 1 for small factors (≤ 3)', () => {
    const small = all.filter((ex) => ex.payload.a <= 3 && ex.payload.b <= 3);
    small.forEach((ex) => expect(ex.difficulty).toBe(1));
  });

  it('difficulty is 3 for large factors (> 6)', () => {
    const large = all.filter((ex) => ex.payload.a > 6 && ex.payload.b > 6);
    large.forEach((ex) => expect(ex.difficulty).toBe(3));
  });

  it('skillCode matches math.mul.{a}', () => {
    all.forEach((ex) => {
      expect(ex.skillCode).toBe(`math.mul.${ex.payload.a}`);
    });
  });

  it('covers all factors 1–9', () => {
    for (let a = 1; a <= 9; a++) {
      for (let b = 1; b <= 9; b++) {
        const found = all.find((ex) => ex.payload.a === a && ex.payload.b === b);
        expect(found).toBeDefined();
      }
    }
  });
});
