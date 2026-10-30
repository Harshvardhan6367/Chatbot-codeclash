import React from 'react';
import {
  GraduationCap,
  Mic,
  Plus,
  Menu,
  HelpCircle,
  Key,
  Sparkles,
  ShieldCheck,
} from 'lucide-react';
import { HealthStatus } from '../types';

interface HeaderProps {
  health: HealthStatus | null;
  healthLoading: boolean;
  onOpenVoiceMode: () => void;
  onNewChat: () => void;
  onToggleSidebar: () => void;
  onOpenFaqExplorer: () => void;
  onOpenApiKeyModal: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  health,
  healthLoading,
  onOpenVoiceMode,
  onNewChat,
  onToggleSidebar,
  onOpenFaqExplorer,
  onOpenApiKeyModal,
}) => {
  const isKeyConfigured = Boolean(health?.ai.geminiConfigured);

  return (
    <header className="sticky top-0 z-30 bg-white/90 backdrop-blur-lg border-b border-slate-200/80 px-3.5 py-2.5 sm:px-6 shadow-xs transition-all">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-3">
        {/* Left: Mobile Drawer Button & College Brand */}
        <div className="flex items-center gap-2.5 sm:gap-3">
          <button
            onClick={onToggleSidebar}
            className="md:hidden p-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors active:scale-95"
            title="Open navigation menu"
            aria-label="Open navigation menu"
          >
            <Menu className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-3">
            {/* Custom Anand-ICE Emblem */}
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-blue-900 via-indigo-900 to-blue-700 flex items-center justify-center text-white shadow-md shadow-blue-900/20 shrink-0 border border-blue-800/40 relative">
              <GraduationCap className="w-5 h-5 text-blue-200" />
              <span className="absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full bg-amber-500 border-2 border-white flex items-center justify-center text-[8px] font-black text-slate-900">
                ★
              </span>
            </div>

            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-sm sm:text-base md:text-lg font-bold text-slate-900 tracking-tight leading-tight">
                  Anand International College of Engineering
                </h1>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100/90 text-blue-800 border border-blue-200 uppercase tracking-wide hidden lg:inline-block">
                  Anand-ICE Jaipur
                </span>
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200 hidden sm:inline-block">
                  AI Campus Assistant
                </span>
              </div>
              <p className="text-[11px] sm:text-xs text-slate-500 hidden sm:block">
                Official RAG Portal • Class Schedules, Fees, Hostels, Exams & Policies
              </p>
            </div>
          </div>
        </div>

        {/* Right: Clean, Harmonious Quick Action Toolbar */}
        <div className="flex items-center gap-1.5 sm:gap-2.5">
          {/* AI Connection Status */}
          <div
            className={`hidden xl:flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-xl border transition-all ${
              isKeyConfigured
                ? 'bg-emerald-50/80 text-emerald-700 border-emerald-200/80 shadow-xs'
                : 'bg-amber-50 text-amber-700 border-amber-200'
            }`}
            title={
              isKeyConfigured
                ? 'Gemini 3.8 Flash & Local Vector Store Active'
                : 'Local Offline Engine Active (Click API Key to enable Gemini vectors)'
            }
          >
            <span
              className={`w-2 h-2 rounded-full ${
                isKeyConfigured ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'
              }`}
            />
            <span className="font-semibold">
              {isKeyConfigured ? 'Gemini AI Ready' : 'Local Mode'}
            </span>
          </div>

          {/* Browse FAQs Button */}
          <button
            onClick={onOpenFaqExplorer}
            className="hidden md:flex items-center gap-1.5 text-xs font-semibold text-slate-700 hover:text-slate-950 bg-slate-100 hover:bg-slate-200/80 px-3 py-2 rounded-xl transition-all shadow-2xs"
            title="Browse all 30 official FAQ topics"
          >
            <HelpCircle className="w-3.5 h-3.5 text-blue-600" />
            <span>Browse FAQs</span>
          </button>

          {/* API Key Modal Button */}
          <button
            onClick={onOpenApiKeyModal}
            className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-xl border transition-all shadow-2xs ${
              isKeyConfigured
                ? 'bg-white hover:bg-slate-50 text-slate-700 border-slate-200 hover:border-slate-300'
                : 'bg-gradient-to-r from-amber-50 to-orange-50 hover:from-amber-100 hover:to-orange-100 text-amber-900 border-amber-300 shadow-xs'
            }`}
            title="Configure Gemini API Key"
          >
            <Key className={`w-3.5 h-3.5 ${isKeyConfigured ? 'text-blue-600' : 'text-amber-600'}`} />
            <span className="hidden sm:inline">
              {isKeyConfigured ? 'API Key' : 'Setup Key'}
            </span>
          </button>

          {/* Voice Mode Button */}
          <button
            onClick={onOpenVoiceMode}
            className="flex items-center gap-1.5 text-xs sm:text-sm font-semibold bg-gradient-to-r from-blue-700 via-indigo-600 to-blue-600 hover:from-blue-800 hover:to-indigo-700 text-white px-3 sm:px-4 py-2 rounded-xl shadow-sm shadow-blue-600/25 active:scale-95 transition-all"
            title="Enter hands-free voice conversation mode"
          >
            <Mic className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-blue-100" />
            <span className="hidden sm:inline">Voice Mode</span>
          </button>

          {/* New Chat Button */}
          <button
            onClick={onNewChat}
            className="flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-slate-800 hover:text-slate-950 bg-white border border-slate-300 hover:border-slate-400 hover:bg-slate-50 px-3 sm:px-3.5 py-2 rounded-xl active:scale-95 transition-all shadow-2xs"
            title="Start new conversation"
          >
            <Plus className="w-4 h-4 text-slate-600" />
            <span className="hidden sm:inline">New Chat</span>
          </button>
        </div>
      </div>
    </header>
  );
};
