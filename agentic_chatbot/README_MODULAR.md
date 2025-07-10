# Voice Bot - Modular Structure

This project has been fully modularized into the following files:

## File Structure

### `config.py`
Contains all configuration constants and environment variables:
- API keys and model configurations
- Storage directories and settings
- CORS and other service configurations

### `audio_services.py`
Handles audio processing:
- ASR (Automatic Speech Recognition) using Groq Whisper
- TTS (Text-to-Speech) using Groq PlayAI
- Audio format conversions and file handling

### `rag_service.py`
Manages document retrieval and embeddings:
- HuggingFace embeddings initialization
- Chroma vector store setup
- Document search functionality

### `llm_service.py`
Contains the LangGraph setup and LLM handling:
- ChatGroq LLM initialization
- LangGraph state management
- Conversation flow and system prompts

### `document_service.py`
Handles document processing:
- PDF reading and text extraction
- Text chunking and document creation
- Vector store insertion and persistence

### `websocket_handler.py`
Manages WebSocket connections:
- Real-time audio streaming
- ASR → LLM → TTS pipeline
- Session state management

### `app.py`
Main FastAPI application:
- Route definitions
- CORS middleware setup
- Application initialization

### `main.py`
Entry point with documentation and uvicorn runner

## Running the Application

```bash
# Option 1: Run directly
python main.py

# Option 2: Use uvicorn
uvicorn app:app --host 0.0.0.0 --port 8000

# Option 3: With reload for development
uvicorn app:app --reload
```

## Benefits of This Modular Structure

1. **Separation of Concerns**: Each file has a single responsibility
2. **Maintainability**: Easy to modify individual components
3. **Testability**: Components can be tested in isolation
4. **Reusability**: Services can be imported and used elsewhere
5. **Scalability**: Easy to extend with new features
6. **Configuration Management**: Centralized config makes deployment easier
