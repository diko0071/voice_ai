import { supabase } from '../supabase';
import { logger } from '../logger';

// Интерфейс для данных текстового лога
export interface TextLogData {
  sessionId: string;
  clientId: string;
  timestamp: number;
  type: 'user' | 'assistant' | 'error';
  text: string;
  isTranscription?: boolean;
  source?: string;
}

/**
 * Сервис для хранения логов в Supabase
 */
export class SupabaseStorage {
  /**
   * Сохраняет текстовый лог в Supabase
   */
  async saveTextLog(logData: TextLogData): Promise<void> {
    try {
      // Преобразуем данные в формат Supabase
      const { sessionId, clientId, timestamp, type, text, isTranscription, source } = logData;
      
      // Вставляем запись в таблицу text_logs
      const { error } = await supabase
        .from('text_logs')
        .insert({
          session_id: sessionId,
          client_id: clientId,
          timestamp,
          type,
          text,
          is_transcription: isTranscription || null,
          source: source || null
        });
      
      if (error) {
        throw error;
      }
      
      logger.log('Text log saved to Supabase', { 
        sessionId, 
        clientId,
        type,
        entriesCount: 1,
        isTranscription
      });
      
      console.log(`[voice/text-log] Text log saved to Supabase, sessionId: ${sessionId}${isTranscription ? ', transcription saved' : ''}`);
    } catch (error) {
      console.error('[voice/text-log] Error saving text log to Supabase:', error);
      throw error;
    }
  }
  
  /**
   * Получает все логи для указанной сессии
   */
  async getSessionLogs(sessionId: string): Promise<TextLogData[]> {
    try {
      const { data, error } = await supabase
        .from('text_logs')
        .select('*')
        .eq('session_id', sessionId)
        .order('timestamp', { ascending: true });
      
      if (error) {
        throw error;
      }
      
      // Преобразуем данные из формата Supabase в формат приложения
      return data.map(item => ({
        sessionId: item.session_id,
        clientId: item.client_id,
        timestamp: item.timestamp,
        type: item.type,
        text: item.text,
        isTranscription: item.is_transcription || undefined,
        source: item.source || undefined
      }));
    } catch (error) {
      console.error(`[voice/text-log] Error getting session logs from Supabase for sessionId: ${sessionId}`, error);
      throw error;
    }
  }
  
  /**
   * Получает количество логов для указанной сессии
   */
  async getSessionLogCount(sessionId: string): Promise<number> {
    try {
      const { count, error } = await supabase
        .from('text_logs')
        .select('*', { count: 'exact', head: true })
        .eq('session_id', sessionId);
      
      if (error) {
        throw error;
      }
      
      return count || 0;
    } catch (error) {
      console.error(`[voice/text-log] Error getting session log count from Supabase for sessionId: ${sessionId}`, error);
      return 0;
    }
  }
  
  /**
   * Удаляет все логи для указанной сессии
   */
  async deleteSessionLogs(sessionId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('text_logs')
        .delete()
        .eq('session_id', sessionId);
      
      if (error) {
        throw error;
      }
      
      logger.log('Session logs deleted from Supabase', { sessionId });
      console.log(`[voice/text-log] Session logs deleted from Supabase, sessionId: ${sessionId}`);
    } catch (error) {
      console.error(`[voice/text-log] Error deleting session logs from Supabase for sessionId: ${sessionId}`, error);
      throw error;
    }
  }

  /**
   * Получает историю сообщений для сессии, подходящую для восстановления контекста OpenAI
   * Возвращает все сообщения без преобразований
   */
  async getSessionMessages(sessionId: string): Promise<TextLogData[]> {
    try {
      console.log(`[storage] Getting session messages for OpenAI context, sessionId: ${sessionId}`);
      
      const { data, error } = await supabase
        .from('text_logs')
        .select('*')
        .eq('session_id', sessionId)
        .order('timestamp', { ascending: true });
      
      if (error) {
        console.error('[storage] Error getting session messages from Supabase', error);
        return [];
      }
      
      // Преобразуем данные из формата Supabase в формат приложения
      const messages = data.map(item => ({
        sessionId: item.session_id,
        clientId: item.client_id,
        timestamp: item.timestamp,
        type: item.type,
        text: item.text,
        isTranscription: item.is_transcription || undefined,
        source: item.source || undefined
      }));
      
      console.log(`[storage] Found ${messages.length} messages for context restoration, sessionId: ${sessionId}`);
      
      // Логируем количество сообщений каждого типа
      const userMessages = messages.filter(m => m.type === 'user').length;
      const assistantMessages = messages.filter(m => m.type === 'assistant').length;
      const errorMessages = messages.filter(m => m.type === 'error').length;
      
      console.log(`[storage] Message breakdown - User: ${userMessages}, Assistant: ${assistantMessages}, Error: ${errorMessages}`);
      
      return messages;
    } catch (error) {
      console.error(`[storage] Failed to get session messages for OpenAI context, sessionId: ${sessionId}`, error);
      return [];
    }
  }
} 