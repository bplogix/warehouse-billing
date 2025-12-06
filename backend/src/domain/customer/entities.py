from __future__ import annotations

from dataclasses import dataclass, field
from enum import Enum


class CustomerStatus(str, Enum):
    ACTIVE = "ACTIVE"
    INACTIVE = "INACTIVE"


@dataclass(slots=True)
class CompanyEntity:
    company_id: str
    company_name: str
    company_code: str
    source: str
    source_ref_id: str | None = None

    def validate_source_ref(self) -> None:
        if self.source != "INTERNAL" and not self.source_ref_id:
            msg = "external company must have source_ref_id"
            raise ValueError(msg)


@dataclass(slots=True)
class CustomerEntity:
    customer_name: str
    customer_code: str
    status: CustomerStatus
    company: CompanyEntity
    business_domain: str
    source: str
    source_ref_id: str | None = None
    bonded_license_no: str | None = None
    customs_code: str | None = None
    group_ids: list[int] = field(default_factory=list)

    def assign_to_group(self, group_id: int) -> None:
        if group_id not in self.group_ids:
            self.group_ids.append(group_id)

    def change_domain(self, new_domain: str) -> None:
        if not new_domain:
            msg = "business domain cannot be empty"
            raise ValueError(msg)
        self.business_domain = new_domain


@dataclass(slots=True)
class CustomerGroupEntity:
    name: str
    business_domain: str
    member_ids: list[int] = field(default_factory=list)
    max_member: int | None = None

    def replace_members(self, customer_ids: list[int]) -> None:
        if self.max_member is not None and len(customer_ids) > self.max_member:
            msg = "exceeds max member limit"
            raise ValueError(msg)
        self.member_ids = list(customer_ids)
