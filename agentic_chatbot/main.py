"""
Voice Bot Application - Entry Point

This file has been refactored. The main application logic is now in app.py
Please run: python app.py or use uvicorn app:app

The modular structure:
- config.py: Configuration and constants
- audio_services.py: ASR and TTS functionality 
- rag_service.py: Vector store and document search
- llm_service.py: LangGraph and LLM handling
- document_service.py: PDF processing and document upload
- websocket_handler.py: WebSocket connection handling
- app.py: FastAPI application and routes
"""

from app import app

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)