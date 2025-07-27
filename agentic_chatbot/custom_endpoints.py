from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from typing import Optional
from datetime import datetime
import uuid

from auth import get_current_user
from custom_supabase import insert_persona_to_supabase

class CreatePersonaRequest(BaseModel):
    name: str
    description: Optional[str] = None
    icon: str = "🤖"
    custom_prompt: str

class PersonaResponse(BaseModel):
    id: str
    user_id: str
    name: str
    description: Optional[str]
    icon: str
    custom_prompt: str
    knowledge_base: str
    language: str
    accent: str
    created_at: str
    updated_at: str

router = APIRouter(prefix="/personas", tags=["personas"])

@router.post("/create", response_model=PersonaResponse)
async def create_persona(
    persona_data: CreatePersonaRequest,
    user=Depends(get_current_user)
):
    try:
        user_id = user['sub']  # Extract user_id from JWT payload
        
        # Validate required fields
        if not persona_data.name.strip():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Persona name cannot be empty"
            )
        
        if not persona_data.custom_prompt.strip():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Custom prompt cannot be empty"
            )
        
        # Insert persona using the dedicated function
        created_persona = await insert_persona_to_supabase(
            name=persona_data.name,
            description=persona_data.description,
            icon=persona_data.icon,
            custom_prompt=persona_data.custom_prompt,
            user_id=user_id
        )
        
        print(f"✅ Persona created successfully for user {user_id}: {created_persona['name']}")
        
        return PersonaResponse(**created_persona)
        
    except HTTPException:
        # Re-raise HTTPExceptions (from validation or insert function)
        raise
    except Exception as e:
        print(f"❌ Unexpected error in create_persona: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An unexpected error occurred while creating the persona"
        )

from custom_supabase import get_all_personas_for_user

class PersonaListResponse(BaseModel):
    personas: list[dict]
    total: int
    default_count: int
    user_count: int

@router.get("/", response_model=PersonaListResponse)
async def get_all_personas(user=Depends(get_current_user)):
    try:
        user_id = user['sub']
        result = await get_all_personas_for_user(user_id)
        
        print(f"✅ Retrieved {result['total']} personas for user {user_id} ({result['default_count']} default, {result['user_count']} custom)")
        
        return PersonaListResponse(**result)
        
    except HTTPException:
        # Re-raise HTTPExceptions (from the function)
        raise
    except Exception as e:
        print(f"❌ Unexpected error in get_all_personas: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An unexpected error occurred while fetching personas"
        )