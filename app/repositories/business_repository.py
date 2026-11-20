"""Business Profile repository for company identity and positioning."""

import json
from typing import Optional
import aiosqlite

from app.models.business import BusinessProfile
from app.repositories.base import BaseRepository
from app.schemas.business import BusinessProfileCreate, BusinessProfileUpdate


class BusinessRepository(BaseRepository[BusinessProfile]):
    """Data access layer for business profile and positioning."""

    @staticmethod
    def _row_to_profile(row: aiosqlite.Row) -> BusinessProfile:
        d = dict(row)
        raw_comp = d.pop("competitors_json", "[]")
        try:
            d["competitors"] = json.loads(raw_comp) if raw_comp else []
        except (json.JSONDecodeError, TypeError):
            d["competitors"] = []
        return BusinessProfile(**d)

    async def get_profile(self) -> Optional[BusinessProfile]:
        """Fetch the primary business profile."""
        sql = "SELECT * FROM business_profiles ORDER BY created_at DESC LIMIT 1;"
        async with self.db.execute(sql) as cursor:
            row = await cursor.fetchone()
            return self._row_to_profile(row) if row else None

    async def create_or_update_profile(self, data: BusinessProfileCreate) -> BusinessProfile:
        """Create or update the primary business profile."""
        existing = await self.get_profile()
        if existing:
            sql = """
            UPDATE business_profiles SET
                company_name = ?, website = ?, tagline = ?, overview = ?,
                industry = ?, business_model = ?, target_geography = ?,
                value_proposition = ?, competitors_json = ?, updated_at = CURRENT_TIMESTAMP
            WHERE id = ?;
            """
            await self.db.execute(
                sql,
                (
                    data.company_name,
                    data.website or "",
                    data.tagline or "",
                    data.overview or "",
                    data.industry or "",
                    data.business_model or "B2B",
                    data.target_geography or "Global",
                    data.value_proposition or "",
                    json.dumps(data.competitors),
                    existing.id,
                ),
            )
            await self.db.commit()
            return await self.get_profile()  # type: ignore

        profile = BusinessProfile(
            company_name=data.company_name,
            website=data.website or "",
            tagline=data.tagline or "",
            overview=data.overview or "",
            industry=data.industry or "",
            business_model=data.business_model or "B2B",
            target_geography=data.target_geography or "Global",
            value_proposition=data.value_proposition or "",
            competitors=data.competitors,
        )
        sql = """
        INSERT INTO business_profiles (
            id, company_name, website, tagline, overview, industry,
            business_model, target_geography, value_proposition,
            competitors_json, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);
        """
        await self.db.execute(
            sql,
            (
                profile.id,
                profile.company_name,
                profile.website,
                profile.tagline,
                profile.overview,
                profile.industry,
                profile.business_model,
                profile.target_geography,
                profile.value_proposition,
                json.dumps(profile.competitors),
                profile.created_at.isoformat(),
                profile.updated_at.isoformat(),
            ),
        )
        await self.db.commit()
        return profile
