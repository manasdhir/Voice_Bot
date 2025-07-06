from typing import Optional
from pydantic import BaseModel

class ChatRequest(BaseModel):
    message: str
    session_id: Optional[str] = None
    provider: Optional[str] = "groq"

class ChatResponse(BaseModel):
    session_id: str
    reply: str
