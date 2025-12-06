from __future__ import annotations

from dataclasses import dataclass

from sqlalchemy.ext.asyncio import AsyncSession

from src.application.customer.commands import CreateCompanyCommand, CreateCustomerCommand
from src.domain.customer import (
    BusinessDomainGuard,
    CompanyEntity,
    CustomerEntity,
    CustomerImportService,
)
from src.intrastructure.database.models import Company, Customer
from src.intrastructure.repositories import CompanyRepository, CustomerRepository
from src.shared.logger.factories import app_logger

logger = app_logger.bind(component="customer_use_cases")


@dataclass
class CreateCustomerResult:
    customer: Customer
    company: Company


class CreateCustomerUseCase:
    def __init__(self, session: AsyncSession) -> None:
        self._session = session

    async def execute(
        self,
        company_cmd: CreateCompanyCommand,
        customer_cmd: CreateCustomerCommand,
        operator: str,
    ) -> CreateCustomerResult:
        company_repo = CompanyRepository(self._session)
        customer_repo = CustomerRepository(self._session)
        domain_guard = BusinessDomainGuard.from_context()
        import_service = CustomerImportService(domain_guard)

        company_entity = CompanyEntity(
            company_id=company_cmd.company_code,
            company_name=company_cmd.company_name,
            company_code=company_cmd.company_code,
            source=company_cmd.source,
            source_ref_id=company_cmd.source_ref_id,
        )
        company_entity.validate_source_ref()
        company = Company(
            company_id=company_entity.company_id,
            company_name=company_entity.company_name,
            company_code=company_entity.company_code,
            company_corporation="",
            company_phone="",
            company_email="",
            company_address="",
            source=company_entity.source,
            source_ref_id=company_entity.source_ref_id,
        )
        company.created_by = operator

        customer_entity: CustomerEntity = import_service.create_customer(
            company=company_entity,
            customer_name=customer_cmd.customer_name,
            customer_code=customer_cmd.customer_code,
            business_domain=customer_cmd.business_domain,
            source=customer_cmd.source,
            status=customer_cmd.status,
            source_ref_id=customer_cmd.source_ref_id,
        )
        customer = Customer(
            customer_name=customer_entity.customer_name,
            customer_code=customer_entity.customer_code,
            status=customer_entity.status,
            company_id=company.company_id,
            business_domain=customer_entity.business_domain,
            source=customer_entity.source,
            source_ref_id=customer_entity.source_ref_id,
            address="",
            contact_email="",
            contact_person="",
            operation_name=operator,
            operation_uid=operator,
            bonded_license_no=customer_entity.bonded_license_no,
            customs_code=customer_entity.customs_code,
        )
        customer.created_by = operator

        async with self._session.begin():
            await company_repo.add(company)
            await customer_repo.add(customer)
        logger.info("customer created", customer_code=customer.customer_code)
        return CreateCustomerResult(customer=customer, company=company)
