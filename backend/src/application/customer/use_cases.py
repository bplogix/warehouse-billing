from __future__ import annotations

from dataclasses import dataclass

from sqlalchemy.ext.asyncio import AsyncSession

from src.application.customer.commands import (
    CreateCompanyCommand,
    CreateCustomerCommand,
    QueryCustomersCommand,
    UpdateCustomerStatusCommand,
)
from src.application.customer.group_commands import (
    CreateCustomerGroupCommand,
    QueryExternalCompaniesCommand,
    ReplaceGroupMembersCommand,
)
from src.domain.customer import (
    BusinessDomainGuard,
    CompanyEntity,
    CustomerEntity,
    CustomerGroupEntity,
    CustomerImportService,
)
from src.intrastructure.database.external.company import RbCompanyInfo
from src.intrastructure.database.models import (
    Company,
    Customer,
    CustomerGroup,
    CustomerGroupMember,
    CustomerStatus as ORMCustStatus,
)
from src.intrastructure.repositories import CompanyRepository, CustomerGroupRepository, CustomerRepository
from src.intrastructure.repositories.external_company_repository import ExternalCompanyRepository
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
        allowed_domains = domain_guard.allowed_domains
        business_domain = customer_cmd.business_domain or (
            allowed_domains[0] if allowed_domains else BusinessDomainGuard.DEFAULT_DOMAIN
        )

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
            business_domain=business_domain,
            source=customer_cmd.source,
            status=customer_cmd.status,
            source_ref_id=customer_cmd.source_ref_id,
        )
        orm_status = ORMCustStatus(customer_entity.status.value)
        customer = Customer(
            customer_name=customer_entity.customer_name,
            customer_code=customer_entity.customer_code,
            status=orm_status,
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


@dataclass
class QueryCustomersResult:
    customers: list[Customer]
    total: int


class QueryCustomersUseCase:
    def __init__(self, session: AsyncSession) -> None:
        self._session = session

    async def execute(self, cmd: QueryCustomersCommand) -> QueryCustomersResult:
        repo = CustomerRepository(self._session)
        domain_guard = BusinessDomainGuard.from_context()
        domains = domain_guard.allowed_domains
        if not domains:
            return QueryCustomersResult(customers=[], total=0)

        if cmd.business_domain:
            domain_guard.ensure_access(cmd.business_domain)
            filter_domains = [cmd.business_domain]
        else:
            filter_domains = domains
        status_filter = ORMCustStatus(cmd.status.value) if cmd.status else None
        customers, total = await repo.search(
            keyword=cmd.keyword,
            business_domains=filter_domains,
            status=status_filter,
            source=cmd.source,
            limit=cmd.limit,
            offset=cmd.offset,
        )
        return QueryCustomersResult(customers=customers, total=total)


class GetCustomerDetailUseCase:
    def __init__(self, session: AsyncSession) -> None:
        self._session = session

    async def execute(self, customer_id: int) -> Customer | None:
        repo = CustomerRepository(self._session)
        customer = await repo.get_detail(customer_id)
        if customer is None:
            return None
        BusinessDomainGuard.from_context().ensure_access(customer.business_domain)
        return customer


class UpdateCustomerStatusUseCase:
    def __init__(self, session: AsyncSession) -> None:
        self._session = session

    async def execute(self, cmd: UpdateCustomerStatusCommand, operator: str) -> bool:
        repo = CustomerRepository(self._session)
        customer = await repo.get_by_id(cmd.customer_id)
        if customer is None:
            return False
        guard = BusinessDomainGuard.from_context()
        guard.ensure_access(customer.business_domain)
        orm_status = ORMCustStatus(cmd.status.value)
        await repo.update_status(cmd.customer_id, orm_status, operator=operator)
        return True


@dataclass
class ManageGroupResult:
    group: CustomerGroup


class ManageCustomerGroupUseCase:
    def __init__(self, session: AsyncSession) -> None:
        self._session = session

    async def create_group(
        self,
        cmd: CreateCustomerGroupCommand,
        operator: str,
    ) -> ManageGroupResult:
        repo = CustomerGroupRepository(self._session)
        guard = BusinessDomainGuard.from_context()
        guard.ensure_access(cmd.business_domain)
        group_entity = CustomerGroupEntity(name=cmd.name, business_domain=cmd.business_domain)
        group = CustomerGroup(name=group_entity.name, business_domain=group_entity.business_domain)
        group.created_by = operator
        group.description = cmd.description
        async with self._session.begin():
            await repo.add_group(group)
            if cmd.member_ids:
                members = [
                    CustomerGroupMember(group_id=group.id, customer_id=customer_id, business_domain=cmd.business_domain)
                    for customer_id in cmd.member_ids
                ]
                await repo.replace_members(group.id, members)
        return ManageGroupResult(group=group)

    async def replace_members(
        self,
        cmd: ReplaceGroupMembersCommand,
        operator: str,
    ) -> CustomerGroup | None:
        repo = CustomerGroupRepository(self._session)
        # 在显式事务中完成查询与写入，避免 autobegin 后再次 begin 触发重复事务错误
        async with self._session.begin():
            group = await repo.get_group(cmd.group_id)
            if group is None:
                return None
            guard = BusinessDomainGuard.from_context()
            guard.ensure_access(group.business_domain)
            members = [
                CustomerGroupMember(
                    group_id=cmd.group_id,
                    customer_id=customer_id,
                    business_domain=group.business_domain,
                    created_by=operator,
                )
                for customer_id in cmd.member_ids
            ]
            await repo.replace_members(cmd.group_id, members)
        return group


@dataclass
class CustomerGroupListItem:
    group: CustomerGroup
    member_ids: list[int]


@dataclass
class CustomerGroupListResult:
    groups: list[CustomerGroupListItem]


class QueryCustomerGroupsUseCase:
    def __init__(self, session: AsyncSession) -> None:
        self._session = session

    async def execute(self) -> CustomerGroupListResult:
        repo = CustomerGroupRepository(self._session)
        guard = BusinessDomainGuard.from_context()
        domains = guard.allowed_domains
        groups = await repo.list_groups_with_members(domains)
        items = [CustomerGroupListItem(group=g, member_ids=[m.customer_id for m in g.members]) for g in groups]
        return CustomerGroupListResult(groups=items)


class GetCustomerGroupDetailUseCase:
    def __init__(self, session: AsyncSession) -> None:
        self._session = session

    async def execute(self, group_id: int) -> CustomerGroupListItem | None:
        repo = CustomerGroupRepository(self._session)
        group = await repo.get_group_with_members(group_id)
        if group is None:
            return None
        BusinessDomainGuard.from_context().ensure_access(group.business_domain)
        return CustomerGroupListItem(group=group, member_ids=[m.customer_id for m in group.members])


@dataclass
class ExternalCompaniesResult:
    companies: list[RbCompanyInfo]
    total: int


class QueryExternalCompaniesUseCase:
    def __init__(self, session: AsyncSession) -> None:
        self._session = session

    async def execute(self, cmd: QueryExternalCompaniesCommand) -> ExternalCompaniesResult:
        repo = ExternalCompanyRepository(self._session)
        items, total = await repo.list_companies(keyword=cmd.keyword, limit=cmd.limit, offset=cmd.offset)
        return ExternalCompaniesResult(companies=items, total=total)
