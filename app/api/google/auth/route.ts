import { NextResponse } from 'next/server';
import { google } from 'googleapis';
import { logger } from '@/hooks/logger';

// Immediate console logging for debugging
console.log('API Route loaded with environment variables:', {
  hasClientId: !!process.env.GOOGLE_CLIENT_ID,
  clientIdPreview: process.env.GOOGLE_CLIENT_ID?.substring(0, 10) + '...',
  hasClientSecret: !!process.env.GOOGLE_CLIENT_SECRET,
  hasProjectId: !!process.env.GOOGLE_PROJECT_ID,
  projectId: process.env.GOOGLE_PROJECT_ID,
});

// Validate environment variables
const REQUIRED_ENV_VARS = {
  GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID,
  GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET,
};

// Check for missing environment variables
const missingVars = Object.entries(REQUIRED_ENV_VARS)
  .filter(([_, value]) => !value)
  .map(([key]) => key);

if (missingVars.length > 0) {
  console.error('Missing required environment variables:', missingVars);
  throw new Error(`Missing required environment variables: ${missingVars.join(', ')}`);
}

const REDIRECT_URI = 'http://localhost:3000/api/auth/callback/google';

const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  REDIRECT_URI
);

export async function POST() {
  console.log('POST request received at /api/google/auth');
  
  try {
    console.log('Getting Google OAuth token');

    // Check if we have stored tokens
    if (global.googleTokens) {
      console.log('Using stored Google OAuth tokens');
      oauth2Client.setCredentials(global.googleTokens);
      
      try {
        const { token } = await oauth2Client.getAccessToken();
        if (token) {
          console.log('Successfully refreshed access token');
          return NextResponse.json({ access_token: token });
        }
      } catch (error) {
        console.error('Error refreshing token:', error);
        // Token might be expired, continue to get new one
      }
    }

    // Generate authentication URL
    const authUrl = oauth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: ['https://www.googleapis.com/auth/presentations.readonly'],
      redirect_uri: REDIRECT_URI,
      include_granted_scopes: true,
      prompt: 'consent'
    });

    console.log('Generated auth URL:', authUrl);

    return NextResponse.json({ auth_url: authUrl });
  } catch (error) {
    console.error('Error in Google auth:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to authenticate with Google' },
      { status: 500 }
    );
  }
} 