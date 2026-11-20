"""Structured logging configuration for Harvey AI."""

import logging
import sys
from app.core.config import settings


def setup_logging():
    log_level = getattr(logging, settings.LOG_LEVEL.upper(), logging.INFO)
    logging.basicConfig(
        level=log_level,
        format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
        handlers=[
            logging.StreamHandler(sys.stdout)
        ]
    )
    # Silence overly verbose external loggers if any
    logging.getLogger("uvicorn.access").setLevel(logging.WARNING)


logger = logging.getLogger("harvey")
