import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const LOG_FILE = 'voice-ai-debug.log';

// Create log file if it doesn't exist
if (!fs.existsSync(LOG_FILE)) {
  fs.writeFileSync(LOG_FILE, '=== Voice AI Debug Log ===\n\n');
}

export async function POST(req: Request) {
  try {
    const { message, data, type = 'info' } = await req.json();
    const timestamp = new Date().toISOString();
    const logMessage = `[${timestamp}] [${type}] ${message}${data ? '\nData: ' + JSON.stringify(data, null, 2) : ''}\n`;
    
    fs.appendFileSync(LOG_FILE, logMessage);
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error writing to log:', error);
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
  }
} 