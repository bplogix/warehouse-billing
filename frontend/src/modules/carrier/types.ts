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
  status: CarrierServiceStatus
  description?: string | null
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
  status?: CarrierServiceStatus
  description?: string | null
  attributes?: Record<string, unknown> | null
}

export type CarrierServiceUpdatePayload = {
  serviceName: string
  status: CarrierServiceStatus
  description?: string | null
  attributes?: Record<string, unknown> | null
}

export type CarrierServiceGeoGroupStatus =
  | 'ACTIVE'
  | 'INACTIVE'
  | 'SCHEDULED'

export type GeoGroupRegion = {
  id: number
  regionCode: string
  regionLevel?: string | null
  priority?: number | null
}

export type GeoGroup = {
  id: number
  carrierServiceId: number
  groupCode: string
  groupName: string
  status: CarrierServiceGeoGroupStatus
  description?: string | null
  regions?: GeoGroupRegion[]
}

export type GeoGroupListResponse = {
  total: number
  items: GeoGroup[]
}

export type GeoGroupQuery = {
  keyword?: string | null
  status?: CarrierServiceGeoGroupStatus | null
  limit?: number
  offset?: number
}

export type GeoGroupCreatePayload = {
  groupCode: string
  groupName: string
  status?: CarrierServiceGeoGroupStatus
  description?: string | null
  attributes?: Record<string, unknown> | null
}

export type GeoGroupUpdatePayload = {
  groupName?: string
  status?: CarrierServiceGeoGroupStatus
  description?: string | null
  attributes?: Record<string, unknown> | null
}

export type GeoGroupRegionUpdatePayload = {
  regionCodes: string[]
}

export type Region = {
  id: number
  regionCode: string
  name: string
  countryCode: string
  level: string
  parentCode?: string | null
}

export type RegionListResponse = {
  total: number
  items: Region[]
}

export type RegionQuery = {
  countryCode?: string
  level?: string
  parentCode?: string | null
  keyword?: string | null
  limit?: number
  offset?: number
}

export type TariffRowPayload = {
  weightMaxKg?: number | null
  volumeMaxCm3?: number | null
  girthMaxCm?: number | null
  priceAmount: number
}

export type TariffCreatePayload = {
  geoGroupId: number
  effectiveFrom?: string | null
  effectiveTo?: string | null
  rows: TariffRowPayload[]
}

export type CarrierServiceTariffGroup = {
  geoGroupId: number
  currency: string
  rows: TariffRowPayload[]
}

export type CarrierServiceTariffGroupListResponse = {
  items: CarrierServiceTariffGroup[]
}
