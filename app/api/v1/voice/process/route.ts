import { NextResponse } from 'next/server';
import { validateClient } from '@/lib/security';
import { getSession, createSession } from '@/lib/sessions';
import { getOpenAISession, createOpenAISession } from '@/lib/openai-sessions';
import { logger } from '@/lib/logger';
import { agentInstructions } from '@/prompts/agent-instructions';

export async function POST(request: Request) {
  try {
    console.log('[voice/process] Received voice processing request');
    
    // Get request body
    const body = await request.json();
    const { clientId, sessionId, offer, voice } = body;
    
    console.log(`[voice/process] Request data: clientId=${clientId}, sessionId=${sessionId}, voice=${voice}`);
    
    // Validate required parameters
    if (!clientId) {
      console.log('[voice/process] Missing clientId parameter');
      return NextResponse.json(
        { error: 'Client ID is required' },
        { status: 400 }
      );
    }
    
    if (!sessionId) {
      console.log('[voice/process] Missing sessionId parameter');
      return NextResponse.json(
        { error: 'Session ID is required' },
        { status: 400 }
      );
    }
    
    if (!offer) {
      console.log('[voice/process] Missing offer parameter');
      return NextResponse.json(
        { error: 'WebRTC offer is required' },
        { status: 400 }
      );
    }
    
    console.log(`[voice/process] SDP offer type: ${offer.type}`);
    
    // Get referer from request headers
    const referer = request.headers.get('referer') || '';
    console.log(`[voice/process] Request referer: ${referer}`);
    
    // Validate client
    const isClientValid = validateClient(clientId, referer);
    console.log(`[voice/process] Client validation result: ${isClientValid}`);
    
    if (!isClientValid) {
      return NextResponse.json(
        { error: 'Invalid client ID or referer' },
        { status: 403 }
      );
    }
    
    // Get session
    let session = getSession(sessionId);
    let isSessionValid = !!session;
    console.log(`[voice/process] Session validation result: ${isSessionValid}`);
    
    // If session not found, create a new one
    if (!isSessionValid) {
      console.log(`[voice/process] Session not found: ${sessionId}`);
      
      // Create a new session
      session = createSession(clientId);
      console.log(`[voice/process] Created new session: ${session.sessionId}`);
      
      // Return the new session ID with the error
      return NextResponse.json(
        { 
          error: 'Session not found or expired', 
          newSessionId: session.sessionId 
        },
        { status: 404 }
      );
    }
    
    // Get OpenAI session
    let openAISession = getOpenAISession(sessionId);
    const openAISessionExists = !!openAISession;
    console.log(`[voice/process] OpenAI session exists: ${openAISessionExists}`);
    
    // Create OpenAI session if it doesn't exist
    if (!openAISessionExists) {
      console.log(`[voice/process] Creating new OpenAI session for: ${sessionId}`);
      
      try {
        openAISession = await createOpenAISession(sessionId, clientId, voice || 'alloy');
        console.log(`[voice/process] OpenAI session created successfully: ${sessionId}`);
      } catch (error) {
        console.error('[voice/process] Failed to create OpenAI session', error);
        
        return NextResponse.json(
          { error: 'Failed to create OpenAI session' },
          { status: 500 }
        );
      }
    }
    
    // Process WebRTC offer
    console.log(`[voice/process] Processing WebRTC offer for session: ${sessionId}`);
    
    try {
      // Убедимся, что openAISession не null
      if (!openAISession) {
        throw new Error('OpenAI session is null');
      }
      
      const answer = await openAISession.processOffer(offer);
      console.log(`[voice/process] WebRTC offer processed successfully, answer received`);
      
      // Log successful connection
      logger.log('WebRTC connection established with client', { 
        sessionId, 
        clientId 
      });
      
      console.log(`[voice/process] Returning answer and instructions to client: ${sessionId}`);
      
      // Return the answer and instructions
      return NextResponse.json({
        answer,
        instructions: agentInstructions
      });
    } catch (error) {
      console.error('[voice/process] Failed to process WebRTC offer', error);
      
      return NextResponse.json(
        { error: 'Failed to process WebRTC offer' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('[voice/process] Error processing voice request', error);
    
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 