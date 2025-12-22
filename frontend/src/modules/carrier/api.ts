import { apiGet, apiPost, apiPut } from '@/utils/http'

import type {
  Carrier,
  CarrierCreatePayload,
  CarrierListResponse,
  CarrierQuery,
  CarrierService,
  CarrierServiceCreatePayload,
  CarrierServiceListResponse,
  CarrierServiceQuery,
  CarrierServiceUpdatePayload,
  CarrierUpdatePayload,
  GeoGroup,
  GeoGroupCreatePayload,
  GeoGroupRegionUpdatePayload,
  RegionListResponse,
  RegionQuery,
} from './types'

export const fetchCarriers = (query?: CarrierQuery) =>
  apiGet<CarrierListResponse>('/v1/carriers', { params: query })

export const fetchCarrierDetail = (carrierId: number) =>
  apiGet<Carrier>(`/v1/carriers/${carrierId}`)

export const createCarrier = (payload: CarrierCreatePayload) =>
  apiPost<Carrier>('/v1/carriers', payload)

export const updateCarrier = (
  carrierId: number,
  payload: CarrierUpdatePayload,
) => apiPut<Carrier>(`/v1/carriers/${carrierId}`, payload)

export const fetchCarrierServices = (
  carrierId: number,
  query?: CarrierServiceQuery,
) =>
  apiGet<CarrierServiceListResponse>(`/v1/carriers/${carrierId}/services`, {
    params: query,
  })

export const createCarrierService = (
  carrierId: number,
  payload: CarrierServiceCreatePayload,
) => apiPost<CarrierService>(`/v1/carriers/${carrierId}/services`, payload)

export const updateCarrierService = (
  carrierId: number,
  serviceId: number,
  payload: CarrierServiceUpdatePayload,
) =>
  apiPut<CarrierService>(
    `/v1/carriers/${carrierId}/services/${serviceId}`,
    payload,
  )

export const fetchRegions = (query?: RegionQuery) =>
  apiGet<RegionListResponse>('/v1/regions', { params: query })

export const createGeoGroup = (
  carrierId: number,
  serviceId: number,
  payload: GeoGroupCreatePayload,
) =>
  apiPost<GeoGroup>(
    `/v1/carriers/${carrierId}/services/${serviceId}/geo-groups`,
    payload,
  )

export const assignGeoGroupRegions = (
  carrierId: number,
  serviceId: number,
  groupId: number,
  payload: GeoGroupRegionUpdatePayload,
) =>
  apiPut<GeoGroup>(
    `/v1/carriers/${carrierId}/services/${serviceId}/geo-groups/${groupId}/regions`,
    payload,
  )
