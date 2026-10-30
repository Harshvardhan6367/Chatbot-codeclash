import { ChatMessage, ConversationSummary } from '../types';

export interface StoredConversation {
  conversationId: string;
  title: string;
  messages: ChatMessage[];
  createdAt: string;
  updatedAt: string;
}

export interface StoredFeedback {
  id: string;
  conversationId: string;
  messageId: string;
  rating: 'helpful' | 'unhelpful';
  comment?: string;
  createdAt: string;
}

const CONVERSATIONS_KEY = 'anand_ice_conversations';
const FEEDBACK_KEY = 'anand_ice_feedback';
const API_KEY_STORAGE = 'anand_ice_gemini_api_key';
const VECTORS_STORAGE = 'anand_ice_faq_vectors_v1';

export const storageService = {
  // --- GEMINI API KEY MANAGEMENT ---
  getApiKey(): string {
    const fromStorage = localStorage.getItem(API_KEY_STORAGE);
    if (fromStorage && fromStorage.trim().length > 5) {
      return fromStorage.trim();
    }
    const fromEnv = import.meta.env.VITE_GEMINI_API_KEY;
    if (fromEnv && fromEnv.trim().length > 5 && fromEnv !== 'your_gemini_api_key') {
      return fromEnv.trim();
    }
    return '';
  },

  setApiKey(key: string): void {
    if (!key || !key.trim()) {
      localStorage.removeItem(API_KEY_STORAGE);
    } else {
      localStorage.setItem(API_KEY_STORAGE, key.trim());
    }
  },

  // --- CONVERSATION CRUD ---
  listConversations(): ConversationSummary[] {
    try {
      const raw = localStorage.getItem(CONVERSATIONS_KEY);
      if (!raw) return [];
      const list: StoredConversation[] = JSON.parse(raw);
      return list
        .map((c) => ({
          conversationId: c.conversationId,
          title: c.title,
          createdAt: c.createdAt,
          updatedAt: c.updatedAt,
          messageCount: c.messages?.length || 0,
        }))
        .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
    } catch (e) {
      console.warn('Failed to parse conversations from localStorage:', e);
      return [];
    }
  },

  getConversation(conversationId: string): StoredConversation | null {
    try {
      const raw = localStorage.getItem(CONVERSATIONS_KEY);
      if (!raw) return null;
      const list: StoredConversation[] = JSON.parse(raw);
      return list.find((c) => c.conversationId === conversationId) || null;
    } catch (e) {
      return null;
    }
  },

  saveMessage(
    conversationId: string,
    message: ChatMessage,
    initialTitle?: string
  ): StoredConversation {
    const raw = localStorage.getItem(CONVERSATIONS_KEY);
    let list: StoredConversation[] = raw ? JSON.parse(raw) : [];

    let conv = list.find((c) => c.conversationId === conversationId);
    const now = new Date().toISOString();

    if (!conv) {
      conv = {
        conversationId,
        title: initialTitle || (message.role === 'user' ? message.content.slice(0, 40) : 'New Conversation'),
        messages: [message],
        createdAt: now,
        updatedAt: now,
      };
      list.unshift(conv);
    } else {
      conv.messages.push(message);
      conv.updatedAt = now;
      if (conv.messages.length === 1 && message.role === 'user') {
        conv.title = message.content.slice(0, 40);
      }
    }

    localStorage.setItem(CONVERSATIONS_KEY, JSON.stringify(list));
    return conv;
  },

  deleteConversation(conversationId: string): boolean {
    const raw = localStorage.getItem(CONVERSATIONS_KEY);
    if (!raw) return false;
    let list: StoredConversation[] = JSON.parse(raw);
    const filtered = list.filter((c) => c.conversationId !== conversationId);
    if (filtered.length !== list.length) {
      localStorage.setItem(CONVERSATIONS_KEY, JSON.stringify(filtered));
      return true;
    }
    return false;
  },

  clearAllConversations(): void {
    localStorage.removeItem(CONVERSATIONS_KEY);
  },

  // --- FEEDBACK STORAGE ---
  recordFeedback(
    conversationId: string,
    messageId: string,
    rating: 'helpful' | 'unhelpful',
    comment?: string
  ): StoredFeedback {
    const raw = localStorage.getItem(FEEDBACK_KEY);
    const list: StoredFeedback[] = raw ? JSON.parse(raw) : [];

    const feedback: StoredFeedback = {
      id: `fb_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      conversationId,
      messageId,
      rating,
      comment,
      createdAt: new Date().toISOString(),
    };
    list.push(feedback);
    localStorage.setItem(FEEDBACK_KEY, JSON.stringify(list));

    // Also update message rating inside conversation
    const conv = this.getConversation(conversationId);
    if (conv) {
      const msg = conv.messages.find((m) => m.id === messageId);
      if (msg) {
        msg.feedback = rating;
        this.saveMessage(conversationId, msg);
      }
    }

    return feedback;
  },

  // --- LOCAL VECTOR CACHE ---
  getStoredVectors(): Record<string, number[]> | null {
    try {
      const raw = localStorage.getItem(VECTORS_STORAGE);
      return raw ? JSON.parse(raw) : null;
    } catch (e) {
      return null;
    }
  },

  saveStoredVectors(vectors: Record<string, number[]>): void {
    try {
      localStorage.setItem(VECTORS_STORAGE, JSON.stringify(vectors));
    } catch (e) {
      console.warn('Could not cache vectors to localStorage:', e);
    }
  },
};

