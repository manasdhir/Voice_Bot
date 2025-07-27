from fastapi import WebSocket, WebSocketDisconnect
from langchain_core.messages import HumanMessage
import logging
from audio_services import groq_asr_bytes, murf_tts
from llm_service import create_graph, create_basic_graph
import time
logger = logging.getLogger("voicebot")

async def handle_websocket_connection(websocket: WebSocket):
    await websocket.accept()
    logger.info("🔌 WebSocket client connected.")

    # Only pass the new message each turn

    import uuid

    try:
        initial_data = await websocket.receive_json()
        if 'user_id' in initial_data:
            thread_id = initial_data.get('user_id')
            graph=create_graph()
        else:
            graph=create_basic_graph()
            thread_id=str(uuid.uuid4())
    except Exception:
        # No initial data received or timeout, generate unique thread ID
        graph=create_basic_graph()
        thread_id = str(uuid.uuid4())

    config = {"configurable": {"thread_id": thread_id}}

    
    while True:
        try:
            data = await websocket.receive_json()
            if data.get("type") == "end_call":
                logger.info("📞 Call ended by client")
                await websocket.close()
                break
            print(data)
            lang = data.get("lang", "english").lower()
            audio_bytes = await websocket.receive_bytes()

            # --- ASR ---
            transcription = await groq_asr_bytes(audio_bytes)
            await websocket.send_json({"type": "transcription", "text": transcription})
            
            # --- LangGraph LLM (only pass new HumanMessage) ---
            result = await graph.ainvoke(
                    {"messages": [HumanMessage(content=transcription)]},
                    config=config
                )
            llm_response = result["messages"][-1].content
            await websocket.send_json({"type": "llm_response", "text": llm_response})

            # --- TTS ---
            #tts_wav = groq_tts(llm_response, voice="Fritz-PlayAI")
            audio_stream = await murf_tts(llm_response)  # Get the async generator
            await websocket.send_json({"type": "tts_start"})

            async for audio_chunk in audio_stream:
                await websocket.send_bytes(audio_chunk)

            await websocket.send_json({"type": "tts_end"})

        except WebSocketDisconnect:
            logger.info("🔌 WebSocket disconnected.")
            break
        except Exception as e:
            logger.exception(f"❌ Error during call: {e}")
            await websocket.send_json({"error": str(e)})
            break
