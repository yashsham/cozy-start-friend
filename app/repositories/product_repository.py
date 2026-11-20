"""Product and ICP repository with async SQLite transactions."""

import json
from typing import List, Optional
import aiosqlite

from app.models.product import Product, ProductICP
from app.repositories.base import BaseRepository
from app.schemas.product import ProductCreate, ProductICPCreate, ProductICPUpdate, ProductUpdate


class ProductRepository(BaseRepository[Product]):
    """Data access layer for multi-product catalog and ICP rules."""

    @staticmethod
    def _row_to_product(row: aiosqlite.Row) -> Product:
        d = dict(row)
        for json_col in ("target_industries_json", "key_features_json"):
            field = json_col.replace("_json", "")
            raw = d.pop(json_col, "[]")
            try:
                d[field] = json.loads(raw) if raw else []
            except (json.JSONDecodeError, TypeError):
                d[field] = []
        d["is_active"] = bool(d.get("is_active", 1))
        return Product(**d)

    @staticmethod
    def _row_to_icp(row: aiosqlite.Row) -> ProductICP:
        d = dict(row)
        for json_col in (
            "target_roles_json",
            "target_company_sizes_json",
            "target_industries_json",
            "key_pain_points_json",
            "qualification_rules_json",
        ):
            field = json_col.replace("_json", "")
            raw = d.pop(json_col, "[]")
            try:
                d[field] = json.loads(raw) if raw else []
            except (json.JSONDecodeError, TypeError):
                d[field] = []
        return ProductICP(**d)

    async def list_products(self, active_only: bool = False) -> List[Product]:
        """Fetch all products."""
        sql = "SELECT * FROM products"
        params = []
        if active_only:
            sql += " WHERE is_active = 1"
        sql += " ORDER BY created_at DESC;"

        async with self.db.execute(sql, params) as cursor:
            rows = await cursor.fetchall()
            return [self._row_to_product(row) for row in rows]

    async def get_product_by_id(self, product_id: str) -> Optional[Product]:
        """Get product by unique ID."""
        sql = "SELECT * FROM products WHERE id = ?;"
        async with self.db.execute(sql, (product_id,)) as cursor:
            row = await cursor.fetchone()
            return self._row_to_product(row) if row else None

    async def get_product_by_slug(self, slug: str) -> Optional[Product]:
        """Get product by slug."""
        sql = "SELECT * FROM products WHERE slug = ?;"
        async with self.db.execute(sql, (slug,)) as cursor:
            row = await cursor.fetchone()
            return self._row_to_product(row) if row else None

    async def create_product(self, data: ProductCreate) -> Product:
        """Create a new product."""
        product = Product(
            name=data.name,
            slug=data.slug,
            tagline=data.tagline or "",
            description=data.description,
            value_proposition=data.value_proposition,
            pricing_tier=data.pricing_tier,
            target_industries=data.target_industries,
            key_features=data.key_features,
            is_active=data.is_active,
        )
        sql = """
        INSERT INTO products (
            id, name, slug, tagline, description, value_proposition,
            pricing_tier, target_industries_json, key_features_json,
            is_active, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);
        """
        await self.db.execute(
            sql,
            (
                product.id,
                product.name,
                product.slug,
                product.tagline,
                product.description,
                product.value_proposition,
                product.pricing_tier,
                json.dumps(product.target_industries),
                json.dumps(product.key_features),
                1 if product.is_active else 0,
                product.created_at.isoformat(),
                product.updated_at.isoformat(),
            ),
        )
        await self.db.commit()
        return product

    async def update_product(self, product_id: str, data: ProductUpdate) -> Optional[Product]:
        """Update an existing product."""
        product = await self.get_product_by_id(product_id)
        if not product:
            return None

        update_dict = data.model_dump(exclude_unset=True)
        if not update_dict:
            return product

        set_clauses = []
        params = []
        for key, val in update_dict.items():
            if key in ("target_industries", "key_features"):
                set_clauses.append(f"{key}_json = ?")
                params.append(json.dumps(val))
            elif key == "is_active":
                set_clauses.append("is_active = ?")
                params.append(1 if val else 0)
            else:
                set_clauses.append(f"{key} = ?")
                params.append(val)

        set_clauses.append("updated_at = CURRENT_TIMESTAMP")
        params.append(product_id)

        sql = f"UPDATE products SET {', '.join(set_clauses)} WHERE id = ?;"
        await self.db.execute(sql, params)
        await self.db.commit()
        return await self.get_product_by_id(product_id)

    async def delete_product(self, product_id: str) -> bool:
        """Delete product by ID."""
        sql = "DELETE FROM products WHERE id = ?;"
        cursor = await self.db.execute(sql, (product_id,))
        await self.db.commit()
        return cursor.rowcount > 0

    # ── Product ICP Methods ──

    async def list_icps_for_product(self, product_id: str) -> List[ProductICP]:
        """List all ICP definitions for a given product."""
        sql = "SELECT * FROM product_icps WHERE product_id = ? ORDER BY created_at DESC;"
        async with self.db.execute(sql, (product_id,)) as cursor:
            rows = await cursor.fetchall()
            return [self._row_to_icp(row) for row in rows]

    async def get_icp_by_id(self, icp_id: str) -> Optional[ProductICP]:
        """Get an ICP definition by ID."""
        sql = "SELECT * FROM product_icps WHERE id = ?;"
        async with self.db.execute(sql, (icp_id,)) as cursor:
            row = await cursor.fetchone()
            return self._row_to_icp(row) if row else None

    async def create_icp(self, data: ProductICPCreate) -> ProductICP:
        """Create a new ICP rule for a product."""
        icp = ProductICP(
            product_id=data.product_id,
            title=data.title,
            target_roles=data.target_roles,
            target_company_sizes=data.target_company_sizes,
            target_industries=data.target_industries,
            key_pain_points=data.key_pain_points,
            qualification_rules=data.qualification_rules,
            min_fit_score=data.min_fit_score,
        )
        sql = """
        INSERT INTO product_icps (
            id, product_id, title, target_roles_json, target_company_sizes_json,
            target_industries_json, key_pain_points_json, qualification_rules_json,
            min_fit_score, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);
        """
        await self.db.execute(
            sql,
            (
                icp.id,
                icp.product_id,
                icp.title,
                json.dumps(icp.target_roles),
                json.dumps(icp.target_company_sizes),
                json.dumps(icp.target_industries),
                json.dumps(icp.key_pain_points),
                json.dumps(icp.qualification_rules),
                icp.min_fit_score,
                icp.created_at.isoformat(),
                icp.updated_at.isoformat(),
            ),
        )
        await self.db.commit()
        return icp

    async def delete_icp(self, icp_id: str) -> bool:
        """Delete an ICP definition."""
        sql = "DELETE FROM product_icps WHERE id = ?;"
        cursor = await self.db.execute(sql, (icp_id,))
        await self.db.commit()
        return cursor.rowcount > 0
