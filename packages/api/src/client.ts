import { createClient } from '@supabase/supabase-js';
import type { Database } from './schemas/index.js';

export function createSupabaseClient(url: string, anonKey: string) {
  return createClient<Database>(url, anonKey, {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
    },
  });
}

export type SupabaseClient = ReturnType<typeof createSupabaseClient>;
