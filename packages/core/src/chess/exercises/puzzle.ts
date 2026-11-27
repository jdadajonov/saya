import { Chess } from 'chess.js';
import type { ExercisePlugin, CheckResult } from '../../learning/exercise-registry';
import type { PuzzlePayload } from '../types';

const PUZZLE_POSITIONS: PuzzlePayload[] = [
  {
    id: 'puzzle-001',
    fen: 'r1bqkb1r/pppp1ppp/2n2n2/4p3/2B1P3/5N2/PPPP1PPP/RNBQK2R w KQkq - 4 4',
    moves: ['Ng5'],
    themes: ['opening', 'attack'],
    rating: 1000,
  },
  {
    id: 'puzzle-002',
    fen: 'r1bqkbnr/pppp1ppp/2n5/4p3/4P3/5N2/PPPP1PPP/RNBQKB1R w KQkq - 2 3',
    moves: ['Bc4'],
    themes: ['development', 'center'],
    rating: 800,
  },
  {
    id: 'puzzle-003',
    fen: 'r2qkb1r/ppp2ppp/2n1bn2/3pp3/4P3/2N2N2/PPPP1PPP/R1BQKB1R w KQkq - 4 5',
    moves: ['exd5'],
    themes: ['exchange', 'center'],
    rating: 1100,
  },
  {
    id: 'puzzle-004',
    fen: 'r1bqkb1r/pppp1ppp/2n2n2/4p3/2B1P3/5N2/PPPP1PPP/RNBQK2R w KQkq - 4 4',
    moves: ['d3'],
    themes: ['development', 'solid'],
    rating: 900,
  },
  {
    id: 'puzzle-005',
    fen: 'rnbqkbnr/pppp1ppp/8/4p3/4P3/8/PPPP1PPP/RNBQKBNR w KQkq - 0 2',
    moves: ['Nf3'],
    themes: ['development', 'attack'],
    rating: 700,
  },
  {
    id: 'puzzle-006',
    fen: 'r1bqkbnr/pppp1ppp/2n5/4p3/4P3/5N2/PPPP1PPP/RNBQKB1R w KQkq - 2 3',
    moves: ['Bb5'],
    themes: ['opening', 'ruy_lopez'],
    rating: 850,
  },
  {
    id: 'puzzle-007',
    fen: 'r1bqk2r/pppp1ppp/2n2n2/2b1p3/2B1P3/5N2/PPPP1PPP/RNBQK2R w KQkq - 4 4',
    moves: ['c3'],
    themes: ['gambit', 'center'],
    rating: 1200,
  },
  {
    id: 'puzzle-008',
    fen: 'rnbqkbnr/ppp1pppp/8/3p4/4P3/8/PPPP1PPP/RNBQKBNR w KQkq d6 0 2',
    moves: ['exd5'],
    themes: ['development', 'tempo'],
    rating: 950,
  },
];

export const puzzlePlugin: ExercisePlugin<PuzzlePayload> = {
  typeId: 'chess.puzzle',

  checkAnswer(payload: PuzzlePayload, answer: unknown): CheckResult {
    const moves = answer as string[];
    const chess = new Chess(payload.fen);
    const expectedMoves = payload.moves;

    for (let i = 0; i < moves.length; i++) {
      const userMove = moves[i];
      const expectedMove = expectedMoves[i];

      if (!userMove || !expectedMove) {
        return {
          correct: false,
          hintsUsed: 0,
          feedback: 'Неполное решение',
        };
      }

      try {
        const result = chess.move(userMove);
        if (!result) {
          return {
            correct: false,
            hintsUsed: 0,
            feedback: 'Недопустимый ход',
          };
        }

        const normalizedUser = `${result.from}${result.to}`;
        const normalizedExpected = expectedMove.length === 4
          ? expectedMove
          : expectedMove.slice(0, 4);

        if (normalizedUser !== normalizedExpected) {
          return {
            correct: false,
            hintsUsed: 0,
            feedback: 'Неверный ход',
          };
        }
      } catch {
        return {
          correct: false,
          hintsUsed: 0,
          feedback: 'Недопустимый ход',
        };
      }
    }

    const correct = moves.length === expectedMoves.length;
    return {
      correct,
      hintsUsed: 0,
      feedback: correct ? undefined : 'Решение неполное',
    };
  },

  generateVariants(_payload: PuzzlePayload, count: number): PuzzlePayload[] {
    const variants: PuzzlePayload[] = [];
    const shuffled = [...PUZZLE_POSITIONS].sort(() => Math.random() - 0.5);

    for (let i = 0; i < count; i++) {
      variants.push(shuffled[i % shuffled.length]!);
    }

    return variants;
  },
};
