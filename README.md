# Voice AI: Voice Control Assistant

## Overview
Next.js app with voice commands via WebRTC and OpenAI. Includes JavaScript SDK for website integration.

## Structure
- `app/` - Next.js App Router code
  - `page.tsx` - Entry point for the web application
  - `layout.tsx` - Root layout
  - `globals.css` - Global styles
  - `api/` - Backend endpoints
    - `log/` - Application logging
    - `session/` - Session management
    - `internal/` - Internal API endpoints
      - `log/` - Internal logging
      - `session/` - Internal session management
    - `v1/` - API endpoints for SDK
      - `auth/validate/` - Client validation
      - `sessions/` - Session management
      - `voice/token/` - Voice processing tokens
      - `voice/text-log/` - Text log storage
- `components/` - React components
  - `webapp/` - Web application components
    - `ChatGPT.tsx` - OpenAI voice processing component
- `hooks/` - Custom React hooks
  - `logger.ts` - Logging utilities
  - `webapp/` - Web application hooks
    - `use-webrtc.ts` - Voice capture via WebRTC
- `lib/` - Utility libraries
  - `security.ts` - Client validation
  - `sessions.ts` - Session management
  - `storage/` - Storage providers
    - `supabase-storage.ts` - Supabase storage implementation
    - `interface.ts` - Storage provider interface
    - `index.ts` - Storage factory
  - `supabase.ts` - Supabase client
- `prompts/` - OpenAI prompt templates
  - `agent-instructions.ts` - Instructions for the voice assistant
- `public/` - Static assets
  - `file.svg`, `globe.svg`, `next.svg`, `vercel.svg`, `window.svg` - UI icons
  - `sdk/` - Voice AI SDK files
    - `demo.html` - SDK demo page
    - `voice-ai-sdk.js` - Main SDK
    - `voice-ai-sdk.min.js` - Minified SDK
    - `voice-ai-styles.css` - SDK styles
- `scripts/` - Utility scripts
  - `deploy-sdk.sh` - SDK deployment script
  - `supabase-setup.sql` - SQL script for Supabase setup
- `tests/` - Test files
- `dist/` - Distribution files (in gitignore, but shown for reference)
  - `sdk/` - Compiled SDK files
    - `README.md` - SDK documentation
    - `demo.html` - SDK demo page
    - `version.json` - SDK version information
    - `voice-ai-sdk.min.js` - Minified SDK
    - `voice-ai-styles.css` - SDK styles
- `.env.local` - Environment variables (not committed)
  - `NEXT_PUBLIC_OPENAI_API_KEY` - OpenAI API key
  - `ALLOWED_CLIENTS` - Authorized clients
  - `CLIENT_*_DOMAINS` - Allowed domains
  - `NEXT_PUBLIC_SUPABASE_URL` - Supabase URL
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Supabase anonymous key
- `next.config.ts` - Next.js config
- `package.json` - Dependencies
- `postcss.config.mjs` - PostCSS configuration
- `tailwind.config.ts` - Styling config
- `tsconfig.json` - TypeScript config
- `INTEGRATION.md` - SDK integration guide
- `README.md` - Project documentation

## Flow
1. `page.tsx` → `components/webapp/ChatGPT` component
2. WebRTC captures voice via `hooks/webapp/use-webrtc.ts`
3. ChatGPT processes commands using prompts from `prompts/agent-instructions.ts`
4. Voice assistant responds to user
5. SDK enables integration on any website

## Setup

### 1. Environment Variables
Create `.env.local` from `.env.local.example` and add your API keys:
```
# OpenAI API Key
NEXT_PUBLIC_OPENAI_API_KEY=your_openai_api_key

# Supabase configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 2. Supabase Setup
1. Create a Supabase project at [supabase.com](https://supabase.com)
2. Get your project URL and anon key from the project settings
3. Run the SQL script in `scripts/supabase-setup.sql` in the Supabase SQL editor to create the necessary tables and indexes

### 3. Install Dependencies
```bash
npm install
```

### 4. Run Development Server
```bash
npm run dev
```

### 5. Open Application
Open [http://localhost:3000](http://localhost:3000) in your browser

## Deployment on Vercel
This application is designed to be deployed on Vercel. The Supabase integration ensures that all data is stored in the database rather than the filesystem, making it compatible with Vercel's serverless environment.

1. Push your code to a Git repository
2. Connect the repository to Vercel
3. Add the environment variables in the Vercel project settings
4. Deploy the application

## Features

- Voice command processing via WebRTC
- Server-side OpenAI integration for enhanced security
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

Create a `.env.local` file based on the `.env.local.example` template and add your OpenAI API key:

```
OPENAI_API_KEY=your_openai_api_key
# Additional environment variables as specified in .env.local.example
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
      - `voice/process/` - WebRTC offer processing
      - `auth/validate/` - Client validation
      - `sessions/` - Session management
- `hooks/` - Custom React hooks
  - `use-webrtc.ts` - Voice capture via WebRTC
  - `logger.ts` - Logging utilities
- `lib/` - Utility libraries
  - `security.ts` - Client validation utilities
  - `sessions.ts` - Session management utilities
  - `openai-webrtc.ts` - Server-side OpenAI WebRTC integration
  - `openai-sessions.ts` - OpenAI session management
- `prompts/` - OpenAI prompt templates
  - `agent-instructions.ts` - Instructions for the voice assistant
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

## Server-Side OpenAI Integration

This project uses a server-side approach for OpenAI integration, which provides several benefits:

1. **Enhanced Security**: The OpenAI API key is kept securely on the server and never exposed to the client.
2. **Centralized Control**: All interactions with OpenAI are managed by the server, allowing for monitoring and logging.
3. **Simplified Client**: The client SDK only needs to handle WebRTC connection setup and UI management.

For more details on the server-side integration, see [SERVER_SIDE_INTEGRATION.md](SERVER_SIDE_INTEGRATION.md).

## Demo

A demo page is available at [http://localhost:3000/sdk/demo.html](http://localhost:3000/sdk/demo.html) when running the development server. This demo showcases the SDK's features and allows you to test different configurations.

## Testing

The project uses Jest for testing. To run the tests locally:

```bash
npm test
```

Tests are automatically run on GitHub Actions for every pull request and push to the main branch. The test status is displayed in the badge at the top of this README.

## Learn More

To learn more about the technologies used in this project:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API
- [WebRTC API](https://developer.mozilla.org/en-US/docs/Web/API/WebRTC_API) - Web Real-Time Communication
- [OpenAI API](https://platform.openai.com/docs/api-reference) - OpenAI API reference

## License

[MIT](LICENSE)
