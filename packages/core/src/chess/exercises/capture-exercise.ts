import { Chess } from 'chess.js';
import type { ExercisePlugin, CheckResult } from '../../learning/exercise-registry';
import type { CapturePayload, ChessPiece } from '../types';
import { generateRandomSquare, generatePawnPositions, createEmptyBoard } from '../board';

export const captureExercisePlugin: ExercisePlugin<CapturePayload> = {
  typeId: 'chess.capture',

  checkAnswer(payload: CapturePayload, answer: unknown): CheckResult {
    const moves = answer as string[];
    const chess = new Chess(payload.fen);

    let captured = 0;
    for (const move of moves) {
      try {
        const result = chess.move(move);
        if (result && result.captured) {
          captured++;
        }
      } catch {
        return {
          correct: false,
          hintsUsed: 0,
          feedback: 'Недопустимый ход',
        };
      }
    }

    const correct = captured === payload.targetSquares.length;
    return {
      correct,
      hintsUsed: 0,
      feedback: correct ? undefined : `Съедено ${captured} из ${payload.targetSquares.length}`,
    };
  },

  generateVariants(_payload: CapturePayload, count: number): CapturePayload[] {
    const attackerPieces: ChessPiece[] = ['r', 'b', 'q', 'n'];
    const variants: CapturePayload[] = [];

    for (let i = 0; i < count; i++) {
      const piece = attackerPieces[i % attackerPieces.length]!;
      const attackerSquare = generateRandomSquare();
      const pawnCount = 2 + (i % 3);

      const pawnSquares = generatePawnPositions(pawnCount, [attackerSquare]);

      const chess = new Chess(createEmptyBoard());
      chess.put({ type: piece, color: 'w' }, attackerSquare);

      for (const sq of pawnSquares) {
        chess.put({ type: 'p', color: 'b' }, sq);
      }

      variants.push({
        fen: chess.fen(),
        attackerSquare,
        targetSquares: pawnSquares,
      });
    }

    return variants;
  },
};
