import { z } from 'zod';
import englishA1 from './exercises/english-a1.json';
import chessSkills from './skills/chess.json';
import chessLessons from './exercises/chess/lessons.json';
import chessPuzzlesEasy from './exercises/chess/puzzles-easy.json';
import chessPuzzlesMedium from './exercises/chess/puzzles-medium.json';

const WordSchema = z.object({
  en: z.string().min(1),
  ru: z.string().min(1),
  uz: z.string().min(1),
});

const TopicSchema = z.object({
  skillCode: z.string().regex(/^en\.a1\./),
  words: z.array(WordSchema).min(4),
});

const WordBankSchema = z.object({
  subject: z.literal('english'),
  topics: z.array(TopicSchema).min(1),
});

function validateWordBank(): void {
  const result = WordBankSchema.safeParse(englishA1);
  if (!result.success) {
    throw new Error(
      'Word bank validation failed:\n' +
      result.error.issues.map((i) => ` - ${i.path.join('.')}: ${i.message}`).join('\n'),
    );
  }

  for (const topic of result.data.topics) {
    const words = topic.words.map((w) => w.en.toLowerCase());
    const unique = new Set(words);
    if (unique.size !== words.length) {
      throw new Error(`Duplicate English words in topic ${topic.skillCode}`);
    }
    if (topic.words.length < 4) {
      throw new Error(`Topic ${topic.skillCode} needs ≥ 4 words for distractor generation`);
    }
  }
}

validateWordBank();

const LocalizedStringSchema = z.record(z.string().min(1));

const ChessSkillSchema = z.object({
  code: z.string().regex(/^chess\./),
  label: LocalizedStringSchema,
  parent: z.string().nullable(),
  prerequisites: z.array(z.string()),
});

const ChessSkillsSchema = z.object({
  subject: z.literal('chess'),
  skills: z.array(ChessSkillSchema).min(5),
});

const ChessPuzzleSchema = z.object({
  id: z.string().min(1),
  fen: z.string().regex(/^[rnbqkpRNBQKP1-8\/]+ [wb] [KQkq-]+ [a-h1-8-]+ \d+ \d+$/),
  moves: z.array(z.string().min(2)),
  rating: z.number().int().min(100).max(3000),
  themes: z.array(z.string()),
});

const ChessPuzzleBankSchema = z.object({
  meta: z.object({
    source: z.string(),
    rating_range: z.tuple([z.number(), z.number()]),
    count: z.number(),
    last_updated: z.string(),
  }),
  puzzles: z.array(ChessPuzzleSchema).min(10),
});

function validateChessContent(): void {
  const skillsResult = ChessSkillsSchema.safeParse(chessSkills);
  if (!skillsResult.success) {
    throw new Error(
      'Chess skills validation failed:\n' +
      skillsResult.error.issues.map((i) => ` - ${i.path.join('.')}: ${i.message}`).join('\n'),
    );
  }

  const skillCodes = new Set(skillsResult.data.skills.map(s => s.code));
  for (const skill of skillsResult.data.skills) {
    for (const prereq of skill.prerequisites) {
      if (!skillCodes.has(prereq)) {
        throw new Error(`Skill ${skill.code} has unknown prerequisite: ${prereq}`);
      }
    }
  }

  const easyResult = ChessPuzzleBankSchema.safeParse(chessPuzzlesEasy);
  if (!easyResult.success) {
    throw new Error(
      'Easy puzzles validation failed:\n' +
      easyResult.error.issues.map((i) => ` - ${i.path.join('.')}: ${i.message}`).join('\n'),
    );
  }

  const mediumResult = ChessPuzzleBankSchema.safeParse(chessPuzzlesMedium);
  if (!mediumResult.success) {
    throw new Error(
      'Medium puzzles validation failed:\n' +
      mediumResult.error.issues.map((i) => ` - ${i.path.join('.')}: ${i.message}`).join('\n'),
    );
  }

  const puzzleIds = new Set<string>();
  for (const puzzle of [...easyResult.data.puzzles, ...mediumResult.data.puzzles]) {
    if (puzzleIds.has(puzzle.id)) {
      throw new Error(`Duplicate puzzle ID: ${puzzle.id}`);
    }
    puzzleIds.add(puzzle.id);
  }

  console.log(`Chess validation passed:`);
  console.log(`  - ${skillsResult.data.skills.length} skills`);
  console.log(`  - ${easyResult.data.puzzles.length} easy puzzles`);
  console.log(`  - ${mediumResult.data.puzzles.length} medium puzzles`);
}

validateChessContent();
