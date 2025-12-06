"""API v1 路由"""

from fastapi import APIRouter

from . import auth, health

router = APIRouter()

# 注册子路由
router.include_router(health.router, tags=["Health"])
router.include_router(auth.router, tags=["Auth"])

__all__ = ["router"]
