import multiplicationSkills from './skills/multiplication.json';
import englishA1Skills from './skills/english-a1.json';
import chessSkills from './skills/chess.json';
import chessLessons from './exercises/chess/lessons.json';
import chessPuzzlesEasy from './exercises/chess/puzzles-easy.json';
import chessPuzzlesMedium from './exercises/chess/puzzles-medium.json';

export { multiplicationSkills, englishA1Skills, chessSkills, chessLessons, chessPuzzlesEasy, chessPuzzlesMedium };

export type SkillEntry = {
  code: string;
  label: Record<string, string>;
  parent: string | null;
  prerequisites: string[];
};

export type ChessPuzzle = {
  id: string;
  fen: string;
  moves: string[];
  rating: number;
  themes: string[];
};

export type ChessPieceInfo = {
  piece: string;
  name: Record<string, string>;
  description: Record<string, string>;
};

export type ChessLessonExercise = {
  type: string;
  fen: string;
  pieceSquare?: string;
  attackerSquare?: string;
  targetSquares?: string[];
  solution?: string;
  hint: Record<string, string>;
};

export type ChessLesson = {
  skillCode: string;
  intro?: Record<string, string>;
  pieces?: ChessPieceInfo[];
  exercises?: ChessLessonExercise[];
  puzzleSource?: string;
  puzzleFilter?: { themes: string[]; maxRating: number };
  botLevels?: number[];
};

export function getChessPuzzlesByRating(minRating: number, maxRating: number): ChessPuzzle[] {
  const allPuzzles = [
    ...chessPuzzlesEasy.puzzles,
    ...chessPuzzlesMedium.puzzles,
  ] as ChessPuzzle[];

  return allPuzzles.filter(p => p.rating >= minRating && p.rating <= maxRating);
}

export function getChessPuzzlesByTheme(theme: string): ChessPuzzle[] {
  const allPuzzles = [
    ...chessPuzzlesEasy.puzzles,
    ...chessPuzzlesMedium.puzzles,
  ] as ChessPuzzle[];

  return allPuzzles.filter(p => p.themes.includes(theme));
}

export function getChessLessonBySkill(skillCode: string): ChessLesson | undefined {
  return (chessLessons.lessons as ChessLesson[]).find(l => l.skillCode === skillCode);
}
