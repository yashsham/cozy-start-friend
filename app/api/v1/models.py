"""Model management and local AI status endpoints."""

from typing import List
from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel, Field

from app.core.exceptions import OllamaConnectionError
from app.embeddings.local_embeddings import local_embedding_service
from app.llm.ollama_client import ollama_client
from app.schemas.common import APIResponse
from app.schemas.local_ai import LocalModelStatus, OllamaGenerateRequest, OllamaGenerateResponse

router = APIRouter(prefix="/models", tags=["Local AI Models"])


class EmbeddingRequest(BaseModel):
    texts: List[str] = Field(..., min_length=1)


class EmbeddingResponse(BaseModel):
    dimension: int
    embeddings: List[List[float]]


class SimilarityRequest(BaseModel):
    text_a: str = Field(..., min_length=1)
    text_b: str = Field(..., min_length=1)


class SimilarityResponse(BaseModel):
    similarity: float
    text_a: str
    text_b: str


@router.get("/status", response_model=APIResponse[LocalModelStatus])
async def get_model_status():
    """Report Ollama daemon connectivity, active model, and offline readiness."""
    status_data = await ollama_client.get_model_status()
    return APIResponse(
        message="Model status retrieved successfully",
        data=status_data,
    )


@router.post("/generate", response_model=APIResponse[OllamaGenerateResponse])
async def generate_text(request: OllamaGenerateRequest):
    """Generate completion using local Ollama (Zero paid cloud LLM)."""
    try:
        result = await ollama_client.generate(
            prompt=request.prompt,
            system_prompt=request.system_prompt,
            temperature=request.temperature,
            max_tokens=request.max_tokens,
        )
        return APIResponse(
            message="Generation completed",
            data=result,
        )
    except OllamaConnectionError as e:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail={"error": "Local Model Unavailable", "message": e.message},
        )


@router.post("/embeddings", response_model=APIResponse[EmbeddingResponse])
async def generate_embeddings(request: EmbeddingRequest):
    """Generate dense 384-dimensional embeddings using local SentenceTransformers."""
    vectors = local_embedding_service.embed_batch(request.texts)
    dimension = len(vectors[0]) if vectors else 0
    return APIResponse(
        data=EmbeddingResponse(
            dimension=dimension,
            embeddings=vectors,
        )
    )


@router.post("/similarity", response_model=APIResponse[SimilarityResponse])
async def compute_similarity(request: SimilarityRequest):
    """Compute semantic cosine similarity between two texts using local embeddings."""
    score = local_embedding_service.compute_similarity(request.text_a, request.text_b)
    return APIResponse(
        data=SimilarityResponse(
            similarity=round(score, 4),
            text_a=request.text_a,
            text_b=request.text_b,
        )
    )
