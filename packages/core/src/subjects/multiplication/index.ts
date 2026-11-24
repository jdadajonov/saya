import { exerciseRegistry } from '../../learning/exercise-registry';
import { multiplicationPlugin } from './generator';

let registered = false;

export function registerMultiplicationPlugin(): void {
  if (registered) return;
  exerciseRegistry.register(multiplicationPlugin);
  registered = true;
}
