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
      serverUrl: window.location.origin,
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
        
        // Validate required configuration
        if (!this.clientId) {
          console.error('Voice AI SDK: Client ID is required');
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
          this._loadSession();
          
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
       * Load session from localStorage
       * @private
       */
      _loadSession() {
        try {
          const savedSession = localStorage.getItem('voice_ai_session');
          if (savedSession) {
            const session = JSON.parse(savedSession);
            if (session.clientId === this.clientId) {
              this.sessionId = session.sessionId;
            }
          }
        } catch (error) {
          console.error('Voice AI SDK: Failed to load session', error);
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
          const response = await fetch(`${this.config.serverUrl}/api/v1/auth/validate`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              clientId: this.clientId
            })
          });
          
          const data = await response.json();
          
          if (!response.ok || !data.valid) {
            throw new Error(data.error || 'Client validation failed');
          }
        } catch (error) {
          console.error('Voice AI SDK: Client validation failed', error);
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
            this._saveSession();
          } else {
            // Validate existing session
            const response = await fetch(`${this.config.serverUrl}/api/v1/sessions?sessionId=${this.sessionId}`, {
              method: 'GET'
            });
            
            if (!response.ok) {
              // Session not found or expired, create a new one
              return this._initSession();
            }
          }
        } catch (error) {
          console.error('Voice AI SDK: Session initialization failed', error);
          throw error;
        }
      }
  
      /**
       * Fetch agent instructions from server
       * @private
       */
      async _fetchInstructions() {
        try {
          const response = await fetch(`${this.config.serverUrl}/api/v1/instructions?clientId=${this.clientId}`, {
            method: 'GET'
          });
          
          if (!response.ok) {
            console.warn('Voice AI SDK: Failed to fetch instructions, using default');
            return this.config.instructions || 'You are a helpful voice assistant.';
          }
          
          const data = await response.json();
          return data.instructions;
        } catch (error) {
          console.error('Voice AI SDK: Failed to fetch instructions', error);
          return this.config.instructions || 'You are a helpful voice assistant.';
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
        idleAnimation.style.borderRadius = '50%';
        idleAnimation.style.backgroundColor = '#ffffff';
        idleAnimation.style.opacity = '0.8';
        idleAnimation.style.animation = 'voice-ai-pulse 2s infinite';
        
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
      _updateUI(mode) {
        if (!this.ui) return;
        
        this.mode = mode;
        
        // Clear animation container
        while (this.ui.animationContainer.firstChild) {
          this.ui.animationContainer.removeChild(this.ui.animationContainer.firstChild);
        }
        
        switch (mode) {
          case 'idle':
            // Add idle animation (circle)
            const idleAnimation = document.createElement('div');
            idleAnimation.className = 'voice-ai-idle-animation';
            idleAnimation.style.width = '32px';
            idleAnimation.style.height = '32px';
            idleAnimation.style.borderRadius = '50%';
            idleAnimation.style.backgroundColor = '#ffffff';
            idleAnimation.style.opacity = '0.8';
            idleAnimation.style.animation = 'voice-ai-pulse 2s infinite';
            this.ui.animationContainer.appendChild(idleAnimation);
            this.ui.idleAnimation = idleAnimation;
            break;
            
          case 'thinking':
            // Add thinking animation (rotating circle)
            const thinkingAnimation = document.createElement('div');
            thinkingAnimation.className = 'voice-ai-thinking-animation';
            thinkingAnimation.style.width = '32px';
            thinkingAnimation.style.height = '32px';
            thinkingAnimation.style.borderRadius = '50%';
            thinkingAnimation.style.border = '3px solid #ffffff';
            thinkingAnimation.style.borderTopColor = 'transparent';
            thinkingAnimation.style.animation = 'voice-ai-thinking 1s infinite linear';
            this.ui.animationContainer.appendChild(thinkingAnimation);
            break;
            
          case 'responding':
            // Add responding animation (brain icon)
            const respondingAnimation = document.createElement('div');
            respondingAnimation.className = 'voice-ai-responding-animation';
            respondingAnimation.style.width = '32px';
            respondingAnimation.style.height = '32px';
            respondingAnimation.style.backgroundImage = "url('data:image/svg+xml;utf8,<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 24 24\" fill=\"white\"><path d=\"M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-1-13h2v6h-2zm0 8h2v2h-2z\"/></svg>')";
            respondingAnimation.style.backgroundSize = 'contain';
            respondingAnimation.style.backgroundRepeat = 'no-repeat';
            respondingAnimation.style.animation = 'voice-ai-pulse 2s infinite';
            this.ui.animationContainer.appendChild(respondingAnimation);
            break;
            
          case 'volume':
            // Add volume animation (equalizer bars)
            const volumeContainer = document.createElement('div');
            volumeContainer.className = 'voice-ai-volume-container';
            volumeContainer.style.display = 'flex';
            volumeContainer.style.alignItems = 'center';
            volumeContainer.style.justifyContent = 'center';
            volumeContainer.style.gap = '3px';
            volumeContainer.style.height = '32px';
            
            for (let i = 0; i < 4; i++) {
              const bar = document.createElement('div');
              bar.className = 'voice-ai-volume-bar';
              bar.style.width = '4px';
              bar.style.height = `${10 + Math.random() * 20}px`;
              bar.style.backgroundColor = '#ffffff';
              bar.style.borderRadius = '2px';
              bar.style.animation = `voice-ai-volume ${0.5 + Math.random() * 0.5}s infinite`;
              bar.style.animationDelay = `${i * 0.1}s`;
              volumeContainer.appendChild(bar);
            }
            
            this.ui.animationContainer.appendChild(volumeContainer);
            break;
        }
      }
  
      /**
       * Get ephemeral token for OpenAI
       * @private
       * @returns {Promise<string>} The ephemeral token
       */
      async _getEphemeralToken() {
        try {
          const response = await fetch(`${this.config.serverUrl}/api/v1/voice/token`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              clientId: this.clientId,
              sessionId: this.sessionId
            })
          });
          
          const data = await response.json();
          
          if (!response.ok) {
            throw new Error(data.error || 'Failed to get ephemeral token');
          }
          
          return data.client_secret.value;
        } catch (error) {
          console.error('Voice AI SDK: Failed to get ephemeral token', error);
          throw error;
        }
      }
  
      /**
       * Initialize WebRTC
       * @private
       */
      async _initWebRTC() {
        try {
          // Create audio context
          this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
          
          // Get user media
          this.mediaStream = await navigator.mediaDevices.getUserMedia({
            audio: true,
            video: false
          });
          
          // Create analyser for volume detection
          this.analyser = this.audioContext.createAnalyser();
          this.analyser.fftSize = 1024;
          
          // Connect media stream to analyser
          const source = this.audioContext.createMediaStreamSource(this.mediaStream);
          source.connect(this.analyser);
          
          // Create peer connection
          this.peerConnection = new RTCPeerConnection({
            iceServers: [
              { urls: 'stun:stun.l.google.com:19302' }
            ]
          });
          
          // Add audio track to peer connection
          this.mediaStream.getAudioTracks().forEach(track => {
            this.peerConnection.addTrack(track, this.mediaStream);
          });
          
          // Create data channel
          this.dataChannel = this.peerConnection.createDataChannel('audio');
          
          // Set up data channel event handlers
          this.dataChannel.onopen = this._onDataChannelOpen.bind(this);
          this.dataChannel.onmessage = this._onDataChannelMessage.bind(this);
          this.dataChannel.onclose = this._onDataChannelClose.bind(this);
          this.dataChannel.onerror = this._onDataChannelError.bind(this);
          
          // Set up peer connection event handlers
          this.peerConnection.onicecandidate = this._onIceCandidate.bind(this);
          this.peerConnection.onconnectionstatechange = this._onConnectionStateChange.bind(this);
          
          // Create offer
          const offer = await this.peerConnection.createOffer();
          await this.peerConnection.setLocalDescription(offer);
          
          // Start volume detection
          this._startVolumeDetection();
          
          // Update UI
          this._updateUI('idle');
        } catch (error) {
          console.error('Voice AI SDK: WebRTC initialization failed', error);
          throw error;
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
  
      /**
       * Data channel open handler
       * @private
       */
      _onDataChannelOpen() {
        console.log('Voice AI SDK: Data channel open');
        
        // Configure session
        this._configureSession();
      }
  
      /**
       * Configure session
       * @private
       */
      async _configureSession() {
        if (!this.dataChannel || this.dataChannel.readyState !== 'open') return;
        
        try {
          // Get ephemeral token
          const token = await this._getEphemeralToken();
          
          // Send session configuration
          const sessionConfig = {
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
              instructions: await this._fetchInstructions()
            }
          };
          
          this.dataChannel.send(JSON.stringify(sessionConfig));
          
          // Send authentication
          const auth = {
            type: 'auth',
            client_secret: token
          };
          
          this.dataChannel.send(JSON.stringify(auth));
          
          // Send voice configuration
          const voiceConfig = {
            type: 'voice.update',
            voice: {
              voice_id: this.config.voice || 'alloy'
            }
          };
          
          this.dataChannel.send(JSON.stringify(voiceConfig));
          
          // Set listening state
          this.isListening = true;
        } catch (error) {
          console.error('Voice AI SDK: Session configuration failed', error);
          this.stopSession();
        }
      }
  
      /**
       * Data channel message handler
       * @private
       * @param {MessageEvent} event - The message event
       */
      _onDataChannelMessage(event) {
        try {
          const message = JSON.parse(event.data);
          
          // Add message to messages array
          this.messages.push(message);
          
          // Handle different message types
          switch (message.type) {
            case 'input_audio_buffer.speech_started':
              this._updateUI('thinking');
              break;
              
            case 'conversation.item.created':
              this._updateUI('responding');
              break;
              
            case 'conversation.item.completed':
              this._updateUI('idle');
              break;
          }
        } catch (error) {
          console.error('Voice AI SDK: Failed to parse message', error);
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
        console.log('Voice AI SDK: Connection state changed', this.peerConnection.connectionState);
        
        if (this.peerConnection.connectionState === 'disconnected' || 
            this.peerConnection.connectionState === 'failed' || 
            this.peerConnection.connectionState === 'closed') {
          this.stopSession();
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
          this.audioContext.close();
          this.audioContext = null;
        }
        
        // Reset analyser
        this.analyser = null;
        
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
          
          // Set active state
          this.isActive = true;
          
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
        if (!this.isActive) return;
        
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