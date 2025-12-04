import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'

import { OperationType, SourceType } from '@/constants/common'
import type { OperationLog } from '@/schemas/warehouse'

const operationTypeDisplay: Record<OperationType, string> = {
  [OperationType.INBOUND]: '入库',
  [OperationType.OUTBOUND]: '出库',
}

const sourceTypeDisplay: Record<SourceType, string> = {
  [SourceType.MANUAL]: '手动录入',
  [SourceType.RB]: 'RB-WMS',
}

type WarehouseStore = {
  logs: OperationLog[]
  addLog: (payload: Omit<OperationLog, 'operationId' | 'operationTypeDisplay' | 'sourceTypeDisplay' | 'createdAt' | 'updatedAt'>) => void
  deleteLog: (operationId: number) => void
}

export const useWarehouseStore = create<WarehouseStore>()(
  persist(
    (set) => ({
      logs: [],
      addLog: (payload) =>
        set((state) => {
          const now = new Date().toISOString()
          const next: OperationLog = {
            ...payload,
            operationId: Date.now(),
            operationTypeDisplay: operationTypeDisplay[payload.operationType],
            sourceTypeDisplay: sourceTypeDisplay[payload.sourceType as SourceType] ?? '手动录入',
            createdAt: now,
            updatedAt: now,
          }
          return { logs: [next, ...state.logs] }
        }),
      deleteLog: (operationId) =>
        set((state) => ({
          logs: state.logs.filter((log) => log.operationId !== operationId),
        })),
    }),
    {
      name: 'warehouse-logs',
      storage: createJSONStorage(() => localStorage),
    },
  ),
)
