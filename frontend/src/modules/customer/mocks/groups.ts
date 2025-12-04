import type { CustomerGroupInput } from '@/modules/customer/schemas/customer'

export const mockCustomerGroups: CustomerGroupInput[] = [
  { name: '重点客户', description: '大客户，重点跟进 SLA' },
  { name: '跨境物流', description: '跨境仓+跨境运输一体客户' },
  { name: '待开发', description: 'CRM 新导入客户，待激活' },
  { name: '华东区域', description: '江浙沪核心仓配客户群' },
  { name: '精细运营', description: '需要精细成本核算的高频客户' },
]
