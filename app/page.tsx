"use client";

import Link from 'next/link';
import { useEffect, useState } from 'react';

export default function Home() {
  // Use client-side rendering to avoid hydration errors
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  if (!isClient) {
    return null; // Return nothing during server-side rendering
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-between p-24">
      <div className="w-full max-w-5xl flex flex-col items-center gap-8">
        <h1 className="text-4xl font-bold text-center">Voice AI: Voice Control Assistant</h1>
        
        <div className="flex flex-col items-center gap-4">
          <h2 className="text-2xl font-semibold">Try Our Demo</h2>
          <Link 
            href="/sdk/demo.html" 
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Open Demo Page
          </Link>
        </div>

        <div className="w-full mt-8">
          <h2 className="text-2xl font-semibold mb-4">Integration Guide</h2>
          <div className="prose max-w-none">
            <h3>Basic Integration</h3>
            <p>Add the following code to your website:</p>
            <pre className="bg-gray-800 text-white p-4 rounded-lg overflow-auto">
              <code>{`<!-- Include the SDK -->
<script src="https://your-voice-service.com/sdk/voice-ai-sdk.min.js"></script>

<!-- Initialize the SDK -->
<script>
  document.addEventListener('DOMContentLoaded', function() {
    window.VoiceAI.init({
      clientId: 'your_client_id',
      position: 'bottom-right',
      theme: 'light'
    });
  });
</script>`}</code>
            </pre>
            
            <p className="mt-4">
              For complete integration instructions, please refer to our{' '}
              <a href="/sdk/demo.html" className="text-blue-600 hover:underline">
                demo page
              </a>.
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}