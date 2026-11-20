"""Shared dependency injection providers for FastAPI."""

from typing import AsyncGenerator
import aiosqlite
from fastapi import Depends

from app.db.session import get_db
from app.services.business_service import BusinessService
from app.services.product_service import ProductService


async def get_product_service(db: aiosqlite.Connection = Depends(get_db)) -> ProductService:
    return ProductService(db)


async def get_business_service(db: aiosqlite.Connection = Depends(get_db)) -> BusinessService:
    return BusinessService(db)
