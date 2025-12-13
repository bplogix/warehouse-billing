import { apiGet, apiPatch, apiPost, apiPut } from '@/utils/http'

import type {
  BillingQuote,
  CustomerCreatePayload,
  CustomerDetail,
  CustomerListResponse,
  CustomerQuery,
  CustomerStatus,
  ExternalCompanyListResponse,
  CustomerGroupListResponse,
  CustomerGroup,
  CustomerGroupCreatePayload,
  CustomerGroupWithMembers,
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

export const fetchCustomerGroups = () =>
  apiGet<CustomerGroupListResponse>('/api/v1/customer-groups')

export const fetchCustomerGroupDetail = (groupId: number) =>
  apiGet<CustomerGroupWithMembers>(`/api/v1/customer-groups/${groupId}`)

export const createCustomerGroup = (payload: CustomerGroupCreatePayload) =>
  apiPost<CustomerGroup>('/api/v1/customer-groups', payload)

export const replaceGroupMembers = (groupId: number, memberIds: number[]) =>
  apiPut<CustomerGroup>(`/api/v1/customer-groups/${groupId}/members`, {
    memberIds,
  })

export const fetchCustomerQuote = (customerId: number) =>
  apiGet<BillingQuote>(`/api/v1/customers/${customerId}/quote`)
