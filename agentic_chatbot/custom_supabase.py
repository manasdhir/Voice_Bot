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

async def set_active_persona_for_user(user_id: str, persona_id: str, persona_source: str) -> dict:
    try:
        supabase = await get_supabase()
        
        # Validate persona_source
        if persona_source not in ["default", "user"]:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid persona source. Must be 'default' or 'user'"
            )
        
        if persona_source == "default":
            persona_check = await supabase.table("default_personas").select("id").eq("id", persona_id).execute()
            if not persona_check.data:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="Default persona not found"
                )
        
        elif persona_source == "user":
            persona_check = await supabase.table("personas").select("id").eq("id", persona_id).eq("user_id", user_id).execute()
            if not persona_check.data:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="User persona not found or access denied"
                )
        existing_active = await supabase.table("user_active_persona").select("*").eq("user_id", user_id).execute()
        
        if existing_active.data:
            await supabase.table("user_active_persona").update({
                "active_persona_id": persona_id,
                "persona_source": persona_source
            }).eq("user_id", user_id).execute()
            print(f"✅ Updated active persona from {existing_active.data[0]['active_persona_id']} to {persona_id}")
        else:
            await supabase.table("user_active_persona").insert({
                "user_id": user_id,
                "active_persona_id": persona_id,
                "persona_source": persona_source
            }).execute()
            print(f"✅ Set initial active persona {persona_id} for new user")
        
        print(f"✅ Set active persona {persona_id} ({persona_source}) for user {user_id}")
        
        return {
            "success": True,
            "active_persona_id": persona_id,
            "persona_source": persona_source,
            "user_id": user_id,
            "message": "Persona activated successfully"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ Error setting active persona for user {user_id}: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Database error: {str(e)}"
        )

async def get_active_persona_for_user(user_id: str) -> dict:
    try:
        supabase = await get_supabase()
        
        active_ref = await supabase.table("user_active_persona").select("*").eq("user_id", user_id).execute()
        
        if not active_ref.data:
            default_persona_id = "d3134d26-75cb-43ee-b7e9-a13f36da9154"
            
            return {
                "success": True,
                "active_persona_id": default_persona_id,
                "persona_source": "default",
                "user_id": user_id,
                "message": "Using default persona (no active persona set)",
                "is_default_fallback": True
            }
        
        active_info = active_ref.data[0]
        
        return {
            "success": True,
            "active_persona_id": active_info["active_persona_id"],
            "persona_source": active_info["persona_source"],
            "user_id": user_id,
            "message": "Active persona found",
            "is_default_fallback": False,
            "activated_at": active_info["updated_at"]
        }
        
    except Exception as e:
        print(f"❌ Error fetching active persona for user {user_id}: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Database error: {str(e)}"
        )

async def set_inactive_persona_for_user(user_id: str) -> dict:
    try:
        supabase = await get_supabase()
        
        existing_active = await supabase.table("user_active_persona").select("*").eq("user_id", user_id).execute()
        
        if not existing_active.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="No active persona found for user"
            )
        
        previous_persona_id = existing_active.data[0]["active_persona_id"]
        previous_persona_source = existing_active.data[0]["persona_source"]
        
        await supabase.table("user_active_persona").delete().eq("user_id", user_id).execute()
        
        print(f"✅ Removed active persona mapping for user {user_id}")
        
        return {
            "success": True,
            "message": "Active persona removed successfully",
            "user_id": user_id,
            "previous_active_persona_id": previous_persona_id,
            "previous_persona_source": previous_persona_source,
            "default_persona_id": "d3134d26-75cb-43ee-b7e9-a13f36da9154",
            "note": "System will fall back to default persona"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ Error removing active persona for user {user_id}: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Database error: {str(e)}"
        )

async def update_persona_for_user(
    user_id: str, 
    persona_id: str,
    knowledge_base: Optional[str] = None,
    language: Optional[str] = None,
    accent: Optional[str] = None
) -> dict:
    try:
        supabase = await get_supabase()
        
        persona_check = await supabase.table("personas").select("*").eq("id", persona_id).eq("user_id", user_id).execute()
        if not persona_check.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User persona not found or access denied"
            )
        
        update_data = {}
        if knowledge_base is not None:
            update_data["knowledge_base"] = knowledge_base
        if language is not None:
            update_data["language"] = language
        if accent is not None:
            update_data["accent"] = accent
        
        if not update_data:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="No valid fields provided for update"
            )
        
        # Add updated timestamp
        update_data["updated_at"] = datetime.now().isoformat()
        
        # Update the persona
        response = await supabase.table("personas").update(update_data).eq("id", persona_id).eq("user_id", user_id).execute()
        
        if not response.data:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Failed to update persona"
            )
        
        updated_persona = response.data[0]
        
        print(f"✅ Updated custom persona {persona_id} for user {user_id}")
        
        return {
            "success": True,
            "persona_id": persona_id,
            "user_id": user_id,
            "updated_fields": list(update_data.keys()),
            "persona": {
                "id": updated_persona["id"],
                "name": updated_persona["name"],
                "description": updated_persona["description"],
                "icon": updated_persona["icon"],
                "knowledge_base": updated_persona["knowledge_base"],
                "language": updated_persona["language"],
                "accent": updated_persona["accent"],
                "updated_at": updated_persona["updated_at"]
            },
            "message": "Custom persona updated successfully"
        }
        
    except HTTPException:
        # Re-raise HTTPExceptions
        raise
    except Exception as e:
        print(f"❌ Error updating persona for user {user_id}: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Database error: {str(e)}"
        )
