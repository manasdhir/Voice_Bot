from dotenv import load_dotenv
import os

load_dotenv()

# API Configuration
GROQ_API_KEY = os.environ.get("GROQ_API_KEY")

# Model Configuration
EMBEDDING_MODEL_NAME = "nomic-ai/nomic-embed-text-v1.5"
LLM_MODEL_NAME = "meta-llama/llama-4-scout-17b-16e-instruct"
ASR_MODEL = "whisper-large-v3-turbo"
TTS_MODEL = "playai-tts"
TTS_VOICE = "Fritz-PlayAI"
EMBEDDING_SIZE=768


# Text Processing Configuration
CHUNK_SIZE = 1000
CHUNK_OVERLAP = 200

# CORS Configuration
ALLOWED_ORIGINS = ["http://localhost:5173"]
