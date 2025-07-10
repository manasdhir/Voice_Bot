# Voice Bot

A full-stack conversational voice chatbot using FastAPI (Python) for the backend and React (Vite) for the frontend. The bot supports real-time speech-to-text, LLM-based responses, and text-to-speech voice replies, with animated feedback for both user and bot turns.

## Features

- Real-time voice input with VAD (Voice Activity Detection)
- Animated UI: pulsing circle for user speech, animated blobs for bot replies
- FastAPI backend with WebSocket streaming
- Groq Whisper ASR, Llama LLM, and PlayAI TTS integration
- Interruptible turn-taking: user can interrupt bot reply by speaking
- **RAG (Retrieval-Augmented Generation) support**: Integrate your own knowledge base for more factual and context-aware answers
- **LangChain tools**: Easily add tools, chains, and agents for advanced workflows
- **Knowledge base integration**: Connect to custom or external data sources for enhanced responses

## Architecture

![Architecture Diagram](https://github.com/manasdhir/Voice_Bot/blob/main/frontend/public/arch.png)

```
Flow:
1. User speaks → Frontend records and detects speech (VAD)
2. Audio sent to backend via WebSocket
3. Backend sends audio to Groq Whisper ASR for transcription
4. Transcription sent to Groq Llama LLM for response (optionally with RAG/knowledge base)
5. LLM response sent to Groq PlayAI TTS for voice
6. TTS audio streamed back to frontend
7. Frontend animates and plays bot reply, user can interrupt at any time
```

## Code Structure

```
Voice_Bot/
├── agentic_chatbot/           # Python backend (FastAPI, LangChain, Groq integration)
│   ├── main.py                # Main FastAPI app and WebSocket pipeline
│   ├── ...                    # (Add your RAG, tools, and knowledge base modules here)
│   └── pyproject.toml         # Python dependencies
│
├── frontend/                  # React frontend (Vite, Tailwind, etc.)
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
  # or if using pyproject.toml:
  pip install .
  ```
- Set your Groq API key in a `.env` file:
  ```env
  GROQ_API_KEY=your_groq_api_key_here
  ```
- Accept TTS model terms at https://console.groq.com/playground?model=playai-tts
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
- Start the frontend:
  ```bash
  npm run dev
  ```
- The app will be available at http://localhost:5173 (or your Vite port)

## Usage

- Click "Start Mic" to begin.
- Speak into your mic. The UI will animate with a pulsing circle.
- When you stop speaking, your audio is sent to the backend.
- The bot will reply with a voice response and animated blobs.
- You can interrupt the bot at any time by speaking again.

## Troubleshooting

- **WebSocket connection errors:** Ensure the backend is running on port 8000 and accessible from the frontend.
- **Groq TTS errors:** Accept the model terms and check your API key and usage limits.
- **Token limit errors:** Long bot replies may be truncated to fit TTS model limits.

## License

MIT
