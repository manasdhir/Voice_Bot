# Agentic Voice Bot

Agentic Voice Bot is a production-ready, high-performance, multi-user conversational AI system designed for real-time voice interactions. It leverages the latest advancements in LLM orchestration, vector search, and scalable web technologies to deliver fast, accurate, and context-aware responses.

**It features advanced speech and language models, including Kokoro TTS for natural-sounding text-to-speech, Llama Scout 4 for state-of-the-art conversational AI, and faster-whisper large turbo for rapid, accurate speech recognition.**

---

## Key Features

- **Efficient & Fast**: Built with FastAPI for low-latency, asynchronous communication and optimized for real-time voice and text processing.
- **LangGraph Orchestration**: Utilizes [LangGraph](https://github.com/langchain-ai/langgraph) for modular, stateful, and tool-augmented LLM workflows, enabling complex reasoning and tool use.
- **Qdrant Vector Search**: Integrates [Qdrant](https://qdrant.tech/) for high-speed, scalable vector storage and retrieval, powering advanced RAG (Retrieval-Augmented Generation) capabilities.
- **Multi-User Handling**: Each WebSocket connection is isolated with a unique thread/session ID, ensuring robust, concurrent conversations for multiple users without cross-talk or data leakage.
- **Tool Augmentation**: Supports dynamic tool invocation (e.g., document search, web search) within conversations, making the bot more capable and contextually aware.
- **Production Ready**: Modular codebase, clear separation of concerns, and robust error handling make it suitable for deployment in demanding environments.
- **Kokoro TTS**: Delivers high-quality, expressive text-to-speech for natural and engaging voice responses.
- **Llama Scout 4**: Powers the core conversational intelligence with a cutting-edge, open-source LLM.
- **faster-whisper large turbo**: Provides ultra-fast, accurate speech-to-text (ASR) for real-time voice input.
- **Highly Scalable**: Designed to scale horizontally, supporting thousands of concurrent users with efficient resource utilization.
- **Extensible Tooling**: Easily add new tools, data sources, or integrations to expand the bot's capabilities.

---

## Architecture

- **FastAPI**: Serves as the web server and WebSocket handler for real-time audio and text communication.
- **LangGraph**: Orchestrates LLM calls, tool usage, and conversation state, allowing for flexible, extensible workflows.
- **Qdrant**: Stores and retrieves document embeddings for fast, semantic search and RAG.
- **Audio Services**: Handles ASR (Automatic Speech Recognition) and TTS (Text-to-Speech) for seamless voice interaction, powered by faster-whisper large turbo and Kokoro TTS.
- **LLM Backbone**: Utilizes Llama Scout 4 for advanced, context-aware conversational AI.

---

## Multi-User Handling & Scalability

- Each client connection is assigned a unique `thread_id` (user/session ID), either provided by the client or generated server-side.
- All conversation state, LLM context, and tool invocations are scoped to this `thread_id`, ensuring strict separation between users.
- The system is designed to handle many concurrent users efficiently, with non-blocking async code and stateless endpoints.
- **Horizontal Scalability**: The architecture supports deployment across multiple servers or containers, with stateless APIs and distributed vector storage (Qdrant), making it suitable for large-scale production environments.
- **Resource Efficiency**: Utilizes async I/O and optimized model serving for minimal latency and high throughput.

---

## Tool Integration

- The bot can invoke external tools (e.g., document search, web search) as part of its reasoning process.
- Tools are registered with LangGraph and can be called dynamically based on user queries and LLM output.
- This enables advanced use cases like RAG, knowledge base lookup, and more.
- **Plug-and-Play Tools**: Easily extend the system with new tools for custom workflows, APIs, or data sources.

---

## Getting Started

1. **Install dependencies**:
   ```sh
   pip install -r requirements.txt
   ```
2. **Configure environment variables** (see `config.py` for required keys like `GROQ_API_KEY`, `LLM_MODEL_NAME`).
3. **Run the server**:
   ```sh
   uvicorn app:app --host 0.0.0.0 --port 8000
   ```
4. **Connect via WebSocket** to `/ws` endpoint for real-time voice chat.

---

## File Structure

- `app.py` - FastAPI app and WebSocket routes
- `websocket_handler.py` - Handles per-user WebSocket sessions, ASR, LLM, TTS
- `llm_service.py` - LangGraph orchestration, tool registration, and graph logic
- `audio_services.py` - ASR and TTS utilities
- `document_service.py` - Document ingestion and search (Qdrant)
- `rag_service.py` - Retrieval-Augmented Generation logic
- `config.py` - Configuration and secrets

---

## Why Choose This Project?

- **Speed**: Asynchronous, event-driven design for minimal latency, with faster-whisper large turbo for instant ASR and Kokoro TTS for rapid, natural speech.
- **Scalability**: Handles thousands of users in parallel with isolated state and horizontal scaling.
- **Extensibility**: Easily add new tools, LLMs (like Llama Scout 4), or workflows via LangGraph.
- **Reliability**: Robust error handling, modular design, and production-grade architecture.
- **State-of-the-Art Models**: Combines the best open-source and proprietary models for speech and language.
- **Seamless Voice Experience**: End-to-end voice pipeline from ASR to LLM to TTS, optimized for real-world use.

---

## License

MIT License
