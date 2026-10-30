# Anand International College of Engineering (Anand-ICE) — AI Campus Chatbot

A 100% standalone, serverless frontend AI Chatbot application for **Anand International College of Engineering (Anand-ICE), Jaipur**, designed for immediate deployment on **Netlify**. Built with **React 18 + TypeScript + Vite + Tailwind CSS**, featuring an in-browser **Local Vector Store**, client-side **Google Gemini API** integration, **Browser LocalStorage** persistence, and comprehensive **bilingual Voice Recognition & Synthesis**.

---

## 1. Architecture Overview (Zero Backend / Netlify Native)

```
┌────────────────────────────────────────────────────────────────────────┐
│                        Netlify Static Web Hosting                      │
│                                                                        │
│   ┌────────────────────────────────────────────────────────────────┐   │
│   │                 React 18 + TypeScript SPA UI                   │   │
│   │                 (Tailwind CSS + Lucide Icons)                  │   │
│   └───────────────┬───────────────────────────────┬────────────────┘   │
│                   │                               │                    │
│   ┌───────────────▼───────────────┐  ┌────────────▼────────────────┐   │
│   │    Browser LocalStorage       │  │    Web Speech Subsystem     │   │
│   │  - Conversations & Messages   │  │  - SpeechRecognition        │   │
│   │  - Helpful/Unhelpful Ratings  │  │    (en-US, hi-IN, Hinglish) │   │
│   │  - Cached FAQ 768-dim Vectors │  │  - SpeechSynthesis & Voice  │   │
│   │  - API Key & Preferences      │  │    controls (Listen / Stop) │   │
│   └───────────────┬───────────────┘  └─────────────────────────────┘   │
│                   │                                                    │
│   ┌───────────────▼────────────────────────────────────────────────┐   │
│   │                 In-Browser Local Vector Store                  │   │
│   │  - 30 Authoritative Anand-ICE College FAQ Embeddings        │   │
│   │  - Real-time Cosine Similarity Semantic Search                 │   │
│   │  - Typo, Slang, & Stopword Normalized Lexical Fallback         │   │
│   └───────────────────────────────┬────────────────────────────────┘   │
└───────────────────────────────────┼────────────────────────────────────┘
                                    │ Direct HTTPS
                                    ▼
                 ┌──────────────────────────────────────┐
                 │        Google Gemini Paid API        │
                 │  - gemini-embedding-2 (768 dims)     │
                 │  - gemini-3.8-flash (grounded chat)  │
                 │  - gemini-3.8-flash-tts (voice audio)│
                 └──────────────────────────────────────┘
```

---

## 2. Key Highlights

- **Zero Server Overhead**: 100% client-side application. No Node/Express server, no Pinecone account required, and no MongoDB instance needed.
- **In-Browser Local Vector Search**: Computes 768-dimensional cosine similarity vectors in real-time, caching FAQ vectors in `localStorage` to avoid unnecessary API requests.
- **Paid Gemini API Support**:
  - `gemini-embedding-2` for 768-dimension semantic query embeddings.
  - `gemini-3.8-flash` for strictly grounded answer generation.
  - `gemini-3.8-flash-tts` for natural audio synthesis.
- **Instant UI API Key Configuration**: Students/administrators can enter or change their Gemini API Key directly via the in-app modal (Key icon in the header) or via `VITE_GEMINI_API_KEY`.
- **LocalStorage Persistence**: Saves conversations, chat titles, message histories, timestamps, verified FAQ sources, and helpful/unhelpful student feedback.
- **Voice Recognition & Speech Output**:
  - Speech input supporting **English**, **Hindi (हिन्दी)**, and **Hinglish** with live editable transcripts.
  - **Listen** button on all assistant responses with markdown stripping and audio player controls.
  - Fullscreen hands-free **Voice Conversation Mode** with animated mic waves and turn-by-turn conversation.

---

## 3. Dataset Inventory (Preserved in `Knowledge/`)

| Filename | Format | Count | Schema | Purpose |
| :--- | :--- | :--- | :--- | :--- |
| `college_faq_sheet.csv` | CSV | 30 FAQs | `faq_id, category, question, answer, keywords` | Authoritative institutional knowledge base for Anand International College of Engineering covering 16 categories. Embedded directly into `frontend/src/data/faqs.ts`. |
| `college_faq_test_queries.csv` | CSV | 69 Queries | `test_id, query, query_type, expected_faq_id, expected_behavior` | Ground-truth test suite covering exact, paraphrase, typo, slang/Hinglish, ambiguous, out-of-scope, empty, and adversarial prompts (100% accuracy verified). |
| `College_FAQ_Bot_Dataset.xlsx` | Excel | 2 sheets | `FAQ_Sheet`, `Test_Queries` | Spreadsheet version of the dataset. |
| `college FAQ bot.key` | Keynote | 682 KB | Presentation archive | Project slides and graphics. |

---

## 4. Local Development

### Prerequisites
- Node.js v18+ and npm installed.

### Quick Start
```powershell
# Navigate to frontend directory
cd frontend

# Install dependencies
npm.cmd install

# Start development server
npm.cmd run dev
```

Open your browser at `http://localhost:5173`.
Click the **API Key** button in the top header and paste your paid Google Gemini API key to activate live semantic embeddings and answer generation!

---

## 5. Deploy to Netlify

### Option A: 1-Click Git Push (Recommended)
1. Push your repository to GitHub / GitLab.
2. Log into [Netlify](https://app.netlify.com/) and select **Add new site > Import an existing project**.
3. Choose your repository.
4. Netlify will automatically detect `netlify.toml` with:
   - **Base directory**: `frontend`
   - **Build command**: `npm run build`
   - **Publish directory**: `dist`
5. Under **Environment variables**, optionally add:
   - `VITE_GEMINI_API_KEY` = `your_gemini_api_key_here`
6. Click **Deploy Site**.

### Option B: Netlify CLI
```powershell
cd frontend
npm.cmd run build
npx netlify deploy --prod --dir=dist
```

---

## 6. Project Structure

```
Rag AI BOT BREW/
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── ApiKeyModal.tsx        # UI modal to view/update Gemini API key
│   │   │   ├── ChatInput.tsx          # Textarea, speech recognition, live transcript
│   │   │   ├── ChatMessage.tsx        # Chat bubbles, Listen player, FAQ source badges
│   │   │   ├── FaqTopicDrawer.tsx     # Interactive browser for 16 FAQ categories
│   │   │   ├── Header.tsx             # Header with status pills, voice mode, key modal
│   │   │   ├── Sidebar.tsx            # Recent chats, categories, voice settings
│   │   │   ├── SuggestedQuestions.tsx # Categorized FAQ cards from actual dataset
│   │   │   └── VoiceModeModal.tsx     # Fullscreen hands-free voice mode
│   │   ├── data/
│   │   │   └── faqs.ts                # Bundled 30 authoritative Anand-ICE College FAQs
│   │   ├── hooks/
│   │   │   ├── useVoiceRecognition.ts # Web Speech API (en-US, hi-IN, Hinglish)
│   │   │   └── useVoiceSynthesis.ts   # Audio player with markdown stripping & TTS
│   │   ├── services/
│   │   │   ├── api.ts                 # Clean typed client facade
│   │   │   ├── geminiService.ts       # Direct Gemini SDK integration (@google/genai)
│   │   │   ├── localVectorStore.ts    # Cosine similarity local vector engine
│   │   │   ├── ragService.ts          # Client-side RAG & intent guardrails
│   │   │   └── storageService.ts      # LocalStorage persistence for chats & feedback
│   │   ├── types/                     # TypeScript definitions
│   │   ├── App.tsx                    # Main App orchestrator
│   │   └── main.tsx                   # React entry point
│   ├── netlify.toml                   # Netlify build & SPA routing config
│   ├── package.json
│   ├── tailwind.config.js
│   └── vite.config.ts
├── Knowledge/                         # Authoritative source datasets
├── netlify.toml                       # Root Netlify redirect config
└── README.md
```
