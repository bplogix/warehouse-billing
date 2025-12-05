"""健康检查路由"""

from fastapi import APIRouter

router = APIRouter()


@router.get("/health")
async def health_check():
    """健康检查"""
    return {"status": "healthy", "message": "Warehouse Billing API 运行正常"}
