/**
 * Session management utilities
 */

import { logger } from '@/lib/logger';

interface Session {
  sessionId: string;
  clientId: string;
  createdAt: number;
  lastActive: number;
}

// In-memory session store
const sessions: Record<string, Session> = {};

// Session expiry time in milliseconds (30 minutes by default)
const SESSION_EXPIRY_MS = parseInt(process.env.SESSION_EXPIRY_MINUTES || '60') * 60 * 1000;

/**
 * Generate a random session ID
 */
function generateSessionId(): string {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < 20; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

/**
 * Create a new session
 */
export function createSession(clientId: string): Session {
  // Generate a unique session ID
  let sessionId = generateSessionId();
  
  // Ensure the session ID is unique
  while (sessions[sessionId]) {
    sessionId = generateSessionId();
  }
  
  // Create the session
  const now = Date.now();
  const session: Session = {
    sessionId,
    clientId,
    createdAt: now,
    lastActive: now
  };
  
  // Store the session
  sessions[sessionId] = session;
  
  logger.log('Session created', { sessionId, clientId });
  console.log('Session created', { sessionId, clientId });
  
  return session;
}

/**
 * Get a session by ID
 */
export function getSession(sessionId: string): Session | null {
  const session = sessions[sessionId];
  
  if (!session) {
    logger.log('Session not found', { sessionId });
    console.log('Session not found', { sessionId });
    return null;
  }
  
  // Check if the session has expired
  const now = Date.now();
  if (now - session.lastActive > SESSION_EXPIRY_MS) {
    // Session has expired, delete it
    deleteSession(sessionId);
    logger.log('Session expired', { sessionId });
    console.log('Session expired', { sessionId });
    return null;
  }
  
  // Update last active time
  session.lastActive = now;
  
  logger.log('Session retrieved', { sessionId, clientId: session.clientId });
  console.log('Session retrieved', { sessionId, clientId: session.clientId });
  
  return session;
}

/**
 * Delete a session
 */
export function deleteSession(sessionId: string): boolean {
  if (!sessions[sessionId]) {
    return false;
  }
  
  const clientId = sessions[sessionId].clientId;
  
  // Delete the session
  delete sessions[sessionId];
  
  logger.log('Session deleted', { sessionId, clientId });
  console.log('Session deleted', { sessionId, clientId });
  
  return true;
}

/**
 * Clean up expired sessions
 */
export function cleanupExpiredSessions(): void {
  const now = Date.now();
  let expiredCount = 0;
  
  Object.keys(sessions).forEach(sessionId => {
    const session = sessions[sessionId];
    if (now - session.lastActive > SESSION_EXPIRY_MS) {
      deleteSession(sessionId);
      expiredCount++;
    }
  });
  
  if (expiredCount > 0) {
    logger.log('Expired sessions cleaned up', { count: expiredCount });
    console.log('Expired sessions cleaned up', { count: expiredCount });
  }
}

/**
 * Check if a session exists
 */
export function sessionExists(sessionId: string): boolean {
  return !!sessions[sessionId];
}

/**
 * Get all active sessions
 */
export function getAllSessions(): Session[] {
  return Object.values(sessions);
}

/**
 * Get session count
 */
export function getSessionCount(): number {
  return Object.keys(sessions).length;
}

// Clean up expired sessions every 5 minutes
// Use .unref() to prevent the timer from keeping the Node.js process alive during tests
setInterval(cleanupExpiredSessions, 5 * 60 * 1000).unref(); 