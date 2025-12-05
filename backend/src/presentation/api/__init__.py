"""API v1 路由"""

from fastapi import APIRouter

from . import health

router = APIRouter()

# 注册子路由
router.include_router(health.router, tags=["Health"])

__all__ = ["router"]
