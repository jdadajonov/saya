import type { BotDifficulty } from './difficulty';

export interface ChessEngine {
  init(): Promise<void>;
  setDifficulty(difficulty: BotDifficulty): void;
  getBestMove(fen: string): Promise<string>;
  stop(): void;
  isReady(): boolean;
}

export class StockfishEngine implements ChessEngine {
  private engine: unknown = null;
  private ready = false;
  private difficulty: BotDifficulty = { skillLevel: 1, depth: 2, moveTime: 200 };

  async init(): Promise<void> {
    // Native module initialization will be handled in mobile app
    // This is a stub for the interface
    this.ready = true;
  }

  setDifficulty(difficulty: BotDifficulty): void {
    this.difficulty = difficulty;
  }

  async getBestMove(fen: string): Promise<string> {
    if (!this.ready) {
      throw new Error('Engine not initialized');
    }

    // This will be replaced with actual Stockfish call in native module
    // For now, return a placeholder that the mobile app will override
    return this.getRandomLegalMove(fen);
  }

  stop(): void {
    // Stop any ongoing calculation
  }

  isReady(): boolean {
    return this.ready;
  }

  private getRandomLegalMove(fen: string): string {
    // Fallback: import chess.js and return a random legal move
    // This is used when Stockfish is not available
    const { Chess } = require('chess.js');
    const chess = new Chess(fen);
    const moves = chess.moves({ verbose: true });
    if (moves.length === 0) return '';
    const move = moves[Math.floor(Math.random() * moves.length)]!;
    return `${move.from}${move.to}`;
  }
}

export function createEngine(): ChessEngine {
  return new StockfishEngine();
}
