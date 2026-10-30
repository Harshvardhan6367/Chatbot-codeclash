import React, { useState, useEffect, useRef } from 'react';
import {
  Send,
  Mic,
  MicOff,
  Trash2,
  Loader2,
  AlertCircle,
  X,
  Sparkles,
} from 'lucide-react';
import { useVoiceRecognition } from '../hooks/useVoiceRecognition';
import { VoiceSettings } from '../types';

interface ChatInputProps {
  onSendMessage: (query: string) => void;
  isLoading: boolean;
  onClearChat: () => void;
  hasMessages: boolean;
  voiceSettings: VoiceSettings;
}

export const ChatInput: React.FC<ChatInputProps> = ({
  onSendMessage,
  isLoading,
  onClearChat,
  hasMessages,
  voiceSettings,
}) => {
  const [inputText, setInputText] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const {
    isListening,
    transcript,
    interimTranscript,
    error: voiceError,
    startListening,
    stopListening,
    isTranscribingBackend,
    setTranscript,
  } = useVoiceRecognition(voiceSettings.language);

  // Sync speech transcript into input field so student can edit it
  useEffect(() => {
    if (transcript) {
      setInputText((prev) => (prev ? `${prev} ${transcript}` : transcript));
      setTranscript('');
    }
  }, [transcript, setTranscript]);

  const handleSend = () => {
    const trimmed = inputText.trim();
    if (!trimmed || isLoading) return;

    if (isListening) {
      stopListening();
    }

    onSendMessage(trimmed);
    setInputText('');
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const toggleMic = () => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  };

  return (
    <div className="sticky bottom-0 z-20 bg-white/95 backdrop-blur-md border-t border-slate-200/90 p-3 sm:p-4 shadow-lg transition-all">
      <div className="max-w-4xl mx-auto space-y-2">
        {/* Voice Error Notice */}
        {voiceError && (
          <div className="flex items-center justify-between gap-2 p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-800 animate-fadeIn">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{voiceError}</span>
            </div>
            <button
              onClick={() => {}}
              className="text-rose-500 hover:text-rose-700"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Live Listening Banner */}
        {isListening && (
          <div className="flex items-center justify-between px-3.5 py-2 rounded-2xl bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 text-xs text-blue-900 shadow-xs animate-fadeIn">
            <div className="flex items-center gap-2.5">
              <div className="flex items-center gap-1">
                <span className="w-1.5 h-3 bg-blue-600 animate-wave-1 rounded-full" />
                <span className="w-1.5 h-5 bg-blue-600 animate-wave-2 rounded-full" />
                <span className="w-1.5 h-4 bg-blue-600 animate-wave-3 rounded-full" />
                <span className="w-1.5 h-2 bg-blue-600 animate-wave-4 rounded-full" />
              </div>
              <span className="font-bold text-blue-950">
                Listening ({voiceSettings.language === 'hi-IN' ? 'Hindi / हिन्दी' : 'English'})...
              </span>
              {interimTranscript && (
                <span className="italic text-slate-700 truncate max-w-xs sm:max-w-md font-medium">
                  "{interimTranscript}"
                </span>
              )}
            </div>
            <button
              onClick={stopListening}
              className="px-3 py-1 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold text-[11px] transition-colors shadow-2xs"
            >
              Done Speaking
            </button>
          </div>
        )}

        {/* Transcribing status */}
        {isTranscribingBackend && (
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-indigo-50 border border-indigo-200 text-xs text-indigo-800">
            <Loader2 className="w-3.5 h-3.5 animate-spin text-indigo-600" />
            <span>Transcribing audio using Gemini AI...</span>
          </div>
        )}

        {/* Main Elevated Input Container */}
        <div className="flex items-end gap-2 bg-slate-50/90 border border-slate-300/90 focus-within:border-blue-600 focus-within:bg-white focus-within:ring-2 focus-within:ring-blue-500/20 rounded-2xl p-1.5 sm:p-2 transition-all shadow-inner">
          {/* Clear chat history action */}
          {hasMessages && (
            <button
              onClick={onClearChat}
              className="p-2.5 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors shrink-0"
              title="Clear current conversation"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}

          {/* Text Area */}
          <textarea
            ref={textareaRef}
            rows={1}
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={
              isListening
                ? 'Listening to speech... your words will appear here'
                : 'Ask anything about Anand-ICE (e.g. fees, bus routes, mid-sem exams, hostel)...'
            }
            className="flex-1 bg-transparent px-2.5 py-1.5 text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none resize-none max-h-32 min-h-[38px] leading-relaxed font-medium"
          />

          {/* Microphone Button */}
          <button
            onClick={toggleMic}
            className={`p-2 sm:p-2.5 rounded-xl transition-all flex items-center justify-center shrink-0 ${
              isListening
                ? 'bg-rose-600 hover:bg-rose-700 text-white animate-pulse shadow-md shadow-rose-500/30'
                : 'bg-white hover:bg-blue-50 border border-slate-200 hover:border-blue-300 text-blue-700 shadow-2xs active:scale-95'
            }`}
            title={isListening ? 'Stop listening' : 'Speak your question (Voice Input)'}
          >
            {isListening ? (
              <MicOff className="w-4 h-4 sm:w-5 sm:h-5" />
            ) : (
              <Mic className="w-4 h-4 sm:w-5 sm:h-5 text-blue-700" />
            )}
          </button>

          {/* Send Button */}
          <button
            onClick={handleSend}
            disabled={!inputText.trim() || isLoading}
            className="p-2 sm:p-2.5 rounded-xl bg-gradient-to-tr from-blue-700 to-indigo-600 hover:from-blue-800 hover:to-indigo-700 disabled:bg-none disabled:bg-slate-200 disabled:text-slate-400 text-white transition-all flex items-center justify-center shrink-0 shadow-sm shadow-blue-600/20 active:scale-95 disabled:active:scale-100"
            title="Send question"
          >
            {isLoading ? (
              <Loader2 className="w-4 h-4 sm:w-5 sm:h-5 animate-spin" />
            ) : (
              <Send className="w-4 h-4 sm:w-5 sm:h-5" />
            )}
          </button>
        </div>

        {/* Footnote hint */}
        <div className="flex items-center justify-between text-[11px] text-slate-400 px-1 font-medium">
          <span className="flex items-center gap-1.5">
            <Sparkles className="w-3 h-3 text-blue-600" />
            Anand International College of Engineering • Grounded Campus AI
          </span>
          <span className="hidden sm:inline">Press Enter to send, Shift+Enter for new line</span>
        </div>
      </div>
    </div>
  );
};
