from __future__ import annotations

from collections.abc import Sequence

from src.shared.context import get_current_user_context
from src.shared.logger.factories import domain_logger

from .entities import CompanyEntity, CustomerEntity, CustomerStatus

logger = domain_logger.bind(component="customer_domain")


class BusinessDomainGuard:
    """Validate whether current user can access given business domains."""

    def __init__(self, allowed_domains: Sequence[str]) -> None:
        self._allowed = set(allowed_domains)

    def ensure_access(self, domain: str) -> None:
        if domain not in self._allowed:
            logger.warning("domain access denied", domain=domain)
            raise PermissionError(f"domain {domain} not allowed")

    @classmethod
    def from_context(cls) -> BusinessDomainGuard:
        ctx = get_current_user_context()
        domains = ctx.domain_codes if ctx else []
        return cls(domains)


class CustomerImportService:
    """Normalize external payloads into CustomerEntity."""

    def __init__(self, domain_guard: BusinessDomainGuard) -> None:
        self._guard = domain_guard

    def create_customer(
        self,
        company: CompanyEntity,
        customer_name: str,
        customer_code: str,
        business_domain: str,
        source: str,
        status: CustomerStatus = CustomerStatus.ACTIVE,
        source_ref_id: str | None = None,
    ) -> CustomerEntity:
        company.validate_source_ref()
        self._guard.ensure_access(business_domain)
        return CustomerEntity(
            customer_name=customer_name,
            customer_code=customer_code,
            status=status,
            company=company,
            business_domain=business_domain,
            source=source,
            source_ref_id=source_ref_id,
        )
