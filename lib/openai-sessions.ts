import { OpenAIWebRTCSession } from './openai-webrtc';
import { logger } from '@/lib/logger';

interface OpenAISessionsStore {
  [sessionId: string]: {
    session: OpenAIWebRTCSession;
    lastActive: number;
  };
}

// In-memory session storage
const openAISessions: OpenAISessionsStore = {};

// Session expiry time in milliseconds (30 minutes by default)
const SESSION_EXPIRY_MS = 0.5 * 60 * 1000;

/**
 * Get an OpenAI session by ID
 */
export function getOpenAISession(sessionId: string): OpenAIWebRTCSession | null {
  const sessionData = openAISessions[sessionId];
  
  if (!sessionData) {
    return null;
  }
  
  // Check if the session has expired
  const now = Date.now();
  if (now - sessionData.lastActive > SESSION_EXPIRY_MS) {
    // Session has expired, delete it
    deleteOpenAISession(sessionId);
    return null;
  }
  
  // Update last active time
  sessionData.lastActive = now;
  
  return sessionData.session;
}

/**
 * Create a new OpenAI session
 */
export async function createOpenAISession(
  sessionId: string, 
  clientId: string, 
  voice: string = 'alloy'
): Promise<OpenAIWebRTCSession> {
  // Get OpenAI API key
  const apiKey = process.env.NEXT_PUBLIC_OPENAI_API_KEY;
  
  if (!apiKey) {
    throw new Error('OpenAI API key not configured');
  }
  
  // Create new session
  const session = new OpenAIWebRTCSession(apiKey, sessionId, clientId, voice);
  
  // Initialize session
  const success = await session.initialize();
  
  if (!success) {
    throw new Error('Failed to initialize OpenAI session');
  }
  
  // Save session
  openAISessions[sessionId] = {
    session,
    lastActive: Date.now()
  };
  
  logger.log('OpenAI session created', { sessionId, clientId });
  
  return session;
}

/**
 * Delete an OpenAI session
 */
export function deleteOpenAISession(sessionId: string): boolean {
  const sessionData = openAISessions[sessionId];
  
  if (!sessionData) {
    return false;
  }
  
  // Close session
  sessionData.session.close();
  
  // Remove from storage
  delete openAISessions[sessionId];
  
  logger.log('OpenAI session deleted', { sessionId });
  
  return true;
}

/**
 * Clean up expired sessions
 */
export function cleanupExpiredSessions(): void {
  const now = Date.now();
  
  Object.keys(openAISessions).forEach(sessionId => {
    const sessionData = openAISessions[sessionId];
    
    if (now - sessionData.lastActive > SESSION_EXPIRY_MS) {
      deleteOpenAISession(sessionId);
    }
  });
}

// Run cleanup every 5 minutes
if (typeof window === 'undefined') {
  setInterval(cleanupExpiredSessions, 5 * 60 * 1000);
} 