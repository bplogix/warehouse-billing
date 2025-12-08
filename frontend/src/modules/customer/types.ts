import type { CustomerSource } from '@/constants/common'

export type CustomerStatus = 'ACTIVE' | 'INACTIVE'

export interface ExternalCompany {
  companyId: string
  companyName: string
  companyCode: string | null
}

export interface ExternalCompanyListResponse {
  total: number
  items: ExternalCompany[]
}

export interface CustomerListItem {
  id: number
  customerName: string
  customerCode: string
  businessDomain: string
  source: CustomerSource
  status?: CustomerStatus
}

export interface CustomerListResponse {
  total: number
  items: CustomerListItem[]
}

export interface CustomerDetail extends CustomerListItem {
  company?: {
    companyId: string
    companyName: string
    companyCode: string
  } | null
  groups?: number[]
}

export interface CustomerCreatePayload {
  customer: {
    name: string
    code: string
    businessDomain: string
    source?: CustomerSource
    status?: CustomerStatus
    sourceRefId?: string | null
    bondedLicenseNo?: string | null
    customsCode?: string | null
  }
  company: {
    name: string
    code: string
    source?: CustomerSource
    sourceRefId?: string | null
  }
}

export interface CustomerQuery {
  keyword?: string | null
  businessDomain?: string | null
  status?: CustomerStatus | null
  source?: CustomerSource | null
  limit?: number
  offset?: number
}

export interface CustomerGroup {
  id: number
  name: string
  description?: string | null
  memberIds?: number[]
}

export interface CustomerQuote {
  customerId: number
  template: string
  status: string
  updatedAt: string
}

export interface CustomerGroup {
  id: number
  name: string
  businessDomain: string
  description?: string | null
}

export interface CustomerGroupWithMembers extends CustomerGroup {
  memberIds?: number[]
}

export interface CustomerGroupListResponse {
  items: CustomerGroupWithMembers[]
}

export interface CustomerGroupCreatePayload {
  name: string
  businessDomain: string
  description?: string | null
  memberIds?: number[]
}
