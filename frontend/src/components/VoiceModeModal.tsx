import React, { useState, useEffect, useRef } from 'react';
import {
  Mic,
  MicOff,
  Square,
  Volume2,
  X,
  Sparkles,
  AlertCircle,
  GraduationCap,
} from 'lucide-react';
import { useVoiceRecognition } from '../hooks/useVoiceRecognition';
import { useVoiceSynthesis } from '../hooks/useVoiceSynthesis';
import { VoiceSettings } from '../types';

interface VoiceModeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSendMessage: (query: string) => Promise<string | null>;
  voiceSettings: VoiceSettings;
  onUpdateVoiceSettings: (settings: Partial<VoiceSettings>) => void;
}

type VoiceState = 'idle' | 'listening' | 'processing' | 'speaking';

export const VoiceModeModal: React.FC<VoiceModeModalProps> = ({
  isOpen,
  onClose,
  onSendMessage,
  voiceSettings,
  onUpdateVoiceSettings,
}) => {
  const [voiceState, setVoiceState] = useState<VoiceState>('idle');
  const [studentQuestion, setStudentQuestion] = useState('');
  const [assistantAnswer, setAssistantAnswer] = useState('');
  const [statusMessage, setStatusMessage] = useState('Tap the microphone to speak');

  const {
    isListening,
    transcript,
    interimTranscript,
    error: recError,
    startListening,
    stopListening,
    setTranscript,
  } = useVoiceRecognition(voiceSettings.language);

  const {
    isPlaying,
    isLoading: isTtsLoading,
    play: playTts,
    stop: stopTts,
  } = useVoiceSynthesis(voiceSettings.ttsVoice, voiceSettings.language === 'hi-IN' ? 'hi' : 'en');

  // Handle live speech recognition results
  useEffect(() => {
    if (transcript && transcript.trim()) {
      const query = transcript.trim();
      setStudentQuestion(query);
      setTranscript('');
      stopListening();
      processStudentQuery(query);
    }
  }, [transcript]);

  // Track synthesis state
  useEffect(() => {
    if (isPlaying) {
      setVoiceState('speaking');
      setStatusMessage('Anand-ICE Assistant is speaking...');
    } else if (voiceState === 'speaking' && !isPlaying) {
      setVoiceState('idle');
      setStatusMessage('Tap the microphone to ask another question');
    }
  }, [isPlaying]);

  // Track listening state
  useEffect(() => {
    if (isListening) {
      setVoiceState('listening');
      setStatusMessage('Listening to your voice... Speak now');
    }
  }, [isListening]);

  const processStudentQuery = async (query: string) => {
    setVoiceState('processing');
    setStatusMessage('Searching college FAQs and generating response...');

    try {
      const answer = await onSendMessage(query);
      if (answer) {
        setAssistantAnswer(answer);
        setStatusMessage('Playing official spoken response...');
        await playTts('voice-modal-msg', answer);
      } else {
        setVoiceState('idle');
        setStatusMessage('No answer received. Please tap to try again.');
      }
    } catch (err) {
      setVoiceState('idle');
      setStatusMessage('Something went wrong. Please tap to try again.');
    }
  };

  const handleMicClick = () => {
    if (voiceState === 'speaking') {
      // User interrupts speaking
      stopTts();
      setVoiceState('idle');
      return;
    }

    if (voiceState === 'listening') {
      stopListening();
      setVoiceState('idle');
      return;
    }

    if (voiceState === 'idle') {
      setAssistantAnswer('');
      setStudentQuestion('');
      startListening();
    }
  };

  const handleClose = () => {
    stopListening();
    stopTts();
    setVoiceState('idle');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/95 backdrop-blur-xl flex flex-col justify-between p-4 sm:p-8 text-white transition-all">
      {/* Top Bar */}
      <div className="max-w-4xl w-full mx-auto flex items-center justify-between border-b border-slate-800 pb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-700 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/20">
            <GraduationCap className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-bold">Voice Conversation Mode</h2>
            <p className="text-xs text-slate-400">Anand International College of Engineering (Anand-ICE)</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Language Selector */}
          <select
            value={voiceSettings.language}
            onChange={(e) =>
              onUpdateVoiceSettings({ language: e.target.value as any })
            }
            className="bg-slate-800 border border-slate-700 text-xs rounded-lg px-2.5 py-1.5 text-slate-200 focus:outline-none"
          >
            <option value="en-US">English</option>
            <option value="hi-IN">Hindi (हिन्दी)</option>
            <option value="hinglish">Hinglish</option>
          </select>

          {/* Close button */}
          <button
            onClick={handleClose}
            className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
            title="Exit Voice Mode"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Center Visual Stage & Transcripts */}
      <div className="max-w-2xl w-full mx-auto my-auto flex flex-col items-center justify-center text-center space-y-6 sm:space-y-8">
        {/* Status Message */}
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-slate-800/80 border border-slate-700 text-xs sm:text-sm text-slate-300">
          <Sparkles className="w-4 h-4 text-blue-400 animate-pulse" />
          <span>{statusMessage}</span>
        </div>

        {/* Large Interactive Microphone Control */}
        <div className="relative flex items-center justify-center my-4">
          {/* Pulsing rings based on state */}
          {voiceState === 'listening' && (
            <>
              <div className="absolute w-44 h-44 rounded-full bg-blue-500/20 animate-ping" />
              <div className="absolute w-36 h-36 rounded-full bg-blue-500/30 animate-pulse" />
            </>
          )}

          {voiceState === 'speaking' && (
            <>
              <div className="absolute w-44 h-44 rounded-full bg-emerald-500/20 animate-ping" />
              <div className="absolute w-36 h-36 rounded-full bg-emerald-500/30 animate-pulse" />
            </>
          )}

          <button
            onClick={handleMicClick}
            disabled={voiceState === 'processing'}
            className={`relative z-10 w-28 h-28 sm:w-32 sm:h-32 rounded-full flex flex-col items-center justify-center shadow-2xl transition-all duration-300 active:scale-95 ${
              voiceState === 'listening'
                ? 'bg-rose-600 shadow-rose-600/50'
                : voiceState === 'speaking'
                ? 'bg-emerald-600 shadow-emerald-600/50'
                : voiceState === 'processing'
                ? 'bg-indigo-700 animate-pulse'
                : 'bg-blue-600 hover:bg-blue-500 shadow-blue-600/40'
            }`}
          >
            {voiceState === 'listening' ? (
              <>
                <MicOff className="w-10 h-10 text-white mb-1" />
                <span className="text-[11px] font-semibold uppercase tracking-wider text-white">
                  Stop
                </span>
              </>
            ) : voiceState === 'speaking' ? (
              <>
                <Square className="w-8 h-8 fill-white text-white mb-1" />
                <span className="text-[11px] font-semibold uppercase tracking-wider text-white">
                  Interrupt
                </span>
              </>
            ) : (
              <>
                <Mic className="w-10 h-10 text-white mb-1" />
                <span className="text-[11px] font-semibold uppercase tracking-wider text-white">
                  Speak
                </span>
              </>
            )}
          </button>
        </div>

        {/* Audio Visualizer Waves when speaking or listening */}
        {(voiceState === 'listening' || voiceState === 'speaking') && (
          <div className="flex items-center gap-1.5 h-8">
            <span className="w-1.5 h-4 bg-blue-400 animate-wave-1 rounded-full" />
            <span className="w-1.5 h-8 bg-blue-400 animate-wave-2 rounded-full" />
            <span className="w-1.5 h-6 bg-blue-400 animate-wave-3 rounded-full" />
            <span className="w-1.5 h-7 bg-blue-400 animate-wave-4 rounded-full" />
            <span className="w-1.5 h-3 bg-blue-400 animate-wave-5 rounded-full" />
          </div>
        )}

        {/* Transcripts Display Area */}
        <div className="w-full space-y-4 max-h-56 overflow-y-auto px-4 py-2">
          {/* Student Speech Transcript */}
          {(studentQuestion || interimTranscript) && (
            <div className="p-3.5 rounded-2xl bg-slate-900 border border-slate-800 text-left text-xs sm:text-sm">
              <span className="text-slate-400 font-semibold block text-[11px] uppercase tracking-wider mb-1">
                You asked:
              </span>
              <p className="text-white">
                {studentQuestion || interimTranscript}
              </p>
            </div>
          )}

          {/* Assistant Answer Transcript */}
          {assistantAnswer && (
            <div className="p-3.5 rounded-2xl bg-blue-950/40 border border-blue-900/60 text-left text-xs sm:text-sm">
              <span className="text-blue-400 font-semibold block text-[11px] uppercase tracking-wider mb-1">
                Anand-ICE Answer:
              </span>
              <p className="text-slate-200 whitespace-pre-wrap leading-relaxed">
                {assistantAnswer}
              </p>
            </div>
          )}

          {/* Error Notice */}
          {recError && (
            <div className="flex items-center gap-2 p-3 rounded-xl bg-rose-950/50 border border-rose-800 text-rose-300 text-xs text-left">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
              <span>{recError}</span>
            </div>
          )}
        </div>
      </div>

      {/* Bottom Footer Controls */}
      <div className="max-w-4xl w-full mx-auto flex items-center justify-between border-t border-slate-800 pt-4 text-xs text-slate-400">
        <span>Turn-by-turn conversational FAQ AI</span>
        <button
          onClick={handleClose}
          className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-medium transition-colors"
        >
          End Voice Mode
        </button>
      </div>
    </div>
  );
};

