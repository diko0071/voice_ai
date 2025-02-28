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
  const textLogsDir = path.join(logsDir, 'text-logs');
  
  if (!fs.existsSync(logsDir)) {
    fs.mkdirSync(logsDir);
  }
  
  if (!fs.existsSync(textLogsDir)) {
    fs.mkdirSync(textLogsDir);
  }
  
  return textLogsDir;
};

// Ensure date-based directory exists
const ensureDateDirectory = () => {
  const textLogsDir = ensureLogDirectory();
  const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format
  const dateDir = path.join(textLogsDir, today);
  
  if (!fs.existsSync(dateDir)) {
    fs.mkdirSync(dateDir);
  }
  
  return dateDir;
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
    
    // Ensure date-based directory exists
    const dateDir = ensureDateDirectory();
    console.log(`[voice/text-log] Ensured date directory exists: ${dateDir}`);
    
    // Create session-based filename
    const filePath = path.join(dateDir, `${sessionId}.json`);
    console.log(`[voice/text-log] Log file path: ${filePath}`);
    
    // Check if file exists and append to it, or create new file
    let existingData: TextLogData[] = [];
    if (fs.existsSync(filePath)) {
      console.log(`[voice/text-log] Log file exists, reading existing data`);
      try {
        const fileContent = fs.readFileSync(filePath, 'utf8');
        existingData = JSON.parse(fileContent);
        console.log(`[voice/text-log] Successfully read existing data, entries: ${existingData.length}`);
        
        if (!Array.isArray(existingData)) {
          console.log(`[voice/text-log] Existing data is not an array, converting to array`);
          existingData = [existingData]; // Convert to array if it's a single object
        }
      } catch (error) {
        console.error(`[voice/text-log] Error reading existing log file: ${filePath}`, error);
        existingData = [];
      }
    } else {
      console.log(`[voice/text-log] Log file does not exist, creating new file`);
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