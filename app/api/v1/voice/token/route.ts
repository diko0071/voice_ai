import { NextResponse } from 'next/server';
import { validateClient } from '@/lib/security';
import { getSession } from '@/lib/sessions';
import { logger } from '@/hooks/logger';

export async function POST(req: Request) {
  try {
    // Get the client ID and session ID from the request body
    const { clientId, sessionId } = await req.json();
    
    if (!clientId) {
      return NextResponse.json(
        { error: 'Client ID is required' },
        { status: 400 }
      );
    }
    
    if (!sessionId) {
      return NextResponse.json(
        { error: 'Session ID is required' },
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
    
    // Validate the session
    const session = getSession(sessionId);
    
    if (!session) {
      return NextResponse.json(
        { error: 'Session not found or expired' },
        { status: 404 }
      );
    }
    
    if (session.clientId !== clientId) {
      return NextResponse.json(
        { error: 'Session does not belong to this client' },
        { status: 403 }
      );
    }
    
    // Get the OpenAI API key from environment variables
    const apiKey = process.env.NEXT_PUBLIC_OPENAI_API_KEY;
    
    if (!apiKey) {
      logger.error('OpenAI API key not found in environment variables');
      return NextResponse.json(
        { error: 'API key not configured' },
        { status: 500 }
      );
    }
    
    // Return the API key as a client secret
    // In a production environment, this should be replaced with a proper token generation mechanism
    return NextResponse.json({
      client_secret: {
        value: apiKey
      }
    });
  } catch (error) {
    logger.error('Error generating voice token', error);
    return NextResponse.json(
      { error: 'Failed to generate voice token' },
      { status: 500 }
    );
  }
} 