"""Local AI Model health and generation schemas."""

from typing import Any, Dict, List, Optional
from pydantic import BaseModel


class LocalModelStatus(BaseModel):
    ollama_online: bool
    model_name: str
    model_available: bool
    context_length: int = 8192
    gpu_layers: int = 0
    offline_mode: bool = False
    details: Optional[Dict[str, Any]] = None


class OllamaGenerateRequest(BaseModel):
    prompt: str
    system_prompt: Optional[str] = None
    temperature: float = 0.2
    max_tokens: int = 500


class OllamaGenerateResponse(BaseModel):
    response: str
    tokens_generated: int
    duration_ms: int
    model: str
