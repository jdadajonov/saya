import { exerciseRegistry } from './exercise-registry';
import type { ExercisePlugin, CheckResult } from './exercise-registry';

function makePlugin(typeId: string): ExercisePlugin {
  return {
    typeId,
    checkAnswer: (_payload, answer) => ({ correct: answer === 'ok', hintsUsed: 0 } as CheckResult),
    generateVariants: (payload, count) => Array.from({ length: count }, () => ({ ...payload })),
  };
}

describe('ExerciseRegistry', () => {
  const uid = () => `test-${Math.random().toString(36).slice(2)}`;

  it('registers and retrieves a plugin', () => {
    const id = uid();
    const plugin = makePlugin(id);
    exerciseRegistry.register(plugin);
    expect(exerciseRegistry.get(id)).toBe(plugin);
  });

  it('has() returns true after registration', () => {
    const id = uid();
    exerciseRegistry.register(makePlugin(id));
    expect(exerciseRegistry.has(id)).toBe(true);
  });

  it('has() returns false for unknown type', () => {
    expect(exerciseRegistry.has('totally-unknown-xyz')).toBe(false);
  });

  it('throws on duplicate registration', () => {
    const id = uid();
    exerciseRegistry.register(makePlugin(id));
    expect(() => exerciseRegistry.register(makePlugin(id))).toThrow(
      `Exercise type "${id}" already registered`,
    );
  });

  it('throws on get for unknown type', () => {
    expect(() => exerciseRegistry.get('no-such-type')).toThrow('Unknown exercise type');
  });

  it('registeredTypes() includes registered id', () => {
    const id = uid();
    exerciseRegistry.register(makePlugin(id));
    expect(exerciseRegistry.registeredTypes()).toContain(id);
  });

  it('plugin checkAnswer works correctly', () => {
    const id = uid();
    const plugin = makePlugin(id);
    exerciseRegistry.register(plugin);
    expect(exerciseRegistry.get(id).checkAnswer({}, 'ok').correct).toBe(true);
    expect(exerciseRegistry.get(id).checkAnswer({}, 'no').correct).toBe(false);
  });

  it('plugin generateVariants returns correct count', () => {
    const id = uid();
    const plugin = makePlugin(id);
    exerciseRegistry.register(plugin);
    const variants = exerciseRegistry.get(id).generateVariants({ q: 1 }, 3);
    expect(variants).toHaveLength(3);
  });
});
