from fastapi import FastAPI, WebSocket, UploadFile, File, Depends
from fastapi.middleware.cors import CORSMiddleware
import logging
from config import ALLOWED_ORIGINS
from websocket_handler import handle_websocket_connection
from document_service import process_document_upload
from auth import get_current_user

from custom_endpoints import router as persona_router

# ---------------- LOGGING CONFIG ----------------
logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger("voicebot")

# ---------------- INIT FastAPI ----------------
app = FastAPI()

app.include_router(persona_router)

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ------------------ FastAPI WebSocket ------------------

@app.websocket("/ws/stream")
async def ws_pipeline(websocket: WebSocket):
    await handle_websocket_connection(websocket)

@app.post("/upload_doc")
async def upload_doc(file: UploadFile = File(...), user=Depends(get_current_user)):
    return await process_document_upload(file, userid=user['sub'])

from map import MURF_VOICE_MAPPING
from audio_services import murf_tts
from io import BytesIO
from fastapi.responses import StreamingResponse
@app.post("/test_voice")
async def test_voice(text: str,lang_code:str, user=Depends(get_current_user)):
    voice=MURF_VOICE_MAPPING[lang_code]
    print(voice)
    audio_data = await murf_tts(text, voice)
    audio_stream = BytesIO(audio_data)
        
    return StreamingResponse(
            audio_stream,
            media_type="audio/mpeg",
            headers={
                "Content-Disposition": "attachment; filename=voice_sample.mp3",
                "X-Voice-ID": voice,
                "X-Language-Code": lang_code
            }
        )

