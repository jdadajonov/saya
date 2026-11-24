import type { ExercisePlugin, CheckResult } from '../../learning/exercise-registry';
import type { MovementPayload, ChessPiece, ChessSquare } from '../types';
import { placePiece, getValidMoves, generateRandomSquare, createEmptyBoard } from '../board';

function arraysEqual(a: string[], b: string[]): boolean {
  if (a.length !== b.length) return false;
  const sortedA = [...a].sort();
  const sortedB = [...b].sort();
  return sortedA.every((val, idx) => val === sortedB[idx]);
}

export const pieceMovementPlugin: ExercisePlugin<MovementPayload> = {
  typeId: 'chess.movement',

  checkAnswer(payload: MovementPayload, answer: unknown): CheckResult {
    const selectedSquares = answer as ChessSquare[];
    const correct = arraysEqual(selectedSquares, payload.validSquares);

    return {
      correct,
      hintsUsed: 0,
      feedback: correct
        ? undefined
        : `Правильные клетки: ${payload.validSquares.join(', ')}`,
    };
  },

  generateVariants(payload: MovementPayload, count: number): MovementPayload[] {
    const defaultPieces: ChessPiece[] = ['r', 'b', 'q', 'n', 'k'];
    const variants: MovementPayload[] = [];

    // If payload has a specific piece, use only that piece
    const pieces = (payload as MovementPayload & { piece?: ChessPiece }).piece
      ? [(payload as MovementPayload & { piece?: ChessPiece }).piece!]
      : defaultPieces;

    for (let i = 0; i < count; i++) {
      const piece = pieces[i % pieces.length]!;
      let square: ChessSquare;
      let fen: string;
      let validSquares: ChessSquare[];

      do {
        square = generateRandomSquare();
        fen = placePiece(piece, 'w', square, createEmptyBoard());
        validSquares = getValidMoves(fen, square);
      } while (validSquares.length < 2);

      variants.push({
        fen,
        pieceSquare: square,
        validSquares,
      });
    }

    return variants;
  },
};
