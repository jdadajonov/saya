import { OfflineQueue } from './offline-queue';
import type { AttemptEvent } from './offline-queue';

function makeEvent(clientId: string, correct = true): AttemptEvent {
  return {
    clientId,
    childId: 'child-1',
    exerciseTypeId: 'multiplication.fill_blank',
    skillCode: 'math.mul.7',
    payload: { a: 7, b: 8, answer: 56 },
    answer: 56,
    correct,
    responseMs: 2000,
    hintsUsed: 0,
    occurredAt: new Date().toISOString(),
  };
}

describe('OfflineQueue', () => {
  it('enqueues and returns events via peek()', () => {
    const q = new OfflineQueue();
    q.enqueue(makeEvent('id-1'));
    expect(q.peek()).toHaveLength(1);
  });

  it('is idempotent: duplicate clientId not added twice', () => {
    const q = new OfflineQueue();
    q.enqueue(makeEvent('id-1'));
    q.enqueue(makeEvent('id-1'));
    expect(q.size()).toBe(1);
  });

  it('dequeue removes by clientId', () => {
    const q = new OfflineQueue();
    q.enqueue(makeEvent('id-1'));
    q.enqueue(makeEvent('id-2'));
    q.dequeue('id-1');
    expect(q.size()).toBe(1);
    expect(q.peek()[0]!.clientId).toBe('id-2');
  });

  it('dequeueAll returns all and clears queue', () => {
    const q = new OfflineQueue();
    q.enqueue(makeEvent('id-1'));
    q.enqueue(makeEvent('id-2'));
    const all = q.dequeueAll();
    expect(all).toHaveLength(2);
    expect(q.size()).toBe(0);
  });

  it('has() returns true for enqueued id', () => {
    const q = new OfflineQueue();
    q.enqueue(makeEvent('id-1'));
    expect(q.has('id-1')).toBe(true);
    expect(q.has('id-99')).toBe(false);
  });

  it('peek() does not remove items', () => {
    const q = new OfflineQueue();
    q.enqueue(makeEvent('id-1'));
    q.peek();
    expect(q.size()).toBe(1);
  });

  it('dequeue on unknown id is a no-op', () => {
    const q = new OfflineQueue();
    q.enqueue(makeEvent('id-1'));
    q.dequeue('nonexistent');
    expect(q.size()).toBe(1);
  });
});
