import { Chess } from 'chess.js';
import type { ChessSquare, ChessPiece, ChessColor, PieceOnBoard } from './types';

const FILES = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'] as const;
const RANKS = ['1', '2', '3', '4', '5', '6', '7', '8'] as const;

export function getAllSquares(): ChessSquare[] {
  const squares: ChessSquare[] = [];
  for (const file of FILES) {
    for (const rank of RANKS) {
      squares.push(`${file}${rank}` as ChessSquare);
    }
  }
  return squares;
}

export function squareToCoords(square: ChessSquare): { file: number; rank: number } {
  const file = square.charCodeAt(0) - 'a'.charCodeAt(0);
  const rank = parseInt(square[1]!, 10) - 1;
  return { file, rank };
}

export function coordsToSquare(file: number, rank: number): ChessSquare | null {
  if (file < 0 || file > 7 || rank < 0 || rank > 7) return null;
  return `${FILES[file]}${RANKS[rank]}` as ChessSquare;
}

export function getValidMoves(fen: string, square: ChessSquare): ChessSquare[] {
  const chess = new Chess(fen);
  const moves = chess.moves({ square, verbose: true });
  return moves.map((m) => m.to as ChessSquare);
}

export function getPiecesOnBoard(fen: string): PieceOnBoard[] {
  const chess = new Chess(fen);
  const pieces: PieceOnBoard[] = [];

  for (const square of getAllSquares()) {
    const piece = chess.get(square);
    if (piece) {
      pieces.push({
        piece: piece.type as ChessPiece,
        color: piece.color as ChessColor,
        square,
      });
    }
  }

  return pieces;
}

export function isCheckmate(fen: string): boolean {
  const chess = new Chess(fen);
  return chess.isCheckmate();
}

export function isCheck(fen: string): boolean {
  const chess = new Chess(fen);
  return chess.isCheck();
}

export function makeMove(fen: string, move: string): string | null {
  const chess = new Chess(fen);
  try {
    chess.move(move);
    return chess.fen();
  } catch {
    return null;
  }
}

export function isValidMove(fen: string, move: string): boolean {
  const chess = new Chess(fen);
  try {
    chess.move(move);
    return true;
  } catch {
    return false;
  }
}

export function getTurn(fen: string): ChessColor {
  const chess = new Chess(fen);
  return chess.turn() as ChessColor;
}

export function placePiece(
  piece: ChessPiece,
  color: ChessColor,
  square: ChessSquare,
  existingFen?: string
): string {
  const baseFen = existingFen ?? MINIMAL_FEN;
  const chess = new Chess(baseFen);
  chess.put({ type: piece, color }, square);
  return chess.fen();
}

const MINIMAL_FEN = 'k7/8/8/8/8/8/8/7K w - - 0 1';

export function createEmptyBoard(): string {
  return MINIMAL_FEN;
}

export function generateRandomSquare(): ChessSquare {
  const file = FILES[Math.floor(Math.random() * 8)]!;
  const rank = RANKS[Math.floor(Math.random() * 8)]!;
  return `${file}${rank}` as ChessSquare;
}

export function generatePawnPositions(count: number, excludeSquares: ChessSquare[] = []): ChessSquare[] {
  const available = getAllSquares().filter(
    (sq) => !excludeSquares.includes(sq) && !sq.includes('1') && !sq.includes('8')
  );
  const shuffled = available.sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}
