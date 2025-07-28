from fastapi import WebSocket, WebSocketDisconnect
from langchain_core.messages import HumanMessage, SystemMessage, AIMessage
import logging
from audio_services import groq_asr_bytes, murf_tts
from llm_service import create_graph, create_basic_graph
from clean import clean_markdown_for_tts
from custom_supabase import get_user_runtime_variables, upsert_session_summary
from map import LANGUAGE_CODE_TO_NAME
logger = logging.getLogger("voicebot")

async def handle_websocket_connection(websocket: WebSocket):
    await websocket.accept()
    logger.info("🔌 WebSocket client connected.")

    import uuid

    initial_data = await websocket.receive_json()
    messages = []
    rt_var = None  # Initialize rt_var outside the if block
    flag= 'user_id' in initial_data
    if flag:
        thread_id = initial_data.get('user_id')
        graph = create_graph()
        rt_var = await get_user_runtime_variables(initial_data['user_id'])
        lang_code= rt_var["language"]
        lang=LANGUAGE_CODE_TO_NAME[lang_code]
        config = {"configurable": {"thread_id": thread_id, "knowledge_base": rt_var['knowledge_base']}}
        if rt_var["session_summary"] != "":
            prompt = f"Keep the responses short and concise. The responses should strictly be in {lang}.Dont use abbreviations or numerical content in your responses. previously the user has discussed: {rt_var['session_summary']}"
        else:
            prompt = f"Keep the responses short and concise. The responses should strictly be in {lang}.Dont use abbreviations or numerical content in your responses."
        system_message = rt_var["system_prompt"] + prompt
        messages.append(SystemMessage(content=system_message))
    else:
        graph = create_basic_graph()
        thread_id = str(uuid.uuid4())
        config = {"configurable": {"thread_id": thread_id}}
    
    messages.append(HumanMessage("Generate a greeting for the user, state who you are and how can you help the user"))
    # Send connection successful after processing runtime variables
    response = await graph.ainvoke({"messages": messages}, config=config)
    response = response["messages"][-1].content
    messages.append(AIMessage(content=response))
    if flag:
        audio = await murf_tts(clean_markdown_for_tts(response), voice_id=rt_var['accent'])
    else:
        audio = await murf_tts(clean_markdown_for_tts(response))
    await websocket.send_json({"type": "connection_successful"})
    await websocket.send_bytes(audio)

    try:
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
                if flag:
                    transcription = await groq_asr_bytes(audio_bytes, language=lang_code)
                else:
                    transcription = await groq_asr_bytes(audio_bytes)
                
                await websocket.send_json({"type": "transcription", "text": transcription})
                messages.append(HumanMessage(content=transcription))
                
                # --- LangGraph LLM (only pass new HumanMessage) ---
                result = await graph.ainvoke({"messages": messages}, config=config)
                llm_response = result["messages"][-1].content
                await websocket.send_json({"type": "llm_response", "text": llm_response})
                llm_response = clean_markdown_for_tts(llm_response)
                messages.append(AIMessage(content=llm_response))
                # --- TTS ---
                if flag: 
                    audio_stream = await murf_tts(llm_response, voice_id=rt_var['accent'])
                else:
                    audio_stream = await murf_tts(llm_response)
                await websocket.send_json({"type": "tts_start"})
                await websocket.send_bytes(audio_stream)
                await websocket.send_json({"type": "tts_end"})

            except WebSocketDisconnect:
                logger.info("🔌 WebSocket disconnected.")
                break
            except Exception as e:
                logger.exception(f"❌ Error during call: {e}")
                await websocket.send_json({"error": str(e)})
                break
    
    finally:
        # This will only run when the WebSocket connection ends
        if 'user_id' in initial_data and rt_var is not None:
            try:
                # Generate session summary
                summary_message = HumanMessage(content="Based on all our discussion generate a summary of what we have discussed till now, include details of past conversations also. This summary will be used for context in future sessions.")
                messages.append(summary_message)
                response = await graph.ainvoke({"messages": messages}, config=config)
                summary = response["messages"][-1].content
                
                # Store the session summary
                resp = await upsert_session_summary(
                    initial_data['user_id'], 
                    rt_var["active_persona_id"], 
                    rt_var["persona_source"], 
                    summary
                )
                logger.info(f"✅ Session summary stored: {resp}")
                
            except Exception as e:
                logger.exception(f"❌ Error storing session summary: {e}")
        else:
            logger.info("🔄 Anonymous session ended - no summary stored")
