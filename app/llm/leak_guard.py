"""Zero-Cloud-Leakage Guard.

Enforces the non-negotiable constraint:
Zero paid LLM services (No OpenAI, Anthropic, Gemini, Groq, paid embeddings).
Validates that inference and embeddings remain strictly local (localhost / 127.0.0.1).
"""

from urllib.parse import urlparse
from app.core.exceptions import AirGapViolationError

PAID_CLOUD_AI_DOMAINS = frozenset({
    "api.openai.com",
    "api.anthropic.com",
    "claude.ai",
    "generativelanguage.googleapis.com",
    "api.groq.com",
    "api.cohere.ai",
    "api.together.xyz",
    "api.mistral.ai",
    "api.perplexity.ai",
    "api.deepseek.com",
})


def validate_inference_endpoint(url: str) -> None:
    """Validate that the given inference URL is local and not a paid cloud AI provider."""
    parsed = urlparse(url)
    hostname = (parsed.hostname or "").lower()

    if hostname in PAID_CLOUD_AI_DOMAINS:
        raise AirGapViolationError(
            f"Strict Zero-Paid-LLM Violation: Attempted outbound call to paid cloud AI domain '{hostname}'. "
            "All model inferences must run locally via Ollama or local sentence-transformers."
        )

    # In strict local mode, only loopback addresses are permitted for AI inference
    allowed_hosts = {"localhost", "127.0.0.1", "0.0.0.0", "::1"}
    if hostname not in allowed_hosts:
        raise AirGapViolationError(
            f"Unauthorized external inference host '{hostname}'. Only local endpoints (localhost / 127.0.0.1) are permitted."
        )
