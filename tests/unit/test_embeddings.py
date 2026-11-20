"""Unit tests for local SentenceTransformers embedding and similarity search."""

import pytest
from app.embeddings.local_embeddings import LocalEmbeddingService


def test_embed_text_dimensions():
    service = LocalEmbeddingService()
    vec = service.embed_text("Autonomous sales agent for B2B SaaS")
    assert isinstance(vec, list)
    assert len(vec) == 384


def test_embedding_cache_idempotency():
    service = LocalEmbeddingService()
    text = "Cold email outreach deliverability optimization"
    vec1 = service.embed_text(text)
    vec2 = service.embed_text(text)
    assert vec1 == vec2
    # Second call should be served from cache
    key = service._hash_text(text)
    assert key in service._cache


def test_cosine_similarity_accuracy():
    service = LocalEmbeddingService()

    # Identical texts
    sim_self = service.compute_similarity("Enterprise Sales Intelligence", "Enterprise Sales Intelligence")
    assert sim_self >= 0.999

    # Related texts vs unrelated texts
    sim_related = service.compute_similarity(
        "Automated outbound email prospecting for tech startups",
        "Cold email generation and sales lead finding",
    )
    sim_unrelated = service.compute_similarity(
        "Automated outbound email prospecting for tech startups",
        "Recipe for homemade Italian sourdough pizza with mozzarella",
    )
    assert sim_related > sim_unrelated


def test_find_top_matches():
    service = LocalEmbeddingService()
    query = "FinTech compliance and payment gateway integrations"
    candidates = [
        ("c1", "Italian restaurant delivery and pizza menu"),
        ("c2", "Banking regulation software for online payments and card compliance"),
        ("c3", "Outdoor camping gear, hiking boots and tents"),
    ]
    matches = service.find_top_matches(query, candidates, top_k=2)
    assert len(matches) == 2
    # Banking software must rank first
    assert matches[0][0] == "c2"
    assert matches[0][1] > matches[1][1]
