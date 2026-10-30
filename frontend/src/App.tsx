import React, { useState, useEffect, useRef } from 'react';
import { api, getOrCreateSessionId } from './services/api';
import {
  ChatMessage as ChatMessageType,
  ConversationSummary,
  FaqTopic,
  HealthStatus,
  VoiceSettings,
} from './types';
import { useVoiceSynthesis } from './hooks/useVoiceSynthesis';
import { Header } from './components/Header';
import { Sidebar } from './components/Sidebar';
import { ChatMessage } from './components/ChatMessage';
import { SuggestedQuestions } from './components/SuggestedQuestions';
import { ChatInput } from './components/ChatInput';
import { VoiceModeModal } from './components/VoiceModeModal';
import { FaqTopicDrawer } from './components/FaqTopicDrawer';
import { ApiKeyModal } from './components/ApiKeyModal';
import { localVectorStore } from './services/localVectorStore';
import { Loader2 } from 'lucide-react';

export function App() {
  const [conversationId, setConversationId] = useState<string>(() => {
    return `conv_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  });
  const [messages, setMessages] = useState<ChatMessageType[]>([]);
  const [conversations, setConversations] = useState<ConversationSummary[]>([]);
  const [topics, setTopics] = useState<FaqTopic[]>([]);
  const [health, setHealth] = useState<HealthStatus | null>(null);
  const [healthLoading, setHealthLoading] = useState(true);
  const [isLoading, setIsLoading] = useState(false);

  // Modals & Panels
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isVoiceModeOpen, setIsVoiceModeOpen] = useState(false);
  const [isFaqDrawerOpen, setIsFaqDrawerOpen] = useState(false);
  const [isApiKeyModalOpen, setIsApiKeyModalOpen] = useState(false);

  // Voice Settings (stored in localStorage)
  const [voiceSettings, setVoiceSettings] = useState<VoiceSettings>(() => {
    const saved = localStorage.getItem('anand_ice_voice_settings');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        // Fallback default
      }
    }
    return {
      language: 'en-US',
      ttsVoice: 'Kore',
      autoSpeak: false,
    };
  });

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Voice synthesis hook
  const {
    isPlaying,
    isLoading: isTtsLoading,
    activeMessageId,
    play: playSpeech,
    stop: stopSpeech,
  } = useVoiceSynthesis(
    voiceSettings.ttsVoice,
    voiceSettings.language === 'hi-IN' ? 'hi' : 'en'
  );

  // Save voice settings
  const updateVoiceSettings = (newSettings: Partial<VoiceSettings>) => {
    setVoiceSettings((prev) => {
      const updated = { ...prev, ...newSettings };
      localStorage.setItem('anand_ice_voice_settings', JSON.stringify(updated));
      return updated;
    });
  };

  // Initial Data Load & Health Poll
  useEffect(() => {
    loadHealth();
    loadTopics();
    loadConversations();

    const healthInterval = setInterval(loadHealth, 30000);
    return () => clearInterval(healthInterval);
  }, []);

  // Scroll to bottom on new message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const loadHealth = async () => {
    try {
      const data = await api.getHealth();
      setHealth(data);
    } catch (e) {
      setHealth(null);
    } finally {
      setHealthLoading(false);
    }
  };

  const loadTopics = async () => {
    try {
      const res = await api.getTopics();
      setTopics(res.categories || []);
    } catch (e) {
      console.warn('Could not load topics:', e);
    }
  };

  const loadConversations = async () => {
    try {
      const list = await api.listConversations();
      setConversations(list);
    } catch (e) {
      console.warn('Could not load conversations:', e);
    }
  };

  const handleSendMessage = async (query: string): Promise<string | null> => {
    if (!query.trim() || isLoading) return null;

    const userMsgId = `usr_${Date.now()}`;
    const userMessage: ChatMessageType = {
      id: userMsgId,
      role: 'user',
      content: query.trim(),
      timestamp: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setIsLoading(true);

    try {
      const res = await api.sendChat(query.trim(), conversationId);

      const assistantMessage: ChatMessageType = {
        id: res.messageId || `asst_${Date.now()}`,
        role: 'assistant',
        content: res.answer,
        sources: res.sources,
        timestamp: new Date().toISOString(),
      };

      setMessages((prev) => [...prev, assistantMessage]);
      loadConversations();

      // If user enabled auto-speak, read answer aloud
      if (voiceSettings.autoSpeak) {
        playSpeech(assistantMessage.id, assistantMessage.content);
      }

      return res.answer;
    } catch (err: any) {
      const errorMessage: ChatMessageType = {
        id: `err_${Date.now()}`,
        role: 'assistant',
        content:
          "I'm sorry, I encountered an issue retrieving information from the Anand-ICE knowledge base. Please check your query or try again.",
        timestamp: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, errorMessage]);
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  const handleNewChat = () => {
    stopSpeech();
    const newId = `conv_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    setConversationId(newId);
    setMessages([]);
  };

  const handleSelectConversation = async (id: string) => {
    stopSpeech();
    try {
      setIsLoading(true);
      const conv = await api.getConversation(id);
      if (conv) {
        setConversationId(conv.conversationId);
        setMessages(conv.messages || []);
      }
    } catch (err) {
      console.error('Failed to load conversation:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteConversation = async (id: string) => {
    try {
      await api.deleteConversation(id);
      loadConversations();
      if (conversationId === id) {
        handleNewChat();
      }
    } catch (err) {
      console.error('Failed to delete conversation:', err);
    }
  };

  const handleFeedback = async (
    messageId: string,
    rating: 'helpful' | 'unhelpful'
  ) => {
    setMessages((prev) =>
      prev.map((m) => (m.id === messageId ? { ...m, feedback: rating } : m))
    );
    try {
      await api.submitFeedback(conversationId, messageId, rating);
    } catch (e) {
      console.warn('Feedback submission failed:', e);
    }
  };

  return (
    <div className="flex h-screen bg-slate-50 text-slate-900 overflow-hidden">
      {/* Sidebar navigation */}
      <Sidebar
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        conversations={conversations}
        currentConversationId={conversationId}
        onSelectConversation={handleSelectConversation}
        onNewChat={handleNewChat}
        onDeleteConversation={handleDeleteConversation}
        topics={topics}
        onSelectTopic={(category) => {
          handleSendMessage(`Tell me about ${category}`);
        }}
        voiceSettings={voiceSettings}
        onUpdateVoiceSettings={updateVoiceSettings}
        health={health}
        onOpenApiKeyModal={() => setIsApiKeyModalOpen(true)}
      />

      {/* Main Chat Interface */}
      <div className="flex-1 flex flex-col h-full min-w-0 overflow-hidden relative">
        <Header
          health={health}
          healthLoading={healthLoading}
          onOpenVoiceMode={() => setIsVoiceModeOpen(true)}
          onNewChat={handleNewChat}
          onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
          onOpenFaqExplorer={() => setIsFaqDrawerOpen(true)}
          onOpenApiKeyModal={() => setIsApiKeyModalOpen(true)}
        />

        {/* Scrollable Message List or Welcome Screen */}
        <main className="flex-1 overflow-y-auto px-2 sm:px-4 py-4 space-y-2">
          {messages.length === 0 ? (
            <SuggestedQuestions onSelectQuestion={handleSendMessage} />
          ) : (
            <div className="max-w-4xl mx-auto space-y-1">
              {messages.map((message) => (
                <ChatMessage
                  key={message.id}
                  message={message}
                  onPlaySpeech={playSpeech}
                  onStopSpeech={stopSpeech}
                  isPlaying={isPlaying && activeMessageId === message.id}
                  isLoadingAudio={isTtsLoading && activeMessageId === message.id}
                  onFeedback={handleFeedback}
                />
              ))}

              {/* Bot thinking indicator */}
              {isLoading && (
                <div className="flex items-center gap-3 py-3 px-2">
                  <div className="w-8 h-8 rounded-full bg-slate-900 text-white flex items-center justify-center shadow-xs">
                    <Loader2 className="w-4 h-4 animate-spin text-blue-400" />
                  </div>
                  <div className="bg-white border border-slate-200 px-4 py-3 rounded-2xl rounded-tl-xs shadow-xs text-xs text-slate-500 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-blue-600 animate-ping" />
                    <span>Searching Anand-ICE knowledge base...</span>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>
          )}
        </main>

        {/* Docked Chat Input */}
        <ChatInput
          onSendMessage={handleSendMessage}
          isLoading={isLoading}
          onClearChat={handleNewChat}
          hasMessages={messages.length > 0}
          voiceSettings={voiceSettings}
        />
      </div>

      {/* Full-Screen Voice Conversation Mode Modal */}
      <VoiceModeModal
        isOpen={isVoiceModeOpen}
        onClose={() => setIsVoiceModeOpen(false)}
        onSendMessage={handleSendMessage}
        voiceSettings={voiceSettings}
        onUpdateVoiceSettings={updateVoiceSettings}
      />

      {/* FAQ Browse Topics Drawer */}
      <FaqTopicDrawer
        isOpen={isFaqDrawerOpen}
        onClose={() => setIsFaqDrawerOpen(false)}
        topics={topics}
        onSelectQuestion={handleSendMessage}
      />

      {/* Gemini API Key Configuration Modal */}
      <ApiKeyModal
        isOpen={isApiKeyModalOpen}
        onClose={() => setIsApiKeyModalOpen(false)}
        onKeySaved={loadHealth}
      />
    </div>
  );
}

export default App;

