"""
Ollama service for managing local Ollama models.

This module provides utilities for:
- Discovering available Ollama models
- Checking Ollama server status
- Managing model connections
- Validating model availability
"""

import httpx
import asyncio
from typing import List, Dict, Any, Optional
from utils.logger import logger
from utils.config import config


class OllamaService:
    """Service for managing Ollama local models."""
    
    def __init__(self):
        self.base_url = config.OLLAMA_API_BASE or "http://localhost:11434"
        self.timeout = 10.0  # 10 second timeout for local connections
    
    async def check_server_status(self) -> bool:
        """Check if Ollama server is running and accessible."""
        try:
            async with httpx.AsyncClient(timeout=self.timeout) as client:
                response = await client.get(f"{self.base_url}/api/tags")
                return response.status_code == 200
        except Exception as e:
            logger.warning(f"Ollama server not accessible: {str(e)}")
            return False
    
    async def get_available_models(self) -> List[Dict[str, Any]]:
        """Get list of available models from Ollama server."""
        try:
            async with httpx.AsyncClient(timeout=self.timeout) as client:
                response = await client.get(f"{self.base_url}/api/tags")
                if response.status_code == 200:
                    data = response.json()
                    models = data.get("models", [])
                    logger.info(f"Found {len(models)} Ollama models")
                    return models
                else:
                    logger.error(f"Failed to get Ollama models: {response.status_code}")
                    return []
        except Exception as e:
            logger.error(f"Error getting Ollama models: {str(e)}")
            return []
    
    async def get_model_info(self, model_name: str) -> Optional[Dict[str, Any]]:
        """Get detailed information about a specific model."""
        try:
            async with httpx.AsyncClient(timeout=self.timeout) as client:
                response = await client.post(
                    f"{self.base_url}/api/show",
                    json={"name": model_name}
                )
                if response.status_code == 200:
                    return response.json()
                else:
                    logger.warning(f"Failed to get model info for {model_name}: {response.status_code}")
                    return None
        except Exception as e:
            logger.error(f"Error getting model info for {model_name}: {str(e)}")
            return None
    
    async def pull_model(self, model_name: str) -> bool:
        """Pull a model from Ollama registry."""
        try:
            async with httpx.AsyncClient(timeout=300.0) as client:  # Longer timeout for downloads
                response = await client.post(
                    f"{self.base_url}/api/pull",
                    json={"name": model_name}
                )
                if response.status_code == 200:
                    logger.info(f"Successfully pulled model: {model_name}")
                    return True
                else:
                    logger.error(f"Failed to pull model {model_name}: {response.status_code}")
                    return False
        except Exception as e:
            logger.error(f"Error pulling model {model_name}: {str(e)}")
            return False
    
    async def delete_model(self, model_name: str) -> bool:
        """Delete a model from local storage."""
        try:
            async with httpx.AsyncClient(timeout=self.timeout) as client:
                response = await client.delete(
                    f"{self.base_url}/api/delete",
                    json={"name": model_name}
                )
                if response.status_code == 200:
                    logger.info(f"Successfully deleted model: {model_name}")
                    return True
                else:
                    logger.error(f"Failed to delete model {model_name}: {response.status_code}")
                    return False
        except Exception as e:
            logger.error(f"Error deleting model {model_name}: {str(e)}")
            return False
    
    def format_model_name(self, model_name: str) -> str:
        """Format model name for display in the UI."""
        # Remove common suffixes and format nicely
        name = model_name.replace("-instruct", "").replace("-chat", "")
        name = name.replace("llama3.2", "Llama 3.2").replace("llama3.1", "Llama 3.1")
        name = name.replace("codellama", "Code Llama").replace("mistral", "Mistral")
        name = name.replace("gemma", "Gemma").replace("phi", "Phi")
        name = name.replace("qwen", "Qwen").replace("neural-chat", "Neural Chat")
        name = name.replace("orca-mini", "Orca Mini")
        
        # Add size information if present
        if any(size in model_name for size in ["3b", "7b", "8b", "13b", "14b", "34b", "70b", "72b"]):
            for size in ["3b", "7b", "8b", "13b", "14b", "34b", "70b", "72b"]:
                if size in model_name:
                    name = f"{name} ({size.upper()})"
                    break
        
        return name
    
    async def get_formatted_models(self) -> List[Dict[str, Any]]:
        """Get available models with formatted names for UI display."""
        models = await self.get_available_models()
        formatted_models = []
        
        for model in models:
            model_name = model.get("name", "")
            formatted_name = self.format_model_name(model_name)
            formatted_models.append({
                "id": f"ollama/{model_name}",
                "name": model_name,
                "display_name": formatted_name,
                "size": model.get("size", 0),
                "modified_at": model.get("modified_at", ""),
                "digest": model.get("digest", "")
            })
        
        return formatted_models


# Global instance
ollama_service = OllamaService() 