import { createClient } from '@supabase/supabase-js';

// Типы для TypeScript
export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      text_logs: {
        Row: {
          id: number;
          session_id: string;
          client_id: string;
          timestamp: number;
          type: 'user' | 'assistant';
          text: string;
          is_transcription: boolean | null;
          source: string | null;
          created_at: string;
        };
        Insert: {
          id?: number;
          session_id: string;
          client_id: string;
          timestamp: number;
          type: 'user' | 'assistant';
          text: string;
          is_transcription?: boolean | null;
          source?: string | null;
          created_at?: string;
        };
        Update: {
          id?: number;
          session_id?: string;
          client_id?: string;
          timestamp?: number;
          type?: 'user' | 'assistant';
          text?: string;
          is_transcription?: boolean | null;
          source?: string | null;
          created_at?: string;
        };
      };
      sessions: {
        Row: {
          id: number;
          session_id: string;
          client_id: string;
          created_at: string;
          last_active: number;
          metadata: Json | null;
        };
        Insert: {
          id?: number;
          session_id: string;
          client_id: string;
          created_at?: string;
          last_active: number;
          metadata?: Json | null;
        };
        Update: {
          id?: number;
          session_id?: string;
          client_id?: string;
          created_at?: string;
          last_active?: number;
          metadata?: Json | null;
        };
      };
    };
  };
}

// Инициализация клиента Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

// Проверка наличия переменных окружения
if (!supabaseUrl || !supabaseKey) {
  console.warn('Supabase URL or key is missing. Database functionality will not work.');
}

export const supabase = createClient<Database>(supabaseUrl, supabaseKey); 