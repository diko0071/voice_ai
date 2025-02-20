'use client';

import { useEffect, useState } from 'react';
import { logger } from '@/hooks/logger';
import useWebRTCAudioSession from '@/hooks/use-webrtc';

const PRESENTATION_ID = process.env.GOOGLE_PRESENTATION_ID;

interface SlideNote {
  slideId: string;
  notes: string;
}

export const PresentationTest = () => {
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [slideNotes, setSlideNotes] = useState<SlideNote[]>([]);
  
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
            `https://slides.googleapis.com/v1/presentations/${PRESENTATION_ID}?fields=slides(objectId,slideProperties/notesPage/notesProperties,slideProperties/notesPage/pageElements)`,
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
              logger.error('Slides API error', {
                status: slidesResponse.status,
                statusText: slidesResponse.statusText,
                error: errorText
              });
              throw new Error(`API request failed: ${slidesResponse.status} - ${errorText}`);
            }
          }

          const slidesData = await slidesResponse.json();
          logger.log('Google Slides API response received', {
            fullResponse: slidesData,
            slidesCount: slidesData.slides?.length
          });

          // Fetch notes for each slide
          const notes: SlideNote[] = [];
          if (slidesData.slides) {
            logger.log('Processing slides', { 
              count: slidesData.slides.length,
              firstSlide: slidesData.slides[0]
            });
            
            for (const slide of slidesData.slides) {
              logger.log('Processing slide', { 
                objectId: slide.objectId,
                slideProperties: slide.slideProperties,
                hasNotesPage: !!slide.slideProperties?.notesPage,
                notesPageId: slide.slideProperties?.notesPage?.notesPageId,
                fullSlide: slide
              });

              // Try to get notes directly from the slide data first
              if (slide.slideProperties?.notesPage?.pageElements) {
                const noteElements = slide.slideProperties.notesPage.pageElements;
                logger.log('Found note elements in slide data', { noteElements });
                
                for (const element of noteElements) {
                  if (element.shape?.text?.textElements) {
                    const textContent = element.shape.text.textElements
                      .map((textElement: any) => textElement.textRun?.content || '')
                      .join('');
                    
                    if (textContent.trim()) {
                      logger.log('Found note text directly in slide', { 
                        slideId: slide.objectId, 
                        textContent 
                      });
                      notes.push({
                        slideId: slide.objectId,
                        notes: textContent.trim()
                      });
                      break; // Found the notes, no need to check other elements
                    }
                  }
                }
              }
              
              // If no notes found in slide data, try fetching them separately
              if (!notes.find(note => note.slideId === slide.objectId) && 
                  slide.slideProperties?.notesPage?.notesPageId) {
                const notesPageId = slide.slideProperties.notesPage.notesPageId;
                logger.log('Fetching notes for slide', { notesPageId });
                
                const notesResponse = await fetch(
                  `https://slides.googleapis.com/v1/presentations/${PRESENTATION_ID}/pages/${notesPageId}`,
                  {
                    headers: {
                      'Authorization': `Bearer ${tokens.access_token}`,
                      'Content-Type': 'application/json',
                    }
                  }
                );

                if (notesResponse.ok) {
                  const notesData = await notesResponse.json();
                  logger.log('Notes data received', { 
                    hasNotesProperties: !!notesData.notesProperties,
                    speakerNotesId: notesData.notesProperties?.speakerNotesObjectId,
                    pageElementsCount: notesData.pageElements?.length
                  });
                  
                  const speakerNotesId = notesData.notesProperties?.speakerNotesObjectId;
                  
                  if (speakerNotesId) {
                    // Find the text content in page elements
                    const noteElement = notesData.pageElements?.find(
                      (element: any) => element.objectId === speakerNotesId
                    );
                    
                    logger.log('Found note element', {
                      found: !!noteElement,
                      hasShape: !!noteElement?.shape,
                      hasText: !!noteElement?.shape?.text,
                      textElements: noteElement?.shape?.text?.textElements?.length
                    });

                    const textContent = noteElement?.shape?.text?.textElements
                      ?.map((element: any) => element.textRun?.content || '')
                      .join('') || '';

                    if (textContent.trim()) {
                      logger.log('Adding note', { slideId: slide.objectId, textContent });
                      notes.push({
                        slideId: slide.objectId,
                        notes: textContent.trim()
                      });
                    }
                  }
                } else {
                  logger.error('Failed to fetch notes', {
                    status: notesResponse.status,
                    statusText: notesResponse.statusText
                  });
                }
              }
            }
          }

          logger.log('Final notes array', { notes, count: notes.length });
          setSlideNotes(notes);
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
          {slideNotes.length > 0 && (
            <div className="p-4 bg-gray-50 border-t border-gray-200">
              <h3 className="text-lg font-semibold mb-2">Speaker Notes:</h3>
              {slideNotes.map((note, index) => (
                <div key={note.slideId} className="mb-4">
                  <p className="font-medium">Slide {index + 1}:</p>
                  <p className="whitespace-pre-wrap text-gray-600">{note.notes}</p>
                </div>
              ))}
            </div>
          )}
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