import { NextResponse } from 'next/server';
import { validateClient } from '@/lib/security';
import { logger } from '@/lib/logger';
import { getStorage, StorageType, TextLogData } from '@/lib/storage';

export async function GET(request: Request) {
  try {
    // Get sessionId from query parameters
    const url = new URL(request.url);
    const sessionId = url.searchParams.get('sessionId');
    const clientId = url.searchParams.get('clientId');
    
    console.log(`[voice/text-log] Received request to get logs: sessionId=${sessionId}, clientId=${clientId}`);
    
    if (!sessionId) {
      console.log('[voice/text-log] Missing sessionId parameter');
      return NextResponse.json(
        { error: 'Session ID is required' },
        { status: 400 }
      );
    }
    
    if (!clientId) {
      console.log('[voice/text-log] Missing clientId parameter');
      return NextResponse.json(
        { error: 'Client ID is required' },
        { status: 400 }
      );
    }
    
    // Get referer from request headers
    const referer = request.headers.get('referer') || '';
    console.log(`[voice/text-log] Request referer: ${referer}`);
    
    // Validate client
    console.log(`[voice/text-log] Validating client: clientId=${clientId}, referer=${referer}`);
    
    // Special case for test_client - allow without validation
    const isTestClient = clientId === 'test_client' || clientId === 'demo_client';
    let isClientValid = isTestClient;
    
    if (!isTestClient) {
      isClientValid = validateClient(clientId, referer);
    }
    
    console.log(`[voice/text-log] Client validation result: ${isClientValid}${isTestClient ? ' (test client)' : ''}`);
    
    if (!isClientValid) {
      console.log(`[voice/text-log] Client validation failed: clientId=${clientId}, referer=${referer}`);
      return NextResponse.json(
        { error: 'Invalid client ID or referer' },
        { status: 403 }
      );
    }
    
    // Get storage
    const storage = getStorage(StorageType.SUPABASE);
    
    // Get session logs
    const logs = await storage.getSessionLogs(sessionId);
    
    if (logs.length === 0) {
      console.log(`[voice/text-log] No logs found for session: ${sessionId}`);
      return NextResponse.json(
        { error: 'No logs found for this session' },
        { status: 404 }
      );
    }
    
    console.log(`[voice/text-log] Retrieved ${logs.length} logs for session: ${sessionId}`);
    
    // Return logs
    return NextResponse.json({
      success: true,
      sessionId,
      clientId,
      logs,
      count: logs.length
    });
    
  } catch (error) {
    console.error('[voice/text-log] Error retrieving session logs', error);
    
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    console.log('[voice/text-log] Received text log request');
    
    // Get request body
    const body = await request.json();
    
    // Log the full request body for debugging
    console.log('[voice/text-log] Full request body:', JSON.stringify(body, null, 2));
    
    const { clientId, sessionId, type, text } = body;
    
    console.log(`[voice/text-log] Request data: clientId=${clientId}, sessionId=${sessionId}, type=${type}, text length=${text?.length || 0}`);
    
    // Проверяем, является ли текст транскрипцией аудио
    const isTranscription = text && (
      text.includes('\n') || // Часто транскрипции заканчиваются переносом строки
      body.isTranscription || // Дополнительное поле, которое можно добавить в SDK
      (body.source === 'audio_transcription') // Еще одно возможное поле
    );
    
    if (isTranscription) {
      console.log(`[voice/text-log] Detected audio transcription: "${text}"`);
    }
    
    // Validate required parameters - only check if they exist, no validation of values
    if (!clientId) {
      console.log('[voice/text-log] Missing clientId parameter');
      return NextResponse.json(
        { error: 'Client ID is required' },
        { status: 400 }
      );
    }
    
    if (!sessionId) {
      console.log('[voice/text-log] Missing sessionId parameter');
      return NextResponse.json(
        { error: 'Session ID is required' },
        { status: 400 }
      );
    }
    
    if (!type || (type !== 'user' && type !== 'assistant' && type !== 'error')) {
      console.log('[voice/text-log] Invalid type parameter:', type);
      return NextResponse.json(
        { error: 'Valid type (user, assistant, or error) is required' },
        { status: 400 }
      );
    }
    
    if (!text) {
      console.log('[voice/text-log] Missing text parameter');
      return NextResponse.json(
        { error: 'Text content is required' },
        { status: 400 }
      );
    }
    
    // Log the text content for debugging
    console.log(`[voice/text-log] Text content: "${text.substring(0, 100)}${text.length > 100 ? '...' : ''}"`);
    
    // Get all request headers for debugging
    const headers: Record<string, string> = {};
    request.headers.forEach((value, key) => {
      headers[key] = value;
    });
    console.log('[voice/text-log] Request headers:', JSON.stringify(headers, null, 2));
    
    // Get referer from request headers
    const referer = request.headers.get('referer') || '';
    console.log(`[voice/text-log] Request referer: ${referer}`);
    
    // Validate client
    console.log(`[voice/text-log] Validating client: clientId=${clientId}, referer=${referer}`);
    
    // Special case for test_client - allow without validation
    const isTestClient = clientId === 'test_client' || clientId === 'demo_client';
    let isClientValid = isTestClient;
    
    if (!isTestClient) {
      isClientValid = validateClient(clientId, referer);
    }
    
    console.log(`[voice/text-log] Client validation result: ${isClientValid}${isTestClient ? ' (test client)' : ''}`);
    
    if (!isClientValid) {
      console.log(`[voice/text-log] Client validation failed: clientId=${clientId}, referer=${referer}`);
      return NextResponse.json(
        { error: 'Invalid client ID or referer' },
        { status: 403 }
      );
    }
    
    // Create log data
    const logData: TextLogData = {
      sessionId,
      clientId,
      timestamp: Date.now(),
      type,
      text,
      isTranscription: isTranscription || undefined,
      source: body.source
    };
    
    console.log('[voice/text-log] Created log data object');
    
    // Получаем хранилище
    const storage = getStorage(StorageType.SUPABASE);
    
    // Сохраняем лог в Supabase
    await storage.saveTextLog(logData);
    
    // Получаем количество логов для этой сессии
    const entriesCount = await storage.getSessionLogCount(sessionId);
    
    // Return success response
    return NextResponse.json({
      success: true,
      message: 'Text log saved successfully',
      entriesCount,
      isTranscription: isTranscription || undefined
    });
    
  } catch (error) {
    console.error('[voice/text-log] Error processing text log request', error);
    
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 