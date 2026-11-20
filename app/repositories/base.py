"""Base repository interface."""

from abc import ABC, abstractmethod
from typing import Any, Generic, List, Optional, TypeVar
import aiosqlite

T = TypeVar("T")


class BaseRepository(ABC, Generic[T]):
    def __init__(self, db: aiosqlite.Connection):
        self.db = db
