import { Chess } from 'chess.js';
import type { ExercisePlugin, CheckResult } from '../../learning/exercise-registry';
import type { PuzzlePayload } from '../types';

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

  generateVariants(payload: PuzzlePayload, count: number): PuzzlePayload[] {
    return Array(count).fill(payload);
  },
};
