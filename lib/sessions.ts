/**
 * Session management utilities
 */

import { logger } from '@/lib/logger';
import { supabase } from './supabase';

interface Session {
  sessionId: string;
  clientId: string;
  createdAt: number;
  lastActive: number;
  metadata?: any;
}

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
export async function createSession(clientId: string): Promise<Session> {
  // Generate a unique session ID
  let sessionId = generateSessionId();
  
  // Create the session
  const now = Date.now();
  const session: Session = {
    sessionId,
    clientId,
    createdAt: now,
    lastActive: now
  };
  
  // Store the session in Supabase
  try {
    const { error } = await supabase
      .from('sessions')
      .insert({
        session_id: sessionId,
        client_id: clientId,
        last_active: now,
        metadata: {}
      });
    
    if (error) {
      logger.error('Error creating session in Supabase', error);
      console.error('Error creating session in Supabase', error);
      throw error;
    }
    
    logger.log('Session created in Supabase', { sessionId, clientId });
    console.log('Session created in Supabase', { sessionId, clientId });
  } catch (error) {
    logger.error('Failed to create session in Supabase', error);
    console.error('Failed to create session in Supabase', error);
    throw error;
  }
  
  return session;
}

/**
 * Get a session by ID
 */
export async function getSession(sessionId: string): Promise<Session | null> {
  try {
    // Get session from Supabase
    const { data, error } = await supabase
      .from('sessions')
      .select('*')
      .eq('session_id', sessionId)
      .single();
    
    if (error) {
      if (error.code === 'PGRST116') {
        // Not found error
        logger.log('Session not found in Supabase', { sessionId });
        console.log('Session not found in Supabase', { sessionId });
        return null;
      }
      
      logger.error('Error getting session from Supabase', error);
      console.error('Error getting session from Supabase', error);
      throw error;
    }
    
    if (!data) {
      logger.log('Session not found in Supabase', { sessionId });
      console.log('Session not found in Supabase', { sessionId });
      return null;
    }
    
    // Update last active time
    const now = Date.now();
    
    // Update Supabase record
    const { error: updateError } = await supabase
      .from('sessions')
      .update({
        last_active: now
      })
      .eq('session_id', sessionId);
    
    if (updateError) {
      logger.error('Error updating session last_active time in Supabase', updateError);
      console.error('Error updating session last_active time in Supabase', updateError);
      // Don't throw error here, just log it - we still want to return the session
    }
    
    // Convert from Supabase format to our format
    const session: Session = {
      sessionId: data.session_id,
      clientId: data.client_id,
      createdAt: new Date(data.created_at).getTime(),
      lastActive: now, // Use the updated value
      metadata: data.metadata
    };
    
    logger.log('Session retrieved from Supabase', { sessionId, clientId: session.clientId });
    console.log('Session retrieved from Supabase', { sessionId, clientId: session.clientId });
    
    return session;
  } catch (error) {
    logger.error('Failed to get session from Supabase', error);
    console.error('Failed to get session from Supabase', error);
    return null;
  }
}

/**
 * Delete a session
 */
export async function deleteSession(sessionId: string): Promise<boolean> {
  try {
    // Delete the session from Supabase
    const { error } = await supabase
      .from('sessions')
      .delete()
      .eq('session_id', sessionId);
    
    if (error) {
      logger.error('Error deleting session from Supabase', error);
      console.error('Error deleting session from Supabase', error);
      return false;
    }
    
    logger.log('Session deleted from Supabase', { sessionId });
    console.log('Session deleted from Supabase', { sessionId });
    
    return true;
  } catch (error) {
    logger.error('Failed to delete session from Supabase', error);
    console.error('Failed to delete session from Supabase', error);
    return false;
  }
}

/**
 * Check if a session exists
 */
export async function sessionExists(sessionId: string): Promise<boolean> {
  try {
    const { count, error } = await supabase
      .from('sessions')
      .select('*', { count: 'exact', head: true })
      .eq('session_id', sessionId);
    
    if (error) {
      logger.error('Error checking if session exists in Supabase', error);
      console.error('Error checking if session exists in Supabase', error);
      return false;
    }
    
    return count !== null && count > 0;
  } catch (error) {
    logger.error('Failed to check if session exists in Supabase', error);
    console.error('Failed to check if session exists in Supabase', error);
    return false;
  }
}

/**
 * Get all active sessions
 */
export async function getAllSessions(): Promise<Session[]> {
  try {
    const { data, error } = await supabase
      .from('sessions')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) {
      logger.error('Error getting all sessions from Supabase', error);
      console.error('Error getting all sessions from Supabase', error);
      return [];
    }
    
    // Convert from Supabase format to our format
    return data.map(item => ({
      sessionId: item.session_id,
      clientId: item.client_id,
      createdAt: new Date(item.created_at).getTime(),
      lastActive: item.last_active,
      metadata: item.metadata
    }));
  } catch (error) {
    logger.error('Failed to get all sessions from Supabase', error);
    console.error('Failed to get all sessions from Supabase', error);
    return [];
  }
}

/**
 * Get session count
 */
export async function getSessionCount(): Promise<number> {
  try {
    const { count, error } = await supabase
      .from('sessions')
      .select('*', { count: 'exact', head: true });
    
    if (error) {
      logger.error('Error getting session count from Supabase', error);
      console.error('Error getting session count from Supabase', error);
      return 0;
    }
    
    return count || 0;
  } catch (error) {
    logger.error('Failed to get session count from Supabase', error);
    console.error('Failed to get session count from Supabase', error);
    return 0;
  }
} 