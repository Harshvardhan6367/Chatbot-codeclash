import { useState, useEffect, useRef, useCallback } from 'react';
import { api } from '../services/api';

export function useVoiceRecognition(language: 'en-US' | 'hi-IN' | 'hinglish' = 'en-US') {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [interimTranscript, setInterimTranscript] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSupported, setIsSupported] = useState(true);
  const [isTranscribingBackend, setIsTranscribingBackend] = useState(false);

  const recognitionRef = useRef<any>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  useEffect(() => {
    const SpeechRecognition =
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setIsSupported(false);
    }
  }, []);

  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (e) {
        // Ignore already stopped
      }
    }

    if (
      mediaRecorderRef.current &&
      mediaRecorderRef.current.state === 'recording'
    ) {
      mediaRecorderRef.current.stop();
    }

    setIsListening(false);
  }, []);

  const startListening = useCallback(
    async (onResultCallback?: (text: string) => void) => {
      setError(null);
      setTranscript('');
      setInterimTranscript('');

      const SpeechRecognition =
        (window as any).SpeechRecognition ||
        (window as any).webkitSpeechRecognition;

      // Primary: Browser SpeechRecognition API
      if (SpeechRecognition) {
        try {
          const recognition = new SpeechRecognition();
          recognitionRef.current = recognition;

          recognition.continuous = false;
          recognition.interimResults = true;
          recognition.lang = language === 'hi-IN' ? 'hi-IN' : 'en-US';

          recognition.onstart = () => {
            setIsListening(true);
          };

          recognition.onresult = (event: any) => {
            let currentInterim = '';
            let currentFinal = '';

            for (let i = event.resultIndex; i < event.results.length; ++i) {
              if (event.results[i].isFinal) {
                currentFinal += event.results[i][0].transcript;
              } else {
                currentInterim += event.results[i][0].transcript;
              }
            }

            if (currentFinal) {
              setTranscript(currentFinal);
              if (onResultCallback) onResultCallback(currentFinal);
            }
            setInterimTranscript(currentInterim);
          };

          recognition.onerror = async (event: any) => {
            console.warn('Speech recognition error:', event.error);
            if (event.error === 'not-allowed') {
              setError('Microphone permission was denied. Please allow microphone access in your browser settings.');
              setIsListening(false);
            } else if (event.error === 'no-speech') {
              setError('No speech was detected. Please try speaking again.');
              setIsListening(false);
            } else {
              // Try fallback recording
              console.log('Falling back to audio recording & backend Gemini transcription...');
              fallbackRecordAudio(onResultCallback);
            }
          };

          recognition.onend = () => {
            setIsListening(false);
          };

          recognition.start();
          return;
        } catch (err: any) {
          console.warn('Could not start web speech recognition, using audio recorder fallback:', err);
        }
      }

      // Secondary Fallback: MediaRecorder -> Backend Gemini transcription
      await fallbackRecordAudio(onResultCallback);
    },
    [language]
  );

  const fallbackRecordAudio = async (onResultCallback?: (text: string) => void) => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioChunksRef.current = [];
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        setIsListening(false);
        stream.getTracks().forEach((track) => track.stop());

        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        if (audioBlob.size > 1000) {
          try {
            setIsTranscribingBackend(true);
            const { transcript } = await api.transcribeAudio(
              audioBlob,
              language === 'hi-IN' ? 'hi' : 'en'
            );
            if (transcript) {
              setTranscript(transcript);
              if (onResultCallback) onResultCallback(transcript);
            }
          } catch (tErr: any) {
            setError('Audio transcription failed. Please type your question.');
          } finally {
            setIsTranscribingBackend(false);
          }
        }
      };

      mediaRecorder.start();
      setIsListening(true);
    } catch (micErr: any) {
      setError('Microphone access denied or unavailable. Please enable microphone permission.');
      setIsListening(false);
    }
  };

  return {
    isListening,
    transcript,
    interimTranscript,
    error,
    isSupported,
    isTranscribingBackend,
    startListening,
    stopListening,
    setTranscript,
  };
}

