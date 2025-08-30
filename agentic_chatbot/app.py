from fastapi import FastAPI, HTTPException, WebSocket, UploadFile, File, Depends
from fastapi.middleware.cors import CORSMiddleware
import logging
from config import ALLOWED_ORIGINS
from websocket_handler import handle_websocket_connection
from document_service import process_document_upload
from auth import get_current_user
from typing import List, Optional
from pydantic import BaseModel
from custom_endpoints import router as persona_router
from rag_service import get_user_knowledge_bases
from custom_supabase import (
    get_mcp_servers_for_user,
    create_mcp_server_for_user,
    delete_mcp_server_for_user,
)

# ---------------- LOGGING CONFIG ----------------
logging.basicConfig(
    level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s"
)
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
async def upload_doc(
    kg_name: str, file: UploadFile = File(...), user=Depends(get_current_user)
):
    return await process_document_upload(
        file, userid=user["sub"], knowledge_base=kg_name
    )


@app.get("/mcps")
async def get_mcps(user=Depends(get_current_user)):
    return await get_mcp_servers_for_user(user_id=user["sub"])


class CreateMcpServerRequest(BaseModel):
    name: str
    url: str
    bearer_token: Optional[str] = None


@app.post("/mcps/create")
async def create_mcps(request: CreateMcpServerRequest, user=Depends(get_current_user)):
    return await create_mcp_server_for_user(
        user_id=user["sub"],
        name=request.name,
        url=request.url,
        bearer_token=request.bearer_token,
    )


@app.delete("/mcps/delete/{server_id}")
async def delete_mcp_server(server_id: str, user=Depends(get_current_user)):
    return await delete_mcp_server_for_user(user_id=user["sub"], server_id=server_id)


from map import MURF_VOICE_MAPPING
from audio_services import murf_tts
from io import BytesIO
from fastapi.responses import StreamingResponse


@app.post("/test_voice")
async def test_voice(text: str, lang_code: str, user=Depends(get_current_user)):
    voice = MURF_VOICE_MAPPING[lang_code]
    print(voice)
    audio_data = await murf_tts(text, voice)
    audio_stream = BytesIO(audio_data)

    return StreamingResponse(
        audio_stream,
        media_type="audio/mpeg",
        headers={
            "Content-Disposition": "attachment; filename=voice_sample.mp3",
            "X-Voice-ID": voice,
            "X-Language-Code": lang_code,
        },
    )


class KnowledgeBasesResponse(BaseModel):
    knowledge_bases: List[str]
    total_count: int
    user_id: str


class DocumentResponse(BaseModel):
    id: str
    filename: str
    knowledge_base: str
    upload_date: str


class DocumentsResponse(BaseModel):
    documents: List[DocumentResponse]
    total_count: int
    knowledge_base: str


@app.get("/knowledge_bases", response_model=KnowledgeBasesResponse)
async def get_knowledge_bases(user=Depends(get_current_user)):
    """Get all knowledge base names belonging to the authenticated user"""
    try:
        user_id = user["sub"]
        knowledge_bases = await get_user_knowledge_bases(user_id)

        logger.info(
            f"Retrieved {len(knowledge_bases)} knowledge bases for user {user_id}"
        )

        return KnowledgeBasesResponse(
            knowledge_bases=knowledge_bases,
            total_count=len(knowledge_bases),
            user_id=user_id,
        )

    except Exception as e:
        logger.error(f"Error fetching knowledge bases for user: {str(e)}")
        raise HTTPException(
            status_code=500, detail="Failed to retrieve knowledge bases"
        )


@app.get("/knowledge_bases/{kb_name}/documents", response_model=DocumentsResponse)
async def get_kb_documents(kb_name: str, user=Depends(get_current_user)):
    """Get all documents in a specific knowledge base"""
    try:
        from rag_service import get_kb_documents

        user_id = user["sub"]
        documents = await get_kb_documents(user_id, kb_name)

        logger.info(
            f"Retrieved {len(documents)} documents for knowledge base '{kb_name}' for user {user_id}"
        )

        return DocumentsResponse(
            documents=documents, total_count=len(documents), knowledge_base=kb_name
        )

    except Exception as e:
        logger.error(
            f"Error fetching documents for knowledge base '{kb_name}': {str(e)}"
        )
        raise HTTPException(status_code=500, detail="Failed to retrieve documents")


@app.delete("/knowledge_bases/{kb_name}/documents/{filename}")
async def delete_document(kb_name: str, filename: str, user=Depends(get_current_user)):
    """Delete a specific document from a knowledge base"""
    try:
        from rag_service import delete_document_from_kb

        user_id = user["sub"]
        success = await delete_document_from_kb(user_id, kb_name, filename)

        if success:
            logger.info(
                f"Deleted document '{filename}' from knowledge base '{kb_name}' for user {user_id}"
            )
            return {"message": f"Document '{filename}' deleted successfully"}
        else:
            raise HTTPException(status_code=404, detail="Document not found")

    except HTTPException:
        raise
    except Exception as e:
        logger.error(
            f"Error deleting document '{filename}' from knowledge base '{kb_name}': {str(e)}"
        )
        raise HTTPException(status_code=500, detail="Failed to delete document")
