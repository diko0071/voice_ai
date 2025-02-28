import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function POST(request: Request) {
  try {
    const { role, content, timestamp, sessionId } = await request.json();
    
    if (!role || !content) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }
    
    // Create logs directory structure if it doesn't exist
    const baseDir = path.join(process.cwd(), 'logs', 'text-logs');
    if (!fs.existsSync(baseDir)) {
      fs.mkdirSync(baseDir, { recursive: true });
    }
    
    // Create a directory for the current date
    const now = new Date();
    const dateStr = now.toISOString().split('T')[0]; // YYYY-MM-DD
    const dateDir = path.join(baseDir, dateStr);
    if (!fs.existsSync(dateDir)) {
      fs.mkdirSync(dateDir, { recursive: true });
    }
    
    // Use session ID for the filename, or generate a unique ID if not provided
    const id = sessionId || `session_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    const logFile = path.join(dateDir, `${id}.json`);
    
    // Create or append to the log file
    let logData = [];
    if (fs.existsSync(logFile)) {
      const fileContent = fs.readFileSync(logFile, 'utf-8');
      try {
        logData = JSON.parse(fileContent);
      } catch (e) {
        console.error('Error parsing existing log file:', e);
      }
    }
    
    // Add the new message
    logData.push({
      role,
      content,
      timestamp: timestamp || new Date().toISOString()
    });
    
    // Write the updated log data
    fs.writeFileSync(logFile, JSON.stringify(logData, null, 2));
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error logging text:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 