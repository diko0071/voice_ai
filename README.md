# Voice AI: Voice Control Assistant

This is a [Next.js](https://nextjs.org) project that provides a voice control assistant with WebRTC and OpenAI integration. The project includes a JavaScript SDK that can be embedded on any website to enable voice command functionality.

## Features

- Voice command processing via WebRTC
- OpenAI integration for natural language understanding
- JavaScript SDK for easy integration into any website
- Customizable UI with multiple themes and positions
- Session management and client validation
- Comprehensive logging system

## Getting Started

First, clone the repository and install dependencies:

```bash
git clone https://github.com/your-username/voice-ai.git
cd voice-ai
npm install
```

Create a `.env.local` file based on the `.env.example` template and add your OpenAI API key:

```
NEXT_PUBLIC_OPENAI_API_KEY=your_openai_api_key
# Additional environment variables as specified in .env.example
```

Then, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Project Structure

- `app/` - Next.js App Router code
  - `page.tsx` - Entry point, renders ChatGPT component
  - `layout.tsx` - Root layout
  - `globals.css` - Global styles
  - `chatgpt.tsx` - OpenAI voice processing
  - `api/` - Backend endpoints
    - `log/` - Application logging
    - `session/` - Session management
    - `v1/` - API endpoints for SDK
- `hooks/` - Custom React hooks
  - `use-webrtc.ts` - Voice capture via WebRTC
  - `logger.ts` - Logging utilities
- `lib/` - Utility libraries
  - `security.ts` - Client validation utilities
  - `sessions.ts` - Session management utilities
- `public/sdk/` - JavaScript SDK files
  - `voice-ai-sdk.js` - Main SDK file
  - `voice-ai-sdk.min.js` - Minified SDK for production
  - `voice-ai-styles.css` - SDK styles
  - `demo.html` - Demo page for SDK

## SDK Integration

The Voice AI SDK can be easily integrated into any website. For detailed integration instructions, see the [INTEGRATION.md](INTEGRATION.md) file.

Basic integration example:

```html
<!-- Include the SDK -->
<script src="https://your-domain.com/sdk/voice-ai-sdk.min.js"></script>
<link rel="stylesheet" href="https://your-domain.com/sdk/voice-ai-styles.css">

<!-- Initialize the SDK -->
<script>
  document.addEventListener('DOMContentLoaded', function() {
    window.VoiceAI.init({
      clientId: 'your_client_id',
      serverUrl: 'https://your-voice-ai-server.com',
      position: 'bottom-right',
      theme: 'light'
    });
  });
</script>
```

## Demo

A demo page is available at [http://localhost:3000/sdk/demo.html](http://localhost:3000/sdk/demo.html) when running the development server. This demo showcases the SDK's features and allows you to test different configurations.

## Learn More

To learn more about the technologies used in this project:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API
- [WebRTC API](https://developer.mozilla.org/en-US/docs/Web/API/WebRTC_API) - Web Real-Time Communication
- [OpenAI API](https://platform.openai.com/docs/api-reference) - OpenAI API reference

## License

[MIT](LICENSE)
