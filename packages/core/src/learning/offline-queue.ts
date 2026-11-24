export interface AttemptEvent {
  clientId: string;
  childId: string;
  exerciseTypeId: string;
  skillCode: string;
  payload: Record<string, unknown>;
  answer: unknown;
  correct: boolean;
  responseMs: number;
  hintsUsed: number;
  occurredAt: string;
}

export class OfflineQueue {
  private readonly items = new Map<string, AttemptEvent>();

  enqueue(event: AttemptEvent): void {
    if (this.items.has(event.clientId)) return; // idempotent
    this.items.set(event.clientId, event);
  }

  peek(): AttemptEvent[] {
    return Array.from(this.items.values());
  }

  dequeue(clientId: string): void {
    this.items.delete(clientId);
  }

  dequeueAll(): AttemptEvent[] {
    const all = this.peek();
    this.items.clear();
    return all;
  }

  size(): number {
    return this.items.size;
  }

  has(clientId: string): boolean {
    return this.items.has(clientId);
  }
}
