from fastapi import FastAPI, WebSocket, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
import logging
from config import ALLOWED_ORIGINS
from websocket_handler import handle_websocket_connection
from document_service import process_document_upload

# ---------------- LOGGING CONFIG ----------------
logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger("voicebot")

# ---------------- INIT FastAPI ----------------
app = FastAPI()

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
async def upload_doc(file: UploadFile = File(...)):
    return await process_document_upload(file)
