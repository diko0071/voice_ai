import { logger } from '@/lib/logger';
import { buildAgentInstructions } from '@/prompts/agent-instructions';

export class OpenAIWebRTCSession {
  private apiKey: string;
  private sessionId: string;
  private clientId: string;
  private isActive: boolean = false;
  private voice: string;
  private messageHistory: any[] = [];
  private realtimeSessionId: string | null = null;

  constructor(
    apiKey: string, 
    sessionId: string, 
    clientId: string, 
    voice: string = 'alloy',
    messageHistory: any[] = []
  ) {
    this.apiKey = apiKey;
    this.sessionId = sessionId;
    this.clientId = clientId;
    this.voice = voice;
    this.messageHistory = messageHistory;
    console.log(`[OpenAIWebRTCSession] Created new session: ${sessionId} for client: ${clientId} with voice: ${voice}`);
    if (messageHistory && messageHistory.length > 0) {
      console.log(`[OpenAIWebRTCSession] Included message history: ${messageHistory.length} messages`);
    }
  }

  async initialize(): Promise<boolean> {
    try {
      logger.log('Initializing OpenAI WebRTC session', { sessionId: this.sessionId });
      console.log(`[OpenAIWebRTCSession] Initializing session: ${this.sessionId}`);
      this.isActive = true;
      return true;
    } catch (error) {
      logger.error('Failed to initialize OpenAI WebRTC session', error);
      console.error(`[OpenAIWebRTCSession] Failed to initialize session: ${this.sessionId}`, error);
      this.isActive = false;
      return false;
    }
  }

  async processOffer(clientOffer: RTCSessionDescriptionInit): Promise<RTCSessionDescriptionInit> {
    try {
      // Create realtime session with all configuration via REST API first
      const baseUrl = "https://api.openai.com/v1";
      const model = "gpt-4o-realtime-preview-2024-12-17";
      
      logger.log('Creating OpenAI Realtime session with configuration', { sessionId: this.sessionId });
      
      // Format message history for instructions
      let messageHistoryText = '';
      if (this.messageHistory && this.messageHistory.length > 0) {
        logger.log('Formatting message history', { 
          sessionId: this.sessionId,
          messageCount: this.messageHistory.length,
          userMessages: this.messageHistory.filter(m => m.type === 'user').length,
          assistantMessages: this.messageHistory.filter(m => m.type === 'assistant').length
        });
        
        messageHistoryText = this.messageHistory.map(message => {
          const role = message.type === 'user' ? 'user' : 'assistant';
          return `<message role="${role}">${message.text}</message>`;
        }).join('');
      }
      
      const formattedInstructions = buildAgentInstructions(messageHistoryText);
      
      // Create session with full configuration
      const sessionResponse = await fetch(`${baseUrl}/realtime/sessions`, {
        method: "POST",
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: model,
          modalities: ["text", "audio"],
          instructions: formattedInstructions,
          voice: this.voice,
          input_audio_format: "pcm16",
          output_audio_format: "pcm16",
          input_audio_transcription: {
            model: "whisper-1"
          },
          turn_detection: {
            type: "server_vad",
            threshold: 0.5,
            prefix_padding_ms: 300,
            silence_duration_ms: 200,
            create_response: true
          },
          tools: [
            {
              type: "function",
              name: "show_booking_popup",
              description: "Show a popup with a button to book a meeting. Use when: (1) User wants to learn more about Improvado, (2) User wants to schedule a demo/meeting, (3) User asks about pricing/implementation details, (4) Conversation requires human representative, (5) User explicitly asks to book a meeting. Provide personalized message about benefits. When using this tool, tell the user directly: \"I've opened a booking popup for you. Please click the button to schedule a meeting.\" After using, end conversation with: \"I'll be here when you're ready to continue. Just click the microphone button again.\"",
              parameters: {
                type: "object",
                properties: {}
              }
            }
          ],
          tool_choice: "auto",
          temperature: 0.8,
          max_response_output_tokens: "inf"
        })
      });
      
      if (!sessionResponse.ok) {
        const errorText = await sessionResponse.text();
        logger.error('OpenAI session creation error', { 
          status: sessionResponse.status, 
          statusText: sessionResponse.statusText,
          error: errorText 
        });
        throw new Error(`OpenAI session creation error: ${sessionResponse.status} ${sessionResponse.statusText}`);
      }
      
      // Parse session response and establish WebRTC connection
      const sessionData = await sessionResponse.json();
      this.realtimeSessionId = sessionData.id;
      const ephemeralToken = sessionData.client_secret.value;
      
      logger.log('Session created, sending WebRTC offer to OpenAI', { 
        sessionId: this.sessionId, 
        realtimeSessionId: this.realtimeSessionId 
      });
      
      const response = await fetch(`${baseUrl}/realtime?session_id=${this.realtimeSessionId}`, {
        method: "POST",
        body: clientOffer.sdp,
        headers: {
          'Authorization': `Bearer ${ephemeralToken}`,
          'Content-Type': 'application/sdp'
        }
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        logger.error('OpenAI API error', { 
          status: response.status, 
          statusText: response.statusText,
          error: errorText 
        });
        throw new Error(`OpenAI API error: ${response.status} ${response.statusText}`);
      }
      
      // Get SDP answer from OpenAI and create answer for client
      const sdpAnswer = await response.text();
      logger.log('Received SDP answer from OpenAI', { 
        sessionId: this.sessionId,
        realtimeSessionId: this.realtimeSessionId 
      });
      
      logger.log('WebRTC connection established with OpenAI', { 
        sessionId: this.sessionId,
        realtimeSessionId: this.realtimeSessionId
      });
      
      return {
        type: 'answer',
        sdp: sdpAnswer
      };
    } catch (error) {
      logger.error('Failed to process offer', { 
        sessionId: this.sessionId, 
        error 
      });
      throw error;
    }
  }

  isSessionActive(): boolean {
    return this.isActive;
  }

  close(): void {
    this.isActive = false;
    logger.log('OpenAI WebRTC session closed', { sessionId: this.sessionId });
    console.log(`[OpenAIWebRTCSession] Session closed: ${this.sessionId}`);
  }
} 