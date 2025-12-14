export type CarrierStatus = 'ACTIVE' | 'INACTIVE'

export type CarrierServiceStatus = 'ACTIVE' | 'INACTIVE' | 'SUSPENDED'

export type Carrier = {
  id: number
  carrierCode: string
  carrierName: string
  countryCode: string
  status: CarrierStatus
  description?: string | null
  contactEmail?: string | null
  contactPhone?: string | null
  website?: string | null
  attributes?: Record<string, unknown> | null
}

export type CarrierListResponse = {
  total: number
  items: Carrier[]
}

export type CarrierQuery = {
  keyword?: string | null
  status?: CarrierStatus | null
  limit?: number
  offset?: number
}

export type CarrierCreatePayload = {
  carrierCode: string
  carrierName: string
  countryCode?: string
  status?: CarrierStatus
  contactEmail?: string | null
  contactPhone?: string | null
  website?: string | null
  description?: string | null
  attributes?: Record<string, unknown> | null
}

export type CarrierUpdatePayload = {
  carrierName: string
  countryCode: string
  status: CarrierStatus
  contactEmail?: string | null
  contactPhone?: string | null
  website?: string | null
  description?: string | null
  attributes?: Record<string, unknown> | null
}

export type CarrierService = {
  id: number
  carrierId: number
  serviceCode: string
  serviceName: string
  serviceType: string
  status: CarrierServiceStatus
  coverageGroupCode?: string | null
  description?: string | null
  effectiveDate?: string | null
  expireDate?: string | null
  attributes?: Record<string, unknown> | null
}

export type CarrierServiceListResponse = {
  total: number
  items: CarrierService[]
}

export type CarrierServiceQuery = {
  status?: CarrierServiceStatus | null
  limit?: number
  offset?: number
}

export type CarrierServiceCreatePayload = {
  serviceCode: string
  serviceName: string
  serviceType: string
  status?: CarrierServiceStatus
  coverageGroupCode?: string | null
  description?: string | null
  effectiveDate?: string | null
  expireDate?: string | null
  attributes?: Record<string, unknown> | null
}

export type CarrierServiceUpdatePayload = {
  serviceName: string
  serviceType: string
  status: CarrierServiceStatus
  coverageGroupCode?: string | null
  description?: string | null
  effectiveDate?: string | null
  expireDate?: string | null
  attributes?: Record<string, unknown> | null
}
