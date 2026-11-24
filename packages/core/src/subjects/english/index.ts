import { exerciseRegistry } from '../../learning/exercise-registry';
import { wordMatchPlugin, spellItPlugin, listenMatchPlugin } from './words';

let registered = false;

export function registerEnglishPlugins(): void {
  if (registered) return;
  exerciseRegistry.register(wordMatchPlugin);
  exerciseRegistry.register(spellItPlugin);
  exerciseRegistry.register(listenMatchPlugin);
  registered = true;
}
