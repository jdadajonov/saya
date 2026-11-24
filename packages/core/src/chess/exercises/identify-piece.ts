import type { ExercisePlugin, CheckResult } from '../../learning/exercise-registry';
import type { IdentifyPiecePayload, ChessPiece } from '../types';
import { ALL_PIECES } from '../types';

function shuffleArray<T>(arr: T[]): T[] {
  const result = [...arr];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j]!, result[i]!];
  }
  return result;
}

function generateOptions(correctPiece: ChessPiece): ChessPiece[] {
  const others = ALL_PIECES.filter((p) => p !== correctPiece);
  const wrongOptions = shuffleArray(others).slice(0, 3);
  return shuffleArray([correctPiece, ...wrongOptions]);
}

export const identifyPiecePlugin: ExercisePlugin<IdentifyPiecePayload> = {
  typeId: 'chess.identify',

  checkAnswer(payload: IdentifyPiecePayload, answer: unknown): CheckResult {
    const correct = answer === payload.piece;
    return {
      correct,
      hintsUsed: 0,
      feedback: correct ? undefined : `Это ${payload.piece}`,
    };
  },

  generateVariants(_payload: IdentifyPiecePayload, count: number): IdentifyPiecePayload[] {
    const variants: IdentifyPiecePayload[] = [];
    const colors: Array<'w' | 'b'> = ['w', 'b'];

    for (let i = 0; i < count; i++) {
      const piece = ALL_PIECES[i % ALL_PIECES.length]!;
      const color = colors[Math.floor(Math.random() * 2)]!;
      variants.push({
        piece,
        color,
        options: generateOptions(piece),
      });
    }

    return variants;
  },
};
