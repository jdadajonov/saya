export type ExerciseTypeId = string;

export interface ExercisePayload {
  [key: string]: unknown;
}

export interface CheckResult {
  correct: boolean;
  hintsUsed: number;
  feedback?: string;
}

export interface ExercisePlugin<TPayload extends ExercisePayload = ExercisePayload> {
  typeId: ExerciseTypeId;
  checkAnswer(payload: TPayload, answer: unknown): CheckResult;
  generateVariants(payload: TPayload, count: number): TPayload[];
}

class ExerciseRegistry {
  private readonly plugins = new Map<ExerciseTypeId, ExercisePlugin>();

  register(plugin: ExercisePlugin): void {
    if (this.plugins.has(plugin.typeId)) {
      throw new Error(`Exercise type "${plugin.typeId}" already registered`);
    }
    this.plugins.set(plugin.typeId, plugin);
  }

  get(typeId: ExerciseTypeId): ExercisePlugin {
    const plugin = this.plugins.get(typeId);
    if (!plugin) throw new Error(`Unknown exercise type: "${typeId}"`);
    return plugin;
  }

  has(typeId: ExerciseTypeId): boolean {
    return this.plugins.has(typeId);
  }

  registeredTypes(): ExerciseTypeId[] {
    return Array.from(this.plugins.keys());
  }
}

export const exerciseRegistry = new ExerciseRegistry();
