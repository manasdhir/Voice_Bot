# Voice Bot

A full-stack conversational voice chatbot using FastAPI (Python) for the backend and React (Vite) for the frontend. The bot supports real-time speech-to-text, LLM-based responses, and text-to-speech voice replies, with animated feedback for both user and bot turns.

## Features

- Real-time voice input with VAD (Voice Activity Detection)
- Animated UI: pulsing circle for user speech, animated blobs for bot replies
- FastAPI backend with WebSocket streaming
- Groq Whisper ASR, LangGraph LLM, and Murf TTS integration
- Interruptible turn-taking: user can interrupt bot reply by speaking
- **User authentication** with Clerk integration
- **Personalized experience**: Custom personas and knowledge bases per user
- **Session memory**: Conversation summaries stored and retrieved across sessions
- **LangGraph agents**: Advanced conversational AI with tool support
- **Supabase integration**: User data, personas, and session management
```
Flow:
1. User speaks → Frontend records and detects speech (VAD)
2. Audio sent to backend via WebSocket
3. Backend sends audio to Groq Whisper ASR for transcription
4. Transcription sent to LangGraph agent for response (with user's knowledge base)
5. Agent response sent to Murf TTS for voice generation
6. TTS audio streamed back to frontend
7. Frontend animates and plays bot reply, user can interrupt at any time
8. Session summaries stored in Supabase for conversation continuity
```

## Code Structure

```
Voice_Bot/
├── agentic_chatbot/           # Python backend (FastAPI, LangGraph, Groq integration)
│   ├── websocket_handler.py   # WebSocket connection handler
│   ├── audio_services.py      # ASR and TTS services
│   ├── llm_service.py         # LangGraph agent creation
│   ├── custom_supabase.py     # Supabase database operations
│   ├── clean.py               # Text cleaning utilities
│   ├── main.py                # Main FastAPI app
│   └── requirements.txt       # Python dependencies
│
├── frontend/                  # React frontend (Vite, Tailwind, Clerk)
│   ├── src/pages/chatbot.jsx  # Main chatbot page
│   ├── components/voiceBot.jsx# Voice bot UI and logic
│   └── ...                    # Other frontend files
│
├── README.md                  # This file
└── ...                        # Other project files
```

## Setup

### 1. Backend (Python/FastAPI)

- Python 3.12+
- Install dependencies:
  ```bash
  cd agentic_chatbot
  pip install -r requirements.txt
  ```
- Set your environment variables in a `.env` file:
  ```env
  GROQ_API_KEY=your_groq_api_key_here
  MURF_API_KEY=your_murf_api_key_here
  SUPABASE_URL=your_supabase_url
  SUPABASE_ANON_KEY=your_supabase_anon_key
  ```
- Run the backend:
  ```bash
  uvicorn main:app --reload
  ```

### 2. Frontend (React/Vite)

- Node.js 18+
- Install dependencies:
  ```bash
  cd frontend
  npm install
  ```
- Set your environment variables:
  ```env
  VITE_CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key
  VITE_BACKEND_URL_WEBSOCKET=ws://localhost:8000
  ```
- Start the frontend:
  ```bash
  npm run dev
  ```
- The app will be available at http://localhost:5173 (or your Vite port)

### 3. Database Setup (Supabase)

- Create a Supabase project
- Set up the required tables for users, personas, and sessions
- Update the Supabase URL and keys in your environment variables

## Usage

### For Authenticated Users:
- Sign in with Clerk authentication
- Click "Start" to begin a personalized conversation
- Your persona, knowledge base, and conversation history will be loaded
- Speak into your mic - the UI will show "Connecting..." while initializing
- After VAD completes noise capturing, you'll see "Connected" and can start talking
- Session summaries are automatically saved for future conversations

### For Anonymous Users:
- Click "Start" without signing in for a basic conversation
- No personalization or session memory available
- Full conversational capabilities still work

## Connection Flow

1. Click "Start" → Shows "Connecting..."
2. WebSocket connects and backend processes user data (personas, knowledge base)
3. Backend sends `connection_successful` message
4. Frontend activates VAD with 1-second noise capturing
5. After noise capturing completes → Shows "Connected" and ready to listen
6. Bot sends a personalized greeting message

## Troubleshooting

- **WebSocket connection errors:** Ensure the backend is running on port 8000 and accessible from the frontend.
- **Groq API errors:** Check your API key and usage limits.
- **Murf TTS errors:** Verify your Murf API key and account status.
- **Supabase connection issues:** Confirm your Supabase URL and keys are correct.
- **Authentication issues:** Check your Clerk configuration and publishable key.

## License
