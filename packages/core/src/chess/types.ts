import type { Square, PieceSymbol, Color } from 'chess.js';

export type ChessPiece = PieceSymbol;
export type ChessSquare = Square;
export type ChessColor = Color;

export interface ChessPosition {
  fen: string;
  turn: ChessColor;
}

export interface ChessPuzzle {
  id: string;
  fen: string;
  moves: string[];
  rating: number;
  themes: string[];
}

export interface PieceOnBoard {
  piece: ChessPiece;
  color: ChessColor;
  square: ChessSquare;
}

export interface IdentifyPiecePayload {
  piece: ChessPiece;
  color: ChessColor;
  options: ChessPiece[];
  [key: string]: unknown;
}

export interface MovementPayload {
  fen: string;
  pieceSquare: ChessSquare;
  validSquares: ChessSquare[];
  [key: string]: unknown;
}

export interface CapturePayload {
  fen: string;
  attackerSquare: ChessSquare;
  targetSquares: ChessSquare[];
  [key: string]: unknown;
}

export interface MateInOnePayload {
  fen: string;
  solution: string;
  hint?: string;
  [key: string]: unknown;
}

export interface PuzzlePayload {
  id: string;
  fen: string;
  moves: string[];
  rating: number;
  [key: string]: unknown;
}

export type ChessExercisePayload =
  | IdentifyPiecePayload
  | MovementPayload
  | CapturePayload
  | MateInOnePayload
  | PuzzlePayload;

export const PIECE_NAMES: Record<ChessPiece, string> = {
  k: 'king',
  q: 'queen',
  r: 'rook',
  b: 'bishop',
  n: 'knight',
  p: 'pawn',
};

export const ALL_PIECES: ChessPiece[] = ['k', 'q', 'r', 'b', 'n', 'p'];
