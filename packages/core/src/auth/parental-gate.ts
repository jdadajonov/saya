const DIGIT_WORDS: Record<string, string[]> = {
  ru: ['ноль', 'один', 'два', 'три', 'четыре', 'пять', 'шесть', 'семь', 'восемь', 'девять'],
  uz: ["nol", "bir", "ikki", "uch", "to'rt", "besh", "olti", "yetti", "sakkiz", "to'qqiz"],
  en: ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine'],
};

export interface GateChallenge {
  digits: string;
  words: string;
}

export function generateGateChallenge(locale: string): GateChallenge {
  const num = Math.floor(Math.random() * 900) + 100;
  const digits = num.toString();
  const words = DIGIT_WORDS[locale] ?? DIGIT_WORDS['ru']!;
  const wordStr = digits.split('').map((d) => words[Number(d)]!).join(' — ');
  return { digits, words: wordStr };
}

export function checkGateChallenge(input: string, challenge: GateChallenge): boolean {
  return input.trim() === challenge.digits;
}
