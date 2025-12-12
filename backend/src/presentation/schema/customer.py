from __future__ import annotations

import re

from pydantic import Field, field_validator

from src.domain.customer import CustomerStatus
from src.intrastructure.database.external.company import RbCompanyInfo
from src.intrastructure.database.models import Company, Customer, CustomerGroup
from src.presentation.schema.base import CamelModel


class CompanyCreateSchema(CamelModel):
    company_name: str = Field(..., alias="name")
    company_code: str = Field(..., alias="code")
    source: str = "INTERNAL"
    source_ref_id: str | None = Field(default=None, alias="sourceRefId")

    model_config = CamelModel.model_config

    @field_validator("company_name")
    @classmethod
    def validate_company_name(cls, value: str) -> str:
        if any(char.isdigit() for char in value):
            raise ValueError("company_name must not contain digits")
        return value

    @field_validator("company_code")
    @classmethod
    def validate_company_code(cls, value: str) -> str:
        code_pattern = re.compile(r"^[A-Z0-9]+(?:-[A-Z0-9]+)*$")
        if not code_pattern.fullmatch(value):
            raise ValueError("company_code must contain only uppercase letters, digits, and internal hyphens")
        return value


class CustomerCreateSchema(CamelModel):
    customer_name: str = Field(..., alias="name")
    customer_code: str = Field(..., alias="code")
    business_domain: str = Field(default="WAREHOUSE", alias="businessDomain")
    source: str = "INTERNAL"
    status: CustomerStatus = CustomerStatus.ACTIVE
    source_ref_id: str | None = Field(default=None, alias="sourceRefId")
    bonded_license_no: str | None = Field(default=None, alias="bondedLicenseNo")
    customs_code: str | None = Field(default=None, alias="customsCode")

    model_config = CamelModel.model_config

    @field_validator("customer_name")
    @classmethod
    def validate_customer_name(cls, value: str) -> str:
        if any(char.isdigit() for char in value):
            raise ValueError("customer_name must not contain digits")
        return value

    @field_validator("customer_code")
    @classmethod
    def validate_customer_code(cls, value: str) -> str:
        code_pattern = re.compile(r"^WS-\d+$")
        if not code_pattern.fullmatch(value):
            raise ValueError("customer_code must start with 'WS-' followed by digits")
        return value


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
        groups = [member.group_id for member in model.groups]
        data.update({"company": company, "groups": groups})
        return cls(**data)


class CustomerGroupCreateSchema(CamelModel):
    name: str
    business_domain: str = Field(alias="businessDomain")
    description: str | None = None
    member_ids: list[int] | None = Field(default=None, alias="memberIds")


class CustomerGroupResponse(CamelModel):
    id: int
    name: str
    business_domain: str = Field(alias="businessDomain")
    description: str | None = None

    @classmethod
    def from_model(cls, model: CustomerGroup) -> CustomerGroupResponse:
        return cls(id=model.id, name=model.name, businessDomain=model.business_domain, description=model.description)


class CustomerGroupMembersSchema(CamelModel):
    member_ids: list[int] = Field(alias="memberIds")


class CustomerGroupWithMembersResponse(CustomerGroupResponse):
    member_ids: list[int] = Field(default_factory=list, alias="memberIds")

    @classmethod
    def from_model(cls, model: CustomerGroup) -> CustomerGroupWithMembersResponse:
        member_ids = [member.customer_id for member in model.members]
        data = CustomerGroupResponse.from_model(model).model_dump()
        data.update({"memberIds": member_ids})
        return cls(**data)


class CustomerGroupListResponse(CamelModel):
    items: list[CustomerGroupWithMembersResponse]


class ExternalCompanyResponse(CamelModel):
    company_id: str = Field(alias="companyId")
    company_name: str = Field(alias="companyName")
    company_code: str | None = Field(alias="companyCode")

    @classmethod
    def from_model(cls, model: RbCompanyInfo) -> ExternalCompanyResponse:
        return cls(companyId=model.COMPANY_ID, companyName=model.COMPANY_NAME, companyCode=model.COMPANY_CODE)


class ExternalCompanyListResponse(CamelModel):
    total: int
    items: list[ExternalCompanyResponse]


class CustomerStatusUpdateSchema(CamelModel):
    status: CustomerStatus
