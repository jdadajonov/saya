export type Json = string | number | boolean | null | { [key: string]: Json } | Json[];

export interface Database {
  public: {
    Tables: {
      families: {
        Row: {
          id: string;
          name: string;
          locale: 'ru' | 'uz' | 'en';
          timezone: string;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['families']['Row'], 'id' | 'created_at' | 'updated_at'> & {
          id?: string;
        };
        Update: Partial<Database['public']['Tables']['families']['Insert']>;
      };
      members: {
        Row: {
          id: string;
          user_id: string;
          family_id: string;
          role: 'owner' | 'parent' | 'coach';
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['members']['Row'], 'id' | 'created_at' | 'updated_at'> & {
          id?: string;
        };
        Update: Partial<Database['public']['Tables']['members']['Insert']>;
      };
      children: {
        Row: {
          id: string;
          family_id: string;
          display_name: string;
          birth_year: number;
          avatar_key: string;
          age_band: '7-9' | '10-13';
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['children']['Row'], 'id' | 'created_at' | 'updated_at'> & {
          id?: string;
        };
        Update: Partial<Database['public']['Tables']['children']['Insert']>;
      };
      skill_states: {
        Row: {
          id: string;
          child_id: string;
          skill_id: string;
          mastery: number;
          stability: number;
          due_at: string;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['skill_states']['Row'], 'id' | 'created_at' | 'updated_at'> & {
          id?: string;
        };
        Update: Partial<Database['public']['Tables']['skill_states']['Insert']>;
      };
      attempts: {
        Row: {
          id: string;
          child_id: string;
          exercise_id: string;
          correct: boolean;
          response_ms: number | null;
          hints_used: number;
          client_id: string;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['attempts']['Row'], 'id' | 'created_at' | 'updated_at'> & {
          id?: string;
        };
        Update: Partial<Database['public']['Tables']['attempts']['Insert']>;
      };
      ledger_entries: {
        Row: {
          id: string;
          child_id: string;
          currency: 'xp' | 'coins';
          amount: number;
          reason: string;
          source_event_id: string;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['ledger_entries']['Row'], 'id' | 'created_at'> & {
          id?: string;
        };
        Update: never;
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: {
      locale: 'ru' | 'uz' | 'en';
      member_role: 'owner' | 'parent' | 'coach';
      age_band: '7-9' | '10-13';
      currency: 'xp' | 'coins';
    };
  };
}
