import { registerMultiplicationPlugin } from './index';
import { exerciseRegistry } from '../../learning/exercise-registry';
import { MULTIPLICATION_TYPE_ID } from './generator';

describe('registerMultiplicationPlugin', () => {
  it('registers the plugin so exerciseRegistry.has() returns true', () => {
    registerMultiplicationPlugin();
    expect(exerciseRegistry.has(MULTIPLICATION_TYPE_ID)).toBe(true);
  });

  it('is idempotent: calling twice does not throw', () => {
    expect(() => {
      registerMultiplicationPlugin();
      registerMultiplicationPlugin();
    }).not.toThrow();
  });

  it('registered plugin checks answers correctly via registry', () => {
    registerMultiplicationPlugin();
    const plugin = exerciseRegistry.get(MULTIPLICATION_TYPE_ID);
    expect(plugin.checkAnswer({ a: 3, b: 4, answer: 12 }, 12).correct).toBe(true);
    expect(plugin.checkAnswer({ a: 3, b: 4, answer: 12 }, 99).correct).toBe(false);
  });
});
