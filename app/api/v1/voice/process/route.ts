import { NextRequest, NextResponse } from 'next/server';
import { validateClient } from '@/lib/security';
import { OpenAIWebRTCSession } from '@/lib/openai-webrtc';
import { sessionExists } from '@/lib/sessions';
import { logger } from '@/lib/logger';
import { getStorage, StorageType } from '@/lib/storage';

export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    // Получаем только базовые данные от клиента, все остальное берем из локальных источников
    const { clientId, sessionId, offer, voice } = data;
    
    // Validate client
    const isClientValid = validateClient(clientId, request.headers.get('referer') || '');
    if (!isClientValid) {
      return NextResponse.json({ error: 'Invalid client ID or referer' }, { status: 403 });
    }

    const openaiKey = process.env.NEXT_PUBLIC_OPENAI_API_KEY;
    if (!openaiKey) {
      logger.error('OpenAI API key not found');
      return NextResponse.json({ error: 'OpenAI API key not found' }, { status: 500 });
    }
    
    // Check if session exists
    if (sessionId && !(await sessionExists(sessionId))) {
      logger.log('Session not found, suggesting new session creation', { sessionId });
      return NextResponse.json({ 
        error: 'Session not found. Please create a new one.',
        newSessionId: null 
      }, { status: 404 });
    }
    
    logger.log('Using builtin agent instructions from OpenAIWebRTCSession');
    
    // Загружаем историю сообщений напрямую из хранилища, без связи с клиентом
    let messageHistory: any[] = [];
    if (sessionId) {
      try {
        // Получаем сообщения из базы данных
        const storage = getStorage(StorageType.SUPABASE);
        const sessionMessages = await storage.getSessionMessages(sessionId);
        
        if (sessionMessages && sessionMessages.length > 0) {
          messageHistory = sessionMessages.map(message => {
            // Преобразуем сообщения с ошибками в сообщения от ассистента
            if (message.type === 'error') {
              return {
                ...message,
                type: 'assistant',
                text: `Error: ${message.text}`
              };
            }
            return message;
          });
          
          const userMessages = messageHistory.filter(m => m.type === 'user').length;
          const assistantMessages = messageHistory.filter(m => m.type === 'assistant').length;
          
          logger.log('Loaded message history from database', { 
            sessionId, 
            total: messageHistory.length,
            user: userMessages,
            assistant: assistantMessages
          });
        } else {
          logger.log('No message history found for session', { sessionId });
        }
      } catch (error) {
        logger.error('Error loading session messages', { sessionId, error });
      }
    }
    
    logger.log('Creating WebRTC session with local data', {
      sessionId,
      messageHistoryCount: messageHistory.length
    });
    
    const session = new OpenAIWebRTCSession(
      openaiKey, 
      sessionId, 
      clientId, 
      voice || 'alloy',
      messageHistory
    );
    
    // Обрабатываем предложение и получаем ответ
    const answer = await session.processOffer(offer);
    
    // Возвращаем клиенту только необходимый ответ
    return NextResponse.json({ answer });
    
  } catch (error: any) {
    logger.error('Error processing voice request', { error });
    return NextResponse.json(
      { error: error.message || 'Error processing voice request' },
      { status: 500 }
    );
  }
} 