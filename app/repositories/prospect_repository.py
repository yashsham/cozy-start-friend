"""Prospect and Company repository with pagination and search."""

import json
from typing import List, Optional, Tuple
import aiosqlite

from app.models.prospect import Company, Prospect
from app.repositories.base import BaseRepository
from app.schemas.prospect import ProspectCreate, ProspectUpdate


class ProspectRepository(BaseRepository[Prospect]):
    """Data access layer for prospects and organizations."""

    @staticmethod
    def _row_to_prospect(row: aiosqlite.Row) -> Prospect:
        d = dict(row)
        return Prospect(**d)

    @staticmethod
    def _row_to_company(row: aiosqlite.Row) -> Company:
        d = dict(row)
        for json_col in ("tech_stack_json", "signals_json"):
            field = json_col.replace("_json", "")
            raw = d.pop(json_col, "[]")
            try:
                d[field] = json.loads(raw) if raw else []
            except (json.JSONDecodeError, TypeError):
                d[field] = []
        return Company(**d)

    async def list_prospects(
        self,
        page: int = 1,
        page_size: int = 20,
        status: Optional[str] = None,
        search: Optional[str] = None,
    ) -> Tuple[List[Prospect], int]:
        """Fetch paginated prospects with optional status and text search."""
        offset = (page - 1) * page_size
        where_clauses = []
        params = []

        if status:
            where_clauses.append("status = ?")
            params.append(status)

        if search:
            where_clauses.append("(first_name LIKE ? OR last_name LIKE ? OR company LIKE ? OR email LIKE ?)")
            pattern = f"%{search}%"
            params.extend([pattern, pattern, pattern, pattern])

        where_sql = f"WHERE {' AND '.join(where_clauses)}" if where_clauses else ""

        count_sql = f"SELECT COUNT(*) FROM prospects {where_sql};"
        async with self.db.execute(count_sql, params) as cursor:
            row = await cursor.fetchone()
            total = row[0] if row else 0

        fetch_sql = f"""
        SELECT * FROM prospects {where_sql}
        ORDER BY created_at DESC
        LIMIT ? OFFSET ?;
        """
        fetch_params = params + [page_size, offset]

        async with self.db.execute(fetch_sql, fetch_params) as cursor:
            rows = await cursor.fetchall()
            items = [self._row_to_prospect(row) for row in rows]

        return items, total

    async def get_prospect_by_id(self, prospect_id: str) -> Optional[Prospect]:
        """Fetch prospect by ID."""
        sql = "SELECT * FROM prospects WHERE id = ?;"
        async with self.db.execute(sql, (prospect_id,)) as cursor:
            row = await cursor.fetchone()
            return self._row_to_prospect(row) if row else None

    async def create_prospect(self, data: ProspectCreate) -> Prospect:
        """Insert a new prospect, safely handling company foreign keys."""
        resolved_company_id = data.company_id if data.company_id else None

        if resolved_company_id:
            # Verify company exists
            async with self.db.execute("SELECT id FROM companies WHERE id = ?;", (resolved_company_id,)) as cursor:
                if not await cursor.fetchone():
                    resolved_company_id = None

        if not resolved_company_id and data.company:
            # Check if company with same name exists
            async with self.db.execute("SELECT id FROM companies WHERE name = ?;", (data.company,)) as cursor:
                row = await cursor.fetchone()
                if row:
                    resolved_company_id = row[0]
                else:
                    new_comp = Company(name=data.company, industry=data.industry or "")
                    await self.db.execute(
                        "INSERT INTO companies (id, name, industry, created_at, updated_at) VALUES (?, ?, ?, ?, ?);",
                        (new_comp.id, new_comp.name, new_comp.industry, new_comp.created_at.isoformat(), new_comp.updated_at.isoformat()),
                    )
                    resolved_company_id = new_comp.id

        prospect = Prospect(
            first_name=data.first_name,
            last_name=data.last_name,
            email=data.email,
            company_id=resolved_company_id,
            title=data.title,
            company=data.company,
            industry=data.industry,
            company_size=data.company_size,
            phone=data.phone,
            linkedin_url=data.linkedin_url,
            status=data.status,
        )
        sql = """
        INSERT INTO prospects (
            id, company_id, first_name, last_name, email,
            title, company, industry, company_size, phone,
            linkedin_url, status, score, personalization_notes,
            created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);
        """
        await self.db.execute(
            sql,
            (
                prospect.id,
                prospect.company_id,
                prospect.first_name,
                prospect.last_name,
                prospect.email,
                prospect.title,
                prospect.company,
                prospect.industry,
                prospect.company_size,
                prospect.phone,
                prospect.linkedin_url,
                prospect.status,
                prospect.score,
                prospect.personalization_notes,
                prospect.created_at.isoformat(),
                prospect.updated_at.isoformat(),
            ),
        )
        await self.db.commit()
        return prospect

    async def update_prospect(self, prospect_id: str, data: ProspectUpdate) -> Optional[Prospect]:
        """Update existing prospect fields."""
        prospect = await self.get_prospect_by_id(prospect_id)
        if not prospect:
            return None

        update_dict = data.model_dump(exclude_unset=True)
        if not update_dict:
            return prospect

        set_clauses = [f"{k} = ?" for k in update_dict.keys()]
        set_clauses.append("updated_at = CURRENT_TIMESTAMP")
        params = list(update_dict.values()) + [prospect_id]

        sql = f"UPDATE prospects SET {', '.join(set_clauses)} WHERE id = ?;"
        await self.db.execute(sql, params)
        await self.db.commit()
        return await self.get_prospect_by_id(prospect_id)
