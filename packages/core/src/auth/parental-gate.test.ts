import { generateGateChallenge, checkGateChallenge } from './parental-gate';

describe('generateGateChallenge', () => {
  it('produces a 3-digit number string', () => {
    const c = generateGateChallenge('ru');
    expect(c.digits).toMatch(/^\d{3}$/);
    expect(Number(c.digits)).toBeGreaterThanOrEqual(100);
    expect(Number(c.digits)).toBeLessThanOrEqual(999);
  });

  it('produces a non-empty word string', () => {
    const c = generateGateChallenge('ru');
    expect(c.words.length).toBeGreaterThan(0);
  });

  it('works for all supported locales', () => {
    for (const locale of ['ru', 'uz', 'en']) {
      const c = generateGateChallenge(locale);
      expect(c.digits).toMatch(/^\d{3}$/);
      expect(c.words).not.toBe('');
    }
  });

  it('falls back to ru for unknown locale', () => {
    const c = generateGateChallenge('xx');
    expect(c.words).toMatch(/[а-яА-Я]/);
  });

  it('contains digit words separated by em dashes', () => {
    const c = generateGateChallenge('en');
    expect(c.words).toContain(' — ');
  });
});

describe('checkGateChallenge', () => {
  it('passes for correct input', () => {
    const c = generateGateChallenge('ru');
    expect(checkGateChallenge(c.digits, c)).toBe(true);
  });

  it('passes with leading/trailing whitespace', () => {
    const c = generateGateChallenge('ru');
    expect(checkGateChallenge(`  ${c.digits}  `, c)).toBe(true);
  });

  it('fails for wrong input', () => {
    const c = { digits: '375', words: 'три — семь — пять' };
    expect(checkGateChallenge('376', c)).toBe(false);
    expect(checkGateChallenge('', c)).toBe(false);
    expect(checkGateChallenge('три', c)).toBe(false);
  });

  it('fails if only partial match', () => {
    const c = { digits: '375', words: 'три — семь — пять' };
    expect(checkGateChallenge('37', c)).toBe(false);
  });
});
