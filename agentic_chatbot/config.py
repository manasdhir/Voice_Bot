from dotenv import load_dotenv
import os

load_dotenv()

# API Configuration
GROQ_API_KEY = os.environ.get("GROQ_API_KEY")

# Model Configuration
EMBEDDING_MODEL_NAME = "BAAI/bge-base-en-v1.5"
LLM_MODEL_NAME = "llama-3.3-70b-versatile"
ASR_MODEL = "whisper-large-v3-turbo"
TTS_MODEL = "playai-tts"
TTS_VOICE = "Fritz-PlayAI"

# Storage Configuration
CHROMA_DIR = "chroma_store"

# Text Processing Configuration
CHUNK_SIZE = 500
CHUNK_OVERLAP = 50

# CORS Configuration
ALLOWED_ORIGINS = ["http://localhost:5173"]
