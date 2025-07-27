from fastapi import APIRouter, Depends, HTTPException, status, File, UploadFile
from pydantic import BaseModel
from typing import Optional, List
import uuid
from datetime import datetime
from supabase import AsyncClient, acreate_client
from auth import get_current_user, verify_token
import os

supabase_client: AsyncClient = None
_initialized = False

async def get_supabase() -> AsyncClient:
    """Get the Supabase client, initializing on first call"""
    global supabase_client, _initialized
    
    if not _initialized:
        supabase_client = await acreate_client(os.environ["SUPABASE_URL"], os.environ["SUPABASE_SERVICE_ROLE_KEY"])
        _initialized = True
        print("✅ Supabase client initialized")
    
    return supabase_client

async def insert_persona_to_supabase(
    name: str,
    description: Optional[str],
    icon: str,
    custom_prompt: str,
    user_id: str
) -> dict:
    try:
        supabase = await get_supabase()

        
        persona_data = {
            "user_id": user_id,
            "name": name,
            "description": description,
            "icon": icon,
            "custom_prompt": custom_prompt,
            "knowledge_base": "none",  # Default as requested
            "language": "en",  # Default as requested
            "accent": "en-IN",  # Default Indian accent as requested
        }
        
        # Insert the persona
        response = await supabase.table("personas").insert(persona_data).execute()
        
        if not response.data:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Failed to create persona in database"
            )
        
        return response.data[0]
        
    except Exception as e:
        print(f"❌ Error inserting persona: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Database error: {str(e)}"
        )

async def get_all_personas_for_user(user_id: str) -> dict:
    try:
        supabase = await get_supabase()
        
        # First, get the user's active persona info
        active_persona_info = None
        active_ref = await supabase.table("user_active_persona").select("*").eq("user_id", user_id).execute()
        
        if not active_ref.data:
            default_persona_id = "d3134d26-75cb-43ee-b7e9-a13f36da9154"
            
            # Insert default active persona
            await supabase.table("user_active_persona").insert({
                "user_id": user_id,
                "active_persona_id": default_persona_id,
                "persona_source": "default"
            }).execute()
            
            print(f"✅ Set default persona for new user: {user_id}")
            
            active_persona_info = {
                "active_persona_id": default_persona_id,
                "persona_source": "default"
            }
        else:
            active_persona_info = active_ref.data[0]
        
        default_personas_response = await supabase.table("default_personas").select("*").order("created_at", desc=False).execute()
        
        user_personas_response = await supabase.table("personas").select("*").eq("user_id", user_id).order("created_at", desc=True).execute()
        
        all_personas = []
        
        for persona in default_personas_response.data:
            is_active = (
                active_persona_info["persona_source"] == "default" and 
                active_persona_info["active_persona_id"] == persona["id"]
            )
            
            all_personas.append({
                "id": persona["id"],
                "user_id": None, 
                "name": persona["name"],
                "description": persona["description"],
                "icon": persona["icon"],
                "custom_prompt": persona["custom_prompt"],
                "knowledge_base": persona["knowledge_base"],
                "language": persona["language"],
                "accent": persona["accent"],
                "created_at": persona["created_at"],
                "updated_at": persona["updated_at"],
                "source": "default",
                "is_default": True,
                "is_active": is_active 
            })
        
        # Add user personas
        for persona in user_personas_response.data:
            is_active = (
                active_persona_info["persona_source"] == "user" and 
                active_persona_info["active_persona_id"] == persona["id"]
            )
            
            all_personas.append({
                "id": persona["id"],
                "user_id": persona["user_id"],
                "name": persona["name"],
                "description": persona["description"],
                "icon": persona["icon"],
                "custom_prompt": persona["custom_prompt"],
                "knowledge_base": persona["knowledge_base"],
                "language": persona["language"],
                "accent": persona["accent"],
                "created_at": persona["created_at"],
                "updated_at": persona["updated_at"],
                "source": "user",
                "is_default": False,
                "is_active": is_active  # true for active persona, false for others
            })
        
        return {
            "personas": all_personas,
            "total": len(all_personas),
            "default_count": len(default_personas_response.data),
            "user_count": len(user_personas_response.data)
        }
        
    except Exception as e:
        print(f"❌ Error fetching personas for user {user_id}: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Database error: {str(e)}"
        )
