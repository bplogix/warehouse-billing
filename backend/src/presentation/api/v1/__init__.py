"""API v1 路由"""

from fastapi import APIRouter

from . import auth, customers

v1_router = APIRouter(prefix="/v1")

# 注册子路由
v1_router.include_router(auth.router, tags=["Auth"])
v1_router.include_router(customers.router, tags=["Customers"])
v1_router.include_router(customers.group_router, tags=["CustomerGroups"])
v1_router.include_router(customers.external_router, tags=["ExternalCompanies"])

# __all__ = ["router"]
