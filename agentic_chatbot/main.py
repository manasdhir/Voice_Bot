from fastapi import FastAPI, WebSocket, WebSocketDisconnect

from groq import Groq
import os
import logging

# ---------------- LOGGING CONFIG ----------------
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
)
logger = logging.getLogger("voicebot")

def groq_asr_bytes(audio_bytes: bytes,
                   model: str = "whisper-large-v3-turbo",
                   language: str = "en") -> str:
    resp = groq.audio.transcriptions.create(
        model=model,
        file=("audio.wav", audio_bytes, "audio/wav"),
        response_format="text",
        language=language
    )
    return resp

def call_groq_llama(prompt: str) -> str:
    resp = groq.chat.completions.create(
        model="llama3-8b-8192",
        messages=[{"role": "user", "content": prompt}]
    )
    return resp.choices[0].message.content

def groq_tts(text: str, model: str = "playai-tts", voice: str = "Fritz-PlayAI") -> bytes:
    resp = groq.audio.speech.create(
        model=model,
        voice=voice,
        input=text,
        response_format="wav"
    )
    # Handle file-like responses
    if hasattr(resp, "read"):
        return resp.read()
    elif hasattr(resp, "content"):
        return resp.content
    elif isinstance(resp, (bytes, bytearray)):
        return bytes(resp)
    else:
        # Fallback: try write_to_file to temp and read
        import tempfile
        tf = tempfile.NamedTemporaryFile(delete=False, suffix=".wav")
        resp.write_to_file(tf.name)
        tf.close()
        data = open(tf.name, "rb").read()
        os.remove(tf.name)
        return data

app = FastAPI()

groq = Groq(api_key=os.environ.get("GROQ_API_KEY"))

@app.websocket("/ws/stream")
async def ws_pipeline(websocket: WebSocket):
    await websocket.accept()
    logger.info("🔌 WebSocket client connected.")
    while True:
        try:
            data = await websocket.receive_json()
            if data.get("type") == "end_call":
                logger.info("📞 Call ended by client")
                await websocket.close()
                break

            lang = data.get("lang", "english").lower()
            audio_bytes = await websocket.receive_bytes()

            # --- ASR (speech-to-text) ---
            transcription = groq_asr_bytes(audio_bytes, language="en" if lang == "english" else lang)
            await websocket.send_json({"type": "transcription", "text": transcription})

            # --- LLM response ---
            response = call_groq_llama(transcription)
            await websocket.send_json({"type": "llm_response", "text": response})

            # --- TTS (text-to-speech) ---
            tts_wav = groq_tts(response, voice="Fritz-PlayAI")
            await websocket.send_json({"type": "tts_start"})
            await websocket.send_bytes(tts_wav)  # <--- This now works without error
            await websocket.send_json({"type": "tts_end"})


        except WebSocketDisconnect:
            logger.info("🔌 WebSocket disconnected.")
            break
        except Exception as e:
            logger.exception(f"❌ Error during call: {e}")
            await websocket.send_json({"error": str(e)})
            break