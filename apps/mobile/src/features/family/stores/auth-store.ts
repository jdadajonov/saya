import { create } from 'zustand';
import type { Session, User } from '@supabase/supabase-js';
import { supabase } from '../../../platform/supabase';

export interface Child {
  id: string;
  familyId: string;
  displayName: string;
  birthYear: number;
  ageBand: '7-9' | '10-13';
  avatarKey: string;
  avatarUrl?: string;
  gender?: 'boy' | 'girl';
}

export interface Family {
  id: string;
  name: string;
  locale: string;
  timezone: string;
}

export type AppMode = 'parent' | 'child';

interface AuthState {
  session: Session | null;
  user: User | null;
  family: Family | null;
  children: Child[];
  mode: AppMode;
  activeChildId: string | null;
  isLoading: boolean;

  setSession: (session: Session | null) => void;
  setFamily: (family: Family | null) => void;
  setChildren: (children: Child[]) => void;
  switchToChild: (childId: string) => void;
  switchToParent: () => void;
  signOut: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  session: null,
  user: null,
  family: null,
  children: [],
  mode: 'parent',
  activeChildId: null,
  isLoading: true,

  setSession: (session) =>
    set({ session, user: session?.user ?? null, isLoading: false }),

  setFamily: (family) => set({ family }),

  setChildren: (children) => set({ children }),

  switchToChild: (childId) =>
    set({ mode: 'child', activeChildId: childId }),

  switchToParent: () =>
    set({ mode: 'parent', activeChildId: null }),

  signOut: async () => {
    await supabase.auth.signOut();
    set({
      session: null,
      user: null,
      family: null,
      children: [],
      mode: 'parent',
      activeChildId: null,
    });
  },
}));
