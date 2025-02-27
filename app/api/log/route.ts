import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const LOG_FILE = 'voice-ai-debug.log';

// Create log file if it doesn't exist
if (!fs.existsSync(LOG_FILE)) {
  fs.writeFileSync(LOG_FILE, '=== Voice AI Debug Log ===\n\n');
}

export async function POST(request: Request) {
  return NextResponse.redirect(new URL('/api/internal/log', request.url));
} 