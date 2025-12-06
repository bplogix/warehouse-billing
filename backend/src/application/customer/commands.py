from __future__ import annotations

from dataclasses import dataclass

from src.domain.customer import CustomerStatus


@dataclass(slots=True)
class CreateCompanyCommand:
    company_name: str
    company_code: str
    source: str
    source_ref_id: str | None = None


@dataclass(slots=True)
class CreateCustomerCommand:
    customer_name: str
    customer_code: str
    business_domain: str
    source: str
    status: CustomerStatus = CustomerStatus.ACTIVE
    source_ref_id: str | None = None
    bonded_license_no: str | None = None
    customs_code: str | None = None
