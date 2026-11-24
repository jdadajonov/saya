import { describe, it, expect, beforeAll } from '@jest/globals';
import {
  getAllSquares,
  squareToCoords,
  coordsToSquare,
  getValidMoves,
  getPiecesOnBoard,
  isCheckmate,
  isCheck,
  makeMove,
  isValidMove,
  placePiece,
  createEmptyBoard,
} from './board';
import { identifyPiecePlugin } from './exercises/identify-piece';
import { pieceMovementPlugin } from './exercises/piece-movement';
import { captureExercisePlugin } from './exercises/capture-exercise';
import { mateInOnePlugin } from './exercises/mate-in-one';
import { puzzlePlugin } from './exercises/puzzle';
import { getDifficultyForAge, getAvailableLevels, getLevelLabel } from './bot/difficulty';
import { registerChessPlugins } from './index';
import { exerciseRegistry } from '../learning/exercise-registry';

describe('Board utilities', () => {
  it('getAllSquares returns 64 squares', () => {
    const squares = getAllSquares();
    expect(squares).toHaveLength(64);
    expect(squares).toContain('a1');
    expect(squares).toContain('h8');
    expect(squares).toContain('e4');
  });

  it('squareToCoords converts correctly', () => {
    expect(squareToCoords('a1')).toEqual({ file: 0, rank: 0 });
    expect(squareToCoords('h8')).toEqual({ file: 7, rank: 7 });
    expect(squareToCoords('e4')).toEqual({ file: 4, rank: 3 });
  });

  it('coordsToSquare converts correctly', () => {
    expect(coordsToSquare(0, 0)).toBe('a1');
    expect(coordsToSquare(7, 7)).toBe('h8');
    expect(coordsToSquare(4, 3)).toBe('e4');
    expect(coordsToSquare(-1, 0)).toBeNull();
    expect(coordsToSquare(8, 0)).toBeNull();
  });

  it('getValidMoves returns correct moves for rook on e4', () => {
    const fen = placePiece('r', 'w', 'e4', createEmptyBoard());
    const moves = getValidMoves(fen, 'e4');
    expect(moves).toContain('e1');
    expect(moves).toContain('e8');
    expect(moves).toContain('a4');
    expect(moves).toContain('h4');
    expect(moves).not.toContain('d5');
  });

  it('getValidMoves returns correct moves for knight', () => {
    const fen = placePiece('n', 'w', 'e4', createEmptyBoard());
    const moves = getValidMoves(fen, 'e4');
    expect(moves).toContain('d6');
    expect(moves).toContain('f6');
    expect(moves).toContain('g5');
    expect(moves).toContain('g3');
    expect(moves).not.toContain('e5');
  });

  it('getPiecesOnBoard returns pieces correctly', () => {
    const fen = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';
    const pieces = getPiecesOnBoard(fen);
    expect(pieces).toHaveLength(32);
    expect(pieces.filter((p) => p.color === 'w')).toHaveLength(16);
    expect(pieces.filter((p) => p.color === 'b')).toHaveLength(16);
  });

  it('isCheckmate detects checkmate', () => {
    const checkmatedFen = 'rnb1kbnr/pppp1ppp/4p3/8/6Pq/5P2/PPPPP2P/RNBQKBNR w KQkq - 1 3';
    expect(isCheckmate(checkmatedFen)).toBe(true);

    const normalFen = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';
    expect(isCheckmate(normalFen)).toBe(false);
  });

  it('isCheck detects check', () => {
    const checkFen = 'rnbqkbnr/ppppp1pp/5p2/7Q/4P3/8/PPPP1PPP/RNB1KBNR b KQkq - 1 2';
    expect(isCheck(checkFen)).toBe(true);
  });

  it('makeMove returns new FEN', () => {
    const startFen = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';
    const newFen = makeMove(startFen, 'e4');
    expect(newFen).not.toBeNull();
    expect(newFen).toContain('4P3');
  });

  it('isValidMove validates moves', () => {
    const fen = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';
    expect(isValidMove(fen, 'e4')).toBe(true);
    expect(isValidMove(fen, 'e5')).toBe(false);
  });
});

describe('Identify Piece Plugin', () => {
  it('checkAnswer returns correct for right answer', () => {
    const payload = { piece: 'q' as const, color: 'w' as const, options: ['q', 'k', 'r', 'b'] as const };
    const result = identifyPiecePlugin.checkAnswer(payload, 'q');
    expect(result.correct).toBe(true);
  });

  it('checkAnswer returns incorrect for wrong answer', () => {
    const payload = { piece: 'q' as const, color: 'w' as const, options: ['q', 'k', 'r', 'b'] as const };
    const result = identifyPiecePlugin.checkAnswer(payload, 'k');
    expect(result.correct).toBe(false);
  });

  it('generateVariants creates valid variants', () => {
    const variants = identifyPiecePlugin.generateVariants(
      { piece: 'q', color: 'w', options: ['q', 'k', 'r', 'b'] },
      5
    );
    expect(variants).toHaveLength(5);
    variants.forEach((v) => {
      expect(v.options).toHaveLength(4);
      expect(v.options).toContain(v.piece);
    });
  });
});

describe('Piece Movement Plugin', () => {
  it('checkAnswer returns correct when all squares selected', () => {
    const payload = {
      fen: placePiece('r', 'w', 'a1', createEmptyBoard()),
      pieceSquare: 'a1' as const,
      validSquares: ['a2', 'a3', 'a4', 'a5', 'a6', 'a7', 'a8', 'b1', 'c1', 'd1', 'e1', 'f1', 'g1', 'h1'] as const,
    };
    const result = pieceMovementPlugin.checkAnswer(payload, payload.validSquares);
    expect(result.correct).toBe(true);
  });

  it('checkAnswer returns incorrect for partial selection', () => {
    const payload = {
      fen: placePiece('r', 'w', 'a1', createEmptyBoard()),
      pieceSquare: 'a1' as const,
      validSquares: ['a2', 'a3', 'b1'] as const,
    };
    const result = pieceMovementPlugin.checkAnswer(payload, ['a2']);
    expect(result.correct).toBe(false);
  });

  it('generateVariants creates valid positions', () => {
    const variants = pieceMovementPlugin.generateVariants(
      { fen: '', pieceSquare: 'e4', validSquares: [] },
      3
    );
    expect(variants).toHaveLength(3);
    variants.forEach((v) => {
      expect(v.validSquares.length).toBeGreaterThanOrEqual(2);
    });
  });
});

describe('Mate In One Plugin', () => {
  it('checkAnswer returns correct for checkmate move', () => {
    const payload = {
      fen: '1k6/ppp5/8/8/8/8/8/4K2R w - - 0 1',
      solution: 'Rh8#',
    };
    const result = mateInOnePlugin.checkAnswer(payload, 'Rh8');
    expect(result.correct).toBe(true);
  });

  it('checkAnswer returns incorrect for non-mate move', () => {
    const payload = {
      fen: '1k6/ppp5/8/8/8/8/8/4K2R w - - 0 1',
      solution: 'Rh8#',
    };
    const result = mateInOnePlugin.checkAnswer(payload, 'Rh2');
    expect(result.correct).toBe(false);
  });

  it('generateVariants returns valid puzzles', () => {
    const variants = mateInOnePlugin.generateVariants(
      { fen: '', solution: '', hint: '' },
      5
    );
    expect(variants).toHaveLength(5);
    variants.forEach((v) => {
      expect(v.fen).toBeTruthy();
      expect(v.solution).toBeTruthy();
    });
  });
});

describe('Capture Exercise Plugin', () => {
  it('checkAnswer returns correct when all targets captured', () => {
    const payload = {
      fen: 'k7/8/8/3p4/3R4/8/8/7K w - - 0 1',
      attackerSquare: 'd4' as const,
      targetSquares: ['d5'] as const,
    };
    const result = captureExercisePlugin.checkAnswer(payload, ['Rxd5']);
    expect(result.correct).toBe(true);
  });

  it('checkAnswer returns incorrect for missing captures', () => {
    const payload = {
      fen: 'k7/8/8/3p4/3R4/8/8/7K w - - 0 1',
      attackerSquare: 'd4' as const,
      targetSquares: ['d5'] as const,
    };
    const result = captureExercisePlugin.checkAnswer(payload, ['Rd3']);
    expect(result.correct).toBe(false);
  });

  it('checkAnswer returns error for invalid move', () => {
    const payload = {
      fen: 'k7/8/8/3p4/3R4/8/8/7K w - - 0 1',
      attackerSquare: 'd4' as const,
      targetSquares: ['d5'] as const,
    };
    const result = captureExercisePlugin.checkAnswer(payload, ['invalid']);
    expect(result.correct).toBe(false);
    expect(result.feedback).toBe('Недопустимый ход');
  });

  it('generateVariants creates valid positions', () => {
    const variants = captureExercisePlugin.generateVariants(
      { fen: '', attackerSquare: 'e4', targetSquares: [] },
      3
    );
    expect(variants).toHaveLength(3);
    variants.forEach((v) => {
      expect(v.attackerSquare).toBeTruthy();
      expect(v.targetSquares.length).toBeGreaterThanOrEqual(2);
    });
  });
});

describe('Puzzle Plugin', () => {
  it('checkAnswer validates correct sequence', () => {
    const payload = {
      id: 'test',
      fen: 'r1bqkb1r/pppp1ppp/2n2n2/4p2Q/2B1P3/8/PPPP1PPP/RNB1K1NR w KQkq - 4 4',
      moves: ['h5f7'],
      rating: 600,
    };
    const result = puzzlePlugin.checkAnswer(payload, ['Qxf7']);
    expect(result.correct).toBe(true);
  });
});

describe('Bot Difficulty', () => {
  it('getDifficultyForAge returns correct range for 7-9', () => {
    const diff = getDifficultyForAge('7-9', 1);
    expect(diff.skillLevel).toBe(0);
    expect(diff.depth).toBe(1);
  });

  it('getDifficultyForAge clamps to max for 7-9', () => {
    const diff = getDifficultyForAge('7-9', 10);
    expect(diff.skillLevel).toBeLessThanOrEqual(7);
  });

  it('getAvailableLevels returns correct levels', () => {
    expect(getAvailableLevels('7-9')).toEqual([1, 2, 3, 4, 5]);
    expect(getAvailableLevels('10-13')).toEqual([3, 4, 5, 6, 7, 8, 9, 10]);
  });

  it('getLevelLabel returns labels', () => {
    expect(getLevelLabel(1)).toBe('Новичок');
    expect(getLevelLabel(4)).toBe('Начинающий');
    expect(getLevelLabel(6)).toBe('Любитель');
    expect(getLevelLabel(10)).toBe('Мастер');
  });
});

describe('Plugin Registration', () => {
  beforeAll(() => {
    registerChessPlugins();
  });

  it('registers all chess plugins', () => {
    expect(exerciseRegistry.has('chess.identify')).toBe(true);
    expect(exerciseRegistry.has('chess.movement')).toBe(true);
    expect(exerciseRegistry.has('chess.capture')).toBe(true);
    expect(exerciseRegistry.has('chess.mate1')).toBe(true);
    expect(exerciseRegistry.has('chess.puzzle')).toBe(true);
  });

  it('can retrieve registered plugins', () => {
    const plugin = exerciseRegistry.get('chess.identify');
    expect(plugin.typeId).toBe('chess.identify');
  });
});
