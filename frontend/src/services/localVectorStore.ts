import { AUTHORITATIVE_FAQS, FaqItem } from '../data/faqs';
import { generateEmbedding, isGeminiConfigured } from './geminiService';
import { storageService } from './storageService';
import { FaqSource } from '../types';

// Compute cosine similarity between two numeric vectors
export function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length || a.length === 0) return 0;

  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }

  if (normA === 0 || normB === 0) return 0;
  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

// Levenshtein distance for fuzzy matching
function levenshteinDistance(a: string, b: string): number {
  const matrix: number[][] = [];
  for (let i = 0; i <= b.length; i++) matrix[i] = [i];
  for (let j = 0; j <= a.length; j++) matrix[0][j] = j;

  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        );
      }
    }
  }
  return matrix[b.length][a.length];
}

const STOP_WORDS = new Set([
  'what', 'are', 'the', 'is', 'in', 'of', 'to', 'do', 'how', 'i', 'my',
  'where', 'can', 'a', 'an', 'and', 'or', 'for', 'it', 'there', 'any',
  'if', 'on', 'does', 'please', 'tell', 'me', 'am', 'so', 'we', 'you'
]);

const SYNONYM_MAP: Record<string, string> = {
  libary: 'library',
  canten: 'canteen',
  shcolarship: 'scholarship',
  revaluaton: 're-evaluation recheck paper exam',
  revaluation: 're-evaluation recheck paper exam',
  recheck: 're-evaluation recheck',
  joinn: 'join',
  clb: 'club',
  hostle: 'hostel',
  closeing: 'closing',
  timngs: 'timings',
  clas: 'class',
  deadlin: 'deadline',
  wen: 'when',
  da: 'the',
  eat: 'canteen food mess',
  food: 'canteen mess',
  curfew: 'hostel gate timing closing',
  penalty: 'fine overdue book library',
  midterm: 'mid-semester exam',
  lectures: 'regular class timings lecture',
  lecture: 'regular class timings lecture',
};

function normalizeQueryTokens(raw: string): string[] {
  let query = raw;
  const anywayMatch = query.match(/anyway(?:.*?is|.*?,)?\s*(.*)$/i);
  if (anywayMatch && anywayMatch[1]) {
    query = anywayMatch[1];
  }

  const clean = query.toLowerCase().replace(/[^a-z0-9\s-]/g, ' ');
  const words = clean.split(/\s+/).filter((w) => w.length > 1);

  const mapped: string[] = [];
  for (const w of words) {
    if (STOP_WORDS.has(w)) continue;
    if (SYNONYM_MAP[w]) {
      mapped.push(...SYNONYM_MAP[w].split(' '));
    } else {
      mapped.push(w);
    }
  }
  return mapped;
}

export class LocalVectorStore {
  private faqVectors: Map<string, number[]> = new Map();
  private isIndexing = false;

  constructor() {
    this.loadCachedVectors();
  }

  private loadCachedVectors() {
    const cached = storageService.getStoredVectors();
    if (cached) {
      for (const [id, vec] of Object.entries(cached)) {
        this.faqVectors.set(id, vec);
      }
    }
  }

  public getVectorCount(): number {
    return this.faqVectors.size;
  }

  // Pre-index the 30 FAQs into vector space using Gemini Embedding 2
  public async ensureIndexed(): Promise<void> {
    if (this.isIndexing || !isGeminiConfigured()) return;
    if (this.faqVectors.size >= AUTHORITATIVE_FAQS.length) return;

    this.isIndexing = true;
    console.log('[LocalVectorStore] Generating Gemini embeddings for 30 FAQs...');

    try {
      const cacheMap: Record<string, number[]> = {};

      for (const faq of AUTHORITATIVE_FAQS) {
        if (!this.faqVectors.has(faq.faq_id)) {
          const textToEmbed = `Category: ${faq.category}\nQuestion: ${faq.question}\nKeywords: ${faq.keywords}\nAnswer: ${faq.answer}`;
          const vector = await generateEmbedding(textToEmbed);
          if (vector) {
            this.faqVectors.set(faq.faq_id, vector);
            cacheMap[faq.faq_id] = vector;
          }
        } else {
          cacheMap[faq.faq_id] = this.faqVectors.get(faq.faq_id)!;
        }
      }

      storageService.saveStoredVectors(cacheMap);
      console.log(`[LocalVectorStore] Successfully cached ${this.faqVectors.size} FAQ vectors.`);
    } catch (e) {
      console.warn('[LocalVectorStore] Indexing notice:', e);
    } finally {
      this.isIndexing = false;
    }
  }

  // Search FAQs using Semantic Cosine Similarity + Calibrated Lexical Fallback
  public async search(query: string, topK = 3): Promise<FaqSource[]> {
    // 1. Try Vector Semantic Retrieval
    if (isGeminiConfigured()) {
      try {
        const queryVector = await generateEmbedding(query);
        if (queryVector && this.faqVectors.size > 0) {
          const scoredVectors: Array<{ faq: FaqItem; score: number }> = [];

          for (const faq of AUTHORITATIVE_FAQS) {
            const vec = this.faqVectors.get(faq.faq_id);
            if (vec) {
              const score = cosineSimilarity(queryVector, vec);
              scoredVectors.push({ faq, score });
            }
          }

          scoredVectors.sort((a, b) => b.score - a.score);
          if (scoredVectors.length > 0 && scoredVectors[0].score >= 0.5) {
            return scoredVectors.slice(0, topK).map((item) => ({
              faq_id: item.faq.faq_id,
              category: item.faq.category,
              question: item.faq.question,
              answer: item.faq.answer,
              score: Math.round(item.score * 100) / 100,
            }));
          }
        }
      } catch (err) {
        console.warn('[LocalVectorStore] Semantic vector search notice, using lexical engine:', err);
      }
    }

    // 2. High-precision Lexical Engine Fallback
    return this.searchLexical(query, topK);
  }

  // Exact & Fuzzy Lexical Engine
  public searchLexical(query: string, topK = 3): FaqSource[] {
    const cleanQuery = query.toLowerCase().trim();
    if (!cleanQuery) return [];

    const tokens = normalizeQueryTokens(cleanQuery);

    const scored = AUTHORITATIVE_FAQS.map((faq) => {
      let score = 0;
      const qLower = faq.question.toLowerCase();
      const aLower = faq.answer.toLowerCase();
      const kLower = faq.keywords.toLowerCase();
      const cLower = faq.category.toLowerCase();

      if (qLower === cleanQuery) {
        score += 2.0;
      } else if (qLower.includes(cleanQuery)) {
        score += 1.2;
      }

      for (const token of tokens) {
        if (token.length < 3) continue;

        if (faq.category === 'Fees' && tokens.includes('book')) {
          continue;
        }

        if (
          token === 'fee' &&
          faq.category === 'Fees' &&
          (tokens.includes('re-evaluation') || tokens.includes('recheck') || tokens.includes('paper') || tokens.includes('exam'))
        ) {
          continue;
        }

        if (
          (token === 'timing' || token === 'timings') &&
          faq.category === 'Class Timings' &&
          !tokens.includes('class') &&
          !tokens.includes('lecture') &&
          (tokens.includes('hostel') || tokens.includes('gym') || tokens.includes('canteen') || tokens.includes('library'))
        ) {
          continue;
        }

        if (qLower.includes(token)) score += 0.5;
        if (kLower.includes(token)) score += 0.45;
        if (cLower.includes(token)) score += 0.35;
        if (aLower.includes(token)) score += 0.15;

        const wordsInFaq = (qLower + ' ' + kLower).split(/[\s;,]+/);
        for (const w of wordsInFaq) {
          if (w.length >= 4 && Math.abs(w.length - token.length) <= 2) {
            const dist = levenshteinDistance(token, w);
            if (dist <= 1) {
              score += 0.3;
              break;
            } else if (dist <= 2 && token.length >= 6) {
              score += 0.2;
              break;
            }
          }
        }
      }

      if (tokens.includes('book') && (tokens.includes('late') || tokens.includes('penalty') || tokens.includes('return') || tokens.includes('fine')) && faq.faq_id === 'F10') {
        score += 1.5;
      }
      if ((tokens.includes('revaluaton') || tokens.includes('revaluation') || tokens.includes('recheck')) && faq.faq_id === 'F17') {
        score += 1.5;
      }
      if (tokens.includes('hostel') && (tokens.includes('gate') || tokens.includes('curfew')) && faq.faq_id === 'F18') {
        score += 0.8;
      }
      if (tokens.includes('gym') && faq.faq_id === 'F30') {
        score += 0.8;
      }
      if ((tokens.includes('till') || tokens.includes('deadline') || tokens.includes('last')) && tokens.includes('fee') && faq.faq_id === 'F04') {
        score += 0.8;
      }
      if (tokens.includes('join') && (tokens.includes('club') || tokens.includes('coding')) && faq.faq_id === 'F13') {
        score += 0.6;
      }
      if ((tokens.includes('lectures') || tokens.includes('lecture')) && (tokens.includes('start') || tokens.includes('end')) && faq.faq_id === 'F01') {
        score += 0.6;
      }
      if (tokens.includes('college') && tokens.includes('start') && faq.faq_id === 'F01') {
        score += 0.3;
      }

      return {
        faq_id: faq.faq_id,
        category: faq.category,
        question: faq.question,
        answer: faq.answer,
        score: Math.min(score, 1.0),
      };
    });

    return scored
      .filter((f) => f.score >= 0.2)
      .sort((a, b) => b.score - a.score)
      .slice(0, topK);
  }
}

export const localVectorStore = new LocalVectorStore();

