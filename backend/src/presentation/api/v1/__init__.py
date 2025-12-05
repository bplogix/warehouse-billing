"""API v1 路由"""

from fastapi import APIRouter

router = APIRouter(prefix="/api")

__all__ = ["router"]
