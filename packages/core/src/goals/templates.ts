import type { GoalTemplate } from './types';

export const GOAL_TEMPLATES: GoalTemplate[] = [
  {
    id: 'multiplication-mastery',
    domain: 'learning',
    titleKey: 'goals.templates.multiplicationMastery',
    descriptionKey: 'goals.templates.multiplicationMasteryDesc',
    milestones: [
      { title: '×1', skillCode: 'math.mul.1', masteryThreshold: 0.8 },
      { title: '×2', skillCode: 'math.mul.2', masteryThreshold: 0.8 },
      { title: '×3', skillCode: 'math.mul.3', masteryThreshold: 0.8 },
      { title: '×4', skillCode: 'math.mul.4', masteryThreshold: 0.8 },
      { title: '×5', skillCode: 'math.mul.5', masteryThreshold: 0.8 },
      { title: '×6', skillCode: 'math.mul.6', masteryThreshold: 0.8 },
      { title: '×7', skillCode: 'math.mul.7', masteryThreshold: 0.8 },
      { title: '×8', skillCode: 'math.mul.8', masteryThreshold: 0.8 },
      { title: '×9', skillCode: 'math.mul.9', masteryThreshold: 0.8 },
    ],
  },
  {
    id: 'english-a1-vocabulary',
    domain: 'learning',
    titleKey: 'goals.templates.englishA1Vocabulary',
    descriptionKey: 'goals.templates.englishA1VocabularyDesc',
    milestones: [
      { title: 'Animals', skillCode: 'en.a1.animals', masteryThreshold: 0.8 },
      { title: 'School', skillCode: 'en.a1.school', masteryThreshold: 0.8 },
      { title: 'Family', skillCode: 'en.a1.family', masteryThreshold: 0.8 },
      { title: 'Food', skillCode: 'en.a1.food', masteryThreshold: 0.8 },
      { title: 'Colors', skillCode: 'en.a1.colors', masteryThreshold: 0.8 },
      { title: 'Sports', skillCode: 'en.a1.sports', masteryThreshold: 0.8 },
    ],
  },
  {
    id: 'sports-consistency',
    domain: 'activity',
    titleKey: 'goals.templates.sportsConsistency',
    descriptionKey: 'goals.templates.sportsConsistencyDesc',
    milestones: [
      { title: '5 sessions', sessionCount: 5 },
      { title: '10 sessions', sessionCount: 10 },
      { title: '20 sessions', sessionCount: 20 },
    ],
  },
  {
    id: 'reading-challenge',
    domain: 'learning',
    titleKey: 'goals.templates.readingChallenge',
    descriptionKey: 'goals.templates.readingChallengeDesc',
    milestones: [
      { title: '3 books' },
      { title: '5 books' },
      { title: '10 books' },
    ],
  },
];

export function getTemplateById(id: string): GoalTemplate | undefined {
  return GOAL_TEMPLATES.find((t) => t.id === id);
}
