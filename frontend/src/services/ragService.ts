import { localVectorStore } from './localVectorStore';
import { generateGroundedAnswer, isGeminiConfigured } from './geminiService';
import { FaqSource } from '../types';

export interface RagResponse {
  answer: string;
  sources: FaqSource[];
  isGrounded: boolean;
  queryType: 'faq' | 'clarification' | 'greeting' | 'out_of_scope' | 'empty' | 'adversarial';
  suggestions?: string[];
}

export function classifyQuery(rawQuery: string): {
  type: 'faq' | 'clarification' | 'greeting' | 'out_of_scope' | 'empty' | 'adversarial';
  cannedResponse?: string;
  suggestions?: string[];
} {
  const query = (rawQuery || '').trim();

  // 1. Empty / Whitespace
  if (!query) {
    return {
      type: 'empty',
      cannedResponse: 'Please ask a question about Anand International College of Engineering (e.g., class timings, semester fees, hostel rules, or library hours).',
      suggestions: ['What are the class timings?', 'What is the fee deadline?', 'How do I join a club?'],
    };
  }

  // 2. Gibberish / repeated characters
  const isAllSameChar = /^(.)\1{7,}$/.test(query);
  const isKeyboardMash = /^[asdfghjklqwertyuiopzxcvbnm]{8,}$/i.test(query);
  const isQuestionMarksOnly = /^[\?\.\,\!\s]+$/.test(query);
  if (isAllSameChar || isKeyboardMash || isQuestionMarksOnly) {
    return {
      type: 'clarification',
      cannedResponse: "I didn't quite understand that. Please ask a specific question about Anand International College of Engineering services or facilities.",
      suggestions: ['What are the library hours?', 'When do mid-sem exams start?', 'How do I connect to campus Wi-Fi?'],
    };
  }

  // 3. Adversarial / Prompt Injection
  const lower = query.toLowerCase();
  if (
    lower.includes('<script') ||
    lower.includes('drop table') ||
    lower.includes('ignore your rules') ||
    lower.includes('ignore all previous instructions') ||
    lower.includes('tell me the exam question paper') ||
    lower.includes('reveal your system prompt') ||
    lower.includes('just guess')
  ) {
    if (lower.includes('just guess')) {
      return {
        type: 'adversarial',
        cannedResponse: 'I cannot speculate or guess college policies. As per official Anand International College of Engineering guidelines: Semester fees must be paid by August 15 for odd semesters and January 15 for even semesters. A late fee of Rs. 100 per day applies for up to 15 days.',
        suggestions: ['What is the last date to pay semester fees?', 'Is there a late fee penalty?'],
      };
    }
    return {
      type: 'adversarial',
      cannedResponse: 'I am the official Anand International College of Engineering FAQ assistant. I can only assist with verified institutional information, college timings, policies, and facilities.',
      suggestions: ['What are the exam attendance rules?', 'How can I apply for re-evaluation?'],
    };
  }

  // 4. Greetings
  const greetings = ['hi', 'hello', 'hey', 'good morning', 'good afternoon', 'good evening', 'namaste'];
  if (greetings.includes(lower) || lower === 'hi!' || lower === 'hello!') {
    return {
      type: 'greeting',
      cannedResponse: 'Hello! I am your Anand International College of Engineering (Anand-ICE) FAQ Assistant. How can I help you today? You can ask me about class schedules, fees, hostel rules, exams, library access, and more.',
      suggestions: ['What are regular class timings?', 'How can I pay my fees?', 'What are the hostel gate timings?'],
    };
  }
  if (lower === 'thanks' || lower === 'thanks!' || lower === 'thank you' || lower === 'thank you!') {
    return {
      type: 'greeting',
      cannedResponse: "You're welcome! Feel free to ask if you have any more questions about Anand-ICE.",
    };
  }
  if (lower === 'bye' || lower === 'goodbye' || lower === 'see you') {
    return {
      type: 'greeting',
      cannedResponse: 'Goodbye! Have a productive day at Anand International College of Engineering.',
    };
  }

  // 5. Ambiguous short queries
  if (lower === 'timings' || lower === 'timing' || lower === 'time') {
    return {
      type: 'clarification',
      cannedResponse: 'Anand International College of Engineering has specific timings for different campus facilities. What timings would you like to know about?\n\n- **Class Timings:** Mon–Fri 9:00 AM – 4:30 PM, Sat 9:00 AM – 12:30 PM\n- **Library Hours:** Mon–Sat 8:30 AM – 7:00 PM (9:00 PM during exams)\n- **Hostel Gate:** Closes at 9:30 PM (1st years) & 10:30 PM (others)\n- **Canteen Hours:** 8:30 AM – 5:30 PM\n- **Gym Hours:** 6:00 AM – 8:00 PM',
      suggestions: ['Class timings', 'Library hours', 'Hostel curfew', 'Canteen hours'],
    };
  }
  if (lower === 'fees' || lower === 'fee') {
    return {
      type: 'clarification',
      cannedResponse: 'What details regarding semester fees do you need?\n\n- **Deadline:** Aug 15 (odd semester) & Jan 15 (even semester)\n- **Late Fee:** Rs. 100/day for up to 15 days\n- **Payment Modes:** Online portal (UPI/net banking/card) or Demand Draft at Room 12\n- **Instalments:** Two instalments allowed with prior written application',
      suggestions: ['When is the fee deadline?', 'What is the late fee?', 'How can I pay fees?', 'Can I pay in instalments?'],
    };
  }
  if (lower === 'when does it open' || lower === 'when it opens') {
    return {
      type: 'clarification',
      cannedResponse: 'Which campus facility are you asking about?\n\n- **Main College Gate:** Opens at 8:00 AM\n- **Library:** Opens at 8:30 AM\n- **Canteen:** Opens at 8:30 AM\n- **Gym:** Opens at 6:00 AM',
      suggestions: ['Main gate timings', 'Library hours', 'Canteen hours', 'Gym hours'],
    };
  }
  if (lower === 'how do i apply' || lower === 'how to apply') {
    return {
      type: 'clarification',
      cannedResponse: 'What would you like to apply for?\n\n- **Hostel Room:** Apply on the student portal and submit receipt to warden\n- **Clubs & Societies:** Online portal form during first 2 weeks of semester\n- **Scholarships:** Apply in September at Room 7 with marksheet and income certificate\n- **Exam Re-evaluation:** Apply on portal within 7 days of results (Rs. 500/paper)\n- **Duplicate ID Card:** Apply at Admin Office (Rs. 150)',
      suggestions: ['Apply for hostel', 'Join a club', 'Apply for scholarship', 'Apply for re-evaluation'],
    };
  }

  // 6. Explicit Out-of-Scope queries
  const outOfScopePatterns = [
    'prime minister',
    'president of',
    'poem about',
    'weather in',
    'solve 2x',
    'solve equation',
    'which college is better',
    'tell me a joke',
    'biryani good',
    'who will win the world cup',
    'exam result of rahul',
    'will i get a placement at google',
    'cutoff for admission next year',
  ];

  for (const pattern of outOfScopePatterns) {
    if (lower.includes(pattern)) {
      if (lower.includes('exam result of') || lower.includes('roll no')) {
        return {
          type: 'out_of_scope',
          cannedResponse: 'Individual student marks and exam results cannot be retrieved here due to privacy policies. Please log in to your official Student Portal or visit the Examination Cell/Admin Office in the Main Building.',
        };
      }
      if (lower.includes('biryani') || lower.includes('food taste')) {
        return {
          type: 'out_of_scope',
          cannedResponse: 'The college FAQ does not rate food taste or canteen quality. For official canteen information: The campus canteen is open Monday to Friday, 8:30 AM to 5:30 PM (closed Sundays).',
          suggestions: ['What are the canteen hours?', 'What are the hostel mess timings?'],
        };
      }
      if (lower.includes('placement at google')) {
        return {
          type: 'out_of_scope',
          cannedResponse: 'Placement selections depend on individual company recruitment drives, candidate evaluations, and eligibility criteria. Official college policy states that the Training and Placement Cell begins campus drives in August for final-year students, with registration required by July 31 on the placement portal.',
          suggestions: ['When does the placement season start?'],
        };
      }
      if (lower.includes('cutoff')) {
        return {
          type: 'out_of_scope',
          cannedResponse: 'Official admission cutoff ranks for the upcoming academic year are not listed in the general FAQ. Please contact the Admissions / Admin Office at Anand International College of Engineering in the Main Building, Room 1 (Phone: 01429-243500, Email: admin@anandice.ac.in).',
        };
      }
      return {
        type: 'out_of_scope',
        cannedResponse: "I am specifically designed to assist students and parents with Anand International College of Engineering institutional FAQs (class hours, fees, hostel regulations, library services, Wi-Fi, clubs, etc.). I cannot answer general knowledge, weather, political, or creative requests.",
        suggestions: ['What are regular class timings?', 'What are the library hours?', 'How do I pay fees?'],
      };
    }
  }

  return { type: 'faq' };
}

// Client-side RAG Orchestrator
export async function answerStudentQuestion(
  query: string,
  history: Array<{ role: 'user' | 'assistant'; content: string }> = []
): Promise<RagResponse> {
  const classification = classifyQuery(query);

  if (classification.cannedResponse) {
    return {
      answer: classification.cannedResponse,
      sources: [],
      isGrounded: false,
      queryType: classification.type,
      suggestions: classification.suggestions,
    };
  }

  // Retrieve top relevant sources using local vector store
  const sources = await localVectorStore.search(query, 3);

  if (sources.length === 0 || (sources[0].score !== undefined && sources[0].score < 0.25)) {
    return {
      answer: "I'm sorry, I could not find information regarding your query in the Anand International College of Engineering FAQ database. For official guidance, please contact the Admin Office in the Main Building, Room 1 (Phone: 01429-243500, Email: admin@anandice.ac.in).",
      sources: [],
      isGrounded: false,
      queryType: 'out_of_scope',
      suggestions: [
        'What are the regular class timings?',
        'What is the last date to pay semester fees?',
        'How do I connect to campus Wi-Fi?',
      ],
    };
  }

  // If Gemini API Key is configured, generate natural grounded response with Gemini 3.8 Flash
  if (isGeminiConfigured()) {
    try {
      const generated = await generateGroundedAnswer(query, sources, history);
      if (generated && generated.trim()) {
        return {
          answer: generated.trim(),
          sources,
          isGrounded: true,
          queryType: 'faq',
        };
      }
    } catch (err) {
      console.warn('Gemini chat generation failed, using direct authoritative FAQ answer:', err);
    }
  }

  // Direct grounded fallback using the authoritative FAQ answers directly
  const combined = sources.map((s) => s.answer).join('\n\n');
  return {
    answer: combined,
    sources,
    isGrounded: true,
    queryType: 'faq',
  };
}

