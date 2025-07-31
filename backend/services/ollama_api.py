"""
Ollama API endpoints for managing local Ollama models.

This module provides REST API endpoints for:
- Discovering available Ollama models
- Checking Ollama server status
- Managing model operations (pull, delete)
- Getting model information
"""

from fastapi import APIRouter, HTTPException, Depends
from typing import List, Dict, Any, Optional
from pydantic import BaseModel
from services.ollama_service import ollama_service
from utils.logger import logger
from utils.config import config


router = APIRouter(prefix="/ollama", tags=["ollama"])


class ModelInfo(BaseModel):
    """Model information response."""
    id: str
    name: str
    display_name: str
    size: int
    modified_at: str
    digest: str


class ServerStatus(BaseModel):
    """Ollama server status response."""
    status: str
    accessible: bool
    base_url: str


class PullModelRequest(BaseModel):
    """Request model for pulling a model."""
    model_name: str


class DeleteModelRequest(BaseModel):
    """Request model for deleting a model."""
    model_name: str


@router.get("/status", response_model=ServerStatus)
async def get_server_status():
    """Check if Ollama server is running and accessible."""
    try:
        accessible = await ollama_service.check_server_status()
        return ServerStatus(
            status="running" if accessible else "unavailable",
            accessible=accessible,
            base_url=ollama_service.base_url
        )
    except Exception as e:
        logger.error(f"Error checking Ollama server status: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to check server status")


@router.get("/models", response_model=List[ModelInfo])
async def get_available_models():
    """Get list of available Ollama models."""
    try:
        # First check if server is accessible
        if not await ollama_service.check_server_status():
            raise HTTPException(
                status_code=503, 
                detail="Ollama server is not accessible. Make sure Ollama is running on your local machine."
            )
        
        models = await ollama_service.get_formatted_models()
        return models
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting available models: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to get available models")


@router.get("/models/{model_name}")
async def get_model_info(model_name: str):
    """Get detailed information about a specific model."""
    try:
        if not await ollama_service.check_server_status():
            raise HTTPException(
                status_code=503, 
                detail="Ollama server is not accessible"
            )
        
        info = await ollama_service.get_model_info(model_name)
        if info is None:
            raise HTTPException(status_code=404, detail=f"Model '{model_name}' not found")
        
        return info
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting model info for {model_name}: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to get model information")


@router.post("/models/pull")
async def pull_model(request: PullModelRequest):
    """Pull a model from Ollama registry."""
    try:
        if not await ollama_service.check_server_status():
            raise HTTPException(
                status_code=503, 
                detail="Ollama server is not accessible"
            )
        
        success = await ollama_service.pull_model(request.model_name)
        if success:
            return {"message": f"Successfully pulled model: {request.model_name}"}
        else:
            raise HTTPException(status_code=400, detail=f"Failed to pull model: {request.model_name}")
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error pulling model {request.model_name}: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to pull model")


@router.delete("/models/delete")
async def delete_model(request: DeleteModelRequest):
    """Delete a model from local storage."""
    try:
        if not await ollama_service.check_server_status():
            raise HTTPException(
                status_code=503, 
                detail="Ollama server is not accessible"
            )
        
        success = await ollama_service.delete_model(request.model_name)
        if success:
            return {"message": f"Successfully deleted model: {request.model_name}"}
        else:
            raise HTTPException(status_code=400, detail=f"Failed to delete model: {request.model_name}")
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting model {request.model_name}: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to delete model")


@router.get("/health")
async def health_check():
    """Health check endpoint for Ollama service."""
    try:
        accessible = await ollama_service.check_server_status()
        return {
            "service": "ollama",
            "status": "healthy" if accessible else "unhealthy",
            "accessible": accessible,
            "base_url": ollama_service.base_url
        }
    except Exception as e:
        logger.error(f"Ollama health check failed: {str(e)}")
        return {
            "service": "ollama",
            "status": "unhealthy",
            "accessible": False,
            "base_url": ollama_service.base_url,
            "error": str(e)
        } 