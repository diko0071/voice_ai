import { TextLogData } from './supabase-storage';

/**
 * Интерфейс для провайдера хранилища
 */
export interface StorageProvider {
  /**
   * Сохраняет текстовый лог
   */
  saveTextLog(logData: TextLogData): Promise<void>;
  
  /**
   * Получает все логи для указанной сессии
   */
  getSessionLogs(sessionId: string): Promise<TextLogData[]>;
  
  /**
   * Получает количество логов для указанной сессии
   */
  getSessionLogCount(sessionId: string): Promise<number>;
  
  /**
   * Удаляет все логи для указанной сессии
   */
  deleteSessionLogs(sessionId: string): Promise<void>;
  
  /**
   * Получает историю сообщений для сессии, подходящую для восстановления контекста OpenAI
   */
  getSessionMessages(sessionId: string): Promise<TextLogData[]>;
} 