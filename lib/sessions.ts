/**
 * Session management utilities
 */

import { logger } from '@/hooks/logger';

// In-memory session storage
// In a production environment, this should be replaced with a proper database
interface Session {
  id: string;
  clientId: string;
  createdAt: Date;
  lastActiveAt: Date;
  data: Record<string, any>;
}

// Session storage
const sessions: Record<string, Session> = {};

// Session expiry time in minutes (default: 30 minutes)
const SESSION_EXPIRY_MINUTES = parseInt(process.env.SESSION_EXPIRY_MINUTES || '30', 10);

/**
 * Creates a new session
 * @param sessionId The session ID
 * @param clientId The client ID
 * @param data Additional session data
 * @returns The created session
 */
export function createSession(sessionId: string, clientId: string, data: Record<string, any> = {}): Session {
  const now = new Date();
  const session: Session = {
    id: sessionId,
    clientId,
    createdAt: now,
    lastActiveAt: now,
    data
  };
  
  sessions[sessionId] = session;
  logger.log('Session created', { sessionId, clientId });
  
  return session;
}

/**
 * Gets a session by ID
 * @param sessionId The session ID
 * @returns The session, or null if not found
 */
export function getSession(sessionId: string): Session | null {
  const session = sessions[sessionId];
  
  if (!session) {
    return null;
  }
  
  // Check if the session has expired
  const now = new Date();
  const expiryTime = new Date(session.lastActiveAt);
  expiryTime.setMinutes(expiryTime.getMinutes() + SESSION_EXPIRY_MINUTES);
  
  if (now > expiryTime) {
    // Session has expired
    deleteSession(sessionId);
    return null;
  }
  
  // Update last active time
  session.lastActiveAt = now;
  
  return session;
}

/**
 * Updates a session
 * @param sessionId The session ID
 * @param data The data to update
 * @returns The updated session, or null if not found
 */
export function updateSession(sessionId: string, data: Record<string, any>): Session | null {
  const session = getSession(sessionId);
  
  if (!session) {
    return null;
  }
  
  // Update session data
  session.data = { ...session.data, ...data };
  
  return session;
}

/**
 * Deletes a session
 * @param sessionId The session ID
 * @returns Whether the session was deleted
 */
export function deleteSession(sessionId: string): boolean {
  if (sessions[sessionId]) {
    delete sessions[sessionId];
    logger.log('Session deleted', { sessionId });
    return true;
  }
  
  return false;
}

/**
 * Cleans up expired sessions
 */
export function cleanupExpiredSessions(): void {
  const now = new Date();
  
  Object.keys(sessions).forEach(sessionId => {
    const session = sessions[sessionId];
    const expiryTime = new Date(session.lastActiveAt);
    expiryTime.setMinutes(expiryTime.getMinutes() + SESSION_EXPIRY_MINUTES);
    
    if (now > expiryTime) {
      deleteSession(sessionId);
    }
  });
}

// Run session cleanup every 5 minutes
if (typeof window === 'undefined') {
  setInterval(cleanupExpiredSessions, 5 * 60 * 1000);
} 