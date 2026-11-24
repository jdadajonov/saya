// Types
export * from './types';

// Board utilities
export * from './board';

// Bot
export * from './bot/difficulty';
export * from './bot/engine-wrapper';
export * from './bot/smart-bot';
export * from './bot/game-manager';

// Exercise plugins
export { identifyPiecePlugin } from './exercises/identify-piece';
export { pieceMovementPlugin } from './exercises/piece-movement';
export { captureExercisePlugin } from './exercises/capture-exercise';
export { mateInOnePlugin } from './exercises/mate-in-one';
export { puzzlePlugin } from './exercises/puzzle';

// Registration
import { exerciseRegistry } from '../learning/exercise-registry';
import { identifyPiecePlugin } from './exercises/identify-piece';
import { pieceMovementPlugin } from './exercises/piece-movement';
import { captureExercisePlugin } from './exercises/capture-exercise';
import { mateInOnePlugin } from './exercises/mate-in-one';
import { puzzlePlugin } from './exercises/puzzle';

export function registerChessPlugins(): void {
  if (!exerciseRegistry.has('chess.identify')) {
    exerciseRegistry.register(identifyPiecePlugin);
  }
  if (!exerciseRegistry.has('chess.movement')) {
    exerciseRegistry.register(pieceMovementPlugin);
  }
  if (!exerciseRegistry.has('chess.capture')) {
    exerciseRegistry.register(captureExercisePlugin);
  }
  if (!exerciseRegistry.has('chess.mate1')) {
    exerciseRegistry.register(mateInOnePlugin);
  }
  if (!exerciseRegistry.has('chess.puzzle')) {
    exerciseRegistry.register(puzzlePlugin);
  }
}
