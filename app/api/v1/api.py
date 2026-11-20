"""API v1 master router."""

from fastapi import APIRouter

from app.api.v1.agents import router as agents_router
from app.api.v1.business import router as business_router
from app.api.v1.discovery import router as discovery_router
from app.api.v1.health import router as health_router
from app.api.v1.icps import router as icps_router
from app.api.v1.models import router as models_router
from app.api.v1.outreach import router as outreach_router
from app.api.v1.products import router as products_router
from app.api.v1.prospects import router as prospects_router
from app.api.v1.replies import router as replies_router
from app.api.v1.research import router as research_router

api_router = APIRouter()
api_router.include_router(health_router)
api_router.include_router(products_router)
api_router.include_router(icps_router)
api_router.include_router(business_router)
api_router.include_router(models_router)
api_router.include_router(agents_router)
api_router.include_router(research_router)
api_router.include_router(prospects_router)
api_router.include_router(outreach_router)
api_router.include_router(replies_router)
api_router.include_router(discovery_router)
