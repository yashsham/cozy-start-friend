"""Asynchronous Ollama HTTP client with structured JSON parsing and zero-cloud enforcement."""

import json
import re
import time
from typing import Any, Dict, List, Optional
import httpx

from app.core.config import settings
from app.core.exceptions import OllamaConnectionError
from app.core.logging import logger
from app.llm.leak_guard import validate_inference_endpoint
from app.schemas.local_ai import LocalModelStatus, OllamaGenerateResponse


class OllamaClient:
    """Async client communicating directly with the local Ollama daemon."""

    def __init__(
        self,
        base_url: Optional[str] = None,
        default_model: Optional[str] = None,
        timeout: Optional[float] = None,
    ):
        self.base_url = (base_url or settings.OLLAMA_BASE_URL).rstrip("/")
        self.default_model = default_model or settings.OLLAMA_MODEL
        self.timeout = timeout or settings.OLLAMA_TIMEOUT_SECONDS

        # Enforce that base_url is strictly local (never a paid cloud service)
        validate_inference_endpoint(self.base_url)

    async def check_health(self) -> bool:
        """Verify whether the local Ollama server is responding."""
        try:
            async with httpx.AsyncClient(timeout=0.5) as client:
                resp = await client.get(f"{self.base_url}/api/tags")
                return resp.status_code == 200
        except Exception:
            return False

    async def list_models(self) -> List[str]:
        """Fetch list of models currently pulled in local Ollama storage."""
        try:
            async with httpx.AsyncClient(timeout=0.5) as client:
                resp = await client.get(f"{self.base_url}/api/tags")
                if resp.status_code == 200:
                    data = resp.json()
                    return [m.get("name", "") for m in data.get("models", []) if m.get("name")]
        except Exception as e:
            logger.warning("Failed to query Ollama models: %s", str(e))
        return []

    async def is_model_available(self, model_name: Optional[str] = None) -> bool:
        """Check if target model is installed locally."""
        target = model_name or self.default_model
        models = await self.list_models()
        # Match either exact name or base tag (e.g. qwen2.5:7b matches qwen2.5:7b-instruct)
        target_base = target.split(":")[0].lower()
        for m in models:
            if m.lower() == target.lower() or m.lower().startswith(target_base):
                return True
        return False

    async def get_model_status(self) -> LocalModelStatus:
        """Report comprehensive local inference readiness."""
        online = await self.check_health()
        all_models = await self.list_models() if online else []
        available = False
        active_name = self.default_model
        if online and all_models:
            if self.default_model in all_models:
                available = True
            else:
                qwen_models = [m for m in all_models if "qwen" in m.lower()]
                active_name = qwen_models[0] if qwen_models else all_models[0]
                available = True

        return LocalModelStatus(
            ollama_online=online,
            model_name=active_name,
            model_available=available,
            context_length=8192,
            gpu_layers=0,
            offline_mode=settings.OFFLINE_MODE,
            details={
                "base_url": self.base_url,
                "installed_models": all_models,
                "pull_instruction": "Ready" if available else f"ollama pull {self.default_model}",
            },
        )

    async def generate(
        self,
        prompt: str,
        system_prompt: Optional[str] = None,
        model: Optional[str] = None,
        temperature: float = 0.2,
        max_tokens: int = 500,
        response_format: Optional[str] = None,  # e.g. "json"
        retries: int = 2,
    ) -> OllamaGenerateResponse:
        available_models = await self.list_models()
        if not model and available_models:
            if self.default_model in available_models:
                target_model = self.default_model
            else:
                # Find best matching installed Qwen or pick first installed
                qwen_models = [m for m in available_models if "qwen" in m.lower()]
                target_model = qwen_models[0] if qwen_models else available_models[0]
        else:
            target_model = model or self.default_model

        payload: Dict[str, Any] = {
            "model": target_model,
            "prompt": prompt,
            "stream": False,
            "options": {
                "temperature": temperature,
                "num_predict": max_tokens,
            },
        }

        if system_prompt:
            payload["system"] = system_prompt

        if response_format == "json":
            payload["format"] = "json"

        start_time = time.time()
        last_exception: Optional[Exception] = None

        for attempt in range(retries + 1):
            try:
                async with httpx.AsyncClient(timeout=self.timeout) as client:
                    resp = await client.post(
                        f"{self.base_url}/api/generate",
                        json=payload,
                    )
                    if resp.status_code == 200:
                        data = resp.json()
                        duration_ms = int((time.time() - start_time) * 1000)
                        return OllamaGenerateResponse(
                            response=data.get("response", "").strip(),
                            tokens_generated=data.get("eval_count", 0),
                            duration_ms=duration_ms,
                            model=target_model,
                        )
                    elif resp.status_code == 404:
                        raise OllamaConnectionError(
                            f"Model '{target_model}' not found in local Ollama. Run: ollama pull {target_model}"
                        )
                    else:
                        raise OllamaConnectionError(
                            f"Ollama returned HTTP {resp.status_code}: {resp.text[:200]}"
                        )
            except (httpx.ConnectError, httpx.TimeoutException) as e:
                last_exception = e
                logger.warning("Ollama connection attempt %d failed: %s", attempt + 1, str(e))
                if attempt < retries:
                    time.sleep(1.0 * (attempt + 1))

        raise OllamaConnectionError(
            f"Failed to connect to local Ollama at {self.base_url}. Ensure 'ollama serve' is running. Error: {last_exception}"
        )

    async def generate_json(
        self,
        prompt: str,
        system_prompt: Optional[str] = None,
        model: Optional[str] = None,
        temperature: float = 0.1,
    ) -> Dict[str, Any]:
        """Generate structured JSON output, safely stripping markdown fences if present."""
        result = await self.generate(
            prompt=prompt,
            system_prompt=system_prompt,
            model=model,
            temperature=temperature,
            response_format="json",
        )

        text = result.response
        # Strip potential markdown fences ```json ... ```
        fence_match = re.search(r"```(?:json)?\s*(\{.*?\})\s*```", text, re.DOTALL)
        if fence_match:
            text = fence_match.group(1)

        try:
            return json.loads(text)
        except json.JSONDecodeError as err:
            logger.error("Failed to parse JSON from model output: %s. Raw text: %s", str(err), text[:300])
            # Attempt to salvage substring between first { and last }
            first_brace = text.find("{")
            last_brace = text.rfind("}")
            if first_brace != -1 and last_brace != -1 and last_brace > first_brace:
                return json.loads(text[first_brace : last_brace + 1])
            raise OllamaConnectionError(f"Model output was not valid JSON: {text[:200]}")


ollama_client = OllamaClient()
