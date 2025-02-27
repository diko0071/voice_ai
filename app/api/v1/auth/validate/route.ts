import { NextResponse } from 'next/server';
import { validateClient } from '@/lib/security';
import { logger } from '@/lib/logger';

export async function POST(req: Request) {
  try {
    // Get the client ID from the request body
    const { clientId } = await req.json();
    
    if (!clientId) {
      return NextResponse.json(
        { valid: false, error: 'Client ID is required' },
        { status: 400 }
      );
    }
    
    // Get the referer from the request headers
    const referer = req.headers.get('referer') || '';
    
    // Validate the client ID and referer
    const isValid = validateClient(clientId, referer);
    
    if (isValid) {
      logger.log('Client validated successfully', { clientId, referer });
      return NextResponse.json({ valid: true });
    } else {
      logger.error('Client validation failed', { clientId, referer });
      return NextResponse.json(
        { valid: false, error: 'Invalid client ID or referer' },
        { status: 403 }
      );
    }
  } catch (error) {
    logger.error('Error validating client', error);
    return NextResponse.json(
      { valid: false, error: 'Failed to validate client' },
      { status: 500 }
    );
  }
} 