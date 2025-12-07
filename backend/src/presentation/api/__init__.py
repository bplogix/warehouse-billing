"""API 路由"""

from fastapi import APIRouter

from . import health
from .v1 import v1_router

router = APIRouter(prefix="/api")

# 注册子路由
router.include_router(health.router, tags=["Health"])
router.include_router(v1_router)

__all__ = ["router"]
