import { apiGet, apiPatch, apiPost } from '@/utils/http'

import type {
  CustomerCreatePayload,
  CustomerDetail,
  CustomerListResponse,
  CustomerQuery,
  CustomerStatus,
  ExternalCompanyListResponse,
} from './types'

export const fetchCustomers = (query: CustomerQuery) =>
  apiGet<CustomerListResponse>('/api/v1/customers', { params: query })

export const fetchCustomerDetail = (customerId: number) =>
  apiGet<CustomerDetail>(`/api/v1/customers/${customerId}`)

export const createCustomer = (payload: CustomerCreatePayload) =>
  apiPost<{ id: number }>('/api/v1/customers', payload)

export const updateCustomerStatus = (
  customerId: number,
  status: CustomerStatus,
) => apiPatch<void>(`/api/v1/customers/${customerId}/status`, { status })

export const searchExternalCompanies = (keyword: string) =>
  apiGet<ExternalCompanyListResponse>('/api/v1/external-companies', {
    params: { keyword },
  })
