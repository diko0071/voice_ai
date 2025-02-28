import { NextResponse } from 'next/server';
import { validateClient } from '@/lib/security';
import { logger } from '@/lib/logger';
import fs from 'fs';
import path from 'path';

// Define the structure of the text log data
interface TextLogData {
  sessionId: string;
  clientId: string;
  timestamp: number;
  type: 'user' | 'assistant';
  text: string;
}

// Create logs directory if it doesn't exist
const ensureLogDirectory = () => {
  const logsDir = path.join(process.cwd(), 'logs');
  
  if (!fs.existsSync(logsDir)) {
    fs.mkdirSync(logsDir);
  }
  
  return logsDir;
};

// Find existing log file by session ID
const findExistingLogFile = (logsDir: string, sessionId: string): { filePath: string, data: TextLogData[] } | null => {
  try {
    // Check if directory exists
    if (!fs.existsSync(logsDir)) {
      return null;
    }
    
    // Read all files in the directory
    const files = fs.readdirSync(logsDir);
    
    // Look for files that end with _sessionId.json
    const sessionFilePattern = new RegExp(`_${sessionId}\\.json$`);
    const matchingFile = files.find(file => sessionFilePattern.test(file));
    
    if (matchingFile) {
      const filePath = path.join(logsDir, matchingFile);
      console.log(`[voice/text-log] Found existing log file for session: ${filePath}`);
      
      // Read the file content
      const fileContent = fs.readFileSync(filePath, 'utf8');
      let data = JSON.parse(fileContent);
      
      // Ensure data is an array
      if (!Array.isArray(data)) {
        data = [data];
      }
      
      return { filePath, data };
    }
    
    return null;
  } catch (error) {
    console.error(`[voice/text-log] Error finding existing log file:`, error);
    return null;
  }
};

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
    
    if (!type || (type !== 'user' && type !== 'assistant')) {
      console.log('[voice/text-log] Invalid type parameter:', type);
      return NextResponse.json(
        { error: 'Valid type (user or assistant) is required' },
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
      text
    };
    
    // Добавляем дополнительные поля, если это транскрипция
    if (isTranscription) {
      (logData as any).isTranscription = true;
    }
    
    console.log('[voice/text-log] Created log data object');
    
    // Ensure logs directory exists
    const logsDir = ensureLogDirectory();
    console.log(`[voice/text-log] Ensured logs directory exists: ${logsDir}`);
    
    // Try to find existing log file for this session
    let existingData: TextLogData[] = [];
    let filePath: string;
    
    const existingFile = findExistingLogFile(logsDir, sessionId);
    
    if (existingFile) {
      // Use existing file
      existingData = existingFile.data;
      filePath = existingFile.filePath;
    } else {
      // No existing file found, create a new one
      console.log(`[voice/text-log] No existing log file found, creating new file`);
      
      // Use current time for the filename
      const now = new Date();
      const dateTimeStr = now.toISOString()
        .replace('T', '_')
        .replace(/:/g, '-')
        .split('.')[0]; // Remove milliseconds
      
      // Create filename with date_time_sessionId format
      const fileName = `${dateTimeStr}_${sessionId}.json`;
      filePath = path.join(logsDir, fileName);
    }
    
    // Add new log entry
    existingData.push(logData);
    console.log(`[voice/text-log] Added new log entry, total entries: ${existingData.length}`);
    
    // Write log to file
    fs.writeFileSync(filePath, JSON.stringify(existingData, null, 2));
    console.log(`[voice/text-log] Wrote log data to file: ${filePath}`);
    
    // Log successful text logging
    logger.log('Text log saved', { 
      sessionId, 
      clientId,
      type,
      filePath,
      entriesCount: existingData.length,
      isTranscription: isTranscription || undefined
    });
    
    console.log(`[voice/text-log] Text log saved to ${filePath}, total entries: ${existingData.length}${isTranscription ? ', transcription saved' : ''}`);
    
    // Return success response
    return NextResponse.json({
      success: true,
      message: 'Text log saved successfully',
      entriesCount: existingData.length,
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