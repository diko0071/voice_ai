import { NextResponse } from 'next/server';
import fs from 'fs';

const LOG_FILE = 'voice-ai-debug.log';

// Create log file if it doesn't exist
if (!fs.existsSync(LOG_FILE)) {
  fs.writeFileSync(LOG_FILE, '=== Voice AI Debug Log ===\n\n');
}

export async function POST(req: Request) {
  try {
    // Проверяем, что запрос не пустой
    const text = await req.text();
    if (!text) {
      return NextResponse.json({ success: false, error: 'Empty request body' }, { status: 400 });
    }
    
    // Пытаемся распарсить JSON
    let message, data, type = 'info';
    try {
      const body = JSON.parse(text);
      message = body.message;
      data = body.data;
      type = body.type || 'info';
    } catch (parseError) {
      // Если не удалось распарсить JSON, используем текст запроса как сообщение
      message = `Failed to parse JSON: ${text}`;
      console.error('JSON parse error:', parseError);
    }
    
    // Проверяем, что сообщение существует
    if (!message) {
      return NextResponse.json({ success: false, error: 'Message is required' }, { status: 400 });
    }
    
    const timestamp = new Date().toISOString();
    const logMessage = `[${timestamp}] [${type}] ${message}${data ? '\nData: ' + JSON.stringify(data, null, 2) : ''}\n`;
    
    fs.appendFileSync(LOG_FILE, logMessage);
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error writing to log:', error);
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
  }
} 