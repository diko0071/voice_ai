import { NextResponse } from 'next/server';
import { createSession, getSession, deleteSession, sessionExists, getAllSessions, getSessionCount } from '@/lib/sessions';
import { validateClient } from '@/lib/security';
import { logger } from '@/lib/logger';

/**
 * GET /api/v1/sessions
 * 
 * Get session information or validate a session
 */
export async function GET(request: Request) {
  try {
    // Get query parameters
    const url = new URL(request.url);
    const sessionId = url.searchParams.get('sessionId');
    
    // If sessionId is provided, validate the session
    if (sessionId) {
      logger.log('Session validation request', { sessionId });
      console.log('Session validation request', { sessionId });
      
      const session = getSession(sessionId);
      
      if (!session) {
        logger.log('Session validation failed - session not found', { sessionId });
        console.log('Session validation failed - session not found', { sessionId });
        
        return NextResponse.json(
          { valid: false, error: 'Session not found or expired' },
          { status: 404 }
        );
      }
      
      logger.log('Session validation successful', { sessionId, clientId: session.clientId });
      console.log('Session validation successful', { sessionId, clientId: session.clientId });
      
      return NextResponse.json({
        valid: true,
        sessionId: session.sessionId,
        clientId: session.clientId,
        createdAt: session.createdAt
      });
    }
    
    // If no sessionId is provided, return session stats (admin only)
    const adminKey = url.searchParams.get('adminKey');
    
    if (adminKey !== process.env.ADMIN_API_KEY) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    const sessionCount = getSessionCount();
    const sessions = getAllSessions();
    
    return NextResponse.json({
      count: sessionCount,
      sessions: sessions.map(s => ({
        sessionId: s.sessionId,
        clientId: s.clientId,
        createdAt: s.createdAt,
        lastActive: s.lastActive
      }))
    });
  } catch (error) {
    logger.error('Error in sessions GET endpoint', error);
    console.error('Error in sessions GET endpoint', error);
    
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/v1/sessions
 * 
 * Create a new session
 */
export async function POST(request: Request) {
  try {
    // Get request body
    const { clientId } = await request.json();
    
    if (!clientId) {
      return NextResponse.json(
        { error: 'Client ID is required' },
        { status: 400 }
      );
    }
    
    // Get referer from request headers
    const referer = request.headers.get('referer') || '';
    
    // Validate client
    const isValid = validateClient(clientId, referer);
    
    if (!isValid) {
      logger.error('Client validation failed', { clientId, referer });
      console.error('Client validation failed', { clientId, referer });
      
      return NextResponse.json(
        { error: 'Invalid client ID or referer' },
        { status: 403 }
      );
    }
    
    // Create a new session
    const session = createSession(clientId);
    
    logger.log('New session created via API', { sessionId: session.sessionId, clientId });
    console.log('New session created via API', { sessionId: session.sessionId, clientId });
    
    return NextResponse.json({
      sessionId: session.sessionId,
      clientId: session.clientId,
      createdAt: session.createdAt
    });
  } catch (error) {
    logger.error('Error in sessions POST endpoint', error);
    console.error('Error in sessions POST endpoint', error);
    
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/v1/sessions
 * 
 * Delete a session
 */
export async function DELETE(request: Request) {
  try {
    // Get query parameters
    const url = new URL(request.url);
    const sessionId = url.searchParams.get('sessionId');
    
    if (!sessionId) {
      return NextResponse.json(
        { error: 'Session ID is required' },
        { status: 400 }
      );
    }
    
    // Get session
    const session = getSession(sessionId);
    
    if (!session) {
      return NextResponse.json(
        { error: 'Session not found or expired' },
        { status: 404 }
      );
    }
    
    // Delete session
    const success = deleteSession(sessionId);
    
    if (!success) {
      return NextResponse.json(
        { error: 'Failed to delete session' },
        { status: 500 }
      );
    }
    
    logger.log('Session deleted via API', { sessionId, clientId: session.clientId });
    console.log('Session deleted via API', { sessionId, clientId: session.clientId });
    
    return NextResponse.json({
      success: true,
      sessionId
    });
  } catch (error) {
    logger.error('Error in sessions DELETE endpoint', error);
    console.error('Error in sessions DELETE endpoint', error);
    
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 