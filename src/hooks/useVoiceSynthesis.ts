import { useState, useRef, useCallback, useEffect } from 'react';
import { api } from '../services/api';

export function useVoiceSynthesis(voiceName = 'Kore', language = 'en') {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [activeMessageId, setActiveMessageId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const currentObjectUrlRef = useRef<string | null>(null);

  const stop = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      audioRef.current = null;
    }

    if (currentObjectUrlRef.current) {
      URL.revokeObjectURL(currentObjectUrlRef.current);
      currentObjectUrlRef.current = null;
    }

    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }

    setIsPlaying(false);
    setIsLoading(false);
    setActiveMessageId(null);
  }, []);

  const play = useCallback(
    async (messageId: string, text: string) => {
      // If clicking play on already active playing message, pause/stop it
      if (activeMessageId === messageId && isPlaying) {
        stop();
        return;
      }

      // Stop any existing playback first
      stop();

      setActiveMessageId(messageId);
      setIsLoading(true);
      setError(null);

      try {
        const res = await api.requestSpeech(text, voiceName, language);

        // Option A: Backend audio provided
        if (res.audioBase64) {
          const byteCharacters = atob(res.audioBase64);
          const byteNumbers = new Array(byteCharacters.length);
          for (let i = 0; i < byteCharacters.length; i++) {
            byteNumbers[i] = byteCharacters.charCodeAt(i);
          }
          const byteArray = new Uint8Array(byteNumbers);
          const audioBlob = new Blob([byteArray], {
            type: res.mimeType || 'audio/mp3',
          });

          const objectUrl = URL.createObjectURL(audioBlob);
          currentObjectUrlRef.current = objectUrl;

          const audio = new Audio(objectUrl);
          audioRef.current = audio;

          audio.onplay = () => {
            setIsLoading(false);
            setIsPlaying(true);
          };

          audio.onended = () => {
            setIsPlaying(false);
            setActiveMessageId(null);
            if (currentObjectUrlRef.current) {
              URL.revokeObjectURL(currentObjectUrlRef.current);
              currentObjectUrlRef.current = null;
            }
          };

          audio.onerror = (e) => {
            console.warn('Audio playback error, falling back to speech synthesis:', e);
            playBrowserFallback(res.cleanText || text);
          };

          await audio.play();
          return;
        }

        // Option B: Browser speech synthesis fallback
        playBrowserFallback(res.cleanText || text);
      } catch (err: any) {
        console.warn('Failed to get voice audio, using browser synthesis:', err);
        playBrowserFallback(text);
      } finally {
        setIsLoading(false);
      }
    },
    [activeMessageId, isPlaying, stop, voiceName, language]
  );

  const playBrowserFallback = (cleanText: string) => {
    if (!('speechSynthesis' in window)) {
      setError('Text-to-speech is not supported on this device.');
      setIsLoading(false);
      setIsPlaying(false);
      setActiveMessageId(null);
      return;
    }

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.lang = language === 'hi' ? 'hi-IN' : 'en-US';
    utterance.rate = 1.0;
    utterance.pitch = 1.0;

    utterance.onstart = () => {
      setIsLoading(false);
      setIsPlaying(true);
    };

    utterance.onend = () => {
      setIsPlaying(false);
      setActiveMessageId(null);
    };

    utterance.onerror = () => {
      setIsPlaying(false);
      setActiveMessageId(null);
    };

    window.speechSynthesis.speak(utterance);
  };

  useEffect(() => {
    return () => {
      stop();
    };
  }, [stop]);

  return {
    isPlaying,
    isLoading,
    activeMessageId,
    error,
    play,
    stop,
  };
}

