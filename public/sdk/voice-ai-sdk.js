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
      customStyles: {},
      debug: false // Add debug mode option, disabled by default
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
        this.meetingUrl = this.config.meetingUrl;
        this.toolHandlers = {};
        this._startSessionInProgress = false;
        this.debug = this.config.debug || false; // Store debug mode setting
        
        // Add logger methods that respect debug mode
        this.logger = {
          log: (message, ...args) => {
            console.log(message, ...args);
          },
          debug: (message, ...args) => {
            if (this.debug) {
              console.log(`[DEBUG] ${message}`, ...args);
            }
          },
          error: (message, ...args) => {
            console.error(message, ...args);
          },
          warn: (message, ...args) => {
            console.warn(message, ...args);
          }
        };
        
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
        
        if (!this.meetingUrl) {
          console.error('Voice AI SDK: Meeting URL is required. Please provide a valid meetingUrl in the configuration.');
          console.error('Example: meetingUrl: "https://calendly.com/your-company/meeting"');
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
        
        // Check if meetingUrl is a valid URL
        if (this.meetingUrl) {
          try {
            new URL(this.meetingUrl);
          } catch (e) {
            console.error(`Voice AI SDK: Invalid Meeting URL "${this.meetingUrl}". Please provide a valid URL.`);
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
          
          // Register tool handlers
          this._registerToolHandlers();
          
          // Call onReady callback
          if (typeof this.config.onReady === 'function') {
            this.config.onReady();
          }
        } catch (error) {
          console.error('Voice AI SDK: Initialization error', error);
          
          // Call onError callback
          if (typeof this.config.onError === 'function') {
            this.config.onError(error);
          }
        }
      }
  
      /**
       * Register tool handlers for AI agent function calls
       * @private
       */
      _registerToolHandlers() {
        // Register the show_booking_popup tool
        this.toolHandlers['show_booking_popup'] = (args) => {
          return this._showBookingPopup(args.message);
        };
        
        console.log('Voice AI SDK: Registered tool handlers', Object.keys(this.toolHandlers));
      }
      
      /**
       * Show booking popup with a message and a button to book a meeting
       * @private
       * @param {string} message - The message to display in the popup
       * @returns {Object} - Result of the function call
       */
      _showBookingPopup(message) {
        console.log('Voice AI SDK: Showing booking popup', message);
        
        // Create popup container
        const popupContainer = document.createElement('div');
        popupContainer.className = 'voice-ai-booking-popup';
        popupContainer.style.position = 'fixed';
        popupContainer.style.bottom = '100px';
        popupContainer.style.right = '20px';
        popupContainer.style.width = '300px';
        popupContainer.style.padding = '20px';
        popupContainer.style.backgroundColor = '#ffffff';
        popupContainer.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.15)';
        popupContainer.style.borderRadius = '8px';
        popupContainer.style.zIndex = '10000';
        popupContainer.style.fontFamily = 'Arial, sans-serif';
        popupContainer.style.display = 'flex';
        popupContainer.style.flexDirection = 'column';
        popupContainer.style.gap = '15px';
        
        // Create message element
        const messageElement = document.createElement('div');
        messageElement.textContent = message || 'Would you like to schedule a meeting with our team?';
        messageElement.style.fontSize = '14px';
        messageElement.style.lineHeight = '1.5';
        messageElement.style.color = '#333333';
        
        // Create button
        const bookButton = document.createElement('a');
        bookButton.href = this.meetingUrl;
        bookButton.target = '_blank';
        bookButton.textContent = 'Book a Meeting';
        bookButton.style.display = 'inline-block';
        bookButton.style.padding = '10px 16px';
        bookButton.style.backgroundColor = '#4a90e2';
        bookButton.style.color = '#ffffff';
        bookButton.style.textDecoration = 'none';
        bookButton.style.borderRadius = '4px';
        bookButton.style.fontWeight = 'bold';
        bookButton.style.textAlign = 'center';
        bookButton.style.cursor = 'pointer';
        bookButton.style.transition = 'background-color 0.2s';
        
        // Hover effect
        bookButton.onmouseover = () => {
          bookButton.style.backgroundColor = '#3a80d2';
        };
        bookButton.onmouseout = () => {
          bookButton.style.backgroundColor = '#4a90e2';
        };
        
        // Create close button
        const closeButton = document.createElement('button');
        closeButton.textContent = '×';
        closeButton.style.position = 'absolute';
        closeButton.style.top = '10px';
        closeButton.style.right = '10px';
        closeButton.style.background = 'none';
        closeButton.style.border = 'none';
        closeButton.style.fontSize = '20px';
        closeButton.style.cursor = 'pointer';
        closeButton.style.color = '#999999';
        closeButton.style.padding = '0';
        closeButton.style.lineHeight = '1';
        
        // Close button event
        closeButton.onclick = () => {
          document.body.removeChild(popupContainer);
        };
        
        // Add elements to popup
        popupContainer.appendChild(closeButton);
        popupContainer.appendChild(messageElement);
        popupContainer.appendChild(bookButton);
        
        // Add popup to body
        document.body.appendChild(popupContainer);
        
        // Auto-close after 30 seconds
        setTimeout(() => {
          if (document.body.contains(popupContainer)) {
            document.body.removeChild(popupContainer);
          }
        }, 30000);
        
        // Stop the session after a short delay to allow the AI to finish speaking
        setTimeout(() => {
          if (this.isActive) {
            console.log('Voice AI SDK: Auto-stopping session after showing booking popup');
            this.stopSession();
          }
        }, 10000);
        
        return { success: true, message: 'Booking popup displayed' };
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
          
          // Try up to 3 times with a delay between attempts
          for (let attempt = 1; attempt <= 3; attempt++) {
            try {
              const response = await fetch(`${this.config.serverUrl}/api/v1/sessions?sessionId=${sessionId}`, {
                method: 'GET'
              });
              
              if (response.ok) {
                this.sessionValidationInProgress = false;
                console.log('Voice AI SDK: Session validated successfully on attempt', attempt);
                return true;
              }
              
              // If this is not the last attempt, wait before retrying
              if (attempt < 3) {
                console.log(`Voice AI SDK: Session validation failed on attempt ${attempt}, retrying in 1 second...`);
                await new Promise(resolve => setTimeout(resolve, 1000));
              }
            } catch (fetchError) {
              console.error('Voice AI SDK: Error during session validation attempt', fetchError);
              
              // If this is not the last attempt, wait before retrying
              if (attempt < 3) {
                console.log(`Voice AI SDK: Session validation error on attempt ${attempt}, retrying in 1 second...`);
                await new Promise(resolve => setTimeout(resolve, 1000));
              }
            }
          }
          
          console.log('Voice AI SDK: Session validation failed after 3 attempts');
          this.sessionValidationInProgress = false;
          return false;
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
            this.logger.log('Creating new session');
            
            // Try up to 3 times with a delay between attempts
            for (let attempt = 1; attempt <= 3; attempt++) {
              try {
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
                
                if (response.ok) {
                  this.sessionId = data.sessionId;
                  this.logger.log('New session created', this.sessionId);
                  this._saveSession();
                  
                  // Add a small delay to ensure the session is fully registered on the server
                  this.logger.debug('Waiting for session to be fully registered...');
                  await new Promise(resolve => setTimeout(resolve, 500));
                  
                  return;
                }
                
                // If this is not the last attempt, wait before retrying
                if (attempt < 3) {
                  this.logger.debug(`Session creation failed on attempt ${attempt}, retrying in 1 second...`);
                  await new Promise(resolve => setTimeout(resolve, 1000));
                } else {
                  throw new Error(data.error || 'Failed to create session after 3 attempts');
                }
              } catch (fetchError) {
                // If this is not the last attempt, wait before retrying
                if (attempt < 3) {
                  this.logger.debug(`Session creation error on attempt ${attempt}, retrying in 1 second...`);
                  await new Promise(resolve => setTimeout(resolve, 1000));
                } else {
                  throw fetchError;
                }
              }
            }
          } else {
            this.logger.log('Using existing session', this.sessionId);
          }
        } catch (error) {
          this.logger.error('Session initialization failed', error);
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
        const microphoneImg = this.ui.idleAnimation?.querySelector('img');
        
        if (!button || !buttonContainer) return;
        
        // Clear existing animations
        while (buttonContainer.firstChild) {
          buttonContainer.removeChild(buttonContainer.firstChild);
        }
        
        // Update UI based on mode
        switch (mode) {
          case 'loading':
            // Show loading animation (pulsing white circle)
            const loadingAnimation = document.createElement('div');
            loadingAnimation.className = 'voice-ai-loading-animation';
            buttonContainer.appendChild(loadingAnimation);
            if (statusText) statusText.textContent = 'Connecting...';
            break;
            
          case 'active':
            // When active, immediately show volume visualization with minimum height
            // This ensures we always see something when in listening mode
            const activeVolumeContainer = document.createElement('div');
            activeVolumeContainer.className = 'voice-ai-volume-container';
            
            // Create volume bars with minimum height
            for (let i = 0; i < 4; i++) {
              const bar = document.createElement('div');
              bar.className = 'voice-ai-volume-bar';
              bar.style.width = '4px';
              bar.style.backgroundColor = '#ffffff';
              bar.style.borderRadius = '2px';
              bar.style.height = '10px'; // Minimum height
              bar.style.transition = 'height 0.3s ease-in-out';
              activeVolumeContainer.appendChild(bar);
            }
            
            buttonContainer.appendChild(activeVolumeContainer);
            this.ui.volumeBars = Array.from(activeVolumeContainer.querySelectorAll('.voice-ai-volume-bar'));
            
            if (statusText) statusText.textContent = 'Listening...';
            break;
            
          case 'thinking':
            // Show thinking animation (spinning circle)
            const thinkingAnimation = document.createElement('div');
            thinkingAnimation.className = 'voice-ai-thinking-animation';
            buttonContainer.appendChild(thinkingAnimation);
            if (statusText) statusText.textContent = 'Thinking...';
            break;
            
            case 'responding':
              // Show responding animation (pulsing white circle)
              const respondingAnimation = document.createElement('div');
              respondingAnimation.className = 'voice-ai-responding-animation';
              buttonContainer.appendChild(respondingAnimation);
              if (statusText) statusText.textContent = 'Responding...';
              break;
            
            case 'error':
              // Show error state
              const errorAnimation = document.createElement('div');
              errorAnimation.className = 'voice-ai-error-animation';
              errorAnimation.style.backgroundColor = '#ff3b30';
              
              // Add pulsing effect for error state
              const pulse = document.createElement('div');
              pulse.className = 'voice-ai-error-pulse';
              errorAnimation.appendChild(pulse);
              
              buttonContainer.appendChild(errorAnimation);
              if (statusText) statusText.textContent = 'Error';
              
              // Auto-recover after 5 seconds
              setTimeout(() => {
                if (this.uiMode === 'error') {
                  this._updateUI('idle');
                  
                  // Try to restart the session if it was active
                  if (this.isActive) {
                    this._cleanupWebRTC();
                    this.isActive = false;
                    this.isListening = false;
                    
                    // Wait a bit before trying to restart
                    setTimeout(() => {
                      this.startSession();
                    }, 1000);
                  }
                }
              }, 5000);
              break;
            
            case 'volume':
              // If we already have volume bars, just update their heights
              if (this.ui.volumeBars && this.ui.volumeBars.length > 0 && buttonContainer.querySelector('.voice-ai-volume-container')) {
                // Update existing volume bars
                this.ui.volumeBars.forEach((bar, i) => {
                  // Ensure minimum height and add slight randomness for visual effect
                  const randomFactor = 0.9 + Math.random() * 0.2;
                  // Ensure a minimum height so bars are always visible
                  const minHeight = 10;
                  const maxHeight = 30;
                  // Calculate target height with a higher minimum to ensure visibility
                  const targetHeight = Math.max(minHeight, Math.min(maxHeight, volume * 400 * randomFactor));
                  
                  // Get current height
                  const currentStyle = window.getComputedStyle(bar);
                  const currentHeight = parseInt(currentStyle.height, 10);
                  
                  // Smooth transition (70% current, 30% target)
                  const smoothedHeight = currentHeight * 0.7 + targetHeight * 0.3;
                  
                  bar.style.height = `${smoothedHeight}px`;
                });
              } else {
                // Create new volume container and bars
                const volContainer = document.createElement('div');
                volContainer.className = 'voice-ai-volume-container';
                this.ui.volumeBars = [];
                
                // Create volume bars
                for (let i = 0; i < 4; i++) {
                  const bar = document.createElement('div');
                  bar.className = 'voice-ai-volume-bar';
                  bar.style.width = '4px';
                  bar.style.backgroundColor = '#ffffff';
                  bar.style.borderRadius = '2px';
                  bar.style.transition = 'height 0.3s ease-in-out';
                  
                  // Ensure minimum height and add slight randomness for visual effect
                  const randomFactor = 0.9 + Math.random() * 0.2;
                  // Ensure a minimum height so bars are always visible
                  const minHeight = 10;
                  const maxHeight = 30;
                  // Calculate height with a higher minimum to ensure visibility
                  const height = Math.max(minHeight, Math.min(maxHeight, volume * 400 * randomFactor));
                  
                  bar.style.height = `${height}px`;
                  
                  volContainer.appendChild(bar);
                  this.ui.volumeBars.push(bar);
                }
                
                buttonContainer.appendChild(volContainer);
              }
              
              if (statusText) statusText.textContent = 'Listening...';
              break;
            
            case 'inactive':
            case 'idle':
            default:
              // Show idle animation (microphone icon)
              const idleAnimation = document.createElement('div');
              idleAnimation.className = 'voice-ai-idle-animation';
              
              // Add microphone icon
              const micIcon = document.createElement('img');
              micIcon.src = `${this.config.serverUrl || ''}/microphone.svg`;
              micIcon.alt = 'Microphone';
              micIcon.style.width = '24px';
              micIcon.style.height = '24px';
              
              idleAnimation.appendChild(micIcon);
              buttonContainer.appendChild(idleAnimation);
              
              // Store reference to idle animation
              this.ui.idleAnimation = idleAnimation;
              
              if (statusText) statusText.textContent = 'Click to talk';
              break;
        }
      }
  
      /**
       * Configure the WebRTC session
       * @private
       */
      async _configureSession() {
        try {
          this.logger.log('Configuring session with ID:', this.sessionId);
          
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
              this.logger.log('Server provided new session ID:', data.newSessionId);
              this.sessionId = data.newSessionId;
              this._saveSession();
              
              // Add a delay before retrying to allow the server to fully register the session
              this.logger.debug('Waiting for session to be fully registered...');
              return new Promise(resolve => {
                setTimeout(async () => {
                  this.logger.debug('Retrying with new session ID');
                  resolve(await this._configureSession());
                }, 1000); // 1 second delay
              });
            }
            
            // Если сессия не найдена, пробуем создать новую
            if (response.status === 404 && errorMessage.includes('Session not found')) {
              this.logger.log('Session not found, creating a new one');
              this.sessionId = null;
              localStorage.removeItem('voice_ai_session');
              await this._initSession();
              
              // Add a delay before retrying to allow the server to fully register the session
              this.logger.debug('Waiting for session to be fully registered...');
              return new Promise(resolve => {
                setTimeout(async () => {
                  this.logger.debug('Retrying with new session ID');
                  resolve(await this._configureSession());
                }, 1000); // 1 second delay
              });
            }
            
            throw new Error(errorMessage);
          }
          
          // Set remote description
          await this.peerConnection.setRemoteDescription(data.answer);
          
          // Save instructions
          this.instructions = data.instructions;
          
          // Keep the loading state until the data channel opens
          // The UI will be updated in _onDataChannelOpen
          
          return true;
        } catch (error) {
          this.logger.error('Session configuration failed', error);
          this._updateUI('error');
          throw error;
        }
      }
  
      /**
       * Data channel open handler
       * @private
       */
      _onDataChannelOpen() {
        this.logger.log('Data channel opened');
        
        // Add a small delay before configuring the data channel to ensure connection stability
        setTimeout(() => {
          // Configure data channel
          this._configureDataChannel();
          
          // Update UI to responding state immediately, as we expect the assistant to speak first
          this._updateUI('responding');
        }, 500);
      }
  
      /**
       * Configure data channel with session settings and initial prompt
       * @private
       */
      _configureDataChannel() {
        if (!this.dataChannel) {
          this.logger.error('Data channel not available, cannot configure');
          this._updateUI('error');
          return;
        }
        
        if (this.dataChannel.readyState !== 'open') {
          this.logger.error('Data channel not open, cannot configure. State:', this.dataChannel.readyState);
          this._updateUI('error');
          return;
        }

        this.logger.log('Configuring data channel');

        // Send messages in sequence with proper timing
        const sendMessages = async () => {
          try {
            // 1. Send session update
            this.logger.debug('Sending session update');
            const sessionUpdate = {
              type: 'session.update',
              session: {
                modalities: ['text', 'audio'],
                tools: [
                  {
                    type: 'function',
                    name: 'show_booking_popup',
                    description: 'Show a popup with a button to book a meeting. Use when: (1) User wants to learn more about Improvado, (2) User wants to schedule a demo/meeting, (3) User asks about pricing/implementation details, (4) Conversation requires human representative, (5) User explicitly asks to book a meeting. Provide personalized message about benefits. When using this tool, tell the user directly: "I\'ve opened a booking popup for you. Please click the button to schedule a meeting." After using, end conversation with: "I\'ll be here when you\'re ready to continue. Just click the microphone button again."',
                    parameters: {
                      type: 'object',
                      properties: {
                        message: {
                          type: 'string',
                          description: 'Message to display in the popup'
                        }
                      },
                      required: ['message']
                    }
                  }
                ],
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
            
            // Check if data channel is still open before sending
            if (!this.dataChannel || this.dataChannel.readyState !== 'open') {
              this.logger.error('Data channel closed while configuring');
              this._updateUI('error');
              return;
            }
            
            this.dataChannel.send(JSON.stringify(sessionUpdate));
            
            // Wait for a short time to ensure session update is processed
            await new Promise(resolve => setTimeout(resolve, 300));
            
            // Check if data channel is still open before sending next message
            if (!this.dataChannel || this.dataChannel.readyState !== 'open') {
              this.logger.error('Data channel closed while configuring');
              this._updateUI('error');
              return;
            }
            
            // 2. Send initial message
            this.logger.debug('Sending initial message');
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
            
            // Wait longer before sending response.create to ensure stability
            await new Promise(resolve => setTimeout(resolve, 500));
            
            // Check if data channel is still open before sending final message
            if (!this.dataChannel || this.dataChannel.readyState !== 'open') {
              this.logger.error('Data channel closed while configuring');
              this._updateUI('error');
              return;
            }
            
            // 3. Request response creation
            this.logger.debug('Requesting response creation');
            const createResponse = {
              type: 'response.create'
            };
            
            this.dataChannel.send(JSON.stringify(createResponse));
          } catch (error) {
            this.logger.error('Error sending messages:', error);
            this._updateUI('error');
            
            // Call onError callback
            if (typeof this.config.onError === 'function') {
              this.config.onError(new Error('Error configuring data channel: ' + error.message));
            }
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
          const message = JSON.parse(event.data);
          
          // Use debug logger for detailed event messages
          this.logger.debug('Received message', message);
          
          // Handle different message types
          switch (message.type) {
            case 'thinking':
              // Update UI to thinking state
              this._updateUI('thinking');
              break;
              
            case 'responding':
              // Update UI to responding state (pulsing white circle)
              this._updateUI('responding');
              break;
              
            case 'response':
              // Add message to history
              this.messages.push({
                role: 'assistant',
                content: message.content
              });
              
              // Call onMessage callback
              if (typeof this.config.onMessage === 'function') {
                this.config.onMessage({
                  role: 'assistant',
                  content: message.content
                });
              }
              
              // Keep responding state until user starts speaking or agent speaks again
              // This prevents showing the volume visualization prematurely
              this._updateUI('responding');
              break;
              
            case 'function_call':
              // Handle function call from AI agent
              this.logger.log('Function call received', message.function_call);
              
              // Check if function_call and its properties exist
              if (!message.function_call || !message.function_call.name) {
                console.error('Voice AI SDK: Invalid function call format', message);
                this._updateUI('error');
                return;
              }
              
              // Check if the function exists in our tool handlers
              const functionName = message.function_call.name;
              const functionArgs = message.function_call.arguments || {};
              const functionCallId = message.function_call.id || 'unknown';
              
              if (this.toolHandlers[functionName]) {
                try {
                  // Execute the function
                  const result = this.toolHandlers[functionName](functionArgs);
                  
                  // Send the result back to the server
                  if (this.dataChannel && this.dataChannel.readyState === 'open') {
                    const functionResponse = {
                      type: 'function_call_response',
                      function_call_id: functionCallId,
                      result: result
                    };
                    
                    this.dataChannel.send(JSON.stringify(functionResponse));
                  }
                } catch (error) {
                  console.error(`Voice AI SDK: Error executing function ${functionName}`, error);
                  
                  // Send error response
                  if (this.dataChannel && this.dataChannel.readyState === 'open') {
                    const errorResponse = {
                      type: 'function_call_response',
                      function_call_id: functionCallId,
                      error: error.message || 'Error executing function'
                    };
                    
                    this.dataChannel.send(JSON.stringify(errorResponse));
                  }
                  
                  // Update UI to error state
                  this._updateUI('error');
                }
              } else {
                console.error(`Voice AI SDK: Function ${functionName} not found`);
                
                // Send error response
                if (this.dataChannel && this.dataChannel.readyState === 'open') {
                  const errorResponse = {
                    type: 'function_call_response',
                    function_call_id: functionCallId,
                    error: `Function ${functionName} not found`
                  };
                  
                  this.dataChannel.send(JSON.stringify(errorResponse));
                }
                
                // Update UI to error state
                this._updateUI('error');
              }
              break;
              
            case 'response.function_call_arguments.done':
              // Handle function call from OpenAI WebRTC API
              console.log('Voice AI SDK: Function call received from OpenAI', message);
              
              // Check if message has the required properties
              if (!message.name) {
                console.error('Voice AI SDK: Invalid function call format from OpenAI', message);
                this._updateUI('error');
                return;
              }
              
              // Check if the function exists in our tool handlers
              const openAIFunctionName = message.name;
              let openAIFunctionArgs = {};
              const openAIFunctionCallId = message.call_id || 'unknown';
              
              // Parse arguments if they exist
              try {
                if (message.arguments) {
                  openAIFunctionArgs = JSON.parse(message.arguments);
                }
              } catch (error) {
                console.error('Voice AI SDK: Error parsing function arguments', error);
              }
              
              if (this.toolHandlers[openAIFunctionName]) {
                try {
                  // Set a flag to indicate that a function was called
                  // This can be used to modify behavior after function calls
                  this.lastFunctionCalled = openAIFunctionName;
                  
                  // Execute the function
                  const result = this.toolHandlers[openAIFunctionName](openAIFunctionArgs);
                  
                  // Send the result back to the server
                  if (this.dataChannel && this.dataChannel.readyState === 'open') {
                    const functionResponse = {
                      type: 'conversation.item.create',
                      item: {
                        type: 'function_call_output',
                        call_id: openAIFunctionCallId,
                        output: JSON.stringify(result)
                      }
                    };
                    
                    this.dataChannel.send(JSON.stringify(functionResponse));
                  }
                } catch (error) {
                  console.error(`Voice AI SDK: Error executing function ${openAIFunctionName}`, error);
                  
                  // Send error response
                  if (this.dataChannel && this.dataChannel.readyState === 'open') {
                    const errorResponse = {
                      type: 'conversation.item.create',
                      item: {
                        type: 'function_call_output',
                        call_id: openAIFunctionCallId,
                        output: JSON.stringify({ error: error.message || 'Error executing function' })
                      }
                    };
                    
                    this.dataChannel.send(JSON.stringify(errorResponse));
                  }
                  
                  // Update UI to error state
                  this._updateUI('error');
                }
              } else {
                console.error(`Voice AI SDK: Function ${openAIFunctionName} not found`);
                
                // Send error response
                if (this.dataChannel && this.dataChannel.readyState === 'open') {
                  const errorResponse = {
                    type: 'conversation.item.create',
                    item: {
                      type: 'function_call_output',
                      call_id: openAIFunctionCallId,
                      output: JSON.stringify({ error: `Function ${openAIFunctionName} not found` })
                    }
                  };
                  
                  this.dataChannel.send(JSON.stringify(errorResponse));
                }
                
                // Update UI to error state
                this._updateUI('error');
              }
              break;
              
            case 'error':
              console.error('Voice AI SDK: Error from server', message.error);
              
              // Call onError callback
              if (typeof this.config.onError === 'function') {
                this.config.onError(new Error(message.error));
              }
              
              // Update UI to error state
              this._updateUI('error');
              break;
              
            // Handle specific OpenAI WebSocket message types
            case 'input_audio_buffer.speech_started':
              // User started speaking - show volume visualization
              this._updateUI('volume', this.currentVolume || 0.1);
              break;
              
            case 'input_audio_buffer.speech_ended':
              // User stopped speaking - go back to responding state
              // This keeps the pulsing circle instead of showing volume bars
              this._updateUI('responding');
              break;
              
            case 'output_audio_buffer.started':
              // Agent started speaking
              this._updateUI('responding');
              break;
              
            case 'output_audio_buffer.ended':
              // Agent stopped speaking - keep responding state
              // This keeps the pulsing circle instead of showing volume bars
              this._updateUI('responding');
              break;
              
            default:
              // For any other message, keep the current UI state
              // Don't automatically switch to volume visualization
              break;
          }
        } catch (error) {
          console.error('Voice AI SDK: Error parsing message', error);
        }
      }
  
      /**
       * Data channel close handler
       * @private
       */
      _onDataChannelClose() {
        this.logger.log('Data channel closed');
        this.isListening = false;
        
        // Update UI to idle state
        this._updateUI('idle');
        
        // Call onEnd callback if session was active
        if (this.isActive) {
          this.isActive = false;
          
          if (typeof this.config.onEnd === 'function') {
            this.config.onEnd();
          }
        }
      }
  
      /**
       * Data channel error handler
       * @private
       * @param {Event} error - The error event
       */
      _onDataChannelError(error) {
        this.logger.error('Data channel error', error);
        
        // Update UI to error state
        this._updateUI('error');
        
        // Call onError callback
        if (typeof this.config.onError === 'function') {
          this.config.onError(new Error('Data channel error: ' + (error.message || 'Unknown error')));
        }
        
        // Try to recover by cleaning up and resetting
        this._cleanupWebRTC();
        this.isActive = false;
        this.isListening = false;
      }
  
      /**
       * ICE candidate handler
       * @private
       * @param {RTCPeerConnectionIceEvent} event - The ICE candidate event
       */
      _onIceCandidate(event) {
        if (event.candidate) {
          this.logger.debug('New ICE candidate', event.candidate);
        }
      }
  
      /**
       * Connection state change handler
       * @private
       */
      _onConnectionStateChange() {
        if (!this.peerConnection) return;
        
        this.logger.debug('Connection state changed to', this.peerConnection.connectionState);
        
        switch (this.peerConnection.connectionState) {
          case 'connected':
            this.logger.log('WebRTC connection established');
            // Don't update UI here, as it will be handled by the data channel open handler
            break;
            
          case 'disconnected':
            this.logger.log('WebRTC connection disconnected, attempting to recover');
            // Show error state but don't close the session yet, as it might recover
            this._updateUI('error');
            
            // Call onError callback with recoverable flag
            if (typeof this.config.onError === 'function') {
              this.config.onError(new Error('WebRTC connection disconnected, attempting to recover'));
            }
            
            // Set a timeout to check if connection recovers
            setTimeout(() => {
              if (this.peerConnection && 
                  (this.peerConnection.connectionState === 'disconnected' || 
                   this.peerConnection.connectionState === 'failed')) {
                this.logger.log('WebRTC connection failed to recover, cleaning up');
                this._cleanupWebRTC();
                this.isActive = false;
                this.isListening = false;
                
                // Call onEnd callback
                if (typeof this.config.onEnd === 'function') {
                  this.config.onEnd();
                }
              }
            }, 5000); // Wait 5 seconds for potential recovery
            break;
            
          case 'failed':
            this.logger.error('WebRTC connection failed');
            this._updateUI('error');
            
            // Call onError callback
            if (typeof this.config.onError === 'function') {
              this.config.onError(new Error('WebRTC connection failed'));
            }
            
            // Clean up resources
            this._cleanupWebRTC();
            this.isActive = false;
            this.isListening = false;
            
            // Call onEnd callback
            if (typeof this.config.onEnd === 'function') {
              this.config.onEnd();
            }
            break;
            
          case 'closed':
            this.logger.log('WebRTC connection closed');
            this._updateUI('inactive');
            break;
        }
      }
  
      /**
       * Clean up WebRTC resources
       * @private
       */
      _cleanupWebRTC() {
        this.logger.log('Cleaning up WebRTC resources');
        
        // Close data channel
        if (this.dataChannel) {
          try {
            this.dataChannel.close();
          } catch (e) {
            this.logger.error('Error closing data channel', e);
          }
          this.dataChannel = null;
        }
        
        // Close peer connection
        if (this.peerConnection) {
          try {
            // Remove all event listeners
            this.peerConnection.onicecandidate = null;
            this.peerConnection.onconnectionstatechange = null;
            this.peerConnection.ontrack = null;
            
            // Close the connection
            this.peerConnection.close();
          } catch (e) {
            this.logger.error('Error closing peer connection', e);
          }
          this.peerConnection = null;
        }
        
        // Stop media stream
        if (this.stream) {
          try {
            this.stream.getTracks().forEach(track => {
              track.stop();
            });
          } catch (e) {
            this.logger.error('Error stopping media stream', e);
          }
          this.stream = null;
        }
        
        // Clean up audio element
        if (this.audioElement) {
          try {
            this.audioElement.srcObject = null;
            this.audioElement.remove();
          } catch (e) {
            this.logger.error('Error cleaning up audio element', e);
          }
          this.audioElement = null;
        }
        
        // Reset state
        this.isActive = false;
        this.isListening = false;
      }
  
      /**
       * Start a new session
       * @public
       */
      async startSession() {
        // Prevent multiple rapid calls
        if (this.isActive || this._startSessionInProgress) return;
        
        // Set flag to prevent multiple calls
        this._startSessionInProgress = true;
        
        try {
          // Show loading state immediately
          this._updateUI('loading');
          
          // Initialize WebRTC
          const webrtcInitialized = await this._initWebRTC();
          
          if (!webrtcInitialized) {
            this._updateUI('error');
            this._startSessionInProgress = false;
            return;
          }
          
          // Configure session
          await this._configureSession();
          
          // Set active state
          this.isActive = true;
          this.isListening = true;
          
          // Don't update UI here, as it will be updated in _onDataChannelOpen
          // The UI will remain in 'loading' state until the data channel opens
          
          // Call onStart callback
          if (typeof this.config.onStart === 'function') {
            this.config.onStart();
          }
        } catch (error) {
          this.logger.error('Failed to start session', error);
          
          // Clean up resources
          this._cleanupWebRTC();
          
          // Update UI to error state
          this._updateUI('error');
          
          // Call onError callback
          if (typeof this.config.onError === 'function') {
            this.config.onError(error);
          }
        } finally {
          // Reset the flag regardless of success or failure
          this._startSessionInProgress = false;
        }
      }
  
      /**
       * Stop the current session
       * @public
       */
      stopSession() {
        this.logger.log('Stopping session');
        
        // If not active, nothing to do
        if (!this.isActive && !this._startSessionInProgress) {
          this.logger.debug('Session already stopped');
          return;
        }
        
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
        
        // Stop all audio tracks
        if (this.stream) {
          this.stream.getTracks().forEach(track => {
            track.stop();
          });
          this.stream = null;
        }
        
        // Clean up WebRTC resources
        this._cleanupWebRTC();
        
        // Reset state
        this.isActive = false;
        this.isListening = false;
        this.currentVolume = 0;
        this._startSessionInProgress = false;
        
        // Update UI to idle state
        this._updateUI('idle');
        
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
          // Show loading animation immediately
          this._updateUI('loading');
          // Start session
          this.startSession();
        }
      }
      
      /**
       * Initialize WebRTC
       * @private
       */
      async _initWebRTC() {
        try {
          this.logger.log('Initializing WebRTC');
          
          // Clean up any existing WebRTC resources first
          this._cleanupWebRTC();
          
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
          try {
            this.stream = await navigator.mediaDevices.getUserMedia({ audio: true });
          } catch (mediaError) {
            this.logger.error('Error accessing microphone', mediaError);
            
            // Check if it's a permission error
            if (mediaError.name === 'NotAllowedError' || mediaError.name === 'PermissionDeniedError') {
              this.logger.error('Microphone permission denied');
              alert('Voice AI requires microphone access. Please allow microphone access and try again.');
            } else {
              alert('Error accessing microphone. Please check your device settings and try again.');
            }
            
            return false;
          }
          
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
            this.logger.debug('Received audio track');
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
          
          this.logger.debug('Created offer');
          
          return true;
        } catch (error) {
          this.logger.error('Error initializing WebRTC', error);
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
          
          // Store previous volume values for smoothing
          this.volumeHistory = Array(5).fill(0.1); // Start with a small non-zero value
          
          const getVolume = () => {
            analyser.getByteTimeDomainData(dataArray);
            
            let sum = 0;
            for (let i = 0; i < dataArray.length; i++) {
              const float = (dataArray[i] - 128) / 128;
              sum += float * float;
            }
            
            const rawVolume = Math.sqrt(sum / dataArray.length);
            
            // Add to history and calculate smoothed volume
            this.volumeHistory.push(rawVolume);
            this.volumeHistory.shift();
            
            // Calculate weighted average (more recent values have higher weight)
            let weightedSum = 0;
            let weightSum = 0;
            for (let i = 0; i < this.volumeHistory.length; i++) {
              const weight = i + 1;
              weightedSum += this.volumeHistory[i] * weight;
              weightSum += weight;
            }
            
            // Ensure we always return at least a minimum value
            return Math.max(0.05, weightedSum / weightSum);
          };
          
          // Start volume detection interval
          this.volumeInterval = setInterval(() => {
            // Only update volume visualization if we're in volume mode
            // This ensures we only show volume bars when the user is actually speaking
            if (this.isActive && this.isListening && this.uiMode === 'volume') {
              const volume = getVolume();
              this._updateUI('volume', volume);
            }
            
            // Store current volume for use in other parts of the code
            this.currentVolume = getVolume();
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
        
        // Initialize volume history for smoothing if not already done
        if (!this.volumeHistory) {
          this.volumeHistory = Array(5).fill(0);
        }
        
        this.volumeInterval = setInterval(() => {
          if (!this.analyser) return;
          
          this.analyser.getByteFrequencyData(dataArray);
          
          let sum = 0;
          for (let i = 0; i < bufferLength; i++) {
            sum += dataArray[i];
          }
          
          const rawVolume = sum / bufferLength / 255;
          
          // Add to history and calculate smoothed volume
          this.volumeHistory.push(rawVolume);
          this.volumeHistory.shift();
          
          // Calculate weighted average (more recent values have higher weight)
          let weightedSum = 0;
          let weightSum = 0;
          for (let i = 0; i < this.volumeHistory.length; i++) {
            const weight = i + 1;
            weightedSum += this.volumeHistory[i] * weight;
            weightSum += weight;
          }
          
          this.currentVolume = weightedSum / weightSum;
          
          // Only update UI if we're already in volume mode
          // This prevents automatically switching to volume visualization
          if (this.isListening && this.uiMode === 'volume') {
            this._updateUI('volume', this.currentVolume);
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