"""Business Profile service layer."""

from typing import Optional
import aiosqlite

from app.models.business import BusinessProfile
from app.repositories.business_repository import BusinessRepository
from app.schemas.business import BusinessProfileCreate


class BusinessService:
    def __init__(self, db: aiosqlite.Connection):
        self.repo = BusinessRepository(db)

    async def get_profile(self) -> Optional[BusinessProfile]:
        return await self.repo.get_profile()

    async def save_profile(self, data: BusinessProfileCreate) -> BusinessProfile:
        return await self.repo.create_or_update_profile(data)
