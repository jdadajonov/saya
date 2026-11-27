import { Chess } from 'chess.js';
import type { ExercisePlugin, CheckResult } from '../../learning/exercise-registry';
import type { MateInOnePayload } from '../types';

const MATE_IN_ONE_POSITIONS: MateInOnePayload[] = [
  {
    fen: '6k1/5ppp/8/8/8/8/8/4R1K1 w - - 0 1',
    solution: 'Re8#',
    hint: 'back_rank',
  },
  {
    fen: '7k/5ppp/8/8/8/8/8/R6K w - - 0 1',
    solution: 'Ra8#',
    hint: 'back_rank',
  },
  {
    fen: 'r1bqkb1r/pppp1ppp/2n2n2/4p2Q/2B1P3/8/PPPP1PPP/RNB1K1NR w KQkq - 4 4',
    solution: 'Qxf7#',
    hint: 'queen_mate',
  },
  {
    fen: '5k2/8/5K2/8/8/8/8/7Q w - - 0 1',
    solution: 'Qh8#',
    hint: 'queen_mate',
  },
  {
    fen: '6k1/5ppp/8/8/8/8/8/3Q2K1 w - - 0 1',
    solution: 'Qd8#',
    hint: 'back_rank',
  },
  {
    fen: '1k6/8/1K6/8/8/8/8/7R w - - 0 1',
    solution: 'Rh8#',
    hint: 'back_rank',
  },
  {
    fen: 'r1bqkbnr/pppp1ppp/2n5/4p3/2B1P3/5Q2/PPPP1PPP/RNB1K1NR w KQkq - 4 4',
    solution: 'Qxf7#',
    hint: 'queen_mate',
  },
  {
    fen: '1k6/ppp5/8/8/8/8/8/4K2R w - - 0 1',
    solution: 'Rh8#',
    hint: 'back_rank',
  },
  {
    fen: '6k1/5ppp/8/8/8/8/8/R5K1 w - - 0 1',
    solution: 'Ra8#',
    hint: 'back_rank',
  },
  {
    fen: '3r2k1/5ppp/8/8/8/8/5PPP/3Q2K1 w - - 0 1',
    solution: 'Qxd8#',
    hint: 'back_rank',
  },
];

export const mateInOnePlugin: ExercisePlugin<MateInOnePayload> = {
  typeId: 'chess.mate1',

  checkAnswer(payload: MateInOnePayload, answer: unknown): CheckResult {
    const move = answer as string;
    const chess = new Chess(payload.fen);

    try {
      chess.move(move);
      const correct = chess.isCheckmate();

      return {
        correct,
        hintsUsed: 0,
        feedback: correct ? undefined : 'Это не мат. Попробуй ещё!',
      };
    } catch {
      return {
        correct: false,
        hintsUsed: 0,
        feedback: 'Недопустимый ход',
      };
    }
  },

  generateVariants(_payload: MateInOnePayload, count: number): MateInOnePayload[] {
    const variants: MateInOnePayload[] = [];
    const shuffled = [...MATE_IN_ONE_POSITIONS].sort(() => Math.random() - 0.5);

    for (let i = 0; i < count; i++) {
      variants.push(shuffled[i % shuffled.length]!);
    }

    return variants;
  },
};
