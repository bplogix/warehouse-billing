"""
DDD 架构

标准的领域驱动设计分层:
- Presentation Layer (API 路由)
- Application Layer (用例编排)
- Domain Layer (业务逻辑)
- Infrastructure Layer (技术实现)
"""

from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.exceptions import RequestValidationError
from pydantic import ValidationError

from src.intrastructure.cache.redis import close_redis, init_redis
from src.intrastructure.database.mysql_external import external_mysql_db
from src.intrastructure.database.postgres import postgres_db
from src.presentation.api import router
from src.shared.config import settings
from src.shared.error.app_error import handle_validation_error
from src.shared.logger import setup_logging
from src.shared.logger.middlewares import RequestContextMiddleware
from src.shared.middlewares.cors import CORSHandleMiddleware
from src.shared.middlewares.exception import ExceptionHandlerMiddleware


@asynccontextmanager
async def lifespan(app: FastAPI):
    """应用生命周期管理"""

    # ⚡ [启动阶段] 初始化日志系统自动读取 settings.log.*
    setup_logging()

    try:
        # 启动时初始化
        await postgres_db.connect()
        await external_mysql_db.connect()
        await init_redis()
        yield
    finally:
        # 关闭时清理资源
        await external_mysql_db.dispose()
        await postgres_db.dispose()
        await close_redis()


# 创建 FastAPI 应用实例
app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    debug=settings.DEBUG,
    lifespan=lifespan,
)

# 添加异常处理中间件
app.add_exception_handler(RequestValidationError, handle_validation_error)
app.add_exception_handler(ValidationError, handle_validation_error)
app.add_middleware(ExceptionHandlerMiddleware)

# ⚡ middleware 必须在 app 实例创建后挂载
app.add_middleware(RequestContextMiddleware)

# 添加 CORS 中间件
app.add_middleware(CORSHandleMiddleware)

# 包含路由 - DDD 架构
app.include_router(router)
