"""Domain exceptions and API error abstractions."""

from typing import Any, Dict, Optional
from fastapi import HTTPException, status


class HarveyException(Exception):
    """Base exception for all Harvey domain errors."""
    def __init__(self, message: str, details: Optional[Dict[str, Any]] = None):
        super().__init__(message)
        self.message = message
        self.details = details or {}


class EntityNotFoundError(HarveyException):
    """Raised when a requested resource does not exist in the database."""
    pass


class DuplicateEntityError(HarveyException):
    """Raised when an entity with unique constraints already exists."""
    pass


class QualityGateFailureError(HarveyException):
    """Raised when cold email copy fails pre-send deterministic checks."""
    pass


class OllamaConnectionError(HarveyException):
    """Raised when local Ollama daemon is unreachable."""
    pass


class AirGapViolationError(HarveyException):
    """Raised when an external cloud API call is attempted while in offline mode."""
    pass


def map_exception_to_http(exc: HarveyException) -> HTTPException:
    """Map domain exceptions to standard FastAPI HTTPExceptions."""
    if isinstance(exc, EntityNotFoundError):
        return HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"error": "Not Found", "message": exc.message, "details": exc.details}
        )
    if isinstance(exc, DuplicateEntityError):
        return HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail={"error": "Conflict", "message": exc.message, "details": exc.details}
        )
    if isinstance(exc, QualityGateFailureError):
        return HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail={"error": "Quality Gate Failure", "message": exc.message, "details": exc.details}
        )
    if isinstance(exc, OllamaConnectionError):
        return HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail={"error": "Local Model Unavailable", "message": exc.message, "details": exc.details}
        )
    return HTTPException(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        detail={"error": "Internal Error", "message": str(exc), "details": exc.details}
    )
