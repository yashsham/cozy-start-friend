"""Product and ICP business logic services."""

from typing import List, Optional
import aiosqlite

from app.core.exceptions import DuplicateEntityError, EntityNotFoundError
from app.models.product import Product, ProductICP
from app.repositories.product_repository import ProductRepository
from app.schemas.product import ProductCreate, ProductICPCreate, ProductICPUpdate, ProductUpdate


class ProductService:
    def __init__(self, db: aiosqlite.Connection):
        self.repo = ProductRepository(db)

    async def list_products(self, active_only: bool = False) -> List[Product]:
        return await self.repo.list_products(active_only=active_only)

    async def get_product(self, product_id: str) -> Product:
        product = await self.repo.get_product_by_id(product_id)
        if not product:
            raise EntityNotFoundError(f"Product with id '{product_id}' not found.")
        return product

    async def create_product(self, data: ProductCreate) -> Product:
        existing = await self.repo.get_product_by_slug(data.slug)
        if existing:
            raise DuplicateEntityError(f"Product with slug '{data.slug}' already exists.")
        return await self.repo.create_product(data)

    async def update_product(self, product_id: str, data: ProductUpdate) -> Product:
        if data.slug:
            existing = await self.repo.get_product_by_slug(data.slug)
            if existing and existing.id != product_id:
                raise DuplicateEntityError(f"Product with slug '{data.slug}' already exists.")

        updated = await self.repo.update_product(product_id, data)
        if not updated:
            raise EntityNotFoundError(f"Product with id '{product_id}' not found.")
        return updated

    async def delete_product(self, product_id: str) -> None:
        deleted = await self.repo.delete_product(product_id)
        if not deleted:
            raise EntityNotFoundError(f"Product with id '{product_id}' not found.")

    # ── ICP Operations ──

    async def list_icps_for_product(self, product_id: str) -> List[ProductICP]:
        # Ensure product exists
        await self.get_product(product_id)
        return await self.repo.list_icps_for_product(product_id)

    async def create_icp(self, data: ProductICPCreate) -> ProductICP:
        await self.get_product(data.product_id)
        return await self.repo.create_icp(data)

    async def delete_icp(self, icp_id: str) -> None:
        deleted = await self.repo.delete_icp(icp_id)
        if not deleted:
            raise EntityNotFoundError(f"ICP with id '{icp_id}' not found.")
