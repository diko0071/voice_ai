//hooks/use-webrtc.ts
"use client";
 
import { useState, useRef, useEffect } from "react";
import { logger } from './logger';
 
const useWebRTCAudioSession = (voice: string) => {
  const [status, setStatus] = useState("");
  const [isSessionActive, setIsSessionActive] = useState(false);
  const audioIndicatorRef = useRef<HTMLDivElement | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const audioStreamRef = useRef<MediaStream | null>(null);
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  const dataChannelRef = useRef<RTCDataChannel | null>(null);
  const [msgs, setMsgs] = useState<any[]>([]);
  const functionRegistry = useRef<Record<string, Function>>({});
  const [currentVolume, setCurrentVolume] = useState(0);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const volumeIntervalRef = useRef<number | null>(null);
 
  const registerFunction = (name: string, fn: Function) => {
    functionRegistry.current[name] = fn;
  };
 
  const configureDataChannel = (dataChannel: RTCDataChannel) => {
    logger.log('Starting to configure data channel');
    
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
        instructions: `You are AI Agent Improvado, a Senior Business Development Representative (BDR) for Improvado with advanced expertise in marketing analytics and data integration. Your role is to conduct discovery calls with potential clients following a structured approach.

Personal Style:
- You have a warm, professional demeanor with a touch of AI sophistication
- You speak English with perfect clarity and professionalism
- You're deeply knowledgeable about marketing analytics, data integration, and modern marketing technology
- You use a consultative approach, focusing on understanding before presenting solutions
- You're genuinely interested in helping clients solve their data challenges
- You occasionally reference being an AI agent in a professional way, showing how technology can enhance business relationships

IMPORTANT BEHAVIOR:
- Start speaking immediately after connection is established
- Do not wait for the user to speak first
- Begin with your professional introduction
- Proceed naturally with discovery questions

1. Professional Introduction:
   "Hello! I'm AI Agent Improvado, a senior representative of Improvado - the leading marketing data integration platform. Thank you for taking the time to speak with me today. Our goal is to better understand your current marketing data processes and discuss how we can help optimize them. Would you mind if I ask you a few questions about your current situation?"

2. Discovery Framework:

   A. Current Marketing Stack & Process:
   - "Which marketing platforms are you currently using?"
   - "How do you currently handle data from these systems?"
   - "Could you tell me about your marketing technology stack?"
   
   B. Pain Points & Challenges:
   - "What challenges do you face with data consolidation?"
   - "How much time does your team spend on manual reporting?"
      - "How frequently do you need to prepare these reports?"
      - "How many team members are involved in the process?"
   - "How quickly can you get insights about campaign performance?"
      - "How does this impact your business goals?"
   
   C. Technical Resources & Costs:
   - "Do you have technical resources for integration work?"
      - "How long does it typically take to get their support?"
      - "How many engineers are working on this?"
   - "Are you experiencing issues with slow dashboards or Excel crashes?"
   - "How do you maintain your API connections?"

   D. Business Impact & Goals:
   - "What are your main KPIs?"
   - "What happens when you need to explain campaign performance to leadership?"
   - "How are optimization decisions made without real-time data?"
   - "What would your team do with the time saved from automated reporting?"

3. Call Best Practices:
   - Listen actively and ask relevant follow-up questions
   - Note specific pain points mentioned
   - Use strategic pauses after questions
   - Validate challenges with phrases like "That's a common challenge we hear from our clients..."
   - Mirror the client's terminology
   - Keep the conversation focused but natural
   - Show empathy and understanding
   - Use your AI nature as a strength, demonstrating how technology can enhance business processes

4. Value Proposition Alignment:
   Based on their answers, highlight relevant Improvado benefits:
   - For manual reporting issues: "Our clients save 20-30 hours per week on report preparation..."
   - For data accuracy concerns: "Our ETL process ensures 99.9% data accuracy..."
   - For technical constraints: "Our no-code interface allows marketers to work with data without developer involvement..."
   - For visibility issues: "You get real-time dashboards with automatic updates..."
   - For API challenges: "We maintain over 300 integrations and monitor their functionality..."

5. Response Guidelines:
   - Always communicate in English
   - Be professional yet friendly
   - Focus on understanding before presenting solutions
   - Use active listening techniques
   - Ask clarifying questions
   - Maintain a consultative approach
   - Don't rush to pitch - gather comprehensive information
   - Leverage your AI capabilities to provide precise, data-driven insights
   - IMPORTANT: Start the conversation immediately after connection is established, don't wait for the user to speak first

Remember: Your goal is to conduct a thorough discovery to understand the client's current situation, challenges, and needs. Don't move to solution presentation until you have clear insights about their pain points and business impact. Use your unique position as an AI agent to demonstrate how technology can enhance the discovery process while maintaining a warm, professional interaction.`
      }
    };

    // Send messages in sequence with proper timing
    const sendMessages = async () => {
      try {
        // 1. Send session update and wait
        logger.log('Sending session update');
        dataChannel.send(JSON.stringify(sessionUpdate));
        
        // Wait for a short time to ensure session update is processed
        await new Promise(resolve => setTimeout(resolve, 300));

        // 2. Send conversation item if channel is still open
        if (dataChannel.readyState === 'open') {
          logger.log('Sending conversation item');
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
          dataChannel.send(JSON.stringify(startPrompt));

          // Wait again before sending response.create
          await new Promise(resolve => setTimeout(resolve, 300));

          // 3. Finally send response.create if channel is still open
          if (dataChannel.readyState === 'open') {
            logger.log('Triggering response creation');
            const createResponse = {
              type: 'response.create'
            };
            dataChannel.send(JSON.stringify(createResponse));
          }
        }
      } catch (error) {
        logger.error('Error sending messages:', error);
      }
    };

    // Start the message sequence
    sendMessages();
  };
 
  const handleDataChannelMessage = async (event: MessageEvent) => {
    try {
      const msg = JSON.parse(event.data);
      logger.log('Received message from OpenAI:', msg);

      if (msg.type === 'response.function_call_arguments.done') {
        const fn = functionRegistry.current[msg.name];
        if (fn) {
          const args = JSON.parse(msg.arguments);
          const result = await fn(args);
 
          const response = {
            type: 'conversation.item.create',
            item: {
              type: 'function_call_output',
              call_id: msg.call_id,
              output: JSON.stringify(result)
            }
          };
 
          dataChannelRef.current?.send(JSON.stringify(response));
        }
      }
      setMsgs(prevMsgs => [...prevMsgs, msg]);
      return msg;
    } catch (error) {
      logger.error('Error handling data channel message:', error);
    }
  };
 
  useEffect(() => {
    return () => stopSession();
  }, []);
 
  const getEphemeralToken = async () => {
    const response = await fetch('/api/session', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    const data = await response.json();
    return data.client_secret.value;
  };
 
  const setupAudioVisualization = (stream: MediaStream) => {
    const audioContext = new AudioContext();
    const source = audioContext.createMediaStreamSource(stream);
    const analyzer = audioContext.createAnalyser();
    analyzer.fftSize = 256;
 
    source.connect(analyzer);
 
    const bufferLength = analyzer.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
 
    const updateIndicator = () => {
      if (!audioContext) return;
 
      analyzer.getByteFrequencyData(dataArray);
      const average = dataArray.reduce((a, b) => a + b) / bufferLength;
 
      if (audioIndicatorRef.current) {
        audioIndicatorRef.current.classList.toggle("active", average > 30);
      }
 
      requestAnimationFrame(updateIndicator);
    };
 
    updateIndicator();
    audioContextRef.current = audioContext;
  };
 
  const getVolume = (): number => {
    if (!analyserRef.current) return 0;
 
    const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
    analyserRef.current.getByteTimeDomainData(dataArray);
 
    let sum = 0;
    for (let i = 0; i < dataArray.length; i++) {
      const float = (dataArray[i] - 128) / 128;
      sum += float * float;
    }
    
    return Math.sqrt(sum / dataArray.length);
  };
 
  const startSession = async () => {
    try {
      logger.log('Starting session');
      setStatus("Requesting microphone access...");
 
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioStreamRef.current = stream;
      setupAudioVisualization(stream);
 
      setStatus("Getting API key...");
      const apiKey = process.env.NEXT_PUBLIC_OPENAI_API_KEY;
      
      if (!apiKey) {
        throw new Error("OpenAI API key not found");
      }
 
      setStatus("Establishing connection...");
      logger.log('Creating RTCPeerConnection');
 
      const pc = new RTCPeerConnection();
      const audioEl = document.createElement("audio");
      audioEl.autoplay = true;
      
      pc.ontrack = (e) => {
        logger.log('Received track');
        audioEl.srcObject = e.streams[0];
        
        const audioContext = new (window.AudioContext || window.AudioContext)();
        const source = audioContext.createMediaStreamSource(e.streams[0]);
        const analyser = audioContext.createAnalyser();
        analyser.fftSize = 256;
        
        source.connect(analyser);
        analyserRef.current = analyser;
 
        volumeIntervalRef.current = window.setInterval(() => {
          const volume = getVolume();
          setCurrentVolume(volume);
          
          if (volume > 0.1) {
            logger.log('Speech detected', { volume });
          }
        }, 100);
      };
 
      logger.log('Creating data channel');
      const dataChannel = pc.createDataChannel('response');
      dataChannelRef.current = dataChannel;
 
      dataChannel.onopen = () => {
        logger.log('DataChannel opened');
        configureDataChannel(dataChannel);
      };
 
      dataChannel.onclose = () => {
        logger.log('DataChannel closed');
      };

      dataChannel.onerror = (error) => {
        logger.error('DataChannel error:', error);
      };
 
      dataChannel.onmessage = handleDataChannelMessage;
 
      pc.addTrack(stream.getTracks()[0]);
 
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
 
      logger.log('Sending offer to OpenAI');
      const baseUrl = "https://api.openai.com/v1/realtime";
      const model = "gpt-4o-realtime-preview-2024-12-17";
      const response = await fetch(`${baseUrl}?model=${model}&voice=${voice}`, {
        method: "POST",
        body: offer.sdp,
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/sdp'
        }
      });
 
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`OpenAI API error: ${response.status} ${response.statusText}\n${errorText}`);
      }

      const answer = await response.text();
      logger.log('Received answer from OpenAI');
      
      await pc.setRemoteDescription({
        type: "answer",
        sdp: answer,
      });
 
      peerConnectionRef.current = pc;
      setIsSessionActive(true);
      setStatus("Session established successfully!");
      logger.log('Session established successfully');

    } catch (err) {
      logger.error('Error starting session:', err);
      setStatus(`Error: ${err}`);
      stopSession();
    }
  };

  const stopSession = () => {
    logger.log('Stopping session');
    if (dataChannelRef.current) {
      dataChannelRef.current.close();
      dataChannelRef.current = null;
    }

    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
      peerConnectionRef.current = null;
    }

    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }

    if (audioStreamRef.current) {
      audioStreamRef.current.getTracks().forEach((track) => track.stop());
      audioStreamRef.current = null;
    }

    if (audioIndicatorRef.current) {
      audioIndicatorRef.current.classList.remove("active");
    }

    if (volumeIntervalRef.current) {
      clearInterval(volumeIntervalRef.current);
      volumeIntervalRef.current = null;
    }
    
    if (analyserRef.current) {
      analyserRef.current = null;
    }
    
    setCurrentVolume(0);
    setIsSessionActive(false);
    setStatus("");
    setMsgs([]);
  };

  const handleStartStopClick = () => {
    if (isSessionActive) {
      stopSession();
    } else {
      startSession();
    }
  };

  return {
    status,
    isSessionActive,
    audioIndicatorRef,
    startSession,
    stopSession,
    handleStartStopClick,
    registerFunction,
    msgs,
    currentVolume
  };
};
 
export default useWebRTCAudioSession;