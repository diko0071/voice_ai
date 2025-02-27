import { NextResponse } from 'next/server';
import { logger } from '@/lib/logger';

export async function POST(req: Request) {
  try {
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
    logger.error('Error generating session token', error);
    return NextResponse.json(
      { error: 'Failed to generate session token' },
      { status: 500 }
    );
  }
} 