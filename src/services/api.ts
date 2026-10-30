import {
  ChatMessage,
  ConversationSummary,
  FaqSource,
  FaqTopic,
  HealthStatus,
} from '../types';
import { AUTHORITATIVE_FAQS } from '../data/faqs';
import { storageService } from './storageService';
import { localVectorStore } from './localVectorStore';
import { answerStudentQuestion } from './ragService';
import {
  cleanTextForSpeech,
  generateSpeechAudio,
  getGeminiClient,
  isGeminiConfigured,
} from './geminiService';

export function getOrCreateSessionId(): string {
  const STORAGE_KEY = 'anand_ice_session_id';
  let sessionId = localStorage.getItem(STORAGE_KEY);
  if (!sessionId) {
    sessionId = `sess_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    localStorage.setItem(STORAGE_KEY, sessionId);
  }
  return sessionId;
}

export const api = {
  // System Health & Configuration Status
  async getHealth(): Promise<HealthStatus> {
    const hasKey = isGeminiConfigured();
    const vectorCount = localVectorStore.getVectorCount();

    return {
      status: 'ok',
      service: 'Anand International College of Engineering FAQ AI (Anand-ICE)',
      version: '2.0.0',
      timestamp: new Date().toISOString(),
      ai: {
        geminiConfigured: hasKey,
        chatModel: 'gemini-3.8-flash',
        embeddingModel: 'gemini-embedding-2',
        ttsModel: 'gemini-3.8-flash-tts',
      },
      vectorDatabase: {
        pineconeConfigured: false,
        index: `Local Vector Store (${vectorCount} vectors cached)`,
        namespace: 'client-memory',
        dimension: 768,
      },
      database: {
        connected: true,
        mode: 'localStorage',
      },
      knowledgeBase: {
        authoritativeFaqsCount: AUTHORITATIVE_FAQS.length,
        sampleCategories: [
          'Class Timings',
          'Fees',
          'Library',
          'Hostel',
          'Exams',
          'Placements',
        ],
      },
    };
  },

  // Chat Execution through Local RAG
  async sendChat(
    query: string,
    conversationId: string
  ): Promise<{
    answer: string;
    sources: FaqSource[];
    isGrounded: boolean;
    queryType: string;
    suggestions: string[];
    messageId: string;
    conversationId: string;
  }> {
    // 1. Save student message
    const userMsgId = `usr_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const userMsg: ChatMessage = {
      id: userMsgId,
      role: 'user',
      content: query,
      timestamp: new Date().toISOString(),
    };
    storageService.saveMessage(conversationId, userMsg);

    // 2. Fetch recent conversation history
    const conv = storageService.getConversation(conversationId);
    const history =
      conv?.messages?.slice(-6).map((m) => ({
        role: m.role,
        content: m.content,
      })) || [];

    // 3. Ensure local vectors are indexed in background
    localVectorStore.ensureIndexed().catch(() => {});

    // 4. Run client-side RAG
    const ragResult = await answerStudentQuestion(query, history);

    // 5. Save assistant message
    const assistantMsgId = `asst_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const assistantMsg: ChatMessage = {
      id: assistantMsgId,
      role: 'assistant',
      content: ragResult.answer,
      sources: ragResult.sources,
      timestamp: new Date().toISOString(),
    };
    storageService.saveMessage(conversationId, assistantMsg);

    return {
      answer: ragResult.answer,
      sources: ragResult.sources,
      isGrounded: ragResult.isGrounded,
      queryType: ragResult.queryType,
      suggestions: ragResult.suggestions || [],
      messageId: assistantMsgId,
      conversationId,
    };
  },

  // FAQ Topics Breakdown
  async getTopics(): Promise<{ totalFaqs: number; categories: FaqTopic[] }> {
    const map = new Map<string, string[]>();

    for (const faq of AUTHORITATIVE_FAQS) {
      if (!map.has(faq.category)) {
        map.set(faq.category, []);
      }
      map.get(faq.category)!.push(faq.question);
    }

    const categories: FaqTopic[] = [];
    for (const [category, questions] of map.entries()) {
      categories.push({
        category,
        count: questions.length,
        sampleQuestions: questions,
      });
    }

    return {
      totalFaqs: AUTHORITATIVE_FAQS.length,
      categories,
    };
  },

  // Local Vector & Lexical FAQ Search
  async searchFaqs(query: string): Promise<FaqSource[]> {
    return localVectorStore.search(query, 5);
  },

  // Conversation Listing (LocalStorage)
  async listConversations(): Promise<ConversationSummary[]> {
    return storageService.listConversations();
  },

  // Get Conversation Details
  async getConversation(
    conversationId: string
  ): Promise<{ conversationId: string; title: string; messages: ChatMessage[] } | null> {
    return storageService.getConversation(conversationId);
  },

  // Delete Conversation
  async deleteConversation(conversationId: string): Promise<boolean> {
    return storageService.deleteConversation(conversationId);
  },

  // Record Helpful / Unhelpful Feedback
  async submitFeedback(
    conversationId: string,
    messageId: string,
    rating: 'helpful' | 'unhelpful',
    comment?: string
  ): Promise<boolean> {
    storageService.recordFeedback(conversationId, messageId, rating, comment);
    return true;
  },

  // Request Speech Audio
  async requestSpeech(
    text: string,
    voiceName = 'Kore',
    language = 'en'
  ): Promise<{
    audioBase64?: string;
    mimeType?: string;
    cleanText: string;
    fallbackToBrowser: boolean;
  }> {
    const cleanText = cleanTextForSpeech(text);

    // If Gemini client is configured, attempt high-fidelity Gemini TTS
    if (isGeminiConfigured()) {
      try {
        const audio = await generateSpeechAudio(cleanText, voiceName);
        if (audio) {
          return {
            audioBase64: audio.audioBase64,
            mimeType: audio.mimeType,
            cleanText,
            fallbackToBrowser: false,
          };
        }
      } catch (err) {
        console.warn('Gemini TTS error, falling back to browser speech synthesis:', err);
      }
    }

    // Default to clean Web SpeechSynthesis in browser
    return {
      fallbackToBrowser: true,
      cleanText,
    };
  },

  // Transcribe Audio using Gemini Multimodal Audio
  async transcribeAudio(
    audioBlob: Blob,
    language = 'en'
  ): Promise<{ transcript: string }> {
    const ai = getGeminiClient();
    if (!ai) {
      throw new Error('Gemini API key is required for audio transcription.');
    }

    // Convert Blob to Base64
    const buffer = await audioBlob.arrayBuffer();
    const bytes = new Uint8Array(buffer);
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    const base64Audio = btoa(binary);

    const langInstruction =
      language === 'hi'
        ? 'The audio is expected to be in Hindi or Hinglish. Transcribe it accurately in Devanagari script or clean romanized Hinglish matching the speaker.'
        : 'The audio may be in English, Hindi, or Hinglish. Transcribe accurately verbatim.';

    const prompt = `Transcribe the spoken audio verbatim into clean text.\n${langInstruction}\nDo not add any commentary, explanations, or timestamps. Return ONLY the transcribed text.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: [
        {
          role: 'user',
          parts: [
            {
              inlineData: {
                mimeType: audioBlob.type || 'audio/webm',
                data: base64Audio,
              },
            },
            {
              text: prompt,
            },
          ],
        },
      ],
    });

    const transcript = response.text?.trim() || '';
    return { transcript };
  },
};
