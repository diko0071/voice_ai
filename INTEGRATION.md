# Voice AI SDK Integration Guide

This guide provides instructions for integrating the Voice AI JavaScript SDK into your website.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Server Setup](#server-setup)
3. [Basic Integration](#basic-integration)
4. [Advanced Configuration](#advanced-configuration)
5. [Customization](#customization)
6. [Security](#security)
7. [Troubleshooting](#troubleshooting)

## Prerequisites

Before integrating the Voice AI SDK, ensure you have:

- Access to the Voice AI server or your own deployment
- Domain authorization for your website

## Server Setup

### Environment Variables

Create a `.env.local` file in the root of your Voice AI server with the following variables:

```
# OpenAI API Key (kept securely on the server)
OPENAI_API_KEY=your_openai_api_key_here

# Application URL
NEXT_PUBLIC_APP_URL=https://your-voice-service.com

# Client Configuration
ALLOWED_CLIENTS=your_client_id
CLIENT_your_client_id_DOMAINS=yourdomain.com,www.yourdomain.com

# Session Configuration
SESSION_EXPIRY_MINUTES=30

# Logging Configuration
LOG_LEVEL=info
```

Replace `your_client_id` with a unique identifier for your website, and `yourdomain.com,www.yourdomain.com` with your website's domains.

### Starting the Server

```bash
npm run dev   # For development
npm run build # For production build
npm start     # For production server
```

## Basic Integration

Add the following code to your website:

```html
<!-- Include the SDK -->
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
</script>
```

Replace `your_client_id` with the client ID you configured on the server.

## Advanced Configuration

The SDK supports various configuration options:

```html
<script>
  document.addEventListener('DOMContentLoaded', function() {
    const voiceAI = window.VoiceAI.init({
      clientId: 'your_client_id',
      position: 'bottom-right', // 'bottom-right', 'bottom-left', 'top-right', 'top-left'
      theme: 'light', // 'light', 'dark', 'brand'
      language: 'en',
      voice: 'alloy', // OpenAI voice ID
      serverUrl: 'https://your-voice-service.com', // Custom server URL
      meetingUrl: 'https://calendly.com/your-company/meeting', // URL for booking meetings
      instructions: 'You are a helpful voice assistant for our website.', // Custom instructions for the AI
      customStyles: {
        buttonColor: '#3a86ff',
        textColor: '#333333',
        backgroundColor: '#ffffff'
      },
      onReady: function() {
        console.log('Voice AI is ready');
      },
      onStart: function() {
        console.log('Voice AI session started');
      },
      onEnd: function() {
        console.log('Voice AI session ended');
      },
      onError: function(error) {
        console.error('Voice AI error:', error);
      }
    });
    
    // You can access SDK methods
    window.startVoiceAI = function() {
      voiceAI.startSession();
    };
    
    window.stopVoiceAI = function() {
      voiceAI.stopSession();
    };
    
    window.toggleVoiceAI = function() {
      voiceAI.toggleSession();
    };
  });
</script>
```

## Configuration Parameters

The SDK accepts the following configuration parameters:

- `clientId`: (Required) Your unique client identifier
- `serverUrl`: (Required) URL of the Voice AI server
- `meetingUrl`: (Required) URL for booking meetings, used by the booking popup feature
- `position`: (Optional) Position of the Voice AI button ('bottom-right', 'bottom-left', 'top-right', 'top-left')
- `theme`: (Optional) UI theme ('light', 'dark', 'brand')
- `language`: (Optional) Language for the UI (default: 'en')
- `voice`: (Optional) OpenAI voice ID (default: 'alloy')
- `instructions`: (Optional) The agent instructions
- `customStyles`: (Optional) Custom styling options
- `onReady`: (Optional) Callback when the SDK is ready
- `onStart`: (Optional) Callback when a session starts
- `onEnd`: (Optional) Callback when a session ends
- `onError`: (Optional) Callback when an error occurs
- `onMessage`: (Optional) Callback when a message is received

## API Endpoints

The SDK communicates with the following server endpoints:

### `/api/v1/auth/validate`

- **Method**: POST
- **Request Body**:
  - `clientId`: The client ID
- **Response**:
  - `valid`: Boolean indicating if the client is valid

### `/api/v1/sessions`

- **Method**: POST
- **Request Body**:
  - `clientId`: The client ID
- **Response**:
  - `sessionId`: The session ID

### `/api/v1/voice/process`

- **Method**: POST
- **Request Body**:
  - `clientId`: The client ID
  - `sessionId`: The session ID
  - `offer`: The WebRTC offer
  - `voice`: (Optional) The voice to use (default: 'alloy')
- **Response**:
  - `answer`: The WebRTC answer from OpenAI
  - `instructions`: The agent instructions

## Customization

### Using CSS

You can include the SDK's CSS file for additional styling options:

```html
<link rel="stylesheet" href="https://your-voice-service.com/sdk/voice-ai-styles.css">
```

Then, you can override styles using CSS:

```css
.voice-ai-button {
  background-color: #ff5a5f !important;
}

.voice-ai-container {
  /* Custom positioning */
}
```

### Custom Themes

The SDK supports three built-in themes: `light`, `dark`, and `brand`. You can specify the theme in the configuration:

```js
window.VoiceAI.init({
  clientId: 'your_client_id',
  theme: 'dark' // 'light', 'dark', or 'brand'
});
```

## Security

The SDK includes several security features:

1. **Domain Validation**: The server validates that requests come from authorized domains.
2. **Client ID Validation**: Each request requires a valid client ID.
3. **Session Management**: User sessions are managed securely.
4. **Server-Side OpenAI Integration**: The OpenAI API key is kept securely on the server and never exposed to the client.

### CORS Configuration

The server is configured to only accept requests from authorized domains. Make sure your domain is included in the `CLIENT_your_client_id_DOMAINS` environment variable.

## Troubleshooting

### Common Issues

1. **SDK not initializing**:
   - Check that your client ID is correct
   - Verify that your domain is authorized on the server
   - Check browser console for errors

2. **Microphone not working**:
   - Ensure the user has granted microphone permissions
   - Check if the browser supports WebRTC
   - Verify that the site is served over HTTPS (required for microphone access)

3. **Voice recognition issues**:
   - Check internet connection
   - Ensure the microphone is working properly
   - Verify that the server is properly configured with a valid OpenAI API key

### Browser Support

The SDK supports the following browsers:

- Chrome 74+
- Firefox 66+
- Safari 12.1+
- Edge 79+

### Getting Help

If you encounter issues not covered in this guide, please contact support at support@your-voice-service.com. 