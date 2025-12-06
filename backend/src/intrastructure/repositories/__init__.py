"""Infrastructure repositories for domain aggregates."""

from .company_repository import CompanyRepository
from .customer_repository import CustomerRepository

__all__ = ["CompanyRepository", "CustomerRepository"]
