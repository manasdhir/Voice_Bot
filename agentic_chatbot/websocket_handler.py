from fastapi import WebSocket, WebSocketDisconnect
from langchain_core.messages import HumanMessage
import logging
from audio_services import groq_asr_bytes, groq_tts
from llm_service import graph

logger = logging.getLogger("voicebot")

async def handle_websocket_connection(websocket: WebSocket):
    await websocket.accept()
    logger.info("🔌 WebSocket client connected.")

    # Only pass the new message each turn
    thread_id = "1"  # Or generate dynamically per user/call if needed
    config = {"configurable": {"thread_id": thread_id}}

    while True:
        try:
            data = await websocket.receive_json()
            if data.get("type") == "end_call":
                logger.info("📞 Call ended by client")
                await websocket.close()
                break

            lang = data.get("lang", "english").lower()
            audio_bytes = await websocket.receive_bytes()

            # --- ASR ---
            transcription = groq_asr_bytes(audio_bytes, language="en" if lang == "english" else lang)
            await websocket.send_json({"type": "transcription", "text": transcription})

            # --- LangGraph LLM (only pass new HumanMessage) ---
            result = graph.invoke(
                {"messages": [HumanMessage(content=transcription)]},
                config=config
            )

            llm_response = result["messages"][-1].content
            await websocket.send_json({"type": "llm_response", "text": llm_response})

            # --- TTS ---
            tts_wav = groq_tts(llm_response, voice="Fritz-PlayAI")
            await websocket.send_json({"type": "tts_start"})
            await websocket.send_bytes(tts_wav)
            await websocket.send_json({"type": "tts_end"})

        except WebSocketDisconnect:
            logger.info("🔌 WebSocket disconnected.")
            break
        except Exception as e:
            logger.exception(f"❌ Error during call: {e}")
            await websocket.send_json({"error": str(e)})
            break
