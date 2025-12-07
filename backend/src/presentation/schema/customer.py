from __future__ import annotations

from collections.abc import Sequence

from pydantic import Field

from src.domain.customer import CustomerStatus
from src.intrastructure.database.models import Company, Customer, CustomerGroupMember
from src.presentation.schema.base import CamelModel


class CompanyCreateSchema(CamelModel):
    company_name: str = Field(..., alias="name")
    company_code: str = Field(..., alias="code")
    source: str = "INTERNAL"
    source_ref_id: str | None = Field(default=None, alias="sourceRefId")

    model_config = CamelModel.model_config


class CustomerCreateSchema(CamelModel):
    customer_name: str = Field(..., alias="name")
    customer_code: str = Field(..., alias="code")
    business_domain: str = Field(..., alias="businessDomain")
    source: str = "INTERNAL"
    status: CustomerStatus = CustomerStatus.ACTIVE
    source_ref_id: str | None = Field(default=None, alias="sourceRefId")
    bonded_license_no: str | None = Field(default=None, alias="bondedLicenseNo")
    customs_code: str | None = Field(default=None, alias="customsCode")

    model_config = CamelModel.model_config


class CustomerCreateRequest(CamelModel):
    company: CompanyCreateSchema
    customer: CustomerCreateSchema


class CustomerResponse(CamelModel):
    id: int
    customer_name: str = Field(alias="customerName")
    customer_code: str = Field(alias="customerCode")
    business_domain: str = Field(alias="businessDomain")
    source: str

    @classmethod
    def from_model(cls, model: Customer) -> CustomerResponse:
        return cls(
            id=model.id,
            customerName=model.customer_name,
            customerCode=model.customer_code,
            businessDomain=model.business_domain,
            source=model.source,
        )


class CustomerListResponse(CamelModel):
    total: int
    items: list[CustomerResponse]


class CompanySummary(CamelModel):
    company_id: str = Field(alias="companyId")
    company_name: str = Field(alias="companyName")
    company_code: str = Field(alias="companyCode")

    @classmethod
    def from_model(cls, model: Company) -> CompanySummary:
        return cls(companyId=model.company_id, companyName=model.company_name, companyCode=model.company_code)


class CustomerDetailResponse(CustomerResponse):
    company: CompanySummary | None = None
    groups: list[int] = Field(default_factory=list)

    @classmethod
    def from_model(cls, model: Customer) -> CustomerDetailResponse:
        data = CustomerResponse.from_model(model).model_dump()
        company = CompanySummary.from_model(model.company) if model.company else None
        group_members: Sequence[CustomerGroupMember] = getattr(model, "groups", [])
        groups = [member.group_id for member in group_members]
        data.update({"company": company, "groups": groups})
        return cls(**data)


class CustomerStatusUpdateSchema(CamelModel):
    status: CustomerStatus
