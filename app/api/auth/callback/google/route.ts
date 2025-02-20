import { NextResponse } from 'next/server';
import { google } from 'googleapis';
import { logger } from '@/hooks/logger';
import { Credentials } from 'google-auth-library';

// Extend global type
declare global {
  var googleTokens: Credentials | null;
}

const REDIRECT_URI = `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/callback/google`;

const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  REDIRECT_URI
);

export async function GET(request: Request) {
  try {
    console.log('Received callback request');
    
    const url = new URL(request.url);
    const code = url.searchParams.get('code');
    const error = url.searchParams.get('error');

    if (error) {
      console.error('Error from Google OAuth:', error);
      return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}?error=${error}`);
    }

    if (!code) {
      console.error('No authorization code received');
      return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}?error=no_code`);
    }

    console.log('Received authorization code, getting tokens');

    // Get tokens
    const { tokens } = await oauth2Client.getToken(code);
    oauth2Client.setCredentials(tokens);

    console.log('Successfully got tokens:', {
      hasAccessToken: !!tokens.access_token,
      hasRefreshToken: !!tokens.refresh_token,
      expiryDate: tokens.expiry_date
    });

    // Store tokens in global for server-side use
    global.googleTokens = tokens;

    // Redirect back with tokens that will be stored in localStorage
    const tokenData = encodeURIComponent(JSON.stringify({
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token,
      expiry_date: tokens.expiry_date
    }));
    
    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}?success=true&tokens=${tokenData}`);
  } catch (error) {
    console.error('Error in Google auth callback:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}?error=${encodeURIComponent(errorMessage)}`);
  }
} 