export type AgeBand = '7-9' | '10-13';

export interface BotDifficulty {
  skillLevel: number;
  depth: number;
  moveTime: number;
}

const DIFFICULTY_LEVELS: Record<number, BotDifficulty> = {
  1: { skillLevel: 0, depth: 1, moveTime: 100 },
  2: { skillLevel: 1, depth: 2, moveTime: 200 },
  3: { skillLevel: 3, depth: 3, moveTime: 300 },
  4: { skillLevel: 5, depth: 4, moveTime: 500 },
  5: { skillLevel: 7, depth: 5, moveTime: 700 },
  6: { skillLevel: 9, depth: 6, moveTime: 1000 },
  7: { skillLevel: 11, depth: 7, moveTime: 1200 },
  8: { skillLevel: 13, depth: 8, moveTime: 1500 },
  9: { skillLevel: 15, depth: 9, moveTime: 1800 },
  10: { skillLevel: 17, depth: 10, moveTime: 2000 },
};

export function getDifficultyForAge(ageBand: AgeBand, level: number): BotDifficulty {
  const minLevel = ageBand === '7-9' ? 1 : 3;
  const maxLevel = ageBand === '7-9' ? 5 : 10;
  const clampedLevel = Math.max(minLevel, Math.min(maxLevel, level));
  return DIFFICULTY_LEVELS[clampedLevel] ?? DIFFICULTY_LEVELS[1]!;
}

export function getAvailableLevels(ageBand: AgeBand): number[] {
  if (ageBand === '7-9') {
    return [1, 2, 3, 4, 5];
  }
  return [3, 4, 5, 6, 7, 8, 9, 10];
}

export function getLevelLabel(level: number): string {
  if (level <= 2) return 'Новичок';
  if (level <= 4) return 'Начинающий';
  if (level <= 6) return 'Любитель';
  if (level <= 8) return 'Продвинутый';
  return 'Мастер';
}
