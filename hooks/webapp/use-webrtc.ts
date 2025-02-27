//hooks/use-webrtc.ts
"use client";
 
import { useState, useRef, useEffect } from "react";
import { logger } from '../logger';
import { agentInstructions } from '../../prompts/webapp/agent-instructions';
 
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
        instructions: agentInstructions
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
    const response = await fetch('/api/internal/session', {
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