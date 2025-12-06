from __future__ import annotations

from collections.abc import Iterable

from src.shared.logger.factories import app_logger

logger = app_logger.bind(component="auth_services")


class UserDomainMappingService:
    """根据钉钉角色映射业务域."""

    def __init__(self, mapping: dict[str, list[str]] | None = None) -> None:
        self._mapping = mapping or {}

    def map_roles(self, roles: Iterable[str]) -> list[str]:
        domains: list[str] = []
        for role in roles:
            matched = self._mapping.get(role, [])
            domains.extend(matched)
            if matched:
                logger.info("role mapped to domains", role=role, domains=matched)
        # 去重保持顺序
        seen: set[str] = set()
        unique = []
        for domain in domains:
            if domain not in seen:
                seen.add(domain)
                unique.append(domain)
        return unique
