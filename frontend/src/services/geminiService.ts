import { GoogleGenAI } from '@google/genai';
import { storageService } from './storageService';
import { FaqSource } from '../types';

let cachedClient: GoogleGenAI | null = null;
let lastUsedKey = '';

export function getGeminiClient(): GoogleGenAI | null {
  const apiKey = storageService.getApiKey();
  if (!apiKey) {
    return null;
  }
  if (!cachedClient || lastUsedKey !== apiKey) {
    cachedClient = new GoogleGenAI({ apiKey });
    lastUsedKey = apiKey;
  }
  return cachedClient;
}

export function isGeminiConfigured(): boolean {
  return Boolean(storageService.getApiKey());
}

// Markdown stripper for natural voice synthesis
export function cleanTextForSpeech(text: string): string {
  if (!text) return '';

  let cleaned = text;
  cleaned = cleaned.replace(/^#+\s+/gm, '');
  cleaned = cleaned.replace(/(\*\*|__)(.*?)\1/g, '$2');
  cleaned = cleaned.replace(/(\*|_)(.*?)\1/g, '$2');
  cleaned = cleaned.replace(/\[([^\]]+)\]\([^\)]+\)/g, '$1');
  cleaned = cleaned.replace(/```[\s\S]*?```/g, '');
  cleaned = cleaned.replace(/`([^`]+)`/g, '$1');
  cleaned = cleaned.replace(/^[\s*•-]+\s+/gm, '');
  cleaned = cleaned.replace(/^\d+\.\s+/gm, '');
  cleaned = cleaned.replace(/^>\s+/gm, '');
  cleaned = cleaned.replace(/\[Source\s*\d+[^\]]*\]/gi, '');
  cleaned = cleaned.replace(/FAQ\s*ID:\s*[A-Z0-9]+/gi, '');
  cleaned = cleaned.replace(/\n+/g, ' ');
  cleaned = cleaned.replace(/\s+/g, ' ').trim();

  return cleaned;
}

// Generate 768-dim embedding for a text string using Gemini Embedding 2
export async function generateEmbedding(text: string): Promise<number[] | null> {
  const ai = getGeminiClient();
  if (!ai) return null;

  const models = ['gemini-embedding-2', 'text-embedding-004', 'gemini-embedding-001'];

  for (const model of models) {
    try {
      const response = await ai.models.embedContent({
        model,
        contents: text,
        config: {
          outputDimensionality: 768,
        },
      });

      const resAny = response as any;
      if (resAny.embeddings && resAny.embeddings.length > 0 && resAny.embeddings[0].values) {
        return resAny.embeddings[0].values;
      }
      if (resAny.embedding && resAny.embedding.values) {
        return resAny.embedding.values;
      }
    } catch (err: any) {
      console.warn(`Gemini embedding attempt with ${model} failed:`, err.message);
    }
  }

  return null;
}

// Generate grounded answer using Gemini 3.8 Flash
export async function generateGroundedAnswer(
  query: string,
  sources: FaqSource[],
  history: Array<{ role: 'user' | 'assistant'; content: string }> = []
): Promise<string | null> {
  const ai = getGeminiClient();
  if (!ai) return null;

  const contextText = sources
    .map(
      (s, idx) =>
        `[Source ${idx + 1} | FAQ ID: ${s.faq_id} | Category: ${s.category}]\nQuestion: ${s.question}\nAnswer: ${s.answer}`
    )
    .join('\n\n');

  const systemPrompt = `You are the official, highly professional AI FAQ Assistant for Anand International College of Engineering (Anand-ICE), Jaipur.
Answer the student's question accurately and helpfully based ONLY on the provided FAQ sources.

CRITICAL RULES:
1. ONLY state facts explicitly provided in the FAQ context.
2. DO NOT fabricate, assume, or extrapolate any dates, amounts, procedures, or policies.
3. If the student asks in Hindi or Hinglish (e.g. "fees kab tak bharni hai", "shcolarship kaise milega"), reply in a natural, polite Hinglish or English addressing the query with the exact FAQ facts.
4. If the student asks multiple questions (e.g. library hours AND canteen hours), address each part clearly using the respective source.
5. If the provided sources do NOT contain enough information to answer the question reliably, politely state that you do not have that specific information in the college FAQ database, and direct them to the Anand International College of Engineering Admin Office (Room 1, Main Building, Phone: 01429-243500, Email: admin@anandice.ac.in).
6. Keep answers concise, clear, and easy to read with bullet points when appropriate.`;

  const prompt = `Context:\n${contextText}\n\nStudent Question: ${query}\n\nOfficial Grounded Answer:`;

  const models = ['gemini-3.8-flash', 'gemini-2.5-flash', 'gemini-1.5-flash'];

  for (const model of models) {
    try {
      const response = await ai.models.generateContent({
        model,
        contents: prompt,
        config: {
          systemInstruction: systemPrompt,
          temperature: 0.2,
        },
      });

      const text = response.text?.trim();
      if (text) {
        return text;
      }
    } catch (err: any) {
      console.warn(`Gemini generation attempt with ${model} failed:`, err.message);
    }
  }

  return null;
}

// Generate speech audio using Gemini 3.8 Flash TTS
export async function generateSpeechAudio(
  text: string,
  voiceName = 'Kore'
): Promise<{ audioBase64: string; mimeType: string } | null> {
  const ai = getGeminiClient();
  if (!ai) return null;

  const clean = cleanTextForSpeech(text);
  if (!clean) return null;

  const models = ['gemini-3.8-flash-tts', 'gemini-3.8-flash-lite-tts', 'gemini-2.5-flash'];

  for (const model of models) {
    try {
      const response = await ai.models.generateContent({
        model,
        contents: clean,
        config: {
          responseModalities: ['AUDIO'],
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: {
                voiceName: voiceName || 'Kore',
              },
            },
          },
        } as any,
      });

      const candidates = (response as any).candidates;
      if (candidates && candidates.length > 0) {
        const parts = candidates[0].content?.parts;
        if (parts && parts.length > 0) {
          for (const part of parts) {
            if (part.inlineData && part.inlineData.data) {
              return {
                audioBase64: part.inlineData.data,
                mimeType: part.inlineData.mimeType || 'audio/mp3',
              };
            }
          }
        }
      }
    } catch (err: any) {
      console.warn(`Gemini TTS attempt with ${model} failed:`, err.message);
    }
  }

  return null;
}

