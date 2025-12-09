"""API v1 路由"""

from fastapi import APIRouter

from . import auth, billing_templates, customers

v1_router = APIRouter(prefix="/v1")

# 注册子路由
v1_router.include_router(auth.router, tags=["Auth"])
v1_router.include_router(customers.router, tags=["Customers"])
v1_router.include_router(customers.group_router, tags=["CustomerGroups"])
v1_router.include_router(customers.external_router, tags=["ExternalCompanies"])
v1_router.include_router(billing_templates.router, tags=["BillingTemplates"])
v1_router.include_router(billing_templates.quote_router, tags=["BillingQuotes"])

# __all__ = ["router"]
