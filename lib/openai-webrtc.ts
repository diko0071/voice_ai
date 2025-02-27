import { logger } from '@/lib/logger';

export class OpenAIWebRTCSession {
  private apiKey: string;
  private sessionId: string;
  private clientId: string;
  private isActive: boolean = false;
  private voice: string;

  constructor(apiKey: string, sessionId: string, clientId: string, voice: string = 'alloy') {
    this.apiKey = apiKey;
    this.sessionId = sessionId;
    this.clientId = clientId;
    this.voice = voice;
    console.log(`[OpenAIWebRTCSession] Created new session: ${sessionId} for client: ${clientId} with voice: ${voice}`);
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
      // Create offer for OpenAI
      const baseUrl = "https://api.openai.com/v1/realtime";
      const model = "gpt-4o-realtime-preview-2024-12-17";
      
      logger.log('Sending offer to OpenAI', { sessionId: this.sessionId });
      console.log(`[OpenAIWebRTCSession] Sending offer to OpenAI for session: ${this.sessionId}`);
      console.log(`[OpenAIWebRTCSession] Using model: ${model}, voice: ${this.voice}`);
      console.log(`[OpenAIWebRTCSession] SDP offer: ${clientOffer.sdp?.substring(0, 100)}...`);
      
      const response = await fetch(`${baseUrl}?model=${model}&voice=${this.voice}`, {
        method: "POST",
        body: clientOffer.sdp,
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
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
        console.error(`[OpenAIWebRTCSession] OpenAI API error: ${response.status} ${response.statusText}`);
        console.error(`[OpenAIWebRTCSession] Error details: ${errorText}`);
        throw new Error(`OpenAI API error: ${response.status} ${response.statusText}`);
      }
      
      // Get SDP answer from OpenAI
      const sdpAnswer = await response.text();
      console.log(`[OpenAIWebRTCSession] Received SDP answer from OpenAI: ${sdpAnswer.substring(0, 100)}...`);
      
      // Create answer for client
      const answer: RTCSessionDescriptionInit = {
        type: 'answer',
        sdp: sdpAnswer
      };
      
      logger.log('WebRTC connection established with OpenAI', { 
        sessionId: this.sessionId 
      });
      console.log(`[OpenAIWebRTCSession] WebRTC connection established with OpenAI for session: ${this.sessionId}`);
      
      return answer;
    } catch (error) {
      logger.error('Failed to process offer', error);
      console.error(`[OpenAIWebRTCSession] Failed to process offer for session: ${this.sessionId}`, error);
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