from dotenv import load_dotenv
import os

load_dotenv()

# API Configuration
GROQ_API_KEY = os.environ.get("GROQ_API_KEY")

# Model Configuration
EMBEDDING_MODEL_NAME = "nomic-ai/nomic-embed-text-v1.5"
ASR_MODEL = "whisper-large-v3-turbo"
EMBEDDING_SIZE=768
GEMINI_API_KEY=os.environ.get("GEMINI_API_KEY")
MURF_API_KEY=os.environ.get("MURF_API_KEY")
# Text Processing Configuration
CHUNK_SIZE = 1000
CHUNK_OVERLAP = 200

# CORS Configuration
ALLOWED_ORIGINS = ["http://localhost:5173"]
