import { NextResponse } from 'next/server';
import { createSession, getSession, updateSession, deleteSession } from '@/lib/sessions';
import { validateClient, validateSessionId, generateSessionId } from '@/lib/security';
import { logger } from '@/hooks/logger';

export async function POST(req: Request) {
  try {
    // Get the client ID and session data from the request body
    const { clientId, sessionId, data } = await req.json();
    
    if (!clientId) {
      return NextResponse.json(
        { error: 'Client ID is required' },
        { status: 400 }
      );
    }
    
    // Get the referer from the request headers
    const referer = req.headers.get('referer') || '';
    
    // Validate the client ID and referer
    const isValid = validateClient(clientId, referer);
    
    if (!isValid) {
      logger.error('Client validation failed', { clientId, referer });
      return NextResponse.json(
        { error: 'Invalid client ID or referer' },
        { status: 403 }
      );
    }
    
    // Generate a new session ID if not provided
    const newSessionId = sessionId || generateSessionId();
    
    // Create a new session
    const session = createSession(newSessionId, clientId, data);
    
    return NextResponse.json({
      sessionId: session.id,
      createdAt: session.createdAt
    });
  } catch (error) {
    logger.error('Error creating session', error);
    return NextResponse.json(
      { error: 'Failed to create session' },
      { status: 500 }
    );
  }
}

export async function GET(req: Request) {
  try {
    // Get the session ID from the query parameters
    const url = new URL(req.url);
    const sessionId = url.searchParams.get('sessionId');
    
    if (!sessionId) {
      return NextResponse.json(
        { error: 'Session ID is required' },
        { status: 400 }
      );
    }
    
    // Validate the session ID
    if (!validateSessionId(sessionId)) {
      return NextResponse.json(
        { error: 'Invalid session ID' },
        { status: 400 }
      );
    }
    
    // Get the session
    const session = getSession(sessionId);
    
    if (!session) {
      return NextResponse.json(
        { error: 'Session not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({
      sessionId: session.id,
      clientId: session.clientId,
      createdAt: session.createdAt,
      lastActiveAt: session.lastActiveAt,
      data: session.data
    });
  } catch (error) {
    logger.error('Error getting session', error);
    return NextResponse.json(
      { error: 'Failed to get session' },
      { status: 500 }
    );
  }
}

export async function PUT(req: Request) {
  try {
    // Get the session ID and data from the request body
    const { sessionId, data } = await req.json();
    
    if (!sessionId) {
      return NextResponse.json(
        { error: 'Session ID is required' },
        { status: 400 }
      );
    }
    
    // Validate the session ID
    if (!validateSessionId(sessionId)) {
      return NextResponse.json(
        { error: 'Invalid session ID' },
        { status: 400 }
      );
    }
    
    // Update the session
    const session = updateSession(sessionId, data);
    
    if (!session) {
      return NextResponse.json(
        { error: 'Session not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({
      sessionId: session.id,
      clientId: session.clientId,
      lastActiveAt: session.lastActiveAt,
      data: session.data
    });
  } catch (error) {
    logger.error('Error updating session', error);
    return NextResponse.json(
      { error: 'Failed to update session' },
      { status: 500 }
    );
  }
}

export async function DELETE(req: Request) {
  try {
    // Get the session ID from the query parameters
    const url = new URL(req.url);
    const sessionId = url.searchParams.get('sessionId');
    
    if (!sessionId) {
      return NextResponse.json(
        { error: 'Session ID is required' },
        { status: 400 }
      );
    }
    
    // Validate the session ID
    if (!validateSessionId(sessionId)) {
      return NextResponse.json(
        { error: 'Invalid session ID' },
        { status: 400 }
      );
    }
    
    // Delete the session
    const deleted = deleteSession(sessionId);
    
    if (!deleted) {
      return NextResponse.json(
        { error: 'Session not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error('Error deleting session', error);
    return NextResponse.json(
      { error: 'Failed to delete session' },
      { status: 500 }
    );
  }
} 