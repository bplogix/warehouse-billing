export enum TemplateType {
  GLOBAL = 'GLOBAL', // 通用模板
  GROUP = 'GROUP', // 客户分组模板
  CUSTOMER = 'CUSTOMER', // 客户专属模板
}

export enum ChargeCategory {
  STORAGE = 'STORAGE',
  INBOUND_OUTBOUND = 'INBOUND_OUTBOUND',
  TRANSPORT = 'TRANSPORT',
  RETURN = 'RETURN',
  MATERIAL = 'MATERIAL',
  MANUAL = 'MANUAL',
}
export const ChargeCategoryDisplay: Record<ChargeCategory, string> = {
  [ChargeCategory.STORAGE]: '仓储类',
  [ChargeCategory.INBOUND_OUTBOUND]: '进出库类',
  [ChargeCategory.TRANSPORT]: '运输类',
  [ChargeCategory.RETURN]: '返品类',
  [ChargeCategory.MATERIAL]: '包材类',
  [ChargeCategory.MANUAL]: '人工录入',
}

export enum ChargeChannel {
  AUTO = 'AUTO',
  SCAN = 'SCAN',
  MANUAL = 'MANUAL',
}
export const ChargeChannelDisplay: Record<ChargeChannel, string> = {
  [ChargeChannel.AUTO]: '自动生成',
  [ChargeChannel.SCAN]: '扫描计入',
  [ChargeChannel.MANUAL]: '人工录入',
}

export enum ChargeUnit {
  PIECE = 'PIECE',
  PALLET = 'PALLET',
  ORDER = 'ORDER',
  CBM_DAY = 'CBM_DAY',
  CBM_MONTH = 'CBM_MONTH',
  KG_DAY = 'KG_DAY',
  KG_MONTH = 'KG_MONTH',
}

export const ChargeUnitDisplay: Record<ChargeUnit, string> = {
  [ChargeUnit.PIECE]: '件',
  [ChargeUnit.PALLET]: '托',
  [ChargeUnit.ORDER]: '单',
  [ChargeUnit.CBM_DAY]: '立方·天',
  [ChargeUnit.CBM_MONTH]: '立方·月',
  [ChargeUnit.KG_DAY]: '公斤·天',
  [ChargeUnit.KG_MONTH]: '公斤·月',
}

export enum PricingMode {
  FLAT = 'FLAT',
  TIERED = 'TIERED',
}

export type RuleTier = {
  minValue: number
  maxValue: number | null
  price: number
  description?: string
}

export type TemplateRule = {
  chargeCode: string
  chargeName: string
  category: ChargeCategory
  channel: ChargeChannel
  unit: ChargeUnit
  pricingMode: PricingMode
  price?: number | null
  tiers?: RuleTier[]
  description?: string
  supportOnly?: boolean
}

export type Template = {
  id: number
  templateType: TemplateType
  templateCode: string
  templateName: string
  description: string
  effectiveDate: string
  expireDate: string | null
  version: number
  rules: TemplateRule[]
  businessDomain?: string
  createdAt?: string
  updatedAt?: string

  // 客户关联字段
  customerGroupIds?: number[] // 适用的客户分组ID列表
  customerId?: number // 专属客户ID
}

export type TemplateListQuery = {
  templateType: TemplateType
  keyword?: string
  customerId?: number
  customerGroupId?: number
  limit?: number
  offset?: number
}

export type TemplateListResponse = {
  items: Template[]
  total: number
}

export type TemplateCreatePayload = {
  templateCode: string
  templateName: string
  templateType: TemplateType
  description?: string | null
  effectiveDate: string
  expireDate?: string | null
  customerId?: number | null
  customerGroupIds?: number[] | null
  rules: TemplateRule[]
}

export type TemplateUpdatePayload = {
  templateName: string
  description?: string | null
  effectiveDate: string
  expireDate?: string | null
  version: number
  customerId?: number | null
  customerGroupIds?: number[] | null
  rules: TemplateRule[]
}
