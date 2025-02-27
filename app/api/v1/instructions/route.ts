import { NextResponse } from 'next/server';
import { validateClient } from '@/lib/security';
import { agentInstructions } from '@/prompts/agent-instructions';
import { logger } from '@/hooks/logger';

export async function GET(req: Request) {
  try {
    // Get the client ID from the query parameters
    const url = new URL(req.url);
    const clientId = url.searchParams.get('clientId');
    
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
    
    // Return the agent instructions
    return NextResponse.json({
      instructions: agentInstructions
    });
  } catch (error) {
    logger.error('Error getting agent instructions', error);
    return NextResponse.json(
      { error: 'Failed to get agent instructions' },
      { status: 500 }
    );
  }
} 