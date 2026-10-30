import React, { useState } from 'react';
import {
  MessageSquare,
  Plus,
  Trash2,
  FolderOpen,
  Volume2,
  Settings,
  Sparkles,
  Database,
  Radio,
  X,
  ChevronRight,
  ShieldCheck,
  GraduationCap,
  MapPin,
  Phone,
  Mail,
  Key,
} from 'lucide-react';
import { ConversationSummary, FaqTopic, HealthStatus, VoiceSettings } from '../types';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  conversations: ConversationSummary[];
  currentConversationId: string;
  onSelectConversation: (id: string) => void;
  onNewChat: () => void;
  onDeleteConversation: (id: string) => void;
  topics: FaqTopic[];
  onSelectTopic: (category: string) => void;
  voiceSettings: VoiceSettings;
  onUpdateVoiceSettings: (settings: Partial<VoiceSettings>) => void;
  health: HealthStatus | null;
  onOpenApiKeyModal: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  isOpen,
  onClose,
  conversations,
  currentConversationId,
  onSelectConversation,
  onNewChat,
  onDeleteConversation,
  topics,
  onSelectTopic,
  voiceSettings,
  onUpdateVoiceSettings,
  health,
  onOpenApiKeyModal,
}) => {
  const [activeTab, setActiveTab] = useState<'chats' | 'topics' | 'settings'>('chats');

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 z-40 bg-slate-950/50 backdrop-blur-xs md:hidden transition-opacity"
        />
      )}

      {/* Sidebar Panel */}
      <aside
        className={`fixed md:static inset-y-0 left-0 z-50 w-72 sm:w-80 bg-slate-950 text-slate-100 flex flex-col border-r border-slate-800/80 shadow-2xl md:shadow-none transition-transform duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
      >
        {/* Header / Brand */}
        <div className="p-4 border-b border-slate-800/80 flex items-center justify-between bg-slate-900/40">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-700 to-indigo-600 flex items-center justify-center font-bold text-white text-xs shadow-md shadow-blue-600/30 shrink-0 border border-blue-500/30">
              AICE
            </div>
            <div className="min-w-0">
              <h2 className="text-xs sm:text-sm font-bold tracking-tight text-white truncate">
                Anand-ICE Jaipur
              </h2>
              <p className="text-[11px] text-slate-400 truncate">
                Anand International College of Engg.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="md:hidden p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Action: New Chat */}
        <div className="p-3">
          <button
            onClick={() => {
              onNewChat();
              onClose();
            }}
            className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-semibold py-2.5 px-4 rounded-xl shadow-sm shadow-blue-500/20 transition-all active:scale-98"
          >
            <Plus className="w-4 h-4" />
            <span className="text-xs sm:text-sm">New Conversation</span>
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="px-3 pt-1 flex items-center border-b border-slate-800/80 gap-1 text-xs font-semibold">
          <button
            onClick={() => setActiveTab('chats')}
            className={`flex-1 py-2 text-center rounded-lg transition-colors flex items-center justify-center gap-1.5 ${
              activeTab === 'chats'
                ? 'bg-slate-800 text-white font-bold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <MessageSquare className="w-3.5 h-3.5" />
            <span>Chats ({conversations.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('topics')}
            className={`flex-1 py-2 text-center rounded-lg transition-colors flex items-center justify-center gap-1.5 ${
              activeTab === 'topics'
                ? 'bg-slate-800 text-white font-bold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <FolderOpen className="w-3.5 h-3.5" />
            <span>Topics</span>
          </button>
          <button
            onClick={() => setActiveTab('settings')}
            className={`flex-1 py-2 text-center rounded-lg transition-colors flex items-center justify-center gap-1.5 ${
              activeTab === 'settings'
                ? 'bg-slate-800 text-white font-bold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Volume2 className="w-3.5 h-3.5" />
            <span>Voice</span>
          </button>
        </div>

        {/* Scrollable Content Body */}
        <div className="flex-1 overflow-y-auto p-3 space-y-2">
          {/* TAB 1: RECENT CHATS */}
          {activeTab === 'chats' && (
            <div className="space-y-1">
              {conversations.length === 0 ? (
                <div className="text-center py-10 px-4 text-slate-500 text-xs">
                  <MessageSquare className="w-8 h-8 mx-auto mb-2.5 opacity-30 text-blue-400" />
                  <p className="font-medium text-slate-400">No previous conversations.</p>
                  <p className="mt-1 text-[11px] text-slate-500">Ask a question to start chatting!</p>
                </div>
              ) : (
                conversations.map((conv) => {
                  const isActive = conv.conversationId === currentConversationId;
                  return (
                    <div
                      key={conv.conversationId}
                      className={`group flex items-center justify-between rounded-xl px-3 py-2.5 text-xs transition-all ${
                        isActive
                          ? 'bg-blue-950/60 text-white font-semibold border border-blue-800/80'
                          : 'text-slate-300 hover:bg-slate-800/60 hover:text-white'
                      }`}
                    >
                      <button
                        onClick={() => {
                          onSelectConversation(conv.conversationId);
                          onClose();
                        }}
                        className="flex-1 text-left truncate flex items-center gap-2"
                        title={conv.title}
                      >
                        <MessageSquare className={`w-3.5 h-3.5 shrink-0 ${isActive ? 'text-blue-400' : 'text-slate-500'}`} />
                        <span className="truncate">{conv.title || 'Conversation'}</span>
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (confirm('Delete this conversation?')) {
                            onDeleteConversation(conv.conversationId);
                          }
                        }}
                        className="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-rose-400 rounded transition-opacity"
                        title="Delete conversation"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  );
                })
              )}
            </div>
          )}

          {/* TAB 2: FAQ CATEGORIES */}
          {activeTab === 'topics' && (
            <div className="space-y-1.5">
              <p className="text-[11px] text-slate-400 px-1 pb-1">
                Official Anand-ICE Knowledge Base:
              </p>
              {topics.map((t) => (
                <button
                  key={t.category}
                  onClick={() => {
                    onSelectTopic(t.category);
                    onClose();
                  }}
                  className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs text-slate-300 hover:bg-slate-800 hover:text-white transition-colors group text-left"
                >
                  <span className="font-medium group-hover:text-blue-400 transition-colors truncate">
                    {t.category}
                  </span>
                  <span className="px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 text-[10px] group-hover:bg-blue-900/50 group-hover:text-blue-300">
                    {t.count}
                  </span>
                </button>
              ))}
            </div>
          )}

          {/* TAB 3: VOICE & API SETTINGS */}
          {activeTab === 'settings' && (
            <div className="space-y-4 px-1 py-2 text-xs">
              {/* API Key Status & Config */}
              <div className="p-3 bg-slate-900/90 rounded-xl border border-slate-800">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-slate-300 font-bold flex items-center gap-1.5">
                    <Key className="w-3.5 h-3.5 text-blue-400" />
                    Gemini API Key
                  </span>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      health?.ai.geminiConfigured
                        ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                        : 'bg-amber-950 text-amber-400 border border-amber-800'
                    }`}
                  >
                    {health?.ai.geminiConfigured ? 'Active' : 'Unset'}
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 mb-2.5">
                  {health?.ai.geminiConfigured
                    ? 'Gemini 3.8 Flash & Embedding 2 active.'
                    : 'Using in-browser offline lexical matching.'}
                </p>
                <button
                  onClick={() => {
                    onOpenApiKeyModal();
                    onClose();
                  }}
                  className="w-full py-2 px-3 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-lg text-xs transition-colors flex items-center justify-center gap-1.5 shadow-xs"
                >
                  <span>Configure API Key</span>
                </button>
              </div>

              {/* Language Selection */}
              <div>
                <label className="block text-slate-300 font-semibold mb-1.5">
                  Speech Recognition Language
                </label>
                <select
                  value={voiceSettings.language}
                  onChange={(e) =>
                    onUpdateVoiceSettings({
                      language: e.target.value as any,
                    })
                  }
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-1 focus:ring-blue-500 font-medium"
                >
                  <option value="en-US">English (Indian/International)</option>
                  <option value="hi-IN">Hindi / हिन्दी (hi-IN)</option>
                  <option value="hinglish">Hinglish / Bilingual</option>
                </select>
                <p className="text-[11px] text-slate-500 mt-1">
                  Optimized for bilingual Indian engineering students.
                </p>
              </div>

              {/* TTS Voice Persona */}
              <div>
                <label className="block text-slate-300 font-semibold mb-1.5">
                  TTS Spoken Voice Persona
                </label>
                <select
                  value={voiceSettings.ttsVoice}
                  onChange={(e) =>
                    onUpdateVoiceSettings({
                      ttsVoice: e.target.value as any,
                    })
                  }
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-1 focus:ring-blue-500 font-medium"
                >
                  <option value="Kore">Kore (Warm & Academic)</option>
                  <option value="Puck">Puck (Crisp & Clear)</option>
                  <option value="Aoede">Aoede (Expressive Female)</option>
                  <option value="Fenrir">Fenrir (Authoritative Male)</option>
                </select>
              </div>

              {/* Auto-read Toggle */}
              <div className="flex items-center justify-between pt-2 border-t border-slate-800">
                <div>
                  <span className="font-semibold text-slate-300 block">Auto-listen Response</span>
                  <span className="text-[11px] text-slate-500">Read assistant answers automatically</span>
                </div>
                <input
                  type="checkbox"
                  checked={voiceSettings.autoSpeak}
                  onChange={(e) =>
                    onUpdateVoiceSettings({ autoSpeak: e.target.checked })
                  }
                  className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 bg-slate-900 border-slate-700 cursor-pointer"
                />
              </div>
            </div>
          )}
        </div>

        {/* Anand-ICE Campus Quick Info */}
        <div className="p-3 border-t border-slate-800/80 bg-slate-950 text-[11px] text-slate-400 space-y-1.5">
          <div className="flex items-center gap-1.5 text-slate-300 font-semibold mb-1">
            <GraduationCap className="w-3.5 h-3.5 text-blue-400" />
            <span>Anand-ICE Helpdesk</span>
          </div>
          <div className="flex items-center gap-1.5 text-slate-400 text-[10px]">
            <Phone className="w-3 h-3 text-emerald-400 shrink-0" />
            <span>01429-243500 (Admin Office)</span>
          </div>
          <div className="flex items-center gap-1.5 text-slate-400 text-[10px]">
            <Mail className="w-3 h-3 text-indigo-400 shrink-0" />
            <span>admin@anandice.ac.in</span>
          </div>
          <div className="flex items-center gap-1.5 text-slate-400 text-[10px]">
            <MapPin className="w-3 h-3 text-rose-400 shrink-0" />
            <span>Agra Road, Jaipur, Rajasthan</span>
          </div>
        </div>

        {/* System Architecture Badge */}
        <div className="p-2.5 border-t border-slate-800/60 bg-slate-900/60 text-[10px] text-slate-400 flex items-center justify-between">
          <span className="text-slate-300 font-mono">Gemini 3.8 Flash</span>
          <span className="text-emerald-400 font-semibold">Local Vector RAG</span>
        </div>
      </aside>
    </>
  );
};
