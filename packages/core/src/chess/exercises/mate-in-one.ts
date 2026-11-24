import { Chess } from 'chess.js';
import type { ExercisePlugin, CheckResult } from '../../learning/exercise-registry';
import type { MateInOnePayload } from '../types';

const MATE_IN_ONE_POSITIONS: MateInOnePayload[] = [
  {
    fen: '1k6/ppp5/8/8/8/8/8/4K2R w - - 0 1',
    solution: 'Rh8#',
    hint: 'back_rank',
  },
  {
    fen: '6k1/5ppp/8/8/8/8/8/R3K3 w Q - 0 1',
    solution: 'Ra8#',
    hint: 'back_rank',
  },
  {
    fen: 'r1bqkb1r/pppp1ppp/2n2n2/4p2Q/2B1P3/8/PPPP1PPP/RNB1K1NR w KQkq - 4 4',
    solution: 'Qxf7#',
    hint: 'queen_mate',
  },
  {
    fen: '5rk1/5ppp/8/8/8/8/5PPP/4R1K1 w - - 0 1',
    solution: 'Re8#',
    hint: 'back_rank',
  },
  {
    fen: 'r1bqkbnr/pppp1ppp/2n5/4p3/2B1P3/5Q2/PPPP1PPP/RNB1K1NR w KQkq - 4 4',
    solution: 'Qxf7#',
    hint: 'queen_mate',
  },
  {
    fen: '6k1/5p1p/6p1/8/8/8/5Q1P/6K1 w - - 0 1',
    solution: 'Qf8#',
    hint: 'queen_mate',
  },
  {
    fen: 'r4rk1/5ppp/8/8/8/8/5PPP/R4RK1 w - - 0 1',
    solution: 'Ra8#',
    hint: 'back_rank',
  },
  {
    fen: 'k1K5/8/8/8/8/8/8/1R6 w - - 0 1',
    solution: 'Rb8#',
    hint: 'back_rank',
  },
  {
    fen: '5rk1/4Nppp/8/8/8/8/5PPP/6K1 w - - 0 1',
    solution: 'Nf6#',
    hint: 'smothered',
  },
  {
    fen: '6k1/6pp/5N2/8/8/8/5Q1P/6K1 w - - 0 1',
    solution: 'Qg8#',
    hint: 'smothered',
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
