import { create } from 'zustand';
import type { MissionCard, MissionResult } from '@saya/core';
import { OfflineQueue } from '@saya/core';
import type { AttemptEvent } from '@saya/core';

export interface ActiveAttempt {
  card: MissionCard;
  startedAt: number;
  answer: string | null;
  correct: boolean | null;
  selfCorrected: boolean;
}

interface LearningState {
  missionCards: MissionCard[];
  currentIndex: number;
  attempts: ActiveAttempt[];
  comboStreak: number;
  comboMax: number;
  missionResult: MissionResult | null;
  offlineQueue: OfflineQueue;

  startMission: (cards: MissionCard[]) => void;
  submitAnswer: (answer: string, correct: boolean, responseMs: number) => void;
  selfCorrect: () => void;
  nextCard: () => void;
  finishMission: (result: MissionResult) => void;
  resetMission: () => void;
  enqueueAttempt: (event: AttemptEvent) => void;
  flushQueue: () => AttemptEvent[];
}

export const useLearningStore = create<LearningState>((set, get) => ({
  missionCards: [],
  currentIndex: 0,
  attempts: [],
  comboStreak: 0,
  comboMax: 0,
  missionResult: null,
  offlineQueue: new OfflineQueue(),

  startMission: (cards) =>
    set({
      missionCards: cards,
      currentIndex: 0,
      attempts: [],
      comboStreak: 0,
      comboMax: 0,
      missionResult: null,
    }),

  submitAnswer: (answer, correct, _responseMs) => {
    set((state) => {
      const card = state.missionCards[state.currentIndex];
      if (!card) return state;

      const attempt: ActiveAttempt = {
        card,
        startedAt: Date.now() - _responseMs,
        answer,
        correct,
        selfCorrected: false,
      };

      const newStreak = correct ? state.comboStreak + 1 : 0;
      const newMax = Math.max(state.comboMax, newStreak);

      return {
        attempts: [...state.attempts, attempt],
        comboStreak: newStreak,
        comboMax: newMax,
      };
    });
  },

  selfCorrect: () => {
    set((state) => {
      const attempts = [...state.attempts];
      const last = attempts[attempts.length - 1];
      if (!last || last.correct) return state;
      attempts[attempts.length - 1] = { ...last, correct: true, selfCorrected: true };
      const newStreak = state.comboStreak + 1;
      return { attempts, comboStreak: newStreak, comboMax: Math.max(state.comboMax, newStreak) };
    });
  },

  nextCard: () => set((state) => ({ currentIndex: state.currentIndex + 1 })),

  finishMission: (result) => set({ missionResult: result }),

  resetMission: () =>
    set({
      missionCards: [],
      currentIndex: 0,
      attempts: [],
      comboStreak: 0,
      comboMax: 0,
      missionResult: null,
    }),

  enqueueAttempt: (event) => {
    get().offlineQueue.enqueue(event);
  },

  flushQueue: () => get().offlineQueue.dequeueAll(),
}));
