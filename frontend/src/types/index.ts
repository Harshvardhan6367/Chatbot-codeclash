export interface FaqSource {
  faq_id: string;
  category: string;
  question: string;
  answer: string;
  score?: number;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  sources?: FaqSource[];
  feedback?: 'helpful' | 'unhelpful' | null;
  timestamp: string | Date;
  isStreaming?: boolean;
}

export interface ConversationSummary {
  conversationId: string;
  title: string;
  createdAt: string;
  updatedAt: string;
  messageCount: number;
}

export interface FaqTopic {
  category: string;
  count: number;
  sampleQuestions: string[];
}

export interface HealthStatus {
  status: string;
  service: string;
  version: string;
  timestamp: string;
  ai: {
    geminiConfigured: boolean;
    chatModel: string;
    embeddingModel: string;
    ttsModel: string;
  };
  vectorDatabase: {
    pineconeConfigured: boolean;
    index: string;
    namespace: string;
    dimension: number;
  };
  database: {
    connected: boolean;
    mode: string;
  };
  knowledgeBase: {
    authoritativeFaqsCount: number;
    sampleCategories: string[];
  };
}

export interface VoiceSettings {
  language: 'en-US' | 'hi-IN' | 'hinglish';
  ttsVoice: 'Kore' | 'Puck' | 'Aoede' | 'Fenrir';
  autoSpeak: boolean;
}

