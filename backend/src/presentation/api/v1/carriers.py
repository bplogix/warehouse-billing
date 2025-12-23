from __future__ import annotations

from fastapi import APIRouter, Depends, Query, status

from src.application.carrier.commands import (
    AssignGeoGroupRegionsCommand,
    CarrierServiceTariffRowInput,
    CreateCarrierCommand,
    CreateCarrierServiceCommand,
    CreateGeoGroupCommand,
    QueryCarriersCommand,
    QueryCarrierServicesCommand,
    SetCarrierServiceTariffsCommand,
    UpdateCarrierCommand,
    UpdateCarrierServiceCommand,
    UpdateGeoGroupCommand,
)
from src.application.carrier.exceptions import (
    CarrierAlreadyExistsError,
    CarrierNotFoundError,
    CarrierServiceAlreadyExistsError,
    CarrierServiceGeoGroupConflictError,
    CarrierServiceGeoGroupNotFoundError,
    CarrierServiceNotFoundError,
    RegionNotFoundError,
)
from src.application.carrier.use_cases import (
    AssignGeoGroupRegionsUseCase,
    CreateCarrierServiceUseCase,
    CreateCarrierUseCase,
    CreateGeoGroupUseCase,
    GetCarrierDetailUseCase,
    GetCarrierServiceDetailUseCase,
    GetGeoGroupDetailUseCase,
    ListGeoGroupsUseCase,
    QueryCarrierServicesUseCase,
    QueryCarriersUseCase,
    SetCarrierServiceTariffsUseCase,
    UpdateCarrierServiceUseCase,
    UpdateCarrierUseCase,
    UpdateGeoGroupUseCase,
)
from src.intrastructure.database.models import CarrierServiceStatus, CarrierStatus
from src.presentation.dependencies.auth import get_current_user
from src.presentation.dependencies.carrier import (
    get_assign_geo_group_regions_use_case,
    get_carrier_detail_use_case,
    get_carrier_service_detail_use_case,
    get_create_carrier_service_use_case,
    get_create_carrier_use_case,
    get_create_geo_group_use_case,
    get_geo_group_detail_use_case,
    get_list_geo_groups_use_case,
    get_query_carrier_services_use_case,
    get_query_carriers_use_case,
    get_set_carrier_service_tariffs_use_case,
    get_update_carrier_service_use_case,
    get_update_carrier_use_case,
    get_update_geo_group_use_case,
)
from src.presentation.schema.carrier import (
    CarrierCreateSchema,
    CarrierListResponse,
    CarrierSchema,
    CarrierServiceCreateSchema,
    CarrierServiceListResponse,
    CarrierServiceSchema,
    CarrierServiceTariffSnapshotSchema,
    CarrierServiceTariffUpsertSchema,
    CarrierServiceUpdateSchema,
    CarrierUpdateSchema,
    GeoGroupCreateSchema,
    GeoGroupListResponse,
    GeoGroupRegionUpdateSchema,
    GeoGroupSchema,
    GeoGroupUpdateSchema,
)
from src.shared.error.app_error import AppError
from src.shared.schemas.auth import CurrentUser
from src.shared.schemas.response import SuccessResponse

router = APIRouter(prefix="/carriers", tags=["Carriers"])


@router.post("", response_model=SuccessResponse[CarrierSchema], status_code=status.HTTP_201_CREATED)
async def create_carrier(
    payload: CarrierCreateSchema,
    current_user: CurrentUser = Depends(get_current_user),
    use_case: CreateCarrierUseCase = Depends(get_create_carrier_use_case),
) -> SuccessResponse[CarrierSchema]:
    cmd = CreateCarrierCommand(
        carrier_code=payload.carrier_code,
        carrier_name=payload.carrier_name,
        country_code=payload.country_code,
        status=payload.status,
        description=payload.description,
        contact_email=payload.contact_email,
        contact_phone=payload.contact_phone,
        website=payload.website,
        attributes=payload.attributes,
    )
    try:
        carrier = await use_case.execute(cmd, operator=current_user.user_id)
    except CarrierAlreadyExistsError as exc:
        raise AppError(message=str(exc), code=status.HTTP_400_BAD_REQUEST) from exc
    return SuccessResponse(data=CarrierSchema.from_model(carrier))


@router.put("/{carrier_id}", response_model=SuccessResponse[CarrierSchema])
async def update_carrier(
    carrier_id: int,
    payload: CarrierUpdateSchema,
    current_user: CurrentUser = Depends(get_current_user),
    use_case: UpdateCarrierUseCase = Depends(get_update_carrier_use_case),
) -> SuccessResponse[CarrierSchema]:
    cmd = UpdateCarrierCommand(
        carrier_id=carrier_id,
        carrier_name=payload.carrier_name,
        country_code=payload.country_code,
        status=payload.status,
        description=payload.description,
        contact_email=payload.contact_email,
        contact_phone=payload.contact_phone,
        website=payload.website,
        attributes=payload.attributes,
    )
    carrier = await use_case.execute(cmd, operator=current_user.user_id)
    if carrier is None:
        raise AppError(message="Carrier not found", code=status.HTTP_404_NOT_FOUND)
    return SuccessResponse(data=CarrierSchema.from_model(carrier))


@router.get("", response_model=SuccessResponse[CarrierListResponse])
async def list_carriers(
    keyword: str | None = Query(default=None),
    status_filter: CarrierStatus | None = Query(default=None, alias="status"),
    limit: int = Query(default=20, ge=1, le=100),
    offset: int = Query(default=0, ge=0),
    use_case: QueryCarriersUseCase = Depends(get_query_carriers_use_case),
) -> SuccessResponse[CarrierListResponse]:
    cmd = QueryCarriersCommand(keyword=keyword, status=status_filter, limit=limit, offset=offset)
    result = await use_case.execute(cmd)
    items = [CarrierSchema.from_model(carrier) for carrier in result.items]
    return SuccessResponse(data=CarrierListResponse(total=result.total, items=items))


@router.get("/{carrier_id}", response_model=SuccessResponse[CarrierSchema])
async def get_carrier_detail(
    carrier_id: int,
    use_case: GetCarrierDetailUseCase = Depends(get_carrier_detail_use_case),
) -> SuccessResponse[CarrierSchema]:
    carrier = await use_case.execute(carrier_id)
    if carrier is None:
        raise AppError(message="Carrier not found", code=status.HTTP_404_NOT_FOUND)
    return SuccessResponse(data=CarrierSchema.from_model(carrier))


@router.post(
    "/{carrier_id}/services",
    response_model=SuccessResponse[CarrierServiceSchema],
    status_code=status.HTTP_201_CREATED,
)
async def create_carrier_service(
    carrier_id: int,
    payload: CarrierServiceCreateSchema,
    current_user: CurrentUser = Depends(get_current_user),
    use_case: CreateCarrierServiceUseCase = Depends(get_create_carrier_service_use_case),
) -> SuccessResponse[CarrierServiceSchema]:
    cmd = CreateCarrierServiceCommand(
        carrier_id=carrier_id,
        service_code=payload.service_code,
        service_name=payload.service_name,
        status=payload.status,
        description=payload.description,
        attributes=payload.attributes,
    )
    try:
        service = await use_case.execute(cmd, operator=current_user.user_id)
    except CarrierNotFoundError as exc:
        raise AppError(message=str(exc), code=status.HTTP_404_NOT_FOUND) from exc
    except CarrierServiceAlreadyExistsError as exc:
        raise AppError(message=str(exc), code=status.HTTP_400_BAD_REQUEST) from exc
    return SuccessResponse(data=CarrierServiceSchema.from_model(service))


@router.put(
    "/{carrier_id}/services/{service_id}",
    response_model=SuccessResponse[CarrierServiceSchema],
)
async def update_carrier_service(
    carrier_id: int,
    service_id: int,
    payload: CarrierServiceUpdateSchema,
    current_user: CurrentUser = Depends(get_current_user),
    use_case: UpdateCarrierServiceUseCase = Depends(get_update_carrier_service_use_case),
) -> SuccessResponse[CarrierServiceSchema]:
    cmd = UpdateCarrierServiceCommand(
        service_id=service_id,
        carrier_id=carrier_id,
        service_name=payload.service_name,
        status=payload.status,
        description=payload.description,
        attributes=payload.attributes,
    )
    service = await use_case.execute(cmd, operator=current_user.user_id)
    if service is None:
        raise AppError(message="Carrier service not found", code=status.HTTP_404_NOT_FOUND)
    return SuccessResponse(data=CarrierServiceSchema.from_model(service))


@router.post(
    "/{carrier_id}/services/{service_id}/tariffs",
    response_model=SuccessResponse[CarrierServiceTariffSnapshotSchema],
    status_code=status.HTTP_201_CREATED,
)
async def upsert_carrier_service_tariffs(
    carrier_id: int,
    service_id: int,
    payload: CarrierServiceTariffUpsertSchema,
    current_user: CurrentUser = Depends(get_current_user),
    use_case: SetCarrierServiceTariffsUseCase = Depends(get_set_carrier_service_tariffs_use_case),
) -> SuccessResponse[CarrierServiceTariffSnapshotSchema]:
    cmd = SetCarrierServiceTariffsCommand(
        carrier_id=carrier_id,
        service_id=service_id,
        geo_group_id=payload.geo_group_id,
        effective_from=payload.effective_from,
        effective_to=payload.effective_to,
        rows=[
            CarrierServiceTariffRowInput(
                weight_max_kg=row.weight_max_kg,
                volume_max_cm3=row.volume_max_cm3,
                girth_max_cm=row.girth_max_cm,
                price_amount=row.price_amount,
            )
            for row in payload.rows
        ],
    )
    try:
        snapshot = await use_case.execute(cmd, operator=current_user.user_id)
    except CarrierServiceNotFoundError as exc:
        raise AppError(message=str(exc), code=status.HTTP_404_NOT_FOUND) from exc
    except CarrierServiceGeoGroupNotFoundError as exc:
        raise AppError(message=str(exc), code=status.HTTP_404_NOT_FOUND) from exc
    except RegionNotFoundError as exc:
        raise AppError(message=str(exc), code=status.HTTP_400_BAD_REQUEST) from exc
    return SuccessResponse(data=CarrierServiceTariffSnapshotSchema.from_model(snapshot))


@router.get(
    "/{carrier_id}/services",
    response_model=SuccessResponse[CarrierServiceListResponse],
)
async def list_carrier_services(
    carrier_id: int,
    status_filter: CarrierServiceStatus | None = Query(default=None, alias="status"),
    limit: int = Query(default=20, ge=1, le=100),
    offset: int = Query(default=0, ge=0),
    use_case: QueryCarrierServicesUseCase = Depends(get_query_carrier_services_use_case),
) -> SuccessResponse[CarrierServiceListResponse]:
    cmd = QueryCarrierServicesCommand(
        carrier_id=carrier_id,
        status=status_filter,
        limit=limit,
        offset=offset,
    )
    result = await use_case.execute(cmd)
    items = [CarrierServiceSchema.from_model(item) for item in result.items]
    return SuccessResponse(data=CarrierServiceListResponse(total=result.total, items=items))


@router.get(
    "/{carrier_id}/services/{service_id}",
    response_model=SuccessResponse[CarrierServiceSchema],
)
async def get_carrier_service_detail(
    carrier_id: int,
    service_id: int,
    use_case: GetCarrierServiceDetailUseCase = Depends(get_carrier_service_detail_use_case),
) -> SuccessResponse[CarrierServiceSchema]:
    service = await use_case.execute(carrier_id, service_id)
    if service is None:
        raise AppError(message="Carrier service not found", code=status.HTTP_404_NOT_FOUND)
    return SuccessResponse(data=CarrierServiceSchema.from_model(service))


@router.post(
    "/{carrier_id}/services/{service_id}/geo-groups",
    response_model=SuccessResponse[GeoGroupSchema],
    status_code=status.HTTP_201_CREATED,
)
async def create_geo_group(
    carrier_id: int,
    service_id: int,
    payload: GeoGroupCreateSchema,
    current_user: CurrentUser = Depends(get_current_user),
    use_case: CreateGeoGroupUseCase = Depends(get_create_geo_group_use_case),
) -> SuccessResponse[GeoGroupSchema]:
    cmd = CreateGeoGroupCommand(
        carrier_id=carrier_id,
        carrier_service_id=service_id,
        group_code=payload.group_code,
        group_name=payload.group_name,
        status=payload.status,
        description=payload.description,
        attributes=payload.attributes,
    )
    try:
        group = await use_case.execute(cmd, operator=current_user.user_id)
    except CarrierServiceNotFoundError as exc:
        raise AppError(message=str(exc), code=status.HTTP_404_NOT_FOUND) from exc
    except CarrierServiceGeoGroupConflictError as exc:
        raise AppError(message=str(exc), code=status.HTTP_400_BAD_REQUEST) from exc
    return SuccessResponse(data=GeoGroupSchema.from_model(group))


@router.put(
    "/{carrier_id}/services/{service_id}/geo-groups/{group_id}",
    response_model=SuccessResponse[GeoGroupSchema],
)
async def update_geo_group(
    carrier_id: int,
    service_id: int,
    group_id: int,
    payload: GeoGroupUpdateSchema,
    current_user: CurrentUser = Depends(get_current_user),
    use_case: UpdateGeoGroupUseCase = Depends(get_update_geo_group_use_case),
) -> SuccessResponse[GeoGroupSchema]:
    cmd = UpdateGeoGroupCommand(
        group_id=group_id,
        carrier_id=carrier_id,
        carrier_service_id=service_id,
        group_name=payload.group_name,
        status=payload.status,
        description=payload.description,
        attributes=payload.attributes,
    )
    try:
        group = await use_case.execute(cmd, operator=current_user.user_id)
    except CarrierServiceGeoGroupConflictError as exc:
        raise AppError(message=str(exc), code=status.HTTP_400_BAD_REQUEST) from exc
    if group is None:
        raise AppError(message="Geo group not found", code=status.HTTP_404_NOT_FOUND)
    return SuccessResponse(data=GeoGroupSchema.from_model(group))


@router.get(
    "/{carrier_id}/services/{service_id}/geo-groups",
    response_model=SuccessResponse[GeoGroupListResponse],
)
async def list_geo_groups(
    carrier_id: int,
    service_id: int,
    use_case: ListGeoGroupsUseCase = Depends(get_list_geo_groups_use_case),
) -> SuccessResponse[GeoGroupListResponse]:
    try:
        groups = await use_case.execute(carrier_id=carrier_id, service_id=service_id)
    except CarrierServiceNotFoundError as exc:
        raise AppError(message=str(exc), code=status.HTTP_404_NOT_FOUND) from exc
    items = [GeoGroupSchema.from_model(group) for group in groups]
    return SuccessResponse(data=GeoGroupListResponse(items=items))


@router.get(
    "/{carrier_id}/services/{service_id}/geo-groups/{group_id}",
    response_model=SuccessResponse[GeoGroupSchema],
)
async def get_geo_group_detail(
    carrier_id: int,
    service_id: int,
    group_id: int,
    use_case: GetGeoGroupDetailUseCase = Depends(get_geo_group_detail_use_case),
) -> SuccessResponse[GeoGroupSchema]:
    group = await use_case.execute(carrier_id=carrier_id, service_id=service_id, group_id=group_id)
    if group is None:
        raise AppError(message="Geo group not found", code=status.HTTP_404_NOT_FOUND)
    return SuccessResponse(data=GeoGroupSchema.from_model(group))


@router.put(
    "/{carrier_id}/services/{service_id}/geo-groups/{group_id}/regions",
    response_model=SuccessResponse[GeoGroupSchema],
)
async def assign_geo_group_regions(
    carrier_id: int,
    service_id: int,
    group_id: int,
    payload: GeoGroupRegionUpdateSchema,
    current_user: CurrentUser = Depends(get_current_user),
    use_case: AssignGeoGroupRegionsUseCase = Depends(get_assign_geo_group_regions_use_case),
) -> SuccessResponse[GeoGroupSchema]:
    cmd = AssignGeoGroupRegionsCommand(
        group_id=group_id,
        carrier_id=carrier_id,
        carrier_service_id=service_id,
        region_codes=payload.region_codes,
    )
    try:
        group = await use_case.execute(cmd, operator=current_user.user_id)
    except (CarrierServiceGeoGroupNotFoundError, CarrierServiceNotFoundError) as exc:
        raise AppError(message=str(exc), code=status.HTTP_404_NOT_FOUND) from exc
    except RegionNotFoundError as exc:
        raise AppError(message=str(exc), code=status.HTTP_400_BAD_REQUEST) from exc
    return SuccessResponse(data=GeoGroupSchema.from_model(group))
