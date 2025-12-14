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
} from './types'

export const fetchCarriers = (query?: CarrierQuery) =>
  apiGet<CarrierListResponse>('/api/v1/carriers', { params: query })

export const fetchCarrierDetail = (carrierId: number) =>
  apiGet<Carrier>(`/api/v1/carriers/${carrierId}`)

export const createCarrier = (payload: CarrierCreatePayload) =>
  apiPost<Carrier>('/api/v1/carriers', payload)

export const updateCarrier = (
  carrierId: number,
  payload: CarrierUpdatePayload,
) => apiPut<Carrier>(`/api/v1/carriers/${carrierId}`, payload)

export const fetchCarrierServices = (
  carrierId: number,
  query?: CarrierServiceQuery,
) =>
  apiGet<CarrierServiceListResponse>(`/api/v1/carriers/${carrierId}/services`, {
    params: query,
  })

export const createCarrierService = (
  carrierId: number,
  payload: CarrierServiceCreatePayload,
) => apiPost<CarrierService>(`/api/v1/carriers/${carrierId}/services`, payload)

export const updateCarrierService = (
  carrierId: number,
  serviceId: number,
  payload: CarrierServiceUpdatePayload,
) =>
  apiPut<CarrierService>(
    `/api/v1/carriers/${carrierId}/services/${serviceId}`,
    payload,
  )
