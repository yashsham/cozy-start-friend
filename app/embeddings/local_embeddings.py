"""Local SentenceTransformers embedding and semantic similarity service."""

import hashlib
import math
from typing import Dict, List, Optional, Tuple
import numpy as np

from app.core.config import settings
from app.core.logging import logger


class LocalEmbeddingService:
    """Computes dense vector representations and cosine similarities locally."""

    def __init__(self, model_name: Optional[str] = None):
        self.model_name = model_name or settings.EMBEDDING_MODEL
        self._model = None
        self._cache: Dict[str, List[float]] = {}

    def _get_model(self):
        """Lazy-load the SentenceTransformer model onto CPU/GPU."""
        if self._model is None:
            logger.info("Loading local SentenceTransformer model: %s...", self.model_name)
            try:
                from sentence_transformers import SentenceTransformer

                self._model = SentenceTransformer(self.model_name)
                logger.info("Local SentenceTransformer '%s' loaded successfully.", self.model_name)
            except Exception as e:
                logger.warning(
                    "Could not load SentenceTransformer '%s' directly (%s). Using deterministic local vector fallback.",
                    self.model_name,
                    str(e),
                )
                self._model = "fallback"
        return self._model

    @staticmethod
    def _hash_text(text: str) -> str:
        return hashlib.sha256(text.strip().lower().encode("utf-8")).hexdigest()

    def embed_text(self, text: str) -> List[float]:
        """Generate a normalized 384-dim dense vector for a single string."""
        if not text:
            return [0.0] * settings.EMBEDDING_DIMENSION

        cache_key = self._hash_text(text)
        if cache_key in self._cache:
            return self._cache[cache_key]

        model = self._get_model()
        if model != "fallback":
            vector = model.encode(text, normalize_embeddings=True)
            emb = vector.tolist() if hasattr(vector, "tolist") else list(vector)
        else:
            # Deterministic pseudo-embedding for testing environments without downloaded weights
            emb = self._deterministic_fallback_embedding(text)

        self._cache[cache_key] = emb
        return emb

    def embed_batch(self, texts: List[str]) -> List[List[float]]:
        """Batch embedding with cache lookup."""
        return [self.embed_text(t) for t in texts]

    @staticmethod
    def cosine_similarity(vec_a: List[float], vec_b: List[float]) -> float:
        """Compute cosine similarity between two normalized vectors."""
        if not vec_a or not vec_b:
            return 0.0
        a = np.array(vec_a, dtype=np.float32)
        b = np.array(vec_b, dtype=np.float32)
        norm_a = np.linalg.norm(a)
        norm_b = np.linalg.norm(b)
        if norm_a == 0.0 or norm_b == 0.0:
            return 0.0
        return float(np.dot(a, b) / (norm_a * norm_b))

    def compute_similarity(self, text_a: str, text_b: str) -> float:
        """Calculate semantic similarity between two texts."""
        emb_a = self.embed_text(text_a)
        emb_b = self.embed_text(text_b)
        return self.cosine_similarity(emb_a, emb_b)

    def find_top_matches(
        self,
        query: str,
        candidates: List[Tuple[str, str]],  # List of (id, text)
        top_k: int = 5,
    ) -> List[Tuple[str, float]]:
        """Find the top_k most semantically similar candidate texts for a query."""
        if not candidates:
            return []

        query_emb = self.embed_text(query)
        scored = []
        for cand_id, cand_text in candidates:
            cand_emb = self.embed_text(cand_text)
            sim = self.cosine_similarity(query_emb, cand_emb)
            scored.append((cand_id, sim))

        scored.sort(key=lambda x: x[1], reverse=True)
        return scored[:top_k]

    @staticmethod
    def _deterministic_fallback_embedding(text: str) -> List[float]:
        """Generates a stable, normalized 384-dim vector using seeded hash."""
        seed = int(hashlib.md5(text.encode("utf-8")).hexdigest()[:8], 16)
        rng = np.random.default_rng(seed)
        v = rng.standard_normal(settings.EMBEDDING_DIMENSION)
        v = v / np.linalg.norm(v)
        return v.tolist()


local_embedding_service = LocalEmbeddingService()
