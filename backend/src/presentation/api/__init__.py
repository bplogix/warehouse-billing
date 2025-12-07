"""API v1 路由"""

from fastapi import APIRouter

from . import auth, customers, health

router = APIRouter()

# 注册子路由
router.include_router(health.router, tags=["Health"])
router.include_router(auth.router, tags=["Auth"])
router.include_router(customers.router, tags=["Customers"])
router.include_router(customers.group_router, tags=["CustomerGroups"])
router.include_router(customers.external_router, tags=["ExternalCompanies"])

__all__ = ["router"]
