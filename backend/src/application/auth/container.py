from __future__ import annotations

from functools import lru_cache

from src.application.auth.qr_login_service import DingTalkQrLoginService
from src.application.auth.services import UserDomainMappingService
from src.application.auth.use_cases import AuthenticateUserUseCase, AuthorizeRequestService, RefreshTokenUseCase
from src.intrastructure.auth import MockDingTalkAuthGateway, RealDingTalkAuthGateway, TokenService
from src.intrastructure.cache.dingtalk_qr_state import DingTalkQrStateRepository
from src.shared.config import settings


@lru_cache
def get_token_service() -> TokenService:
    return TokenService()


@lru_cache
def get_dingtalk_gateway():
    if settings.dingtalk.AUTH_MOCK:
        return MockDingTalkAuthGateway()
    return RealDingTalkAuthGateway()


@lru_cache
def get_qr_state_repository() -> DingTalkQrStateRepository:
    return DingTalkQrStateRepository()


@lru_cache
def get_domain_mapping_service() -> UserDomainMappingService:
    return UserDomainMappingService(settings.dingtalk.ROLE_DOMAIN_MAPPING)


@lru_cache
def get_authenticate_user_use_case() -> AuthenticateUserUseCase:
    return AuthenticateUserUseCase(
        gateway=get_dingtalk_gateway(),
        token_service=get_token_service(),
        domain_mapping=get_domain_mapping_service(),
    )


@lru_cache
def get_authorize_request_service() -> AuthorizeRequestService:
    return AuthorizeRequestService(token_service=get_token_service())


@lru_cache
def get_dingtalk_qr_login_service() -> DingTalkQrLoginService:
    return DingTalkQrLoginService(qr_state_repo=get_qr_state_repository(), gateway=get_dingtalk_gateway())


@lru_cache
def get_refresh_token_use_case() -> RefreshTokenUseCase:
    return RefreshTokenUseCase(token_service=get_token_service())
