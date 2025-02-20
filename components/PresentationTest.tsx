'use client';

import { useEffect, useState } from 'react';
import { logger } from '@/hooks/logger';
import useWebRTCAudioSession from '@/hooks/use-webrtc';

const PRESENTATION_ID = process.env.GOOGLE_PRESENTATION_ID;

export const PresentationTest = () => {
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  
  const { 
    isSessionActive, 
    startSession, 
    stopSession, 
    status: voiceStatus 
  } = useWebRTCAudioSession('alloy');

  useEffect(() => {
    // Auto-start voice session when component mounts
    startSession();
    
    // Check URL parameters for OAuth response
    const urlParams = new URLSearchParams(window.location.search);
    const errorParam = urlParams.get('error');
    const successParam = urlParams.get('success');
    const tokensParam = urlParams.get('tokens');

    if (errorParam) {
      setError(decodeURIComponent(errorParam));
      setIsLoading(false);
      // Clear the URL parameters
      window.history.replaceState({}, '', window.location.pathname);
      return;
    }

    if (successParam && tokensParam) {
      try {
        // Store tokens in localStorage
        const tokens = JSON.parse(decodeURIComponent(tokensParam));
        localStorage.setItem('googleTokens', JSON.stringify(tokens));
        // Clear the URL parameters
        window.history.replaceState({}, '', window.location.pathname);
      } catch (err) {
        console.error('Error storing tokens:', err);
        setError('Failed to store authentication tokens');
        setIsLoading(false);
        return;
      }
    }

    const testGoogleAPI = async () => {
      try {
        logger.log('Starting Google Slides API test');
        
        // Check if we have stored tokens
        const storedTokens = localStorage.getItem('googleTokens');
        if (storedTokens) {
          const tokens = JSON.parse(storedTokens);
          const currentTime = Date.now();
          
          // If tokens are expired, clear them and restart auth
          if (tokens.expiry_date && currentTime >= tokens.expiry_date) {
            localStorage.removeItem('googleTokens');
            const response = await fetch('/api/google/auth', { method: 'POST' });
            if (!response.ok) throw new Error('Failed to refresh auth');
            const data = await response.json();
            if (data.auth_url) {
              window.location.href = data.auth_url;
              return;
            }
          }
          
          // Use stored access token
          logger.log('Testing Google Slides API connection', {
            presentationId: PRESENTATION_ID,
          });

          const slidesResponse = await fetch(
            `https://slides.googleapis.com/v1/presentations/${PRESENTATION_ID}`,
            {
              headers: {
                'Authorization': `Bearer ${tokens.access_token}`,
                'Content-Type': 'application/json',
              }
            }
          );
          
          if (!slidesResponse.ok) {
            // If token is invalid, clear it and restart auth
            if (slidesResponse.status === 401) {
              localStorage.removeItem('googleTokens');
              const response = await fetch('/api/google/auth', { method: 'POST' });
              if (!response.ok) throw new Error('Failed to refresh auth');
              const data = await response.json();
              if (data.auth_url) {
                window.location.href = data.auth_url;
                return;
              }
            } else {
              const errorText = await slidesResponse.text();
              throw new Error(`API request failed: ${slidesResponse.status} - ${errorText}`);
            }
          }

          const slidesData = await slidesResponse.json();
          logger.log('Google Slides API response received', {
            dataPreview: JSON.stringify(slidesData).substring(0, 200) + '...'
          });
          setIsLoading(false);
          return;
        }

        // If no stored tokens, start auth process
        const response = await fetch('/api/google/auth', {
          method: 'POST',
        });
        
        if (!response.ok) {
          throw new Error('Failed to get access token');
        }

        const data = await response.json();
        
        // If we got an auth URL, redirect to it
        if (data.auth_url) {
          logger.log('Redirecting to Google auth');
          window.location.href = data.auth_url;
          return;
        }
      } catch (err: any) {
        logger.error('Error testing Google API:', {
          error: err,
          message: err?.message,
          stack: err?.stack
        });
        setError(err?.message || 'Unknown error occurred');
        setIsLoading(false);
      }
    };

    testGoogleAPI();
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4 text-gray-800">Google Slides API Test</h2>
          <p className="text-gray-600">Authenticating with Google...</p>
          <p className="text-blue-500 mt-2">{voiceStatus}</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4 text-gray-800">Google Slides API Test</h2>
          <p className="text-red-500 mb-4">Error: {error}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          <div className="p-6 border-b border-gray-200 flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-bold text-gray-800">Google Slides API Test</h2>
              <p className="text-green-500 mt-2">API connection successful!</p>
            </div>
            <button
              onClick={() => isSessionActive ? stopSession() : startSession()}
              className={`px-6 py-2 rounded-lg transition-colors ${
                isSessionActive 
                  ? 'bg-red-500 hover:bg-red-600 text-white' 
                  : 'bg-green-500 hover:bg-green-600 text-white'
              }`}
            >
              {isSessionActive ? 'Stop Voice Chat' : 'Start Voice Chat'}
            </button>
          </div>
          <div className="aspect-[16/9] w-full">
            <iframe
              src={`https://docs.google.com/presentation/d/${PRESENTATION_ID}/embed?start=false&loop=false&delayms=3000`}
              className="w-full h-full"
              allowFullScreen
            />
          </div>
          {voiceStatus && (
            <div className="p-4 bg-gray-50 border-t border-gray-200">
              <p className="text-gray-600">{voiceStatus}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PresentationTest; 