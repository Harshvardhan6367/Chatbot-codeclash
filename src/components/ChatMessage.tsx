import React, { useState } from 'react';
import {
  Volume2,
  Square,
  Copy,
  Check,
  ThumbsUp,
  ThumbsDown,
  BookOpen,
  ChevronDown,
  ChevronUp,
  Loader2,
  GraduationCap,
  Sparkles,
} from 'lucide-react';
import { ChatMessage as ChatMessageType, FaqSource } from '../types';

interface ChatMessageProps {
  message: ChatMessageType;
  onPlaySpeech: (messageId: string, text: string) => void;
  onStopSpeech: () => void;
  isPlaying: boolean;
  isLoadingAudio: boolean;
  onFeedback: (messageId: string, rating: 'helpful' | 'unhelpful') => void;
}

export const ChatMessage: React.FC<ChatMessageProps> = ({
  message,
  onPlaySpeech,
  onStopSpeech,
  isPlaying,
  isLoadingAudio,
  onFeedback,
}) => {
  const [copied, setCopied] = useState(false);
  const [showSources, setShowSources] = useState(false);

  const isUser = message.role === 'user';

  const handleCopy = () => {
    navigator.clipboard.writeText(message.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Format message content with bold headings, bullets, and line breaks
  const renderFormattedContent = (text: string) => {
    return text.split('\n').map((line, index) => {
      // Bold bullet points (e.g. - **Class Timings:** ...)
      if (line.startsWith('- **') || line.startsWith('* **')) {
        const parts = line.replace(/^[-*]\s+/, '').split('**');
        return (
          <li key={index} className="ml-4 list-disc text-slate-700 my-1">
            <strong className="text-slate-900 font-semibold">{parts[1]}</strong>
            {parts.slice(2).join('**')}
          </li>
        );
      }
      // Simple bullet points
      if (line.startsWith('- ') || line.startsWith('* ')) {
        return (
          <li key={index} className="ml-4 list-disc text-slate-700 my-1">
            {line.replace(/^[-*]\s+/, '')}
          </li>
        );
      }
      // Header ## or ###
      if (line.startsWith('### ') || line.startsWith('## ')) {
        return (
          <h4 key={index} className="font-bold text-slate-900 mt-2.5 mb-1 text-sm sm:text-base">
            {line.replace(/^#+\s+/, '')}
          </h4>
        );
      }
      // Empty line
      if (!line.trim()) {
        return <div key={index} className="h-1.5" />;
      }
      // Normal paragraph with inline **bold**
      const inlineParts = line.split('**');
      return (
        <p key={index} className="my-1 leading-relaxed text-slate-800">
          {inlineParts.map((segment, sIdx) =>
            sIdx % 2 === 1 ? (
              <strong key={sIdx} className="font-semibold text-slate-900">
                {segment}
              </strong>
            ) : (
              segment
            )
          )}
        </p>
      );
    });
  };

  return (
    <div className={`flex w-full ${isUser ? 'justify-end' : 'justify-start'} my-3 px-1 sm:px-2`}>
      <div
        className={`flex gap-3 max-w-[92%] sm:max-w-[85%] md:max-w-[78%] ${
          isUser ? 'flex-row-reverse' : 'flex-row'
        }`}
      >
        {/* Avatar */}
        <div className="shrink-0 mt-0.5">
          {isUser ? (
            <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs font-semibold shadow-sm">
              You
            </div>
          ) : (
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-slate-900 to-blue-900 text-white flex items-center justify-center shadow-sm">
              <GraduationCap className="w-4 h-4 text-blue-300" />
            </div>
          )}
        </div>

        {/* Message Card */}
        <div className="flex flex-col gap-1.5 min-w-0">
          <div
            className={`rounded-2xl px-4 py-3 sm:px-5 sm:py-3.5 shadow-sm text-sm break-words transition-all ${
              isUser
                ? 'bg-blue-600 text-white rounded-tr-xs'
                : 'bg-white border border-slate-200/90 text-slate-800 rounded-tl-xs shadow-slate-200/50'
            }`}
          >
            {/* Header info for assistant */}
            {!isUser && (
              <div className="flex items-center justify-between gap-2 pb-2 mb-2 border-b border-slate-100 text-xs text-slate-400">
                <span className="font-semibold text-slate-800 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                  Anand-ICE Campus Assistant
                </span>
                <span className="text-[11px] text-slate-400 font-mono">
                  {new Date(message.timestamp).toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </span>
              </div>
            )}

            {/* Message Body */}
            <div className={`space-y-0.5 ${isUser ? 'text-white' : 'text-slate-800'}`}>
              {isUser ? (
                <p className="leading-relaxed whitespace-pre-wrap">{message.content}</p>
              ) : (
                renderFormattedContent(message.content)
              )}
            </div>

            {/* Assistant Sources Drawer */}
            {!isUser && message.sources && message.sources.length > 0 && (
              <div className="mt-3 pt-2 border-t border-slate-100">
                <button
                  onClick={() => setShowSources(!showSources)}
                  className="flex items-center justify-between w-full text-xs font-medium text-blue-700 hover:text-blue-800 py-1 transition-colors group"
                >
                  <span className="flex items-center gap-1.5">
                    <BookOpen className="w-3.5 h-3.5 text-blue-600" />
                    Verified FAQ Source ({message.sources.length})
                  </span>
                  {showSources ? (
                    <ChevronUp className="w-3.5 h-3.5" />
                  ) : (
                    <ChevronDown className="w-3.5 h-3.5" />
                  )}
                </button>

                {showSources && (
                  <div className="mt-2 space-y-2 text-xs">
                    {message.sources.map((source, sIdx) => (
                      <div
                        key={source.faq_id || sIdx}
                        className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1"
                      >
                        <div className="flex items-center justify-between font-semibold text-slate-900">
                          <span className="text-blue-700">
                            [{source.faq_id}] {source.category}
                          </span>
                          {source.score !== undefined && (
                            <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-blue-100 text-blue-800">
                              {(source.score * 100).toFixed(0)}% match
                            </span>
                          )}
                        </div>
                        <p className="font-medium text-slate-800">Q: {source.question}</p>
                        <p className="text-slate-600">A: {source.answer}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Action Toolbar for Assistant */}
          {!isUser && (
            <div className="flex items-center gap-2 px-1 text-xs text-slate-500">
              {/* Listen / Voice Output Button */}
              <button
                onClick={() => {
                  if (isPlaying) {
                    onStopSpeech();
                  } else {
                    onPlaySpeech(message.id, message.content);
                  }
                }}
                disabled={isLoadingAudio}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-xs font-medium transition-all ${
                  isPlaying
                    ? 'bg-rose-50 border-rose-200 text-rose-700 hover:bg-rose-100'
                    : 'bg-white border-slate-200 hover:bg-slate-100 text-slate-700 hover:border-slate-300'
                }`}
                title={isPlaying ? 'Stop playback' : 'Listen to this response'}
              >
                {isLoadingAudio ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-blue-600" />
                    <span>Loading audio...</span>
                  </>
                ) : isPlaying ? (
                  <>
                    <Square className="w-3.5 h-3.5 fill-rose-600 text-rose-600" />
                    <span>Stop</span>
                    <div className="flex items-center gap-0.5 ml-1">
                      <span className="w-1 h-2 bg-rose-500 animate-wave-1 rounded-full" />
                      <span className="w-1 h-3 bg-rose-500 animate-wave-2 rounded-full" />
                      <span className="w-1 h-2 bg-rose-500 animate-wave-3 rounded-full" />
                    </div>
                  </>
                ) : (
                  <>
                    <Volume2 className="w-3.5 h-3.5 text-blue-600" />
                    <span>Listen</span>
                  </>
                )}
              </button>

              {/* Copy Answer Button */}
              <button
                onClick={handleCopy}
                className="flex items-center gap-1 px-2 py-1 rounded-lg hover:bg-slate-200/70 text-slate-600 hover:text-slate-900 transition-colors"
                title="Copy answer"
              >
                {copied ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                    <span className="text-emerald-600 text-[11px] font-medium">Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span className="text-[11px]">Copy</span>
                  </>
                )}
              </button>

              {/* Helpful / Unhelpful Feedback */}
              <div className="flex items-center gap-0.5 ml-1">
                <button
                  onClick={() => onFeedback(message.id, 'helpful')}
                  className={`p-1 rounded-md transition-colors ${
                    message.feedback === 'helpful'
                      ? 'bg-blue-100 text-blue-700'
                      : 'hover:bg-slate-200/70 text-slate-400 hover:text-slate-700'
                  }`}
                  title="Helpful response"
                >
                  <ThumbsUp className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => onFeedback(message.id, 'unhelpful')}
                  className={`p-1 rounded-md transition-colors ${
                    message.feedback === 'unhelpful'
                      ? 'bg-rose-100 text-rose-700'
                      : 'hover:bg-slate-200/70 text-slate-400 hover:text-slate-700'
                  }`}
                  title="Unhelpful response"
                >
                  <ThumbsDown className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

