import { apiGet, apiPatch, apiPost, apiPut } from '@/utils/http'

import type {
  BillingQuote,
  CustomerCreatePayload,
  CustomerDetail,
  CustomerGroup,
  CustomerGroupCreatePayload,
  CustomerGroupListResponse,
  CustomerGroupWithMembers,
  CustomerListResponse,
  CustomerQuery,
  CustomerStatus,
  ExternalCompanyListResponse,
} from './types'

export const fetchCustomers = (query: CustomerQuery) =>
  apiGet<CustomerListResponse>('/v1/customers', { params: query })

export const fetchCustomerDetail = (customerId: number) =>
  apiGet<CustomerDetail>(`/v1/customers/${customerId}`)

export const createCustomer = (payload: CustomerCreatePayload) =>
  apiPost<{ id: number }>('/v1/customers', payload)

export const updateCustomerStatus = (
  customerId: number,
  status: CustomerStatus,
) => apiPatch<void>(`/v1/customers/${customerId}/status`, { status })

export const searchExternalCompanies = (keyword: string) =>
  apiGet<ExternalCompanyListResponse>('/v1/external-companies', {
    params: { keyword },
  })

export const fetchCustomerGroups = () =>
  apiGet<CustomerGroupListResponse>('/v1/customer-groups')

export const fetchCustomerGroupDetail = (groupId: number) =>
  apiGet<CustomerGroupWithMembers>(`/v1/customer-groups/${groupId}`)

export const createCustomerGroup = (payload: CustomerGroupCreatePayload) =>
  apiPost<CustomerGroup>('/v1/customer-groups', payload)

export const replaceGroupMembers = (groupId: number, memberIds: number[]) =>
  apiPut<CustomerGroup>(`/v1/customer-groups/${groupId}/members`, {
    memberIds,
  })

export const fetchCustomerQuote = (customerId: number) =>
  apiGet<BillingQuote>(`/v1/customers/${customerId}/quote`)
