/**
 * Voice AI SDK
 * JavaScript SDK for integrating voice assistant into any website
 * 
 * @version 1.0.0
 */

(function(window) {
    'use strict';
  
    // SDK Configuration
    const DEFAULT_CONFIG = {
      position: 'bottom-right',
      theme: 'light',
      language: 'en',
      customStyles: {}
    };
  
    // SDK Class
    class VoiceAI {
      constructor(config) {
        this.config = { ...DEFAULT_CONFIG, ...config };
        this.clientId = this.config.clientId;
        this.sessionId = null;
        this.isActive = false;
        this.isListening = false;
        this.audioContext = null;
        this.mediaStream = null;
        this.peerConnection = null;
        this.dataChannel = null;
        this.analyser = null;
        this.volumeInterval = null;
        this.currentVolume = 0;
        this.messages = [];
        this.ui = null;
        this.mode = 'idle';
        this.sessionValidationInProgress = false;
        
        // Validate required configuration
        let hasErrors = false;
        
        if (!this.clientId) {
          console.error('Voice AI SDK: Client ID is required. Please provide a valid clientId in the configuration.');
          hasErrors = true;
        }
        
        if (!this.config.serverUrl) {
          console.error('Voice AI SDK: Server URL is required. Please provide a valid serverUrl in the configuration.');
          console.error('Example: serverUrl: "https://voice-ai-sandy.vercel.app"');
          hasErrors = true;
        }
        
        // Check if serverUrl is a valid URL
        if (this.config.serverUrl) {
          try {
            new URL(this.config.serverUrl);
          } catch (e) {
            console.error(`Voice AI SDK: Invalid Server URL "${this.config.serverUrl}". Please provide a valid URL.`);
            hasErrors = true;
          }
        }
        
        // Log current domain for debugging
        console.log('Voice AI SDK: Current domain:', window.location.hostname);
        console.log('Voice AI SDK: Server URL:', this.config.serverUrl);
        
        if (hasErrors) {
          console.error('Voice AI SDK: Initialization failed due to configuration errors.');
          return;
        }
        
        // Initialize the SDK
        this._init();
      }
  
      /**
       * Initialize the SDK
       * @private
       */
      async _init() {
        try {
          // Load session from localStorage
          await this._loadSession();
          
          // Validate client
          await this._validateClient();
          
          // Create or restore session
          await this._initSession();
          
          // Create UI
          this._createUI();
          
          // Register event listeners
          this._registerEventListeners();
          
          // Call onReady callback
          if (typeof this.config.onReady === 'function') {
            this.config.onReady();
          }
        } catch (error) {
          console.error('Voice AI SDK: Initialization failed', error);
          
          // Call onError callback
          if (typeof this.config.onError === 'function') {
            this.config.onError(error);
          }
        }
      }
  
      /**
       * Load session from localStorage and validate it
       * @private
       */
      async _loadSession() {
        try {
          const savedSession = localStorage.getItem('voice_ai_session');
          if (savedSession) {
            const session = JSON.parse(savedSession);
            if (session.clientId === this.clientId) {
              console.log('Voice AI SDK: Found saved session', session.sessionId);
              
              // Проверяем валидность сессии перед использованием
              if (await this._validateSession(session.sessionId)) {
                this.sessionId = session.sessionId;
                console.log('Voice AI SDK: Session validated successfully', this.sessionId);
              } else {
                console.log('Voice AI SDK: Saved session is invalid, will create a new one');
                localStorage.removeItem('voice_ai_session');
                this.sessionId = null;
              }
            } else {
              console.log('Voice AI SDK: Saved session belongs to different client, will create a new one');
              localStorage.removeItem('voice_ai_session');
            }
          } else {
            console.log('Voice AI SDK: No saved session found');
          }
        } catch (error) {
          console.error('Voice AI SDK: Failed to load session', error);
          localStorage.removeItem('voice_ai_session');
          this.sessionId = null;
        }
      }
  
      /**
       * Validate if a session exists on the server
       * @private
       * @param {string} sessionId - The session ID to validate
       * @returns {Promise<boolean>} - Whether the session is valid
       */
      async _validateSession(sessionId) {
        if (this.sessionValidationInProgress) {
          console.log('Voice AI SDK: Session validation already in progress');
          return false;
        }
        
        this.sessionValidationInProgress = true;
        
        try {
          console.log('Voice AI SDK: Validating session', sessionId);
          const response = await fetch(`${this.config.serverUrl}/api/v1/sessions?sessionId=${sessionId}`, {
            method: 'GET'
          });
          
          this.sessionValidationInProgress = false;
          return response.ok;
        } catch (error) {
          console.error('Voice AI SDK: Session validation failed', error);
          this.sessionValidationInProgress = false;
          return false;
        }
      }
  
      /**
       * Save session to localStorage
       * @private
       */
      _saveSession() {
        try {
          localStorage.setItem('voice_ai_session', JSON.stringify({
            clientId: this.clientId,
            sessionId: this.sessionId
          }));
          console.log('Voice AI SDK: Session saved to localStorage', this.sessionId);
        } catch (error) {
          console.error('Voice AI SDK: Failed to save session', error);
        }
      }
  
      /**
       * Validate client with the server
       * @private
       */
      async _validateClient() {
        try {
          console.log(`Voice AI SDK: Validating client "${this.clientId}" with server at "${this.config.serverUrl}"`);
          console.log(`Voice AI SDK: Current page URL: ${window.location.href}`);
          
          const validateUrl = `${this.config.serverUrl}/api/v1/auth/validate`;
          console.log(`Voice AI SDK: Validation endpoint: ${validateUrl}`);
          
          const response = await fetch(validateUrl, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              clientId: this.clientId
            })
          });
          
          if (!response.ok) {
            const errorStatus = response.status;
            let errorData;
            
            try {
              errorData = await response.json();
            } catch (e) {
              // If response is not JSON
              throw new Error(`Server returned ${errorStatus} status code. Check if your domain is authorized for this client ID.`);
            }
            
            if (errorStatus === 403) {
              console.error(`Voice AI SDK: Domain "${window.location.hostname}" is not authorized for client "${this.clientId}".`);
              console.error('Voice AI SDK: Make sure your domain is added to the CLIENT_' + this.clientId + '_DOMAINS environment variable on the server.');
              throw new Error(errorData.error || `Domain not authorized. Status: ${errorStatus}`);
            } else {
              throw new Error(errorData.error || `Client validation failed. Status: ${errorStatus}`);
            }
          }
          
          const data = await response.json();
          
          if (!data.valid) {
            throw new Error(data.error || 'Client validation failed: Server returned invalid status');
          }
          
          console.log('Voice AI SDK: Client validated successfully');
        } catch (error) {
          console.error('Voice AI SDK: Client validation failed', error);
          
          // Check if it's a network error (CORS, connection refused, etc.)
          if (error.message.includes('NetworkError') || error.message.includes('Failed to fetch')) {
            console.error(`Voice AI SDK: Network error occurred. This might be due to CORS restrictions.`);
            console.error(`Voice AI SDK: Make sure your domain "${window.location.hostname}" is added to the CLIENT_${this.clientId}_DOMAINS environment variable on the server.`);
            console.error(`Voice AI SDK: Also check that the serverUrl "${this.config.serverUrl}" is correct and accessible.`);
          }
          
          throw error;
        }
      }
  
      /**
       * Initialize or restore session
       * @private
       */
      async _initSession() {
        try {
          if (!this.sessionId) {
            // Create a new session
            console.log('Voice AI SDK: Creating new session');
            const response = await fetch(`${this.config.serverUrl}/api/v1/sessions`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({
                clientId: this.clientId
              })
            });
            
            const data = await response.json();
            
            if (!response.ok) {
              throw new Error(data.error || 'Failed to create session');
            }
            
            this.sessionId = data.sessionId;
            console.log('Voice AI SDK: New session created', this.sessionId);
            this._saveSession();
          } else {
            console.log('Voice AI SDK: Using existing session', this.sessionId);
          }
        } catch (error) {
          console.error('Voice AI SDK: Session initialization failed', error);
          throw error;
        }
      }
  
      /**
       * Create UI elements
       * @private
       */
      _createUI() {
        // Create container
        const container = document.createElement('div');
        container.className = 'voice-ai-container';
        container.style.position = 'fixed';
        
        // Set position
        switch (this.config.position) {
          case 'bottom-right':
            container.style.bottom = '20px';
            container.style.right = '20px';
            break;
          case 'bottom-left':
            container.style.bottom = '20px';
            container.style.left = '20px';
            break;
          case 'top-right':
            container.style.top = '20px';
            container.style.right = '20px';
            break;
          case 'top-left':
            container.style.top = '20px';
            container.style.left = '20px';
            break;
          default:
            container.style.bottom = '20px';
            container.style.right = '20px';
        }
        
        // Create button
        const button = document.createElement('div');
        button.className = 'voice-ai-button';
        button.style.width = '64px';
        button.style.height = '64px';
        button.style.borderRadius = '50%';
        button.style.backgroundColor = this.config.customStyles.buttonColor || '#3a86ff';
        button.style.display = 'flex';
        button.style.alignItems = 'center';
        button.style.justifyContent = 'center';
        button.style.cursor = 'pointer';
        button.style.boxShadow = '0 4px 8px rgba(0, 0, 0, 0.2)';
        button.style.transition = 'all 0.3s ease';
        
        // Create animation container
        const animationContainer = document.createElement('div');
        animationContainer.className = 'voice-ai-animation';
        animationContainer.style.width = '100%';
        animationContainer.style.height = '100%';
        animationContainer.style.display = 'flex';
        animationContainer.style.alignItems = 'center';
        animationContainer.style.justifyContent = 'center';
        
        // Add idle animation (circle)
        const idleAnimation = document.createElement('div');
        idleAnimation.className = 'voice-ai-idle-animation';
        idleAnimation.style.width = '32px';
        idleAnimation.style.height = '32px';
        idleAnimation.style.display = 'flex';
        idleAnimation.style.alignItems = 'center';
        idleAnimation.style.justifyContent = 'center';
        idleAnimation.style.animation = 'voice-ai-pulse 2s infinite';
        
        // Add microphone icon
        const microphoneImg = document.createElement('img');
        microphoneImg.src = `${this.config.serverUrl || ''}/microphone.svg`;
        microphoneImg.alt = 'Microphone';
        microphoneImg.style.width = '24px';
        microphoneImg.style.height = '24px';
        
        // Add image to idle animation
        idleAnimation.appendChild(microphoneImg);
        
        // Add animation to container
        animationContainer.appendChild(idleAnimation);
        button.appendChild(animationContainer);
        container.appendChild(button);
        
        // Add styles
        const style = document.createElement('style');
        style.textContent = `
          @keyframes voice-ai-pulse {
            0% { transform: scale(0.8); opacity: 0.5; }
            50% { transform: scale(1); opacity: 1; }
            100% { transform: scale(0.8); opacity: 0.5; }
          }
          
          @keyframes voice-ai-thinking {
            0% { transform: scale(1) rotate(0deg); }
            50% { transform: scale(1.2) rotate(180deg); }
            100% { transform: scale(1) rotate(360deg); }
          }
          
          @keyframes voice-ai-volume {
            0% { height: 10px; }
            50% { height: 30px; }
            100% { height: 10px; }
          }
        `;
        
        document.head.appendChild(style);
        document.body.appendChild(container);
        
        // Store UI elements
        this.ui = {
          container,
          button,
          animationContainer,
          idleAnimation
        };
        
        // Add click event listener
        button.addEventListener('click', () => {
          this.toggleSession();
        });
      }
  
      /**
       * Register event listeners
       * @private
       */
      _registerEventListeners() {
        // Window beforeunload event
        window.addEventListener('beforeunload', () => {
          if (this.isActive) {
            this.stopSession();
          }
        });
      }
  
      /**
       * Update UI based on mode
       * @private
       * @param {string} mode - The mode to set
       */
      _updateUI(mode, volume = 0) {
        // Store current UI mode
        this.uiMode = mode;
        
        if (!this.ui) return;
        
        const button = this.ui.button;
        const buttonContainer = this.ui.animationContainer;
        const statusText = this.ui.container.querySelector('.voice-ai-status');
        const microphoneImg = this.ui.idleAnimation.querySelector('img');
        
        if (!button || !buttonContainer) return;
        
        // Reset all classes
        button.classList.remove(
          'voice-ai-active',
          'voice-ai-thinking',
          'voice-ai-responding',
          'voice-ai-error'
        );
        
        // Hide/show microphone based on mode
        if (microphoneImg) {
          if (mode === 'inactive' || mode === 'idle') {
            microphoneImg.style.display = 'block';
          } else {
            microphoneImg.style.display = 'none';
          }
        }
        
        // Update UI based on mode
        switch (mode) {
          case 'active':
            button.classList.add('voice-ai-active');
            if (statusText) statusText.textContent = 'Listening...';
            break;
            
          case 'thinking':
            button.classList.add('voice-ai-thinking');
            if (statusText) statusText.textContent = 'Thinking...';
            break;
            
          case 'responding':
            button.classList.add('voice-ai-responding');
            if (statusText) statusText.textContent = 'Responding...';
            break;
            
          case 'error':
            button.classList.add('voice-ai-error');
            if (statusText) statusText.textContent = 'Error';
            break;
            
          case 'volume':
            button.classList.add('voice-ai-active');
            if (statusText) statusText.textContent = 'Listening...';
            
            // Handle volume visualization
            let volumeIndicator = this.ui.animationContainer.querySelector('.voice-ai-volume-indicator');
            
            if (!volumeIndicator) {
              // Create volume visualization if it doesn't exist
              volumeIndicator = document.createElement('div');
              volumeIndicator.className = 'voice-ai-volume-indicator';
              volumeIndicator.style.display = 'flex';
              volumeIndicator.style.justifyContent = 'center';
              volumeIndicator.style.alignItems = 'flex-end';
              volumeIndicator.style.height = '50px';
              volumeIndicator.style.gap = '5px';
              volumeIndicator.style.position = 'absolute';
              volumeIndicator.style.bottom = '80px';
              volumeIndicator.style.left = '50%';
              volumeIndicator.style.transform = 'translateX(-50%)';
              
              // Create volume bars
              for (let i = 0; i < 4; i++) {
                const bar = document.createElement('div');
                bar.className = 'voice-ai-volume-bar';
                bar.style.width = '4px';
                bar.style.backgroundColor = '#3b82f6';
                bar.style.borderRadius = '2px';
                bar.style.height = '10px';
                bar.style.transition = 'height 0.1s ease';
                volumeIndicator.appendChild(bar);
              }
              
              // Add to container
              buttonContainer.appendChild(volumeIndicator);
            }
            
            // Update volume bars
            const bars = volumeIndicator.querySelectorAll('.voice-ai-volume-bar');
            bars.forEach(bar => {
              // Randomize heights slightly for visual effect
              const randomFactor = 0.8 + Math.random() * 0.4;
              const height = Math.max(10, Math.min(50, volume * 500 * randomFactor));
              bar.style.height = `${height}px`;
            });
            
            volumeIndicator.style.display = 'flex';
            break;
            
          case 'inactive':
          case 'idle':
          default:
            if (statusText) statusText.textContent = 'Click to talk';
            
            // Hide volume indicator if it exists
            const volIndicator = this.ui.animationContainer.querySelector('.voice-ai-volume-indicator');
            if (volIndicator) {
              volIndicator.style.display = 'none';
            }
            break;
        }
      }
  
      /**
       * Configure the WebRTC session
       * @private
       */
      async _configureSession() {
        try {
          console.log('Voice AI SDK: Configuring session with ID:', this.sessionId);
          
          // Create offer
          const offer = await this.peerConnection.createOffer();
          await this.peerConnection.setLocalDescription(offer);
          
          // Send offer to our server
          const response = await fetch(`${this.config.serverUrl}/api/v1/voice/process`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              clientId: this.clientId,
              sessionId: this.sessionId,
              offer: this.peerConnection.localDescription,
              voice: this.config.voice || 'alloy'
            })
          });
          
          const data = await response.json();
          
          if (!response.ok) {
            const errorMessage = data.error || 'Failed to configure session';
            
            // Если сервер вернул новый ID сессии, используем его
            if (response.status === 404 && data.newSessionId) {
              console.log('Voice AI SDK: Server provided new session ID:', data.newSessionId);
              this.sessionId = data.newSessionId;
              this._saveSession();
              // Пробуем снова с новой сессией
              return this._configureSession();
            }
            
            // Если сессия не найдена, пробуем создать новую
            if (response.status === 404 && errorMessage.includes('Session not found')) {
              console.log('Voice AI SDK: Session not found, creating a new one');
              this.sessionId = null;
              localStorage.removeItem('voice_ai_session');
              await this._initSession();
              // Пробуем снова с новой сессией
              return this._configureSession();
            }
            
            throw new Error(errorMessage);
          }
          
          // Set remote description
          await this.peerConnection.setRemoteDescription(data.answer);
          
          // Save instructions
          this.instructions = data.instructions;
          
          // Update UI
          this._updateUI('idle');
          
          return true;
        } catch (error) {
          console.error('Voice AI SDK: Session configuration failed', error);
          this._updateUI('error');
          throw error;
        }
      }
  
      /**
       * Data channel open handler
       * @private
       */
      _onDataChannelOpen() {
        console.log('Voice AI SDK: Data channel opened');
        
        // Configure session
        this._configureDataChannel();
        
        // Update UI
        this._updateUI('idle');
      }
  
      /**
       * Configure data channel with session settings and initial prompt
       * @private
       */
      _configureDataChannel() {
        if (!this.dataChannel || this.dataChannel.readyState !== 'open') {
          console.log('Voice AI SDK: Data channel not open, cannot configure');
          return;
        }

        console.log('Voice AI SDK: Configuring data channel');

        // Send messages in sequence with proper timing
        const sendMessages = async () => {
          try {
            // 1. Send session update
            console.log('Voice AI SDK: Sending session update');
            const sessionUpdate = {
              type: 'session.update',
              session: {
                modalities: ['text', 'audio'],
                tools: [],
                turn_detection: {
                  type: 'server_vad',
                  threshold: 0.5,
                  prefix_padding_ms: 300,
                  silence_duration_ms: 200,
                  create_response: true
                },
                instructions: this.instructions
              }
            };
            
            if (this.dataChannel && this.dataChannel.readyState === 'open') {
              this.dataChannel.send(JSON.stringify(sessionUpdate));
              
              // Wait for a short time to ensure session update is processed
              await new Promise(resolve => setTimeout(resolve, 300));
              
              // 2. Send initial message
              if (this.dataChannel && this.dataChannel.readyState === 'open') {
                console.log('Voice AI SDK: Sending initial message');
                const startPrompt = {
                  type: 'conversation.item.create',
                  item: {
                    type: 'message',
                    role: 'user',
                    content: [{
                      type: 'input_text',
                      text: 'Begin the conversation by introducing yourself as an Improvado representative'
                    }]
                  }
                };
                
                this.dataChannel.send(JSON.stringify(startPrompt));
                
                // Wait again before sending response.create
                await new Promise(resolve => setTimeout(resolve, 300));
                
                // 3. Request response creation
                if (this.dataChannel && this.dataChannel.readyState === 'open') {
                  console.log('Voice AI SDK: Requesting response creation');
                  const createResponse = {
                    type: 'response.create'
                  };
                  
                  this.dataChannel.send(JSON.stringify(createResponse));
                }
              }
            }
          } catch (error) {
            console.error('Voice AI SDK: Error sending messages:', error);
          }
        };
        
        // Start the message sequence
        sendMessages();
      }
  
      /**
       * Data channel message handler
       * @private
       * @param {MessageEvent} event - The message event
       */
      _onDataChannelMessage(event) {
        try {
          // Handle empty messages
          if (!event.data) {
            console.warn('Voice AI SDK: Received empty message');
            return;
          }
          
          // Parse the message
          const message = JSON.parse(event.data);
          
          // Handle messages without type
          if (!message.type) {
            console.warn('Voice AI SDK: Received message without type', message);
            return;
          }
          
          console.log('Voice AI SDK: Received message', message.type);
          
          // Add the message to the messages array
          this.messages.push(message);
          
          // Handle different message types
          switch (message.type) {
            case 'input_audio_buffer.speech_started':
              console.log('Voice AI SDK: Speech started');
              this._updateUI('thinking');
              break;
              
            case 'conversation.item.created':
              console.log('Voice AI SDK: Conversation item created');
              this._updateUI('responding');
              break;
              
            case 'conversation.item.completed':
              console.log('Voice AI SDK: Conversation item completed');
              this._updateUI('idle');
              break;
              
            case 'response.function_call_arguments.done':
              console.log('Voice AI SDK: Function call arguments done');
              // Handle function calls if needed
              break;
              
            default:
              // No special handling for other message types
              break;
          }
          
          // Dispatch an event for external listeners
          const customEvent = new CustomEvent('voice-ai-message', {
            detail: { message }
          });
          window.dispatchEvent(customEvent);
          
        } catch (error) {
          console.error('Voice AI SDK: Error parsing message', error);
        }
      }
  
      /**
       * Data channel close handler
       * @private
       */
      _onDataChannelClose() {
        console.log('Voice AI SDK: Data channel closed');
        this.isListening = false;
      }
  
      /**
       * Data channel error handler
       * @private
       * @param {Event} error - The error event
       */
      _onDataChannelError(error) {
        console.error('Voice AI SDK: Data channel error', error);
      }
  
      /**
       * ICE candidate handler
       * @private
       * @param {RTCPeerConnectionIceEvent} event - The ICE candidate event
       */
      _onIceCandidate(event) {
        if (event.candidate) {
          console.log('Voice AI SDK: New ICE candidate', event.candidate);
        }
      }
  
      /**
       * Connection state change handler
       * @private
       */
      _onConnectionStateChange() {
        if (!this.peerConnection) return;
        
        console.log('Voice AI SDK: Connection state changed to', this.peerConnection.connectionState);
        
        switch (this.peerConnection.connectionState) {
          case 'connected':
            console.log('Voice AI SDK: WebRTC connection established');
            this._updateUI('idle');
            break;
            
          case 'disconnected':
          case 'failed':
            console.log('Voice AI SDK: WebRTC connection lost');
            // Don't automatically close the session, just update UI
            this._updateUI('error');
            break;
            
          case 'closed':
            console.log('Voice AI SDK: WebRTC connection closed');
            this._updateUI('inactive');
            break;
        }
      }
  
      /**
       * Clean up WebRTC resources
       * @private
       */
      _cleanupWebRTC() {
        // Stop volume detection
        this._stopVolumeDetection();
        
        // Close data channel
        if (this.dataChannel) {
          this.dataChannel.close();
          this.dataChannel = null;
        }
        
        // Close peer connection
        if (this.peerConnection) {
          this.peerConnection.close();
          this.peerConnection = null;
        }
        
        // Stop media stream
        if (this.mediaStream) {
          this.mediaStream.getTracks().forEach(track => track.stop());
          this.mediaStream = null;
        }
        
        // Close audio context
        if (this.audioContext) {
          this.audioContext.close().catch(console.error);
          this.audioContext = null;
          this.analyser = null;
        }
        
        // Reset state
        this.isListening = false;
        this.currentVolume = 0;
        
        // Update UI
        this._updateUI('idle');
      }
  
      /**
       * Start a new session
       * @public
       */
      async startSession() {
        if (this.isActive) return;
        
        try {
          // Initialize WebRTC
          await this._initWebRTC();
          
          // Configure session
          await this._configureSession();
          
          // Set active state
          this.isActive = true;
          this.isListening = true;
          
          // Call onStart callback
          if (typeof this.config.onStart === 'function') {
            this.config.onStart();
          }
        } catch (error) {
          console.error('Voice AI SDK: Failed to start session', error);
          
          // Clean up resources
          this._cleanupWebRTC();
          
          // Call onError callback
          if (typeof this.config.onError === 'function') {
            this.config.onError(error);
          }
        }
      }
  
      /**
       * Stop the current session
       * @public
       */
      stopSession() {
        console.log('Voice AI SDK: Stopping session');
        
        // Clear volume detection interval
        if (this.volumeInterval) {
          clearInterval(this.volumeInterval);
          this.volumeInterval = null;
        }
        
        // Clear volume timeout
        if (this.volumeTimeout) {
          clearTimeout(this.volumeTimeout);
          this.volumeTimeout = null;
        }
        
        // Close audio context
        if (this.audioContext) {
          this.audioContext.close().catch(console.error);
          this.audioContext = null;
          this.analyser = null;
        }
        
        // Clean up WebRTC resources
        this._cleanupWebRTC();
        
        // Set active state
        this.isActive = false;
        
        // Call onEnd callback
        if (typeof this.config.onEnd === 'function') {
          this.config.onEnd();
        }
      }
  
      /**
       * Toggle session state
       * @public
       */
      toggleSession() {
        if (this.isActive) {
          this.stopSession();
        } else {
          this.startSession();
        }
      }
      
      /**
       * Initialize WebRTC
       * @private
       */
      async _initWebRTC() {
        try {
          console.log('Voice AI SDK: Initializing WebRTC');
          
          // Create a new RTCPeerConnection
          this.peerConnection = new RTCPeerConnection({
            iceServers: [
              { urls: 'stun:stun.l.google.com:19302' }
            ]
          });
          
          // Set up event handlers
          this.peerConnection.onicecandidate = this._onIceCandidate.bind(this);
          this.peerConnection.onconnectionstatechange = this._onConnectionStateChange.bind(this);
          
          // Get user media
          this.stream = await navigator.mediaDevices.getUserMedia({ audio: true });
          
          // Set up audio visualization
          this._setupAudioVisualization(this.stream);
          
          // Add the audio track to the peer connection
          this.stream.getAudioTracks().forEach(track => {
            this.peerConnection.addTrack(track, this.stream);
          });
          
          // Set up audio output
          this.audioElement = document.createElement('audio');
          this.audioElement.autoplay = true;
          
          this.peerConnection.ontrack = (event) => {
            console.log('Voice AI SDK: Received audio track');
            this.audioElement.srcObject = event.streams[0];
          };
          
          // Create a data channel
          this.dataChannel = this.peerConnection.createDataChannel('response');
          this.dataChannel.onopen = this._onDataChannelOpen.bind(this);
          this.dataChannel.onmessage = this._onDataChannelMessage.bind(this);
          this.dataChannel.onclose = this._onDataChannelClose.bind(this);
          this.dataChannel.onerror = this._onDataChannelError.bind(this);
          
          // Create an offer
          const offer = await this.peerConnection.createOffer();
          await this.peerConnection.setLocalDescription(offer);
          
          console.log('Voice AI SDK: Created offer');
          
          return true;
        } catch (error) {
          console.error('Voice AI SDK: Error initializing WebRTC', error);
          this._updateUI('error');
          return false;
        }
      }
  
      _setupAudioVisualization(stream) {
        try {
          // Create audio context
          const audioContext = new (window.AudioContext || window.webkitAudioContext)();
          const source = audioContext.createMediaStreamSource(stream);
          const analyser = audioContext.createAnalyser();
          analyser.fftSize = 256;
          
          source.connect(analyser);
          
          // Set up volume detection
          const bufferLength = analyser.frequencyBinCount;
          const dataArray = new Uint8Array(bufferLength);
          
          const getVolume = () => {
            analyser.getByteTimeDomainData(dataArray);
            
            let sum = 0;
            for (let i = 0; i < dataArray.length; i++) {
              const float = (dataArray[i] - 128) / 128;
              sum += float * float;
            }
            
            return Math.sqrt(sum / dataArray.length);
          };
          
          // Start volume detection interval
          this.volumeInterval = setInterval(() => {
            const volume = getVolume();
            
            // Update UI based on volume
            if (volume > 0.02) {
              this._updateUI('volume', volume);
            } else if (this.uiMode === 'volume') {
              // Delay switching back to idle to prevent flickering
              if (!this.volumeTimeout) {
                this.volumeTimeout = setTimeout(() => {
                  this._updateUI('idle');
                  this.volumeTimeout = null;
                }, 500);
              }
            }
          }, 100);
          
          this.audioContext = audioContext;
          this.analyser = analyser;
          
        } catch (error) {
          console.error('Voice AI SDK: Error setting up audio visualization', error);
        }
      }
  
      /**
       * Start volume detection
       * @private
       */
      _startVolumeDetection() {
        if (!this.analyser) return;
        
        const bufferLength = this.analyser.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);
        
        this.volumeInterval = setInterval(() => {
          if (!this.analyser) return;
          
          this.analyser.getByteFrequencyData(dataArray);
          
          let sum = 0;
          for (let i = 0; i < bufferLength; i++) {
            sum += dataArray[i];
          }
          
          this.currentVolume = sum / bufferLength / 255;
          
          if (this.isListening && this.currentVolume > 0.02) {
            this._updateUI('volume');
          } else if (this.mode === 'volume') {
            this._updateUI('idle');
          }
        }, 100);
      }
  
      /**
       * Stop volume detection
       * @private
       */
      _stopVolumeDetection() {
        if (this.volumeInterval) {
          clearInterval(this.volumeInterval);
          this.volumeInterval = null;
        }
      }
    }
  
    // Create SDK instance
    const init = (config) => {
      return new VoiceAI(config);
    };
  
    // Export SDK
    window.VoiceAI = {
      init
    };
  })(window);