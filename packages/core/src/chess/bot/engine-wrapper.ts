import type { BotDifficulty } from './difficulty';
import { getBestMove, getRandomMove, type BotMove } from './smart-bot';

export interface ChessEngine {
  init(): Promise<void>;
  setDifficulty(difficulty: BotDifficulty): void;
  getBestMove(fen: string): Promise<BotMove | null>;
  stop(): void;
  isReady(): boolean;
}

export class SmartBotEngine implements ChessEngine {
  private ready = false;
  private difficulty: BotDifficulty = { skillLevel: 1, depth: 2, moveTime: 200 };
  private calculating = false;

  async init(): Promise<void> {
    this.ready = true;
  }

  setDifficulty(difficulty: BotDifficulty): void {
    this.difficulty = difficulty;
  }

  async getBestMove(fen: string): Promise<BotMove | null> {
    if (!this.ready) {
      throw new Error('Engine not initialized');
    }

    if (this.calculating) {
      return null;
    }

    this.calculating = true;

    try {
      await this.simulateThinkingTime();
      const move = getBestMove(fen, this.difficulty);
      return move;
    } finally {
      this.calculating = false;
    }
  }

  stop(): void {
    this.calculating = false;
  }

  isReady(): boolean {
    return this.ready && !this.calculating;
  }

  private async simulateThinkingTime(): Promise<void> {
    const thinkTime = Math.min(
      this.difficulty.moveTime,
      200 + Math.random() * this.difficulty.moveTime
    );
    await new Promise((resolve) => setTimeout(resolve, thinkTime));
  }
}

export function createEngine(): ChessEngine {
  return new SmartBotEngine();
}

export { getBestMove, getRandomMove, type BotMove };
