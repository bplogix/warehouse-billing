import { OperationType, SourceType } from '@/constants/common'

// ==================== 请求参数类型 ====================

/**
 * 获取进出库日志列表请求参数
 */
export interface GetOperationLogsParams {
  operationType?: OperationType // 操作类型筛选
  customerId?: number
  searchValue?: string
  startDate?: string
  endDate?: string
}

/**
 * 进出库操作日志 - 统一数据结构
 */
export interface OperationLog {
  operationType: OperationType // operationType
  operationTypeDisplay: string
  operationId: number // operationId
  customerId: number // customerId
  customerName: string // customerName
  batchCode: string // batchCode
  quantity: number // quantity
  skuType: string // skuType
  skuTypeDisplay: string
  inboundId: number | null // inboundId
  sourceType: string // sourceType
  sourceTypeDisplay: string
  operationDate: string // ISO 8601 format // operationDate
  operationUid: string // operationUid
  operationName: string // operationName
  totalVolume: string
  totalWeight: string
  createdAt?: string
  updatedAt?: string
}

/**
 * 创建入库日志请求参数
 */
export interface CreateInboundRequest {
  customerId: number
  skuType: string
  skuTotalQuantity: number
  // 入库专有字段
  totalVolume: string
  totalWeight: string
  batchCode: string // 入库时是输入框
  sourceType: SourceType
  operationType: OperationType
}

/**
 * 获取在库日志列表请求参数
 */
export interface GetInventoryLogsParams {
  customerId?: number
  startDate?: string
  endDate?: string
}

/**
 * 在库记录
 */
export interface InventoryLog {
  id: number
  customerId: number
  remainingSkuTotalQuantity: number
  storageDays: number
  recordDate: string // ISO 8601 format
  operationUid: string
  operationName: string
  operationTime: string // ISO 8601 format
  createdAt: string
  updatedAt: string
}
