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
  description: string
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

  // 客户关联字段
  customerGroupIds?: number[] // 适用的客户分组ID列表
  customerId?: number // 专属客户ID
}

// 创建模板请求
export type CreateTemplateRequest = {
  customerId: number
  templateName: string
  description: string
  effectiveDate: Date
  expireDate: Date | null
  rules: TemplateRule[]
}

// 示例数据
//     {
//       "id": 7,
//       "templateName": "通用模板-V1版本",
//       "templateCode": "COMMON-V1",
//       "description": "默认所有客户在没有专属模板的情况下使用的计费规则",
//       "effectiveDate": "2025-09-30",
//       "expireDate": "2025-10-29",
//       "version": 1,
//       "rules": [
//         {
//           "ruleCode": "STORAGE_FEE",
//           "ruleName": "仓储费",
//           "ruleType": "storage_fee",
//           "chargeUnit": "volume_per_day",
//           "price": null,
//           "tiers": [
//             {
//               "minValue": 1,
//               "maxValue": 90,
//               "price": 0,
//               "description": "1-90天免仓储期"
//             },
//             {
//               "minValue": 91,
//               "maxValue": 180,
//               "price": 20000,
//               "description": "91-180天,每立方米/天200元"
//             },
//             {
//               "minValue": 181,
//               "maxValue": null,
//               "price": 40000,
//               "description": "超过180天,每立方米/天400元"
//             }
//           ]
//         },
//         {
//           "ruleCode": "INBOUND_FEE",
//           "ruleName": "入库费",
//           "ruleType": "fixed_fee",
//           "chargeUnit": "once",
//           "price": 20000,
//           "tiers": []
//         },
//         {
//           "ruleCode": "TRANSPORT_FEE",
//           "ruleName": "运输费",
//           "ruleType": "transport_fee",
//           "chargeUnit": "weight",
//           "price": null,
//           "tiers": [
//             {
//               "minValue": 0,
//               "maxValue": 100,
//               "price": 1000,
//               "description": "0-100kg,每kg 10元"
//             },
//             {
//               "minValue": 100,
//               "maxValue": 500,
//               "price": 800,
//               "description": "100-500kg,每kg 8元"
//             },
//             {
//               "minValue": 500,
//               "maxValue": null,
//               "price": 600,
//               "description": "500kg以上,每kg 6元"
//             }
//           ]
//         }
//       ]
//     }
