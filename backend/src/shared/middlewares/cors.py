from fastapi.middleware.cors import CORSMiddleware

from src.shared.config import settings


class CORSHandleMiddleware:
    """可直接 app.add_middleware(CustomCORSMiddleware) 的 CORS 中间件"""

    def __init__(self, app):
        # 在这里把 CORS 包裹进去
        self.app = CORSMiddleware(
            app,
            allow_origins=settings.cors.CORS_ALLOWED_ORIGINS,
            allow_credentials=settings.cors.CORS_ALLOWED_CERDENTIALS,
            allow_methods=settings.cors.CORS_ALLOWED_METHODS,
            allow_headers=settings.cors.CORS_ALLOWED_HEADERS,
        )

    async def __call__(self, scope, receive, send):
        return await self.app(scope, receive, send)
