import { Chess, type Move } from 'chess.js';
import type { BotDifficulty } from './difficulty';

export interface BotMove {
  move: string;
  from: string;
  to: string;
  evaluation: number;
}

const PIECE_VALUES: Record<string, number> = {
  p: 100,
  n: 320,
  b: 330,
  r: 500,
  q: 900,
  k: 20000,
};

const POSITION_BONUS: Record<string, number[][]> = {
  p: [
    [0, 0, 0, 0, 0, 0, 0, 0],
    [50, 50, 50, 50, 50, 50, 50, 50],
    [10, 10, 20, 30, 30, 20, 10, 10],
    [5, 5, 10, 25, 25, 10, 5, 5],
    [0, 0, 0, 20, 20, 0, 0, 0],
    [5, -5, -10, 0, 0, -10, -5, 5],
    [5, 10, 10, -20, -20, 10, 10, 5],
    [0, 0, 0, 0, 0, 0, 0, 0],
  ],
  n: [
    [-50, -40, -30, -30, -30, -30, -40, -50],
    [-40, -20, 0, 0, 0, 0, -20, -40],
    [-30, 0, 10, 15, 15, 10, 0, -30],
    [-30, 5, 15, 20, 20, 15, 5, -30],
    [-30, 0, 15, 20, 20, 15, 0, -30],
    [-30, 5, 10, 15, 15, 10, 5, -30],
    [-40, -20, 0, 5, 5, 0, -20, -40],
    [-50, -40, -30, -30, -30, -30, -40, -50],
  ],
  b: [
    [-20, -10, -10, -10, -10, -10, -10, -20],
    [-10, 0, 0, 0, 0, 0, 0, -10],
    [-10, 0, 5, 10, 10, 5, 0, -10],
    [-10, 5, 5, 10, 10, 5, 5, -10],
    [-10, 0, 10, 10, 10, 10, 0, -10],
    [-10, 10, 10, 10, 10, 10, 10, -10],
    [-10, 5, 0, 0, 0, 0, 5, -10],
    [-20, -10, -10, -10, -10, -10, -10, -20],
  ],
  r: [
    [0, 0, 0, 0, 0, 0, 0, 0],
    [5, 10, 10, 10, 10, 10, 10, 5],
    [-5, 0, 0, 0, 0, 0, 0, -5],
    [-5, 0, 0, 0, 0, 0, 0, -5],
    [-5, 0, 0, 0, 0, 0, 0, -5],
    [-5, 0, 0, 0, 0, 0, 0, -5],
    [-5, 0, 0, 0, 0, 0, 0, -5],
    [0, 0, 0, 5, 5, 0, 0, 0],
  ],
  q: [
    [-20, -10, -10, -5, -5, -10, -10, -20],
    [-10, 0, 0, 0, 0, 0, 0, -10],
    [-10, 0, 5, 5, 5, 5, 0, -10],
    [-5, 0, 5, 5, 5, 5, 0, -5],
    [0, 0, 5, 5, 5, 5, 0, -5],
    [-10, 5, 5, 5, 5, 5, 0, -10],
    [-10, 0, 5, 0, 0, 0, 0, -10],
    [-20, -10, -10, -5, -5, -10, -10, -20],
  ],
  k: [
    [-30, -40, -40, -50, -50, -40, -40, -30],
    [-30, -40, -40, -50, -50, -40, -40, -30],
    [-30, -40, -40, -50, -50, -40, -40, -30],
    [-30, -40, -40, -50, -50, -40, -40, -30],
    [-20, -30, -30, -40, -40, -30, -30, -20],
    [-10, -20, -20, -20, -20, -20, -20, -10],
    [20, 20, 0, 0, 0, 0, 20, 20],
    [20, 30, 10, 0, 0, 10, 30, 20],
  ],
};

function getPositionBonus(piece: string, square: string, isWhite: boolean): number {
  const file = square.charCodeAt(0) - 'a'.charCodeAt(0);
  const rank = parseInt(square[1]!, 10) - 1;
  const table = POSITION_BONUS[piece.toLowerCase()];
  if (!table) return 0;
  const row = isWhite ? 7 - rank : rank;
  return table[row]?.[file] ?? 0;
}

function evaluateBoard(chess: Chess): number {
  let score = 0;
  const board = chess.board();

  for (let rank = 0; rank < 8; rank++) {
    for (let file = 0; file < 8; file++) {
      const piece = board[rank]?.[file];
      if (!piece) continue;

      const pieceValue = PIECE_VALUES[piece.type] ?? 0;
      const square = String.fromCharCode('a'.charCodeAt(0) + file) + (8 - rank);
      const positionBonus = getPositionBonus(piece.type, square, piece.color === 'w');
      const totalValue = pieceValue + positionBonus;

      score += piece.color === 'w' ? totalValue : -totalValue;
    }
  }

  if (chess.isCheckmate()) {
    score = chess.turn() === 'w' ? -100000 : 100000;
  }

  return score;
}

function evaluateMove(chess: Chess, move: Move): number {
  let score = 0;

  if (move.captured) {
    const capturedValue = PIECE_VALUES[move.captured] ?? 0;
    const attackerValue = PIECE_VALUES[move.piece] ?? 0;
    score += capturedValue * 10 - attackerValue;
  }

  if (move.promotion) {
    score += PIECE_VALUES[move.promotion] ?? 0;
  }

  const testChess = new Chess(chess.fen());
  testChess.move(move);

  if (testChess.isCheckmate()) {
    score += 50000;
  } else if (testChess.isCheck()) {
    score += 50;
  }

  if (testChess.isStalemate() || testChess.isDraw()) {
    const currentEval = evaluateBoard(chess);
    score += chess.turn() === 'w' ? (currentEval < 0 ? 100 : -100) : (currentEval > 0 ? 100 : -100);
  }

  return score;
}

function minimax(
  chess: Chess,
  depth: number,
  alpha: number,
  beta: number,
  isMaximizing: boolean
): number {
  if (depth === 0 || chess.isGameOver()) {
    return evaluateBoard(chess);
  }

  const moves = chess.moves({ verbose: true });

  if (isMaximizing) {
    let maxEval = -Infinity;
    for (const move of moves) {
      chess.move(move);
      const evaluation = minimax(chess, depth - 1, alpha, beta, false);
      chess.undo();
      maxEval = Math.max(maxEval, evaluation);
      alpha = Math.max(alpha, evaluation);
      if (beta <= alpha) break;
    }
    return maxEval;
  } else {
    let minEval = Infinity;
    for (const move of moves) {
      chess.move(move);
      const evaluation = minimax(chess, depth - 1, alpha, beta, true);
      chess.undo();
      minEval = Math.min(minEval, evaluation);
      beta = Math.min(beta, evaluation);
      if (beta <= alpha) break;
    }
    return minEval;
  }
}

export function getBestMove(fen: string, difficulty: BotDifficulty): BotMove | null {
  const chess = new Chess(fen);
  const moves = chess.moves({ verbose: true });

  if (moves.length === 0) return null;

  const isWhite = chess.turn() === 'w';
  const depth = Math.min(difficulty.depth, 4);

  const evaluatedMoves: Array<{ move: Move; score: number }> = [];

  for (const move of moves) {
    let score = evaluateMove(chess, move);

    if (depth > 0) {
      chess.move(move);
      const minimaxScore = minimax(chess, depth - 1, -Infinity, Infinity, !isWhite);
      chess.undo();
      score += isWhite ? minimaxScore : -minimaxScore;
    }

    evaluatedMoves.push({ move, score });
  }

  evaluatedMoves.sort((a, b) => b.score - a.score);

  const randomFactor = Math.max(0, 10 - difficulty.skillLevel) / 10;
  const topN = Math.max(1, Math.ceil(evaluatedMoves.length * randomFactor * 0.3));
  const candidates = evaluatedMoves.slice(0, Math.max(topN, 3));

  const weights = candidates.map((_, i) => Math.pow(0.5, i));
  const totalWeight = weights.reduce((a, b) => a + b, 0);
  let random = Math.random() * totalWeight;

  let selectedIndex = 0;
  for (let i = 0; i < weights.length; i++) {
    random -= weights[i]!;
    if (random <= 0) {
      selectedIndex = i;
      break;
    }
  }

  const selected = candidates[selectedIndex]!;

  return {
    move: selected.move.san,
    from: selected.move.from,
    to: selected.move.to,
    evaluation: selected.score,
  };
}

export function getRandomMove(fen: string): BotMove | null {
  const chess = new Chess(fen);
  const moves = chess.moves({ verbose: true });

  if (moves.length === 0) return null;

  const move = moves[Math.floor(Math.random() * moves.length)]!;

  return {
    move: move.san,
    from: move.from,
    to: move.to,
    evaluation: 0,
  };
}
