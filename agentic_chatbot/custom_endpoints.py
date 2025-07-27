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
    
from custom_supabase import set_active_persona_for_user

class SetActivePersonaRequest(BaseModel):
    persona_id: str
    persona_source: str  # "default" or "user"

class SetActivePersonaResponse(BaseModel):
    success: bool
    active_persona_id: str
    persona_source: str
    user_id: str
    message: str

from custom_supabase import set_active_persona_for_user

from custom_supabase import set_active_persona_for_user

class SetActivePersonaRequest(BaseModel):
    persona_source: str  # "default" or "user"

class SetActivePersonaResponse(BaseModel):
    success: bool
    active_persona_id: str
    persona_source: str
    user_id: str
    message: str

@router.post("/{persona_id}/activate", response_model=SetActivePersonaResponse)
async def activate_persona(
    persona_id: str,
    request: SetActivePersonaRequest,
    user=Depends(get_current_user)
):
    """Activate a persona (either default or user's custom)"""
    try:
        user_id = user['sub']
        
        result = await set_active_persona_for_user(
            user_id=user_id,
            persona_id=persona_id,
            persona_source=request.persona_source
        )
        
        print(f"✅ Activated {request.persona_source} persona {persona_id} for user {user_id}")
        
        return SetActivePersonaResponse(**result)
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ Unexpected error in activate_persona: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An unexpected error occurred while activating persona"
        )

from custom_supabase import set_inactive_persona_for_user

class SetInactivePersonaResponse(BaseModel):
    success: bool
    message: str
    user_id: str
    previous_active_persona_id: str
    previous_persona_source: str
    default_persona_id: str
    note: str

@router.post("/deactivate", response_model=SetInactivePersonaResponse)
async def deactivate_persona(
    user=Depends(get_current_user)
):
    """Deactivate the current active persona (system will fall back to default)"""
    try:
        user_id = user['sub']
        
        result = await set_inactive_persona_for_user(user_id=user_id)
        
        print(f"✅ Deactivated active persona for user {user_id}")
        
        return SetInactivePersonaResponse(**result)
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ Unexpected error in deactivate_persona: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An unexpected error occurred while deactivating persona"
        )

from custom_supabase import update_persona_for_user

class UpdatePersonaRequest(BaseModel):
    knowledge_base: Optional[str] = None
    language: Optional[str] = None
    accent: Optional[str] = None

class UpdatePersonaResponse(BaseModel):
    success: bool
    persona_id: str
    user_id: str
    updated_fields: list[str]
    persona: dict
    message: str

@router.post("/{persona_id}", response_model=UpdatePersonaResponse)
async def update_persona(
    persona_id: str,
    request: UpdatePersonaRequest,
    user=Depends(get_current_user)
):
    try:
        user_id = user['sub']
        
        result = await update_persona_for_user(
            user_id=user_id,
            persona_id=persona_id,
            knowledge_base=request.knowledge_base,
            language=request.language,
            accent=request.accent
        )
        
        print(f"✅ Updated custom persona {persona_id} for user {user_id}")
        
        return UpdatePersonaResponse(**result)
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ Unexpected error in update_persona: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An unexpected error occurred while updating persona"
        )
