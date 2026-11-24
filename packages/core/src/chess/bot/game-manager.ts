import { Chess } from 'chess.js';
import type { ChessSquare, ChessColor } from '../types';
import type { ChessEngine } from './engine-wrapper';
import type { BotDifficulty } from './difficulty';
import { createEngine, type BotMove } from './engine-wrapper';

export type GameResult = 'white_wins' | 'black_wins' | 'draw' | 'in_progress';
export type GameEndReason =
  | 'checkmate'
  | 'stalemate'
  | 'insufficient_material'
  | 'threefold_repetition'
  | 'fifty_moves'
  | 'resignation'
  | 'timeout'
  | null;

export interface GameState {
  fen: string;
  turn: ChessColor;
  moveHistory: Array<{
    san: string;
    from: ChessSquare;
    to: ChessSquare;
    fen: string;
  }>;
  result: GameResult;
  endReason: GameEndReason;
  isCheck: boolean;
  isCheckmate: boolean;
  isStalemate: boolean;
  isDraw: boolean;
  playerColor: ChessColor;
  botLevel: number;
}

export interface GameCallbacks {
  onBotMoveStart?: () => void;
  onBotMove?: (move: BotMove) => void;
  onGameEnd?: (result: GameResult, reason: GameEndReason) => void;
  onStateChange?: (state: GameState) => void;
}

export class ChessGameManager {
  private chess: Chess;
  private engine: ChessEngine;
  private playerColor: ChessColor;
  private botLevel: number;
  private difficulty: BotDifficulty;
  private callbacks: GameCallbacks;
  private moveHistory: GameState['moveHistory'] = [];

  constructor(
    playerColor: ChessColor,
    botLevel: number,
    difficulty: BotDifficulty,
    callbacks: GameCallbacks = {}
  ) {
    this.chess = new Chess();
    this.engine = createEngine();
    this.playerColor = playerColor;
    this.botLevel = botLevel;
    this.difficulty = difficulty;
    this.callbacks = callbacks;
  }

  async init(): Promise<void> {
    await this.engine.init();
    this.engine.setDifficulty(this.difficulty);

    if (this.playerColor === 'b') {
      await this.makeBotMove();
    }
  }

  getState(): GameState {
    return {
      fen: this.chess.fen(),
      turn: this.chess.turn() as ChessColor,
      moveHistory: [...this.moveHistory],
      result: this.getResult(),
      endReason: this.getEndReason(),
      isCheck: this.chess.isCheck(),
      isCheckmate: this.chess.isCheckmate(),
      isStalemate: this.chess.isStalemate(),
      isDraw: this.chess.isDraw(),
      playerColor: this.playerColor,
      botLevel: this.botLevel,
    };
  }

  isPlayerTurn(): boolean {
    return this.chess.turn() === this.playerColor && !this.chess.isGameOver();
  }

  getValidMoves(square: ChessSquare): ChessSquare[] {
    const moves = this.chess.moves({ square, verbose: true });
    return moves.map((m) => m.to as ChessSquare);
  }

  async makePlayerMove(from: ChessSquare, to: ChessSquare, promotion?: string): Promise<boolean> {
    if (!this.isPlayerTurn()) return false;

    try {
      const move = this.chess.move({ from, to, promotion: promotion as 'q' | 'r' | 'b' | 'n' });
      if (!move) return false;

      this.moveHistory.push({
        san: move.san,
        from: move.from as ChessSquare,
        to: move.to as ChessSquare,
        fen: this.chess.fen(),
      });

      this.notifyStateChange();

      if (this.chess.isGameOver()) {
        this.notifyGameEnd();
        return true;
      }

      await this.makeBotMove();
      return true;
    } catch {
      return false;
    }
  }

  private async makeBotMove(): Promise<void> {
    if (this.chess.isGameOver()) return;

    this.callbacks.onBotMoveStart?.();

    const botMove = await this.engine.getBestMove(this.chess.fen());

    if (!botMove) return;

    try {
      const move = this.chess.move(botMove.move);
      if (!move) return;

      this.moveHistory.push({
        san: move.san,
        from: move.from as ChessSquare,
        to: move.to as ChessSquare,
        fen: this.chess.fen(),
      });

      this.callbacks.onBotMove?.(botMove);
      this.notifyStateChange();

      if (this.chess.isGameOver()) {
        this.notifyGameEnd();
      }
    } catch {
      // Invalid move from bot
    }
  }

  private getResult(): GameResult {
    if (!this.chess.isGameOver()) return 'in_progress';

    if (this.chess.isCheckmate()) {
      return this.chess.turn() === 'w' ? 'black_wins' : 'white_wins';
    }

    return 'draw';
  }

  private getEndReason(): GameEndReason {
    if (!this.chess.isGameOver()) return null;

    if (this.chess.isCheckmate()) return 'checkmate';
    if (this.chess.isStalemate()) return 'stalemate';
    if (this.chess.isInsufficientMaterial()) return 'insufficient_material';
    if (this.chess.isThreefoldRepetition()) return 'threefold_repetition';
    if (this.chess.isDraw()) return 'fifty_moves';

    return null;
  }

  private notifyStateChange(): void {
    this.callbacks.onStateChange?.(this.getState());
  }

  private notifyGameEnd(): void {
    this.callbacks.onGameEnd?.(this.getResult(), this.getEndReason());
  }

  resign(): void {
    this.callbacks.onGameEnd?.(
      this.playerColor === 'w' ? 'black_wins' : 'white_wins',
      'resignation'
    );
  }

  reset(): void {
    this.chess.reset();
    this.moveHistory = [];
    this.notifyStateChange();
  }

  getPGN(): string {
    return this.chess.pgn();
  }

  getFEN(): string {
    return this.chess.fen();
  }

  destroy(): void {
    this.engine.stop();
  }
}

export function createGameManager(
  playerColor: ChessColor,
  botLevel: number,
  difficulty: BotDifficulty,
  callbacks?: GameCallbacks
): ChessGameManager {
  return new ChessGameManager(playerColor, botLevel, difficulty, callbacks);
}
